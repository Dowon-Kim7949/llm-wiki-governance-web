"""Rendered collision and navigation regressions; tests outcomes, not CSS values."""
import json
import os
import sys
import time as clock
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'test-results/typography'
OUT.mkdir(exist_ok=True,parents=True)
SITE=os.environ.get('SITE_URL','http://localhost:4173').rstrip('/')
RESULTS=[]
MEASUREMENTS=[]
VIEWPORTS=[(1366,768),(1440,900),(1920,1080),(2560,1440),(3840,2160),(1920,700),(390,844),(360,800),(320,640)]
TIMES=[0,1.22,2.35,3.35,4.35,4.88,5.36,6]

def check(name,ok,detail=None):
    RESULTS.append(dict(name=name,passed=bool(ok),detail=detail))
    print(('PASS ' if ok else 'FAIL ')+name+(f' {detail}' if not ok else ''),flush=True)

def seek(page,time):
    page.evaluate("t=>{const w=document.querySelector('[data-story-range]');scrollTo(0,(w.offsetHeight-innerHeight)*t/6.2)}",time)
    page.wait_for_timeout(50)

MEASURE_JS="""() => {
 const stage=document.querySelector('[data-stage]'), issues=[];
 const visible=e=>{if(!e)return false;for(let p=e;p;p=p.parentElement){let s=getComputedStyle(p);if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)<.45)return false;}return true;};
 const box=e=>e.getBoundingClientRect();
 const select=s=>stage.querySelector(s);
 const overlap=(a,b)=>a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1;
 const pair=(a,b,label)=>{a=select(a);b=select(b);if(visible(a)&&visible(b)&&overlap(box(a),box(b)))issues.push(label);};
 const header=document.querySelector('header').getBoundingClientRect(),nav=box(select('nav'));
 for(const e of stage.querySelectorAll('[data-scene-head] h2,.caption,[data-card-heading],[data-expression],[data-example],[data-calculated],[data-sentence],[data-document-foot],[data-flag],[data-unaffected],[data-feedback] > div')){
  if(!visible(e))continue;const r=box(e);if(!r.width||!r.height)continue;
  if(r.top<header.bottom-1||r.bottom>nav.top+1||r.left<-.5||r.right>innerWidth+.5)issues.push('essential content outside safe region: '+(e.dataset.sceneHead??e.getAttribute('class')??e.tagName));
 }
 const active=stage.dataset.chapter,heading=select(`[data-scene='${active}'] h2`),source=select('[data-source]');
 if(visible(heading)&&overlap(box(heading),box(select('[class*=modeBar]'))))issues.push('headline intersects reading control');
 if(active!=='0'&&active!=='5'&&visible(heading)&&visible(source)&&box(heading).bottom>box(source).top-1)issues.push('heading intersects visual');
 pair('[data-source] [data-card-heading]','[data-expression]','file heading / function');
 pair('[data-expression]','[data-calculation]','formula / calculation');
 pair('[data-example]','[data-calculated]','example / result');
 pair('[data-document] [data-card-heading]','[data-sentence]','document heading / sentence');
 pair('[data-sentence]','[data-document-foot]','sentence / citation and value');
 pair('[data-document] [data-card-heading]','[data-flag]','document heading / impact flag');
 pair('[data-document]','[data-unaffected]','affected / unaffected documents');
 const inside=(parent,child)=>{parent=select(parent);child=select(child);if(!visible(parent)||!visible(child))return;const p=box(parent),c=box(child);if(c.left<p.left-1||c.right>p.right+1||c.top<p.top-1||c.bottom>p.bottom+1)issues.push('card content overflows '+child.tagName);};
 inside('[data-source]','[data-expression]');inside('[data-source]','[data-calculation]');inside('[data-document]','[data-document-foot]');inside('[data-document]','[data-flag]');
 const path=select('[data-tether]'),matrix=path.getScreenCTM();
 let attachment=null;
 if(visible(source)&&active!=='5'&&Math.abs(new DOMMatrix(getComputedStyle(source).transform).a-1)<.001){
  const a=new DOMPoint(path.getPointAtLength(0).x,path.getPointAtLength(0).y).matrixTransform(matrix);
  const point=path.getPointAtLength(path.getTotalLength()),b=new DOMPoint(point.x,point.y).matrixTransform(matrix);
  const s=box(source),d=box(select('[data-document]')),mobile=innerWidth<=700;
  attachment=Math.max(Math.abs(a.x-(mobile?s.left+s.width/2:s.right)),Math.abs(a.y-(mobile?s.bottom:s.top+s.height/2)),Math.abs(b.x-(mobile?d.left+d.width/2:d.left)),Math.abs(b.y-(mobile?d.top:d.top+d.height/2)));
  if(attachment>3)issues.push('tether detached: '+attachment);
 }
 return {issues,chapter:active,stageTop:box(stage).top,stageHeight:box(stage).height,stageScroll:stage.scrollTop,
   gap:active!=='0'&&active!=='5'?box(source).top-box(heading).bottom:null,attachment,
   font:getComputedStyle(heading).fontFamily,weight:getComputedStyle(heading).fontWeight,
   headerBottom:header.bottom,headingTop:box(heading).top,
   formulaBottom:box(select('[data-expression]')).bottom,exampleTop:box(select('[data-example]')).top,
   overflow:document.documentElement.scrollWidth-innerWidth};
}"""

