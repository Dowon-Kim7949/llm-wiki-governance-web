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
VIEWPORTS = {"narrow": (320, 640), "mobile": (360, 780), "tablet": (768, 1024), "desktop": (1440, 900), "wide": (1920, 1080)}
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
COMMIT = {"ko": "변경 커밋하기", "en": "Commit the change"}


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


# A pinned scene's scroll range (src/components/scenes/useSequence.ts: 1.5
# timeline units per beat, 0.6 to hold at the end). Beat i is held from i*1.5.
PIN = """(id) => { const s = document.getElementById(id); const sp = s.closest('.pin-spacer');
  const top = (sp || s).getBoundingClientRect().top + scrollY; return [top, sp ? sp.offsetHeight - innerHeight : 0]; }"""


def beat_y(page: Page, scene: str, beat: int, beats: int = 5) -> int:
    top, dist = page.evaluate(PIN, scene)
    return int(top + dist * (beat * 1.5 + 0.25) / ((beats - 1) * 1.5 + 0.6))


def go(page: Page, y: int, wait: int = 1300) -> None:
    page.evaluate(f"window.scrollTo({{top: {y}, behavior: 'instant'}})")
    page.wait_for_timeout(wait)  # scrub smoothing is 0.6 s


def seen(page: Page, scene: str, el: str) -> float:
    return page.evaluate("([s, e]) => Number(getComputedStyle(document.querySelector(`#${s} [data-el=\"${e}\"]`)).opacity)", [scene, el])


def playground_state(page: Page) -> tuple[str, str]:
    status = page.locator("#playground [role=status]").inner_text()
    terminal = page.locator("#playground figure pre").inner_text() if page.locator("#playground figure pre").count() else ""
    return status, terminal


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
    page.locator("#playground").scroll_into_view_if_needed()
    wrong = []
    for file in ["invoice", "shipping", "format"]:
        page.locator(f"#playground input[value={file}]").check()  # choosing a file starts from an uncommitted state
        page.get_by_role("button", name=COMMIT[lang]).click()
        for mode in ["lite", "standard", "strict"]:
            page.locator(f"#playground input[value={mode}]").check()
            result, code, docs = PLAYGROUND[(file, mode)]
            status, terminal = playground_state(page)
            ok = f"(exit {code})" in status and all(d in status for d in docs) and f"- result: {result}" in terminal and f"(exit {code})" in terminal
            if not ok:
                wrong.append(f"{file}/{mode}: {status!r}")
    check(f"[{lang}] playground matches the captured CLI output (9 cases)", not wrong, " | ".join(wrong))
    page.wait_for_timeout(1600)
    page.locator("#playground").screenshot(path=str(SHOTS / f"{lang}-playground-format-strict.png"))
    v2 = run_axe(page)
    check(f"[{lang}] axe on the playground with output", not v2, json.dumps(v2, ensure_ascii=False))
    check(f"[{lang}] no console errors", not errors, " | ".join(errors[:5]))
    check(f"[{lang}] no failed requests", not bad, " | ".join(bad[:5]))
    ctx.close()


