"use client";

import { useEffect, useRef, useState } from "react";

type State = "idle" | "copied" | "failed";

export function CopyButton({ text, label, copied, failed, target }: { text: string; label: string; copied: string; failed: string; target: string }) {
  const [state, setState] = useState<State>("idle");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy() {
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      ok = false;
    }
    setState(ok ? "copied" : "failed");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState("idle"), 2400);
  }

  return (
    <>
      <button type="button" className="copy-btn" onClick={copy} aria-describedby={target} data-state={state}>
        {state === "copied" ? copied : label}
      </button>
      <span className="visually-hidden" role="status">
        {state === "copied" ? copied : state === "failed" ? failed : ""}
      </span>
      {state === "failed" && <span className="copy-failed">{failed}</span>}
    </>
  );
}
