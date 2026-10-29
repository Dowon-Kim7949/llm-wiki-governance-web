// The hero drawing. Static SVG rendered on the server: one doc station tied by
// survey lines to two source benchmarks, one of which has moved.
export function HeroPlot({ label, note, doc, srcA, srcB }: { label: string; note: string; doc: string; srcA: string; srcB: string }) {
  return (
    <figure className="hero-plot">
      <svg viewBox="0 0 560 400" role="img" aria-labelledby="hero-plot-title hero-plot-desc">
        <title id="hero-plot-title">{label}</title>
        <desc id="hero-plot-desc">{note}</desc>
        <defs>
          <pattern id="plot-grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M28 0H0V28" fill="none" stroke="var(--rule)" strokeOpacity="0.28" strokeWidth="1" />
          </pattern>
        </defs>
        <rect x="0" y="0" width="560" height="400" fill="url(#plot-grid)" />

        {/* survey lines */}
        <line className="plot-line-held" x1="126" y1="312" x2="392" y2="214" />
        <line className="plot-line-moved" x1="126" y1="96" x2="392" y2="186" />
        {/* the benchmark's original position, before the change */}
        <circle cx="150" cy="120" r="7" fill="none" stroke="var(--flag)" strokeWidth="1.5" strokeDasharray="3 3" />
        <path d="M150 120 132 102" stroke="var(--flag)" strokeWidth="1.5" strokeDasharray="3 3" />

        {/* source benchmarks: square control points */}
        <g>
          <rect x="112" y="82" width="28" height="28" fill="var(--paper)" stroke="var(--flag)" strokeWidth="3" />
          <circle cx="126" cy="96" r="4" fill="var(--flag)" />
          <text x="112" y="66" className="plot-label">{srcA}</text>
        </g>
        <g>
          <rect x="112" y="298" width="28" height="28" fill="var(--paper)" stroke="var(--ink)" strokeWidth="3" />
          <circle cx="126" cy="312" r="4" fill="var(--ink)" />
          <text x="112" y="350" className="plot-label">{srcB}</text>
        </g>

        {/* the document station */}
        <g>
          <path d="M392 150h86l26 26v84H392z" fill="var(--paper-raised)" stroke="var(--ink)" strokeWidth="3" />
          <path d="M478 150v26h26" fill="none" stroke="var(--ink)" strokeWidth="3" />
          <path d="M410 194h70M410 210h56M410 226h66" stroke="var(--rule)" strokeWidth="3" />
          <path d="M448 120 460 141H436z" fill="var(--held)" />
          <text x="392" y="286" className="plot-label">{doc}</text>
          <text x="392" y="306" className="plot-sub">status: verified</text>
        </g>

        {/* the finding flag on the moved line */}
        <g className="plot-flag">
          <path d="M262 141V100" stroke="var(--flag)" strokeWidth="2.5" />
          <path d="M263 100h34l-9 9 9 9h-34z" fill="var(--flag)" />
          <text x="306" y="114" className="plot-sub plot-sub-flag">impact.source_changed</text>
        </g>
      </svg>
      <figcaption>{note}</figcaption>
    </figure>
  );
}
