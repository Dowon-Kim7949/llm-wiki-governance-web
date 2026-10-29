// One place that registers GSAP's plugins. Client components import from here.
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
  // Phones resize the viewport as the address bar slides; that is not a layout change.
  ScrollTrigger.config({ ignoreMobileResize: true });
}

/**
 * Wide screens with motion allowed get pinned, scrubbed scenes. Everything else
 * (phones, tablets below 64rem, reduced motion) gets discrete beats.
 */
export const MEDIA = {
  // gsap.matchMedia() only runs a callback while one of its conditions matches; this one always does.
  any: "(min-width: 0px)",
  scrub: "(min-width: 64rem) and (prefers-reduced-motion: no-preference)",
  reduce: "(prefers-reduced-motion: reduce)",
  wide: "(min-width: 64rem)",
};

export { gsap, ScrollTrigger, useGSAP };
