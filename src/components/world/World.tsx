import type { Ref } from "react";
import type { Dictionary, DocId, FileId } from "@/content/types";
import { CITES, DOCS, FILES, GHOSTS, SOURCES } from "@/lib/world";
import styles from "./World.module.css";

type WorldText = Dictionary["world"];

const FILE_IDS = Object.keys(FILES) as FileId[];
const DOC_IDS = Object.keys(DOCS) as DocId[];

/**
 * The exploded view's markup. It renders hidden; a scene measures the stage and
 * calls the renderer from ./render, which places every plate and line and then
 * reveals the drawing. The whole drawing is decorative: scenes say everything
 * it shows in real text.
 */
export function World({ t, ref, className = "" }: { t: WorldText; ref?: Ref<HTMLDivElement>; className?: string }) {
  return (
    <div ref={ref} className={`${styles.world} ${className}`} aria-hidden="true">
      <svg className={styles.under} data-svg="under">
        <polygon data-slab="floor" className={styles.slabFloor} />
        {FILE_IDS.map((id) => (
          <polygon key={id} data-slab={`file-${id}`} className={styles.slab} />
        ))}
      </svg>

      <div className={`${styles.plate} ${styles.floor}`} data-plate="floor" style={{ width: 1460, height: 880 }}>
        {GHOSTS.map((g) => (
          <div key={g.path} className={styles.ghost} style={{ left: g.x, top: g.y, width: g.w, height: g.h }}>
            <span>{g.path}</span>
            <i />
            <i />
            <i />
          </div>
        ))}
      </div>

      {FILE_IDS.map((id) => {
        const f = FILES[id];
        const src = SOURCES[id];
        return (
          <div key={id} className={`${styles.plate} ${styles.file}`} data-plate={`file-${id}`} data-file={id} style={{ width: f.w, height: f.h }}>
            <p className={styles.tab}>{f.path}</p>
            <pre className={styles.code}>
              <span>{src.head}</span>
              <span className={styles.lineSlot}>
                <span className={styles.lineOld} data-el={`old-${id}`}>{src.before}</span>
                <span className={styles.lineNew} data-el={`new-${id}`}>{src.after}</span>
              </span>
              <span>{src.tail}</span>
            </pre>
          </div>
        );
      })}

      <svg className={styles.over} data-svg="over">
        {DOC_IDS.map((id) => (
          <g key={id} data-doc-under={id}>
            <polygon data-footprint={id} className={styles.footprint} />
            <polygon data-slab={`doc-${id}`} className={styles.slabDoc} />
          </g>
        ))}
        {CITES.map((c) => (
          <g key={c.id} data-cite={c.id} data-file={c.file} data-doc={c.doc}>
            <line className={styles.cite} data-line="" />
            <line className={styles.pulse} data-pulse="" />
            <circle className={styles.foot} r="5" data-foot="" />
          </g>
        ))}
      </svg>

      <div className={`${styles.plate} ${styles.doc}`} data-plate="doc-billing" style={{ width: DOCS.billing.w, height: DOCS.billing.h }}>
        <p className={styles.docHead}>
          <span>{DOCS.billing.path}</span>
          <span className={styles.flag} data-el="flag-billing">
            <FlagShape />
            {t.flag}
          </span>
        </p>
        <pre className={styles.front}>
          {"status: "}
          <span className={styles.swap}>
            <span data-el="needs-billing" className={styles.pending}>needs_review</span>
            <span data-el="verified-billing" className={styles.held}>verified</span>
          </span>
          <span className={styles.seal} data-el="seal-billing"><SealShape /></span>
          <span data-el="stamp-billing">
            {"\nreviewed_by: maintainer\nreviewed_at: "}
            <span className={styles.swap}>
              <span data-el="at-old">2026-10-27</span>
              <span data-el="at-new">2026-10-29</span>
            </span>
          </span>
          {"\nevidence:\n  - src/invoice.js#symbol:computeTotal\n  - src/shipping.js#symbol:shippingFee"}
        </pre>
        <p className={styles.claim} style={{ left: 170, top: 300, width: 320 }} data-el="claim-bi">
          <span className={styles.swap}>
            <span data-el="claim-old">{t.claimInvoice}</span>
            <span data-el="claim-new">{t.claimInvoiceFixed}</span>
          </span>
        </p>
        <p className={styles.claim} style={{ left: 560, top: 300, width: 170 }}>{t.claimShippingFree}</p>
        <i className={styles.pin} style={{ left: 170, top: 300 }} data-el="pin-bi" />
        <i className={styles.pin} style={{ left: 560, top: 300 }} />
      </div>

      <div className={`${styles.plate} ${styles.doc}`} data-plate="doc-shipping" style={{ width: DOCS.shipping.w, height: DOCS.shipping.h }}>
        <p className={styles.docHead}>
          <span>{DOCS.shipping.path}</span>
          <span className={styles.flag} data-el="flag-shipping">
            <FlagShape />
            {t.flag}
          </span>
        </p>
        <pre className={styles.front}>
          {"status: "}
          <span className={styles.held}>verified</span>
          {"\nreviewed_by: maintainer\nreviewed_at: 2026-10-27\nevidence:\n  - src/shipping.js#symbol:shippingFee"}
        </pre>
        <p className={styles.claim} style={{ left: 240, top: 280, width: 300 }}>{t.claimShippingFee}</p>
        <i className={styles.pin} style={{ left: 240, top: 280 }} />
      </div>
    </div>
  );
}

function FlagShape() {
  return (
    <svg viewBox="0 0 16 16" className={styles.flagIcon}>
      <path d="M3 1v14" stroke="currentColor" strokeWidth="2" />
      <path d="M4 1.5h10l-3 3.5 3 3.5H4z" fill="currentColor" />
    </svg>
  );
}

function SealShape() {
  return (
    <svg viewBox="0 0 16 16" className={styles.sealIcon}>
      <path d="M8 1.5 15 14.5H1z" fill="currentColor" />
    </svg>
  );
}
