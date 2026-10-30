# Testing and accessibility

## Automated checks

| Command | What it checks |
| --- | --- |
| `npm run lint` | ESLint with `eslint-config-next` (core web vitals + TypeScript) |
| `npm run typecheck` | `tsc --noEmit`; the typed dictionaries make a missing translation a type error |
| `npm test` | 15 unit tests. `content.test.ts`: both languages have the same structure and tell the same story step for step (review steps, timeline commits, anatomy parts, opening captions), publish the same verified commands with the same write/install labels, and contain none of the forbidden claims. `transcripts.test.ts`: every CLI line the site quotes appears verbatim, in order, in the captured v1.42.0 output in `docs/evidence/`, with the captured exit code. `playground.test.ts`: the playground's state model gives the captured `impact` result, exit code and flagged docs for all nine file and mode pairs. `display-font.test.ts`: the Korean display font holds exactly the Hangul of the h1/h2 lines (rerun `scripts/subset-display-ko.py` after changing a heading) |
| `npm run build` | static export to `out/` plus `out/index.html` and `out/404.html` |
| `python tests/e2e/run_e2e.py` | headless Chromium (Python Playwright), see below |

The browser suite follows the reconnaissance-then-action pattern of Anthropic's `webapp-testing` skill (loaded from the `example-skills` plugin). 114 checks:

- per language: HTTP 200, `<html lang>`, one `h1`, canonical, `hreflang` (ko, en, x-default), `og:url`, a reachable `og:image`, Twitter card, every link answers (external links included; npm via the registry API), no console errors, no failed requests
- axe-core with WCAG 2.0/2.1/2.2 A and AA tags plus best practices, on the initial page and on the playground with the CLI output open
- the playground, per language: all nine file × mode pairs announce the flagged docs (or "none") and show the exit code and the captured CLI result; it opens with nothing applied; picking another file after applying undoes the change and says so; a file no doc cites passes and offers the billing.md review as an example; undo returns to the start; a burst of 14 inputs 25 ms apart settles on the state its controls show; the CLI output opens in place with no scroll box of its own
- the opening, per language: it plays once to the flagged state, Replay starts over and ends flagged again, and the wordmark clicked from the bottom of the page returns to scrollY 0 with `#top`, the headline and both actions in view
- menu links land each section just below the sticky header at 1440 and 390 px
- keyboard: first Tab reaches the skip link, focus outline is visible; in the playground arrow keys pick a file, Tab and arrows pick a mode, Tab reaches the apply button and Space applies; the review rail and pager work with Enter; Enter opens a step's commands
- review, per language: the approve step shows `verified` and `2026-10-29`, the downgrade step `needs_review`, the read step the original approval; there is no previous step on the first
- copy: the preview command reaches the clipboard and the button confirms; all 8 commands are listed in the expandable section
- at 320, 360, 390, 768, 1280, 1440 and 1920 px in both languages, with every disclosure open: no horizontal overflow, no element that scrolls inside the page, no command cut off; screenshots, plus dark mode at 1440
- at 320 and 360 px the wordmark and the language switch share the first header row; on a 360 px touch phone, buttons, menu links, disclosures and choices are at least 44 px tall, the timeline is a static log, and the playground's result starts right under the apply button
- desktop with motion: the drift timeline is scrubbed; scrolling to 5, 50, 75, 100, 50 and 5% shows the same state for the same position each way; after seven rapid jumps it matches where it stopped; crossing the 64rem breakpoint switches it to the static log and back
- reduced motion: the opening shows its end state at once, the timeline is a complete static figure no taller than 1.6 screens, the playground works with no transitions
- the Korean page loads the Korean display face once; the English page never requests it
- `/` redirects to `/ko/`; the language switch keeps the section (`/ko/#playground` → `/en/#playground`), changes `<html lang>` and lands the section below the header; unknown paths return 404 with content; sitemap, robots, icon and OG images are served

CI (`.github/workflows/pages.yml`) runs everything on every pull request and push, then repeats the browser suite against the live GitHub Pages URL after each deploy.

## Exploded-view measurements (branch `design/immersive-redesign`, 2026-10-29)

These describe the previous design. Page weight and Lighthouse have not been re-measured for the alignment design (see Known gaps).

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

- States are never colour-only: needs review is a flag with a word and a border, reviewed is a triangle with `verified` and a date, unaffected is a dashed circle with a word, not checked is a crossed circle; connectors differ by dash pattern as well as colour.
- Text that must be read is never tilted or scaled down with a drawing; cards are flat and sized in `em` per scene.
- The playground is a native radio group for files, a native radio group for modes and a toggle button (`aria-pressed`) for the change, in that order in the DOM and on screen. The result is a definition list; a polite live region announces the CI result and the flagged docs; the map is `aria-hidden` and everything it shows is also in the result.
- The review is a rail of buttons (`aria-current="step"`) plus previous/next; the step text is a polite live region; the desk is `aria-hidden` and its states are in the step text.
- Nothing is pinned and nothing moves the page on its own. The drift timeline is sticky on wide screens with motion and reads the same at any scroll speed and in either direction; elsewhere it is a static log.
- The page has one unprompted animation (the opening, 2.2 s, once); reduced motion opens on its end state.
- Commands and CLI output wrap; no block scrolls on its own, so nothing needs a focusable scroll container.
- Copy results are shown and announced (`role="status"`); a failed copy says what to do instead.
- Targets are at least 44 px tall on phones; focus rings are 3px in a colour tuned for each light; the sticky header never covers a section a link lands on (`scroll-padding-top`).
- Korean text uses `word-break: keep-all`; titles break between clauses and never inside a word.

## Known gaps

- Screen-reader testing was automated (axe, accessible names) only; no manual NVDA/VoiceOver pass has been done.
- The browser suite runs in Chromium only; the site has not been checked in Safari or Firefox.
- Page weight, Lighthouse and frame timing have not been re-measured for the alignment design.
- Earlier frame timing came from headless Chromium, not a phone.
