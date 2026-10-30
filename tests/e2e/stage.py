"""Acceptance checks for the persistent viewport stage, against a static build."""
import json
import os
import sys
from io import BytesIO
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'test-results/stage'
OUT.mkdir(parents=True, exist_ok=True)
SITE = os.environ.get('SITE_URL', 'http://localhost:4173').rstrip('/')
AXE = (ROOT / 'node_modules/axe-core/axe.min.js').read_text(encoding='utf-8')
RESULTS = []
TIMES = [0,1.22,2.35,3.35,4.35,4.88,5.36,6.0]

def check(name, ok, detail=None):
    RESULTS.append(dict(name=name,passed=bool(ok),detail=detail))
    print(('PASS ' if ok else 'FAIL ')+name+(f' {detail}' if not ok else ''),flush=True)

def seek(page,time):
    page.evaluate("t=>{let e=document.querySelector('[data-story-range]');scrollTo(0,e.offsetTop+(e.offsetHeight-innerHeight)*t/6.2)}",time)
    page.wait_for_timeout(70)

def state(page):
    return page.locator('[data-stage]').evaluate("""e=>({chapter:e.dataset.chapter,changed:e.dataset.changed,
    review:e.dataset.review,top:e.getBoundingClientRect().top,height:e.getBoundingClientRect().height,
    next:document.getElementById('start').getBoundingClientRect().top,overflow:document.documentElement.scrollWidth-innerWidth})""")

def axe(page,name):
    page.add_script_tag(content=AXE)
    violations=page.evaluate("""async()=>(await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa','best-practice']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))""")
    check(name,not violations,violations)

