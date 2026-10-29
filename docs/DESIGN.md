# Design

## Brief

The official site for [LLM-WIKI Governance](https://github.com/Dowon-Kim7949/llm-wiki-governance) v1.42.0, a free, MIT-licensed CLI maintained by one developer. The audience is individual developers and small teams using Claude Code, Codex, Cursor and similar agents. The site has one job: let an unfamiliar developer understand what the tool records (citations, review state, change findings), what it does not prove, and run a safe first command. Korean is the default language; English is equally complete.

Starting concept from the brief: *Traceable Knowledge*. Process followed: Anthropic's `frontend-design` skill (two passes: token plan, review against generic defaults, then build and critique with screenshots). The skill was read from `anthropics/skills` and its process followed by hand; it was not installed as a Claude Code plugin in this environment.

## Three directions

### A. Survey Record (selected)

- **Thesis.** A land survey does not prove the map is right. It records measurements against fixed benchmarks, and when a benchmark is disturbed, the affected stations are re-surveyed. That is exactly the product: a doc (station) records which source it was measured against (benchmark, via a citation), an explicit review stamps it, and a source change flags it for another survey. It never claims the doc is true.
- **Type.** One variable family, Archivo, with its width axis doing the display work (wide, heavy headlines like drawing lettering; normal width for text). Korean falls back to the platform's Korean UI face (Apple SD Gothic Neo, Malgun Gothic, Noto Sans KR) to keep the page fast; no Korean web font is downloaded.
- **Colour.** Field-book paper `#e8ebe6`, slate ink `#17232b`, flagging-tape magenta `#b0124f` for "changed, re-review", field green `#2b6146` for "verified", ochre `#7a5500` for "needs review". Dark mode has its own tuned values.
- **Layout.** Left-aligned, wide gutter, sections separated by survey rules. The workflow and the demo are drawn as a traverse (a numbered line of stations) because they are real sequences. The footer is a drawing's title block holding the version, baseline commit and licence.
- **Metaphor in the UI.** Square control points for sources, a document glyph for docs, survey lines for citations, a flag for a finding, a displaced benchmark with a dashed ghost of its old position for a change.
- **Motion.** One orchestrated moment: on load, the hero's disturbed line is surveyed and flagged. Everything else moves only in answer to the visitor (demo state changes). All of it is off under `prefers-reduced-motion`.
- **Mobile.** The hero drawing drops below the headline; the demo's station names collapse to numbered buttons (names stay in the accessible name and in the record panel); the plot and the record stack.
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

## Tokens

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

## Components

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
