"use client";

import { Fragment, useRef } from "react";
import type { Dictionary } from "@/content/types";
import { OPENING, OPENING_INTRO } from "./beats";
import { SequenceMotion } from "./Motion";
import styles from "./Opening.module.css";

// The drawing sits right of the headline on wide screens, under it elsewhere.
const openingFrame = (w: number, h: number, wide: boolean) =>
  wide ? { x: w * 0.42, y: h * 0.12, w: w * 0.56, h: h * 0.84 } : { x: w * 0.02, y: h * 0.02, w: w * 0.96, h: h * 0.96 };

/** Scene 01. The page's only unprompted motion is the load moment here. */
export function Opening({ t }: { t: Dictionary }) {
  const section = useRef<HTMLElement>(null);

  return (
    <section id="top" ref={section} className={`${styles.opening} env-night`} aria-labelledby="hero-title">
      <div className={styles.stage}>
        <SequenceMotion t={t.world} section={section} beats={OPENING} intro={OPENING_INTRO} frame={openingFrame} />
      </div>
      <div className={styles.copy}>
        <div className={styles.hero} data-beat="0">
          <h1 id="hero-title" className={styles.title}>
            {t.opening.title.split(/(?<=,) /).map((clause, i) => (
              <Fragment key={i}>
                {i > 0 && " "}
                <span className={styles.clause}>{clause}</span>
              </Fragment>
            ))}
          </h1>
          <p className={styles.lede}>{t.opening.lede}</p>
          <p className={styles.actions}>
            <a className="btn btn-primary" href="#start">{t.opening.primary}</a>
            <a className="btn btn-secondary" href="#playground">{t.opening.secondary}</a>
          </p>
        </div>
        {t.opening.beats.map((b, i) => (
          <p key={b.id} className={styles.caption} data-beat={i + 1}>
            <strong className={styles.captionTitle}>{b.title}</strong>
            <span className={styles.captionBody}>{b.body}</span>
          </p>
        ))}
      </div>
      <p className={styles.hint} aria-hidden="true" data-hint="">{t.opening.scrollHint}</p>
    </section>
  );
}
