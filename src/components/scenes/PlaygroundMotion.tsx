"use client";

import { useRef, type RefObject } from "react";
import type { Dictionary, DocId, FileId } from "@/content/types";
import { MEDIA, gsap, useGSAP } from "@/lib/gsap";
import { CAMERAS, state, type WorldState } from "@/lib/world";
import { World } from "../world/World";
import { createRenderer, type Renderer } from "../world/render";

export function target(file: FileId, committed: boolean, flagged: DocId[]): WorldState {
  const on = (id: FileId) => (file === id ? 1 : 0);
  const moved = (id: FileId) => (committed && file === id ? 1 : 0);
  return state({
    ...CAMERAS.bench,
    focusInvoice: on("invoice"),
    focusShipping: on("shipping"),
    focusFormat: on("format"),
    dim: 0.6,
    movedInvoice: moved("invoice"),
    movedShipping: moved("shipping"),
    movedFormat: moved("format"),
    flagBilling: flagged.includes("billing") ? 1 : 0,
    flagShipping: flagged.includes("shipping") ? 1 : 0,
  });
}

type Props = {
  t: Dictionary["world"];
  scope: RefObject<HTMLElement | null>;
  file: FileId;
  committed: boolean;
  flagged: DocId[];
};

/**
 * The playground drawing and its motion, loaded after first paint (./Motion.tsx). It starts
 * from whatever the controls already say and then tweens toward each new
 * state; tweens overwrite each other, so a burst of input ends on the last one.
 */
export default function PlaygroundMotion({ t, scope, file, committed, flagged }: Props) {
  const world = useRef<HTMLDivElement>(null);
  const renderer = useRef<Renderer | null>(null);
  const st = useRef<WorldState | null>(null);

  useGSAP(
    () => {
      const root = world.current;
      if (!root) return;
      st.current = target(file, committed, flagged);
      const r = createRenderer(root, (w, h) => ({ x: 0, y: h * 0.02, w, h: h * 0.96 }));
      renderer.current = r;
      r.render(st.current);
      const ro = new ResizeObserver(() => r.resize());
      ro.observe(root);
      return () => ro.disconnect();
    },
    { scope },
  );

  useGSAP(
    () => {
      const r = renderer.current;
      const s = st.current;
      if (!r || !s) return;
      const goal = target(file, committed, flagged);
      const draw = () => r.render(s);
      const reduce = window.matchMedia(MEDIA.reduce).matches;
      const { flagBilling, flagShipping, ...rest } = goal;
      const tl = gsap.timeline({ onUpdate: draw, defaults: { ease: "power2.inOut", overwrite: "auto" } });
      tl.to(s, { ...rest, duration: 0.6 }, 0);
      const raising = (flagBilling > s.flagBilling || flagShipping > s.flagShipping) && flagged.length > 0;
      if (raising) {
        // The check climbs every line hanging from the changed file, then the docs are flagged.
        const pulse = file === "invoice" ? "pulseInvoice" : "pulseShipping";
        tl.fromTo(s, { [pulse]: 0 }, { [pulse]: 1, duration: 0.7, ease: "none" }, 0.45);
        tl.to(s, { flagBilling, flagShipping, duration: 0.3 }, 1.1);
      } else {
        tl.to(s, { flagBilling, flagShipping, duration: 0.3 }, 0);
      }
      if (reduce) tl.progress(1);
    },
    { scope, dependencies: [file, committed, flagged.join()], revertOnUpdate: false },
  );

  return <World ref={world} t={t} />;
}
