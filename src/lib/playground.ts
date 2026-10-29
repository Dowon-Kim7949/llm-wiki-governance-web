// What `llm-wiki impact --since main --mode <mode>` reports after one file of
// the demo repository changes. A pure function, checked against the real
// v1.42.0 output in tests/unit/playground.test.ts.
import type { DocId, FileId, Mode } from "@/content/types";
// Relative with an extension so the unit tests can load it under plain Node.
import { CITES } from "./world.ts";

export type Outcome = {
  /** Docs whose evidence cites the file (what a reader inspects before changing it). */
  cites: DocId[];
  /** Whether the check ran at all: lite turns impact.source_changed off. */
  checked: boolean;
  flagged: DocId[];
  result: "idle" | "pass" | "warning" | "fail";
  exit: 0 | 1 | null;
};

export function outcome(file: FileId, committed: boolean, mode: Mode): Outcome {
  const cites = [...new Set(CITES.filter((c) => c.file === file).map((c) => c.doc))];
  if (!committed) return { cites, checked: false, flagged: [], result: "idle", exit: null };
  if (mode === "lite") return { cites, checked: false, flagged: [], result: "pass", exit: 0 };
  if (cites.length === 0) return { cites, checked: true, flagged: [], result: "pass", exit: 0 };
  return { cites, checked: true, flagged: cites, result: mode === "strict" ? "fail" : "warning", exit: mode === "strict" ? 1 : 0 };
}
