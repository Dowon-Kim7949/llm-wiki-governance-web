"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import type { Dictionary, FileId, Mode } from "@/content/types";
import { TRANSCRIPTS } from "@/content/transcripts";
import { DOC_IDS, DOCS, FILE_IDS, FILES, SOURCES } from "@/lib/demo";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { outcome } from "@/lib/playground";
import { PRODUCT, asset } from "@/lib/site";
import { Terminal } from "./scenes/Terminal";
import { CopyButton } from "./CopyButton";
import { LangSwitch } from "./LangSwitch";
import s from "./Experience.module.css";

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={diagonal ? "M5 19 19 5M5 5h14v14" : "M4 12h16m-7-7 7 7-7 7"}
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

export function Experience({ lang, t }: { lang: "ko" | "en"; t: Dictionary }) {
  const ko = lang === "ko";
  const root = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const ctx = gsap.context(() => {
        const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
        intro
          .from(
            "[data-hero-line]",
            { yPercent: 110, duration: 1.1, stagger: 0.1 },
            0.1,
          )
          .from(
            "[data-sculpture] img",
            { y: 70, scale: 0.9, opacity: 0, duration: 1.45 },
            0.05,
          )
          .from(
            "[data-hero-detail]",
            { opacity: 0, y: 16, duration: 0.65, stagger: 0.07 },
            0.65,
          );
        gsap.to("[data-sculpture]", {
          y: () => (window.innerWidth <= 700 ? -42 : -100),
          scale: () => (window.innerWidth <= 700 ? 1.02 : 1.07),
          ease: "none",
          scrollTrigger: {
            trigger: "#top",
            start: "top top",
            end: "bottom top",
            scrub: 0.7,
            invalidateOnRefresh: true,
          },
        });
        gsap.to("[data-context-type]", {
          xPercent: -9,
          ease: "none",
          scrollTrigger: {
            trigger: "#top",
            start: "top top",
            end: "bottom top",
            scrub: 0.7,
          },
        });
        gsap.fromTo(
          "[data-thread]",
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: "none",
            scrollTrigger: {
              trigger: "#anatomy",
              start: "top 80%",
              end: "bottom 60%",
              scrub: 0.4,
            },
          },
        );
        gsap.fromTo(
          "[data-ending-type]",
          { xPercent: 5 },
          {
            xPercent: -5,
            ease: "none",
            scrollTrigger: {
              trigger: "#closing",
              start: "top bottom",
              end: "bottom top",
              scrub: 0.8,
            },
          },
        );
        gsap
          .timeline({
            scrollTrigger: {
              trigger: "[data-source-panel]",
              start: "top 85%",
              once: true,
            },
            defaults: { ease: "power3.out" },
          })
          .from("[data-source-panel]", { x: -24, duration: 0.8 })
          .from("[data-documents]", { x: 36, duration: 0.9 }, 0.16);
      }, root);
      return () => ctx.revert();
    });
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => ScrollTrigger.refresh());
    });
    if (root.current) observer.observe(root.current);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      mm.revert();
    };
  }, []);
  const goTop = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    history.replaceState(null, "", window.location.pathname);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "instant" });
    document.getElementById("hero-title")?.focus({ preventScroll: true });
    ScrollTrigger.update();
  };
  return (
    <div ref={root} className={s.experience}>
      <a className="skip-link" href="#main">
        {t.nav.skip}
      </a>
      <header className={s.header}>
        <a
          href="#top"
          onClick={goTop}
          className={s.brand}
        >
          <svg viewBox="0 0 36 36" aria-hidden="true">
            <path
              d="M6 12h16a7 7 0 0 1 0 14h-4M30 24H14a7 7 0 0 1 0-14h4"
              fill="none"
              stroke="currentColor"
              strokeWidth="4.5"
            />
          </svg>
          <span>
            LLM–WIKI <span>GOVERNANCE</span>
          </span>
        </a>
        <nav
          id="main-navigation"
          data-open={menuOpen}
          aria-label={t.nav.label}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setMenuOpen(false);
              menuButton.current?.focus();
            }
          }}
        >
          <a href="#anatomy" onClick={() => setMenuOpen(false)}>
            {t.nav.how}
          </a>
          <a href="#playground" onClick={() => setMenuOpen(false)}>
            {t.nav.playground}
          </a>
          <a href="#limits" onClick={() => setMenuOpen(false)}>
            {ko ? "알아둘 점" : "The limits"}
          </a>
          <a
            className={s.mobileStart}
            href="#start"
            onClick={() => setMenuOpen(false)}
          >
            {t.nav.start}
          </a>
        </nav>
        <div className={s.headerEnd}>
          <LangSwitch
            className={s.language}
            href={asset(`/${ko ? "en" : "ko"}/`)}
            hrefLang={ko ? "en" : "ko"}
            label={t.nav.langLabel}
            name={ko ? "EN" : "한국어"}
          />
          <a className={s.navCta} href="#start">
            {t.nav.start}
            <Arrow diagonal />
          </a>
          <button
            ref={menuButton}
            type="button"
            className={s.menuButton}
            aria-label={ko ? "메뉴" : "Menu"}
            aria-expanded={menuOpen}
            aria-controls="main-navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span />
            <span />
          </button>
        </div>
      </header>
      <main id="main" tabIndex={-1}>
        <section id="top" className={s.hero} aria-labelledby="hero-title">
          <div className={s.heroTopline} data-hero-detail>
            <span>
              <i />{" "}
              {ko
                ? "AI 문서를 위한 오픈 소스 CLI"
                : "AN OPEN SOURCE CLI FOR AI DOCUMENTATION"}
            </span>
            <span>CONTEXT IS A CONNECTION.</span>
          </div>
          <div className={s.heroCopy}>
            <h1 id="hero-title" tabIndex={-1}>
              <span className={s.lineMask}>
                <span data-hero-line>
                  {ko ? "코드가 바뀌어도," : "Code moves on."}
                </span>
              </span>
              <span className={s.lineMask}>
                <span data-hero-line>
                  {ko ? "근거는 이어지도록." : "Keep the context."}
                </span>
              </span>
            </h1>
            <p data-hero-detail>
              {ko
                ? "AI가 읽는 문서에도, 근거가 필요하니까.\n소스 인용과 검토 기록을 연결하고,\n코드가 바뀌면 다시 볼 문서를 찾으세요."
                : "Give the docs your AI reads a traceable source.\nConnect citations and review records.\nFind what needs another look when code changes."}
            </p>
            <a data-hero-detail className={s.pill} href="#playground">
              {ko
                ? "직접 연결을 바꿔 보세요"
                : "Make a change. See the impact."}
              <span>
                <Arrow />
              </span>
            </a>
          </div>
          <div className={s.sculpture} data-sculpture>
            <Image
              src={asset("/images/evidence-links.webp")}
              alt=""
              width={1536}
              height={1024}
            preload
              sizes="(max-width: 700px) 115vw, 76vw"
            />
            <span className={s.sourceTag}>
              <i /> SOURCE
            </span>
            <span className={s.evidenceTag}>
              <i /> EVIDENCE
            </span>
          </div>
          <div className={s.contextType} data-context-type aria-hidden="true">
            STAY CONNECTED.
          </div>
          <div className={s.heroBottom} data-hero-detail>
            <span>01 / CODE → EVIDENCE → REVIEW</span>
            <a href="#playground">
              SCROLL TO EXPLORE <span>↓</span>
            </a>
          </div>
        </section>
        <ImpactStudio t={t} ko={ko} />
        <Anatomy ko={ko} t={t} />
        <GettingStarted ko={ko} t={t} />
        <section
          id="limits"
          className={s.limits}
          aria-labelledby="limits-title"
        >
          <div className={s.sectionLabel}>
            <span>05 / AN HONEST TOOL</span>
            <span>{ko ? "할 수 있는 일의 경계" : "KNOW THE BOUNDARIES"}</span>
          </div>
          <div className={s.limitsHead}>
            <h2 id="limits-title">
              {ko ? (
                <>
                  점검은 도구가.
                  <br />
                  <em>판단은 사람이.</em>
                </>
              ) : (
                <>
                  A tool for checks.
                  <br />
                  <em>A person for judgment.</em>
                </>
              )}
            </h2>
            <p>{t.limits.intro}</p>
          </div>
          <div className={s.limitRows}>
            {t.limits.items.map((item, i) => (
              <details key={item.title}>
                <summary>
                  <span>0{i + 1}</span>
                  <h3>{item.title}</h3>
                  <span className={s.plus}>＋</span>
                </summary>
                <p>{item.body}</p>
              </details>
            ))}
          </div>
        </section>
        <section
          id="closing"
          className={s.closing}
          aria-labelledby="closing-title"
        >
          <span className={s.closingEyebrow}>THE NEXT CHANGE IS COMING.</span>
          <h2 id="closing-title">
            {ko ? (
              <>
                다음 변경에도,
                <br />
                놓치지 않도록.
              </>
            ) : (
              <>
                For everything
                <br />
                that changes next.
              </>
            )}
          </h2>
          <a href="#start" className={s.closingAction}>
            {ko ? "첫 연결 만들기" : "Make your first connection"}
            <span>
              <Arrow diagonal />
            </span>
          </a>
          <div data-ending-type className={s.endingType} aria-hidden="true">
            KEEP THE CONTEXT.
          </div>
        </section>
      </main>
      <footer className={s.footer}>
        <div className={s.footerTop}>
          <p>
            {ko
              ? "AI가 읽는 문서를 위한 근거와 검토 기록.\n무료 오픈 소스 CLI, LLM-WIKI Governance."
              : "Evidence and review records for the docs AI reads.\nLLM-WIKI Governance. A free, open source CLI."}
          </p>
          <div>
            <a href={PRODUCT.repo}>
              GitHub
              <Arrow diagonal />
            </a>
            <a href={ko ? PRODUCT.readmeKo : PRODUCT.readmeEn}>
              {ko ? "문서" : "Documentation"}
              <Arrow diagonal />
            </a>
            <a href={PRODUCT.issues}>
              {t.open.links.issues}
              <Arrow diagonal />
            </a>
            <a href={PRODUCT.discussions}>
              {t.open.links.discussions}
              <Arrow diagonal />
            </a>
            <a href={PRODUCT.npm}>
              npm
              <Arrow diagonal />
            </a>
          </div>
        </div>
        <div className={s.footerWordmark} aria-hidden="true">
          LLM–WIKI<span>↗</span>
        </div>
        <div className={s.footerBottom}>
          <span>© LLM-WIKI Governance · MIT</span>
          <a href={PRODUCT.release}>
            {ko ? "제품 정보 기준" : "Product baseline"} {PRODUCT.tag} ·{" "}
            {PRODUCT.baselineCommit.slice(0, 7)}
          </a>
          <span>
            Motion by <a href="https://gsap.com/standard-license">GSAP</a>
          </span>
        </div>
        <p className={s.footerNote}>{t.footer.note}</p>
      </footer>
    </div>
  );
}

