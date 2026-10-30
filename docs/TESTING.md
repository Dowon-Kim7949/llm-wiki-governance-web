# Testing and accessibility — current redesign

The current implementation is documented in [REDESIGN_2026-10-30.md](REDESIGN_2026-10-30.md). Historical performance figures in earlier Git revisions describe earlier designs and do not describe this redesign.

## Local commands

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm run serve
# In another terminal:
npm run test:e2e
python tests/e2e/record_transitions.py
```

Install the test browser once with `python -m pip install playwright==1.56.0` and `python -m playwright install chromium`. Override `SITE_URL` for a different local origin or base path. `CANONICAL_BASE` sets the metadata origin expected by the browser tests. With the default local build, metadata names `http://localhost:3000` and the static server listens on port 4173.

## Automated coverage

The existing 15 unit tests preserve bilingual content parity, verified install commands and their write semantics, forbidden product claims, the nine source/mode outcomes, exact captured CLI excerpts and the legacy font subset's integrity. The current page uses Archivo for Latin and system Korean fonts; it does not preload the legacy Korean subset.

The Playwright suite in `tests/e2e/run_e2e.py` checks the actual static export:

- Korean and English route, language, metadata, image loading and runtime/request errors.
- All three source files × three governance modes, affected document names, CI results and raw captured output in both languages.
- Undo, file-switch reset, lite-to-standard action, uncited-file behavior and selected-scenario review steps/approval paths.
- Metadata disclosures, all eight install commands, successful clipboard writes and visible failure feedback, all six limitations.
- axe-core with WCAG A/AA and best-practice tags, including open CLI output and disclosures.
- Anchors aligned below the fixed header, logo return to scroll position zero, and locale switching with the current section.
- 1440×900, 1280×800, 768×1024, 390×844, 360×800 and 320×640, in both languages: the whole page with all disclosures open, overflow, clipped code, mobile menu and touch targets.
- Keyboard skip link/focus, native radio arrows, apply by Space and disclosures by Enter.
- Slow, rapid and reverse scrolling; the hero returns to its original transform.
- Repeated resize across breakpoints, no pin spacers, live reduced-motion changes and reduced-motion initial load.
- Root locale redirect, local assets and 404 behavior.

Screenshots, `verification.json` and the optional WebM recording are saved in `tests/e2e/screenshots/` (Git ignored). The recording script captures the hero, a shipping change, the matching review flow, metadata, installation, conclusion and logo return.

## Implementation decisions

The demo uses native radio groups, a toggle button and a polite atomic result announcement. A short result beside the action keeps feedback visible on mobile. Findings have text as well as color; `verified` is explicitly unchanged. Every selected source renders only its actual citation branches.

The metadata buttons expose expanded state and control IDs. Limitations and raw output use native `details`. Copy results are announced and failures leave a manual-copy instruction. Mobile controls are at least 44 px tall. Focus is visible, and mobile navigation can be closed with Escape.

GSAP effects are scoped and reverted on unmount or reduced-motion changes. A ResizeObserver refreshes ScrollTrigger after the page height changes. The sculpture moves less on narrow viewports. There is no pinning, scroll interception, continuous floating or hover-only information. Reduced motion removes scroll transforms, entrances and CSS transitions while preserving content and controls.

## Remaining verification limits

The browser checks use Chromium with emulated touch viewports. They do not replace testing on a physical phone, Safari or Firefox. axe and keyboard checks are automated; no manual NVDA or VoiceOver pass has been performed. Lighthouse, hardware frame timing and network-throttled performance have not been measured for this design. The 88 KB hero asset is an encoded still image, not a live 3D simulation.
