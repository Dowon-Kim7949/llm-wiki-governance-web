"""Browser regression checks for the connected-context redesign.
Run against a built static export: npm run build, npm run serve, npm run test:e2e.
Screenshots and the optional transition recording are local, git-ignored artifacts.
"""
from __future__ import annotations
import json
import os
import sys
sys.stdout.reconfigure(encoding="utf-8")
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
SHOTS = ROOT / 'tests/e2e/screenshots'
SITE = os.environ.get('SITE_URL', 'http://localhost:4173').rstrip('/')
META = os.environ.get('CANONICAL_BASE', SITE if os.environ.get('SITE_URL') else 'http://localhost:3000').rstrip('/')
AXE = (ROOT / 'node_modules/axe-core/axe.min.js').read_text(encoding='utf-8')
RESULTS = []

def check(name, ok, detail=''):
    RESULTS.append({'name':name,'pass':bool(ok),'detail':detail})
    print(('PASS ' if ok else 'FAIL ') + name + (' -- ' + str(detail) if detail and not ok else ''), flush=True)

def choose(page, value):
    page.locator(f'#playground input[value="{value}"]').locator('..').click()

def apply(page):
    page.locator('#playground button[aria-pressed]').click()

def axe(page):
    page.add_script_tag(content=AXE)
    return page.evaluate("""async () => (await axe.run(document, {runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22a','wcag22aa','best-practice']}})).violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)}))""")

def state(page):
    return page.evaluate("""() => ({file:document.querySelector('#playground').dataset.file, applied:document.querySelector('#playground').dataset.applied, result:document.querySelector('#playground [data-result]').dataset.result, flags:[...document.querySelectorAll('#playground [data-flagged="true"]')].map(e=>e.dataset.doc), spoken:document.querySelector('#playground [aria-live]').textContent})""")