def keyboard_checks(browser, lang: str) -> None:
    ctx = browser.new_context(viewport={"width": 1280, "height": 900})
    page = ctx.new_page()
    page.goto(f"{SITE}/{lang}/")
    page.wait_for_load_state("networkidle")
    page.keyboard.press("Tab")
    first = page.evaluate("document.activeElement.className")
    check(f"[{lang}] first Tab reaches skip link", "skip-link" in first, first)
    outline = page.evaluate("getComputedStyle(document.activeElement, ':focus-visible').outlineStyle || getComputedStyle(document.activeElement).outlineStyle")
    check(f"[{lang}] focus outline visible", outline not in ("none", ""), outline)
    # The playground from the keyboard alone: arrows pick a file, Space commits, arrows pick a mode.
    page.locator("#playground input[value=invoice]").focus()
    page.keyboard.press("ArrowDown")
    picked = page.evaluate("document.querySelector('#playground input[value=shipping]').checked")
    check(f"[{lang}] arrow keys pick a file", picked)
    page.keyboard.press("Tab")
    page.keyboard.press("Space")
    page.keyboard.press("Tab")
    page.keyboard.press("ArrowRight")
    mode = page.evaluate("[...document.querySelectorAll('#playground input')].find(i => i.checked && ['lite','standard','strict'].includes(i.value))?.value")
    status = page.locator("#playground [role=status]").inner_text()
    check(f"[{lang}] keyboard commits a change and switches mode", mode == "standard" and "shipping.md" in status, f"{mode}: {status}")
    live = page.locator('#playground [role="status"][aria-live="polite"]').count()
    check(f"[{lang}] playground result is a polite live region", live == 1)
    # Focus on a caption that is not on screen moves the pinned scene to it.
    page.locator('#review [data-beat="3"] pre').focus()
    page.wait_for_timeout(1300)
    shown = page.evaluate("Number(getComputedStyle(document.querySelector('#review [data-beat=\"3\"]')).opacity)")
    check(f"[{lang}] focus inside a later beat brings that beat on screen", shown > 0.9, f"opacity {shown}")
    ctx.close()


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


def layout_checks(browser) -> None:
    for name, (w, h) in VIEWPORTS.items():
        for scheme in ["light", "dark"]:
            for lang in ["ko", "en"]:
                ctx = browser.new_context(viewport={"width": w, "height": h}, color_scheme=scheme)
                page = ctx.new_page()
                page.goto(f"{SITE}/{lang}/")
                page.wait_for_load_state("networkidle")
                page.wait_for_timeout(400)
                overflow = page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
                if scheme == "light":
                    check(f"[{lang}] no horizontal overflow at {name} {w}px", overflow <= 0, f"{overflow}px")
                page.screenshot(path=str(SHOTS / f"{lang}-{name}-{scheme}.png"))
                ctx.close()


def narrow_checks(browser) -> None:
    # Phones: wordmark and language switch share the first header row.
    for lang in ["ko", "en"]:
        for w in [320, 360]:
            ctx = browser.new_context(viewport={"width": w, "height": 640})
            page = ctx.new_page()
            page.goto(f"{SITE}/{lang}/")
            page.wait_for_load_state("networkidle")
            rows = page.evaluate("""() => {
                const box = (s) => document.querySelector(s).getBoundingClientRect();
                const mark = box('header a[aria-label]'), sw = box('header .lang-switch');
                return {markMid: Math.round(mark.top + mark.height / 2), switchMid: Math.round(sw.top + sw.height / 2), switchRight: Math.round(sw.right), width: innerWidth};
            }""")
            check(f"[{lang}] header first row holds wordmark and switch at {w}px", abs(rows["markMid"] - rows["switchMid"]) < 4 and rows["switchRight"] <= rows["width"], json.dumps(rows))
            ctx.close()


