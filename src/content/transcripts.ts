// Excerpts of one real v1.42.0 run of scripts/capture-playground.sh (2026-10-29).
// The raw outputs are in docs/evidence/capture-playground-2026-10-29/; each
// excerpt names its file. Lines are only removed, never edited, and
// tests/unit/transcripts.test.ts checks every line against the raw file.
// Commands are shown as a user would type them: the fixture's baseline commit
// is main, so `--since main` is the same range the run used. CLI output is
// English in both locales because that is what the CLI prints.
import type { FileId, Mode } from "./types";

export type Excerpt = { cmd: string; source: string; lines: string[]; exit: number | null };

type Transcripts = {
  impact: Record<FileId, Record<Mode, Excerpt>>;
  diffstat: Record<FileId, Excerpt>;
  refused: Excerpt;
  downgrade: Excerpt;
  reapprove: Excerpt;
  after: Excerpt;
};

export const TRANSCRIPTS: Transcripts = {
  "impact": {
    "invoice": {
      "lite": {
        "cmd": "npx llm-wiki impact --since main --mode lite",
        "source": "11-invoice-impact-lite.txt",
        "lines": [
          "- result: pass",
          "- impact.source_changed: off (governance mode lite or config) — no document was checked; turn it on with llm-wiki mode set standard --write",
          "- governance_mode: lite",
          "- changed_files: 1",
          "- impacted_verified_docs: 0",
          "",
          "## Documents to re-review",
          "- not checked: impact.source_changed is off"
        ],
        "exit": 0
      },
      "standard": {
        "cmd": "npx llm-wiki impact --since main --mode standard",
        "source": "11-invoice-impact-standard.txt",
        "lines": [
          "- result: warning",
          "- governance_mode: standard",
          "- changed_files: 1",
          "- impacted_verified_docs: 1",
          "",
          "## Documents to re-review",
          "| Document | Changed source it cites |",
          "| --- | --- |",
          "| `docs/llm-wiki/domains/billing.md` | `src/invoice.js` |",
          "",
          "## Findings",
          "- [warning] impact.source_changed docs/llm-wiki/domains/billing.md: Verified document depends on src/invoice.js, which changed in this diff, but the document is unchanged; re-review and update it or downgrade to needs_review."
        ],
        "exit": 0
      },
      "strict": {
        "cmd": "npx llm-wiki impact --since main --mode strict",
        "source": "11-invoice-impact-strict.txt",
        "lines": [
          "- result: fail",
          "- governance_mode: strict",
          "- changed_files: 1",
          "- impacted_verified_docs: 1",
          "",
          "## Documents to re-review",
          "| Document | Changed source it cites |",
          "| --- | --- |",
          "| `docs/llm-wiki/domains/billing.md` | `src/invoice.js` |",
          "",
          "## Findings",
          "- [error] impact.source_changed docs/llm-wiki/domains/billing.md: Verified document depends on src/invoice.js, which changed in this diff, but the document is unchanged; re-review and update it or downgrade to needs_review."
        ],
        "exit": 1
      }
    },
    "shipping": {
      "lite": {
        "cmd": "npx llm-wiki impact --since main --mode lite",
        "source": "11-shipping-impact-lite.txt",
        "lines": [
          "- result: pass",
          "- impact.source_changed: off (governance mode lite or config) — no document was checked; turn it on with llm-wiki mode set standard --write",
          "- governance_mode: lite",
          "- changed_files: 1",
          "- impacted_verified_docs: 0",
          "",
          "## Documents to re-review",
          "- not checked: impact.source_changed is off"
        ],
        "exit": 0
      },
      "standard": {
        "cmd": "npx llm-wiki impact --since main --mode standard",
        "source": "11-shipping-impact-standard.txt",
        "lines": [
          "- result: warning",
          "- governance_mode: standard",
          "- changed_files: 1",
          "- impacted_verified_docs: 2",
          "",
          "## Documents to re-review",
          "| Document | Changed source it cites |",
          "| --- | --- |",
          "| `docs/llm-wiki/domains/billing.md` | `src/shipping.js` |",
          "| `docs/llm-wiki/domains/shipping.md` | `src/shipping.js` |",
          "",
          "## Findings",
          "- [warning] impact.source_changed docs/llm-wiki/domains/billing.md: Verified document depends on src/shipping.js, which changed in this diff, but the document is unchanged; re-review and update it or downgrade to needs_review.",
          "- [warning] impact.source_changed docs/llm-wiki/domains/shipping.md: Verified document depends on src/shipping.js, which changed in this diff, but the document is unchanged; re-review and update it or downgrade to needs_review."
        ],
        "exit": 0
      },
      "strict": {
        "cmd": "npx llm-wiki impact --since main --mode strict",
        "source": "11-shipping-impact-strict.txt",
        "lines": [
          "- result: fail",
          "- governance_mode: strict",
          "- changed_files: 1",
          "- impacted_verified_docs: 2",
          "",
          "## Documents to re-review",
          "| Document | Changed source it cites |",
          "| --- | --- |",
          "| `docs/llm-wiki/domains/billing.md` | `src/shipping.js` |",
          "| `docs/llm-wiki/domains/shipping.md` | `src/shipping.js` |",
          "",
          "## Findings",
          "- [error] impact.source_changed docs/llm-wiki/domains/billing.md: Verified document depends on src/shipping.js, which changed in this diff, but the document is unchanged; re-review and update it or downgrade to needs_review.",
          "- [error] impact.source_changed docs/llm-wiki/domains/shipping.md: Verified document depends on src/shipping.js, which changed in this diff, but the document is unchanged; re-review and update it or downgrade to needs_review."
        ],
        "exit": 1
      }
    },
    "format": {
      "lite": {
        "cmd": "npx llm-wiki impact --since main --mode lite",
        "source": "11-format-impact-lite.txt",
        "lines": [
          "- result: pass",
          "- impact.source_changed: off (governance mode lite or config) — no document was checked; turn it on with llm-wiki mode set standard --write",
          "- governance_mode: lite",
          "- changed_files: 1",
          "- impacted_verified_docs: 0",
          "",
          "## Documents to re-review",
          "- not checked: impact.source_changed is off"
        ],
        "exit": 0
      },
      "standard": {
        "cmd": "npx llm-wiki impact --since main --mode standard",
        "source": "11-format-impact-standard.txt",
        "lines": [
          "- result: pass",
          "- governance_mode: standard",
          "- changed_files: 1",
          "- impacted_verified_docs: 0",
          "",
          "## Documents to re-review",
          "- none"
        ],
        "exit": 0
      },
      "strict": {
        "cmd": "npx llm-wiki impact --since main --mode strict",
        "source": "11-format-impact-strict.txt",
        "lines": [
          "- result: pass",
          "- governance_mode: strict",
          "- changed_files: 1",
          "- impacted_verified_docs: 0",
          "",
          "## Documents to re-review",
          "- none"
        ],
        "exit": 0
      }
    }
  },
  "diffstat": {
    "invoice": {
      "cmd": "git diff --stat main",
      "source": "10-invoice-diffstat.txt",
      "lines": [
        " src/invoice.js | 2 +-",
        " 1 file changed, 1 insertion(+), 1 deletion(-)"
      ],
      "exit": null
    },
    "shipping": {
      "cmd": "git diff --stat main",
      "source": "10-shipping-diffstat.txt",
      "lines": [
        " src/shipping.js | 2 +-",
        " 1 file changed, 1 insertion(+), 1 deletion(-)"
      ],
      "exit": null
    },
    "format": {
      "cmd": "git diff --stat main",
      "source": "10-format-diffstat.txt",
      "lines": [
        " src/format.js | 2 +-",
        " 1 file changed, 1 insertion(+), 1 deletion(-)"
      ],
      "exit": null
    }
  },
  "refused": {
    "cmd": "npx llm-wiki review --approve docs/llm-wiki/domains/billing.md --reviewer maintainer",
    "source": "20-approve-while-verified.txt",
    "lines": [
      "- approved: 0",
      "- refused: 1",
      "",
      "## Refused",
      "- docs/llm-wiki/domains/billing.md: already verified"
    ],
    "exit": null
  },
  "downgrade": {
    "cmd": "npx llm-wiki drift --downgrade --mode standard",
    "source": "22-drift-downgrade.txt",
    "lines": [
      "- run: downgrade",
      "- drifted_verified_docs: 1",
      "- downgraded: 1",
      "",
      "## Drift (evidence.stale)",
      "- [warning] evidence.stale docs/llm-wiki/domains/billing.md: Verified document references src/invoice.js, which changed after 2026-10-27; re-review and update it or downgrade to needs_review.",
      "",
      "## Downgraded",
      "- docs/llm-wiki/domains/billing.md: downgrade verified → needs_review; refresh last_updated."
    ],
    "exit": 0
  },
  "reapprove": {
    "cmd": "npx llm-wiki review --approve docs/llm-wiki/domains/billing.md --reviewer maintainer",
    "source": "24-reapprove.txt",
    "lines": [
      "- approved: 1",
      "- refused: 0",
      "",
      "## Approved (-> verified)",
      "- docs/llm-wiki/domains/billing.md: verified (reviewed_by maintainer)"
    ],
    "exit": null
  },
  "after": {
    "cmd": "npx llm-wiki impact --since main --mode strict",
    "source": "26-impact-after-strict.txt",
    "lines": [
      "- result: pass",
      "- governance_mode: strict",
      "- impacted_verified_docs: 0",
      "",
      "## Documents to re-review",
      "- none"
    ],
    "exit": 0
  }
};
