// Run with: npm test   (node --experimental-strip-types --test)
import assert from "node:assert/strict";
import { test } from "node:test";
import { TRANSCRIPTS } from "../../src/content/transcripts.ts";
import type { FileId, Mode } from "../../src/content/types.ts";
import { outcome } from "../../src/lib/playground.ts";

const FILES: FileId[] = ["invoice", "shipping", "format"];
const MODES: Mode[] = ["lite", "standard", "strict"];

// The playground's state model must say what the real CLI said for every
// file and mode (scripts/capture-playground.sh, v1.42.0).
test("the playground reports what impact reported, for every file and mode", () => {
  for (const file of FILES) {
    for (const mode of MODES) {
      const o = outcome(file, true, mode);
      const run = TRANSCRIPTS.impact[file][mode];
      assert.ok(run.lines.includes(`- result: ${o.result}`), `${file}/${mode}: result ${o.result}`);
      assert.equal(o.exit, run.exit, `${file}/${mode}: exit`);
      assert.ok(run.lines.includes(`- impacted_verified_docs: ${o.flagged.length}`), `${file}/${mode}: flagged count`);
      for (const doc of o.flagged) {
        assert.ok(run.lines.some((l) => l.startsWith(`| \`docs/llm-wiki/domains/${doc}.md\``)), `${file}/${mode}: ${doc} listed`);
      }
      assert.equal(o.checked, mode !== "lite");
      if (mode === "lite") assert.ok(run.lines.some((l) => l.startsWith("- impact.source_changed: off")), `${file}: lite is off`);
    }
  }
});

test("nothing is reported before a change is committed", () => {
  for (const mode of MODES) assert.deepEqual(outcome("shipping", false, mode), { cites: ["billing", "shipping"], checked: false, flagged: [], result: "idle", exit: null });
});
