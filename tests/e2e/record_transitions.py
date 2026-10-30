"""Record native wheel input, forward/reverse story and navigation."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
OUT=Path(__file__).resolve().parents[2]/'test-results/stage'
SITE=os.environ.get('SITE_URL','http://localhost:4173').rstrip('/')

def traverse(page,start,end,duration):
    page.evaluate('''async ({start,end,duration})=>{
      const e=document.querySelector('[data-story-range]'),range=e.offsetHeight-innerHeight;
      const began=performance.now();await new Promise(resolve=>{
        function frame(now){const p=Math.min(1,(now-began)/duration);
        scrollTo(0,range*(start+(end-start)*p)/6.2);
        if(p<1)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);
      });}''',dict(start=start,end=end,duration=duration))

if __name__=='__main__':
 OUT.mkdir(exist_ok=True,parents=True)
 with sync_playwright() as p:
  browser=p.chromium.launch()
  ctx=browser.new_context(viewport=dict(width=1440,height=900),record_video_dir=str(OUT/'recordings'),record_video_size=dict(width=1440,height=900))
  page=ctx.new_page();page.goto(f'{SITE}/ko/');page.wait_for_timeout(1200)
  for start,end,duration in [(0,1.22,3500),(1.22,2.35,3000),(2.35,3.35,2800),(3.35,4.15,2200),(4.15,5.36,6000),(5.36,6.0,2600)]:
   traverse(page,start,end,duration);page.wait_for_timeout(800)
  traverse(page,6,2.35,5500);page.wait_for_timeout(700)
  page.mouse.wheel(0,1200);page.wait_for_timeout(250);page.mouse.wheel(0,-1600);page.wait_for_timeout(700)
  page.locator('[data-chapter-link]').nth(4).click();page.wait_for_timeout(700)
  page.locator('[data-stage] a[href="#start"]').last.click();page.wait_for_timeout(1000)
  page.locator('header > a').click();page.wait_for_timeout(1000)
  video=page.video;ctx.close();video.save_as(str(OUT/'main-transitions.webm'))

  mobile=browser.new_context(viewport=dict(width=390,height=844),is_mobile=True,has_touch=True,record_video_dir=str(OUT/'recordings'),record_video_size=dict(width=390,height=844))
  page=mobile.new_page();page.goto(f'{SITE}/ko/');page.wait_for_timeout(800)
  traverse(page,0,6,16000);page.wait_for_timeout(900)
  traverse(page,6,2.35,5000);page.wait_for_timeout(800)
  page.locator('header a[href="#start"]').click();page.wait_for_timeout(800)
  video=page.video;mobile.close();video.save_as(str(OUT/'mobile-transitions.webm'));browser.close()
