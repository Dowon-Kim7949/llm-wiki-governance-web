"""Render share images using the same sculpture and typography as the new opening.
Run: python scripts/make_og.py (requires Playwright Chromium).
"""
import base64
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
IMAGE=base64.b64encode((ROOT/'public/images/evidence-links.webp').read_bytes()).decode()
COPY={'ko':('코드가 바뀌어도,<br>근거는 이어지도록.','AI 문서의 소스 인용과 검토 기록을 잇는 오픈 소스 CLI'), 'en':('Code moves on.<br>Keep the context.','Source citations and review records for the docs AI reads.')}

def html(lang):
    title,description=COPY[lang]
    return f'''<!doctype html><html lang="{lang}"><meta charset="utf-8"><style>
*{{box-sizing:border-box;margin:0}}body{{width:1200px;height:630px;background:#09090b;color:#f7f7f5;padding:48px 55px;font-family:Arial,'Malgun Gothic',sans-serif;position:relative;overflow:hidden}}.brand{{font-size:22px;letter-spacing:-1px;font-weight:800}}.brand span{{font-size:9px;letter-spacing:2px;margin-left:15px}}h1{{font-size:62px;letter-spacing:-3.6px;line-height:1.2;margin-top:72px;position:relative;z-index:2}}p{{font-size:15px;color:#b1b1bb;margin-top:28px;position:relative;z-index:2}}img{{position:absolute;right:-100px;bottom:-180px;width:830px;mix-blend-mode:screen}}.type{{position:absolute;font-size:115px;letter-spacing:-7px;font-weight:800;bottom:24px;left:50px;color:#35353e}}.tag{{position:absolute;right:55px;top:53px;color:#aaaab6;font-size:10px;letter-spacing:1px}}
</style><body><div class="brand">LLM–WIKI<span>GOVERNANCE</span></div><div class="tag">OPEN SOURCE · LOCAL FIRST</div><h1>{title}</h1><p>{description}</p><div class="type">STAY CONNECTED.</div><img src="data:image/webp;base64,{IMAGE}" alt=""></body></html>'''

if __name__=='__main__':
    with sync_playwright() as p:
        browser=p.chromium.launch();page=browser.new_page(viewport={'width':1200,'height':630})
        for lang in COPY:
            page.set_content(html(lang));page.screenshot(path=str(ROOT/f'public/og/og-{lang}.png'))
        browser.close()
