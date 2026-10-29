# Testing and accessibility

## Automated checks

| Command | What it checks |
| --- | --- |
| `npm run lint` | ESLint with `eslint-config-next` (core web vitals + TypeScript) |
| `npm run typecheck` | `tsc --noEmit`; the typed dictionaries make a missing translation a type error |
| `npm test` | `tests/unit/content.test.ts`: both languages have the same structure, publish the same verified commands with the same write/install labels, quote the real `impact` output per mode, and contain none of the forbidden claims. `tests/unit/display-font.test.ts`: the Korean display font holds exactly the Hangul of the h1/h2 lines (rerun `scripts/subset-display-ko.py` after changing a heading) |
| `npm run build` | static export to `out/` plus `out/index.html` and `out/404.html` |
| `python tests/e2e/run_e2e.py` | headless Chromium (Python Playwright), see below |

The browser suite follows the reconnaissance-then-action pattern of Anthropic's `webapp-testing` skill (loaded from the `example-skills` plugin since the second pass; first written from the skill's text in `anthropics/skills`). 83 checks. For both languages it checks:

- HTTP 200, `<html lang>`, one `h1`, canonical, `hreflang` (ko, en, x-default), `og:url`, a reachable `og:image`, Twitter card
- every link on the page answers (external links included; npm via the registry API)
- axe-core with WCAG 2.0/2.1/2.2 A and AA tags plus best practices, on the initial page and on the demo's most complex state
- the demo: step 6 in lite, standard and strict shows the matching real output
- keyboard: first Tab reaches the skip link, focus outline is visible, demo steps and modes work from the keyboard, the demo has a polite live region
- copy buttons put the exact command on the clipboard and confirm
- no horizontal overflow at 320, 360, 768 and 1440 px; screenshots in light and dark
- at 320 px the header is two rows: wordmark and language switch share the first, the menu fits the second
- on a 360 px phone, with and without reduced motion: choosing a demo step and using the pager both leave the record's heading on screen below the pinned stations, and focus stays on the chosen station; on desktop a station click does not scroll
- the Korean page loads the Korean display face once; the English page never requests it
- the hero animation runs normally and is off with `prefers-reduced-motion: reduce`
- `/` redirects to `/ko/`; the language switch keeps the section (`/ko/#demo` → `/en/#demo`) and changes `<html lang>`; unknown paths return 404 with content; sitemap, robots, icon and OG images are served

CI (`.github/workflows/pages.yml`) runs everything on every pull request and push, then repeats the browser suite against the live GitHub Pages URL after each deploy.

## Lighthouse

Lighthouse is run by hand, not in CI. Scores are Performance / Accessibility / Best practices / SEO.

- **First release** (2026-10-29): Korean mobile 96/100/100/100, English mobile 98, desktop 100. Conditions were not recorded.
- **Second pass** (2026-10-29): Lighthouse CLI 12.8.2, headless Chromium 141 (Playwright build 1194), default mobile preset (simulated slow 4G, 4× CPU) and `--preset=desktop`, on the live GitHub Pages URL from a Windows 11 laptop. Three runs before deploying `0d6b1d8` and three after, alternating pages. The PageSpeed Insights API was not available (anonymous daily quota exhausted).

| Page | Before: Performance (3 runs) | After: Performance (3 runs) | LCP median, before → after | CLS |
| --- | --- | --- | --- | --- |
| `/ko/` mobile | 80, 85, 85 | 96, 86, 93 | 2.37 s → 2.47 s | 0 → 0 |
| `/en/` mobile | 74, 80, 67 | 97, 93, 95 | 2.34 s → 2.23 s | 0–0.025 → 0 |
| `/ko/` desktop | 100, 93, 97 | 100, 100, 100 | 0.64 s → 0.72 s | 0 → 0 |
| `/en/` desktop | 100, 80, 100 | 100, 100, 100 | 0.50 s → 0.51 s | 0–0.019 → 0 |

Accessibility, Best practices and SEO were 100 in every run, except one pre-deploy English desktop run that scored SEO 92. The Performance score on this machine is driven by Total Blocking Time, which swung from 0 to 2.7 s with background load (most "before" runs were the busier ones). So read the change from LCP and CLS, not from the score. The Korean display face (14.6 KB, preloaded on `/ko/` only) moved the Korean LCP median by about +0.1 s, within run-to-run spread, with no layout shift. The LCP element on mobile is the hero lede paragraph, not the headline. Local runs against `npm run serve` are not comparable: that server does not compress, so it sends 665 KB where Pages sends 251 KB.

## Accessibility decisions

- States are never colour-only: each has a shape (open ring, triangle, flag, struck triangle) and a word.
- The demo is buttons and native radio inputs, so it works with Tab, Enter/Space and arrow keys. The current step uses `aria-current="step"`. Step changes are announced through one `aria-live="polite"` region. The plot SVG has a `<title>` that states the step and the doc state.
- A text version of the whole demo sits in a `<details>` below it.
- Horizontally scrollable code blocks are focusable so keyboard users can scroll them.
- Copy results are shown and announced (`role="status"`); a failed copy says what to do instead.
- Targets are at least 44×44 px; focus rings are 3px and use a dedicated colour in both themes.
- Reduced motion disables the one load animation and all transitions.
- Korean text uses `word-break: keep-all` so words are not split across lines.

## Known gaps

- Screen-reader testing was automated (axe, accessible names) only; no manual NVDA/VoiceOver pass has been done.
- The browser suite runs in Chromium only.
