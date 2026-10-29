// Station markers borrowed from survey drawings. Each state has its own shape
// so the state is readable without colour; callers always add a text label.
export type MarkerKind = "none" | "pending" | "held" | "flag" | "off";

/** The shapes alone, in a 16×16 box, for embedding inside another SVG. */
export function MarkerShapes({ kind }: { kind: MarkerKind }) {
  return (
    <>
      {kind === "none" && <circle cx="8" cy="8" r="5.5" fill="none" stroke="var(--rule)" strokeWidth="1.5" strokeDasharray="2 2" />}
      {kind === "pending" && <circle cx="8" cy="8" r="5.5" fill="none" stroke="var(--pending)" strokeWidth="2.2" />}
      {kind === "held" && <path d="M8 1.5 15 14.5H1z" fill="var(--held)" />}
      {kind === "off" && (
        <>
          <path d="M8 3.5 13.2 13H2.8z" fill="var(--held)" />
          <path d="M1 1 15 15" stroke="var(--ink-soft)" strokeWidth="1.6" />
        </>
      )}
      {kind === "flag" && (
        <>
          <path d="M3 1v14" stroke="var(--flag)" strokeWidth="2" />
          <path d="M4 1.5h10l-3 3.5 3 3.5H4z" fill="var(--flag)" />
        </>
      )}
    </>
  );
}

export function Marker({ kind, className = "marker" }: { kind: MarkerKind; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <MarkerShapes kind={kind} />
    </svg>
  );
}
