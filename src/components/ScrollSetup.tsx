"use client";

import { useEffect } from "react";
import { ScrollTrigger } from "@/lib/gsap";

/**
 * Pinned scenes add their scroll length after hydration and again when web
 * fonts change line breaks. Recalculate then, and if the page was opened at
 * a #section (for example from the language switch), land on it once the
 * layout is final instead of where it was before the scenes were pinned.
 */
export function ScrollSetup() {
  useEffect(() => {
    let landed = false;
    const land = () => {
      if (landed) return;
      landed = true;
      const id = decodeURIComponent(window.location.hash.slice(1));
      const target = id && /^[a-z-]+$/.test(id) ? document.getElementById(id) : null;
      if (target) target.scrollIntoView({ behavior: "instant", block: "start" });
    };
    ScrollTrigger.addEventListener("refresh", land);
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 400);
    // Content that changes height (an opened <details>, a reflow) moves every
    // pinned scene below it; recalculate once it settles.
    let pending = 0;
    let lastHeight = document.body.offsetHeight;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(pending);
      pending = window.setTimeout(() => {
        const h = document.body.offsetHeight;
        if (Math.abs(h - lastHeight) > 2) ScrollTrigger.refresh();
        lastHeight = h;
      }, 150);
    });
    const main = document.getElementById("main");
    if (main) ro.observe(main);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(pending);
      ro.disconnect();
      ScrollTrigger.removeEventListener("refresh", land);
    };
  }, []);
  return null;
}
