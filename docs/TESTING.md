# Testing and accessibility - persistent viewport stage

The current architecture is documented in [STAGE_REDESIGN_2026-10-30.md](STAGE_REDESIGN_2026-10-30.md). The subsequent [typography and responsive refinement](TYPOGRAPHY_2026-10-30.md) adds Jalnan Gothic and shared layout regions. The earlier REDESIGN report describes the previous vertical landing page, not this implementation.

## Reproduce

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm run serve
# In another terminal:
npm run test:e2e
npm run test:layout
python tests/e2e/record_transitions.py
```

Install browser dependencies with `python -m pip install playwright==1.56.0 Pillow` and `python -m playwright install chromium`. The default static server is http://localhost:4173. `SITE_URL` overrides the browser-test origin. Tests run against the static export, not a mock of the animation.

## Verified scope

The production build, ESLint, TypeScript and all 15 existing unit tests pass. The current browser suite (`tests/e2e/stage.py`, also available through the previous `run_e2e.py` entry point) reports **182/182 passing checks** in Chromium.

Coverage includes:

- Both locale routes, decoded hero image and runtime/asset errors.
- The same stage rectangle at 63 intermediate scroll positions per language: top zero, height equal to the viewport and no following section intruding.
- Code-change state preserving approval status; explicit downgrade, edit and approval sequence; the same states restored by reverse scrolling.
- Real wheel input, rapid jumps, all six chapter links, direct chapter URLs, language switching with a chapter, logo return to scroll zero and installation alignment below the header.
- All three files by three governance modes, exact affected document names and captured CLI output, undo and file-switch reset. Next actions for lite and uncited sources.
- Eight installation commands, clipboard success and readable failure, open disclosures and the complete ending.
- Keyboard focus, native select operation, Space to apply, Enter to open a disclosure, polite result announcements and inactive scene controls being inert.
- axe-core A/AA and best-practice checks in change, review, open-reference and reduced-motion states.
- Both languages at 1440x900, 1280x800, 1366x768, 1920x1080, 2560x1440, 3840x2160, ultrawide 3440x1440, 390x844, 360x800 and 320x640. Chapter boundaries, headline/graphic separation and the fully expanded reference area are inspected for overflow. Mobile screenshot pixels also check that the source expression actually paints.
- Mid-story resize across desktop/mobile breakpoints preserving the edited state. Reduced-motion preference at initial load and while running, manual reader switching, and complete no-JavaScript fallback.

The additional `tests/e2e/typography.py` suite reports **93/93 passing checks**. It measures actual rendered collisions, essential-content clearance and line attachments in both locales, including 1920x700, repeated chapter navigation, direct Evidence/Review URLs, both language-switch directions, cold font loading and intermediate/reverse transitions. CDP verifies Jalnan Gothic glyph rendering at weight 400, and the English route makes no Korean-font request. Artifacts are in `test-results/typography/`.

## Rendered review and artifacts

Local, Git-ignored artifacts live in `test-results/stage/`:

- `verification.json`: individual checks and outcomes.
- `ko-<width>x<height>-<time>.png` and `en-...`: chapter screenshots across the viewport matrix. Times 0, 2.35, 3.35, 5.36 and 6.0 show the opening, disagreement, impact, recorded approval and resolved connection.
- `<locale>-reference.png`, `<locale>-ending.png`, mobile installation/demo captures.
- `main-transitions.webm`: continuous desktop forward and reverse scroll, wheel input, chapter navigation, installation and logo return.
- `mobile-transitions.webm`: a separate 390x844 forward/reverse recording without resizing the video frame.
- `motion-contact-sheet.jpg`: timestamped frames inspected from a local transition recording. Sequential frames around the opening-to-evidence transition were also inspected.
- `current-recording.jpg`: timestamped observations of the supplied OLD-site recording; it was not treated as a desired art-direction reference.

The first three scenes were rendered and refined before the remaining scenes were added. Screenshots exposed small-screen text overlaps, impact labels covering document names and a Chromium sticky/overflow:clip text-paint defect; these were corrected in the implementation. The full-page inspection includes the installation and optional demo, not only the opening.

## Limits of this verification

These are Chromium browser tests with emulated mobile viewports. Physical-device browser chrome, Safari, Firefox, NVDA and VoiceOver have not been manually tested. No Lighthouse score, low-end GPU frame-time measurement or network-throttled performance result is claimed. Video is a local Chromium rendering capture, not a measurement of hardware performance. The opening asset remains a flat bitmap; its transition does not simulate a physically deforming chain.

All changes remain local. No push or deployment was performed for this task.
