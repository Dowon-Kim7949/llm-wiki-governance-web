"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CHAPTER_TIMES, STORY_DURATION, story } from "@/content/story";
import { asset } from "@/lib/site";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import s from "./Narrative.module.css";

const media = "(prefers-reduced-motion: reduce)";
function subscribeMotion(callback: () => void) {
  const query = window.matchMedia(media);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
const ids = [
  "connection",
  "evidence",
  "change",
  "impact",
  "review",
  "resolution",
];

export function Narrative({ lang }: { lang: "ko" | "en" }) {
  const c = story[lang];
  const wrap = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const trigger = useRef<ScrollTrigger | null>(null);
  const [active, setActive] = useState(0);
  const current = useRef(0);
  const [manualReader, setManualReader] = useState(false);
  const reduced = useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia(media).matches,
    () => false,
  );
  const reading = reduced || manualReader;

  function navigate(index: number, updateHash = true) {
    if (updateHash) {
      history.replaceState(null, "", `#${ids[index]}`);
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    }
    if (reading) {
      document
        .getElementById(`read-${ids[index]}`)
        ?.scrollIntoView({ behavior: "instant" });
      return;
    }
    const st = trigger.current;
    if (!st) return;
    const time = CHAPTER_TIMES[index] ?? 0;
    const top = st.start + (time / STORY_DURATION) * (st.end - st.start);
    window.scrollTo({ top: index === 0 ? 0 : top, behavior: "instant" });
    st.update();
    timeline.current?.time(index === 0 ? 0 : time);
  }

  useEffect(() => {
    if (reading || !wrap.current || !stage.current) return;
    let disposed = false;
    let resizeTimer = 0;
    let oldWidth = innerWidth;
    let oldHeight = innerHeight;
    const root = stage.current;
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root);
      const mobile = () => innerWidth <= 700;
      const initialPath = () =>
        mobile()
          ? "M500 240 C500 290 500 400 500 462 C500 462 500 462 500 462"
          : "M350 360 C470 360 530 360 650 360 C650 360 650 360 650 360";
      const impactPath = () =>
        mobile()
          ? "M500 240 C500 290 500 380 500 405 C500 405 500 405 500 405"
          : "M350 360 C480 360 490 285 680 285 C680 285 680 285 680 285";
      const resolvedPath = () =>
        mobile()
          ? "M500 240 C980 240 980 462 500 462 C20 462 20 240 500 240"
          : "M215 360 C215 200 785 200 785 360 C785 570 215 570 215 360";
      const tl = gsap.timeline({
        paused: true,
        defaults: { ease: "power2.inOut" },
      });
      timeline.current = tl;
      // Keep the three shared graphic layers composited through settled frames.
      // Chromium otherwise occasionally omits their text after a large sticky scroll.
      gsap.set(q("[data-relation], [data-source], [data-document]"), {
        force3D: true,
      });
      gsap.set(q("[data-scene]:not([data-scene='0'])"), { autoAlpha: 0 });
      gsap.set(q("[data-relation]"), {
        autoAlpha: 0,
        scale: 0.78,
        xPercent: 24,
        yPercent: 20,
      });
      gsap.set(
        q(
          "[data-source], [data-document], [data-code-after], [data-doc-after], [data-mismatch], [data-blue-wash], [data-light-wash], [data-unaffected], [data-flag], [data-status-pending], [data-review-event], [data-review-edit], [data-review-approve], [data-review-record], [data-endpoint]",
        ),
        { autoAlpha: 0 },
      );
      gsap.set(q("[data-qty]"), { width: 0, autoAlpha: 0 });
      tl.set(
        q("[data-tether]"),
        { attr: { d: initialPath }, strokeWidth: 3 },
        0,
      );
      tl.to(
        q("[data-chain]"),
        { scale: 1.2, xPercent: 7, yPercent: -7, duration: 1.05, ease: "none" },
        0,
      );
      tl.to(q("[data-chain]"), { autoAlpha: 0, duration: 0.38 }, 0.66);
      tl.to(
        q("[data-relation]"),
        { autoAlpha: 1, scale: 1, xPercent: 0, yPercent: 0, duration: 0.46 },
        0.73,
      );
      tl.to(
        q("[data-source], [data-document]"),
        { autoAlpha: 1, duration: 0.28 },
        0.9,
      );
      for (let i = 1; i < 5; i++) {
        tl.to(
          q(`[data-scene='${i - 1}']`),
          { autoAlpha: 0, y: -22, duration: 0.2 },
          i === 1 ? 0.52 : i - 0.29,
        );
        tl.fromTo(
          q(`[data-scene='${i}']`),
          { y: 24, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.26 },
          i - 0.07,
        );
      }
      tl.to(q("[data-blue-wash]"), { autoAlpha: 1, duration: 0.33 }, 1.73);
      tl.to(
        q("[data-qty]"),
        { width: "auto", autoAlpha: 1, duration: 0.23 },
        2.03,
      );
      tl.set(q("[data-code-before]"), { autoAlpha: 0 }, 2.12);
      tl.set(q("[data-code-after]"), { autoAlpha: 1 }, 2.12);
      tl.to(q("[data-mismatch]"), { autoAlpha: 1, y: 0, duration: 0.22 }, 2.18);
      tl.to(q("[data-mismatch]"), { autoAlpha: 0, duration: 0.18 }, 2.74);
      tl.to(q("[data-light-wash]"), { autoAlpha: 1, duration: 0.3 }, 2.76);
      tl.to(
        q("[data-document]"),
        {
          height: () =>
            mobile()
              ? innerHeight <= 740
                ? 104
                : 116
              : Math.min(210, innerHeight * 0.22),
          y: () => (mobile() ? -24 : -52),
          scale: 0.92,
          duration: 0.38,
        },
        2.82,
      );
      tl.to(
        q("[data-sentence-old], [data-document-foot]"),
        { autoAlpha: 0, duration: 0.16 },
        2.79,
      );
      tl.to(
        q("[data-unaffected]"),
        { autoAlpha: 1, x: 0, duration: 0.33 },
        3.02,
      );
      tl.to(q("[data-flag]"), { autoAlpha: 1, duration: 0.2 }, 3.05);
      tl.to(
        q("[data-tether]"),
        { attr: { d: impactPath }, duration: 0.38 },
        2.82,
      );
      tl.to(
        q("[data-evidence-point], [data-evidence-word]"),
        { autoAlpha: 0, duration: 0.22 },
        2.8,
      );
      tl.to(
        q("[data-unaffected], [data-flag]"),
        { autoAlpha: 0, duration: 0.2 },
        3.73,
      );
      tl.to(
        q("[data-document]"),
        {
          height: () =>
            mobile()
              ? innerHeight <= 740
                ? 130
                : 172
              : innerHeight <= 810
                ? 260
                : Math.min(520, Math.max(250, innerHeight * 0.34)),
          y: 0,
          scale: 1,
          duration: 0.36,
        },
        3.8,
      );
      tl.to(
        q("[data-sentence-old], [data-document-foot]"),
        { autoAlpha: 1, duration: 0.18 },
        3.95,
      );
      tl.to(
        q("[data-tether]"),
        { attr: { d: initialPath }, duration: 0.35 },
        3.82,
      );
      tl.to(q("[data-review-event]"), { autoAlpha: 1, duration: 0.18 }, 4.1);
      tl.set(q("[data-status-verified]"), { autoAlpha: 0 }, 4.25);
      tl.set(q("[data-status-pending]"), { autoAlpha: 1 }, 4.25);
      tl.to(q("[data-review-event]"), { autoAlpha: 0, duration: 0.12 }, 4.48);
      tl.to(q("[data-review-edit]"), { autoAlpha: 1, duration: 0.15 }, 4.5);
      tl.to(q("[data-sentence-old]"), { autoAlpha: 0, duration: 0.13 }, 4.5);
      tl.fromTo(
        q("[data-sentence-new]"),
        { autoAlpha: 0, clipPath: "inset(0 100% 0 0)" },
        { autoAlpha: 1, clipPath: "inset(0 0% 0 0)", duration: 0.27 },
        4.57,
      );
      tl.set(q("[data-doc-before]"), { autoAlpha: 0 }, 4.66);
      tl.set(q("[data-doc-after]"), { autoAlpha: 1 }, 4.66);
      tl.to(q("[data-review-edit]"), { autoAlpha: 0, duration: 0.12 }, 4.92);
      tl.to(q("[data-review-approve]"), { autoAlpha: 1, duration: 0.13 }, 4.95);
      tl.to(q("[data-review-approve]"), { autoAlpha: 0, duration: 0.12 }, 5.18);
      tl.to(q("[data-review-record]"), { autoAlpha: 1, duration: 0.16 }, 5.2);
      tl.set(q("[data-status-pending]"), { autoAlpha: 0 }, 5.2);
      tl.set(q("[data-status-verified]"), { autoAlpha: 1 }, 5.2);
      tl.to(
        q("[data-scene='4']"),
        { autoAlpha: 0, y: -22, duration: 0.2 },
        5.38,
      );
      tl.to(q("[data-review-record]"), { autoAlpha: 0, duration: 0.2 }, 5.42);
      tl.to(
        q("[data-light-wash], [data-blue-wash]"),
        { autoAlpha: 0, duration: 0.32 },
        5.45,
      );
      tl.to(
        q("[data-source], [data-document]"),
        { autoAlpha: 0, scale: 0.65, duration: 0.3 },
        5.44,
      );
      tl.to(
        q("[data-tether]"),
        {
          attr: { d: resolvedPath },
          strokeWidth: () => (mobile() ? 12 : 22),
          duration: 0.48,
        },
        5.45,
      );
      tl.fromTo(
        q("[data-endpoint]"),
        { autoAlpha: 0, scale: 1.4 },
        { autoAlpha: 1, scale: 1, duration: 0.3 },
        5.63,
      );
      tl.fromTo(
        q("[data-scene='5']"),
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 0.24 },
        5.72,
      );
      tl.to({}, { duration: 0.45 }, STORY_DURATION - 0.45);

      const sync = () => {
        const time = tl.time();
        const index =
          time >= 5.7
            ? 5
            : time >= 3.95
              ? 4
              : time >= 2.95
                ? 3
                : time >= 1.95
                  ? 2
                  : time >= 0.95
                    ? 1
                    : 0;
        root.dataset.chapter = String(index);
        root.dataset.changed = String(time >= 2.12);
        root.dataset.review =
          time >= 5.2
            ? "approved"
            : time >= 4.66
              ? "edited"
              : time >= 4.25
                ? "pending"
                : "unchanged";
        root.style.setProperty("--progress", String(time / STORY_DURATION));
        if (index !== current.current) {
          q("[data-scene]").forEach((el: HTMLElement, i: number) => {
            if (i !== index && el.contains(document.activeElement))
              q("[data-chapter-link]")[index]?.focus({ preventScroll: true });
            el.inert = i !== index;
            el.setAttribute("aria-hidden", String(i !== index));
          });
          current.current = index;
          setActive(index);
        }
      };
      const st = ScrollTrigger.create({
        id: "main-story",
        trigger: wrap.current,
        start: "top top",
        end: "bottom bottom",
        animation: tl,
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: sync,
        onRefresh: sync,
      });
      trigger.current = st;
      sync();
    }, stage);

    const refresh = () => {
      if (!disposed) ScrollTrigger.refresh();
    };
    const onResize = () => {
      const width = innerWidth,
        height = innerHeight;
      if (
        window.matchMedia("(pointer: coarse)").matches &&
        width === oldWidth &&
        Math.abs(height - oldHeight) < 160
      )
        return;
      const progress = trigger.current?.progress ?? 0;
      const inside = trigger.current?.isActive;
      oldWidth = width;
      oldHeight = height;
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        refresh();
        if (inside && trigger.current) {
          window.scrollTo({
            top:
              trigger.current.start +
              progress * (trigger.current.end - trigger.current.start),
            behavior: "instant",
          });
          trigger.current.update();
        }
      }, 140);
    };
    const openHash = () => {
      const index = ids.indexOf(location.hash.slice(1));
      if (index >= 0 && index < CHAPTER_TIMES.length && trigger.current) {
        const t = index === 0 ? 0 : CHAPTER_TIMES[index];
        window.scrollTo({
          top:
            trigger.current.start +
            (t / STORY_DURATION) *
              (trigger.current.end - trigger.current.start),
          behavior: "instant",
        });
        trigger.current.update();
      }
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("story-home", openHash);
    window.addEventListener("hashchange", openHash);
    const frame = requestAnimationFrame(() => {
      refresh();
      openHash();
    });
    document.fonts.ready.then(refresh);
    return () => {
      disposed = true;
      clearTimeout(resizeTimer);
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("story-home", openHash);
      window.removeEventListener("hashchange", openHash);
      ctx.revert();
      trigger.current = null;
      timeline.current = null;
    };
  }, [reading]);

  const modeControl = (
    <div className={s.modeBar}>
      <button
        type="button"
        onClick={() => {
          window.scrollTo({ top: 0, behavior: "instant" });
          history.replaceState(null, "", "#connection");
          current.current = 0;
          setActive(0);
          setManualReader(!manualReader);
        }}
        disabled={reduced}
      >
        {reduced ? c.reduced : reading ? c.presentation : c.read}
      </button>
    </div>
  );
  return (
    <>
      {reading && modeControl}
      <div
        ref={wrap}
        id="top"
        className={s.scrollRange}
        data-story-range
        hidden={reading}
      >
        <div
          ref={stage}
          className={s.stage}
          data-stage
          data-chapter="0"
          role="region"
          aria-label={
            lang === "ko"
              ? "스크롤로 이어지는 제품 이야기"
              : "A scroll-driven product story"
          }
        >
          {!reading && modeControl}
          <div className={s.blueWash} data-blue-wash />
          <div className={s.lightWash} data-light-wash />
          <div className={s.chain} data-chain aria-hidden="true">
            <Image
              src={asset("/images/evidence-links.webp")}
              alt=""
              width={1536}
              height={1024}
              preload
              sizes="(max-width: 700px) 150vw, 80vw"
              onLoad={() => ScrollTrigger.refresh()}
            />
          </div>
          <div className={s.canvas} data-relation aria-hidden="true">
            <svg
              className={s.tether}
              viewBox="0 0 1000 600"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient
                  id="tether-gradient"
                  gradientUnits="userSpaceOnUse"
                  x1="0"
                  x2="1000"
                >
                  <stop stopColor="#bfc8e2" />
                  <stop offset=".45" stopColor="#3154ff" />
                  <stop offset="1" stopColor="#3154ff" />
                </linearGradient>
              </defs>
              <path
                data-tether
                d="M350 360 C470 360 530 360 650 360 C650 360 650 360 650 360"
                stroke="url(#tether-gradient)"
              />
              <circle
                data-evidence-point
                className={s.evidencePoint}
                cx="500"
                cy="360"
                r="7"
              />
            </svg>
            <span className={s.evidenceWord} data-evidence-word>
              EVIDENCE
            </span>
            <div className={s.source} data-source>
              <div className={s.paperTop}>
                <span>{c.source}</span>
                <span>STANDARD</span>
              </div>
              <h3>src/invoice.js</h3>
              <div className={s.expression}>
                <span>computeTotal(items)</span>
                <code>
                  s + i.price<span data-qty> * i.qty</span>
                </code>
              </div>
              <div className={s.calculation}>
                <span>
                  {c.example}
                  <b>price 12 · qty 3</b>
                </span>
                <span>
                  {c.codeValue}
                  <strong>
                    <span data-code-before>12</span>
                    <span data-code-after>36</span>
                  </strong>
                </span>
              </div>
            </div>
            <div className={s.document} data-document>
              <div className={s.paperTop}>
                <span>{c.document}</span>
                <span className={s.status}>
                  <span data-status-verified>● verified</span>
                  <span data-status-pending>◌ needs_review</span>
                </span>
              </div>
              <h3>billing.md</h3>
              <div className={s.sentence}>
                <p data-sentence-old>{c.before}</p>
                <p data-sentence-new>{c.after}</p>
              </div>
              <div className={s.documentFoot} data-document-foot>
                <span>↖ src/invoice.js</span>
                <strong>
                  <span data-doc-before>12</span>
                  <span data-doc-after>36</span>
                </strong>
              </div>
              <div className={s.impactFlag} data-flag>
                ↗ {c.flagged}
              </div>
            </div>
            <div className={s.unaffected} data-unaffected>
              <span>✓ {c.unaffected}</span>
              <h3>shipping.md</h3>
              <p>↖ src/shipping.js</p>
              <small>● verified</small>
            </div>
            <div className={s.mismatch} data-mismatch>
              <span>36 ≠ 12</span>
              <p>{c.unchanged}</p>
            </div>
            <div className={s.reviewEvent} data-review-event>
              <span>↶ {c.downgrade}</span>
              <code>drift --downgrade</code>
            </div>
            <div className={s.reviewEvent} data-review-edit>
              <span>✎ {c.edit}</span>
            </div>
            <div className={s.reviewEvent} data-review-approve>
              <span>↗ {c.approve}</span>
              <code>review --approve</code>
            </div>
            <div className={s.reviewRecord} data-review-record>
              <span>✓ {c.reviewed}</span>
              <code>reviewed_by: maintainer</code>
              <code>reviewed_at: 2026-10-29</code>
            </div>
            <div className={s.endpoints}>
              <span data-endpoint>
                src/invoice.js<small>SOURCE</small>
              </span>
              <span data-endpoint>
                billing.md<small>● verified</small>
              </span>
            </div>
          </div>
          {c.headlines.map((lines, i) => (
            <section
              key={ids[i]}
              data-scene={i}
              className={`${s.scene} ${i === 0 ? s.opening : ""} ${i === 3 || i === 4 ? s.lightScene : ""}`}
              aria-labelledby={`scene-title-${i}`}
              aria-hidden={i !== active}
              inert={i !== active}
            >
              <div className={s.sceneHead}>
                <span className={s.eyebrow}>
                  0{i + 1} / {c.chapters[i].toUpperCase()}
                </span>
                {i === 0 ? (
                  <h2 id={`scene-title-${i}`} tabIndex={-1}>
                    {lines[0]}
                    <br />
                    {lines[1]}
                  </h2>
                ) : (
                  <h2 id={`scene-title-${i}`}>
                    {lines[0]}
                    <br />
                    {lines[1]}
                  </h2>
                )}
                <p>{c.descriptions[i]}</p>
              </div>
              <p className={s.caption}>{c.captions[i]}</p>
              {i === 5 && (
                <a className={s.installCta} href="#start">
                  {c.next}
                  <span>↗</span>
                </a>
              )}
              <p className="visually-hidden">
                {i === 1
                  ? `${c.source}: src/invoice.js. ${c.document}: billing.md. ${c.before}`
                  : i === 2
                    ? `${c.codeValue}: 36. ${c.docValue}: 12. ${c.before}`
                    : i === 3
                      ? `src/invoice.js → billing.md: ${c.flagged}. src/shipping.js → shipping.md: ${c.unaffected}. verified.`
                      : i === 4
                        ? `drift --downgrade → needs_review. ${c.after} review --approve → verified. reviewed_by: maintainer. reviewed_at: 2026-10-29.`
                        : ""}
              </p>
            </section>
          ))}
          <nav className={s.chapters} aria-label={c.nav}>
            {c.chapters.map((label, i) => (
              <a
                data-chapter-link
                key={label}
                href={`#${ids[i]}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(i);
                }}
                aria-current={i === active ? "step" : undefined}
              >
                <span>0{i + 1}</span>
                <span>{label}</span>
              </a>
            ))}
            <span className={s.progress}>
              <i />
            </span>
            <a href="#start" className={s.skip}>
              {c.skip}
              <span>↗</span>
            </a>
          </nav>
          <span className="visually-hidden" role="status">
            {c.chapters[active]}
          </span>
        </div>
      </div>
      <article className={s.reader} hidden={!reading} data-story-reader>
        <h2>{c.headlines[0].join(" ")}</h2>
        <p>{c.simulation}</p>
        {c.headlines.map((lines, i) => (
          <section key={ids[i]} id={`read-${ids[i]}`}>
            <span>
              0{i + 1} / {c.chapters[i]}
            </span>
            <h2>{lines.join(" ")}</h2>
            <p>{c.descriptions[i]}</p>
            <p>{c.captions[i]}</p>
            {i === 2 && (
              <div>
                <code>s + i.price → s + i.price * i.qty</code>
                <p>{c.before}</p>
                <strong>36 ≠ 12</strong>
              </div>
            )}
            {i === 4 && (
              <div>
                <code>drift --downgrade → needs_review</code>
                <p>{c.after}</p>
                <code>review --approve → verified</code>
                <p>reviewed_by: maintainer · reviewed_at: 2026-10-29</p>
              </div>
            )}
          </section>
        ))}
        <a href="#start">{c.next} ↗</a>
      </article>
      <noscript>
        <style>{`[data-story-range], [class*="modeBar"]{display:none!important}[data-story-reader][hidden]{display:block!important}`}</style>
      </noscript>
    </>
  );
}
