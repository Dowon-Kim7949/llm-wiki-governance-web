// Command lines and output excerpts for each demo step. Every excerpt is copied
// from a real v1.42.0 run of scripts/capture-demo.sh (2026-10-29); lines were
// only removed, never edited. CLI output is English in both locales because
// that is what the CLI prints.
import type { Mode } from "./types";

export type Transcript = { cmd: string; out: string; exit?: number } | null;

export const SOURCE_BEFORE = `export function computeTotal(items) {
  return items.reduce((s, i) => s + i.price, 0);
}`;

export const SOURCE_AFTER_REMOVED = "  return items.reduce((s, i) => s + i.price, 0);";
export const SOURCE_AFTER_ADDED = "  return items.reduce((s, i) => s + i.price * i.qty, 0);";

const impact = (mode: Mode): Transcript => {
  if (mode === "lite") {
    return {
      cmd: "npx llm-wiki impact --since main~1",
      out: `- result: pass
- impact.source_changed: off (governance mode lite or config) — no document was checked; turn it on with llm-wiki mode set standard --write
- governance_mode: lite
- findings: 0`,
      exit: 0,
    };
  }
  const severity = mode === "standard" ? "warning" : "error";
  return {
    cmd: "npx llm-wiki impact --since main~1",
    out: `- result: ${mode === "standard" ? "warning" : "fail"}
- governance_mode: ${mode}
- impacted_verified_docs: 1

## Documents to re-review
| docs/llm-wiki/domains/billing.md | src/invoice.js |

- [${severity}] impact.source_changed docs/llm-wiki/domains/billing.md: Verified document depends on src/invoice.js, which changed in this diff, but the document is unchanged; re-review and update it or downgrade to needs_review.`,
    exit: mode === "strict" ? 1 : 0,
  };
};

export function transcriptFor(step: number, mode: Mode): Transcript {
  switch (step) {
    case 0:
      return null;
    case 1:
      return {
        cmd: "npx llm-wiki validate",
        out: `- result: pass
- governance_mode: lite
- findings: 0`,
        exit: 0,
      };
    case 2:
      return {
        cmd: "npx llm-wiki review",
        out: `## Needs Review (risk-ranked)
- docs/llm-wiki/domains/billing.md — Billing [risk 0] findings: 0`,
      };
    case 3:
      return {
        cmd: "npx llm-wiki review --approve docs/llm-wiki/domains/billing.md",
        out: `- approved: 1
- refused: 0

## Approved (-> verified)
- docs/llm-wiki/domains/billing.md: verified (reviewed_by maintainer)`,
      };
    case 4:
      return { cmd: "git diff --stat main~1", out: " src/invoice.js | 2 +-\n 1 file changed, 1 insertion(+), 1 deletion(-)" };
    case 5:
      return impact(mode);
    case 6:
      return {
        cmd: "npx llm-wiki review --approve docs/llm-wiki/domains/billing.md",
        out: `- approved: 1
- docs/llm-wiki/domains/billing.md: verified (reviewed_by maintainer)

$ npx llm-wiki impact --since main~1
- result: pass
- governance_mode: ${mode}${mode === "lite" ? "\n- impact.source_changed: off (governance mode lite or config) — no document was checked" : ""}
- findings: 0`,
      };
    default:
      return null;
  }
}
