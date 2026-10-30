// The demo repository of scripts/capture-playground.sh: three source files,
// two approved docs, and which file each doc cites. Every figure on the site
// draws this repository, and src/lib/playground.ts reasons about it.
import type { DocId, FileId } from "@/content/types";

export const FILE_IDS: FileId[] = ["invoice", "shipping", "format"];
export const DOC_IDS: DocId[] = ["billing", "shipping"];

export const FILES: Record<FileId, { path: string }> = {
  invoice: { path: "src/invoice.js" },
  shipping: { path: "src/shipping.js" },
  format: { path: "src/format.js" },
};

export const DOCS: Record<DocId, { name: string; dir: string; evidence: string[] }> = {
  billing: { name: "billing.md", dir: "docs/llm-wiki/domains/", evidence: ["src/invoice.js#symbol:computeTotal", "src/shipping.js#symbol:shippingFee"] },
  shipping: { name: "shipping.md", dir: "docs/llm-wiki/domains/", evidence: ["src/shipping.js#symbol:shippingFee"] },
};

/** Each citation: a doc's evidence entry and the file it names. Detection in v1.42.0 is file-level. */
export const CITES: { doc: DocId; file: FileId }[] = [
  { doc: "billing", file: "invoice" },
  { doc: "billing", file: "shipping" },
  { doc: "shipping", file: "shipping" },
];

/** Each file's function before and after its change, as in scripts/capture-playground.sh. */
export const SOURCES: Record<FileId, { head: string; before: string; after: string; tail: string }> = {
  invoice: {
    head: "export function computeTotal(items) {",
    before: "  return items.reduce((s, i) => s + i.price, 0);",
    after: "  return items.reduce((s, i) => s + i.price * i.qty, 0);",
    tail: "}",
  },
  shipping: {
    head: "export function shippingFee(total) {",
    before: "  return total >= 50 ? 0 : 5;",
    after: "  return total >= 70 ? 0 : 5;",
    tail: "}",
  },
  format: {
    head: "export function formatMoney(n) {",
    before: '  return "$" + n.toFixed(2);',
    after: '  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);',
    tail: "}",
  },
};
