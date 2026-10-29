#!/usr/bin/env bash
# Reproduces the homepage demo against the real CLI and saves every output the
# demo quotes. Run it outside any repository you care about:
#   bash scripts/capture-demo.sh /tmp/llm-wiki-demo
# Output: <dir>/outputs/*.txt
set -u
DIR="${1:?usage: capture-demo.sh <empty-dir>}"
VERSION="${LLM_WIKI_VERSION:-1.42.0}"
L="npx -y llm-wiki-governance@${VERSION}"

rm -rf "$DIR" && mkdir -p "$DIR/src" "$DIR/outputs"
cd "$DIR" || exit 1
git init -q -b main
git config user.email demo@example.invalid
git config user.name demo
printf '{"name":"demo","version":"0.0.0","type":"module"}\n' > package.json
printf 'export function computeTotal(items) {\n  return items.reduce((s, i) => s + i.price, 0);\n}\n' > src/invoice.js
git add -A && git commit -qm "add invoice total"

O="$DIR/outputs"
$L --version > "$O/00-version.txt" 2>&1
$L quickstart --write > "$O/01-quickstart-write.txt" 2>&1

mkdir -p docs/llm-wiki/domains
cat > docs/llm-wiki/domains/billing.md <<'DOC'
---
title: Billing
tags:
  - llm-wiki
  - needs-review
status: needs_review
doc_type: domain
project: demo
last_updated: 2026-10-29
author: agent
last_edited_by: agent
wiki_block_version: v1
source_files:
  - src/invoice.js
evidence:
  - src/invoice.js#symbol:computeTotal
related:
  - docs/llm-wiki/index.md
visibility: internal
contains_sensitive_info: false
---

# Billing

## Summary

- `computeTotal(items)` returns the sum of each item's `price`.

## Evidence

- `src/invoice.js#symbol:computeTotal`
DOC
git add -A && git commit -qm "agent draft"

$L validate > "$O/02-validate.txt" 2>&1; echo "exit=$?" >> "$O/02-validate.txt"
$L review > "$O/03-review.txt" 2>&1
$L review --approve docs/llm-wiki/domains/billing.md --reviewer maintainer > "$O/04-approve.txt" 2>&1
git add -A && git commit -qm "approve billing"
BASE=$(git rev-parse HEAD)

printf 'export function computeTotal(items) {\n  return items.reduce((s, i) => s + i.price * i.qty, 0);\n}\n' > src/invoice.js
git commit -qam "multiply by qty"

$L impact --since "$BASE" > "$O/05-impact-lite.txt" 2>&1; echo "exit=$?" >> "$O/05-impact-lite.txt"
$L mode set standard --write > /dev/null 2>&1
$L impact --since "$BASE" > "$O/06-impact-standard.txt" 2>&1; echo "exit=$?" >> "$O/06-impact-standard.txt"
$L mode set strict --write > /dev/null 2>&1
$L impact --since "$BASE" > "$O/07-impact-strict.txt" 2>&1; echo "exit=$?" >> "$O/07-impact-strict.txt"

# Re-review. Approving a doc that is still verified is refused ("already
# verified"), so the claim goes back to needs_review first, as the tool's own
# remediation says, then the sentence is fixed and approved again.
sed -i "s/returns the sum of each item's \`price\`./returns the sum of each item's \`price\` times \`qty\`./" docs/llm-wiki/domains/billing.md
$L review --approve docs/llm-wiki/domains/billing.md --reviewer maintainer > "$O/08a-approve-while-verified.txt" 2>&1
sed -i 's/^status: verified$/status: needs_review/' docs/llm-wiki/domains/billing.md
$L review --approve docs/llm-wiki/domains/billing.md --reviewer maintainer > "$O/08-reapprove.txt" 2>&1
$L impact --since "$BASE" > "$O/09-impact-after.txt" 2>&1; echo "exit=$?" >> "$O/09-impact-after.txt"
echo "outputs in $O"
