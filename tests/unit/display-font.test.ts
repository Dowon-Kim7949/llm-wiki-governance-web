// Run with: npm test   (node --experimental-strip-types --test)
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { ko } from "../../src/content/ko.ts";
import { displayHeadings, hangulIn } from "../../src/lib/display-font.ts";

const shipped = readFileSync(new URL("../../src/fonts/display-ko-bold.chars.txt", import.meta.url), "utf-8").trim();

test("the Korean display font has every Hangul glyph the h1/h2 lines use", () => {
  const missing = hangulIn(displayHeadings(ko)).filter((ch) => !shipped.includes(ch));
  assert.deepEqual(missing, [], "run scripts/subset-display-ko.py after changing a heading");
});

test("the Korean display font carries nothing the headings do not use", () => {
  assert.equal(shipped, hangulIn(displayHeadings(ko)).join(""));
});
