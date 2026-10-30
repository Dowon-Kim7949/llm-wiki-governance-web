"""Capture the opening, change feedback and section transitions in Chromium.
Artifact: tests/e2e/screenshots/main-transitions-desktop.webm (git ignored).
"""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
SHOTS=Path(__file__).parent/'screenshots'
SITE=os.environ.get('SITE_URL','http://localhost:4173').rstrip('/')
if __name__=='__main__':
 SHOTS.mkdir(exist_ok=True,parents=True)
 with sync_playwright() as p:
  b=p.chromium.launch();ctx=b.new_context(viewport={'width':1440,'height':900},record_video_dir=str(SHOTS/'recordings'),record_video_size={'width':1440,'height':900});page=ctx.new_page();page.goto(f'{SITE}/ko/');page.wait_for_timeout(2000)
  for _ in range(11): page.mouse.wheel(0,95);page.wait_for_timeout(90)
  page.wait_for_timeout(1000)
  page.locator('#playground input[value=shipping]').locator('..').click();page.wait_for_timeout(500);page.locator('#playground button[aria-pressed]').click();page.wait_for_timeout(1200)
  page.screenshot(path=str(SHOTS/'ko-demo-interaction.png'))
  page.locator('#playground a[href="#review"]').click();page.wait_for_timeout(1000);page.locator('#review button[aria-pressed]').nth(2).click();page.wait_for_timeout(700);page.screenshot(path=str(SHOTS/'ko-review-shipping.png'))
  page.locator('header nav a[href="#anatomy"]').click();page.wait_for_timeout(900);page.locator('#anatomy button').nth(2).click();page.wait_for_timeout(800);page.screenshot(path=str(SHOTS/'ko-metadata.png'))
  page.locator('header a[href="#start"]:visible').click();page.wait_for_timeout(800);page.screenshot(path=str(SHOTS/'ko-installation.png'))
  page.evaluate('document.querySelector("#closing").scrollIntoView()');page.wait_for_timeout(900);page.screenshot(path=str(SHOTS/'ko-ending.png'))
  for _ in range(8): page.mouse.wheel(0,-480);page.wait_for_timeout(100)
  page.locator('header > a').click();page.wait_for_timeout(1200)
  video=page.video;ctx.close();path=Path(video.path());path.replace(SHOTS/'main-transitions-desktop.webm');b.close()
