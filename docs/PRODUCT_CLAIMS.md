# Product claims and their evidence

Baseline: `llm-wiki-governance` **v1.42.0**, tag `v1.42.0` = commit `7bb943f10c7ebd9ed4b1d5c3f6862a200ac1409e` of [Dowon-Kim7949/llm-wiki-governance](https://github.com/Dowon-Kim7949/llm-wiki-governance). Files were read at that tag (`git show v1.42.0:<file>`), and every command on the site was run against the published package on 2026-10-29 (Windows 11, Node 22.14, `npx -y llm-wiki-governance@1.42.0`, in throwaway repositories).

## Claims on the site

| Claim | Evidence |
| --- | --- |
| Package `llm-wiki-governance`, bin `llm-wiki`, MIT, Node ≥ 18.18, no runtime dependencies | `package.json` at v1.42.0; `LICENSE` |
| Agent-written docs stay `needs_review` until approved; every doc cites files; a changed citation is flagged and CI can fail | `README.md` / `README.ko.md` opening paragraph |
| Status values `draft`, `needs_review`, `verified`, `deprecated` | `src/config.js` (`VALID_STATUSES`) |
| `review --approve` is the only promotion; it records `status: verified`, `reviewed_by`, `reviewed_at`; it refuses docs with blocking findings | `src/cli.js` help for `review`; README "No other command promotes a doc"; **run**: approval of a doc missing `contains_sensitive_info` was refused |
| `reviewed_by` does not prove identity | README "What it does not do": "It cannot prove who approved." |
| Approving a still-`verified` doc is refused | **run**: `review --approve` → `refused: 1`, "already verified" |
| `quickstart` scaffolds `lite`; in lite `impact.source_changed` and `evidence.stale` are off | README "Governance modes"; `src/governance.js`; **run**: `llm-wiki.config.json` = `{"governance":{"mode":"lite"}}`, `impact` → "off … no document was checked" |
| standard reports `impact.source_changed` as a warning (build passes); strict as an error (exit 1) | README; **run**: standard → `[warning]`, exit 0; strict → `[error]`, `result: fail`, exit 1 |
| Fixing the doc in the same change clears the finding even under strict | **run**: after downgrade, edit and re-approve, `impact --since <base>` under strict → findings 0, exit 0 |
| Citation formats such as `src/api.ts#symbol:getUser` | README; `src/commands/doc-content.js` |
| `validate` checks that citations resolve, not that prose is true | README "It does not check that the prose is true" |
| Change detection is mostly file-level; line-range and Markdown-section citations are narrowed | README; `impact` caveats printed by the CLI |
| Date-based `drift` can miss changes committed on the day of approval | README demo section; **run**: same-day change → `drifted_verified_docs: 0` |
| Approving a requirement approves the plan; `impact.plan_changed` names files to re-check only | README (Greenfield); `src/commands.js` |
| Not semantic search (BM25), not hosted, no network calls of its own | README "What it does not do" |
| Unfilled wiki measured worse than no wiki (1 external repo, 1 model, 6 tasks) | README; scope stated on the site |
| Do not run `npx llm-wiki` before installing: an unrelated package has that name | README |
| CLI help recommends `@latest` with `npx` | `src/cli.js` help text |
| Issues and Discussions exist | README links; GitHub API `has_discussions: true`, `has_issues: true` |

## Claims added by the redesign (branch `design/immersive-redesign`)

Raw output of every run named here is in `docs/evidence/capture-playground-2026-10-29/` (from `scripts/capture-playground.sh`); the site quotes it line for line and `tests/unit/transcripts.test.ts` checks the quotes.

| Claim | Evidence |
| --- | --- |
| A code change never changes a doc's status by itself; only `review --approve` promotes and only `drift --downgrade` (run by a person) demotes | `src/commands.js` ("NEVER auto-verifies", "nothing promotes on its own"); `src/cli.js` `drift --downgrade`; **run**: after each change billing.md is still `verified` until `drift --downgrade` runs (`23-status-after-downgrade.txt`) |
| Citations are compared file by file, so the drawing ends each citation on the file, not the symbol | `impact` caveat printed by the CLI ("Anchors are file-level ... #symbol: ... stays file-level"); `src/commands/scans.js` |
| `impact` reports only verified docs that cite a file changed in the diff and did not change themselves; one change can flag several docs; an uncited file flags none | **run**: invoice.js → billing.md; shipping.js → billing.md and shipping.md; format.js → none (`11-*-impact-*.txt`) |
| lite checks nothing and passes; standard warns (exit 0); strict fails (exit 1) | **run**: all nine file × mode pairs (`11-*-impact-*.txt`); `tests/unit/playground.test.ts` |
| `--mode <level>` sets the mode for one run without changing the config | `src/cli.js` (`--mode`); **run**: every `impact` above used `--mode` |
| Re-review path: approving a still-verified doc is refused; `drift --downgrade` moves docs whose cited files changed after `reviewed_at` back to `needs_review`; after the fix, `review --approve` stamps a new `reviewed_at` and `impact` passes under strict | **run**: `20-approve-while-verified.txt`, `21-drift.txt`, `22-drift-downgrade.txt`, `24-reapprove.txt`, `25-billing-stamp.txt`, `26-impact-after-strict.txt`; remediation text in `src/commands/findings.js` |
| `drift` is date-based | `src/git.js` (changes committed after the end of the `reviewed_at` day); **run**: the fixture's review date is set two days back, which `drift` needs to see the change |
| Works without an AI model | `package.json` has no dependencies; `src/` makes no network requests (no `fetch`, no http modules); `child_process` is used only to call git |

## Commands shown, verified

| Command | Writes? | Observed |
| --- | --- | --- |
| `npx llm-wiki-governance@latest quickstart --dry-run` | no | prints plan; `git status` clean afterwards; `@latest` resolved to 1.42.0 |
| `npm install -D llm-wiki-governance` | yes | changes `package.json`, lockfile, `node_modules` |
| `npx llm-wiki-governance quickstart --write --agent claude` | yes | creates `docs/llm-wiki/`, `llm-wiki.config.json`, `CLAUDE.md`, `.claude/skills/*`, `.llm-wiki/prompts/*` |
| `npx llm-wiki validate` | no | `result: pass`, exit 0 |
| `npx llm-wiki review` | no | lists backlog, no file changes |
| `npx llm-wiki review --approve <path>` | yes | stamps frontmatter |
| `npx llm-wiki mode set standard --write` | yes | changes mode only; prints "no document is created, edited, promoted, or demoted" |
| `npx llm-wiki impact --since <ref>` | no | see above per mode |

`scripts/capture-demo.sh` reproduces the first release's demo run. `scripts/capture-playground.sh` reproduces the redesign's playground and review runs.

## Corrections made while writing

- Korean hero said "who read it"; the tool records approval. Corrected.
- Demo step 7 originally said "fix and approve again"; a real run showed that is refused while the doc is still `verified`. Corrected to downgrade, fix, approve.
- The benchmark sentence now carries its scope (1 repo, 1 model, 6 tasks) instead of reading as a general result.
- No performance, token or speed claims appear on the site; the product's own disclosure rules forbid headline numbers.

## Claims deliberately not made

No adoption, customer or testimonial claims. No "human-verified" wording. No statement that a passing check means a doc is correct. No award claims.
