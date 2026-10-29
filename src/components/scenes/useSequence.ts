"use client";

import type { RefObject } from "react";
import type { Frame } from "@/lib/axo";
import { MEDIA, ScrollTrigger, gsap, useGSAP } from "@/lib/gsap";
import type { WorldState } from "@/lib/world";
import { createRenderer } from "../world/render";

/** A beat is reached through one or more phases, played in order. */
export type Phased = WorldState[];

type Options = {
  section: RefObject<HTMLElement | null>;
  world: RefObject<HTMLDivElement | null>;
  beats: Phased[];
  frame: (w: number, h: number, wide: boolean) => Frame;
  /** Where the drawing starts on page load; it settles into beat 0 once. */
  intro?: WorldState;
};

const STEP = 1.5; // timeline units per beat: 1 to move, 0.5 to hold
const SCROLL_PER_UNIT = 0.62; // of the viewport height

const last = (p: Phased) => p[p.length - 1];

/**
 * Drives a <World> through a list of beats. Elements marked [data-beat="i"]
 * inside the section are the captions for beat i.
 *
 * - Wide screens with motion allowed: the section is pinned and the beats are
 *   scrubbed by scroll, so reversing the scroll reverses the drawing exactly.
 * - Everything else: captions scroll normally past a sticky drawing, and the
 *   drawing moves to a caption's beat when that caption reaches the middle of
 *   the screen; under reduced motion it changes instantly.
 */
export function useSequence({ section, world, beats, frame, intro }: Options) {
  useGSAP(
    () => {
      const sec = section.current;
      const root = world.current;
      if (!sec || !root) return;
      const mm = gsap.matchMedia();
      mm.add({ any: MEDIA.any, scrub: MEDIA.scrub, reduce: MEDIA.reduce, wide: MEDIA.wide }, (ctx) => {
        const { scrub, reduce, wide } = ctx.conditions as { scrub: boolean; reduce: boolean; wide: boolean };
        const renderer = createRenderer(root, (w, h) => frame(w, h, wide));
        const st: WorldState = { ...last(beats[0]) };
        const draw = () => {
          renderer.render(st);
          // The drawing lightens with every beat; the page itself turns to paper only at the end.
          const page = Math.min(1, Math.max(0, (st.light - 0.75) / 0.25));
          sec.style.setProperty("--light", st.light.toFixed(3));
          sec.style.setProperty("--page-light", page.toFixed(3));
          sec.dataset.lit = page > 0.5 ? "true" : "false";
        };
        const ro = new ResizeObserver(() => renderer.resize());
        ro.observe(root);
        sec.dataset.mode = scrub ? "scrub" : "discrete";

        let introTween: gsap.core.Tween | undefined;
        if (intro && !reduce) {
          Object.assign(st, intro);
          introTween = gsap.to(st, { ...last(beats[0]), duration: 1.6, delay: 0.25, ease: "power2.inOut", onUpdate: draw });
        }
        draw();

        const captions = gsap.utils.toArray<HTMLElement>("[data-beat]", sec);
        let stopFocus = () => {};

        if (scrub) {
          const tl = gsap.timeline({ defaults: { ease: "none" }, onUpdate: draw });
          for (let i = 1; i < beats.length; i++) {
            const phases = beats[i];
            const d = 1 / phases.length;
            let from = last(beats[i - 1]);
            phases.forEach((to, k) => {
              tl.fromTo(st, { ...from }, { ...to, duration: d, immediateRender: false }, (i - 1) * STEP + 0.5 + k * d);
              from = to;
            });
          }
          captions.forEach((cap, i) => {
            const at = Number(cap.dataset.beat);
            if (at > 0) tl.fromTo(cap, { opacity: 0, y: 36 }, { opacity: 1, y: 0, duration: 0.35, immediateRender: false }, at * STEP - 0.35);
            if (at < beats.length - 1) tl.fromTo(cap, { opacity: 1, y: 0 }, { opacity: 0, y: -36, duration: 0.35, immediateRender: false }, at * STEP + 0.5);
            cap.dataset.index = String(i);
          });
          tl.to({}, { duration: 0.6 }, (beats.length - 1) * STEP);
          const hint = sec.querySelector("[data-hint]");
          if (hint) tl.to(hint, { opacity: 0, duration: 0.25 }, 0);
          const trigger = ScrollTrigger.create({
            trigger: sec,
            start: "top top",
            end: () => `+=${window.innerHeight * SCROLL_PER_UNIT * tl.duration()}`,
            pin: true,
            scrub: 0.6,
            animation: tl,
            invalidateOnRefresh: true,
            onUpdate: () => {
              if (introTween?.isActive()) introTween.progress(1);
            },
          });
          // Keyboard focus inside a caption that is not on screen yet (a link,
          // a terminal) scrolls the scene to that caption's beat.
          const onFocus = (e: FocusEvent) => {
            const cap = (e.target as HTMLElement).closest<HTMLElement>("[data-beat]");
            if (!cap) return;
            const at = (Number(cap.dataset.beat) * STEP + 0.25) / tl.duration();
            const y = trigger.start + (trigger.end - trigger.start) * at;
            if (Math.abs(window.scrollY - y) > 4) window.scrollTo({ top: y, behavior: "instant" });
          };
          sec.addEventListener("focusin", onFocus);
          stopFocus = () => sec.removeEventListener("focusin", onFocus);
        } else {
          let current = 0;
          const go = (i: number) => {
            if (i === current) return;
            sec.dataset.beat = String(i);
            introTween?.progress(1);
            const tl = gsap.timeline({ onUpdate: draw, defaults: { ease: "power2.inOut", overwrite: "auto" } });
            const phases = i === current + 1 ? beats[i] : [last(beats[i])];
            phases.forEach((to) => tl.to(st, { ...to, duration: 0.8 / phases.length }));
            if (reduce) tl.progress(1);
            current = i;
          };
          sec.dataset.beat = "0";
          captions.forEach((cap) => {
            const i = Number(cap.dataset.beat);
            // The line sits below the sticky drawing, so a caption counts once it is fully readable there.
            ScrollTrigger.create({ trigger: cap, start: "top 72%", end: "bottom 72%", onToggle: (self) => self.isActive && go(i) });
          });
        }

        return () => {
          stopFocus();
          ro.disconnect();
          introTween?.kill();
          delete sec.dataset.mode;
          delete sec.dataset.beat;
        };
      });
    },
    { scope: section },
  );
}
