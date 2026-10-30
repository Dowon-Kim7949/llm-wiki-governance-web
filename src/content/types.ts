export type Mode = "lite" | "standard" | "strict";
/** Source files in the demo repository (scripts/capture-playground.sh). */
export type FileId = "invoice" | "shipping" | "format";
/** Approved docs in the demo repository. */
export type DocId = "billing" | "shipping";

export type CommandEntry = {
  id: string;
  cmd: string;
  /** Whether running it changes files in the repository. */
  writes: boolean;
  /** Whether it needs `npm install -D llm-wiki-governance` first. */
  needsInstall: boolean;
  title: string;
  effect: string;
};

/** One step of the review example. */
export type Step = {
  id: string;
  label: string;
  title: string;
  body: string;
  /** The honest caveat for this step, when there is one. */
  note?: string;
};

export type Dictionary = {
  meta: { title: string; description: string; ogAlt: string };
  nav: {
    skip: string;
    label: string;
    how: string;
    playground: string;
    start: string;
    limits: string;
    langLabel: string;
    otherLang: string;
    otherLangName: string;
  };
  /** Words inside the doc and code cards. File paths and frontmatter stay as the CLI writes them. */
  cards: {
    claimInvoice: string;
    claimInvoiceFixed: string;
    claimShippingFree: string;
    claimShippingFee: string;
    flagged: string;
    unaffected: string;
    unchecked: string;
    changed: string;
    unchanged: string;
    evidence: string;
  };
  hero: {
    title: string;
    lede: string;
    primary: string;
    secondary: string;
    replay: string;
    /** What the figure shows, by phase: aligned, code changed, doc flagged. */
    captions: [string, string, string];
  };
  drift: {
    heading: string;
    lede: string;
    codeLane: string;
    docLane: string;
    reviewed: string;
    commits: { date: string; file: string; message: string; cited?: boolean }[];
    stale: string;
    agent: string;
    resolve: string;
  };
  anatomy: {
    heading: string;
    lede: string;
    parts: { field: string; title: string; body: string }[];
  };
  playground: {
    heading: string;
    lede: string;
    disclaimer: string;
    fileLabel: string;
    resetNote: string;
    switched: string;
    files: Record<FileId, { citedBy: string; change: string }>;
    apply: string;
    undo: string;
    modeLabel: string;
    modes: Record<Mode, { label: string; summary: string }>;
    result: {
      heading: string;
      changed: string;
      affected: string;
      ci: string;
      why: string;
      next: string;
      idle: string;
      none: string;
    };
    ci: { idle: string; pass: string; off: string; warn: string; fail: string };
    why: { idle: string; lite: string; standard: string; strict: string; none: string };
    next: { idle: string; review: string; example: string; lite: string; liteAction: string; none: string };
    terminal: string;
    and: string;
  };
  review: {
    heading: string;
    lede: string;
    stepOf: string;
    prev: string;
    next: string;
    commands: string;
    steps: Step[];
  };
  finale: { line: string };
  start: {
    heading: string;
    intro: string;
    previewTitle: string;
    previewNote: string;
    /** Command ids from `commands`, in the order a newcomer runs them after the preview. */
    steps: string[];
    facts: string[];
    allCommands: string;
    writes: string;
    readOnly: string;
    noInstall: string;
    afterInstall: string;
    copy: string;
    copied: string;
    copyFailed: string;
    commands: CommandEntry[];
    warning: string;
  };
  limits: { heading: string; intro: string; items: { title: string; body: string }[] };
  open: {
    heading: string;
    body: string;
    links: { repo: string; docs: string; issues: string; discussions: string; npm: string };
  };
  footer: {
    label: string;
    product: string;
    version: string;
    baseline: string;
    license: string;
    site: string;
    siteValue: string;
    motion: string;
    motionValue: string;
    note: string;
  };
};