def scroll_checks(browser) -> None:
    # Wide screens with motion: pinned, scrubbed scenes that reverse exactly.
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()
    page.goto(f"{SITE}/ko/")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2200)
    pins = page.evaluate("document.querySelectorAll('.pin-spacer').length")
    modes = page.evaluate("[...document.querySelectorAll('section[data-mode]')].map(s => s.dataset.mode)")
    check("desktop: three pinned, scrubbed scenes", pins == 3 and modes == ["scrub"] * 3, f"{pins} {modes}")
    go(page, beat_y(page, "top", 1, 3))
    check("opening: scroll hint leaves once scrolling starts", page.evaluate("Number(getComputedStyle(document.querySelector('[data-hint]')).opacity)") < 0.05)
    go(page, beat_y(page, "story", 4))
    page.screenshot(path=str(SHOTS / "desktop-story-flag.png"))
    forward = (seen(page, "story", "flag-billing"), seen(page, "story", "verified-billing"))
    check("story: the last beat flags billing.md, still verified", forward[0] > 0.9 and forward[1] > 0.9, str(forward))
    go(page, beat_y(page, "story", 0))
    back = (seen(page, "story", "flag-billing"), seen(page, "story", "needs-billing"))
    check("story: scrolling back undoes it (no flag, needs_review)", back[0] < 0.05 and back[1] > 0.9, str(back))
    # Rapid scrolling, then a stop: the drawing is exactly the beat it stopped on.
    for y in [12000, 300, 8000, 2500, 15000, 5000, 900, 11000, 4200, 7000]:
        page.evaluate(f"window.scrollTo({{top: {y}, behavior: 'instant'}})")
        page.wait_for_timeout(40)
    go(page, beat_y(page, "story", 2), 1800)
    moved = page.evaluate("document.querySelector('#story [data-plate=\"file-invoice\"]').dataset.moved")
    state = (seen(page, "story", "flag-billing"), seen(page, "story", "verified-billing"), moved)
    check("story: after rapid scrolling, beat 3 shows a moved file and no flag", state[0] < 0.05 and state[1] > 0.9 and moved == "on", str(state))
    go(page, beat_y(page, "review", 4))
    lit = page.evaluate("document.getElementById('review').dataset.lit")
    final = (seen(page, "review", "verified-billing"), seen(page, "review", "claim-new"), seen(page, "review", "at-new"))
    check("review: the last beat is re-approved, rewritten and on paper", lit == "true" and min(final) > 0.9, f"{lit} {final}")
    page.screenshot(path=str(SHOTS / "desktop-review-end.png"))
    go(page, beat_y(page, "review", 1))
    down = (seen(page, "review", "needs-billing"), seen(page, "review", "flag-billing"))
    check("review: scrolling back to beat 2 shows needs_review and no flag", down[0] > 0.9 and down[1] < 0.05, str(down))
    # Crossing the breakpoint rebuilds the scenes once, without leftovers.
    page.set_viewport_size({"width": 800, "height": 900})
    page.wait_for_timeout(900)
    narrow = (page.evaluate("document.querySelectorAll('.pin-spacer').length"), page.evaluate("[...document.querySelectorAll('section[data-mode]')].map(s => s.dataset.mode)"))
    page.set_viewport_size({"width": 1440, "height": 900})
    page.wait_for_timeout(900)
    wide = (page.evaluate("document.querySelectorAll('.pin-spacer').length"), page.evaluate("[...document.querySelectorAll('section[data-mode]')].map(s => s.dataset.mode)"))
    check("resize: scenes switch to discrete and back with no duplicate pins", narrow == (0, ["discrete"] * 3) and wide == (3, ["scrub"] * 3), f"{narrow} {wide}")
    ctx.close()


def playground_rapid_checks(browser) -> None:
    # A burst of input lands on the state the controls show, never between two.
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()
    page.goto(f"{SITE}/en/#playground")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1200)
    commit = page.locator("#playground .btn")
    steps = ["commit", "strict", "shipping", "commit", "lite", "commit", "commit", "standard", "format", "invoice", "shipping", "commit", "strict", "standard"]
    for s in steps:
        if s == "commit":
            commit.click()
        else:
            page.locator(f"#playground input[value={s}]").check()
        page.wait_for_timeout(25)
    page.wait_for_timeout(2200)
    status, terminal = playground_state(page)
    flags = (seen(page, "playground", "flag-billing"), seen(page, "playground", "flag-shipping"))
    moved = page.evaluate("[...document.querySelectorAll('#playground [data-plate^=\"file-\"]')].filter(p => p.dataset.moved === 'on').map(p => p.dataset.file)")
    ok = flags[0] > 0.95 and flags[1] > 0.95 and moved == ["shipping"] and "billing.md and shipping.md" in status and "- result: warning" in terminal
    check("playground: a burst of 14 inputs settles on shipping, committed, standard", ok, f"{flags} {moved} {status!r}")
    ctx.close()


