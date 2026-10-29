import { notFound } from "next/navigation";
import { getDictionary } from "@/content";
import { TRANSCRIPTS } from "@/content/transcripts";
import type { CommandEntry, Dictionary } from "@/content/types";
import { CopyButton } from "@/components/CopyButton";
import { LangSwitch } from "@/components/LangSwitch";
import { REVIEW, STORY } from "@/components/scenes/beats";
import { ScrollSetup } from "@/components/scenes/Motion";
import { Opening } from "@/components/scenes/Opening";
import { Playground } from "@/components/scenes/Playground";
import { Sequence } from "@/components/scenes/Sequence";
import { Terminal } from "@/components/scenes/Terminal";
import { PRODUCT, SITE_REPO, asset, isLocale } from "@/lib/site";
import styles from "./page.module.css";

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  const other = t.nav.otherLang;
  const command = (id: string) => t.start.commands.find((c) => c.id === id)!;
  const preview = command("preview");

  return (
    <>
      <a className="skip-link" href="#main">{t.nav.skip}</a>

      <header className={`${styles.header} env-night`}>
        <div className={styles.headerRow}>
          <a className={styles.wordmark} href="#top" aria-label={PRODUCT.name}>
            <svg viewBox="0 0 28 28" aria-hidden="true" className={styles.logo}>
              <path d="M4 22 14 5l10 17z" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" />
              <circle cx="14" cy="16" r="3" fill="currentColor" />
            </svg>
            <span>LLM-WIKI <span className={styles.wordmarkLight}>Governance</span></span>
          </a>
          <nav aria-label={t.nav.label} className={styles.nav}>
            <ul>
              <li><a href="#story">{t.nav.story}</a></li>
              <li><a href="#playground">{t.nav.playground}</a></li>
              <li><a href="#start">{t.nav.start}</a></li>
              <li><a href="#limits">{t.nav.limits}</a></li>
            </ul>
          </nav>
          <LangSwitch href={asset(`/${other}/`)} hrefLang={other} label={t.nav.langLabel} name={t.nav.otherLangName} />
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        <Opening t={t} />
        <Sequence id="story" t={t} heading={t.story.heading} intro={t.story.intro} stepOf={t.story.stepOf} beats={t.story.beats} states={STORY} />
        <Playground t={t} />
        <Sequence
          id="review"
          t={t}
          heading={t.review.heading}
          intro={t.review.intro}
          stepOf={t.review.stepOf}
          beats={t.review.beats}
          states={REVIEW}
          light="dawn"
          details={[
            null,
            <Terminal key="downgrade" label={t.playground.terminal} runs={[TRANSCRIPTS.refused, TRANSCRIPTS.downgrade]} />,
            null,
            <Terminal key="approve" label={t.playground.terminal} runs={[TRANSCRIPTS.reapprove, TRANSCRIPTS.after]} />,
            null,
          ]}
        />

        <section id="start" className={`${styles.start} env-paper`} aria-labelledby="start-title">
          <div className={`wrap ${styles.startGrid}`}>
            <div className={styles.startHead}>
              <h2 id="start-title" className={styles.heading}>{t.start.heading}</h2>
              <p className={styles.intro}>{t.start.intro}</p>
              <ul className={styles.facts}>
                {t.start.facts.map((fact) => <li key={fact}>{fact}</li>)}
              </ul>
            </div>
            <div className={styles.preview}>
              <h3 className={styles.previewTitle}>{t.start.previewTitle}</h3>
              <div className={styles.cmdRow}>
                <pre className={styles.cmd} tabIndex={0}><code id="cmd-preview">{preview.cmd}</code></pre>
                <CopyButton text={preview.cmd} label={t.start.copy} copied={t.start.copied} failed={t.start.copyFailed} target="cmd-preview" />
              </div>
              <p className={styles.effect}>{t.start.previewNote}</p>
            </div>
            <ol className={styles.steps}>
              {t.start.steps.map((id) => (
                <li key={id}>
                  <Command c={command(id)} t={t} scope="step" />
                </li>
              ))}
            </ol>
            <details className={styles.all}>
              <summary>{t.start.allCommands}</summary>
              <ol className={styles.allList}>
                {t.start.commands.map((c) => (
                  <li key={c.id}>
                    <Command c={c} t={t} scope="all" />
                  </li>
                ))}
              </ol>
              <p className={styles.warning} role="note">{t.start.warning}</p>
            </details>
          </div>
        </section>

        <section id="limits" className={`${styles.limits} env-paper`} aria-labelledby="limits-title">
          <div className="wrap">
            <h2 id="limits-title" className={styles.heading}>{t.limits.heading}</h2>
            <p className={styles.intro}>{t.limits.intro}</p>
            <dl className={styles.limitList}>
              {t.limits.items.map((item) => (
                <div key={item.title}>
                  <dt>{item.title}</dt>
                  <dd>{item.body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section id="open-source" className={`${styles.open} env-paper`} aria-labelledby="open-title">
          <div className={`wrap ${styles.openGrid}`}>
            <div>
              <h2 id="open-title" className={styles.heading}>{t.open.heading}</h2>
              <p className={styles.intro}>{t.open.body}</p>
            </div>
            <ul className={styles.links}>
              <li><a href={PRODUCT.repo}>{t.open.links.repo}</a></li>
              <li><a href={lang === "ko" ? PRODUCT.readmeKo : PRODUCT.readmeEn}>{t.open.links.docs}</a></li>
              <li><a href={PRODUCT.issues}>{t.open.links.issues}</a></li>
              <li><a href={PRODUCT.discussions}>{t.open.links.discussions}</a></li>
              <li><a href={PRODUCT.npm}>{t.open.links.npm}</a></li>
            </ul>
          </div>
        </section>
      </main>

      <footer className={`${styles.footer} env-paper`}>
        <div className="wrap">
          <table className={styles.titleBlock}>
            <caption className="visually-hidden">{t.footer.label}</caption>
            <tbody>
              <tr><th scope="row">{t.footer.product}</th><td>{PRODUCT.name}</td></tr>
              <tr><th scope="row">{t.footer.version}</th><td><a href={PRODUCT.release}>{PRODUCT.tag}</a></td></tr>
              <tr><th scope="row">{t.footer.baseline}</th><td><code title={PRODUCT.baselineCommit}>{PRODUCT.baselineCommit.slice(0, 7)}</code></td></tr>
              <tr><th scope="row">{t.footer.license}</th><td>{PRODUCT.license}</td></tr>
              <tr><th scope="row">{t.footer.site}</th><td><a href={SITE_REPO}>{t.footer.siteValue}</a></td></tr>
              <tr><th scope="row">{t.footer.motion}</th><td><a href="https://gsap.com/standard-license">{t.footer.motionValue}</a></td></tr>
            </tbody>
          </table>
          <p className={styles.footNote}>{t.footer.note}</p>
        </div>
      </footer>
      <ScrollSetup />
    </>
  );
}

function Command({ c, t, scope }: { c: CommandEntry; t: Dictionary; scope: string }) {
  const id = `cmd-${scope}-${c.id}`;
  return (
    <div className={styles.command}>
      <div className={styles.commandHead}>
        <h3>{c.title}</h3>
        <ul className={styles.tags}>
          <li className={c.writes ? styles.tagWrite : styles.tagRead}>
            <svg viewBox="0 0 12 12" aria-hidden="true" className={styles.tagIcon}>
              {c.writes ? <path d="M2 10 9.5 2.5l1.5 1.5L3.5 11.5H2z" fill="currentColor" /> : <circle cx="6" cy="6" r="4" fill="none" stroke="currentColor" strokeWidth="1.6" />}
            </svg>
            {c.writes ? t.start.writes : t.start.readOnly}
          </li>
          <li className={styles.tagPlain}>{c.needsInstall ? t.start.afterInstall : t.start.noInstall}</li>
        </ul>
      </div>
      <div className={styles.cmdRow}>
        <pre className={styles.cmd} tabIndex={0}><code id={id}>{c.cmd}</code></pre>
        <CopyButton text={c.cmd} label={t.start.copy} copied={t.start.copied} failed={t.start.copyFailed} target={id} />
      </div>
      <p className={styles.effect}>{c.effect}</p>
    </div>
  );
}
