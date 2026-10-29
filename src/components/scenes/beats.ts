// The drawing's state at each beat of the scroll scenes (docs/STORYBOARD.md).
// Captions for beat i live in the dictionary at the same index.
import { CAMERAS, state, type WorldState } from "@/lib/world";
import type { Phased } from "./useSequence";

/** Before load: the doc face-on like a page, nothing under it yet. */
export const OPENING_INTRO: WorldState = state({ ...CAMERAS.page, docShipping: 0, draw: 0, floor: 0 });

export const OPENING: Phased[] = [
  [state({ ...CAMERAS.peek, docShipping: 0 })],
  [state({ ...CAMERAS.structure })],
  [
    state({ ...CAMERAS.structure, yaw: -35, movedInvoice: 1 }),
    state({ ...CAMERAS.structure, yaw: -37, zoom: 1.08, movedInvoice: 1, pulseInvoice: 1 }),
    state({ ...CAMERAS.structure, yaw: -38, zoom: 1.1, movedInvoice: 1, pulseInvoice: 1, flagBilling: 1 }),
  ],
];

// One doc and one function: the rest of the repository steps back.
const story = { ...CAMERAS.close, docShipping: 0, focusInvoice: 1, dim: 0.75 };

export const STORY: Phased[] = [
  [state({ ...story, approved: 0 })],
  [state({ ...story, approved: 1 })],
  [state({ ...story, yaw: -27, approved: 1, movedInvoice: 1 })],
  [state({ ...story, yaw: -18, zoom: 1.42, cx: 370, cy: 470, approved: 1, movedInvoice: 1 })],
  [
    state({ ...story, approved: 1, movedInvoice: 1, pulseInvoice: 1 }),
    state({ ...story, approved: 1, movedInvoice: 1, pulseInvoice: 1, flagBilling: 1 }),
  ],
];

// A person looks again: the light comes up as the review goes on.
const review = { ...story, approved: 1, movedInvoice: 1, pulseInvoice: 1 };

export const REVIEW: Phased[] = [
  [state({ ...review, zoom: 1.42, flagBilling: 1, light: 0.15 })],
  [state({ ...review, downgraded: 1, light: 0.35 })],
  [state({ ...review, downgraded: 1, edited: 1, light: 0.5 }), state({ ...review, downgraded: 1, edited: 1, follow: 1, light: 0.6 })],
  [state({ ...review, edited: 1, follow: 1, restamped: 1, light: 0.75 })],
  [state({ ...CAMERAS.structure, approved: 1, movedInvoice: 1, pulseInvoice: 1, edited: 1, follow: 1, restamped: 1, light: 1 })],
];
