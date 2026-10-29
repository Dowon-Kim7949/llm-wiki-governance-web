import { notFound } from "next/navigation";
import { getDictionary } from "@/content";
import { CopyButton } from "@/components/CopyButton";
import { Demo } from "@/components/Demo";
import { HeroPlot } from "@/components/HeroPlot";
import { LangSwitch } from "@/components/LangSwitch";
import { Marker } from "@/components/Marker";
import { PRODUCT, SITE_REPO, asset, isLocale } from "@/lib/site";
import styles from "./page.module.css";

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  const other = t.nav.otherLang;

  return (
    <>
      <a className="skip-link" href="#main">{t.nav.skip}</a>

      <header className={styles.header}>
        <div className={`wrap ${styles.headerRow}`}>
          <a className={styles.wordmark} href={`#top`} aria-label={PRODUCT.name}>
            <svg viewBox="0 0 28 28" aria-hidden="true" className={styles.logo}>
              <path d="M4 22 14 5l10 17z" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" />
              <circle cx="14" cy="16" r="3" fill="currentColor" />
            </svg>
            <span>LLM-WIKI <span className={styles.wordmarkLight}>Governance</span></span>
          </a>
          <nav aria-label={t.nav.label} className={styles.nav}>
            <ul>
              <li><a href="#workflow">{t.nav.workflow}</a></li>
              <li><a href="#demo">{t.nav.demo}</a></li>
              <li><a href="#start">{t.nav.start}</a></li>
              <li><a href="#limits">{t.nav.limits}</a></li>
            </ul>
          </nav>
          <LangSwitch href={asset(`/${other}/`)} hrefLang={other} label={t.nav.langLabel} name={t.nav.otherLangName} />
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        <section id="top" className={styles.hero} aria-labelledby="hero-title">
          <div className={`wrap ${styles.heroGrid}`}>
            <div className={styles.heroText}>
              <p className={styles.productName}>{PRODUCT.name}</p>
              <h1 id="hero-title" className={styles.heroTitle}>{t.hero.title}</h1>
              <p className={styles.lede}>{t.hero.lede}</p>
              <div className={styles.actions}>
                <a className="btn btn-primary" href="#start">{t.hero.primary}</a>
                <a className="btn btn-secondary" href={PRODUCT.repo}>{t.hero.secondary}</a>
              </div>
              <ul className={styles.facts}>
                {t.hero.facts.map((fact) => <li key={fact}>{fact}</li>)}
              </ul>
            </div>
            <HeroPlot label={t.hero.plotLabel} note={t.hero.plotNote} doc={t.hero.plotDoc} srcA={t.hero.plotSrcA} srcB={t.hero.plotSrcB} />
          </div>
        </section>

        <section id="problem" className="section" aria-labelledby="problem-title">
          <div className="wrap">
            <div className="section-head">
              <h2 id="problem-title">{t.problem.heading}</h2>
              <p>{t.problem.intro}</p>
            </div>
            <ul className={styles.problems}>
              {t.problem.points.map((p) => (
                <li key={p.title}>
                  <h3>{p.title}</h3>
                  <p>{p.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="workflow" className="section" aria-labelledby="workflow-title">
          <div className="wrap">
            <div className="section-head">
              <h2 id="workflow-title">{t.workflow.heading}</h2>
              <p>{t.workflow.intro}</p>
            </div>
            <ol className={styles.traverse}>
              {t.workflow.steps.map((step, i) => (
                <li key={step.name}>
                  <span className={styles.traverseNum} aria-hidden="true">{i + 1}</span>
                  <p className={styles.traverseName} lang="en">{step.name}</p>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                  {step.cmd && <code className={styles.traverseCmd}>{step.cmd}</code>}
                </li>
              ))}
            </ol>
            <ul className={styles.statusKey} aria-label={t.demo.status.title}>
              <li><Marker kind="pending" /> <code>needs_review</code></li>
              <li><Marker kind="held" /> <code>verified</code></li>
              <li><Marker kind="flag" /> <code>impact.source_changed</code></li>
            </ul>
          </div>
        </section>

        <section id="demo" className="section" aria-labelledby="demo-title">
          <div className="wrap">
            <div className="section-head">
              <h2 id="demo-title">{t.demo.heading}</h2>
              <p>{t.demo.intro}</p>
            </div>
            <Demo t={t.demo} />
            <details className={styles.textVersion}>
              <summary>{t.demo.textHeading}</summary>
              <p>{t.demo.textIntro}</p>
              <ol>
                {t.demo.steps.map((step) => (
                  <li key={step.id}>
                    <strong>{step.title}.</strong> {step.body} {step.caveat}
                  </li>
                ))}
              </ol>
              <ul>
                {(["lite", "standard", "strict"] as const).map((m) => (
                  <li key={m}><code>{m}</code>: {t.demo.modes[m].summary}</li>
                ))}
              </ul>
            </details>
          </div>
        </section>

        <section id="start" className="section" aria-labelledby="start-title">
          <div className="wrap">
            <div className="section-head">
              <h2 id="start-title">{t.start.heading}</h2>
              <p>{t.start.intro}</p>
            </div>
            <ol className={styles.commands}>
              {t.start.commands.map((c) => (
                <li key={c.id} className={styles.command}>
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
                    <pre className={styles.cmd} tabIndex={0}><code id={`cmd-${c.id}`}>{c.cmd}</code></pre>
                    <CopyButton text={c.cmd} label={t.start.copy} copied={t.start.copied} failed={t.start.copyFailed} target={`cmd-${c.id}`} />
                  </div>
                  <p className={styles.effect}>{c.effect}</p>
                </li>
              ))}
            </ol>
            <p className={styles.warning} role="note">{t.start.warning}</p>
          </div>
        </section>

        <section id="limits" className="section" aria-labelledby="limits-title">
          <div className="wrap">
            <div className="section-head">
              <h2 id="limits-title">{t.limits.heading}</h2>
              <p>{t.limits.intro}</p>
            </div>
            <dl className={styles.limits}>
              {t.limits.items.map((item) => (
                <div key={item.title}>
                  <dt>{item.title}</dt>
                  <dd>{item.body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section id="open-source" className="section" aria-labelledby="open-title">
          <div className={`wrap ${styles.open}`}>
            <div>
              <h2 id="open-title">{t.open.heading}</h2>
              <p className={styles.openBody}>{t.open.body}</p>
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

      <footer className={styles.footer}>
        <div className="wrap">
          <table className={styles.titleBlock}>
            <caption className="visually-hidden">{t.footer.label}</caption>
            <tbody>
              <tr><th scope="row">{t.footer.product}</th><td>{PRODUCT.name}</td></tr>
              <tr><th scope="row">{t.footer.version}</th><td><a href={PRODUCT.release}>{PRODUCT.tag}</a></td></tr>
              <tr><th scope="row">{t.footer.baseline}</th><td><code title={PRODUCT.baselineCommit}>{PRODUCT.baselineCommit.slice(0, 7)}</code></td></tr>
              <tr><th scope="row">{t.footer.license}</th><td>{PRODUCT.license}</td></tr>
              <tr><th scope="row">{t.footer.site}</th><td><a href={SITE_REPO}>{t.footer.siteValue}</a></td></tr>
            </tbody>
          </table>
          <p className={styles.footNote}>{t.footer.note}</p>
        </div>
      </footer>
    </>
  );
}
