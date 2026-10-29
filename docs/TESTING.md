# Testing and accessibility

## Automated checks

| Command | What it checks |
| --- | --- |
| `npm run lint` | ESLint with `eslint-config-next` (core web vitals + TypeScript) |
| `npm run typecheck` | `tsc --noEmit`; the typed dictionaries make a missing translation a type error |
| `npm test` | 15 unit tests. `content.test.ts`: both languages have the same structure and the same scene beats, publish the same verified commands with the same write/install labels, and contain none of the forbidden claims. `transcripts.test.ts`: every CLI line the site quotes appears verbatim, in order, in the captured v1.42.0 output in `docs/evidence/`, with the captured exit code. `playground.test.ts`: the playground's state model gives the captured `impact` result, exit code and flagged docs for all nine file and mode pairs. `display-font.test.ts`: the Korean display font holds exactly the Hangul of the h1/h2 lines (rerun `scripts/subset-display-ko.py` after changing a heading) |
| `npm run build` | static export to `out/` plus `out/index.html` and `out/404.html` |
| `python tests/e2e/run_e2e.py` | headless Chromium (Python Playwright), see below |

The browser suite follows the reconnaissance-then-action pattern of Anthropic's `webapp-testing` skill (loaded from the `example-skills` plugin). 92 checks:

- per language: HTTP 200, `<html lang>`, one `h1`, canonical, `hreflang` (ko, en, x-default), `og:url`, a reachable `og:image`, Twitter card, every link answers (external links included; npm via the registry API), no console errors, no failed requests
- axe-core with WCAG 2.0/2.1/2.2 A and AA tags plus best practices, on the initial page and on the playground with output
- the playground, per language: all nine file × mode pairs show the result, exit code and flagged docs of the captured CLI run
- keyboard: first Tab reaches the skip link, focus outline is visible, arrow keys pick a file, Space commits, arrow keys switch mode, the result is a polite live region; focus on a caption that is not on screen yet scrolls its pinned scene to that beat
- copy: the preview command reaches the clipboard and the button confirms; all 8 commands are listed in the expandable section
- no horizontal overflow at 320, 360, 768, 1440 and 1920 px; screenshots in light and dark
- at 320 and 360 px the wordmark and the language switch share the first header row
- desktop with motion: three pinned, scrubbed scenes; the scroll hint leaves once scrolling starts; the story's last beat flags billing.md while it stays verified, and scrolling back undoes it; after ten random jumps the story lands exactly on the beat it stops at; the review's last beat is re-approved, rewritten and on paper, and scrolling back shows needs_review; crossing the 64rem breakpoint switches every scene to discrete beats and back with no duplicate pins
- the playground under a burst of 14 inputs 25 ms apart settles on the state its controls show
- reduced motion: nothing is pinned or scrubbed, the opening drawing is complete at once, every caption is visible text, a caption switches the drawing instantly, the playground still works
- phone (360 px, touch): no pinned scenes, every drawing renders, reaching the last story caption flags the doc
- the Korean page loads the Korean display face once; the English page never requests it
- `/` redirects to `/ko/`; the language switch keeps the section (`/ko/#playground` → `/en/#playground`) and changes `<html lang>`; a `#section` link lands on its section after the scenes are pinned; unknown paths return 404 with content; sitemap, robots, icon and OG images are served

CI (`.github/workflows/pages.yml`) runs everything on every pull request and push, then repeats the browser suite against the live GitHub Pages URL after each deploy.

## Redesign measurements (branch `design/immersive-redesign`, 2026-10-29)