function ImpactStudio({ t, ko }: { t: Dictionary; ko: boolean }) {
  const [file, setFile] = useState<FileId>("invoice");
  const [mode, setMode] = useState<Mode>("standard");
  const [applied, setApplied] = useState(false);
  const [notice, setNotice] = useState("");
  const [reviewStep, setReviewStep] = useState(0);
  const ids = useId();
  const o = outcome(file, applied, mode);
  const source = SOURCES[file];
  const p = t.playground;
  const pick = (f: FileId) => {
    if (f === file) return;
    setNotice(applied ? p.switched.replace("{file}", FILES[f].path) : "");
    setFile(f);
    setApplied(false);
    setReviewStep(0);
  };
  const result = !applied
    ? ko
      ? "아직, 같은 근거."
      : "Still on the same page."
    : !o.checked
      ? ko
        ? "연결은 있지만, 점검은 꺼짐."
        : "Connected. But not checked."
      : o.flagged.length
        ? ko
          ? "여기를 다시 볼 시간."
          : "This deserves another look."
        : ko
          ? "이 변경을 인용한 문서는 없습니다."
          : "No docs cite this change.";
  return (
    <>
      <section
        id="playground"
        className={s.studio}
        aria-labelledby="playground-title"
        data-file={file}
        data-mode={mode}
        data-applied={applied}
      >
        <div className={s.sectionLabel}>
          <span>02 / THE RIPPLE EFFECT</span>
          <span>
            {ko ? "직접 해 보는 변경 점검" : "AN INTERACTIVE CHANGE CHECK"}
          </span>
        </div>
        <header className={s.studioHead}>
          <h2 id="playground-title">
            {ko ? (
              <>
                코드 한 줄의 변화.
                <br />
                <em>어디까지 이어질까요?</em>
              </>
            ) : (
              <>
                One line changes.
                <br />
                <em>What follows?</em>
              </>
            )}
          </h2>
          <p>
            {ko
              ? "파일을 고르고 변경을 적용해 보세요.\n그 파일을 근거로 삼은 문서가 드러납니다."
              : "Choose a file. Apply a change.\nSee which documents cite it as evidence."}
          </p>
        </header>
        <div className={s.lab}>
          <fieldset className={s.filePicker}>
            <legend className="visually-hidden">{p.fileLabel}</legend>
            {FILE_IDS.map((f, i) => (
              <label key={f} className={s.fileOption}>
                <input
                  type="radio"
                  name={`${ids}-file`}
                  value={f}
                  aria-label={FILES[f].path}
                  checked={file === f}
                  onChange={() => pick(f)}
                />
                <span>
                  <small>0{i + 1}</small>
                  <code>
                    <span className={s.fileDir}>src/</span>
                    {FILES[f].path.slice(4)}
                  </code>
                  <Arrow diagonal />
                </span>
              </label>
            ))}
          </fieldset>
          <div className={s.labScene}>
            <div className={s.codePanel} data-source-panel>
              <div className={s.panelTop}>
                <span>
                  <i /> SOURCE FILE
                </span>
                <span>{applied ? "MODIFIED" : "ORIGINAL"}</span>
              </div>
              <h3>{FILES[file].path}</h3>
              <p className={s.changeDescription}>
                <span>
                  {ko
                    ? applied
                      ? "적용한 변경: "
                      : "적용할 변경: "
                    : applied
                      ? "Applied: "
                      : "To apply: "}
                </span>
                {p.files[file].change}
              </p>
              <div className={s.diff}>
                <code>{source.head}</code>
                <code className={applied ? s.removed : s.original}>
                  <span>{applied ? "−" : " "}</span>
                  {source.before.trim()}
                </code>
                {applied && (
                  <code className={s.added}>
                    <span>+</span>
                    {source.after.trim()}
                  </code>
                )}
                <code>{source.tail}</code>
              </div>
              <div className={s.actionRow}>
                <button
                  className={s.apply}
                  type="button"
                  aria-pressed={applied}
                  onClick={() => {
                    setApplied(!applied);
                    setReviewStep(0);
                    setNotice(
                      applied
                        ? ko
                          ? "변경을 되돌렸습니다."
                          : "The change was undone."
                        : "",
                    );
                  }}
                >
                  {applied ? p.undo : p.apply}
                  <span>{applied ? "↶" : "↗"}</span>
                </button>
                <span>
                  {ko
                    ? "결과가 바로 옆에 나타납니다"
                    : "See the result right here"}
                </span>
              </div>
              <p className={s.quickResult} data-active={applied}>
                {!applied
                  ? ko
                    ? "점검은 문서 상태를 자동으로 바꾸지 않습니다."
                    : "A check does not change a document’s status."
                  : !o.checked
                    ? ko
                      ? "lite: 변경 점검이 꺼져 있습니다."
                      : "lite: change checks are off."
                    : o.flagged.length
                      ? `${o.flagged.map((d) => DOCS[d].name).join(", ")} · ${mode === "strict" ? "CI FAIL" : "CI WARNING"}`
                      : ko
                        ? "다시 볼 문서 없음 · CI PASS"
                        : "No docs to revisit · CI PASS"}
              </p>
            </div>
            <svg
              className={s.connections}
              viewBox="0 0 1200 460"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {o.cites.includes("billing") && (
                <path d="M530 230C670 230 600 110 750 110" />
              )}
              {o.cites.includes("shipping") && (
                <path d="M530 230C670 230 600 350 750 350" />
              )}
            </svg>
            <div className={s.documents} data-documents>
              <p className={s.docEyebrow}>
                CITED DOCUMENTS <span>↙</span>
              </p>
              {DOC_IDS.map((d, i) => {
                const flagged = o.flagged.includes(d);
                const cited = o.cites.includes(d);
                return (
                  <div
                    key={d}
                    className={s.document}
                    data-doc={d}
                    data-flagged={flagged}
                    data-cited={cited}
                  >
                    <span className={s.docIndex}>0{i + 1}</span>
                    <div>
                      <h3>{DOCS[d].name}</h3>
                      <p>
                        {flagged
                          ? t.cards.flagged
                          : applied && cited && !o.checked
                            ? t.cards.unchecked
                            : applied
                              ? t.cards.unaffected
                              : ko
                                ? "근거가 연결된 문서"
                                : "A document with a source"}
                      </p>
                      <span className={s.docStatus}>
                        ● verified{" "}
                        <span>{ko ? "상태 유지" : "status unchanged"}</span>
                      </span>
                    </div>
                    <span className={s.docSymbol} aria-hidden="true">
                      ↗
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className={s.labBottom}>
            <fieldset className={s.modePicker}>
              <legend>{p.modeLabel}</legend>
              <div>
                {(["lite", "standard", "strict"] as Mode[]).map((m) => (
                  <label key={m}>
                    <input
                      type="radio"
                      name={`${ids}-mode`}
                      value={m}
                      checked={mode === m}
                      onChange={() => setMode(m)}
                    />
                    <span>{m}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <p className={s.modeDescription}>{p.modes[mode].summary}</p>
            <span className={s.ciResult} data-result={o.result}>
              {!applied ? "CI —" : `${o.result.toUpperCase()} · EXIT ${o.exit}`}
            </span>
          </div>
          <div
            className={s.result}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <span className="visually-hidden">
              {applied ? `${mode}: ${o.result}, exit ${o.exit}. ` : ""}
            </span>
            <span className={s.resultNumber}>
              {String(o.flagged.length).padStart(2, "0")}
            </span>
            <div>
              <h3>{result}</h3>
              <p>
                {!applied
                  ? ko
                    ? "변경을 적용하면 다시 볼 문서가 여기에 표시됩니다."
                    : "Apply a change to find the documents worth revisiting."
                  : !o.checked
                    ? p.why.lite
                    : o.flagged.length
                      ? ko
                        ? `${o.flagged.map((d) => DOCS[d].name).join(", ")} — 바뀐 파일을 인용하지만 문서 자체는 바뀌지 않았습니다.`
                        : `${o.flagged.map((d) => DOCS[d].name).join(", ")} cite the changed file but have not changed themselves.`
                      : p.why.none}
              </p>
            </div>
            {applied && !o.checked ? (
              <button
                className={s.textLink}
                onClick={() => setMode("standard")}
              >
                {p.next.liteAction}
                <Arrow />
              </button>
            ) : applied && o.flagged.length ? (
              <a className={s.textLink} href="#review">
                {ko ? "선택한 문서 재검토하기" : "Revisit these documents"}
                <Arrow />
              </a>
            ) : applied ? (
              <button
                className={s.textLink}
                onClick={() => {
                  pick("shipping");
                  document
                    .querySelector<HTMLInputElement>(
                      `input[name="${ids}-file"][value="shipping"]`,
                    )
                    ?.focus();
                }}
              >
                {ko ? "다른 파일로 해 보기" : "Try another file"}
                <Arrow />
              </button>
            ) : null}
          </div>
          <p className={s.notice} role="status">
            {notice}
          </p>
          <div className={s.labNotes}>
            <p>
              {p.disclaimer}{" "}
              {ko
                ? "기준: v1.42.0 실제 CLI 출력."
                : "Based on real v1.42.0 CLI output."}
            </p>
            <p>{p.resetNote}</p>
          </div>
          {applied && (
            <details className={s.rawOutput}>
              <summary>
                {p.terminal}
                <span>＋</span>
              </summary>
              <Terminal
                runs={[
                  TRANSCRIPTS.diffstat[file],
                  TRANSCRIPTS.impact[file][mode],
                ]}
              />
            </details>
          )}
        </div>
      </section>
      <ReviewJourney
        ko={ko}
        t={t}
        file={file}
        flagged={o.flagged}
        applied={applied}
        mode={mode}
        step={reviewStep}
        setStep={setReviewStep}
      />
    </>
  );
}

function ReviewJourney({
  ko,
  t,
  file,
  flagged,
  applied,
  mode,
  step,
  setStep,
}: {
  ko: boolean;
  t: Dictionary;
  file: FileId;
  flagged: string[];
  applied: boolean;
  mode: Mode;
  step: number;
  setStep: (n: number) => void;
}) {
  const active = applied && flagged.length > 0;
  const source = SOURCES[file];
  const labels = ko
    ? ["비교하기", "검토 대기로", "문장 고치기", "다시 승인"]
    : ["Compare", "Mark for review", "Update the prose", "Approve again"];
  const titles = ko
    ? [
        "바뀐 코드와 문서를 읽습니다.",
        "먼저, 검토 대기로 되돌립니다.",
        "필요한 문장을 직접 고칩니다.",
        "확인한 문서를 다시 승인합니다.",
      ]
    : [
        "Read the change beside the document.",
        "Move the document back to review.",
        "Update the prose where needed.",
        "Approve the document you checked.",
      ];
  const bodies = ko
    ? [
        "인용한 파일이 바뀌었다는 신호입니다. 문장이 여전히 맞는지는 사람이 판단합니다. impact는 문서의 verified 상태를 바꾸지 않습니다.",
        "아직 verified인 문서는 다시 승인할 수 없습니다. drift --downgrade는 승인 날짜 이후에 바뀐 소스를 인용한 문서를 needs_review로 내립니다. 날짜 기준이므로 승인 당일의 변경은 놓칠 수 있습니다.",
        "문서가 실제 동작을 정확히 설명하도록 편집하세요. 같은 변경 안에서 문서를 고치면 impact의 재검토 지목이 해소됩니다. 내용은 사람이나 에이전트가 작성합니다.",
        "review --approve로 reviewed_by와 새 reviewed_at을 기록합니다. 이 기록은 검토자의 신원을 증명하지 않습니다.",
      ]
    : [
        "A cited file changed. A person decides whether the prose still holds. impact does not change the document’s verified status.",
        "A document that is still verified cannot be approved again. drift --downgrade moves docs citing sources changed after their review date to needs_review. Its date-based check can miss same-day changes.",
        "Edit the prose to reflect actual behavior. Updating the document in the same change clears the impact finding. A person or an agent writes the content.",
        "review --approve records reviewed_by and a new reviewed_at. The recorded name does not prove the reviewer’s identity.",
      ];
  const invoice = file === "invoice";
  return (
    <section
      id="review"
      className={s.review}
      aria-labelledby="review-title"
      data-review-file={file}
    >
      <div className={s.reviewHead}>
        <span>THE HUMAN PART / 0{step + 1}</span>
        <h2 id="review-title">
          {ko ? (
            <>
              다시 읽고,
              <br />
              판단하는 건 당신.
            </>
          ) : (
            <>
              A second look.
              <br />A human decision.
            </>
          )}
        </h2>
        <p>
          {active
            ? `${FILES[file].path} → ${flagged.map((d) => DOCS[d as keyof typeof DOCS].name).join(", ")}`
            : !applied
              ? ko
                ? "위 데모에서 변경을 적용하면 선택한 문서의 검토 흐름을 볼 수 있습니다."
                : "Apply a change above to follow the review path for your documents."
              : mode === "lite"
                ? ko
                  ? "lite에서는 점검이 꺼져 있습니다. standard 또는 strict로 바꿔 보세요."
                  : "Checks are off in lite. Try standard or strict above."
                : ko
                  ? "이 변경으로 재검토할 문서는 없습니다. 위에서 다른 파일을 골라 보세요."
                  : "No docs need another look for this change. Try a different file above."}
        </p>
      </div>
      {active ? (
        <>
          <div
            className={s.reviewTabs}
            role="group"
            aria-label={ko ? "재검토 단계" : "Review steps"}
          >
            {labels.map((label, i) => (
              <button
                key={label}
                type="button"
                aria-pressed={i === step}
                onClick={() => setStep(i)}
              >
                <span>0{i + 1}</span>
                {label}
                <i data-active={i <= step} />
              </button>
            ))}
          </div>
          <div className={s.reviewStage} aria-live="polite">
            <span className={s.reviewNumber}>0{step + 1}</span>
            <div>
              <h3>{titles[step]}</h3>
              <p>{bodies[step]}</p>
              <div className={s.reviewSample}>
                {step === 0 || step === 2 ? (
                  <>
                    <span>
                      {step === 2 ? "EDITED DOCUMENT" : "CHANGED SOURCE"}
                    </span>
                    <code>
                      {step === 0
                        ? source.after.trim()
                        : invoice
                          ? t.cards.claimInvoiceFixed
                          : t.cards.claimShippingFee.replace("50", "70")}
                    </code>
                  </>
                ) : (
                  <>
                    <span>
                      {ko
                        ? "명령 예시 · 브라우저에서 실행하지 않습니다"
                        : "COMMAND EXAMPLE · NOT EXECUTED HERE"}
                    </span>
                    <code>
                      {step === 1
                        ? "npx llm-wiki drift --downgrade"
                        : flagged
                            .map(
                              (d) =>
                                `npx llm-wiki review --approve ${DOCS[d as keyof typeof DOCS].dir}${DOCS[d as keyof typeof DOCS].name}`,
                            )
                            .join("\n")}
                    </code>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className={s.reviewBottom}>
            <p>
              {ko
                ? "단계를 살펴보는 설명용 예시입니다. 실제 문서나 저장소는 바뀌지 않습니다."
                : "An illustrative walkthrough. Your documents and repository stay unchanged."}
            </p>
            <button
              type="button"
              className={s.textLink}
              onClick={() => setStep((step + 1) % 4)}
            >
              {step === 3
                ? ko
                  ? "처음부터 보기"
                  : "Back to the beginning"
                : t.review.next}
              <Arrow />
            </button>
          </div>
          {invoice && (
            <details className={s.reviewEvidence}>
              <summary>
                {t.review.commands} <span>＋</span>
              </summary>
              <Terminal
                runs={
                  step === 0
                    ? [TRANSCRIPTS.impact.invoice[mode]]
                    : step === 1
                      ? [TRANSCRIPTS.refused, TRANSCRIPTS.downgrade]
                      : step === 3
                        ? [TRANSCRIPTS.reapprove, TRANSCRIPTS.after]
                        : []
                }
              />
              {step === 2 && (
                <p>
                  {ko
                    ? "이 단계는 문서 편집입니다. 실행할 CLI 명령이 없습니다."
                    : "This step is a document edit. There is no CLI command to run."}
                </p>
              )}
            </details>
          )}
        </>
      ) : (
        <a href="#playground" className={s.textLink}>
          {ko ? "변경 데모로 돌아가기" : "Go to the change demo"}
          <Arrow />
        </a>
      )}
    </section>
  );
}

function Anatomy({ ko, t }: { ko: boolean; t: Dictionary }) {
  const [open, setOpen] = useState(1);
  const fields = ["status", "evidence", "reviewed_by"];
  const samples = [
    "status: needs_review",
    "evidence:\n  - src/invoice.js#symbol:computeTotal",
    "reviewed_by: maintainer\nreviewed_at: 2026-10-27",
  ];
  const titles = ko
    ? ["검토 상태를 남기고.", "설명의 출처를 잇고.", "승인한 기록을 남깁니다."]
    : [
        "A visible review state.",
        "A source for the statement.",
        "A record of approval.",
      ];
  return (
    <section id="anatomy" className={s.anatomy} aria-labelledby="anatomy-title">
      <div className={s.sectionLabel}>
        <span>03 / MORE THAN MARKDOWN</span>
        <span>
          {ko
            ? "평범한 파일, 읽을 수 있는 근거"
            : "PLAIN FILES. TRACEABLE SOURCES."}
        </span>
      </div>
      <div className={s.anatomyTitle}>
        <h2 id="anatomy-title">
          {ko ? (
            <>
              문서에도,
              <br />
              출처가 있습니다.
            </>
          ) : (
            <>
              Every statement.
              <br />A source to follow.
            </>
          )}
        </h2>
        <p>
          {ko
            ? "복잡한 새 시스템 대신,\nMarkdown 앞머리에 세 가지 기록.\n코드와 함께 저장하고, Git으로 관리합니다."
            : "Three records in ordinary Markdown.\nStored with your code.\nVersioned with Git."}
        </p>
      </div>
      <div className={s.fieldRows}>
        {fields.map((field, i) => (
          <div key={field} className={s.fieldRow} data-open={open === i}>
            <button
              type="button"
              onClick={() => setOpen(open === i ? -1 : i)}
              aria-expanded={open === i}
              aria-controls={`field-panel-${i}`}
            >
              <span>0{i + 1}</span>
              <span>
                {field}
                <small>{i === 2 ? " + reviewed_at" : ""}</small>
              </span>
              <span className={s.fieldTitle}>{titles[i]}</span>
              <span className={s.plus}>＋</span>
            </button>
            <div
              id={`field-panel-${i}`}
              hidden={open !== i}
              className={s.fieldPanel}
            >
              <pre>
                <code>{samples[i]}</code>
              </pre>
              <p>{t.anatomy.parts[i].body}</p>
            </div>
          </div>
        ))}
      </div>
      <div className={s.thread} aria-hidden="true">
        <span data-thread />
      </div>
      <p className={s.anatomyNote}>
        {ko
          ? "소스 인용은 연결을 남깁니다. 문장이 맞는지는 검토가 필요합니다."
          : "A citation records the connection. A review still has to judge the prose."}
      </p>
    </section>
  );
}

function GettingStarted({ ko, t }: { ko: boolean; t: Dictionary }) {
  const preview = t.start.commands.find((c) => c.id === "preview")!;
  const steps = t.start.steps.map(
    (id) => t.start.commands.find((c) => c.id === id)!,
  );
  return (
    <section id="start" className={s.start} aria-labelledby="start-title">
      <div className={s.sectionLabel}>
        <span>04 / MAKE THE CONNECTION</span>
        <span>MIT · NODE ≥18.18 · NO RUNTIME DEPENDENCIES</span>
      </div>
      <header className={s.startHead}>
        <span className={s.startGlyph} aria-hidden="true">
          ↳
        </span>
        <h2 id="start-title">
          {ko ? (
            <>
              작게 시작하세요.
              <br />
              <em>당신의 저장소에서.</em>
            </>
          ) : (
            <>
              Start small.
              <br />
              <em>In your own repository.</em>
            </>
          )}
        </h2>
        <p>
          {ko
            ? "AI 모델 없이 동작하는 로컬 CLI.\n먼저, 만들어질 파일부터 확인하세요."
            : "A local CLI. No AI model required.\nFirst, see what it would create."}
        </p>
      </header>
      <div className={s.preview}>
        <div>
          <span>00 / PREVIEW</span>
          <h3>{t.start.previewTitle}</h3>
          <span className={s.readOnly}>{t.start.readOnly}</span>
        </div>
        <div className={s.commandLine}>
          <code id="cmd-preview">{preview.cmd}</code>
          <CopyButton
            text={preview.cmd}
            label={t.start.copy}
            copied={t.start.copied}
            failed={t.start.copyFailed}
            target="cmd-preview"
          />
        </div>
        <p>{t.start.previewNote}</p>
      </div>
      <ol className={s.installSteps}>
        {steps.map((c, i) => (
          <li key={c.id}>
            <span className={s.installIndex}>0{i + 1}</span>
            <div>
              <h3>{c.title}</h3>
              <p>{c.effect}</p>
              <span className={s.writeTag}>
                {c.writes ? t.start.writes : t.start.readOnly}
              </span>
            </div>
            <div className={s.commandLine}>
              <code id={`cmd-${c.id}`}>{c.cmd}</code>
              <CopyButton
                text={c.cmd}
                label={t.start.copy}
                copied={t.start.copied}
                failed={t.start.copyFailed}
                target={`cmd-${c.id}`}
              />
            </div>
          </li>
        ))}
      </ol>
      <details className={s.allCommands}>
        <summary>
          {t.start.allCommands}
          <span>＋</span>
        </summary>
        <p className={s.packageNote}>{t.start.warning}</p>
        {t.start.commands
          .filter((c) => c.id !== "preview" && !t.start.steps.includes(c.id))
          .map((c) => (
            <div key={c.id}>
              <h3>
                {c.title}
                <span>{c.writes ? t.start.writes : t.start.readOnly}</span>
              </h3>
              <div className={s.commandLine}>
                <code id={`cmd-all-${c.id}`}>{c.cmd}</code>
                <CopyButton
                  text={c.cmd}
                  label={t.start.copy}
                  copied={t.start.copied}
                  failed={t.start.copyFailed}
                  target={`cmd-all-${c.id}`}
                />
              </div>
              <p>{c.effect}</p>
            </div>
          ))}
      </details>
      <a
        className={s.startDocs}
        href={ko ? PRODUCT.readmeKo : PRODUCT.readmeEn}
      >
        {ko
          ? "전체 사용법은 GitHub에서"
          : "Explore the complete guide on GitHub"}
        <Arrow diagonal />
      </a>
    </section>
  );
}
