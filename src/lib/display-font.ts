import type { Dictionary } from "@/content/types";

/**
 * Korean display face (docs/DESIGN.md): the h1 and h2 lines are the only text
 * set in it, so the font file carries only their Hangul. Regenerate the file
 * with scripts/subset-display-ko.py when these lines change; a unit test
 * fails when a glyph is missing.
 */
export function displayHeadings(t: Dictionary): string[] {
  return [
    t.hero.title,
    t.problem.heading,
    t.workflow.heading,
    t.demo.heading,
    t.start.heading,
    t.limits.heading,
    t.open.heading,
  ];
}

/** Hangul syllables and jamo the display file has to contain, sorted, once each. */
export function hangulIn(lines: string[]): string[] {
  const chars = new Set<string>();
  for (const ch of lines.join("")) {
    if (/[ᄀ-ᇿ㄰-㆏가-힣]/.test(ch)) chars.add(ch);
  }
  return [...chars].sort();
}