def page_checks(browser, lang):
    ctx=browser.new_context(viewport={'width':1440,'height':900}, permissions=['clipboard-read','clipboard-write'])
    page=ctx.new_page(); errors=[]; failed=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
    page.on('response',lambda r:failed.append(f'{r.status} {r.url}') if r.status>=400 else None)
    response=page.goto(f'{SITE}/{lang}/');page.wait_for_timeout(1700)
    check(f'{lang}: static page and language',response.status==200 and page.locator('html').get_attribute('lang')==lang)
    check(f'{lang}: one headline',page.locator('h1').count()==1)
    check(f'{lang}: metadata preserved',page.locator('link[rel=canonical]').get_attribute('href')==f'{META}/{lang}/' and page.locator('link[rel=alternate][hreflang]').count()==3)
    check(f'{lang}: sculpture loaded',page.locator('#top img').evaluate('(e)=>e.complete&&e.naturalWidth>0'))
    page.screenshot(path=str(SHOTS/f'{lang}-desktop-hero.png'))
    check(f'{lang}: starts with no change',state(page)['applied']=='false' and state(page)['result']=='idle')
    for file,docs in [('invoice',['billing']),('shipping',['billing','shipping']),('format',[])]:
        choose(page,file)
        if state(page)['applied']=='true': apply(page)
        apply(page)
        for mode in ['lite','standard','strict']:
            choose(page,mode)
            expected=[] if mode=='lite' else docs
            result='pass' if not expected else 'fail' if mode=='strict' else 'warning'
            observed=state(page)
            check(f'{lang}: {file}/{mode} affected docs and CI',observed['flags']==expected and observed['result']==result,observed)
            check(f'{lang}: {file}/{mode} accessible result',result in observed['spoken'] and all(f'{d}.md' in observed['spoken'] for d in expected))
            summary=page.locator('#playground details summary')
            summary.click()
            raw=page.locator('#playground details pre').inner_text()
            check(f'{lang}: {file}/{mode} captured CLI evidence',f'- result: {result}' in raw and f'--mode {mode}' in raw)
            summary.click()
        if file=='shipping':
            page.locator('#playground a[href="#review"]').click()
            check(f'{lang}: review uses shipping scenario',page.locator('#review').get_attribute('data-review-file')=='shipping' and 'shipping.md' in page.locator('#review').inner_text())
            buttons=page.locator('#review button[aria-pressed]')
            for i in [1,2,3,0]:
                buttons.nth(i).click()
                check(f'{lang}: review step {i+1}',buttons.nth(i).get_attribute('aria-pressed')=='true')
            buttons.nth(3).click()
            sample=page.locator('#review').inner_text()
            check(f'{lang}: approval commands name both selected docs','--approve docs/llm-wiki/domains/billing.md' in sample and '--approve docs/llm-wiki/domains/shipping.md' in sample)
            check(f'{lang}: shipping does not show invoice evidence',page.locator('#review details').count()==0)
    check(f'{lang}: uncited change has no review link',page.locator('#playground a[href="#review"]').count()==0)
    choose(page,'invoice')
    check(f'{lang}: switching file clears applied state and review step',state(page)['applied']=='false' and page.locator('#review button[aria-pressed]').count()==0)
    apply(page);choose(page,'lite');page.locator('#playground [role=status] button').click()
    check(f'{lang}: lite next action enables standard',page.locator('#playground').get_attribute('data-mode')=='standard' and state(page)['flags']==['billing'])
    apply(page)
    check(f'{lang}: undo clears flags',state(page)['result']=='idle' and state(page)['flags']==[])
    apply(page)
    for i in range(4):
        page.locator('#review button[aria-pressed]').nth(i).click()
        check(f'{lang}: invoice review step {i+1}',page.locator('#review button[aria-pressed]').nth(i).get_attribute('aria-pressed')=='true')
    page.locator('#review details summary').click()
    check(f'{lang}: invoice approval evidence preserved','review --approve' in page.locator('#review details').inner_text())
    page.locator('#playground details summary').click()
    violations=axe(page)
    check(f'{lang}: axe with demo and CLI open',not violations,violations)
    for i in range(3):
        button=page.locator('#anatomy button').nth(i);button.click()
        check(f'{lang}: metadata panel {i+1}',button.get_attribute('aria-expanded')=='true')
    page.locator('#start .copy-btn').first.click()
    check(f'{lang}: copy command reaches clipboard',page.evaluate('navigator.clipboard.readText()')=='npx llm-wiki-governance@latest quickstart --dry-run')
    check(f'{lang}: copy feedback',page.locator('#start .copy-btn').first.get_attribute('data-state')=='copied')
    page.evaluate("() => { navigator.clipboard.writeText=()=>Promise.reject(new Error('denied for test')); }")
    page.locator('#start .copy-btn').first.click()
    check(f'{lang}: denied clipboard gives a visible fallback',page.locator('#start .copy-btn').first.get_attribute('data-state')=='failed' and page.locator('.copy-failed').is_visible())
    page.locator('#start details summary').click()
    commands=page.locator('#start code').all_text_contents()
    check(f'{lang}: all eight verified install commands available',len(commands)==8 and any('mode set standard --write' in c for c in commands))
    for i in range(6): page.locator('#limits summary').nth(i).click()
    check(f'{lang}: all six limitations disclose',page.locator('#limits details[open]').count()==6)
    check(f'{lang}: axe after disclosures',not axe(page),axe(page))
    # Anchor destinations, logo and section-preserving locale switch.
    for target in ['#anatomy','#playground','#limits','#start']:
        page.locator(f'header a[href="{target}"]:visible').first.click()
        top=page.locator(target).evaluate('(e)=>e.getBoundingClientRect().top')
        check(f'{lang}: anchor {target}',abs(top-82)<3,top)
    page.locator('header > a').click();page.wait_for_timeout(900)
    check(f'{lang}: logo restores actual opening',page.evaluate('scrollY')==0 and page.locator('#hero-title').evaluate('(e)=>e.getBoundingClientRect().top')>82)
    page.locator('header a[href="#playground"]').click();page.locator('header .lang-switch').click()
    page.wait_for_load_state('load')
    other='en' if lang=='ko' else 'ko'
    check(f'{lang}: language retains section',page.url.endswith(f'/{other}/#playground'))
    check(f'{lang}: no runtime or request errors',not errors and not failed,errors+failed)
    ctx.close()

