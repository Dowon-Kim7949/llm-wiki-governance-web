# Immersive redesign: concept and storyboard

Branch `design/immersive-redesign`, started 2026-10-29. This replaces the long
document page (seven evenly spaced sections, about 8,100 px tall at 1905 px) with
five scenes. Product facts stay pinned to v1.42.0; every CLI output the site
quotes comes from `scripts/capture-playground.sh` or `scripts/capture-demo.sh`.

## Why the current site was rejected

- It reads as a manual: heading, intro, grid, repeated seven times on one paper
  background. Nothing changes as you scroll; the only motion is one load line.
- The idea needs reading: a four-line headline and a five-line lede come before
  any picture of what the tool does. The drawing is small and static.
- The demo (the one place the product is shown working) sits at 45% of the page
  and needs seven steps plus a mode toggle before the point lands.
- Eight command cards take a quarter of the page.

## Reference video, what was taken and what was not

`design-references/interaction-reference.mp4` (56.9 s, 1918×1078, a template
agency site, desktop only) was inspected at 2 frames per second with scene-cut
detection. It is not in the repository.

Taken as principles: one statement per screen; pinned sections whose content
changes while the frame holds; dark and light scenes alternating as rhythm;
type layered with objects; scroll-scrubbed motion that reverses exactly (the
second half of the recording scrolls back to the top and every transition
unwinds); cards that change state under the pointer.

Not taken: the mascot, device mockups, starfield, blue brand colour, centred
two-line headlines with one coloured keyword, persona cards, marquee bands,
number scrambles and the custom cursor trail.

## Three directions

### A. Exploded view (selected)

- **Thesis.** A codebase and its docs drawn as one exploded axonometric view.
  Source files lie on the floor plate; docs float above as plates; each
  citation is a vertical line from the doc down to the file it cites. When a
  file changes it shifts, and every line hanging from it leans. A person reads,
  fixes and re-approves, and the line hangs straight again.
- **Identity.** Engineering drawing at full-viewport scale, in two light
  conditions: night (the system: code, change, checks) and paper (the person:
  reading, judging, using). Real code, real frontmatter, real CLI output on the
  plates; no abstract nodes.
- **Colour.** Night `#0f2536`, night plate `#16324a`, linework `#7fa6c0`; paper
  `#e8ebe6` with slate ink `#17232b`. Status keeps its word and shape and takes
  magenta (changed), green (verified) and ochre (needs review), tuned per light.
- **Type.** Archivo at full width (wdth 125, weight 800+) for scene titles,
  normal width for text; Korean titles in the Plex Sans KR subset; system mono
  for code. Titles are left-aligned like drawing titles.
- **Motion grammar.** Camera tilt (plan view to axonometric) means "see the
  structure"; plates separating means "knowledge sits on code"; a file shifting
  means "change"; a line leaning means "the anchor moved"; a pulse climbing a
  line means "the check traces the change back to the doc"; the light coming on
  means "a person looks". No particles, glows or gradients.
- **Signature interaction.** Pick a file, see which docs hang from it, commit a
  change, switch lite/standard/strict, and read the real `impact` output and
  the CI result.
- **Mobile.** Portrait framing of the same drawing; pinned scrubbing becomes
  discrete beats over a sticky drawing; the playground stacks.
- **Accessibility risk.** Skewed text on plates is decorative and duplicated in
  real text; camera moves can trouble vestibular users (reduced motion removes
  them); colour never carries a state alone.
- **Performance risk.** Per-frame transforms on a dozen layers and a few SVG
  lines; mitigated by composited transforms, fixed plate layout (no layout per
  frame), no WebGL, ScrollTrigger updates only while a scene is active.

### B. Registration

Docs as an overlay printed in register over the code; a change knocks the
plates out of register (a doubled image); review re-registers them; strict
stops the press. Flat poster graphics, overprint colour, crop marks.
Rejected: "out of register" reads as "the doc is wrong", which the tool never
claims; the print metaphor is a step removed from developers; the riso look is
a current design-site default.

### C. Signal trace

Git history as a horizontal tape running under instruments; docs are sensors
anchored to code; commits are tremors; the mode sets sensitivity. Rejected:
horizontal scroll-jacking, a runtime-monitoring reading the product does not
support, and an oscilloscope look that drifts to dark-plus-green.

### Review against generic defaults

The first plan was "dark background, nodes joined by curved lines, glowing
pulses". That is the default AI-tool picture, so it was changed: lines are
straight verticals (a citation is a plumb line, not a network edge), nodes are
real files and real docs, nothing glows, and the dark scenes are a coloured
night, not near-black. The centred headline with one coloured word seen in the
reference became left-aligned titles with no single-word accent.

