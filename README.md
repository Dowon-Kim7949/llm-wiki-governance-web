# llm-wiki-governance-web

The official website for [LLM-WIKI Governance](https://github.com/Dowon-Kim7949/llm-wiki-governance), an open-source CLI that adds review states, source citations and change checks to the project docs AI coding agents write and read.

[한국어](README.ko.md)

- Live site: https://dowon-kim7949.github.io/llm-wiki-governance-web/
- Product facts are pinned to **v1.42.0** (commit `7bb943f`). See [docs/PRODUCT_CLAIMS.md](docs/PRODUCT_CLAIMS.md).
- This repository contains only the website. The CLI lives in [Dowon-Kim7949/llm-wiki-governance](https://github.com/Dowon-Kim7949/llm-wiki-governance).

## Stack

Next.js 16 (App Router, static export) · React 19 · TypeScript · plain CSS with CSS Modules · GitHub Pages via GitHub Actions. No backend, no database, no tracking.

## Develop

```bash
npm ci
npm run dev          # http://localhost:3000/ko/
npm run lint && npm run typecheck && npm test
npm run build        # writes out/
```

Browser tests (Python 3.10+):

```bash
pip install playwright==1.56.0 && python -m playwright install chromium
npm run build && npm run serve &      # http://localhost:4173/
SITE_URL=http://localhost:4173 python tests/e2e/run_e2e.py
```

## Layout

```
src/app/[lang]/     locale root layout + the page (ko, en)
src/components/     Experience (current page, motion and interaction), CopyButton, LangSwitch; legacy scenes/ and figure/ retained
src/lib/            demo.ts (the demo repository: files, docs, citations), playground.ts (impact model), gsap.ts
src/content/        ko.ts, en.ts (typed dictionaries), transcripts.ts (real CLI output, quoted line for line)
scripts/            postbuild (/ and 404), static server, OG image renderer, CLI captures (capture-demo.sh, capture-playground.sh)
docs/evidence/      raw v1.42.0 output the site quotes
tests/unit/         content parity, claim checks, quoted output and the playground model against the evidence
tests/e2e/          Playwright browser suite
docs/               design, product claims, testing, deployment
```

## Docs

- [Current redesign](docs/REDESIGN_2026-10-30.md): timestamped reference analysis, creative decisions, asset prompt and verification
- [Earlier design](docs/DESIGN.md): historical brief and directions
- [Product claims](docs/PRODUCT_CLAIMS.md): every factual claim and how it was verified
- [Testing and accessibility](docs/TESTING.md)
- [Deployment](docs/DEPLOYMENT.md)

## Licence

Website code: MIT ([LICENSE](LICENSE)). The current page uses Archivo (SIL Open Font License 1.1), self-hosted at build time by `next/font`, and system Korean fonts. The previous IBM Plex Sans KR subset is retained as a legacy asset. The main sculpture is an original generated bitmap; interface icons are SVG. See [docs/THIRD_PARTY.md](docs/THIRD_PARTY.md).
