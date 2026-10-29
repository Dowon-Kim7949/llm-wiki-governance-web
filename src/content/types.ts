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

/** One step of a scroll sequence: what the visitor reads while the drawing changes. */
export type Beat = {
  id: string;
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
    story: string;
    playground: string;
    start: string;
    limits: string;
    langLabel: string;
    otherLang: string;
    otherLangName: string;
  };
  /** Words drawn on the plates. File paths and frontmatter stay as the CLI writes them. */
  world: {
    claimInvoice: string;
    claimInvoiceFixed: string;
    claimShippingFree: string;
    claimShippingFee: string;
    flag: string;
  };
  opening: {
    title: string;
    lede: string;
    primary: string;
    secondary: string;
    scrollHint: string;
    beats: Beat[];
  };
  story: {
    heading: string;
    intro: string;
    /** "{n}" and "{total}" are replaced. */
    stepOf: string;
    beats: Beat[];
  };
  playground: {
    heading: string;
    intro: string;
    disclaimer: string;
    fileLabel: string;
    files: Record<FileId, { citedBy: string }>;
    /** "{docs}" is replaced by the doc names, or by `none`. */
    cites: string;
    none: string;
    and: string;
    changeLabel: string;
    commit: string;
    revert: string;
    modeLabel: string;
    modes: Record<Mode, { label: string; summary: string }>;
    idle: string;
    result: { off: string; clear: string; warn: string; fail: string };
    gate: { label: string; idle: string; pass: string; warn: string; fail: string };
    terminal: string;
    next: string;
  };
  review: {
    heading: string;
    intro: string;
    stepOf: string;
    beats: Beat[];
  };
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
