"use client";

import { useRef, useState, type ReactNode } from "react";
import type { Dictionary } from "@/content/types";
import { CodeCard, DocCard } from "../figure/Cards";
import { Links, useAlign, type LinkState } from "../figure/Links";
import styles from "./Review.module.css";

type Props = { t: Dictionary; commands: (ReactNode | null)[] };

// What the doc looks like after each step (src/content: review.steps).
const STATES: { status: "verified" | "needs_review"; flagged: boolean; fixed: boolean; link: LinkState; stamp: string }[] = [
  { status: "verified", flagged: true, fixed: false, link: "shifted", stamp: "2026-10-27" },
  { status: "needs_review", flagged: false, fixed: false, link: "draft", stamp: "2026-10-27" },
  { status: "needs_review", flagged: false, fixed: true, link: "draft", stamp: "2026-10-27" },
  { status: "verified", flagged: false, fixed: true, link: "aligned", stamp: "2026-10-29" },
];

/**
 * Scene 05: the human part, as steps the visitor walks through at their own
 * pace. Once the sentence is fixed the doc moves to stand on the new code line,
 * so the evidence runs straight again; approval turns it from draft to held.
 */
export function Review({ t, commands }: Props) {
  const r = t.review;
  const desk = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const s = STATES[step];
  const total = r.steps.length;
  const current = r.steps[step];

  useAlign(desk, "[data-doc]", "review-claim", s.fixed ? "review-code-line" : '[data-a="review-code-old"], [data-a="review-code-line"]', step);

  return (
    <section id="review" className={`${styles.review} env-paper`} aria-labelledby="review-title">
      <header className={styles.head}>
        <h2 id="review-title" className={styles.heading}>{r.heading}</h2>
        <p className={styles.lede}>{r.lede}</p>
      </header>

      <ol className={styles.rail}>
        {r.steps.map((st, i) => (
          <li key={st.id}>
            <button type="button" className={styles.railStep} aria-current={i === step ? "step" : undefined} data-done={i < step ? "" : undefined} onClick={() => setStep(i)}>
              <span className={styles.railNum} aria-hidden="true">{i + 1}</span>
              <span>{st.label}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className={styles.stage}>
        <div className={styles.text}>
          <div aria-live="polite">
            <p className={styles.count}>{r.stepOf.replace("{n}", String(step + 1)).replace("{total}", String(total))}</p>
            <h3 className={styles.title}>{current.title}</h3>
            <p className={styles.body}>{current.body}</p>
            {current.note && <p className={styles.note}>{current.note}</p>}
          </div>
          {commands[step] && (
            <details className={styles.commands} key={step}>
              <summary>{r.commands}</summary>
              {commands[step]}
            </details>
          )}
        </div>

        <div ref={desk} className={styles.desk} aria-hidden="true">
          <DocCard
            doc="billing"
            t={t.cards}
            status={s.status}
            mark={s.flagged ? "flagged" : null}
            claim={t.cards.claimInvoice}
            fixed={s.fixed ? t.cards.claimInvoiceFixed : null}
            reviewedAt={s.stamp}
            freshStamp={step === 3}
            anchor="review"
            className={styles.doc}
          />
          <CodeCard file="invoice" t={t.cards} state="changed" anchor="review-code" className={styles.code} />
          <Links links={[{ from: "review-claim", to: "review-code-line", state: s.link, label: t.cards.evidence }]} watch={step} />
        </div>

        <p className={styles.pager}>
          <button type="button" className="btn btn-secondary" disabled={step === 0} onClick={() => setStep((n) => Math.max(0, n - 1))}>
            {r.prev}
          </button>
          <button type="button" className="btn btn-primary" disabled={step === total - 1} onClick={() => setStep((n) => Math.min(total - 1, n + 1))}>
            {r.next}
          </button>
        </p>
      </div>
    </section>
  );
}
