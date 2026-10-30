"""Browser checks for the built site (Python Playwright, headless Chromium).

Follows the reconnaissance-then-action pattern of Anthropic's webapp-testing
skill. Runs against a local static server by default, or against any deployed
copy with SITE_URL:

    npm run build && npm run serve &            # local, http://localhost:4173/
    python tests/e2e/run_e2e.py
    SITE_URL=https://<host>/<path> python tests/e2e/run_e2e.py   # production

Exits non-zero when any check fails. Screenshots go to tests/e2e/screenshots/
(git-ignored).
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

from playwright.sync_api import Page, sync_playwright

ROOT = Path(__file__).resolve().parents[2]
SHOTS = ROOT / "tests" / "e2e" / "screenshots"
SITE = os.environ.get("SITE_URL", "http://localhost:4173").rstrip("/")
# The origin the metadata names. Equal to SITE in production; in CI the build
# names the production URL while pages are served from a local server.
META = os.environ.get("CANONICAL_BASE", SITE).rstrip("/")
AXE = (ROOT / "node_modules" / "axe-core" / "axe.min.js").read_text(encoding="utf-8")
VIEWPORTS = {
    "narrow": (320, 640),
    "small": (360, 800),
    "phone": (390, 844),
    "tablet": (768, 1024),
    "laptop": (1280, 800),
    "desktop": (1440, 900),
    "wide": (1920, 1080),
}
RESULTS: list[tuple[str, bool, str]] = []

# What `impact --since main --mode <mode>` printed after each file changed
# (docs/evidence/capture-playground-2026-10-29). The playground must say the same.
PLAYGROUND = {
    ("invoice", "lite"): ("pass", 0, []),
    ("invoice", "standard"): ("warning", 0, ["billing.md"]),
    ("invoice", "strict"): ("fail", 1, ["billing.md"]),
    ("shipping", "lite"): ("pass", 0, []),
    ("shipping", "standard"): ("warning", 0, ["billing.md", "shipping.md"]),
    ("shipping", "strict"): ("fail", 1, ["billing.md", "shipping.md"]),
    ("format", "lite"): ("pass", 0, []),
    ("format", "standard"): ("pass", 0, []),
    ("format", "strict"): ("pass", 0, []),
}
UI = {
    "ko": {"apply": "변경 적용", "undo": "변경 되돌리기", "none": "없음", "flagged": "다시 볼 문서", "replay": "다시 보기", "next": "다음 단계", "undone": "되돌렸습니다"},
    "en": {"apply": "Apply the change", "undo": "Undo the change", "none": "None", "flagged": "Look again", "replay": "Replay", "next": "Next step", "undone": "was undone"},
}
# The drift timeline: where "now" passes each commit, as a share of the scroll
# through it (src/components/scenes/Drift.tsx). The third commit is the cited one.
COMMIT_P = [0.217, 0.435, 0.641, 0.848]


def check(name: str, ok: bool, detail: str = "") -> None:
    RESULTS.append((name, ok, detail))
    print(f"{'PASS' if ok else 'FAIL'}  {name}{('  -- ' + detail) if detail else ''}")


def http_status(url: str) -> int:
    # npmjs.com answers scripted requests with 403; ask the registry instead.
    if url.startswith("https://www.npmjs.com/package/"):
        url = "https://registry.npmjs.org/" + url.split("/package/", 1)[1]
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "e2e"}), timeout=20) as r:
            return r.status
    except urllib.error.HTTPError as e:
        return e.code


def run_axe(page: Page) -> list[dict]:
    page.add_script_tag(content=AXE)
    result = page.evaluate(
        """async () => {
            const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice'] } });
            return r.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, target: v.nodes[0]?.target?.join(' ') }));
        }"""
    )
    return result


def open_page(browser, lang: str, w: int = 1440, h: int = 900, **kw) -> Page:
    ctx = browser.new_context(viewport={"width": w, "height": h}, **kw)
    page = ctx.new_page()
    page.goto(f"{SITE}/{lang}/")
    page.wait_for_load_state("networkidle")
    return page


def go(page: Page, y: float, wait: int = 450) -> None:
    page.evaluate(f"window.scrollTo({{top: {y}, behavior: 'instant'}})")
    page.wait_for_timeout(wait)


def outcome(page: Page) -> dict:
    """What the playground reports: the CI state, the spoken summary, the visible exit code and the CLI output."""
    return page.evaluate(
        """() => {
            const pg = document.getElementById('playground');
            const box = pg.querySelector('[data-ci]');
            const pre = pg.querySelector('details pre');
            return { ci: box.dataset.ci, summary: pg.querySelector('[aria-live="polite"]').textContent,
                     text: box.textContent, terminal: pre ? pre.textContent : '' };
        }"""
    )


def page_checks(browser, lang: str) -> None:
    url = f"{SITE}/{lang}/"
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()
    errors: list[str] = []
    bad: list[str] = []
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("response", lambda r: bad.append(f"{r.status} {r.url}") if r.status >= 400 else None)
    resp = page.goto(url)
    page.wait_for_load_state("networkidle")
    check(f"[{lang}] HTTP 200", resp is not None and resp.status == 200, str(resp.status if resp else None))
    check(f"[{lang}] <html lang>", page.get_attribute("html", "lang") == lang)
    check(f"[{lang}] one h1", page.locator("h1").count() == 1)
    canonical = page.get_attribute('link[rel="canonical"]', "href")
    check(f"[{lang}] canonical", canonical == f"{META}/{lang}/", str(canonical))
    alts = {
        page.locator('link[rel="alternate"][hreflang]').nth(i).get_attribute("hreflang"): page.locator('link[rel="alternate"][hreflang]').nth(i).get_attribute("href")
        for i in range(page.locator('link[rel="alternate"][hreflang]').count())
    }
    check(f"[{lang}] hreflang ko/en/x-default", alts.get("ko") == f"{META}/ko/" and alts.get("en") == f"{META}/en/" and "x-default" in alts, json.dumps(alts))
    og_url = page.get_attribute('meta[property="og:url"]', "content")
    og_img = page.get_attribute('meta[property="og:image"]', "content")
    check(f"[{lang}] og:url", og_url == f"{META}/{lang}/", str(og_url))
    check(f"[{lang}] og:image reachable", bool(og_img) and og_img.startswith(META) and http_status(og_img.replace(META, SITE, 1)) == 200, str(og_img))
    check(f"[{lang}] twitter card", page.get_attribute('meta[name="twitter:card"]', "content") == "summary_large_image")
    check(f"[{lang}] main content in HTML", "LLM-WIKI Governance" in (page.text_content("main") or ""))

    # Every link on the page answers (external links included).
    hrefs = sorted(set(page.eval_on_selector_all("a[href]", "els => els.map(e => e.href)")))
    broken = []
    for h in hrefs:
        if "#" in h and h.split("#")[0].rstrip("/") == url.rstrip("/"):
            target = h.split("#")[1]
            if target and page.locator(f"#{target}").count() == 0:
                broken.append(f"missing #{target}")
            continue
        code = http_status(h)
        if code >= 400:
            broken.append(f"{code} {h}")
    check(f"[{lang}] links resolve ({len(hrefs)})", not broken, "; ".join(broken))

    violations = run_axe(page)
    check(f"[{lang}] axe (WCAG 2.2 A/AA + best practice)", not violations, json.dumps(violations, ensure_ascii=False))

    # The playground says what the real CLI said, for every file and mode.
    ui = UI[lang]
    page.locator("#playground").scroll_into_view_if_needed()
    wrong = []
    for file in ["invoice", "shipping", "format"]:
        page.locator(f"#playground input[value={file}]").check()  # choosing a file starts from an unapplied state
        page.get_by_role("button", name=ui["apply"]).click()
        for mode in ["lite", "standard", "strict"]:
            page.locator(f"#playground input[value={mode}]").check()
            result, code, docs = PLAYGROUND[(file, mode)]
            o = outcome(page)
            named = [d for d in ["billing.md", "shipping.md"] if d in o["summary"]]
            ok = (
                named == docs
                and (docs or ui["none"] in o["summary"])
                and f"exit {code}" in o["text"]
                and f"- result: {result}" in o["terminal"]
                and f"(exit {code})" in o["terminal"]
            )
            if not ok:
                wrong.append(f"{file}/{mode}: {o['summary']!r} {o['ci']}")
    check(f"[{lang}] playground matches the captured CLI output (9 cases)", not wrong, " | ".join(wrong))
    page.locator("#playground details summary").click()
    page.wait_for_timeout(500)
    page.locator("#playground").screenshot(path=str(SHOTS / f"{lang}-playground-format-strict.png"))
    v2 = run_axe(page)
    check(f"[{lang}] axe on the playground with output open", not v2, json.dumps(v2, ensure_ascii=False))
    check(f"[{lang}] no console errors", not errors, " | ".join(errors[:5]))
    check(f"[{lang}] no failed requests", not bad, " | ".join(bad[:5]))
    ctx.close()


def playground_checks(browser, lang: str) -> None:
    ui = UI[lang]
    page = open_page(browser, lang)
    page.locator("#playground").scroll_into_view_if_needed()
    o = outcome(page)
    check(f"[{lang}] playground opens on nothing applied", o["ci"] == "idle" and not o["terminal"], o["ci"])
    # Picking another file after applying a change says the change was undone.
    page.get_by_role("button", name=ui["apply"]).click()
    page.locator("#playground input[value=format]").check()
    notice = page.locator("#playground [role=status]").inner_text()
    reset = (outcome(page)["ci"], page.get_by_role("button", name=ui["apply"]).count())
    check(f"[{lang}] switching files resets and says so", ui["undone"] in notice and reset == ("idle", 1), f"{notice!r} {reset}")
    # A file no doc cites: nothing to review, and the next step says the review below is an example.
    page.get_by_role("button", name=ui["apply"]).click()
    nxt = page.evaluate("[...document.querySelectorAll('#playground [data-ci] dd')].at(-1).textContent")
    check(f"[{lang}] uncited change: no docs, review offered as an example", outcome(page)["ci"] == "pass" and "billing.md" in nxt, nxt)
    # Undo returns to the start.
    page.get_by_role("button", name=ui["undo"]).click()
    check(f"[{lang}] undo returns to nothing applied", outcome(page)["ci"] == "idle")
    # A burst of input lands on the state the controls show, never between two.
    for s in ["apply", "strict", "shipping", "apply", "lite", "apply", "apply", "standard", "format", "invoice", "shipping", "apply", "strict", "standard"]:
        if s == "apply":
            page.locator("#playground button[aria-pressed]").click()
        else:
            page.locator(f"#playground input[value={s}]").check()
        page.wait_for_timeout(25)
    page.wait_for_timeout(1300)
    o = outcome(page)
    pressed = page.get_attribute("#playground button[aria-pressed]", "aria-pressed")
    check(f"[{lang}] a burst of 14 inputs settles on shipping, applied, standard", pressed == "true" and o["ci"] == "warn" and "shipping.md" in o["summary"] and "- result: warning" in o["terminal"], f"{pressed} {o['ci']} {o['summary']!r}")
    # The CLI output opens in place: no scroll box inside the page.
    page.locator("#playground details summary").click()
    page.wait_for_timeout(300)
    pre = page.evaluate("(() => { const p = document.querySelector('#playground details pre'); const s = getComputedStyle(p); return [s.overflowX, s.overflowY, p.scrollHeight - p.clientHeight, p.scrollWidth - p.clientWidth]; })()")
    check(f"[{lang}] CLI output has no scroll box of its own", pre[0] == "visible" and pre[1] == "visible" and pre[2] <= 1 and pre[3] <= 1, str(pre))
    page.context.close()


def hero_checks(browser, lang: str) -> None:
    ui = UI[lang]
    page = open_page(browser, lang)
    page.wait_for_timeout(2800)
    shown = page.evaluate("[document.querySelector('#top [data-phase]').dataset.phase, document.querySelector('#top figure').textContent]")
    check(f"[{lang}] hero plays once: code changes, the doc is flagged", shown[0] == "2" and ui["flagged"] in shown[1], shown[0])
    page.get_by_role("button", name=ui["replay"]).click()
    page.wait_for_timeout(150)
    again = page.evaluate("document.querySelector('#top [data-phase]').dataset.phase")
    page.wait_for_timeout(2600)
    end = page.evaluate("document.querySelector('#top [data-phase]').dataset.phase")
    check(f"[{lang}] Replay starts over and ends flagged again", again == "0" and end == "2", f"{again} -> {end}")
    page.screenshot(path=str(SHOTS / f"{lang}-hero.png"))
    # The wordmark goes back to the opening as it first appeared, from anywhere.
    page.evaluate("window.scrollTo({top: document.body.scrollHeight, behavior: 'instant'})")
    page.wait_for_timeout(300)
    page.locator("header a[aria-label]").first.click()
    page.wait_for_timeout(600)
    back = page.evaluate("""() => {
        const r = (s) => document.querySelector(s).getBoundingClientRect();
        return { y: Math.round(scrollY), hash: location.hash, h1: Math.round(r('#top h1').top),
                 cta: Math.round(r('#top a[href="#playground"]').bottom), vh: innerHeight };
    }""")
    check(f"[{lang}] the wordmark returns to the top with the headline and actions in view", back["y"] == 0 and back["hash"] == "#top" and 0 < back["h1"] and back["cta"] < back["vh"], json.dumps(back))
    page.context.close()


def anchor_checks(browser) -> None:
    # Every menu link lands its section below the sticky header, on phones and desktops.
    for w, h in [(1440, 900), (390, 844)]:
        page = open_page(browser, "ko", w, h, is_mobile=w < 500, has_touch=w < 500)
        page.wait_for_timeout(400)
        off = []
        for href in page.eval_on_selector_all("header nav a[href^='#']", "els => els.map(e => e.getAttribute('href'))"):
            page.locator(f"header nav a[href='{href}']").click()
            page.wait_for_timeout(350)
            top, header = page.evaluate(f"[Math.round(document.querySelector('{href}').getBoundingClientRect().top), Math.round(document.querySelector('header').getBoundingClientRect().bottom)]")
            if not (header - 2 <= top <= header + 8):
                off.append(f"{href}: section at {top}px, header ends at {header}px")
        check(f"menu links land below the sticky header at {w}px", not off, "; ".join(off))
        page.context.close()


def keyboard_checks(browser, lang: str) -> None:
    ui = UI[lang]
    page = open_page(browser, lang, 1280, 800)
    page.keyboard.press("Tab")
    first = page.evaluate("document.activeElement.className")
    check(f"[{lang}] first Tab reaches skip link", "skip-link" in first, first)
    outline = page.evaluate("getComputedStyle(document.activeElement).outlineStyle")
    check(f"[{lang}] focus outline visible", outline not in ("none", ""), outline)
    # The playground from the keyboard alone: arrows pick a file and a mode, Space applies.
    page.locator("#playground input[value=invoice]").focus()
    page.keyboard.press("ArrowDown")
    picked = page.evaluate("document.querySelector('#playground input[value=shipping]').checked")
    check(f"[{lang}] arrow keys pick a file", picked)
    page.keyboard.press("Tab")
    page.keyboard.press("ArrowRight")
    page.keyboard.press("Tab")
    focused = page.evaluate("document.activeElement.getAttribute('aria-pressed')")
    page.keyboard.press("Space")
    o = outcome(page)
    check(f"[{lang}] keyboard: file, mode, then apply, in that order", focused == "false" and o["ci"] == "fail" and "shipping.md" in o["summary"], f"{focused} {o['ci']} {o['summary']!r}")
    # The review steps: a rail of buttons and a pager.
    page.locator("#review ol button").nth(2).focus()
    page.keyboard.press("Enter")
    cur = page.evaluate("[...document.querySelectorAll('#review ol button')].findIndex(b => b.getAttribute('aria-current') === 'step')")
    page.get_by_role("button", name=ui["next"]).focus()
    page.keyboard.press("Enter")
    cur2 = page.evaluate("[...document.querySelectorAll('#review ol button')].findIndex(b => b.getAttribute('aria-current') === 'step')")
    check(f"[{lang}] review steps from the keyboard (rail, then pager)", (cur, cur2) == (2, 3), f"{cur} {cur2}")
    page.locator("#review details summary").focus()
    page.keyboard.press("Enter")
    opened = page.evaluate("document.querySelector('#review details').open")
    check(f"[{lang}] Enter opens a step's commands", opened)
    page.context.close()


def review_checks(browser, lang: str) -> None:
    page = open_page(browser, lang)
    page.locator("#review").scroll_into_view_if_needed()
    rail = page.locator("#review ol button")
    desk = "document.querySelector('#review [data-doc]').textContent"
    states = []
    for i in [3, 1, 0]:
        rail.nth(i).click()
        page.wait_for_timeout(250)
        states.append(page.evaluate(desk))
    check(
        f"[{lang}] review: approve shows verified 2026-10-29; downgrade shows needs_review; reading changes nothing yet",
        "verified" in states[0] and "2026-10-29" in states[0] and "needs_review" in states[1] and "verified" in states[2] and "2026-10-29" not in states[2],
        " | ".join(s[:60] for s in states),
    )
    disabled = page.evaluate("[...document.querySelectorAll('#review .btn')].map(b => b.disabled)")
    check(f"[{lang}] review: no previous step on the first", disabled == [True, False], str(disabled))
    page.context.close()


def drift_checks(browser) -> None:
    # Wide screens with motion: scrolling moves "now" along the timeline, forwards and back.
    page = open_page(browser, "ko")
    mode = page.evaluate("document.getElementById('drift').dataset.mode")
    # The scroll range is the tall track around the sticky timeline (ScrollTrigger "top top" to "bottom bottom").
    rng = page.evaluate("(() => { const t = document.getElementById('drift').firstElementChild; return [t.getBoundingClientRect().top + scrollY, t.offsetHeight - innerHeight]; })()")

    def state() -> tuple[int, bool, bool]:
        return page.evaluate("(() => { const s = document.getElementById('drift'); return [s.querySelectorAll('[data-commit][data-on]').length, s.hasAttribute('data-stale'), s.hasAttribute('data-read')]; })()")

    def at(p: float, wait: int = 450) -> tuple[int, bool, bool]:
        go(page, rng[0] + rng[1] * p, wait)
        return tuple(state())

    check("drift: scrubbed on a wide screen with motion", mode == "scrub" and rng[1] > 0, f"{mode} {rng}")
    seq = [at(p) for p in [0.05, 0.5, 0.75, 1.0, 0.5, 0.05]]
    want = [(0, False, False), (2, False, False), (3, True, False), (4, True, True), (2, False, False), (0, False, False)]
    check("drift: forwards and back, each position shows the same state", seq == want, str(seq))
    for p in [0.9, 0.1, 0.7, 0.3, 1.0, 0.0, 0.6]:
        page.evaluate(f"window.scrollTo({{top: {rng[0] + rng[1] * p}, behavior: 'instant'}})")
        page.wait_for_timeout(30)
    check("drift: after rapid scrolling, it matches where it stopped", at(0.75, 600) == (3, True, False), str(state()))
    page.screenshot(path=str(SHOTS / "desktop-drift.png"))
    # Crossing the breakpoint switches to the static log and back.
    page.set_viewport_size({"width": 800, "height": 900})
    page.wait_for_timeout(600)
    narrow = (page.evaluate("document.getElementById('drift').dataset.mode"), tuple(state()))
    page.set_viewport_size({"width": 1440, "height": 900})
    page.wait_for_timeout(600)
    wide = page.evaluate("document.getElementById('drift').dataset.mode")
    check("resize: drift switches to the static log and back", narrow == ("static", (4, True, True)) and wide == "scrub", f"{narrow} {wide}")
    page.context.close()


def reduced_motion_checks(browser) -> None:
    page = open_page(browser, "ko", reduced_motion="reduce")
    page.wait_for_timeout(300)
    hero = page.evaluate("document.querySelector('#top [data-phase]').dataset.phase")
    check("reduced motion: the opening shows its end state at once", hero == "2", hero)
    drift = page.evaluate("(() => { const s = document.getElementById('drift'); return [s.dataset.mode, s.querySelectorAll('[data-commit][data-on]').length, s.hasAttribute('data-read'), Math.round(s.offsetHeight / innerHeight * 10) / 10]; })()")
    check("reduced motion: the timeline is a complete static figure, not a long scroll", drift[0] == "static" and drift[1] == 4 and drift[2] and drift[3] < 1.6, str(drift))
    page.locator("#playground").scroll_into_view_if_needed()
    page.get_by_role("button", name=UI["ko"]["apply"]).click()
    dur = page.evaluate("getComputedStyle(document.querySelector('#playground [data-doc]')).transitionDuration")
    check("reduced motion: the playground still works, without transitions", outcome(page)["ci"] == "warn" and all(float(d.rstrip("s")) <= 0.01 for d in dur.split(",")), dur)
    page.screenshot(path=str(SHOTS / "reduced-playground.png"))
    page.context.close()


def layout_checks(browser) -> None:
    # No sideways scrolling anywhere, no scroll boxes inside the page, and commands that wrap.
    probe = """() => {
        document.querySelectorAll('details').forEach(d => d.open = true);
        const boxes = [...document.querySelectorAll('main *')].filter(e => {
            const s = getComputedStyle(e);
            return (/(auto|scroll)/.test(s.overflowY) && e.scrollHeight > e.clientHeight + 1)
                || (/(auto|scroll)/.test(s.overflowX) && e.scrollWidth > e.clientWidth + 1);
        }).map(e => e.tagName + '.' + e.className);
        const cut = [...document.querySelectorAll('main pre, main code')].filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent.slice(0, 40));
        return { overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, boxes, cut };
    }"""
    for name, (w, h) in VIEWPORTS.items():
        for lang in ["ko", "en"]:
            page = open_page(browser, lang, w, h, is_mobile=w < 500, has_touch=w < 500)
            page.wait_for_timeout(300)
            page.screenshot(path=str(SHOTS / f"{lang}-{name}.png"))
            r = page.evaluate(probe)
            check(f"[{lang}] {name} {w}px: no overflow, no inner scroll boxes, no cut-off commands", r["overflow"] <= 0 and not r["boxes"] and not r["cut"], json.dumps(r, ensure_ascii=False)[:300])
            page.context.close()
    for lang in ["ko", "en"]:
        page = open_page(browser, lang, 1440, 900, color_scheme="dark")
        page.screenshot(path=str(SHOTS / f"{lang}-desktop-dark.png"))
        page.context.close()


def phone_checks(browser) -> None:
    for lang in ["ko", "en"]:
        for w in [320, 360]:
            page = open_page(browser, lang, w, 640)
            rows = page.evaluate("""() => {
                const box = (s) => document.querySelector(s).getBoundingClientRect();
                const mark = box('header a[aria-label]'), sw = box('header .lang-switch');
                return {markMid: Math.round(mark.top + mark.height / 2), switchMid: Math.round(sw.top + sw.height / 2), switchRight: Math.round(sw.right), width: innerWidth};
            }""")
            check(f"[{lang}] header first row holds wordmark and switch at {w}px", abs(rows["markMid"] - rows["switchMid"]) < 4 and rows["switchRight"] <= rows["width"], json.dumps(rows))
            page.context.close()
    page = open_page(browser, "ko", 360, 800, is_mobile=True, has_touch=True)
    small = page.evaluate("""() => [...document.querySelectorAll('header a, main button, main summary, #playground label, footer a.btn')]
        .filter(e => e.offsetParent).map(e => [e.textContent.trim().slice(0, 24), Math.round(e.getBoundingClientRect().height)]).filter(([, h]) => h < 44)""")
    check("phone: buttons, menu links, disclosures and choices are at least 44px tall", not small, json.dumps(small, ensure_ascii=False))
    drift = page.evaluate("(() => { const s = document.getElementById('drift'); return [s.dataset.mode, s.querySelectorAll('[data-commit][data-on]').length]; })()")
    check("phone: the timeline is a static log, nothing pinned", drift == ["static", 4], str(drift))
    gap = page.evaluate("(() => { const b = document.querySelector('#playground button[aria-pressed]').getBoundingClientRect(); const o = document.querySelector('#playground [data-ci]').getBoundingClientRect(); return Math.round(o.top - b.bottom); })()")
    check("phone: the result follows the apply button", 0 <= gap < 120, f"{gap}px")
    page.context.close()


def copy_checks(browser, lang: str) -> None:
    ctx = browser.new_context(permissions=["clipboard-read", "clipboard-write"])
    page = ctx.new_page()
    page.goto(f"{SITE}/{lang}/#start")
    page.wait_for_load_state("networkidle")
    btn = page.locator("#start .copy-btn").first
    btn.click()
    clip = page.evaluate("navigator.clipboard.readText()")
    check(f"[{lang}] copy button copies the preview command", clip == "npx llm-wiki-governance@latest quickstart --dry-run", clip)
    check(f"[{lang}] copy button confirms", btn.get_attribute("data-state") == "copied")
    cmds = page.eval_on_selector_all("#start details pre code", "els => els.map(e => e.textContent)")
    check(f"[{lang}] all 8 commands listed", len(cmds) == 8, json.dumps(cmds))
    ctx.close()


def font_checks(browser) -> None:
    # Korean headings use the subset display face; the English page never fetches it.
    for lang in ["ko", "en"]:
        ctx = browser.new_context()
        page = ctx.new_page()
        fetched: list[str] = []
        page.on("request", lambda r: fetched.append(r.url) if "display-ko-bold" in r.url else None)
        page.goto(f"{SITE}/{lang}/")
        page.wait_for_load_state("networkidle")
        page.evaluate("document.fonts.ready")
        loaded = page.evaluate("[...document.fonts].some(f => f.family.includes('LLM-WIKI Display KR') && f.status === 'loaded')")
        if lang == "ko":
            check("[ko] headings load the Korean display face", loaded and len(fetched) == 1, f"loaded={loaded} requests={len(fetched)}")
        else:
            check("[en] Korean display face not requested", not fetched, " ".join(fetched))
        ctx.close()


def routing_checks(browser) -> None:
    ctx = browser.new_context()
    page = ctx.new_page()
    page.goto(f"{SITE}/")
    page.wait_for_url("**/ko/", timeout=10000)
    check("root redirects to /ko/", page.url == f"{SITE}/ko/", page.url)
    # The reader's path: open the page, pick "Try it" in the menu, then switch
    # language. A fresh page, because a hash change fired while the previous
    # redirect's page was still hydrating can be dropped by the router.
    page.close()
    page = ctx.new_page()
    logs: list[str] = []
    page.on("console", lambda m: logs.append(f"{m.type}: {m.text}"))
    page.goto(f"{SITE}/ko/")
    page.wait_for_load_state("networkidle")
    page.locator('header nav a[href="#playground"]').click()
    page.wait_for_url("**/ko/#playground")
    # The link follows the hash once hydrated; wait for that, as a reader would.
    try:
        page.wait_for_function("document.querySelector('header .lang-switch').getAttribute('href').endsWith('/en/#playground')", timeout=10000)
    except Exception:  # report what the page actually holds instead of a bare timeout
        state = page.evaluate("({href: document.querySelector('header .lang-switch').getAttribute('href'), url: location.href})")
        check("language switch follows the hash", False, f"{state} console={logs[:5]}")
    page.locator("header .lang-switch").click()
    page.wait_for_url("**/en/**", timeout=10000)
    page.wait_for_timeout(800)
    check("language switch keeps the section", page.url == f"{SITE}/en/#playground", page.url)
    check("language switch updates <html lang>", page.get_attribute("html", "lang") == "en")
    top, header = page.evaluate("[Math.round(document.getElementById('playground').getBoundingClientRect().top), Math.round(document.querySelector('header').getBoundingClientRect().bottom)]")
    check("a #section link from the other language lands on the section", header - 2 <= top <= header + 8, f"{top}px, header {header}px")
    resp = page.goto(f"{SITE}/does-not-exist/")
    check("unknown path returns 404", resp is not None and resp.status == 404, str(resp.status if resp else None))
    check("404 page has content", "There is no page at this address" in (page.text_content("body") or ""))
    page.screenshot(path=str(SHOTS / "404.png"))
    for path in ["sitemap.xml", "robots.txt", "icon.svg", "og/og-ko.png", "og/og-en.png"]:
        check(f"/{path} served", http_status(f"{SITE}/{path}") == 200)
    sitemap = urllib.request.urlopen(f"{SITE}/sitemap.xml", timeout=20).read().decode("utf-8")
    check("sitemap lists both locales", f"{META}/ko/" in sitemap and f"{META}/en/" in sitemap)
    ctx.close()


def main() -> int:
    SHOTS.mkdir(parents=True, exist_ok=True)
    print(f"Testing {SITE}")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        for lang in ["ko", "en"]:
            page_checks(browser, lang)
            playground_checks(browser, lang)
            hero_checks(browser, lang)
            keyboard_checks(browser, lang)
            review_checks(browser, lang)
            copy_checks(browser, lang)
        anchor_checks(browser)
        drift_checks(browser)
        reduced_motion_checks(browser)
        layout_checks(browser)
        phone_checks(browser)
        font_checks(browser)
        routing_checks(browser)
        browser.close()
    failed = [r for r in RESULTS if not r[1]]
    print(f"\n{len(RESULTS) - len(failed)}/{len(RESULTS)} checks passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
