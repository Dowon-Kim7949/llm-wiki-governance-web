// Orthographic "camera" for the exploded view (docs/STORYBOARD.md).
//
// World: x to the right and y away from the viewer on the floor plate, z up.
// The camera turns the floor by `yaw`, then tilts it by `tilt` (0 = plan view,
// looking straight down, so a plate reads like a page). Every plate is flat,
// so its projection is affine and fits in one CSS matrix(); a point straight
// above another lands straight above it on screen, which is why citations
// (doc above file) draw as vertical lines until a file moves.

export type Camera = {
  tilt: number; // degrees
  yaw: number; // degrees
  zoom: number; // 1 = the whole floor fits the frame in plan view
  cx: number; // world point at the centre of the frame
  cy: number;
  lift: number; // multiplies every z: 0 collapses the plates onto the floor
};

/** Where the drawing goes on screen: a box inside the stage, in px. */
export type Frame = { x: number; y: number; w: number; h: number };

export type View = { ox: number; oy: number; unit: number };

export function viewFor(frame: Frame, worldW: number, worldH: number): View {
  return {
    ox: frame.x + frame.w / 2,
    oy: frame.y + frame.h / 2,
    unit: Math.min(frame.w / worldW, frame.h / worldH),
  };
}

const RAD = Math.PI / 180;

export function project(c: Camera, v: View, x: number, y: number, z: number): [number, number] {
  const a = c.tilt * RAD;
  const b = c.yaw * RAD;
  const s = v.unit * c.zoom;
  const dx = x - c.cx;
  const dy = y - c.cy;
  const x1 = dx * Math.cos(b) - dy * Math.sin(b);
  const y1 = dx * Math.sin(b) + dy * Math.cos(b);
  return [v.ox + s * x1, v.oy + s * (y1 * Math.cos(a) - z * c.lift * Math.sin(a))];
}

const r = (n: number) => Math.round(n * 1000) / 1000;

/** CSS transform for a plate whose top-left corner sits at (x, y, z), with transform-origin 0 0. */
export function plateTransform(c: Camera, v: View, x: number, y: number, z: number): string {
  const a = c.tilt * RAD;
  const b = c.yaw * RAD;
  const s = v.unit * c.zoom;
  const [e, f] = project(c, v, x, y, z);
  return `matrix(${r(s * Math.cos(b))},${r(s * Math.sin(b) * Math.cos(a))},${r(-s * Math.sin(b))},${r(s * Math.cos(b) * Math.cos(a))},${r(e)},${r(f)})`;
}

/** Corners of a plate's outline at height z, as an SVG points string. */
export function outline(c: Camera, v: View, x: number, y: number, w: number, h: number, z: number): string {
  return [
    project(c, v, x, y, z),
    project(c, v, x + w, y, z),
    project(c, v, x + w, y + h, z),
    project(c, v, x, y + h, z),
  ]
    .map(([px, py]) => `${r(px)},${r(py)}`)
    .join(" ");
}

/** The visible sides of a plate `depth` thick: the hull of its top and bottom outlines. */
export function slab(c: Camera, v: View, x: number, y: number, w: number, h: number, z: number, depth: number): string {
  const pts: [number, number][] = [];
  for (const zz of [z, z - depth]) {
    pts.push(project(c, v, x, y, zz), project(c, v, x + w, y, zz), project(c, v, x + w, y + h, zz), project(c, v, x, y + h, zz));
  }
  return hull(pts)
    .map(([px, py]) => `${r(px)},${r(py)}`)
    .join(" ");
}

function hull(points: [number, number][]): [number, number][] {
  const p = [...points].sort((m, n) => m[0] - n[0] || m[1] - n[1]);
  const cross = (o: [number, number], a: [number, number], b: [number, number]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: [number, number][] = [];
  for (const q of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
    lower.push(q);
  }
  const upper: [number, number][] = [];
  for (const q of p.reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop();
    upper.push(q);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

export const lerp = (from: number, to: number, t: number) => from + (to - from) * t;
export const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
