"""Renders the Open Graph cards (1200x630) to public/og/og-{ko,en}.png.

The cards are drawn from the same tokens and drawing as the hero, then
screenshotted with headless Chromium. Re-run after changing the copy:
    python scripts/make_og.py
"""

from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "og"

COPY = {
    "ko": ("문서가 무엇을 근거로 삼는지,<br>누가 승인했는지,<br>그 근거가 언제 바뀌었는지.", "AI 코딩 에이전트가 쓰는 프로젝트 문서를 위한<br>오픈 소스 CLI"),
    "en": ("What each doc cites, who approved it, and when its source changed.", "An open-source CLI for the project docs your AI coding agent writes"),
}

PLOT = """
<svg viewBox="0 0 560 400" width="430" height="307">
  <defs><pattern id="g" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M28 0H0V28" fill="none" stroke="#9aa6a3" stroke-opacity=".35"/></pattern></defs>
  <rect width="560" height="400" fill="url(#g)"/>
  <line x1="126" y1="312" x2="392" y2="214" stroke="#2b6146" stroke-width="4"/>
  <line x1="126" y1="96" x2="392" y2="186" stroke="#b0124f" stroke-width="4.5" stroke-dasharray="12 7"/>
  <rect x="112" y="82" width="28" height="28" fill="#e8ebe6" stroke="#b0124f" stroke-width="3"/><circle cx="126" cy="96" r="4" fill="#b0124f"/>
  <rect x="112" y="298" width="28" height="28" fill="#e8ebe6" stroke="#17232b" stroke-width="3"/><circle cx="126" cy="312" r="4" fill="#17232b"/>
  <text x="112" y="66" font-family="Consolas,monospace" font-size="18" fill="#17232b">src/invoice.js</text>
  <text x="112" y="352" font-family="Consolas,monospace" font-size="18" fill="#17232b">src/tax.js</text>
  <path d="M392 150h86l26 26v84H392z" fill="#f4f6f2" stroke="#17232b" stroke-width="3"/><path d="M478 150v26h26" fill="none" stroke="#17232b" stroke-width="3"/>
  <path d="M410 194h70M410 210h56M410 226h66" stroke="#9aa6a3" stroke-width="3"/>
  <path d="M448 120 460 141H436z" fill="#2b6146"/>
  <text x="392" y="288" font-family="Consolas,monospace" font-size="18" fill="#17232b">billing.md</text>
  <path d="M262 141V100" stroke="#b0124f" stroke-width="2.5"/><path d="M263 100h34l-9 9 9 9h-34z" fill="#b0124f"/>
</svg>
"""


def html(lang: str) -> str:
    title, sub = COPY[lang]
    return f"""<!doctype html><html lang="{lang}"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&display=block" rel="stylesheet">
<style>
*{{box-sizing:border-box;margin:0}}
body{{width:1200px;height:630px;background:#e8ebe6;color:#17232b;font-family:Archivo,"Malgun Gothic","Apple SD Gothic Neo",sans-serif;
display:grid;grid-template-columns:1fr 450px;gap:28px;align-items:center;padding:56px 52px 56px 64px;border:14px solid #17232b;word-break:keep-all}}
.name{{font-weight:800;font-variation-settings:"wdth" 120;font-size:30px;display:flex;align-items:center;gap:14px}}
.name svg{{width:36px;height:36px}}
h1{{margin-top:34px;font-size:{42 if lang == "ko" else 48}px;line-height:1.14;font-weight:820;font-variation-settings:"wdth" 112;letter-spacing:{"-0.035em" if lang == "ko" else "-0.02em"}}}
p{{margin-top:30px;font-size:24px;color:#46555c;max-width:560px;line-height:1.4}}
.plot{{border:3px solid #17232b;border-radius:12px;background:#f4f6f2;padding:6px}}
</style></head><body>
<div><div class="name"><svg viewBox="0 0 28 28"><path d="M4 22 14 5l10 17z" fill="none" stroke="#17232b" stroke-width="2.6" stroke-linejoin="round"/><circle cx="14" cy="16" r="3" fill="#17232b"/></svg>LLM-WIKI Governance</div>
<h1>{title}</h1><p>{sub}</p></div>
<div class="plot">{PLOT}</div>
</body></html>"""


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1200, "height": 630})
        for lang in COPY:
            page.set_content(html(lang), wait_until="networkidle")
            page.evaluate("document.fonts.ready")
            page.screenshot(path=str(OUT / f"og-{lang}.png"))
            print(f"wrote public/og/og-{lang}.png")
        browser.close()


if __name__ == "__main__":
    main()
