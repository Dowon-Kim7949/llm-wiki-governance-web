"use client";

import { useEffect, useRef, type RefObject } from "react";
import styles from "./Links.module.css";

/**
 * aligned: verified and in line. shifted: the cited file changed and the check
 * reports it. draft: waiting for review. unchecked: changed, but lite does not
 * check. muted: not part of the current story.
 */
export type LinkState = "aligned" | "shifted" | "draft" | "unchecked" | "muted";
export type LinkSpec = { from: string; to: string; state: LinkState; label?: string };

const find = (root: Element, a: string) => root.querySelector<HTMLElement>(a.includes("[") ? a : `[data-a="${a}"]`);

/** Keep drawing for this long after a change, while cards and lines are still moving. */
const SETTLE_MS = 1100;

/**
 * Evidence connectors between anchors ([data-a]) inside the parent element.
 * Side by side, a connector is straight when the doc's sentence and the code
 * line are on the same row and steps when they are not; stacked (phones), it
 * runs down the right-hand side. Redrawn on resize, font load and whenever
 * `watch` changes.
 */
export function Links({ links, watch }: { links: LinkSpec[]; watch?: unknown }) {
  const svg = useRef<SVGSVGElement>(null);
  const spec = useRef(links);
  useEffect(() => {
    spec.current = links;
  });

  useEffect(() => {
    const el = svg.current;
    const root = el?.parentElement;
    if (!el || !root) return;
    const draw = () => {
      const r = root.getBoundingClientRect();
      el.setAttribute("viewBox", `0 0 ${r.width} ${r.height}`);
      spec.current.forEach((l, i) => {
        const g = el.children[i] as SVGGElement | undefined;
        const a = find(root, l.from);
        const b = find(root, l.to);
        if (!g) return;
        if (!a || !b) {
          g.style.display = "none";
          return;
        }
        g.style.display = "";
        const A = a.getBoundingClientRect();
        const B = b.getBoundingClientRect();
        const ay = A.top + A.height / 2 - r.top;
        const by = B.top + B.height / 2 - r.top;
        let d: string;
        let x1: number;
        let x2: number;
        let lx: number;
        let ly: number;
        if (B.left - r.left > A.right - r.left + 12) {
          x1 = A.right - r.left + 8;
          x2 = B.left - r.left - 8;
          const xm = (x1 + x2) / 2;
          const dy = by - ay;
          if (Math.abs(dy) < 1.5) d = `M${x1} ${ay}H${x2}`;
          else {
            const s = Math.sign(dy);
            const k = Math.min(12, Math.abs(dy) / 2, (x2 - x1) / 4);
            d = `M${x1} ${ay}H${xm - k}Q${xm} ${ay} ${xm} ${ay + s * k}V${by - s * k}Q${xm} ${by} ${xm + k} ${by}H${x2}`;
          }
          lx = xm;
          ly = Math.min(ay, by) - 10;
        } else {
          x1 = A.right - r.left + 6;
          x2 = B.right - r.left + 6;
          const xg = Math.max(A.right, B.right) - r.left + 16;
          const k = Math.min(10, Math.abs(by - ay) / 2);
          d = `M${x1} ${ay}H${xg - k}Q${xg} ${ay} ${xg} ${ay + k}V${by - k}Q${xg} ${by} ${xg - k} ${by}H${x2}`;
          lx = xg;
          ly = (ay + by) / 2;
        }
        const [path, start, end, label] = Array.from(g.children) as SVGElement[];
        path.setAttribute("d", d);
        start.setAttribute("cx", String(x1));
        start.setAttribute("cy", String(ay));
        end.setAttribute("cx", String(x2));
        end.setAttribute("cy", String(by));
        label.setAttribute("x", String(lx));
        label.setAttribute("y", String(ly));
      });
    };
    let frame = 0;
    let until = 0;
    const loop = () => {
      draw();
      if (performance.now() < until) frame = requestAnimationFrame(loop);
    };
    const settle = () => {
      until = performance.now() + SETTLE_MS;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(loop);
    };
    settle();
    const ro = new ResizeObserver(settle);
    ro.observe(root);
    document.fonts?.ready.then(settle);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [watch]);

  return (
    <svg ref={svg} className={styles.links} aria-hidden="true">
      {links.map((l, i) => (
        <g key={`${l.from}-${l.to}-${i}`} className={styles[l.state]}>
          <path className={styles.line} />
          <circle className={styles.dot} r="4.5" />
          <circle className={styles.dot} r="4.5" />
          <text className={styles.label} textAnchor="middle">
            {l.label ?? ""}
          </text>
        </g>
      ))}
    </svg>
  );
}

/**
 * Moves a card vertically so its anchor sits on the same row as a target
 * anchor: the doc "standing on" its evidence. Only when the two sit side by
 * side; stacked layouts leave the card alone.
 */
export function useAlign(root: RefObject<HTMLElement | null>, card: string, from: string, to: string, watch?: unknown) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const apply = () => {
      const c = el.querySelector<HTMLElement>(card);
      const a = find(el, from);
      const b = find(el, to);
      if (!c || !a || !b) return;
      const A = a.getBoundingClientRect();
      const B = b.getBoundingClientRect();
      if (B.left < c.getBoundingClientRect().right) {
        c.style.translate = "";
        return;
      }
      const current = parseFloat(getComputedStyle(c).translate.split(" ")[1] ?? "0") || 0;
      const base = A.top + A.height / 2 - current;
      c.style.translate = `0 ${(B.top + B.height / 2 - base).toFixed(1)}px`;
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    document.fonts?.ready.then(apply);
    return () => ro.disconnect();
  }, [root, card, from, to, watch]);
}
