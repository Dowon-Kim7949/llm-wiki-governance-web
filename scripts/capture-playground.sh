#!/usr/bin/env bash
# Reproduces the redesign's change playground (scene 3) and review sequence
# (scene 4) against the real CLI and saves every output the site quotes.
# Run it outside any repository you care about:
#   bash scripts/capture-playground.sh /tmp/llm-wiki-playground
# Output: <dir>/outputs/*.txt (the fixture repository is <dir>/repo)
#
# Fixture: two approved docs and three source files.
#   docs/llm-wiki/domains/billing.md   cites src/invoice.js and src/shipping.js
#   docs/llm-wiki/domains/shipping.md  cites src/shipping.js
#   src/format.js                      is cited by no document
# Each file is changed on its own branch from the same baseline, and impact runs
# once per governance mode with the --mode override, so the config is untouched.
set -u
DIR="${1:?usage: capture-playground.sh <empty-dir>}"
VERSION="${LLM_WIKI_VERSION:-1.42.0}"
L="npx -y llm-wiki-governance@${VERSION}"

# Outputs live beside the fixture repository, not inside it, so they never
# count as changed files in the diffs the CLI reads.
rm -rf "$DIR" && mkdir -p "$DIR/repo/src" "$DIR/outputs"
O="$(cd "$DIR/outputs" && pwd)"
cd "$DIR/repo" || exit 1
git init -q -b main
git config user.email demo@example.invalid
git config user.name demo

# The baseline is dated two days back, so the date-based drift check has
# something to see when the change lands today.
export GIT_AUTHOR_DATE="2026-10-27T12:00:00" GIT_COMMITTER_DATE="2026-10-27T12:00:00"
printf '{"name":"demo","version":"0.0.0","type":"module"}\n' > package.json
printf 'export function computeTotal(items) {\n  return items.reduce((s, i) => s + i.price, 0);\n}\n' > src/invoice.js
printf 'export function shippingFee(total) {\n  return total >= 50 ? 0 : 5;\n}\n' > src/shipping.js
printf 'export function formatMoney(n) {\n  return "$" + n.toFixed(2);\n}\n' > src/format.js
git add -A && git commit -qm "add billing sources"

$L --version > "$O/00-version.txt" 2>&1
$L quickstart --write > "$O/01-quickstart-write.txt" 2>&1

mkdir -p docs/llm-wiki/domains
doc() { # path title summary sources... (each source becomes source_files + evidence)
  local path="$1" title="$2" summary="$3"; shift 3
  {
    printf -- '---\ntitle: %s\ntags:\n  - llm-wiki\n  - needs-review\nstatus: needs_review\ndoc_type: domain\nproject: demo\nlast_updated: 2026-10-27\nauthor: agent\nlast_edited_by: agent\nwiki_block_version: v1\nsource_files:\n' "$title"
    for s in "$@"; do printf '  - %s\n' "${s%%#*}"; done
    printf 'evidence:\n'
    for s in "$@"; do printf '  - %s\n' "$s"; done
    printf 'related:\n  - docs/llm-wiki/index.md\nvisibility: internal\ncontains_sensitive_info: false\n---\n\n# %s\n\n## Summary\n\n%s\n\n## Evidence\n\n' "$title" "$summary"
    for s in "$@"; do printf -- '- `%s`\n' "$s"; done
  } > "$path"
}
doc docs/llm-wiki/domains/billing.md Billing \
  "- \`computeTotal(items)\` returns the sum of each item's \`price\`.
- Orders of 50 or more ship free (\`shippingFee\`)." \
  'src/invoice.js#symbol:computeTotal' 'src/shipping.js#symbol:shippingFee'
doc docs/llm-wiki/domains/shipping.md Shipping \
  "- \`shippingFee(total)\` is 0 from 50 up, otherwise 5." \
  'src/shipping.js#symbol:shippingFee'
git add -A && git commit -qm "agent drafts"

$L validate > "$O/02-validate.txt" 2>&1; echo "exit=$?" >> "$O/02-validate.txt"
$L review > "$O/03-review.txt" 2>&1
$L review --approve docs/llm-wiki/domains/billing.md --approve docs/llm-wiki/domains/shipping.md --reviewer maintainer > "$O/04-approve.txt" 2>&1
# --approve stamps today's date; set it to the baseline day so the review
# reads as two days old, which is what the date-based drift check compares.
sed -i 's/^reviewed_at: .*/reviewed_at: 2026-10-27/' docs/llm-wiki/domains/billing.md docs/llm-wiki/domains/shipping.md
git add -A && git commit -qm "approve billing and shipping"
BASE=$(git rev-parse HEAD)
unset GIT_AUTHOR_DATE GIT_COMMITTER_DATE

change() { # name file new-content
  git checkout -q -B "change-$1" "$BASE"
  printf '%s' "$3" > "$2"
  git commit -qam "change $1"
  git diff --stat "$BASE" > "$O/10-$1-diffstat.txt" 2>&1
  for m in lite standard strict; do
    $L impact --since "$BASE" --mode "$m" > "$O/11-$1-impact-$m.txt" 2>&1; echo "exit=$?" >> "$O/11-$1-impact-$m.txt"
  done
}
change invoice src/invoice.js 'export function computeTotal(items) {
  return items.reduce((s, i) => s + i.price * i.qty, 0);
}
'
change shipping src/shipping.js 'export function shippingFee(total) {
  return total >= 70 ? 0 : 5;
}
'
change format src/format.js 'export function formatMoney(n) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}
'

# Review after the invoice change, as the tool's remediation describes:
# re-read, downgrade to needs_review, fix the sentence, approve again.
git checkout -q "change-invoice"
$L review --approve docs/llm-wiki/domains/billing.md --reviewer maintainer > "$O/20-approve-while-verified.txt" 2>&1
$L drift --mode standard > "$O/21-drift.txt" 2>&1; echo "exit=$?" >> "$O/21-drift.txt"
$L drift --downgrade --mode standard > "$O/22-drift-downgrade.txt" 2>&1; echo "exit=$?" >> "$O/22-drift-downgrade.txt"
grep -n '^status:' docs/llm-wiki/domains/*.md > "$O/23-status-after-downgrade.txt"
sed -i "s/returns the sum of each item's \`price\`./returns the sum of each item's \`price\` times \`qty\`./" docs/llm-wiki/domains/billing.md
$L review --approve docs/llm-wiki/domains/billing.md --reviewer maintainer > "$O/24-reapprove.txt" 2>&1
grep -nE '^(status|reviewed_by|reviewed_at):' docs/llm-wiki/domains/billing.md > "$O/25-billing-stamp.txt"
for m in standard strict; do
  $L impact --since "$BASE" --mode "$m" > "$O/26-impact-after-$m.txt" 2>&1; echo "exit=$?" >> "$O/26-impact-after-$m.txt"
done
git diff --stat "$BASE" > "$O/27-diffstat-after.txt" 2>&1
echo "outputs in $O"