def reduced_motion_checks(browser) -> None:
    ctx = browser.new_context(viewport={"width": 1440, "height": 900}, reduced_motion="reduce")
    page = ctx.new_page()
    page.goto(f"{SITE}/ko/")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(300)
    pins = page.evaluate("document.querySelectorAll('.pin-spacer').length")
    modes = page.evaluate("[...document.querySelectorAll('section[data-mode]')].map(s => s.dataset.mode)")
    check("reduced motion: nothing is pinned or scrubbed", pins == 0 and modes == ["discrete"] * 3, f"{pins} {modes}")
    ready = page.evaluate("(() => { const w = document.querySelector('#top [data-svg=under]').parentElement; return [w.dataset.ready, Number(getComputedStyle(w.querySelector('[data-plate=floor]')).opacity)]; })()")
    check("reduced motion: the opening drawing is complete at once (no intro)", ready[0] == "true" and ready[1] > 0.99, str(ready))
    hidden = page.evaluate("[...document.querySelectorAll('#story [data-beat], #review [data-beat]')].filter(b => getComputedStyle(b).opacity !== '1' || b.getBoundingClientRect().height === 0).length")
    check("reduced motion: every story and review caption is visible text", hidden == 0, f"{hidden} hidden")
    cap = page.locator('#story [data-beat="4"]')
    y = cap.evaluate("e => e.getBoundingClientRect().top + scrollY - innerHeight * 0.55")
    page.evaluate(f"window.scrollTo({{top: {y}, behavior: 'instant'}})")
    page.wait_for_timeout(250)
    check("reduced motion: a caption switches the drawing instantly", seen(page, "story", "flag-billing") > 0.99)
    page.screenshot(path=str(SHOTS / "reduced-story-flag.png"))
    page.locator("#playground").scroll_into_view_if_needed()
    page.locator("#playground input[value=invoice]").check()
    page.get_by_role("button", name=COMMIT["ko"]).click()
    page.locator("#playground input[value=strict]").check()
    page.wait_for_timeout(200)
    check("reduced motion: the playground still works, without transitions", seen(page, "playground", "flag-billing") > 0.99)
    ctx.close()


def phone_checks(browser) -> None:
    ctx = browser.new_context(viewport={"width": 360, "height": 780}, is_mobile=True, has_touch=True)
    page = ctx.new_page()
    page.goto(f"{SITE}/ko/")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2400)
    pins = page.evaluate("document.querySelectorAll('.pin-spacer').length")
    ready = page.evaluate("[...document.querySelectorAll('[data-svg=under]')].map(s => s.parentElement.dataset.ready === 'true')")
    check("phone: no pinned scenes; every drawing renders", pins == 0 and all(ready), f"{pins} {ready}")
    cap = page.locator('#story [data-beat="4"]')
    y = cap.evaluate("e => e.getBoundingClientRect().top + scrollY - innerHeight * 0.66")
    page.evaluate(f"window.scrollTo({{top: {y}, behavior: 'instant'}})")
    page.wait_for_timeout(1400)
    page.screenshot(path=str(SHOTS / "phone-story-flag.png"))
    check("phone: reaching the last story caption flags the doc", seen(page, "story", "flag-billing") > 0.95)
    ctx.close()


def font_checks(browser) -> None:
    # Korean h1/h2 use the subset display face; the English page never fetches it.
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
    page.wait_for_timeout(1200)
    check("language switch keeps the section", page.url == f"{SITE}/en/#playground", page.url)
    check("language switch updates <html lang>", page.get_attribute("html", "lang") == "en")
    # Pinned scenes above it add their length after hydration; the page still lands on the section.
    top = page.evaluate("Math.round(document.getElementById('playground').getBoundingClientRect().top)")
    check("a #section link lands on the section after the scenes are pinned", abs(top) < 80, f"{top}px from the top")
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
            keyboard_checks(browser, lang)
            copy_checks(browser, lang)
        layout_checks(browser)
        narrow_checks(browser)
        scroll_checks(browser)
        playground_rapid_checks(browser)
        reduced_motion_checks(browser)
        phone_checks(browser)
        font_checks(browser)
        routing_checks(browser)
        browser.close()
    failed = [r for r in RESULTS if not r[1]]
    print(f"\n{len(RESULTS) - len(failed)}/{len(RESULTS)} checks passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
