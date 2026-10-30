import type { Dictionary } from "@/content/types";
import { CodeCard, DocCard } from "../figure/Cards";
import { Links } from "../figure/Links";
import styles from "./Anatomy.module.css";

/**
 * Scene 03: a doc taken apart. The three records that tie it to code are named
 * beside it, and its evidence lines run to the files they cite.
 */
export function Anatomy({ t }: { t: Dictionary }) {
  const a = t.anatomy;
  return (
    <section id="anatomy" className={`${styles.anatomy} env-night`} aria-labelledby="anatomy-title">
      <header className={styles.head}>
        <h2 id="anatomy-title" className={styles.heading}>{a.heading}</h2>
        <p className={styles.lede}>{a.lede}</p>
      </header>
      <div className={styles.body}>
        <dl className={styles.parts}>
          {a.parts.map((p) => (
            <div key={p.field} className={styles.part}>
              <dt>
                <code className={styles.field}>{p.field}</code>
                <span className={styles.partTitle}>{p.title}</span>
              </dt>
              <dd>{p.body}</dd>
            </div>
          ))}
        </dl>
        <div className={styles.figure} aria-hidden="true">
          <DocCard doc="billing" t={t.cards} status="verified" claim={t.cards.claimInvoice} anchor="an" className={styles.doc} />
          <div className={styles.files}>
            <CodeCard file="invoice" t={t.cards} state="unchanged" anchor="an-invoice" />
            <CodeCard file="shipping" t={t.cards} state="unchanged" anchor="an-shipping" />
          </div>
          <Links
            links={[
              { from: "an-ev0", to: "an-invoice-line", state: "aligned" },
              { from: "an-ev1", to: "an-shipping-line", state: "aligned" },
            ]}
          />
        </div>
      </div>
    </section>
  );
}
