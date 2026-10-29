// The one drawing every scene shows: the demo repository of
// scripts/capture-playground.sh as an exploded view. Units are CSS px at
// zoom 1; plates are laid out at these sizes and the camera scales them.
import type { Camera } from "./axo";
import type { DocId, FileId } from "@/content/types";

export const WORLD = { w: 1460, h: 880 };

type Box = { x: number; y: number; w: number; h: number };

export const FILES: Record<FileId, Box & { path: string; shift: [number, number] }> = {
  invoice: { path: "src/invoice.js", x: 20, y: 470, w: 460, h: 190, shift: [64, 18] },
  shipping: { path: "src/shipping.js", x: 500, y: 470, w: 460, h: 190, shift: [64, 18] },
  format: { path: "src/format.js", x: 980, y: 470, w: 460, h: 190, shift: [64, 18] },
};

export const DOCS: Record<DocId, Box & { path: string; z: number }> = {
  billing: { path: "docs/llm-wiki/domains/billing.md", x: 80, y: 290, w: 740, h: 420, z: 270 },
  shipping: { path: "docs/llm-wiki/domains/shipping.md", x: 600, y: 330, w: 580, h: 380, z: 470 },
};

/** Files the demo cites nothing in; they make the floor read as a codebase. */
export const GHOSTS: (Box & { path: string })[] = [
  { path: "src/cart.js", x: 30, y: 40, w: 320, h: 150 },
  { path: "src/auth/session.js", x: 390, y: 30, w: 340, h: 170 },
  { path: "src/api/routes.js", x: 770, y: 60, w: 300, h: 150 },
  { path: "tests/invoice.test.js", x: 1100, y: 40, w: 330, h: 160 },
  { path: "README.md", x: 1110, y: 250, w: 320, h: 140 },
  { path: "package.json", x: 40, y: 250, w: 260, h: 120 },
];

/**
 * Each citation hangs straight down from a point on a doc to a point on the
 * file it cites. Change detection is file-level in v1.42.0, so the line ends on
 * the file plate and leans when the whole file moves.
 */
export const CITES: { id: string; doc: DocId; file: FileId; x: number; y: number }[] = [
  { id: "billing-invoice", doc: "billing", file: "invoice", x: 250, y: 590 },
  { id: "billing-shipping", doc: "billing", file: "shipping", x: 640, y: 590 },
  { id: "shipping-shipping", doc: "shipping", file: "shipping", x: 840, y: 610 },
];

export const citesOf = (file: FileId) => CITES.filter((c) => c.file === file);

/** Source of each file before and after its change, as in scripts/capture-playground.sh. */
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

/**
 * Everything a scene can animate, as numbers so GSAP can tween and scrub them.
 * 0..1 values blend between two states; renders are a pure function of this.
 */
export type WorldState = Camera & {
  floor: number; // code layer (floor, files, ghosts) visible
  docShipping: number; // shipping.md present
  draw: number; // citation lines drawn
  approved: number; // billing.md: needs_review -> verified
  downgraded: number; // billing.md: verified -> needs_review again
  restamped: number; // billing.md: reviewed_at moves to the re-approval date
  edited: number; // billing.md: sentence rewritten
  follow: number; // billing.md slides over the moved invoice.js
  flagBilling: number;
  flagShipping: number;
  movedInvoice: number;
  movedShipping: number;
  movedFormat: number;
  pulseInvoice: number; // a check climbing the lines from the file to the docs
  pulseShipping: number;
  focusInvoice: number; // a file and everything hanging from it, picked out
  focusShipping: number;
  focusFormat: number;
  dim: number; // fade everything not in focus
  light: number; // 0 night, 1 paper
};

export const CAMERAS = {
  page: { tilt: 0, yaw: 0, zoom: 1.78, cx: 450, cy: 500, lift: 1 },
  peek: { tilt: 30, yaw: -14, zoom: 1.32, cx: 470, cy: 520, lift: 1 },
  structure: { tilt: 56, yaw: -32, zoom: 1.02, cx: 700, cy: 470, lift: 1 },
  close: { tilt: 56, yaw: -22, zoom: 1.32, cx: 390, cy: 480, lift: 1.3 },
  bench: { tilt: 52, yaw: -30, zoom: 1.06, cx: 720, cy: 520, lift: 0.9 },
} satisfies Record<string, Camera>;

export const REST: WorldState = {
  ...CAMERAS.structure,
  floor: 1,
  docShipping: 1,
  draw: 1,
  approved: 1,
  downgraded: 0,
  restamped: 0,
  edited: 0,
  follow: 0,
  flagBilling: 0,
  flagShipping: 0,
  movedInvoice: 0,
  movedShipping: 0,
  movedFormat: 0,
  pulseInvoice: 0,
  pulseShipping: 0,
  focusInvoice: 0,
  focusShipping: 0,
  focusFormat: 0,
  dim: 0,
  light: 0,
};

export const state = (over: Partial<WorldState>): WorldState => ({ ...REST, ...over });