def layout_checks(browser):
    for lang in ['ko','en']:
        for w,h in [(1440,900),(1280,800),(390,844),(360,800),(320,640),(768,1024)]:
            ctx=browser.new_context(viewport={'width':w,'height':h},is_mobile=w<500,has_touch=w<500)
            page=ctx.new_page();page.goto(f'{SITE}/{lang}/');page.wait_for_timeout(1500)
            page.screenshot(path=str(SHOTS/f'{lang}-{w}-hero.png'))
            apply(page);choose(page,'shipping');apply(page)
            for summary in page.locator('details summary').all(): summary.click()
            metrics=page.evaluate("""() => ({overflow:document.documentElement.scrollWidth-innerWidth,cut:[...document.querySelectorAll('main pre,main code')].filter(e=>e.clientWidth>0&&e.scrollWidth>e.clientWidth+2).map(e=>e.textContent.slice(0,80)),number:document.querySelector('#playground [aria-live] > span:nth-child(2)').getBoundingClientRect().height,reviewNumberHeight:document.querySelector('#review [class*=reviewNumber]').getBoundingClientRect().height,reviewNumberFont:parseFloat(getComputedStyle(document.querySelector('#review [class*=reviewNumber]')).fontSize),reviewNumberLines:(()=>{const r=document.createRange();r.selectNodeContents(document.querySelector('#review [class*=reviewNumber]'));return new Set([...r.getClientRects()].map(x=>Math.round(x.top))).size})()})""")
            check(f'{lang}/{w}: complete page without overflow or clipped code',metrics['overflow']<=1 and not metrics['cut'] and metrics['reviewNumberLines']==1,metrics)
            if w in [1440,390]:
                # Use full page screenshots (fixed header in an element screenshot can appear mid-section).
                page.evaluate('document.querySelectorAll("details").forEach(e=>e.open=false)')
                page.evaluate('scrollTo(0,0)');page.wait_for_timeout(800)
                page.screenshot(path=str(SHOTS/f'{lang}-{w}-full.png'),full_page=True)
            if w<500:
                menu=page.locator('header button[aria-controls]');menu.click()
                check(f'{lang}/{w}: mobile menu',menu.get_attribute('aria-expanded')=='true' and page.locator('header nav').is_visible())
                page.locator('header nav a[href="#limits"]').click()
                check(f'{lang}/{w}: mobile anchor and menu closes',abs(page.locator('#limits').evaluate('(e)=>e.getBoundingClientRect().top')-72)<3 and menu.get_attribute('aria-expanded')=='false')
                sizes=page.locator('button:visible,summary:visible,#playground label:visible').evaluate_all('(es)=>es.filter(e=>e.getBoundingClientRect().height<43).map(e=>({text:e.textContent.slice(0,25),h:e.getBoundingClientRect().height}))')
                check(f'{lang}/{w}: controls have comfortable targets',not sizes,sizes)
            ctx.close()

