// Draws a WorldState into the markup of <World>. Pure in the sense that the
// same state always gives the same picture, so scrubbing backwards, jumping to
// a beat, or a burst of clicks can never leave the drawing between two stories.
import { clamp01, outline, plateTransform, project, slab, viewFor, type Frame } from "@/lib/axo";
import { CITES, DOCS, FILES, WORLD, type WorldState } from "@/lib/world";
import type { DocId, FileId } from "@/content/types";

const FILE_IDS = Object.keys(FILES) as FileId[];
const DOC_IDS = Object.keys(DOCS) as DocId[];
const FILE_LIFT = 6;

const moved = (st: WorldState, id: FileId) => (id === "invoice" ? st.movedInvoice : id === "shipping" ? st.movedShipping : st.movedFormat);
const focus = (st: WorldState, id: FileId) => (id === "invoice" ? st.focusInvoice : id === "shipping" ? st.focusShipping : st.focusFormat);
const pulse = (st: WorldState, id: FileId) => (id === "invoice" ? st.pulseInvoice : id === "shipping" ? st.pulseShipping : 0);

export type Renderer = { render: (st: WorldState) => void; resize: () => void };

export function createRenderer(root: HTMLElement, frameOf: (w: number, h: number) => Frame): Renderer {
  const one = <T extends Element>(sel: string) => root.querySelector(sel) as T;
  const el = (name: string) => one<HTMLElement>(`[data-el="${name}"]`);
  const floor = one<HTMLElement>('[data-plate="floor"]');
  const files = Object.fromEntries(FILE_IDS.map((id) => [id, one<HTMLElement>(`[data-plate="file-${id}"]`)])) as Record<FileId, HTMLElement>;
  const docs = Object.fromEntries(DOC_IDS.map((id) => [id, one<HTMLElement>(`[data-plate="doc-${id}"]`)])) as Record<DocId, HTMLElement>;
  const svgs = [one<SVGSVGElement>('[data-svg="under"]'), one<SVGSVGElement>('[data-svg="over"]')];
  const slabFloor = one<SVGPolygonElement>('[data-slab="floor"]');
  const slabFiles = Object.fromEntries(FILE_IDS.map((id) => [id, one<SVGPolygonElement>(`[data-slab="file-${id}"]`)])) as Record<FileId, SVGPolygonElement>;
  const slabDocs = Object.fromEntries(DOC_IDS.map((id) => [id, one<SVGPolygonElement>(`[data-slab="doc-${id}"]`)])) as Record<DocId, SVGPolygonElement>;
  const footprints = Object.fromEntries(DOC_IDS.map((id) => [id, one<SVGPolygonElement>(`[data-footprint="${id}"]`)])) as Record<DocId, SVGPolygonElement>;
  const cites = CITES.map((c) => {
    const g = one<SVGGElement>(`[data-cite="${c.id}"]`);
    return { ...c, g, line: g.querySelector("[data-line]") as SVGLineElement, pulse: g.querySelector("[data-pulse]") as SVGLineElement, foot: g.querySelector("[data-foot]") as SVGCircleElement };
  });
  const text = {
    needs: el("needs-billing"),
    verified: el("verified-billing"),
    seal: el("seal-billing"),
    stamp: el("stamp-billing"),
    atOld: el("at-old"),
    atNew: el("at-new"),
    claimBi: el("claim-bi"),
    pinBi: el("pin-bi"),
    claimOld: el("claim-old"),
    claimNew: el("claim-new"),
    flagBilling: el("flag-billing"),
    flagShipping: el("flag-shipping"),
    old: Object.fromEntries(FILE_IDS.map((id) => [id, el(`old-${id}`)])) as Record<FileId, HTMLElement>,
    fresh: Object.fromEntries(FILE_IDS.map((id) => [id, el(`new-${id}`)])) as Record<FileId, HTMLElement>,
  };

  let size = { w: root.clientWidth, h: root.clientHeight };
  let last: WorldState | null = null;

  function render(st: WorldState) {
    last = st;
    const { w, h } = size;
    if (!w || !h) return;
    const v = viewFor(frameOf(w, h), WORLD.w, WORLD.h);
    const c = st;
    for (const svg of svgs) svg.setAttribute("viewBox", `0 0 ${w} ${h}`);

    floor.style.transform = plateTransform(c, v, 0, 0, 0);
    floor.style.opacity = String(st.floor);
    slabFloor.setAttribute("points", slab(c, v, 0, 0, WORLD.w, WORLD.h, 0, 14));
    slabFloor.style.opacity = String(st.floor);

    const anyFocus = Math.max(st.focusInvoice, st.focusShipping, st.focusFormat);
    const fileAt = {} as Record<FileId, [number, number]>;
    for (const id of FILE_IDS) {
      const f = FILES[id];
      const m = moved(st, id);
      const x = f.x + f.shift[0] * m;
      const y = f.y + f.shift[1] * m;
      fileAt[id] = [x, y];
      const fx = focus(st, id);
      const lift = FILE_LIFT + 14 * fx;
      files[id].style.transform = plateTransform(c, v, x, y, lift);
      files[id].style.opacity = String(st.floor * (1 - st.dim * (1 - fx) * 0.7));
      files[id].dataset.focus = fx > 0.5 ? "on" : anyFocus > 0.5 ? "off" : "";
      // Once billing.md has been re-read against the new invoice.js, that change is settled.
      const settled = id === "invoice" ? st.follow : 0;
      files[id].dataset.moved = m * (1 - settled) > 0.5 ? "on" : "";
      files[id].dataset.settled = m > 0.5 && settled > 0.5 ? "on" : "";
      slabFiles[id].setAttribute("points", slab(c, v, x, y, f.w, f.h, lift, 8));
      slabFiles[id].style.opacity = files[id].style.opacity;
      text.old[id].style.opacity = String(1 - m);
      text.fresh[id].style.opacity = String(m);
    }

    const docAt = {} as Record<DocId, [number, number]>;
    for (const id of DOC_IDS) {
      const d = DOCS[id];
      const [x, y] = [d.x, d.y];
      docAt[id] = [x, y];
      const present = id === "shipping" ? st.docShipping : 1;
      const cited = CITES.filter((k) => k.doc === id).some((k) => focus(st, k.file) > 0.5);
      const opacity = present * (1 - st.dim * (cited ? 0 : 0.75));
      docs[id].style.transform = plateTransform(c, v, x, y, d.z);
      docs[id].style.opacity = String(opacity);
      docs[id].style.visibility = present < 0.01 ? "hidden" : "";
      footprints[id].setAttribute("points", outline(c, v, x, y, d.w, d.h, 0));
      footprints[id].style.opacity = String(opacity * st.floor * clamp01(st.tilt / 20));
      slabDocs[id].setAttribute("points", slab(c, v, x, y, d.w, d.h, d.z, 10));
      slabDocs[id].style.opacity = String(opacity);
    }

    for (const k of cites) {
      const d = DOCS[k.doc];
      const f = FILES[k.file];
      const [dx, dy] = docAt[k.doc];
      const [fx0, fy0] = fileAt[k.file];
      // Re-review rewrites the claim for the new code: its pin moves to stand over the moved file.
      const follows = k.doc === "billing" && k.file === "invoice" ? st.follow : 0;
      const [sx, sy] = FILES.invoice.shift;
      const top = project(c, v, dx + (k.x - d.x) + sx * follows, dy + (k.y - d.y) + sy * follows, d.z);
      const bottom = project(c, v, fx0 + (k.x - f.x), fy0 + (k.y - f.y), FILE_LIFT + 14 * focus(st, k.file));
      const len = Math.hypot(top[0] - bottom[0], top[1] - bottom[1]) || 1;
      const present = (k.doc === "shipping" ? st.docShipping : 1) * st.draw;
      for (const line of [k.line, k.pulse]) {
        line.setAttribute("x1", bottom[0].toFixed(2));
        line.setAttribute("y1", bottom[1].toFixed(2));
        line.setAttribute("x2", top[0].toFixed(2));
        line.setAttribute("y2", top[1].toFixed(2));
      }
      // Drawn from the doc down, like a plumb line being dropped. Once drawn,
      // the stylesheet's dash pattern for the line's state takes over.
      k.line.style.strokeDasharray = present < 0.999 ? `${len} ${len}` : "";
      k.line.style.strokeDashoffset = present < 0.999 ? String(-len * (1 - present)) : "";
      k.foot.setAttribute("cx", bottom[0].toFixed(2));
      k.foot.setAttribute("cy", bottom[1].toFixed(2));
      k.foot.style.opacity = String(present > 0.98 ? 1 : 0);

      const approved = k.doc === "billing" ? st.approved * (1 - st.downgraded) : 1;
      const lean = moved(st, k.file) * (k.doc === "billing" && k.file === "invoice" ? 1 - st.follow : 1);
      const flag = k.doc === "billing" ? st.flagBilling : st.flagShipping;
      const restored = follows > 0.5;
      // A finding names the changed file, so only the lines to that file turn into flags.
      const flagged = flag > 0.5 && lean > 0.5;
      k.g.dataset.state = restored && approved > 0.5 ? "held" : flagged ? "flag" : lean > 0.5 ? "lean" : approved > 0.5 ? "held" : "draft";
      const fx = focus(st, k.file);
      k.g.style.opacity = String(1 - st.dim * (1 - fx) * 0.8);

      const p = pulse(st, k.file);
      const seg = Math.min(70, len * 0.35);
      k.pulse.style.strokeDasharray = `${seg} ${len + seg}`;
      k.pulse.style.strokeDashoffset = String(seg - p * (len + seg));
      k.pulse.style.opacity = p > 0 && p < 1 ? "1" : "0";
    }

    const status = clamp01(st.approved - st.downgraded);
    text.needs.style.opacity = String(1 - status);
    text.verified.style.opacity = String(status);
    text.seal.style.transform = `scale(${0.4 + 0.6 * status})`;
    text.seal.style.opacity = String(status);
    // drift --downgrade changes status and last_updated only; the old stamp stays until re-approval.
    text.stamp.style.opacity = String(st.approved);
    text.atOld.style.opacity = String(1 - st.restamped);
    text.atNew.style.opacity = String(st.restamped);
    const [sx, sy] = FILES.invoice.shift;
    text.claimBi.style.translate = text.pinBi.style.translate = `${(sx * st.follow).toFixed(2)}px ${(sy * st.follow).toFixed(2)}px`;
    text.claimOld.style.opacity = String(1 - st.edited);
    text.claimNew.style.opacity = String(st.edited);
    text.flagBilling.style.opacity = String(st.flagBilling);
    text.flagShipping.style.opacity = String(st.flagShipping);

    root.style.setProperty("--light", String(st.light));
    root.dataset.ready = "true";
  }

  function resize() {
    size = { w: root.clientWidth, h: root.clientHeight };
    if (last) render(last);
  }

  return { render, resize };
}
