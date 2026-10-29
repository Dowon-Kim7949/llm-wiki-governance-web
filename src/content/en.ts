import type { Dictionary } from "./types";

export const en: Dictionary = {
  meta: {
    title: "LLM-WIKI Governance: review states and source citations for AI-written docs",
    description:
      "An open-source CLI that adds review states, source citations, and change checks to the project docs your AI coding agent writes and reads. Zero runtime dependencies, MIT licensed.",
    ogAlt: "LLM-WIKI Governance. A drawing that connects a document to the sources it cites and marks the one that changed",
  },
  nav: {
    skip: "Skip to content",
    label: "Main",
    workflow: "How it works",
    demo: "Demo",
    start: "Get started",
    limits: "Limits",
    langLabel: "Language",
    otherLang: "ko",
    otherLangName: "한국어",
  },
  hero: {
    title: "What each doc cites, who approved it, and when its source changed.",
    lede:
      "LLM-WIKI Governance is a CLI that holds the project docs your AI coding agent writes and reads to the same discipline as code. Agent-written docs stay in review until someone approves them, every doc cites the files it describes, and when a cited file changes, the doc is flagged for another look.",
    primary: "Get started",
    secondary: "View on GitHub",
    facts: ["v1.42.0", "MIT license", "Node.js 18.18 or later", "Zero runtime dependencies"],
    plotLabel: "Drawing: one document and the two sources it cites",
    plotDoc: "billing.md",
    plotSrcA: "src/invoice.js",
    plotSrcB: "src/tax.js",
    plotNote:
      "billing.md cites two sources. src/invoice.js changed, so that citation is marked for re-review. The citation of src/tax.js is unaffected.",
  },
  problem: {
    heading: "Docs change later than code",
    intro:
      "Coding agents are good at writing project docs and bad at noticing when those docs stop being true. On the next task, they read those same docs as ground truth.",
    points: [
      {
        title: "Code gets checked. Docs do not.",
        body: "Code changes go through review and tests. The docs that describe that code go stale without anyone looking.",
      },
      {
        title: "Agents trust stale docs",
        body: "An agent that reads a wrong doc edits code on a wrong premise. The longer and more plausible the doc, the harder that is to notice.",
      },
      {
        title: "Drafts and checked docs look the same",
        body: "From the outside you cannot tell a draft an agent just wrote from a doc someone compared against the code.",
      },
    ],
  },
  workflow: {
    heading: "How it works",
    intro: "Docs are plain Markdown files under docs/llm-wiki/. Each doc records its state and its evidence in frontmatter.",
    steps: [
      {
        name: "Scaffold",
        title: "Create the skeleton",
        body: "quickstart detects the project and creates the doc skeleton. Every new doc starts as needs_review.",
        cmd: "quickstart --write",
      },
      {
        name: "Enrich",
        title: "Fill it from real code",
        body: "An agent or a person reads the code and writes the content. Each doc lists its evidence in source_files and evidence, for example src/api.ts#symbol:getUser.",
      },
      {
        name: "Review",
        title: "Read it, then approve it",
        body: "review --approve is the only command that promotes a doc to verified. It refuses docs that still have blocking findings.",
        cmd: "review --approve <path>",
      },
      {
        name: "Watch",
        title: "Look again when the evidence moves",
        body: "When a cited source changes, impact and drift point at the doc. They are off in lite, the default for new projects; standard reports a warning and strict fails the build.",
        cmd: "impact --since <ref>",
      },
    ],
  },
  demo: {
    heading: "Follow one citation through a change",
    intro:
      "Seven steps: a source file and the doc that describes it are approved, the source changes, and the doc is reviewed again. At step 6, switch the governance mode to see how the same change is reported.",
    disclaimer:
      "This is an illustrative simulation. It is not connected to your repository. The command output is excerpted from running v1.42.0 for real.",
    controlsLabel: "Demo steps",
    prev: "Previous step",
    next: "Next step",
    stepOf: "Step {n} of {total}",
    modeLabel: "Governance mode",
    modeHint: "The mode affects the result from step 6 on.",
    modes: {
      lite: { label: "lite", summary: "The default for new projects. Change checks are off, so no document is checked and the run passes." },
      standard: { label: "standard", summary: "Reports verified docs that cite a changed source as a warning. The build passes." },
      strict: { label: "strict", summary: "Reports the same doc as an error and fails the build (exit 1)." },
    },
    status: {
      title: "Doc state",
      none: "No doc yet",
      needs: "Awaiting review (needs_review)",
      verified: "Approved (verified)",
      flagged: "Approved, flagged for re-review (finding)",
      unchecked: "Approved, change checks off",
    },
    fileSource: "Source",
    fileDoc: "Doc",
    terminal: "Terminal",
    steps: [
      {
        id: "source",
        title: "A source file exists",
        body: "computeTotal(items) in src/invoice.js returns the sum of each item's price.",
        caveat: "The file is hypothetical, made up for this example.",
      },
      {
        id: "cite",
        title: "A doc cites that source",
        body: "While writing docs/llm-wiki/domains/billing.md, the agent lists src/invoice.js#symbol:computeTotal under evidence.",
        caveat: "validate only checks that the citation resolves: the file exists and mentions the symbol. It does not check that the sentence is right.",
      },
      {
        id: "draft",
        title: "An agent's draft waits for review",
        body: "A doc the agent wrote stays at status: needs_review. review lists the backlog by risk and changes nothing.",
        caveat: "Docs with blocking findings cannot be approved. In a real run, a doc missing the required contains_sensitive_info field was refused.",
      },
      {
        id: "approve",
        title: "A person reads it and approves it",
        body: "review --approve records status: verified, reviewed_by, and reviewed_at. No other command promotes a doc.",
        caveat: "reviewed_by records the name given at approval time. It does not prove who that was. Branch protection decides who can merge.",
      },
      {
        id: "change",
        title: "The cited source changes",
        body: "computeTotal now multiplies by quantity. The doc is unchanged.",
        caveat: "The doc's sentence is no longer true, and nothing in the files says so.",
      },
      {
        id: "check",
        title: "The mode decides what gets reported",
        body: "impact --since <ref> finds verified docs that cite a source changed in the diff while the doc itself did not change. Switch the mode above.",
        caveat: "Change detection is mostly file-level. It tells you a file changed, not which sentence in the doc is now wrong.",
      },
      {
        id: "rereview",
        title: "Reread, fix, approve again",
        body: "A person rereads the source and the doc and fixes the wrong sentence. Approving a doc that is still verified is refused as \"already verified\", so its status goes back to needs_review and review --approve stamps it again. Because the doc changed in the same change, impact passes even under strict.",
        caveat: "In lite, nothing announces this moment. If you want the signal, turn checks on with mode set standard --write.",
      },
    ],
    textHeading: "Read the demo as text",
    textIntro: "The same content as the visualization above.",
    legend: { citation: "Citation", unchanged: "Unchanged source", changed: "Changed source" },
    finding: {
      lite: "impact.source_changed: off (governance mode lite or config) — no document was checked",
      standard:
        "[warning] impact.source_changed docs/llm-wiki/domains/billing.md: Verified document depends on src/invoice.js, which changed in this diff, but the document is unchanged; re-review and update it or downgrade to needs_review.",
      strict:
        "[error] impact.source_changed docs/llm-wiki/domains/billing.md: Verified document depends on src/invoice.js, which changed in this diff, but the document is unchanged; re-review and update it or downgrade to needs_review.\nexit code 1",
    },
    sentenceBefore: "computeTotal(items) returns the sum of each item's price.",
    sentenceAfter: "computeTotal(items) returns the sum of each item's price × qty.",
  },
  start: {
    heading: "Get started",
    intro:
      "Start with a preview that writes nothing. Each command below says whether it changes files and whether it needs the package installed. Every command was run against v1.42.0.",
    writes: "Writes files",
    readOnly: "Read-only",
    noInstall: "No install needed",
    afterInstall: "After install",
    copy: "Copy",
    copied: "Copied",
    copyFailed: "Could not copy. Select the command and copy it yourself.",
    commands: [
      {
        id: "preview",
        cmd: "npx llm-wiki-governance@latest quickstart --dry-run",
        writes: false,
        needsInstall: false,
        title: "Preview what would be created",
        effect: "Prints the docs it would create and the next steps, then exits. It writes no files. The CLI's own help recommends @latest so npx does not reuse an old cached version.",
      },
      {
        id: "install",
        cmd: "npm install -D llm-wiki-governance",
        writes: true,
        needsInstall: false,
        title: "Install as a dev dependency",
        effect: "Changes package.json, the lockfile, and node_modules. After this, run it as npx llm-wiki.",
      },
      {
        id: "scaffold",
        cmd: "npx llm-wiki-governance quickstart --write --agent claude",
        writes: true,
        needsInstall: false,
        title: "Create the doc skeleton",
        effect: "Creates the docs/llm-wiki/ skeleton, llm-wiki.config.json set to lite, CLAUDE.md, and skill and prompt files for the agent. Using Codex? Pass --agent codex.",
      },
      {
        id: "validate",
        cmd: "npx llm-wiki validate",
        writes: false,
        needsInstall: true,
        title: "Check structure and citations",
        effect: "Checks frontmatter structure and that citations resolve. Writes nothing.",
      },
      {
        id: "review",
        cmd: "npx llm-wiki review",
        writes: false,
        needsInstall: true,
        title: "List the review backlog",
        effect: "Lists needs_review docs by risk and separates the ones you can approve from the ones blocked by findings.",
      },
      {
        id: "approve",
        cmd: "npx llm-wiki review --approve docs/llm-wiki/project-profile.md",
        writes: true,
        needsInstall: true,
        title: "Approve one doc you have read",
        effect: "Writes status: verified, reviewed_by, and reviewed_at into that doc's frontmatter. Use it only on docs you have actually checked.",
      },
      {
        id: "mode",
        cmd: "npx llm-wiki mode set standard --write",
        writes: true,
        needsInstall: true,
        title: "Turn change checks on",
        effect: "Changes only the mode in llm-wiki.config.json. It never creates, edits, promotes, or demotes a doc. From then on, impact and drift report warnings.",
      },
      {
        id: "impact",
        cmd: "npx llm-wiki impact --since origin/main",
        writes: false,
        needsInstall: true,
        title: "Find docs to re-review in a PR",
        effect: "Lists verified docs that cite a source changed since the base ref. In lite it checks nothing and passes.",
      },
    ],
    warning:
      "Do not run npx llm-wiki where the package is not installed: an unrelated npm package has that name. Before installing, always use npx llm-wiki-governance.",
  },
  limits: {
    heading: "What it does not prove",
    intro: "Passing the checks does not mean a doc is correct. These limits are stated in the v1.42.0 README itself.",
    items: [
      {
        title: "It does not check that the prose is true",
        body: "It checks that each citation resolves. Whether the sentence is correct is still the reviewer's call. A doc updated with the wrong number can pass.",
      },
      {
        title: "It cannot prove who approved",
        body: "reviewed_by is the name passed to the approve command. List agent names under agentReviewers and stats counts their approvals apart.",
      },
      {
        title: "It does not write your docs",
        body: "The CLI scaffolds, checks, and prints prompts. You or your agent write the content. In a small experiment recorded in the README (one external repository, one model, six tasks), a wiki that was never filled in did worse than no wiki at all.",
      },
      {
        title: "Change detection is mostly file-level",
        body: "Only line-range and Markdown-section citations are narrowed to the region. The date-based drift check can miss changes committed on the day of approval.",
      },
      {
        title: "Approving a plan is not approving an implementation",
        body: "Approving a requirement approves the plan. impact.plan_changed names files to re-check; it never shows that code satisfies a requirement.",
      },
      {
        title: "It is not semantic search or a hosted service",
        body: "Retrieval ranks keyword matches with BM25. There are no embeddings and no index service, and the CLI makes no network calls of its own.",
      },
    ],
  },
  open: {
    heading: "Open source",
    body: "A free tool released under the MIT license and maintained by an individual developer. Bug reports and questions are welcome on GitHub.",
    links: { repo: "Source repository", docs: "Documentation", issues: "Issues", discussions: "Discussions", npm: "npm package" },
  },
  footer: {
    label: "Drawing information",
    product: "Product",
    version: "Baseline version",
    baseline: "Baseline commit",
    license: "License",
    site: "This site",
    siteValue: "llm-wiki-governance-web, MIT",
    note: "This site is maintained separately from the product repository. The demo is an illustrative simulation and is not connected to any repository.",
  },
};
