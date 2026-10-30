"use client";

import { useId, useRef, useState } from "react";
import type { Dictionary, DocId, FileId, Mode } from "@/content/types";
import { TRANSCRIPTS } from "@/content/transcripts";
import { CITES, DOC_IDS, DOCS, FILE_IDS, FILES } from "@/lib/demo";
import { outcome } from "@/lib/playground";
import { CodeCard, DocCard, type Mark } from "../figure/Cards";
import { Links, type LinkState } from "../figure/Links";
import { Terminal } from "./Terminal";
import styles from "./Playground.module.css";

const MODES: Mode[] = ["lite", "standard", "strict"];

/**
 * Scene 04, the one place the visitor causes the change. Everything shown is
 * a pure function of (file, applied, mode) and src/lib/playground.ts, which is
 * checked against the real v1.42.0 output; the terminal is supporting evidence.
 */
export function Playground({ t }: { t: Dictionary }) {
  const p = t.playground;
  const ids = useId();
  const map = useRef<HTMLDivElement>(null);
  const [file, setFile] = useState<FileId>("invoice");
  const [applied, setApplied] = useState(false);
  const [mode, setMode] = useState<Mode>("standard");
  const [notice, setNotice] = useState("");
  const o = outcome(file, applied, mode);

  const pick = (next: FileId) => {
    if (next === file) return;
    setNotice(applied ? p.switched.replace("{file}", FILES[next].path) : "");
    setFile(next);
    setApplied(false);
  };

  const docName = (d: DocId) => DOCS[d].name;
  const list = (docs: DocId[]) => docs.map(docName).join(p.and);
  const markOf = (d: DocId): Mark => {
    if (!applied) return null;
    if (!o.cites.includes(d)) return "unaffected";
    return o.checked ? "flagged" : "unchecked";
  };
  const linkState = (f: FileId): LinkState => (applied && f === file ? (o.checked ? "shifted" : "unchecked") : "aligned");
  const ci = !applied ? "idle" : !o.checked ? "off" : o.result === "fail" ? "fail" : o.result === "warning" ? "warn" : "pass";
  const why = !applied ? p.why.idle : o.cites.length === 0 ? p.why.none : p.why[mode];
  const ciText = p.ci[ci].replace("{n}", String(o.flagged.length));

  return (
    <section id="playground" className={`${styles.playground} env-night`} aria-labelledby="playground-title">
      <header className={styles.head}>
        <h2 id="playground-title" className={styles.heading}>{p.heading}</h2>
        <p className={styles.lede}>{p.lede}</p>
        <p className={styles.disclaimer}>{p.disclaimer}</p>
      </header>

      <div className={styles.bench}>
        <div className={styles.controls}>
          <fieldset className={styles.group}>
            <legend className={styles.legend}>{p.fileLabel}</legend>
            <div className={styles.files}>
              {FILE_IDS.map((id) => (
                <label key={id} className={styles.file}>
                  <input type="radio" name={`${ids}-file`} value={id} checked={file === id} onChange={() => pick(id)} />
                  <span className={styles.fileBox}>
                    <code className={styles.path}>{FILES[id].path}</code>
                    <span className={styles.cited}>{p.files[id].citedBy}</span>
                  </span>
                </label>
              ))}
            </div>
            <p className={styles.note}>{p.resetNote}</p>
            <p className={styles.notice} role="status">{notice}</p>
          </fieldset>

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
            <p className={styles.note}>{p.modes[mode].summary}</p>
          </fieldset>

          <button type="button" className={`btn ${applied ? "btn-secondary" : "btn-primary"} ${styles.apply}`} aria-pressed={applied} onClick={() => { setApplied((v) => !v); setNotice(""); }}>
            {applied ? p.undo : p.apply}
          </button>
        </div>

        <div ref={map} className={styles.map} aria-hidden="true">
          <div className={styles.mapDocs}>
            {DOC_IDS.map((d) => (
              <DocCard key={d} doc={d} t={t.cards} status="verified" mark={markOf(d)} claim={d === "billing" ? t.cards.claimInvoice : t.cards.claimShippingFee} anchor={`pg-${d}`} compact />
            ))}
          </div>
          <div className={styles.mapFiles}>
            {FILE_IDS.map((f) => (
              <CodeCard key={f} file={f} t={t.cards} state={applied && f === file ? "changed" : "unchanged"} anchor={`pg-${f}`} selected={f === file} compact />
            ))}
          </div>
          <Links
            links={CITES.map((c) => ({ from: `pg-${c.doc}-ev${DOCS[c.doc].evidence.findIndex((e) => e.startsWith(FILES[c.file].path))}`, to: `pg-${c.file}-line`, state: linkState(c.file) }))}
            watch={`${file}-${applied}-${mode}`}
          />
        </div>

        <div className={styles.outcome} data-ci={ci}>
          <h3 className={styles.outcomeTitle}>{p.result.heading}</h3>
          <dl className={styles.facts}>
            <div>
              <dt>{p.result.changed}</dt>
              <dd>
                {applied ? (
                  <>
                    <code>{FILES[file].path}</code> {p.files[file].change}
                  </>
                ) : (
                  p.result.idle
                )}
              </dd>
            </div>
            <div>
              <dt>{p.result.affected}</dt>
              <dd>
                {!applied ? "—" : o.flagged.length ? (
                  <span className={styles.docChips}>
                    {o.flagged.map((d) => (
                      <span key={d} className={styles.docChip}>
                        <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 1v10M3 1.5h7L8 4l2 2.5H3z" fill="currentColor" stroke="currentColor" strokeWidth="1.2" /></svg>
                        {docName(d)}
                      </span>
                    ))}
                  </span>
                ) : (
                  <>
                    {p.result.none}
                    <span className={styles.sub}>{p.files[file].citedBy}</span>
                  </>
                )}
              </dd>
            </div>
            <div>
              <dt>{p.result.ci}</dt>
              <dd>
                <span className={styles.ci}>
                  <svg viewBox="0 0 16 16" aria-hidden="true" className={styles.ciIcon}>
                    {ci === "fail" && <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />}
                    {ci === "warn" && <path d="M8 1.5 15 14H1z" fill="currentColor" />}
                    {(ci === "pass" || ci === "off") && <path d="M2.5 8.5 6.5 12.5 13.5 4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />}
                    {ci === "idle" && <circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2.5" />}
                  </svg>
                  {ciText}
                  {o.exit !== null && <span className={styles.exit}>exit {o.exit}</span>}
                </span>
              </dd>
            </div>
            <div>
              <dt>{p.result.why}</dt>
              <dd>{why}</dd>
            </div>
            <div>
              <dt>{p.result.next}</dt>
              <dd>
                {!applied ? (
                  p.next.idle
                ) : o.flagged.length ? (
                  <>
                    <a href="#review" className={styles.nextLink}>{p.next.review}</a>
                    {file !== "invoice" && <span className={styles.sub}>{p.next.example}</span>}
                  </>
                ) : o.cites.length && !o.checked ? (
                  <>
                    {p.next.lite}
                    <button type="button" className={styles.inline} onClick={() => setMode("standard")}>{p.next.liteAction}</button>
                  </>
                ) : (
                  <>
                    {p.next.none} <a href="#review" className={styles.nextLink}>{p.next.review}</a>
                  </>
                )}
              </dd>
            </div>
          </dl>
          {applied && (
            <details className={styles.evidence}>
              <summary>{p.terminal}</summary>
              <Terminal runs={[TRANSCRIPTS.diffstat[file], TRANSCRIPTS.impact[file][mode]]} />
            </details>
          )}
          <p className="visually-hidden" aria-live="polite">
            {applied ? `${ciText}. ${p.result.affected}: ${o.flagged.length ? list(o.flagged) : p.result.none}.` : ""}
          </p>
        </div>
      </div>
    </section>
  );
}
