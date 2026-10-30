// Run with: npm test   (node --experimental-strip-types --test)
import assert from "node:assert/strict";
import { test } from "node:test";
import { en } from "../../src/content/en.ts";
import { ko } from "../../src/content/ko.ts";

function shape(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(shape);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shape(v)]));
  }
  return typeof value;
}

test("Korean and English dictionaries have the same structure", () => {
  assert.deepEqual(shape(ko), shape(en));
});

test("both languages show the same commands with the same side effects", () => {
  const pick = (d: typeof ko) => d.start.commands.map(({ id, cmd, writes, needsInstall }) => ({ id, cmd, writes, needsInstall }));
  assert.deepEqual(pick(ko), pick(en));
});

// Every command shown on the site was run against v1.42.0 on 2026-10-29
// (docs/PRODUCT_CLAIMS.md). Changing this list means re-verifying the command.
test("only verified commands are published", () => {
  assert.deepEqual(
    ko.start.commands.map((c) => c.cmd),
    [
      "npx llm-wiki-governance@latest quickstart --dry-run",
      "npm install -D llm-wiki-governance",
      "npx llm-wiki-governance quickstart --write --agent claude",
      "npx llm-wiki validate",
      "npx llm-wiki review",
      "npx llm-wiki review --approve docs/llm-wiki/project-profile.md",
      "npx llm-wiki mode set standard --write",
      "npx llm-wiki impact --since origin/main",
    ],
  );
});

test("commands that write are labelled as writing", () => {
  const writes = Object.fromEntries(ko.start.commands.map((c) => [c.id, c.writes]));
  assert.deepEqual(writes, {
    preview: false,
    install: true,
    scaffold: true,
    validate: false,
    review: false,
    approve: true,
    mode: true,
    impact: false,
  });
  // Commands that need the package installed must use the installed bin name.
  for (const c of ko.start.commands) {
    if (c.needsInstall) assert.match(c.cmd, /^npx llm-wiki /, c.id);
    else assert.doesNotMatch(c.cmd, /^npx llm-wiki /, c.id);
  }
});

test("both languages tell the same story beat for beat", () => {
  const skeleton = (d: typeof ko) => ({
    review: d.review.steps.map((s) => s.id),
    commits: d.drift.commits.map((c) => [c.date, c.file, Boolean(c.cited)]),
    parts: d.anatomy.parts.map((p) => p.field),
    captions: d.hero.captions.length,
  });
  assert.deepEqual(skeleton(ko), skeleton(en));
  assert.deepEqual(skeleton(ko).review, ["read", "downgrade", "fix", "approve"]);
  // The drift timeline changes exactly one file a doc cites: the one the review example fixes.
  assert.deepEqual(ko.drift.commits.filter((c) => c.cited).map((c) => c.file), ["src/invoice.js"]);
});

test("the start steps are published commands", () => {
  for (const d of [ko, en]) {
    for (const id of d.start.steps) assert.ok(d.start.commands.some((c) => c.id === id), id);
  }
});

test("copy makes no claims the product does not support", () => {
  const text = JSON.stringify([ko, en]);
  const forbidden = [
    /human[- ]?(verified|graded|reviewed)/i,
    /guarantee/i,
    /보장/,
    /\bproves? (that )?(the )?(docs?|documentation) (is|are) (correct|true)/i,
    /\d+\s?(%|x)\s?(faster|fewer|less|more)/i,
    /award|red dot|nominat/i,
    /enterprise|trusted by|used by \d/i,
  ];
  for (const re of forbidden) assert.doesNotMatch(text, re, String(re));
});

test("limits section states the four core non-claims in both languages", () => {
  assert.equal(ko.limits.items.length, en.limits.items.length);
  assert.ok(en.limits.items.some((i) => /does not check that the prose is true/i.test(i.title)));
  assert.ok(en.limits.items.some((i) => /cannot prove who approved/i.test(i.title)));
  assert.ok(en.limits.items.some((i) => /file-level/i.test(i.title)));
  assert.ok(en.limits.items.some((i) => /plan/i.test(i.title)));
});
