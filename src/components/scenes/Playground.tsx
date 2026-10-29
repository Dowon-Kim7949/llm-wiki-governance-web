"use client";

import { useId, useRef, useState } from "react";
import type { Dictionary, DocId, FileId, Mode } from "@/content/types";
import { TRANSCRIPTS } from "@/content/transcripts";
import { MEDIA, gsap, useGSAP } from "@/lib/gsap";
import { outcome } from "@/lib/playground";
import { CAMERAS, FILES, state, type WorldState } from "@/lib/world";
import { World } from "../world/World";
import { createRenderer, type Renderer } from "../world/render";
import { Terminal } from "./Terminal";
import styles from "./Playground.module.css";

const FILE_IDS = Object.keys(FILES) as FileId[];
const MODES: Mode[] = ["lite", "standard", "strict"];
const DOC_NAME: Record<DocId, string> = { billing: "billing.md", shipping: "shipping.md" };

function target(file: FileId, committed: boolean, flagged: DocId[]): WorldState {
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

/**
 * Scene 03, the signature interaction. Everything shown is a pure function of
 * (file, committed, mode); the drawing tweens toward it, so rapid input can
 * only ever land on the state the controls show.
 */
export function Playground({ t }: { t: Dictionary }) {
  const p = t.playground;
  const ids = useId();
  const section = useRef<HTMLElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const renderer = useRef<Renderer | null>(null);
  const st = useRef<WorldState>(target("invoice", false, []));
  const [file, setFile] = useState<FileId>("invoice");
  const [committed, setCommitted] = useState(false);
  const [mode, setMode] = useState<Mode>("lite");
  const o = outcome(file, committed, mode);

  useGSAP(
    () => {
      const root = world.current;
      if (!root) return;
      const r = createRenderer(root, (w, h) => ({ x: 0, y: h * 0.02, w, h: h * 0.96 }));
      renderer.current = r;
      r.render(st.current);
      const ro = new ResizeObserver(() => r.resize());
      ro.observe(root);
      return () => ro.disconnect();
    },
    { scope: section },
  );

  useGSAP(
    () => {
      const r = renderer.current;
      if (!r) return;
      const s = st.current;
      const goal = target(file, committed, o.flagged);
      const draw = () => r.render(s);
      const reduce = window.matchMedia(MEDIA.reduce).matches;
      const { flagBilling, flagShipping, ...rest } = goal;
      const tl = gsap.timeline({ onUpdate: draw, defaults: { ease: "power2.inOut", overwrite: "auto" } });
      tl.to(s, { ...rest, duration: 0.6 }, 0);
      const raising = (flagBilling > s.flagBilling || flagShipping > s.flagShipping) && o.flagged.length > 0;
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
    { scope: section, dependencies: [file, committed, mode], revertOnUpdate: false },
  );

  const docs = (list: DocId[]) => (list.length ? list.map((d) => DOC_NAME[d]).join(p.and) : p.none);
  const result = !committed
    ? p.idle
    : !o.checked
      ? p.result.off
      : o.flagged.length === 0
        ? p.result.clear
        : (o.result === "fail" ? p.result.fail : p.result.warn).replace("{docs}", docs(o.flagged));
  const gate = o.result === "idle" ? "idle" : o.result === "fail" ? "fail" : o.result === "warning" ? "warn" : "pass";

  return (
    <section id="playground" ref={section} className={`${styles.playground} env-night`} aria-labelledby="playground-title">
      <div className={styles.inner}>
        <header className={styles.head}>
          <h2 id="playground-title" className={styles.heading}>{p.heading}</h2>
          <p className={styles.intro}>{p.intro}</p>
        </header>

        <div className={styles.controls}>
          <fieldset className={styles.group}>
            <legend className={styles.legend}>{p.fileLabel}</legend>
            <div className={styles.files}>
              {FILE_IDS.map((id) => (
                <label key={id} className={styles.file}>
                  <input type="radio" name={`${ids}-file`} value={id} checked={file === id} onChange={() => { setFile(id); setCommitted(false); }} />
                  <span className={styles.fileBox}>
                    <code className={styles.path}>{FILES[id].path}</code>
                    <span className={styles.cited}>{p.files[id].citedBy}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className={styles.group}>
            <p className={styles.legend} id={`${ids}-change`}>{p.changeLabel}</p>
            <button type="button" className={`btn ${committed ? "btn-secondary" : "btn-primary"} ${styles.commit}`} aria-describedby={`${ids}-change`} onClick={() => setCommitted((v) => !v)}>
              {committed ? p.revert : p.commit}
            </button>
          </div>

          <fieldset className={styles.group}>
            <legend className={styles.legend}>{p.modeLabel}</legend>
            <div className={styles.modes}>
              {MODES.map((m) => (
                <label key={m} className={styles.mode}>
                  <input type="radio" name={`${ids}-mode`} value={m} checked={mode === m} onChange={() => setMode(m)} />
                  <span>{p.modes[m].label}</span>
                </label>
              ))}
            </div>
            <p className={styles.modeSummary}>{p.modes[mode].summary}</p>
          </fieldset>
          <p className={styles.disclaimer}>{p.disclaimer}</p>
        </div>

        <div className={styles.bench}>
          <div className={styles.stage}>
            <World ref={world} t={t.world} />
          </div>
          <p className={styles.cites}>{p.cites.replace("{docs}", docs(o.cites))}</p>
          <div className={styles.readout}>
            <div className={styles.gate} data-gate={gate}>
              <svg viewBox="0 0 64 24" aria-hidden="true" className={styles.gateIcon}>
                <path d="M2 12h60" className={styles.gateTrack} />
                {gate === "fail" ? <path d="M32 2v20" className={styles.gateBar} /> : <path d="M32 12 46 2" className={styles.gateArm} />}
                {gate === "warn" && <path d="M54 4 61 17H47z" className={styles.gateWarn} />}
              </svg>
              <span>
                {p.gate.label}: <strong>{p.gate[gate]}</strong>
              </span>
            </div>
            <p className={styles.result} role="status" aria-live="polite">{result}</p>
          </div>
          {/* The terminal keeps its place while idle, so the page never changes height under the pinned scenes. */}
          <div className={styles.terminalSlot}>
            {committed ? (
              <Terminal label={p.terminal} runs={[TRANSCRIPTS.diffstat[file], TRANSCRIPTS.impact[file][mode]]} />
            ) : (
              <p className={styles.terminalIdle}>{p.idle}</p>
            )}
          </div>
          <p className={styles.next}>
            <a href="#review">{p.next}</a>
          </p>
        </div>
      </div>
    </section>
  );
}