## Scenes

Desktop is 64rem and wider with motion allowed. "Discrete" means phones,
tablets below 64rem, and anyone with `prefers-reduced-motion: reduce`: the
drawing sticks to the top of the scene and changes state when each caption
reaches the middle of the screen (instantly under reduced motion).

### 01 Opening (night)

1. **Sees first.** The headline "When code changes, the docs need another look."
   on the left; on the right a single doc, billing.md, face-on like a page,
   with its frontmatter (`status: verified`). Two links: get started, try a change.
2. **Trigger.** Once the page has loaded, the one orchestrated moment plays (1.1 s); then scroll.
3. **Moves.** On load the camera tilts a little and the code floor appears under
   the doc, with the citation lines dropping to `src/invoice.js` and
   `src/shipping.js`. Scrolling tilts further and separates the plates: a second
   doc, the third file, the whole floor. Then `src/invoice.js` shifts; its line
   leans; a pulse climbs to billing.md and a flag appears.
4. **Means.** Docs hang from the code they cite; a change tilts that tie.
5. **Understands.** What the product is about, before reading a paragraph.
6. **Mobile.** No pin. Headline, the drawing at the tilted angle, one line of
   text and both links. The load moment still plays.
7. **Reduced motion.** The tilted frame, static, with all text.

### 02 One doc, one function (night, pinned)

1. **Sees first.** billing.md above `src/invoice.js`, close up, joined by one line.
2. **Trigger.** Scroll (scrubbed, five beats over about four screens).
3. **Moves.** (1) The cited sentence and `computeTotal` light up and the line is
   drawn. (2) Status turns from `needs_review` to `verified`, `reviewed_by` and
   `reviewed_at` are stamped. (3) The file shifts; the old line is struck and
   the new one slides in. (4) Nothing moves on the doc; the line leans; the
   status stays `verified`. (5) A pulse climbs the line and a flag reading
   `impact.source_changed` lands on the doc.
4. **Means.** Cause and effect: an approved claim, a changed source, an
   unchanged doc, a reason to look again. The flag is not a verdict.
5. **Understands.** What a citation, an approval and a finding are.
6. **Mobile.** Discrete beats over the sticky drawing.
7. **Reduced motion.** Discrete beats with instant changes; every caption is
   ordinary text.

### 03 One change, three settings (night, interactive)

1. **Sees first.** The full drawing at rest (three files, two docs, three lines),
   three numbered controls (file, change, mode), a terminal and a CI gate.
2. **Trigger.** Clicks and keys, independent of scroll.
3. **Moves.** Choosing a file lights it and every line and doc hanging from it.
   Committing shifts the file and leans its lines. The mode decides what
   happens next: lite, nothing is checked; standard, the docs are flagged and
   the gate stays open with a warning; strict, the docs are flagged and the gate
   closes (exit 1). The uncited file changes with no doc flagged in any mode.
4. **Means.** The same change is reported differently by configuration, and
   detection follows citations, file by file.
5. **Understands.** Which mode to pick, and that lite (the default) is silent.
6. **Mobile.** Controls, drawing and terminal stack; the drawing reframes.
7. **Reduced motion.** Same controls; visual changes are instant.

### 04 A person looks again (night to paper, pinned)

1. **Sees first.** The flagged billing.md over the shifted file, at night.
2. **Trigger.** Scroll (scrubbed, five beats).
3. **Moves.** (1) The light comes up; doc and changed code are shown side by
   side. (2) Approving a still-verified doc is refused; `drift --downgrade`
   turns it back to `needs_review`. (3) The sentence is rewritten. (4) `review
   --approve` stamps a new date; the doc plate slides over the moved file and the
   line hangs straight. (5) The camera pulls back: every line straight, paper
   light, the cycle ready for the next change.
4. **Means.** Clearing a finding is human work: read, decide, fix, approve.
5. **Understands.** The real sequence of commands, and that the tool records
   it rather than judging it.
6. **Mobile.** Discrete beats; the background still turns from night to paper.
7. **Reduced motion.** Discrete, instant.

### 05 Get started (paper, quiet)


The safe preview command with copy, three steps, the facts (version, licence,
Node, dependencies), links, and the six limits. The full command list and the
package-name warning sit in an expandable section. A drawing title block closes
the page.

## Loading and performance

Text, links and the playground's controls are in the first load and the server HTML. The drawings, GSAP and the scene motion are decorative and load after the `load` event, when the browser is idle, in chunks of their own; until then the captions read as plain text. The first load is within 3 KB of the previous site's (gzip), and in a throttled real browser the hero lede paints at the same time as before. Numbers are in TESTING.md.