def route(browser,lang):
    ctx=browser.new_context(viewport=dict(width=1366,height=768),permissions=['clipboard-read','clipboard-write'])
    page=ctx.new_page();errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('response',lambda r:errors.append(f'{r.status} {r.url}') if r.status>=400 else None)
    response=page.goto(f'{SITE}/{lang}/');page.wait_for_timeout(700)
    check(f'{lang}: route and locale',response.status==200 and page.locator('html').get_attribute('lang')==lang)
    check(f'{lang}: opening image loaded',page.locator('[data-chain] img').evaluate('(e)=>e.complete&&e.naturalWidth>0'))
    frames=[]
    for n in range(63): seek(page,n/10);frames.append(state(page))
    check(f'{lang}: same stage fills 63 intermediate positions',all(abs(v['top'])<2 and abs(v['height']-768)<2 and v['next']>=767 and not v['overflow'] for v in frames))
    forward={}
    for time in TIMES: seek(page,time);forward[time]=state(page)
    for time in reversed(TIMES):
        seek(page,time);value=state(page)
        check(f'{lang}: reverse state {time}',all(value[k]==forward[time][k] for k in ['chapter','changed','review']))
    check(f'{lang}: change preserves status',forward[2.35]['changed']=='true' and forward[2.35]['review']=='unchanged')
    check(f'{lang}: explicit review edit approve', [forward[t]['review'] for t in [4.35,4.88,5.36]]==['pending','edited','approved'])
    page.mouse.wheel(0,1800);page.wait_for_timeout(160)
    check(f'{lang}: native wheel advances',page.evaluate('scrollY')>1000)
    for time in [5.36,2.35,6.0,0]: seek(page,time)
    check(f'{lang}: rapid jumps restore opening',state(page)['changed']=='false' and page.locator('[data-chain]').evaluate('(e)=>getComputedStyle(e).opacity')=='1')
    for i in range(6):
        page.locator('[data-chapter-link]').nth(i).click();page.wait_for_timeout(90)
        check(f'{lang}: chapter link {i+1}',state(page)['chapter']==str(i))
    seek(page,2.35)
    check(f'{lang}: inactive CTA inert',page.locator('[data-scene="5"]').evaluate('(e)=>e.inert&&e.getAttribute("aria-hidden")==="true"'))
    axe(page,f'{lang}: axe change');seek(page,5.36);axe(page,f'{lang}: axe review')
    page.locator('header a[href="#start"]').click();page.wait_for_timeout(100)
    check(f'{lang}: installation anchor aligned',abs(page.locator('#start').evaluate('(e)=>e.getBoundingClientRect().top')-64)<3)
    page.locator('#cmd-preview + button').click()
    check(f'{lang}: clipboard success',page.evaluate('navigator.clipboard.readText()')==page.locator('#cmd-preview').inner_text())
    page.evaluate("Object.defineProperty(navigator,'clipboard',{value:{writeText:()=>Promise.reject(Error('blocked'))},configurable:true})")
    page.locator('#cmd-preview + button').click()
    check(f'{lang}: clipboard failure visible',page.locator('.copy-failed').is_visible())
    page.locator('#start > details > summary').click()
    check(f'{lang}: eight install commands',page.locator('#start code').count()==8)
    page.locator('#reference > div > details').first.locator(':scope > summary').click();demo=page.locator('[data-demo]')
    for file,docs in [('invoice',['billing']),('shipping',['billing','shipping']),('format',[])]:
        demo.locator('select').nth(0).select_option(file)
        check(f'{lang}: switch {file} resets',demo.get_attribute('data-applied')=='false')
        demo.locator('button[aria-pressed]').click()
        for mode in ['lite','standard','strict']:
            demo.locator('select').nth(1).select_option(mode);expected=[] if mode=='lite' else docs
            result='pass' if not expected else 'fail' if mode=='strict' else 'warning'
            flags=demo.locator('[data-flagged=true]').evaluate_all('(es)=>es.map(e=>e.dataset.doc)')
            check(f'{lang}: {file}/{mode} impact',flags==expected and demo.locator('[data-result]').get_attribute('data-result')==result)
            demo.locator('details summary').click();raw=demo.locator('details pre').inner_text()
            check(f'{lang}: {file}/{mode} captured output',f'--mode {mode}' in raw and f'- result: {result}' in raw)
            demo.locator('details summary').click()
        demo.locator('button[aria-pressed]').click();check(f'{lang}: undo {file}',demo.get_attribute('data-applied')=='false')
    page.locator('#reference > div > details').nth(1).locator(':scope > summary').click();axe(page,f'{lang}: axe open reference')
    for details in page.locator('details').all(): details.evaluate('(e)=>e.open=true')
    check(f'{lang}: expanded page no overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
    page.locator('#reference').scroll_into_view_if_needed();page.screenshot(path=str(OUT/f'{lang}-reference.png'))
    page.locator('main > section').last.scroll_into_view_if_needed();page.screenshot(path=str(OUT/f'{lang}-ending.png'))
    page.locator('header > a').click();page.wait_for_timeout(100)
    check(f'{lang}: logo true opening',page.evaluate('scrollY')==0 and state(page)['chapter']=='0')
    seek(page,4.88)
    for w,h in [(390,844),(1920,1080),(360,800),(1366,768)]:
        page.set_viewport_size(dict(width=w,height=h));page.wait_for_timeout(500)
        check(f'{lang}: resize {w} preserves edit',state(page)['review']=='edited' and abs(state(page)['top'])<2,state(page))
    page.locator('header > a').click();page.keyboard.press('Tab')
    check(f'{lang}: keyboard focus visible',page.evaluate("getComputedStyle(document.activeElement).outlineStyle!=='none'"))
    page.locator('[data-chapter-link]').nth(4).click();page.wait_for_timeout(100)
    page.locator('button').first.click();page.wait_for_timeout(150)
    check(f'{lang}: manual reader at start',page.locator('[data-story-reader]').is_visible() and page.evaluate('scrollY')==0 and not page.locator('[data-story-range]').is_visible() and page.locator('a[hreflang]').get_attribute('href').endswith('#connection'))
    page.locator('button').first.click();page.wait_for_timeout(200)
    check(f'{lang}: presentation return',page.locator('[data-stage]').is_visible() and state(page)['chapter']=='0')
    page.emulate_media(reduced_motion='reduce');page.wait_for_timeout(200)
    check(f'{lang}: live reduced motion',not page.locator('[data-story-range]').is_visible() and page.locator('[data-story-reader]').is_visible())
    axe(page,f'{lang}: axe reader');check(f'{lang}: runtime and asset requests',not errors,errors)
    ctx.close()

def viewports(browser,lang):
    for w,h in [(1440,900),(1280,800),(1366,768),(1920,1080),(2560,1440),(3840,2160),(3440,1440),(390,844),(360,800),(320,640)]:
        ctx=browser.new_context(viewport=dict(width=w,height=h),is_mobile=w<701,has_touch=w<701)
        page=ctx.new_page();page.goto(f'{SITE}/{lang}/');page.wait_for_timeout(350);problems=[]
        for time in TIMES:
            seek(page,time);v=state(page)
            if v['overflow'] or abs(v['top'])>2 or abs(v['height']-h)>2 or v['next']<h-2: problems.append((time,v))
            collision=page.evaluate("""()=>{let e=document.querySelector('[data-stage]'),i=e.dataset.chapter;
              let h=e.querySelector(`[data-scene='${i}'] h1,[data-scene='${i}'] h2`).getBoundingClientRect();
              let c=e.querySelector('[data-source]').getBoundingClientRect();return i!=='0'&&i!=='5'&&h.bottom>c.top+2}""")
            if collision: problems.append((time,'headline/source collision'))
            if time in [0,2.35,3.35,5.36,6.0]:
                png=page.screenshot(path=str(OUT/f'{lang}-{w}x{h}-{time}.png'))
                # Test actual painted text: computed visibility missed a Chromium
                # sticky/overflow:clip bug that rendered an empty source panel.
                if w<701 and time in [2.35,3.35,5.36]:
                    box=page.locator('[data-source] code').bounding_box()
                    im=Image.open(BytesIO(png)).convert('RGB').crop((int(box['x']),int(box['y']),int(box['x']+box['width']),int(box['y']+box['height'])))
                    pixels=im.tobytes()
                    bright=sum(1 for i in range(0,len(pixels),3) if min(pixels[i:i+3])>140)
                    if bright<80: problems.append((time,'source text not painted'))
        check(f'{lang}: {w}x{h} six scenes',not problems,problems)
        page.locator('header a[href="#start"]').click()
        for d in page.locator('details').all(): d.evaluate('(e)=>e.open=true')
        check(f'{lang}: {w} expanded no overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
        if w<701:
            page.screenshot(path=str(OUT/f'{lang}-{w}-installation.png'))
            page.locator('[data-demo]').scroll_into_view_if_needed();page.screenshot(path=str(OUT/f'{lang}-{w}-demo.png'))
        ctx.close()

def navigation_and_keyboard(browser):
    ctx=browser.new_context(viewport=dict(width=390,height=844));page=ctx.new_page()
    page.goto(f'{SITE}/ko/#impact');page.wait_for_timeout(450)
    check('direct chapter URL enters impact',state(page)['chapter']=='3')
    page.locator('a[hreflang=en]').click();page.wait_for_timeout(450)
    check('locale switch retains chapter',page.locator('html').get_attribute('lang')=='en' and state(page)['chapter']=='3')
    page.locator('header a[href="#start"]').focus();page.keyboard.press('Enter');page.wait_for_timeout(80)
    check('keyboard installation navigation',abs(page.locator('#start').evaluate('(e)=>e.getBoundingClientRect().top')-64)<3)
    summary=page.locator('#reference > div > details').first.locator(':scope > summary')
    summary.focus();page.keyboard.press('Enter');demo=page.locator('[data-demo]')
    check('keyboard disclosure',demo.is_visible())
    demo.locator('select').first.focus();page.keyboard.press('ArrowDown');page.keyboard.press('Enter')
    check('keyboard source selection',demo.get_attribute('data-file')=='shipping')
    demo.locator('button[aria-pressed]').focus();page.keyboard.press('Space')
    check('keyboard applies meaningful change',demo.get_attribute('data-applied')=='true' and demo.locator('[data-flagged=true]').count()==2)
    check('demo announces current results','shipping.md' in demo.locator('[role=status]').inner_text())
    demo.locator('select').first.select_option('format')
    check('file switch explicitly undoes active change',demo.get_attribute('data-applied')=='false')
    # Mode switch and next actions follow the chosen file.
    demo.locator('button[aria-pressed]').click();demo.locator('select').nth(1).select_option('lite')
    demo.locator('button').filter(has_text='standard').click()
    check('lite next action enables standard',demo.locator('select').nth(1).input_value()=='standard')
    demo.locator('button').filter(has_text='Try a cited source').click()
    check('uncited next action resets to cited source',demo.get_attribute('data-file')=='invoice' and demo.get_attribute('data-applied')=='false')
    ctx.close()

with sync_playwright() as p:
    browser=p.chromium.launch()
    for lang in ['ko','en']: route(browser,lang);viewports(browser,lang)
    navigation_and_keyboard(browser)
    ctx=browser.new_context(reduced_motion='reduce');page=ctx.new_page();page.goto(f'{SITE}/ko/');page.wait_for_timeout(200)
    check('initial reduced motion reader',page.locator('[data-story-reader]').is_visible() and not page.locator('[data-story-range]').is_visible());ctx.close()
    ctx=browser.new_context(java_script_enabled=False);page=ctx.new_page();page.goto(f'{SITE}/en/')
    check('no JS complete fallback',page.locator('[data-story-reader]').is_visible() and page.locator('#cmd-preview').count()==1)
    ctx.close();browser.close()
(OUT/'verification.json').write_text(json.dumps(RESULTS,ensure_ascii=False,indent=2),encoding='utf-8')
failed=[r for r in RESULTS if not r['passed']]
print(f'{len(RESULTS)-len(failed)}/{len(RESULTS)} passed')
sys.exit(bool(failed))
