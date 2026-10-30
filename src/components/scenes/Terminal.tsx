import type { Excerpt } from "@/content/transcripts";
import styles from "./Terminal.module.css";

/** Real CLI output, excerpted (see src/content/transcripts.ts). Lines wrap, so it never scrolls inside the page. */
export function Terminal({ label = "", runs, className = "" }: { label?: string; runs: Excerpt[]; className?: string }) {
  return (
    <figure className={`${styles.terminal} ${className}`}>
      {label && <figcaption className={styles.label}>{label}</figcaption>}
      <pre className={styles.out}>
        <code>
          {runs.map((run, i) => (
            <span key={`${run.source}-${i}`} className={styles.run}>
              <span className={styles.cmd}>{`$ ${run.cmd}`}</span>
              {"\n"}
              {run.lines.map((line, j) => (
                <span key={j} className={lineClass(line)}>
                  {line}
                  {"\n"}
                </span>
              ))}
              {run.exit !== null && <span className={run.exit ? styles.exitFail : styles.exit}>{`(exit ${run.exit})\n`}</span>}
            </span>
          ))}
        </code>
      </pre>
    </figure>
  );
}

function lineClass(line: string) {
  if (line.startsWith("- [error]") || line === "- result: fail") return styles.bad;
  if (line.startsWith("- [warning]") || line === "- result: warning") return styles.warn;
  if (line.startsWith("##")) return styles.head;
  return undefined;
}
