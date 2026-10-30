"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import type { Dictionary } from "@/content/types";
import styles from "./Drift.module.css";

// Where things sit on the time axis, as fractions of its width.
const REVIEWED_AT = 0.04;
const COMMIT_AT = [0.24, 0.44, 0.63, 0.82];
const END = 0.96;

/**
 * Scene 02: time passing. On wide screens with motion allowed, scrolling
 * moves "now" along the axis: commits arrive, the cited one breaks the doc's
 * evidence, and the gap grows until an agent reads the stale doc. Scroll
 * position is the progress, so reversing the scroll reverses time. Elsewhere
 * the finished timeline is shown at once (the server-rendered state).
 */
export function Drift({ t }: { t: Dictionary }) {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const d = t.drift;
  const cited = d.commits.findIndex((c) => c.cited);

  useEffect(() => {
    const sec = section.current;
    const tr = track.current;
    if (!sec || !tr) return;
    const items = Array.from(sec.querySelectorAll<HTMLElement>("[data-commit]"));
    const apply = (p: number) => {
      const now = REVIEWED_AT + p * (END - REVIEWED_AT);
      sec.style.setProperty("--now", now.toFixed(4));
      items.forEach((el, i) => el.toggleAttribute("data-on", now >= COMMIT_AT[i]));
      sec.toggleAttribute("data-stale", now >= COMMIT_AT[cited]);
      sec.toggleAttribute("data-read", now >= END - 0.005);
    };
    const finish = () => apply(1);
    const mq = window.matchMedia("(min-width: 64rem) and (prefers-reduced-motion: no-preference)");
    let stop = () => {};
    let alive = true;
    const setup = async () => {
      stop();
      if (!mq.matches) {
        sec.dataset.mode = "static";
        finish();
        return;
      }
      const { ScrollTrigger } = await import("@/lib/gsap");
      if (!alive) return;
      sec.dataset.mode = "scrub";
      const trigger = ScrollTrigger.create({ trigger: tr, start: "top top", end: "bottom bottom", onUpdate: (self) => apply(self.progress) });
      apply(trigger.progress);
      stop = () => trigger.kill();
    };
    setup();
    mq.addEventListener("change", setup);
    return () => {
      alive = false;
      mq.removeEventListener("change", setup);
      stop();
    };
  }, [cited]);

  return (
    <section id="drift" ref={section} className={`${styles.drift} env-night`} aria-labelledby="drift-title" data-stale="" data-read="" style={{ "--now": END } as CSSProperties}>
      <div ref={track} className={styles.track}>
        <div className={styles.sticky}>
          <header className={styles.head}>
            <h2 id="drift-title" className={styles.heading}>{d.heading}</h2>
            <p className={styles.lede}>{d.lede}</p>
          </header>

          <div className={styles.timeline}>
            <p className={styles.laneLabel}>{d.codeLane}</p>
            <ol className={styles.commits}>
              {d.commits.map((c, i) => (
                <li key={c.file} data-commit="" data-on="" data-cited={c.cited ? "" : undefined} style={{ "--x": COMMIT_AT[i] } as CSSProperties}>
                  <span className={styles.date}>{c.date}</span>
                  <code className={styles.file}>{c.file}</code>
                  <span className={styles.message}>{c.message}</span>
                </li>
              ))}
            </ol>

            <div className={styles.axis} aria-hidden="true">
              <i className={styles.now} />
            </div>

            <p className={styles.laneLabel}>{d.docLane}</p>
            <ol className={styles.docLane} style={{ "--cited": COMMIT_AT[cited] } as CSSProperties}>
              <li className={styles.reviewed}>
                <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 1 11.5 11H.5z" fill="currentColor" /></svg>
                {d.reviewed}
              </li>
              <li className={styles.stale}>
                <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 1v10M3 1.5h7L8 4l2 2.5H3z" fill="currentColor" stroke="currentColor" strokeWidth="1.2" /></svg>
                {d.stale}
              </li>
              <li className={styles.agent}>{d.agent}</li>
            </ol>
          </div>

          <p className={styles.resolve}>{d.resolve}</p>
        </div>
      </div>
    </section>
  );
}
