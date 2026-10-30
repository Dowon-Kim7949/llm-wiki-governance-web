// The site's two objects, drawn front-on so their words can be read: a doc
// (paper) and a source file (code). Every figure is built from these and the
// connectors in ./Links. Status is always a shape and a word, never colour alone.
import { Fragment } from "react";
import type { Dictionary, DocId, FileId } from "@/content/types";
import { DOCS, FILES, SOURCES } from "@/lib/demo";
import styles from "./Cards.module.css";

type CardText = Dictionary["cards"];
export type Mark = "flagged" | "unaffected" | "unchecked" | null;
export type Status = "needs_review" | "verified";

export function StatusChip({ status }: { status: Status }) {
  return (
    <span className={`${styles.chip} ${status === "verified" ? styles.held : styles.pending}`}>
      <svg viewBox="0 0 12 12" aria-hidden="true" className={styles.chipIcon}>
        {status === "verified" ? <path d="M6 1 11.5 11H.5z" fill="currentColor" /> : <circle cx="6" cy="6" r="4.2" fill="none" stroke="currentColor" strokeWidth="2" />}
      </svg>
      {status}
    </span>
  );
}

export function MarkChip({ mark, t }: { mark: Exclude<Mark, null>; t: CardText }) {
  return (
    <span className={`${styles.chip} ${styles[mark]}`}>
      <svg viewBox="0 0 12 12" aria-hidden="true" className={styles.chipIcon}>
        {mark === "flagged" && <path d="M2.5 1v10M3 1.5h7L8 4l2 2.5H3z" fill="currentColor" stroke="currentColor" strokeWidth="1.2" />}
        {mark === "unaffected" && <circle cx="6" cy="6" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2 1.6" />}
        {mark === "unchecked" && (
          <>
            <circle cx="6" cy="6" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M2.5 9.5 9.5 2.5" stroke="currentColor" strokeWidth="1.6" />
          </>
        )}
      </svg>
      {t[mark]}
    </span>
  );
}

type DocProps = {
  doc: DocId;
  t: CardText;
  status: Status;
  mark?: Mark;
  /** The doc's sentence; with `fixed`, the old one is struck and the new one follows. */
  claim: string;
  fixed?: string | null;
  reviewedAt?: string;
  freshStamp?: boolean;
  /** Anchor prefix for connectors: `${anchor}-claim`, `${anchor}-ev0`, ... */
  anchor: string;
  /** Hide the frontmatter body and keep evidence rows only (dense maps). */
  compact?: boolean;
  /** Path, chips and the sentence only: one relationship, nothing else. */
  minimal?: boolean;
  className?: string;
};

export function DocCard({ doc, t, status, mark = null, claim, fixed = null, reviewedAt = "2026-10-27", freshStamp = false, anchor, compact = false, minimal = false, className = "" }: DocProps) {
  const d = DOCS[doc];
  return (
    <article className={`${styles.doc} ${minimal ? styles.minimal : ""} ${compact ? styles.compact : ""} ${mark ? styles[`doc-${mark}`] : ""} ${className}`} data-doc={doc} data-mark={mark ?? "none"} data-status={status}>
      <header className={styles.docHead}>
        <p className={styles.path}>
          {!minimal && !compact && <span className={styles.dir}>{d.dir}</span>}
          <strong>{d.name}</strong>
        </p>
        <span className={styles.chips}>
          <StatusChip status={status} />
          {mark && <MarkChip mark={mark} t={t} />}
        </span>
      </header>
      {!minimal && (
      <dl className={styles.front}>
        {!compact && (
          <div className={styles.row}>
            <dt>status</dt>
            <dd>{status}</dd>
          </div>
        )}
        <div className={styles.row}>
          <dt>evidence</dt>
          <dd>
            {d.evidence.map((ev, i) => {
              // Detection is file-level, so the file is the part that matters; dense maps show only that.
              const [path, fragment] = ev.split("#");
              return (
                <span key={ev} className={styles.evidence} data-a={`${anchor}-ev${i}`}>
                  <span className={styles.evPath}>
                    {/* A narrow card breaks a path after a slash, not inside a name. */}
                    {path.split("/").map((part, j, all) => (
                      <Fragment key={j}>
                        {part}
                        {j < all.length - 1 && (
                          <>
                            /<wbr />
                          </>
                        )}
                      </Fragment>
                    ))}
                  </span>
                  {!compact && <span className={styles.frag}>#{fragment}</span>}
                </span>
              );
            })}
          </dd>
        </div>
        {!compact && (
          <div className={styles.row}>
            <dt>reviewed_by</dt>
            <dd>maintainer</dd>
          </div>
        )}
        {!compact && (
          <div className={`${styles.row} ${freshStamp ? styles.fresh : ""}`}>
            <dt>reviewed_at</dt>
            <dd>{reviewedAt}</dd>
          </div>
        )}
      </dl>
      )}
      <div className={styles.claim}>
        <p className={fixed ? styles.struck : styles.current} data-a={fixed ? undefined : `${anchor}-claim`}>
          {claim}
        </p>
        {fixed && (
          <p className={`${styles.current} ${styles.inserted}`} data-a={`${anchor}-claim`}>
            {fixed}
          </p>
        )}
      </div>
    </article>
  );
}

type CodeProps = {
  file: FileId;
  t: CardText;
  /** unchanged: the cited line as approved; changed: old line struck, new line added. */
  state: "unchanged" | "changed";
  anchor: string;
  /** Show only the cited line (dense maps). */
  compact?: boolean;
  selected?: boolean;
  className?: string;
};

export function CodeCard({ file, t, state, anchor, compact = false, selected = false, className = "" }: CodeProps) {
  const src = SOURCES[file];
  const changed = state === "changed";
  return (
    <article className={`${styles.code} ${changed ? styles.codeChanged : ""} ${selected ? styles.selected : ""} ${className}`} data-file={file} data-state={state}>
      <header className={styles.codeHead}>
        <p className={styles.path}>
          <strong>{FILES[file].path}</strong>
        </p>
        <span className={`${styles.chip} ${changed ? styles.flagged : styles.quiet}`}>{changed ? t.changed : t.unchanged}</span>
      </header>
      <ol className={styles.lines}>
        {!compact && (
          <li>
            <span className={styles.ln}>1</span>
            <code>{src.head}</code>
          </li>
        )}
        <li className={changed ? styles.removed : undefined} data-a={changed ? `${anchor}-old` : `${anchor}-line`}>
          <span className={styles.ln}>{changed ? "−" : "2"}</span>
          <code>{src.before}</code>
        </li>
        {changed && (
          <li className={styles.added} data-a={`${anchor}-line`}>
            <span className={styles.ln}>+</span>
            <code>{src.after}</code>
          </li>
        )}
        {!compact && (
          <li>
            <span className={styles.ln}>3</span>
            <code>{src.tail}</code>
          </li>
        )}
      </ol>
    </article>
  );
}
