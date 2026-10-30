"use client";

import type { Dictionary } from "@/content/types";
import { CopyButton } from "./CopyButton";
import { LangSwitch } from "./LangSwitch";
import { Narrative } from "./story/Narrative";
import { OptionalDemo } from "./story/OptionalDemo";
import { TRANSCRIPTS } from "@/content/transcripts";
import { PRODUCT, asset } from "@/lib/site";
import s from "./Experience.module.css";

export function Experience({ lang, t }: { lang: "ko" | "en"; t: Dictionary }) {
  const ko = lang === "ko";
  const preview = t.start.commands[0];
  const home = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    history.replaceState(null, "", "#connection");
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    window.scrollTo({ top: 0, behavior: "instant" });
    window.dispatchEvent(new Event("story-home"));
  };
  return (
    <div className={s.shell}>
      <a href="#start" className="skip-link">
        {ko ? "설치로 건너뛰기" : "Skip to installation"}
      </a>
      <header className={s.header}>
        <a className={s.brand} href="#connection" onClick={home}>
          <svg viewBox="0 0 36 36" aria-hidden="true">
            <path
              d="M6 12h16a7 7 0 0 1 0 14h-4M30 24H14a7 7 0 0 1 0-14h4"
              fill="none"
              stroke="currentColor"
              strokeWidth="4.5"
            />
          </svg>
          <span>
            LLM–WIKI <small>GOVERNANCE</small>
          </span>
        </a>
        <nav aria-label={t.nav.label}>
          <a href="#start">{t.nav.start}</a>
          <a href="#reference">{ko ? "명령과 한계" : "Reference"}</a>
          <LangSwitch
            href={asset(`/${ko ? "en" : "ko"}/`)}
            hrefLang={ko ? "en" : "ko"}
            label={t.nav.langLabel}
            name={ko ? "EN" : "한국어"}
          />
        </nav>
      </header>
      <main id="main">
        <h1 className="visually-hidden">
          LLM-WIKI Governance —{" "}
          {ko
            ? "소스 인용과 문서 검토 기록"
            : "Source citations and document review records"}
        </h1>
        <Narrative lang={lang} />
        <section id="start" className={s.start}>
          <span>START IN YOUR REPOSITORY</span>
          <h2>{ko ? "첫 연결을 만드세요." : "Make the first connection."}</h2>
          <p>{t.start.previewNote}</p>
          <div className={s.command}>
            <code id="cmd-preview">{preview.cmd}</code>
            <CopyButton
              text={preview.cmd}
              label={t.start.copy}
              copied={t.start.copied}
              failed={t.start.copyFailed}
              target="cmd-preview"
            />
          </div>
          <ul className={s.facts}>
            {t.start.facts.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
          <details className={s.commandList}>
            <summary>{t.start.allCommands}</summary>
            <p>{t.start.intro}</p>
            {t.start.commands.slice(1).map((command) => (
              <div className={s.commandItem} key={command.id}>
                <h3>{command.title}</h3>
                <small>
                  {command.writes ? t.start.writes : t.start.readOnly} ·{" "}
                  {command.needsInstall
                    ? t.start.afterInstall
                    : t.start.noInstall}
                </small>
                <div className={s.command}>
                  <code id={`cmd-${command.id}`}>{command.cmd}</code>
                  <CopyButton
                    text={command.cmd}
                    label={t.start.copy}
                    copied={t.start.copied}
                    failed={t.start.copyFailed}
                    target={`cmd-${command.id}`}
                  />
                </div>
                <p>{command.effect}</p>
              </div>
            ))}
            <p className={s.warning}>{t.start.warning}</p>
          </details>
        </section>
        <section id="reference" className={s.reference}>
          <div className={s.referenceIntro}>
            <span>KEEP THE JUDGMENT HUMAN</span>
            <h2>
              {ko
                ? "근거를 남기고,\n판단은 직접."
                : "Keep the evidence.\nMake the judgment."}
            </h2>
            <p>{t.limits.intro}</p>
          </div>
          <div className={s.referenceBody}>
            <details>
              <summary>
                {ko
                  ? "선택해서 비교하는 별도 데모"
                  : "Optional interactive comparison"}
              </summary>
              <OptionalDemo t={t} lang={lang} />
            </details>
            <details>
              <summary>
                {ko
                  ? "검토 과정의 명령과 실제 출력"
                  : "Review commands and captured output"}
              </summary>
              <p>{t.review.lede}</p>
              <p>{t.review.steps[1].note}</p>
              {[
                TRANSCRIPTS.refused,
                TRANSCRIPTS.downgrade,
                TRANSCRIPTS.reapprove,
                TRANSCRIPTS.after,
              ].map((raw) => (
                <div key={raw.source}>
                  <pre>
                    <code>
                      $ {raw.cmd}
                      {"\n"}
                      {raw.lines.join("\n")}
                      {"\n"}exit {raw.exit}
                    </code>
                  </pre>
                </div>
              ))}
            </details>
            {t.limits.items.map((item) => (
              <details key={item.title}>
                <summary>{item.title}</summary>
                <p>{item.body}</p>
              </details>
            ))}
          </div>
        </section>
        <section className={s.ending}>
          <span>OPEN SOURCE. OPEN TO YOUR NEXT CHANGE.</span>
          <h2>
            {ko
              ? "다음 변경을 위한 연결."
              : "A connection for the next change."}
          </h2>
          <p>{t.open.body}</p>
          <a href={PRODUCT.repo}>{t.open.links.repo} ↗</a>
          <a href={ko ? PRODUCT.readmeKo : PRODUCT.readmeEn}>
            {t.open.links.docs} ↗
          </a>
          <a href="#connection" onClick={home}>
            {ko ? "처음으로 ↑" : "Back to the opening ↑"}
          </a>
        </section>
      </main>
      <footer className={s.footer}>
        <span>LLM–WIKI GOVERNANCE</span>
        <a href={PRODUCT.repo}>GitHub ↗</a>
        <span>{PRODUCT.tag} · MIT</span>
      </footer>
    </div>
  );
}