with sync_playwright() as p:
 browser=p.chromium.launch()
 for lang in ['ko','en']:
  for w,h in VIEWPORTS:
   ctx=browser.new_context(viewport=dict(width=w,height=h));page=ctx.new_page();errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(f'{SITE}/{lang}/');page.evaluate('document.fonts.ready');page.wait_for_timeout(200)
   failures=[]
   for time in TIMES:
    seek(page,time);v=page.evaluate(MEASURE_JS);MEASUREMENTS.append(dict(lang=lang,width=w,height=h,time=time,**v))
    if v['issues'] or v['overflow'] or abs(v['stageTop'])>2 or abs(v['stageHeight']-h)>2:failures.append((time,v['issues'],v['overflow']))
    if time in [0,1.22,2.35,3.35,4.35,5.36,6]:page.screenshot(path=str(OUT/f'after-{lang}-{w}x{h}-{time}.png'))
   check(f'{lang} {w}x{h}: all settled content fits',not failures,failures)
   # Intermediate frames and coherent reverse flow, not only chapter boundaries.
   failures=[]
   for time in [1.02,1.78,2.08,2.82,3.12,3.86,4.12,4.58,5.1,5.58,5.8,5.1,4.58,3.86,3.12,2.08,1.02,0]:
    seek(page,time);v=page.evaluate(MEASURE_JS)
    if v['issues']:failures.append((time,v['issues']))
   check(f'{lang} {w}x{h}: transitions and reverse stay clear',not failures,failures)
   failures=[]
   for index in [1,4,2,3,5,0,4,1]:
    page.locator('[data-chapter-link]').nth(index).click();page.wait_for_timeout(50);v=page.evaluate(MEASURE_JS)
    if v['chapter']!=str(index) or v['issues']:failures.append((index,v))
   check(f'{lang} {w}x{h}: chapter navigation stays below header',not failures,failures)
   check(f'{lang} {w}x{h}: runtime errors',not errors,errors)
   ctx.close()
 # Direct URLs, both language directions, font use and a layout change mid-transition.
 for lang in ['ko','en']:
  page=browser.new_page(viewport=dict(width=1920,height=700));font_requests=[]
  page.on('request',lambda r:font_requests.append(r.url) if r.resource_type=='font' else None)
  for chapter,index in [('evidence','1'),('review','4')]:
   page.goto(f'{SITE}/{lang}/#{chapter}');page.evaluate('document.fonts.ready');page.wait_for_timeout(300);v=page.evaluate(MEASURE_JS)
   check(f'{lang}: direct #{chapter} after font load',v['chapter']==index and not v['issues'],v)
  check(f'{lang}: correct display weight',page.locator('[data-scene="4"] h2').evaluate('(e)=>getComputedStyle(e).fontWeight')==('400' if lang=='ko' else '750'))
  # CDP reports fonts that actually rendered glyphs, rather than just the CSS declaration.
  cdp=page.context.new_cdp_session(page);cdp.send('DOM.enable');cdp.send('CSS.enable');doc=cdp.send('DOM.getDocument');node=cdp.send('DOM.querySelector',{'nodeId':doc['root']['nodeId'],'selector':'[data-scene="4"] h2 > span'})
  fonts=cdp.send('CSS.getPlatformFontsForNode',{'nodeId':node['nodeId']})['fonts'];names=[f['familyName'] for f in fonts]
  check(f'{lang}: actual heading font',any('Jalnan' in n for n in names) if lang=='ko' else all('Jalnan' not in n for n in names),names)
  if lang=='en':check('English does not download Korean OTF',not any('.otf' in u for u in font_requests),font_requests)
  other='en' if lang=='ko' else 'ko';page.locator(f'a[hreflang={other}]').click();page.evaluate('document.fonts.ready');page.wait_for_timeout(300);v=page.evaluate(MEASURE_JS)
  check(f'{lang} → {other}: review remains aligned',v['chapter']=='4' and not v['issues'],v)
  seek(page,3.12)
  for w,h in [(390,844),(1366,768),(1920,700)]:
   page.set_viewport_size(dict(width=w,height=h));page.wait_for_timeout(350);v=page.evaluate(MEASURE_JS)
   check(f'{lang}: resize mid-transition to {w}x{h}',not v['issues'] and abs(v['stageTop'])<2,v)
  page.locator('header > a').click();page.wait_for_timeout(50)
  check(f'{lang}: logo returns to true opening',page.evaluate('scrollY')==0 and page.locator('[data-stage]').get_attribute('data-chapter')=='0')
  page.close()
 # A cold Korean font must settle before the initial chapter seek is measured.
 page=browser.new_page(viewport=dict(width=1920,height=700))
 page.route('**/*.otf',lambda route:(clock.sleep(.7),route.continue_()))
 page.goto(f'{SITE}/ko/#review');page.evaluate('document.fonts.ready');page.wait_for_timeout(150)
 v=page.evaluate(MEASURE_JS)
 check('cold Korean font and direct chapter settle together',v['chapter']=='4' and not v['issues'],v)
 # Scroll-into-view must not create a second scroll position inside the stage.
 page.locator('[data-scene="4"] h2').evaluate('(e)=>e.scrollIntoView({block:"start"})')
 page.wait_for_timeout(100)
 check('focus-style scroll does not scroll the stage internally',page.locator('[data-stage]').evaluate('(e)=>e.scrollTop')==0)
 page.close()
 browser.close()
(OUT/'layout-verification.json').write_text(json.dumps(RESULTS,ensure_ascii=False,indent=2),encoding='utf-8')
(OUT/'after-measurements.json').write_text(json.dumps(MEASUREMENTS,ensure_ascii=False,indent=2),encoding='utf-8')
failed=[r for r in RESULTS if not r['passed']]
print(f'{len(RESULTS)-len(failed)}/{len(RESULTS)} passed')
sys.exit(bool(failed))
