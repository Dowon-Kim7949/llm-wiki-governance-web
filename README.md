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
src/components/     Demo, HeroPlot, CopyButton, LangSwitch, Marker
src/content/        ko.ts, en.ts (typed dictionaries), demo-transcript.ts (real CLI output)
scripts/            postbuild (/ and 404), static server, OG image renderer, demo capture
tests/unit/         content parity and claim checks
tests/e2e/          Playwright browser suite
docs/               design, product claims, testing, deployment
```

## Docs

- [Design](docs/DESIGN.md): brief, three directions, tokens, components
- [Product claims](docs/PRODUCT_CLAIMS.md): every factual claim and how it was verified
- [Testing and accessibility](docs/TESTING.md)
- [Deployment](docs/DEPLOYMENT.md)

## Licence

Website code: MIT ([LICENSE](LICENSE)). Fonts: Archivo, self-hosted at build time by `next/font`, and a Hangul subset of IBM Plex Sans KR Bold for Korean headings, renamed as the licence requires; both SIL Open Font License 1.1. All graphics are original SVG drawn in code. See [docs/THIRD_PARTY.md](docs/THIRD_PARTY.md).
