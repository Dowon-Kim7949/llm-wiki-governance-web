"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Dictionary, Mode } from "@/content/types";
import { SOURCE_AFTER_ADDED, SOURCE_AFTER_REMOVED, SOURCE_BEFORE, transcriptFor } from "@/content/demo-transcript";
import { Marker, MarkerShapes, type MarkerKind } from "./Marker";
import styles from "./Demo.module.css";

type DemoText = Dictionary["demo"];
type DocState = "none" | "needs" | "verified" | "flagged" | "unchecked";

const MODES: Mode[] = ["lite", "standard", "strict"];
const MARKER: Record<DocState, MarkerKind> = { none: "none", needs: "pending", verified: "held", flagged: "flag", unchecked: "off" };

/** The whole simulation is a pure function of (step, mode). */
function stateAt(step: number, mode: Mode) {
  const doc: DocState =
    step < 1 ? "none" : step < 3 ? "needs" : step === 5 ? (mode === "lite" ? "unchecked" : "flagged") : "verified";
  return {
    doc,
    docExists: step >= 1,
    sourceChanged: step >= 4,
    docFixed: step >= 6,
    stamped: step >= 3,
  };
}

export function Demo({ t }: { t: DemoText }) {
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<Mode>("lite");
  const ids = useId();
  const recordRef = useRef<HTMLDivElement>(null);
  const follow = useRef(false);
  const total = t.steps.length;
  const s = stateAt(step, mode);
  const current = t.steps[step];
  const transcript = transcriptFor(step, mode);
  const statusText = t.status[s.doc];
  const stepLabel = t.stepOf.replace("{n}", String(step + 1)).replace("{total}", String(total));

  // A step the reader chose is shown where they can see it: when the record's
  // heading is off screen (phones, or the pager at the bottom), bring it up.
  // Focus stays on the control; the live region announces the change.
  const go = (next: number) => {
    follow.current = true;
    setStep(next);
  };

  useEffect(() => {
    const el = recordRef.current;
    if (!follow.current || !el) return;
    follow.current = false;
    const top = el.getBoundingClientRect().top;
    const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
    if (top >= margin - 1 && top + 96 <= window.innerHeight) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
  }, [step]);

  // Survey line state: absent until the doc cites, strained once the source moved.
  const line = !s.docExists ? "absent" : s.sourceChanged && !s.docFixed ? (step === 5 && mode !== "lite" ? "flagged" : "strained") : s.stamped ? "held" : "draft";

  return (
    <div className={styles.demo}>
      <p className={styles.disclaimer}>{t.disclaimer}</p>

      <div className={styles.controls}>
        <nav aria-label={t.controlsLabel}>
          <ol className={styles.stations}>
            {t.steps.map((item, i) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={styles.station}
                  aria-current={i === step ? "step" : undefined}
                  onClick={() => go(i)}
                >
                  <span className={styles.stationNum} aria-hidden="true">{i + 1}</span>
                  <span className={styles.stationName}>{item.title}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <fieldset className={styles.modes}>
          <legend>{t.modeLabel}</legend>
          <div className={styles.modeRow}>
            {MODES.map((m) => (
              <label key={m} className={styles.mode}>
                <input type="radio" name={`${ids}-mode`} value={m} checked={mode === m} onChange={() => setMode(m)} />
                <span>{t.modes[m].label}</span>
              </label>
            ))}
          </div>
          <p className={styles.modeSummary}>{t.modes[mode].summary}</p>
          <p className={styles.modeHint}>{t.modeHint}</p>
        </fieldset>
      </div>

      <div className={styles.stage}>
        <div className={styles.plotCol}>
          <svg className={styles.plot} viewBox="0 0 420 300" role="img" aria-labelledby={`${ids}-plot`}>
            <title id={`${ids}-plot`}>{`${stepLabel}. ${current.title}. ${t.status.title}: ${statusText}.`}</title>
            <defs>
              <pattern id={`${ids}-grid`} width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M24 0H0V24" fill="none" stroke="var(--rule)" strokeOpacity="0.25" />
              </pattern>
            </defs>
            <rect width="420" height="300" fill={`url(#${ids}-grid)`} />

            {line !== "absent" && (
              <line
                x1="96" y1="150" x2="290" y2="150"
                className={styles[`line_${line}`]}
              />
            )}

            {/* source benchmark */}
            <g>
              {s.sourceChanged && <rect x="58" y="112" width="40" height="40" fill="none" stroke="var(--flag)" strokeWidth="1.5" strokeDasharray="4 3" />}
              <rect
                x={s.sourceChanged ? 68 : 58}
                y={s.sourceChanged ? 122 : 112}
                width="40" height="40"
                fill="var(--paper)"
                stroke={s.sourceChanged ? "var(--flag)" : "var(--ink)"}
                strokeWidth="3"
                className={styles.bench}
              />
              <circle cx={s.sourceChanged ? 88 : 78} cy={s.sourceChanged ? 142 : 132} r="5" fill={s.sourceChanged ? "var(--flag)" : "var(--ink)"} />
              <text x="40" y="196" className={styles.plotLabel}>src/invoice.js</text>
              <text x="40" y="216" className={styles.plotSub}>{s.sourceChanged ? "price * qty" : "price"}</text>
            </g>

            {/* document station */}
            {s.docExists && (
              <g>
                <path d="M290 104h70l22 22v70h-92z" fill="var(--paper-raised)" stroke="var(--ink)" strokeWidth="3" strokeDasharray={s.doc === "needs" ? "7 5" : undefined} />
                <path d="M360 104v22h22" fill="none" stroke="var(--ink)" strokeWidth="3" />
                <path d="M304 146h58M304 160h44M304 174h54" stroke="var(--rule)" strokeWidth="3" />
                <svg x="318" y="62" width="34" height="34" viewBox="0 0 16 16" aria-hidden="true">
                  <MarkerShapes kind={MARKER[s.doc]} />
                </svg>
                <text x="276" y="226" className={styles.plotLabel}>billing.md</text>
                <text x="276" y="246" className={styles.plotSub}>{`status: ${s.doc === "needs" ? "needs_review" : "verified"}`}</text>
              </g>
            )}
          </svg>
          <ul className={styles.legend}>
            <li><span className={styles.swatchLine} aria-hidden="true" />{t.legend.citation}</li>
            <li><span className={styles.swatchBench} aria-hidden="true" />{t.legend.unchanged}</li>
            <li><span className={`${styles.swatchBench} ${styles.swatchMoved}`} aria-hidden="true" />{t.legend.changed}</li>
          </ul>
        </div>

        <div className={styles.record}>
          <div ref={recordRef} className={styles.recordHead} aria-live="polite" aria-atomic="true">
            <p className={styles.stepLabel}>{stepLabel}</p>
            <h3 className={styles.stepTitle}>{current.title}</h3>
            <p className={styles.status}>
              <Marker kind={MARKER[s.doc]} />
              <span>
                <span className="visually-hidden">{t.status.title}: </span>
                {statusText}
              </span>
            </p>
            <p className={styles.body}>{current.body}</p>
            {step === 5 && <p className={styles.modeNow}>{t.modes[mode].summary}</p>}
          </div>
          <p className={styles.caveat}>{current.caveat}</p>

          <div className={styles.files}>
            <div className={styles.file}>
              <p className={styles.fileName}>{t.fileSource} <code>src/invoice.js</code></p>
              {s.sourceChanged ? (
                <pre className={styles.code} tabIndex={0}><code>{"export function computeTotal(items) {\n"}<del className={styles.del}>{`- ${SOURCE_AFTER_REMOVED.trim()}`}</del>{"\n"}<ins className={styles.ins}>{`+ ${SOURCE_AFTER_ADDED.trim()}`}</ins>{"\n}"}</code></pre>
              ) : (
                <pre className={styles.code} tabIndex={0}><code>{SOURCE_BEFORE}</code></pre>
              )}
            </div>
            {s.docExists && (
              <div className={styles.file}>
                <p className={styles.fileName}>{t.fileDoc} <code>docs/llm-wiki/domains/billing.md</code></p>
                <pre className={styles.code} tabIndex={0}><code>{`status: ${s.doc === "needs" ? "needs_review" : "verified"}\nevidence:\n  - src/invoice.js#symbol:computeTotal${s.stamped ? "\nreviewed_by: maintainer\nreviewed_at: 2026-10-29" : ""}\n---\n`}<span className={s.sourceChanged && !s.docFixed ? styles.stale : undefined}>{s.docFixed ? t.sentenceAfter : t.sentenceBefore}</span></code></pre>
              </div>
            )}
          </div>

          {transcript && (
            <div className={styles.terminal}>
              <p className={styles.fileName}>{t.terminal}</p>
              <pre className={styles.code} tabIndex={0}><code>{`$ ${transcript.cmd}\n${transcript.out}${transcript.exit !== undefined ? `\n(exit ${transcript.exit})` : ""}`}</code></pre>
            </div>
          )}

          <div className={styles.pager}>
            <button type="button" className="btn btn-secondary" onClick={() => go(Math.max(0, step - 1))} disabled={step === 0}>
              {t.prev}
            </button>
            <button type="button" className="btn btn-primary" onClick={() => go(Math.min(total - 1, step + 1))} disabled={step === total - 1}>
              {t.next}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
