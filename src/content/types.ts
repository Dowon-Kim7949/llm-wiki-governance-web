export type Mode = "lite" | "standard" | "strict";

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

export type DemoStep = {
  id: string;
  title: string;
  /** What happened at this station, in one or two sentences. */
  body: string;
  /** The honest caveat for this station. */
  caveat: string;
};

export type Dictionary = {
  meta: { title: string; description: string; ogAlt: string };
  nav: {
    skip: string;
    label: string;
    workflow: string;
    demo: string;
    start: string;
    limits: string;
    langLabel: string;
    otherLang: string;
    otherLangName: string;
  };
  hero: {
    title: string;
    lede: string;
    primary: string;
    secondary: string;
    facts: string[];
    plotLabel: string;
    plotDoc: string;
    plotSrcA: string;
    plotSrcB: string;
    plotNote: string;
  };
  problem: { heading: string; intro: string; points: { title: string; body: string }[] };
  workflow: {
    heading: string;
    intro: string;
    steps: { name: string; title: string; body: string; cmd?: string }[];
  };
  demo: {
    heading: string;
    intro: string;
    disclaimer: string;
    controlsLabel: string;
    prev: string;
    next: string;
    /** "{n}" and "{total}" are replaced; must stay serializable for the client demo. */
    stepOf: string;
    modeLabel: string;
    modeHint: string;
    modes: Record<Mode, { label: string; summary: string }>;
    status: { title: string; none: string; needs: string; verified: string; flagged: string; unchecked: string };
    fileSource: string;
    fileDoc: string;
    terminal: string;
    steps: DemoStep[];
    textHeading: string;
    textIntro: string;
    legend: { citation: string; unchanged: string; changed: string };
    finding: Record<Mode, string>;
    sentenceBefore: string;
    sentenceAfter: string;
  };
  start: {
    heading: string;
    intro: string;
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
    note: string;
  };
};
