// Run with: npm test   (node --experimental-strip-types --test)
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { TRANSCRIPTS, type Excerpt } from "../../src/content/transcripts.ts";

const EVIDENCE = new URL("../../docs/evidence/capture-playground-2026-10-29/", import.meta.url);
const raw = (name: string) => readFileSync(new URL(name, EVIDENCE), "utf-8").split(/\r?\n/);

const all: Excerpt[] = [
  ...Object.values(TRANSCRIPTS.impact).flatMap((byMode) => Object.values(byMode)),
  ...Object.values(TRANSCRIPTS.diffstat),
  TRANSCRIPTS.refused,
  TRANSCRIPTS.downgrade,
  TRANSCRIPTS.reapprove,
  TRANSCRIPTS.after,
];

test("every quoted CLI line appears verbatim, in order, in the captured output", () => {
  for (const e of all) {
    const lines = raw(e.source);
    let at = 0;
    for (const line of e.lines) {
      if (line === "") continue;
      const found = lines.indexOf(line, at);
      assert.ok(found >= 0, `${e.source}: ${line}`);
      at = found + 1;
    }
  }
});

test("exit codes are the captured ones", () => {
  for (const e of all) {
    const captured = raw(e.source).find((l) => l.startsWith("exit="));
    assert.equal(e.exit, captured ? Number(captured.slice(5)) : null, e.source);
  }
});

test("the captured run is v1.42.0", () => {
  assert.equal(raw("00-version.txt")[0], "1.42.0");
});
