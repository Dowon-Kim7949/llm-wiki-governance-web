> Historical design document. The current local redesign is described in [REDESIGN_2026-10-30.md](REDESIGN_2026-10-30.md).

# Design

## Brief

The official site for [LLM-WIKI Governance](https://github.com/Dowon-Kim7949/llm-wiki-governance) v1.42.0, a free, MIT-licensed CLI maintained by one developer. The audience is individual developers and small teams using Claude Code, Codex, Cursor and similar agents. The site has one job: let an unfamiliar developer understand what the tool records (citations, review state, change findings), what it does not prove, and run a safe first command. Korean is the default language; English is equally complete.

Starting concept from the brief: *Traceable Knowledge*. Process followed: Anthropic's `frontend-design` skill (two passes: token plan, review against generic defaults, then build and critique with screenshots). For the first release the skill was read from `anthropics/skills` and its process followed by hand. The second pass (2026-10-29, logged below) ran with the skill loaded from the `example-skills` plugin.

## Current direction: Alignment

Branch `design/alignment` (2026-10-30). The exploded view put the sentence the site is about on tilted plates too small to read, repeated one layout three times, and pinned scenes that broke the wordmark's return to the top. The weaknesses found on the live site, the narrative and the section-by-section plan are in [STORYBOARD.md](STORYBOARD.md); this section records the system.

- **Frontal figures.** A doc is a paper card (`#f4f6f2`, 2px ink border), code is a night card (`#0a1a27`), both flat and at reading size. Type inside a card is in `em`; each scene sets `--card-size` (hero `clamp(1rem, 0.55rem + 0.75vw, 1.25rem)`, anatomy 1.05rem, review up to 1.12rem, playground 0.95rem). `src/components/figure/Cards.tsx`.
- **Connectors.** SVG drawn from measured `[data-a]` anchors (`src/components/figure/Links.tsx`): straight when the claim row and the code row line up, stepped with rounded elbows when they do not, a bracket on the right when the cards stack on a phone. States: aligned (green, solid), shifted (magenta), draft (ochre, dashed), unchecked (grey, dotted), muted. `useAlign` moves a doc card so its claim sits on the row of the code it was approved against; when the code changes, the old row is the target, so the change reads as a step.
- **Status.** Needs review: magenta flag with "Look again" and a magenta border. Reviewed: green triangle, `verified`, the new `reviewed_at` highlighted. Unaffected: dashed circle and a word. Not checked (lite): crossed circle and a dotted grey connector. Every state is a word plus a shape plus a colour.
- **Two lights, kept.** Night is the system (code, change, checks); paper is the person. The review section is paper; the last section returns to night with the aligned mark.
- **Composition per section.** Full-width headline over a framed figure; a time axis; a specimen; a three-column bench; a paper desk with a step rail; a closing mark. No two adjacent sections share a layout.
- **Motion.** Three durations (`--dur-fast` 160 ms, `--dur-state` 420 ms, `--dur-scene` 780 ms) and two easings (`--ease-out`, `--ease-move`) in `globals.css`. State changes are eased; scroll scrubs only the drift timeline, where scroll is time. Nothing is pinned: the timeline is CSS `position: sticky` inside a tall track and GSAP's ScrollTrigger only reports progress (`src/components/scenes/Drift.tsx`, loaded with a dynamic import on wide screens with motion allowed). Reduced motion: transitions are instant, the opening shows its end state, the timeline is a static log.
- **Type.** Unchanged: Archivo for titles and text, the IBM Plex Sans KR subset for Korean display lines (now 62 Hangul glyphs, 17.7 KB), system mono for code. Korean titles break between clauses (`/(?<=[,.]) /`), the closing line one sentence per line.
- **Removed.** The axonometric camera (`src/lib/axo.ts`), the world renderer, the pinned opening, story and review scenes, `ScrollSetup` and `@gsap/react`.

## Earlier direction: Exploded view (2026-10-29)

Branch `design/immersive-redesign`. The reviewer rejected the first release as a long technical document and asked for a motion-driven product microsite. The concept comparison, the reference-video analysis and the scene-by-scene storyboard are in [STORYBOARD.md](STORYBOARD.md); this section records the system that came out of it.

- **One drawing.** The demo repository of `scripts/capture-playground.sh` drawn as an exploded axonometric view: source files on the floor, docs as paper plates above, each citation a vertical line from a doc down to the file it cites. A changed file shifts and every line hanging from it leans; review re-hangs the line. Every scene shows this same drawing from a different camera.
- **Two lights.** Night (`#0f2536`, plates `#16324a`, linework `#7fa6c0`, ink `#e4edf2`) is the system: code, change, checks. Paper (`#e8ebe6`, ink `#17232b`) is the person: reading, judging, using. Docs are paper in every light. The review scene turns the page from night to paper; readers who ask for dark pages get paper at dusk (`#24333d`).
- **Status.** Word + line dash + colour: draft lines dashed, verified lines solid green, a moved file's lines dotted, a flagged line solid magenta, plus the doc's status word and a flag with a word.
- **Type.** Archivo at width 110–118 and weight 820+ for titles (`--display-1/2/3`, a Korean size each), normal width for text; the IBM Plex Sans KR subset for Korean h1/h2; system mono for code. Titles are left-aligned and never break inside a word.
- **Camera.** `src/lib/axo.ts` is an orthographic camera (tilt, yaw, zoom, centre, lift). Each plate is HTML placed with one CSS `matrix()`, citation lines are SVG, so a frame costs a dozen transforms and no layout. `src/components/world/render.ts` draws a numeric `WorldState`; the same state always gives the same picture.
- **Motion.** GSAP ScrollTrigger pins and scrubs the opening, story and review on wide screens with motion allowed; everything else gets discrete beats over a sticky drawing. `useGSAP` with `gsap.matchMedia()` builds and reverts each mode. One unprompted moment: the opening drawing assembles on load.
- **Loading.** Text and controls ship in the first load. Drawings, GSAP and the scene motion load after the `load` event, when the browser is idle (`src/components/scenes/Motion.tsx`), so the first paint lays out text only.

## First release direction (kept as history)

### A. Survey Record (selected for the first release)

- **Thesis.** A land survey does not prove the map is right. It records measurements against fixed benchmarks, and when a benchmark is disturbed, the affected stations are re-surveyed. That is exactly the product: a doc (station) records which source it was measured against (benchmark, via a citation), an explicit review stamps it, and a source change flags it for another survey. It never claims the doc is true.
- **Type.** One variable family, Archivo, with its width axis doing the display work (wide, heavy headlines like drawing lettering; normal width for text). Korean h1/h2 lines are set in IBM Plex Sans KR Bold, an engineering face that matches the drawing lettering, cut to the 52 Hangul glyphs those lines use (14.6 KB, preloaded on the Korean page only, never requested by the English page). All other Korean text uses the platform's Korean UI face (Apple SD Gothic Neo, Malgun Gothic, Noto Sans KR).
- **Colour.** Field-book paper `#e8ebe6`, slate ink `#17232b`, flagging-tape magenta `#b0124f` for "changed, re-review", field green `#2b6146` for "verified", ochre `#7a5500` for "needs review". Dark mode has its own tuned values.
- **Layout.** Left-aligned, wide gutter, sections separated by survey rules. The workflow and the demo are drawn as a traverse (a numbered line of stations) because they are real sequences. The footer is a drawing's title block holding the version, baseline commit and licence.
- **Metaphor in the UI.** Square control points for sources, a document glyph for docs, survey lines for citations, a flag for a finding, a displaced benchmark with a dashed ghost of its old position for a change.
- **Motion.** One orchestrated moment: on load, the hero's disturbed line is surveyed and flagged. Everything else moves only in answer to the visitor (demo state changes). All of it is off under `prefers-reduced-motion`.
- **Mobile.** The hero drawing drops below the headline, capped at 34rem so it stays a figure; the demo's station names collapse to numbered buttons (names stay in the accessible name and in the record panel); the plot and the record stack. Below 60rem the station traverse is pinned while the demo is on screen, the mode box moves below the record, and a step chosen while the record's heading is off screen scrolls it into view (instantly under reduced motion; focus stays on the control).
- **Accessibility.** Every state is shape + word + colour (open ring, filled triangle, flag, struck triangle). The demo has a text version and a polite live region.
- **Risk of going generic.** Blueprint-blue grids and hairline "technical drawing" pastiche. Avoided by using the field-book palette instead of blueprint blue, keeping the grid faint, and using drawing devices only where they carry data (stations, title block).

### B. Margin Ledger (rejected)

- Docs as a manuscript; citations as marginal notes; review as a proof-reader's marks. Serif text face, cream paper, red editorial ink.
- Fits "docs as writing", but it cannot show change over time without a second metaphor, and cream + high-contrast serif + clay accent is the most common generated-design look today. It also suggests editorial correctness, which the tool explicitly does not check.

### C. Signal Box (rejected)

- Docs as railway signals: a source change trips a signal to red, review resets it to green. Dark panel, illuminated indicators.
- Strong sense of state change, but it implies automatic safety and truth (a green signal means "safe to proceed"), which overstates what a passing check means. It leans on red/green, and dark neon dashboards are a cliché for developer tools.

### Why A

A is the only direction whose core metaphor is honest about the limit: a survey measures against references and asks for a re-survey, it does not certify the territory. It gives the signature interaction (a benchmark moves, a line is flagged, depending on the governance mode) a natural visual form, and it avoids the three generic looks named in the skill.

## First release tokens

Defined in `src/app/globals.css` (`:root`, plus a dark-mode block):

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--paper` | `#e8ebe6` | `#121a1f` | page background |
| `--paper-raised` | `#f4f6f2` | `#1a252b` | panels, drawing background |
| `--ink` | `#17232b` | `#e5ebe7` | text, outlines |
| `--ink-soft` | `#46555c` | `#a9b6b3` | secondary text |
| `--rule` | `#9aa6a3` | `#5f6f6d` | rules, unchanged survey lines (decorative only) |
| `--flag` | `#b0124f` | `#ff6fa3` | changed source, write commands, findings |
| `--held` | `#2b6146` | `#7fd0a2` | verified, read-only commands |
| `--pending` | `#7a5500` | `#f0c060` | needs_review, simulation notice |
| `--focus` | `#0b57d0` | `#8ab4ff` | focus ring |

Type scale: ratio 1.25 from 17px (`--step--1` … `--step-4`, the last fluid). Spacing uses `--gutter` (fluid 1–2.5rem). Radii: 3px for controls, 10px for the two framed drawings, pills only for tags and toggles.

## First release components

| Component | Kind | Notes |
| --- | --- | --- |
| `app/[lang]/layout.tsx` | server | root layout per locale: `<html lang>`, metadata, hreflang, OG |
| `app/[lang]/page.tsx` | server | all sections; content from `src/content/{ko,en}.ts` |
| `HeroPlot` | server | static SVG with `<title>`/`<desc>` and a visible caption |
| `Demo` | client | the signature interaction; state is a pure function of (step, mode) |
| `CopyButton` | client | clipboard with visible and announced confirmation/failure |
| `LangSwitch` | client | full page load to the other locale, carrying the section hash |
| `Marker` | server/client | state shapes used in the key, the demo and the plot |

Content lives in typed dictionaries (`src/content/types.ts`), so a missing translation fails the type check, and `tests/unit/content.test.ts` asserts that both languages publish the same commands with the same side effects.

## Self-critique log

- First Korean hero line said "누가 읽었는지" (who read it). The tool records an approval, not a reading. Changed to "누가 승인했는지" to match the English and the product.
- First demo step 7 said "fix it and approve again". A real run showed `review --approve` refuses a doc that is still `verified` ("already verified"). The step now says the doc goes back to `needs_review` first, matching the tool's own remediation text.
- Mode toggles wrapped to two rows at desktop width and on a 360px phone; the panel was widened and padding reduced.
- On phones the header gave the language switch its own row and clipped the last menu item; header type was tightened.
- Second pass, `frontend-design` skill loaded as a plugin; live site captured at 360, 768 and 1440 px in light and dark. Choices below were approved before building.
- On a 360px phone, choosing demo step 4 left the record 300px below the screen, and the pager at the bottom pushed the next record's heading off the top. The traverse is now pinned, the mode box (it only matters from step 6) sits under the record, and a chosen step brings the record's heading into view. Keyboard focus stays where it was; the live region still announces. Tab order keeps the desktop reading order (stations, modes, record), so on phones the mode box is reached by Tab before it is seen.
- At 320px the header was three rows (148px; 192px in English). Cause: the phone padding for the language switch sat before its base rule in the file, so it never applied. Base rules now come first, and below 360px the menu is set slightly tighter. Both languages are now two rows (104px), as at 360px. The first fix fit with 1px to spare on Windows and failed in CI on Linux, where the same text set slightly wider; below 360px the row gap, wordmark tracking, logo and switch padding were trimmed for about 13px of slack in Korean.
- Korean headings were the OS UI face (Malgun Gothic on Windows), so the Korean page lost the drawing-lettering voice that Archivo gives the English one. Chose IBM Plex Sans KR Bold over the usual Korean web defaults because its engineering construction fits a survey record. Plex is narrower than Malgun, which split "누가 / 승인했는지" across lines at 1440px; Korean hero clauses are now unbreakable units and tracking eased from -0.035em to -0.02em. Lighthouse showed the font discovered late (after layout) when it was not preloaded, so it is declared in the layout and preloaded on `/ko/` only.
- The hero opened with a "LLM-WIKI Governance" label directly under the identical wordmark: a label above content that said nothing new. Removed.
- At 768px the hero drawing stretched to the full column and became a second screen. Capped at 34rem below the two-column breakpoint.
- Considered and not done: pushing the Survey Record metaphor further into the hero and demo. The drawing already carries it in one place; adding more would spend boldness twice.
- Immersive redesign (branch `design/immersive-redesign`), `frontend-design` skill loaded as a plugin. The reviewer's verdict on the first release was that it read as a manual. Three directions were drawn up (exploded view, registration, signal trace; see STORYBOARD.md); the first plan for the exploded view was "nodes joined by curved glowing lines on dark", which is the default AI-tool picture, so lines became straight verticals and nodes became real files and docs.
- The first story camera was so close that the doc covered its own citation line, which then showed only as a stub; the lean, the one thing the scene is about, was invisible. The camera moved back and the plates were lifted further apart.
- The first build coloured every line of a flagged doc magenta, including billing.md's line to shipping.js, which had not changed. impact names the changed file, so only the lines to the changed file turn into flags now.
- Phones showed empty drawings: `gsap.matchMedia()` runs a callback only while one of its conditions matches, and a phone with motion allowed matched none. An always-true condition fixed it; an e2e check now asserts every drawing renders on a phone.
- The playground's terminal appeared on the first commit and pushed the page 400 px down, so the review scene below pinned at the wrong place. The terminal keeps its space while idle, and any later height change refreshes ScrollTrigger.
- Re-review was first drawn as billing.md sliding over the moved file. billing.md also cites shipping.js, so that tilted a second line. Now only the rewritten claim's pin moves, which is also what happens: the sentence changed, not the whole doc.
- The review scene mixed its background from night to paper across five beats and passed through grey mud with unreadable captions. The drawing now lightens beat by beat; the page itself turns to paper only on the last beat, and the captions sit on paper cards throughout.
- Lighthouse on mobile put the redesign 10 points behind main at first. The four drawings were in the server HTML with layered plates, and GSAP shipped in the first load. Drawings and motion now load after `load`; the first load is within 3 KB of main and, in a throttled real browser, the lede paints at the same time as on main. Lighthouse's simulated mobile LCP still trails by 0.3–0.6 s (TESTING.md).
- English titles broke inside words at 1920 px ("change / s") because display type inherited `overflow-wrap: break-word`. Titles wrap between words only.
- The production build strips GSAP's banner comment; the GSAP licence forbids removing its notices, so the footer's title block names GSAP and links its licence.
- Considered and not done: a continuous camera "dive" from the opening into the story (the opening ends on a flagged doc and the story starts from a draft, so a continuous shot would play time backwards), a custom cursor, and a chapter rail.
- Alignment pass (branch `design/alignment`), from a review of the live exploded view at 1440, 1280, 390 and 360 px. The logo bug reproduced exactly as reported: from the footer the wordmark set `#top` and left the page at scrollY 1949 inside the pinned opening, headline faded out. No section is pinned now; an e2e check clicks the wordmark from the bottom and expects scrollY 0 with the headline and both actions in view.
- The first hero kept the title in the left column, and IBM Plex Sans KR split "근거는 / 어긋납니다." The title now spans the full width on its own row.
- `useAlign` lifted the hero's doc card to meet the code line, over the figure's top edge and toward the title. The code card now sits lower (`margin-top: 4.5rem`), so the doc settles downward into line; the review desk got the same room. The hero's minimal doc card names only `billing.md`, so its title never wraps.
- Cards first set in `rem` read small at 1440 px next to the display type. Card type moved to `em` with a size per scene.
- Evidence such as `src/invoice.js#symbol:computeTotal` broke inside the fragment on phones. Playground cards show the path only; full cards move the fragment to the next line whole.
- In the drift timeline the stale bar ran under the agent label (now its own row); the "now" line crossed commit labels (it spans the axis and the doc lane only); and the bar's label was clipped mid-word as it grew (the bar is never narrower than its words).
- Commits "now" had not reached were at 16% opacity, which axe flagged as unreadable text. They are set back with colour, weight, a hollow dot and 72% opacity, which keeps 4.5:1.
- On phones the playground's result was a full screen below the apply button, and the review's step text came after the desk. The apply button now follows the mode choice, so the result is directly under it; the review reads rail, step text, desk, pager. Tab order follows the visual order in both.
- A file no doc cites used to end in "review billing.md" with no explanation. The next step now says no doc needs review and offers the review section as an example with billing.md; the review section's lede says the same.
- Considered and not done: keeping scroll-driven steps for the review (a rail of buttons is quicker, reversible and readable at any speed), a horizontal scroll section, and a custom cursor.
