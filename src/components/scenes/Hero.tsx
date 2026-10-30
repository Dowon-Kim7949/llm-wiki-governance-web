"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/content/types";
import { CodeCard, DocCard } from "../figure/Cards";
import { Links, useAlign } from "../figure/Links";
import styles from "./Hero.module.css";

// 0 aligned, 1 code changed, 2 doc flagged. One short event, played once on
// load (the page's only unprompted motion) and on demand with Replay.
const STEP_MS = [900, 1300];

export function Hero({ t }: { t: Dictionary }) {
  const figure = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState(0);
  const [run, setRun] = useState(0);

  useEffect(() => {
    // Every phase is set from a timer, so a replay restarts cleanly. With reduced motion the page
    // opens on the end state; Replay still steps through it, as cuts without transitions.
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const plan: [number, number][] = reduce && run === 0 ? [[2, 0]] : [[0, 0], [1, STEP_MS[0]], [2, STEP_MS[0] + STEP_MS[1]]];
    const timers = plan.map(([to, at]) => window.setTimeout(() => setPhase(to), at));
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [run]);

  // The doc stays on the row of the code it was approved against, so the change shows as a step.
  useAlign(figure, "[data-doc]", "hero-claim", '[data-a="hero-code-old"], [data-a="hero-code-line"]', phase);

  return (
    <section id="top" className={`${styles.hero} env-night`} aria-labelledby="hero-title">
      <h1 id="hero-title" className={styles.title}>
          {t.hero.title.split(/(?<=[,.]) /).map((clause, i) => (
            <Fragment key={i}>
              {i > 0 && " "}
              <span className={styles.clause}>{clause}</span>
            </Fragment>
          ))}
      </h1>
      <div className={styles.copy}>
        <p className={styles.lede}>{t.hero.lede}</p>
        <p className={styles.actions}>
          <a className="btn btn-primary" href="#playground">{t.hero.primary}</a>
          <a className="btn btn-secondary" href="#start">{t.hero.secondary}</a>
        </p>
      </div>

      <figure className={styles.figure}>
        <div ref={figure} className={styles.pair} data-phase={phase}>
          <DocCard doc="billing" t={t.cards} status="verified" mark={phase >= 2 ? "flagged" : null} claim={t.cards.claimInvoice} anchor="hero" minimal className={styles.doc} />
          <CodeCard file="invoice" t={t.cards} state={phase >= 1 ? "changed" : "unchanged"} anchor="hero-code" className={styles.code} />
          <Links links={[{ from: "hero-claim", to: "hero-code-line", state: phase === 0 ? "aligned" : "shifted", label: t.cards.evidence }]} watch={phase} />
        </div>
        <figcaption className={styles.caption}>
          <span className={styles.step} aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <i key={i} data-on={i <= phase ? "" : undefined} />
            ))}
          </span>
          <span>{t.hero.captions[phase as 0 | 1 | 2]}</span>
          <button type="button" className={styles.replay} onClick={() => setRun((n) => n + 1)}>
            {t.hero.replay}
          </button>
        </figcaption>
      </figure>
    </section>
  );
}
