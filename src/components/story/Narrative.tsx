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

  function navigate(index: number) {
    history.replaceState(null, "", `#${ids[index]}`);
    if (reading) {
      document
        .getElementById(`read-${ids[index]}`)
        ?.scrollIntoView({ behavior: "instant" });
      return;
    }
    // The same seek path handles clicks, direct URLs and locale changes.
    window.dispatchEvent(new HashChangeEvent("hashchange"));
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
      const canvas = q("[data-relation]")[0] as HTMLElement;
      const source = q("[data-source]")[0] as HTMLElement;
      const documentCard = q("[data-document]")[0] as HTMLElement;
      const connectedPath = () => {
        // Measure the shared layout, not viewport-specific drawing coordinates.
        // Normalising by the canvas rect also cancels its entrance transform.
        const base = canvas.getBoundingClientRect();
        const a = source.getBoundingClientRect();
        const b = documentCard.getBoundingClientRect();
        const x = (n: number) => ((n - base.left) / base.width) * 1000;
        const y = (n: number) => ((n - base.top) / base.height) * 600;
        const ax = x(mobile() ? a.left + a.width / 2 : a.right);
        const ay = y(mobile() ? a.bottom : a.top + a.height / 2);
        const bx = x(mobile() ? b.left + b.width / 2 : b.left);
        const by = y(mobile() ? b.top : b.top + b.height / 2);
        const mx = (ax + bx) / 2,
          my = (ay + by) / 2;
        q("[data-evidence-point]")[0].setAttribute("cx", String(mx));
        q("[data-evidence-point]")[0].setAttribute("cy", String(my));
        const radius = Math.min(14, Math.max(6, innerWidth * 0.004));
        q("[data-evidence-point]")[0].setAttribute(
          "rx",
          String((radius / base.width) * 1000),
        );
        q("[data-evidence-point]")[0].setAttribute(
          "ry",
          String((radius / base.height) * 600),
        );
        return mobile()
          ? `M${ax} ${ay} C${ax} ${my} ${bx} ${my} ${bx} ${by} C${bx} ${by} ${bx} ${by} ${bx} ${by}`
          : `M${ax} ${ay} C${mx} ${ay} ${mx} ${by} ${bx} ${by} C${bx} ${by} ${bx} ${by} ${bx} ${by}`;
      };
      const resolvedPath = () => {
        const base = canvas.getBoundingClientRect();
        const a = q("[data-endpoint]")[0].getBoundingClientRect();
        const b = q("[data-endpoint]")[1].getBoundingClientRect();
        const left = ((a.left + a.width / 2 - base.left) / base.width) * 1000;
        const right = ((b.left + b.width / 2 - base.left) / base.width) * 1000;
        const top = ((a.top + a.height / 2 - base.top) / base.height) * 600;
        const bottom = ((b.top + b.height / 2 - base.top) / base.height) * 600;
        return mobile()
          ? `M500 ${top} C980 ${top} 980 ${bottom} 500 ${bottom} C20 ${bottom} 20 ${top} 500 ${top}`
          : `M${left} 300 C${left} 40 ${right} 40 ${right} 300 C${right} 560 ${left} 560 ${left} 300`;
      };
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
        scale: 0.94,
        xPercent: 4,
        yPercent: 6,
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
        { attr: { d: connectedPath }, strokeWidth: 3 },
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
          { autoAlpha: 0, duration: 0.2 },
          i === 1 ? 0.52 : i - 0.29,
        );
        tl.fromTo(
          q(`[data-scene='${i}']`),
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.26 },
          i - 0.07,
        );
        tl.fromTo(
          q(`[data-scene='${i}'] [data-scene-head]`),
          { y: 12 },
          { y: 0, duration: 0.26 },
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
      tl.to(q("[data-relation]"), { "--impact": 1, duration: 0.38 }, 2.82);
      tl.to(q("[data-document-body]"), { autoAlpha: 0, duration: 0.16 }, 2.79);
      tl.to(
        q("[data-unaffected]"),
        { autoAlpha: 1, x: 0, duration: 0.33 },
        3.02,
      );
      tl.to(q("[data-flag]"), { autoAlpha: 1, duration: 0.2 }, 3.05);
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
      tl.to(q("[data-relation]"), { "--impact": 0, duration: 0.36 }, 3.8);
      tl.to(q("[data-document-body]"), { autoAlpha: 1, duration: 0.18 }, 3.95);
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
      tl.to(q("[data-scene='4']"), { autoAlpha: 0, duration: 0.2 }, 5.38);
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
      tl.fromTo(
        q("[data-tether]"),
        { attr: { d: connectedPath } },
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
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.24 },
        5.72,
      );
      tl.to({}, { duration: 0.45 }, STORY_DURATION - 0.45);

      const sync = () => {
        const time = tl.time();
        if (time < 5.44)
          q("[data-tether]")[0].setAttribute("d", connectedPath());
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
        trigger.current.scroll(
          trigger.current.start +
            (t / STORY_DURATION) *
              (trigger.current.end - trigger.current.start),
        );
        trigger.current.update();
      }
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("story-home", openHash);
    window.addEventListener("hashchange", openHash);
    const frame = requestAnimationFrame(() => {
      const heading = root.querySelector("[data-scene='1'] h2") as HTMLElement;
      void document.fonts
        .load(getComputedStyle(heading).font, heading.textContent ?? "")
        .catch(() => [])
        .then(async () => {
          await document.fonts.ready;
          if (disposed) return;
          refresh();
          openHash();
        });
    });
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
          window.dispatchEvent(new HashChangeEvent("hashchange"));
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
              <ellipse
                data-evidence-point
                className={s.evidencePoint}
                cx="500"
                cy="360"
                rx="7"
                ry="7"
              />
            </svg>
            <span className={s.evidenceWord} data-evidence-word>
              EVIDENCE
            </span>
            <div className={s.source} data-source>
              <div data-card-heading>
                <div className={s.paperTop}>
                  <span>{c.source}</span>
                  <span>STANDARD</span>
                </div>
                <h3>src/invoice.js</h3>
              </div>
              <div className={s.expression} data-expression>
                <span>computeTotal(items)</span>
                <code>
                  s + i.price<span data-qty> * i.qty</span>
                </code>
              </div>
              <div className={s.calculation} data-calculation>
                <span data-example>
                  {c.example}
                  <b>price 12 · qty 3</b>
                </span>
                <span data-calculated>
                  {c.codeValue}
                  <strong>
                    <span data-code-before>12</span>
                    <span data-code-after>36</span>
                  </strong>
                </span>
              </div>
            </div>
            <div className={s.documents} data-documents>
              <div className={s.document} data-document>
                <div data-card-heading>
                  <div className={s.paperTop}>
                    <span>{c.document}</span>
                    <span className={s.status}>
                      <span data-status-verified>● verified</span>
                      <span data-status-pending>◌ needs_review</span>
                    </span>
                  </div>
                  <h3>billing.md</h3>
                </div>
                <div className={s.documentBody} data-document-body>
                  <div className={s.sentence} data-sentence>
                    <p data-sentence-old>{c.before}</p>
                    <p data-sentence-new>{c.after}</p>
                  </div>
                  <div className={s.documentFoot} data-document-foot>
                    <span>↖ src/invoice.js</span>
                    <div className={s.documentValue}>
                      <small>{c.docValue}</small>
                      <strong>
                        <span data-doc-before>12</span>
                        <span data-doc-after>36</span>
                      </strong>
                    </div>
                  </div>
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
          <div className={s.feedback} data-feedback aria-hidden="true">
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
              <div className={s.sceneHead} data-scene-head>
                <span className={s.eyebrow}>
                  0{i + 1} / {c.chapters[i].toUpperCase()}
                </span>
                {i === 0 ? (
                  <h2 id={`scene-title-${i}`} tabIndex={-1}>
                    <span>{lines[0]}</span>
                    <span>{lines[1]}</span>
                  </h2>
                ) : (
                  <h2 id={`scene-title-${i}`}>
                    <span>{lines[0]}</span>
                    <span>{lines[1]}</span>
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
