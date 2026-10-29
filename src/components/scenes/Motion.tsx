"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type ComponentProps } from "react";

// Everything that imports GSAP is loaded here, once the page has loaded and
// the browser is idle, in chunks of its own. The scenes' text never depends on
// it: until it arrives there are no drawings, and captions read as plain text.
const SequenceChunk = dynamic(() => import("./SequenceMotion"), { ssr: false });
const PlaygroundChunk = dynamic(() => import("./PlaygroundMotion"), { ssr: false });
const ScrollSetupChunk = dynamic(() => import("../ScrollSetup").then((m) => m.ScrollSetup), { ssr: false });

function useAfterLoad() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // Safari has no requestIdleCallback; a short timeout after load does the same job there.
    const ric = window.requestIdleCallback as typeof window.requestIdleCallback | undefined;
    let idle = 0;
    let timer = 0;
    const go = () => {
      if (ric) idle = ric.call(window, () => setReady(true), { timeout: 800 });
      else timer = window.setTimeout(() => setReady(true), 100);
    };
    if (document.readyState === "complete") go();
    else window.addEventListener("load", go, { once: true });
    return () => {
      window.removeEventListener("load", go);
      if (idle) window.cancelIdleCallback(idle);
      window.clearTimeout(timer);
    };
  }, []);
  return ready;
}

export function SequenceMotion(props: ComponentProps<typeof SequenceChunk>) {
  return useAfterLoad() ? <SequenceChunk {...props} /> : null;
}

export function PlaygroundMotion(props: ComponentProps<typeof PlaygroundChunk>) {
  return useAfterLoad() ? <PlaygroundChunk {...props} /> : null;
}

export function ScrollSetup() {
  return useAfterLoad() ? <ScrollSetupChunk /> : null;
}
