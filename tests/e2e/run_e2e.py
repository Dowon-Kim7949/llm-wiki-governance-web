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
VIEWPORTS = {"mobile": (360, 780), "tablet": (768, 1024), "desktop": (1440, 900)}
RESULTS: list[tuple[str, bool, str]] = []


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

    # Demo: walk all steps and modes, run axe on each state that changes the DOM most.
    page.locator("#demo").scroll_into_view_if_needed()
    for m in ["lite", "standard", "strict"]:
        page.locator(f'input[type="radio"][value="{m}"]').check()
        page.locator('nav[aria-label] ol button').nth(5).click()
        text = page.locator("#demo").inner_text()
        expect = {"lite": "no document was checked", "standard": "[warning] impact.source_changed", "strict": "exit 1"}[m]
        check(f"[{lang}] demo step 6 in {m}", expect in text)
    v2 = run_axe(page)
    check(f"[{lang}] axe on demo step 6 (strict)", not v2, json.dumps(v2, ensure_ascii=False))
    page.screenshot(path=str(SHOTS / f"{lang}-demo-step6-strict.png"), full_page=False)
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
    page.keyboard.press("Enter")
    # Move focus into the demo with the keyboard only.
    page.locator('#demo nav button').first.focus()
    page.keyboard.press("Tab")  # to step 2
    page.keyboard.press("Enter")
    current = page.locator('#demo [aria-current="step"]').inner_text()
    check(f"[{lang}] keyboard selects demo step 2", current.strip().startswith("2"), current)
    page.locator('input[type="radio"][value="lite"]').focus()
    page.keyboard.press("ArrowRight")
    checked = page.evaluate("document.querySelector('input[type=radio]:checked').value")
    check(f"[{lang}] arrow keys change mode", checked == "standard", checked)
    live = page.locator('#demo [aria-live="polite"]').count()
    check(f"[{lang}] demo has a polite live region", live == 1)
    ctx.close()


def copy_checks(browser, lang: str) -> None:
    ctx = browser.new_context(permissions=["clipboard-read", "clipboard-write"])
    page = ctx.new_page()
    page.goto(f"{SITE}/{lang}/#start")
    page.wait_for_load_state("networkidle")
    btn = page.locator("#start .copy-btn").first
    btn.click()
    clip = page.evaluate("navigator.clipboard.readText()")
    check(f"[{lang}] copy button copies the command", clip == "npx llm-wiki-governance@latest quickstart --dry-run", clip)
    check(f"[{lang}] copy button confirms", btn.get_attribute("data-state") == "copied")
    cmds = page.eval_on_selector_all("#start pre code", "els => els.map(e => e.textContent)")
    check(f"[{lang}] 8 commands listed", len(cmds) == 8, json.dumps(cmds))
    ctx.close()


def layout_checks(browser) -> None:
    for name, (w, h) in VIEWPORTS.items():
        for scheme in ["light", "dark"]:
            for lang in ["ko", "en"]:
                ctx = browser.new_context(viewport={"width": w, "height": h}, color_scheme=scheme)
                page = ctx.new_page()
                page.goto(f"{SITE}/{lang}/")
                page.wait_for_load_state("networkidle")
                overflow = page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
                if scheme == "light":
                    check(f"[{lang}] no horizontal overflow at {name} {w}px", overflow <= 0, f"{overflow}px")
                page.screenshot(path=str(SHOTS / f"{lang}-{name}-{scheme}.png"), full_page=(scheme == "light"))
                ctx.close()


def motion_checks(browser) -> None:
    for motion, expect_anim in [("reduce", False), ("no-preference", True)]:
        ctx = browser.new_context(reduced_motion=motion)
        page = ctx.new_page()
        page.goto(f"{SITE}/ko/")
        page.wait_for_load_state("networkidle")
        name = page.evaluate("getComputedStyle(document.querySelector('.plot-line-moved')).animationName")
        dur = page.evaluate("getComputedStyle(document.querySelector('.plot-line-moved')).animationDuration")
        animated = name != "none" and dur not in ("0s", "1e-05s")
        check(f"hero animation with reduced-motion={motion}", animated == expect_anim, f"{name} {dur}")
        ctx.close()


def routing_checks(browser) -> None:
    ctx = browser.new_context()
    page = ctx.new_page()
    page.goto(f"{SITE}/")
    page.wait_for_url("**/ko/", timeout=10000)
    check("root redirects to /ko/", page.url == f"{SITE}/ko/", page.url)
    # The reader's path: open the page, pick "Demo" in the menu, then switch
    # language. A fresh page, because a hash change fired while the previous
    # redirect's page was still hydrating can be dropped by the router.
    page.close()
    page = ctx.new_page()
    logs: list[str] = []
    page.on("console", lambda m: logs.append(f"{m.type}: {m.text}"))
    page.goto(f"{SITE}/ko/")
    page.wait_for_load_state("networkidle")
    page.locator('header nav a[href="#demo"]').click()
    page.wait_for_url("**/ko/#demo")
    # The link follows the hash once hydrated; wait for that, as a reader would.
    try:
        page.wait_for_function("document.querySelector('header .lang-switch').getAttribute('href').endsWith('/en/#demo')", timeout=10000)
    except Exception:  # report what the page actually holds instead of a bare timeout
        state = page.evaluate("({href: document.querySelector('header .lang-switch').getAttribute('href'), url: location.href})")
        check("language switch follows the hash", False, f"{state} console={logs[:5]}")
    page.locator("header .lang-switch").click()
    page.wait_for_url("**/en/**", timeout=10000)
    page.wait_for_timeout(300)
    check("language switch keeps the section", page.url == f"{SITE}/en/#demo", page.url)
    check("language switch updates <html lang>", page.get_attribute("html", "lang") == "en")
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
        motion_checks(browser)
        routing_checks(browser)
        browser.close()
    failed = [r for r in RESULTS if not r[1]]
    print(f"\n{len(RESULTS) - len(failed)}/{len(RESULTS)} checks passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