def motion_and_keyboard(browser):
    ctx=browser.new_context(viewport={'width':1280,'height':800});page=ctx.new_page();page.goto(f'{SITE}/en/');page.wait_for_timeout(1700)
    page.keyboard.press('Tab')
    check('keyboard: skip link and visible focus',page.locator('.skip-link').evaluate('(e)=>e===document.activeElement&&getComputedStyle(e).outlineStyle!=="none"'))
    page.locator('#playground input[value=invoice]').focus();page.keyboard.press('ArrowRight');page.keyboard.press('Tab');page.keyboard.press('Space')
    check('keyboard: radio arrows, Tab, Space apply',state(page)['file']=='shipping' and state(page)['applied']=='true')
    page.locator('#playground input[value=standard]').focus();page.keyboard.press('ArrowRight')
    check('keyboard: governance mode arrows',state(page)['result']=='fail')
    page.locator('#anatomy button').first.focus();page.keyboard.press('Enter')
    check('keyboard: metadata disclosure',page.locator('#anatomy button').first.get_attribute('aria-expanded')=='true')
    page.locator('#limits summary').first.focus();page.keyboard.press('Enter')
    check('keyboard: limitations disclosure',page.locator('#limits details').first.get_attribute('open') is not None)
    # Slow wheel, fast jumps and reverse scrolling: no pinning or hijacking.
    page.evaluate('scrollTo(0,0)');page.wait_for_timeout(900)
    start=page.locator('[data-sculpture]').evaluate('(e)=>getComputedStyle(e).transform')
    for _ in range(8): page.mouse.wheel(0,100);page.wait_for_timeout(100)
    page.wait_for_timeout(800)
    moved=page.locator('[data-sculpture]').evaluate('(e)=>getComputedStyle(e).transform')
    check('motion: hero responds to slow scroll',start!=moved)
    for y in [3000,120,5000,500,0]: page.evaluate('(y)=>scrollTo(0,y)',y);page.wait_for_timeout(80)
    page.wait_for_timeout(1200)
    restored=page.locator('[data-sculpture]').evaluate('(e)=>getComputedStyle(e).transform')
    check('motion: fast and reverse scrolling restore original transform',start==restored,(start,restored))
    for w,h in [(390,844),(1280,800),(360,800),(1440,900)]: page.set_viewport_size({'width':w,'height':h});page.wait_for_timeout(300)
    check('resize: layout remains stable and has no pin spacers',page.evaluate('document.documentElement.scrollWidth<=innerWidth') and page.locator('.pin-spacer').count()==0)
    page.emulate_media(reduced_motion='reduce');page.wait_for_timeout(300)
    transform=page.locator('[data-sculpture]').evaluate('(e)=>getComputedStyle(e).transform')
    page.evaluate('scrollTo(0,600)');page.wait_for_timeout(300)
    check('reduced motion: runtime preference removes scroll transforms',transform=='none' and page.locator('[data-sculpture]').evaluate('(e)=>getComputedStyle(e).transform')=='none')
    page.emulate_media(reduced_motion='no-preference');page.wait_for_timeout(1700);page.locator('header > a').click();page.wait_for_timeout(1000)
    check('motion: preference can be restored without duplicate pins',page.evaluate('scrollY')==0 and page.locator('.pin-spacer').count()==0)
    ctx.close()
    ctx=browser.new_context(viewport={'width':390,'height':844},reduced_motion='reduce');page=ctx.new_page();page.goto(f'{SITE}/ko/');apply(page)
    duration=page.locator('[data-doc=billing]').evaluate('(e)=>getComputedStyle(e).transitionDuration')
    check('reduced motion: initial load and demo remain functional',state(page)['flags']==['billing'] and all(float(x.strip().removesuffix('s'))==0 for x in duration.split(',')),duration)
    ctx.close()

def routing(browser):
    page=browser.new_page();page.goto(f'{SITE}/');page.wait_for_url('**/ko/')
    check('routing: root opens Korean',page.url.endswith('/ko/'))
    for path in ['robots.txt','sitemap.xml','icon.svg','images/evidence-links.webp','og/og-ko.png','og/og-en.png']:
        check(f'routing: {path}',page.request.get(f'{SITE}/{path}').status==200)
    check('routing: unknown page is 404',page.goto(f'{SITE}/does-not-exist/').status==404)
    page.close()

def main():
    SHOTS.mkdir(exist_ok=True,parents=True)
    with sync_playwright() as p:
        b=p.chromium.launch()
        for lang in ['ko','en']: page_checks(b,lang)
        layout_checks(b);motion_and_keyboard(b);routing(b);b.close()
    (SHOTS/'verification.json').write_text(json.dumps(RESULTS,indent=2,ensure_ascii=False),encoding='utf-8')
    failures=[r for r in RESULTS if not r['pass']]
    print(f'\n{len(RESULTS)-len(failures)}/{len(RESULTS)} checks passed')
    return bool(failures)

if __name__=='__main__': raise SystemExit(main())