Measured on a Windows 11 laptop with both builds served side by side by a local server that, like GitHub Pages, gzips text and sets `max-age=600` (the repository's `npm run serve` does not compress, so it is not used for timing). Runs alternate main and branch so machine load hits both alike.

**Page weight on first load** (gzip; both include a 39.5 KB `noModule` polyfill that modern browsers skip):

| | main (`176c333`) | redesign |
| --- | --- | --- |
| JavaScript | 174.9 KB | 177.7 KB |
| CSS | 5.3 KB | 6.1 KB |
| HTML (`/ko/`) | 17.8 KB | 15.6 KB |

GSAP, the scene motion and the drawings load after the `load` event, when the browser is idle: 44.4 KB of JavaScript plus about 2 KB of CSS. The drawings are decorative and are not in the server HTML.

**Lighthouse 12.8.2** (headless Chromium 141, default mobile preset and `--preset=desktop`). Medians; SEO is 92 for both builds in every run because the local server's `robots.txt` audit fails, which does not happen on Pages.

| Page | main: Performance, LCP | redesign: Performance, LCP | CLS |
| --- | --- | --- | --- |
| `/ko/` mobile, 5 runs | 81, 2.73 s | 73, 3.02 s | 0 / 0 |
| `/en/` mobile, 2 runs | 94–96, 2.41 s | 87–94, 2.99 s | 0 / 0 |
| `/ko/` desktop, 2 runs | 100, 0.57 s | 100, 0.63 s | 0 / 0 |
| `/en/` desktop, 2 runs | 100, 0.58 s | 100, 0.57 s | 0 / 0 |

Accessibility and Best practices were 100 in every run. Total Blocking Time swung from 105 to 900 ms with machine load in both builds. Speed Index is higher on the redesign (Korean mobile median 2.7 s against 2.0 s) because the opening drawing assembles after load.

**The same pages in a real browser** (Playwright, 412×823 phone, 4× CPU, 150 ms latency, 1.6 Mbit/s, LCP from `PerformanceObserver`): Korean LCP median 1,140 ms (main) and 1,100 ms (redesign) over 5 runs each; English 940 ms and 972 ms over 3 runs. In both builds the LCP element is the hero lede and LCP equals FCP. Lighthouse's simulated LCP on mobile counts the requests that start before the observed LCP, which is where the redesign's deferred chunks fall; in the browser the lede paints at the same time as on main.

**Motion and memory** (headless Chromium, so software compositing):

- Wheel-scrolling through the opening, the story and the playground: 1440×900, 219 frames, median 16.7 ms, 95th percentile 16.8 ms, none over 33 ms; 360×780 with 4× CPU, 182 frames, same figures.
- Crossing the 64rem breakpoint three times and back: listeners on `window` (12) and `document` (154), pinned scenes (3) and JS heap (9.5 MB) are unchanged.
- `next dev` (React Strict Mode runs effects twice): three pinned scenes, four drawings, no console errors or hydration warnings.

## Earlier Lighthouse records (main)

Lighthouse is run by hand, not in CI. Scores are Performance / Accessibility / Best practices / SEO.

- **First release** (2026-10-29): Korean mobile 96/100/100/100, English mobile 98, desktop 100. Conditions were not recorded.
- **Second pass** (2026-10-29): Lighthouse CLI 12.8.2, headless Chromium 141, default mobile preset and `--preset=desktop`, on the live GitHub Pages URL. Korean mobile LCP median 2.37 s before and 2.47 s after the Korean display face, with no layout shift; desktop 100. The PageSpeed Insights API was not available (anonymous daily quota exhausted).

## Accessibility decisions

- States are never colour-only: each has a shape (status word, dash pattern of the citation line, a flag with a word, a triangle seal) and a word.
- The playground is a native radio group for files, a button for the change and a native radio group for modes, so it works with Tab, arrow keys and Space. Its result is announced through one `aria-live="polite"` region; the drawing is `aria-hidden` and everything it shows is also said in text.
- Every scroll scene's captions are ordinary text in reading order. Under reduced motion, on phones and on tablets below 64rem nothing is pinned or scrubbed: captions scroll past a sticky drawing that changes when a caption reaches the middle of the screen (instantly under reduced motion).
- On wide screens with motion, a scene is pinned while its beats are scrubbed by scroll; scrolling back reverses it exactly. Keyboard focus on a caption that is not on screen yet scrolls the scene to that caption's beat.
- The page has one unprompted animation (the opening drawing assembling, 1.1 s); reduced motion skips it.
- Horizontally scrollable code blocks are focusable so keyboard users can scroll them.
- Copy results are shown and announced (`role="status"`); a failed copy says what to do instead.
- Targets are at least 44×44 px; focus rings are 3px in a colour tuned for each light.
- Korean text uses `word-break: keep-all` and titles never break inside a word.

## Known gaps

- Screen-reader testing was automated (axe, accessible names) only; no manual NVDA/VoiceOver pass has been done.
- The browser suite runs in Chromium only; the scenes have not been checked in Safari or Firefox.
- Frame timing comes from headless Chromium, not a phone.
