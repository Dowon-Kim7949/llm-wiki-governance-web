"use client";

import { useRef, type ReactNode } from "react";
import type { Beat, Dictionary } from "@/content/types";
import { SequenceMotion } from "./Motion";
import type { Phased } from "./useSequence";
import styles from "./Sequence.module.css";

type Props = {
  id: string;
  t: Dictionary;
  heading: string;
  intro: string;
  stepOf: string;
  beats: Beat[];
  states: Phased[];
  /** Extra content under a beat's caption, by beat index, such as the commands it runs. */
  details?: (ReactNode | null)[];
  /** "night" stays dark; "dawn" turns to paper as the beats go on. */
  light?: "night" | "dawn";
};

const sequenceFrame = (w: number, h: number, wide: boolean) =>
  wide ? { x: w * 0.38, y: h * 0.1, w: w * 0.6, h: h * 0.84 } : { x: 0, y: h * 0.04, w, h: h * 0.92 };

/** Scenes 02 and 04: a heading, numbered beats, and the drawing they move. */
export function Sequence({ id, t, heading, intro, stepOf, beats, states, details = [], light = "night" }: Props) {
  const section = useRef<HTMLElement>(null);
  const total = String(beats.length);

  return (
    <section id={id} ref={section} className={`${styles.sequence} env-night`} data-light={light} aria-labelledby={`${id}-title`}>
      <header className={styles.head}>
        <h2 id={`${id}-title`} className={styles.heading}>{heading}</h2>
        <p className={styles.intro}>{intro}</p>
      </header>
      <div className={styles.stage}>
        <SequenceMotion t={t.world} section={section} beats={states} frame={sequenceFrame} />
      </div>
      <ol className={styles.beats}>
        {beats.map((b, i) => (
          <li key={b.id} className={styles.beat} data-beat={i}>
            <p className={styles.count}>{stepOf.replace("{n}", String(i + 1)).replace("{total}", total)}</p>
            <h3 className={styles.title}>{b.title}</h3>
            <p className={styles.body}>{b.body}</p>
            {b.note && <p className={styles.note}>{b.note}</p>}
            {details[i]}
          </li>
        ))}
      </ol>
    </section>
  );
}
