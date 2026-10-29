# Deployment

## Architecture

- Next.js 16 App Router, React 19, TypeScript, `output: "export"`: every page is pre-rendered HTML at build time. There is no server, no runtime API, no database, no authentication.
- Client JavaScript is limited to the demo, the copy buttons and the language switch.
- Locales are routes: `/ko/` and `/en/`. The root layout lives at `app/[lang]/layout.tsx` so each page carries the right `<html lang>`.
- `/` and the 404 page are plain HTML written by `scripts/postbuild.mjs`, because with the root layout under `[lang]` Next.js has no language-neutral layout to render them with (`global-not-found` is still experimental in Next.js 16.4).

## Hosting: GitHub Pages

Cloudflare Pages was the preferred host, but no Cloudflare account was connected in the build environment, and connecting one requires the owner to log in. GitHub Pages was used because the repository owner's existing GitHub access covers it and it costs nothing for a public repository.

`.github/workflows/pages.yml`:

1. On every pull request and push: `npm ci`, lint, typecheck, unit tests, `actions/configure-pages` (reads the Pages URL), static build with `NEXT_PUBLIC_BASE_PATH` and `NEXT_PUBLIC_SITE_URL` taken from it, browser tests against the build served locally, screenshots uploaded as an artifact.
2. On push to `main` only: `actions/deploy-pages` publishes `out/`, then the browser suite runs again against the live URL.

Pages must be set to "GitHub Actions" as its source (Settings → Pages), once.

### Preview deployments

GitHub Pages has a single environment per repository, so pull requests do not get a preview URL. Each PR build is still fully tested and its screenshots are downloadable from the run. Moving to Cloudflare Pages later would add per-PR previews; the build output (`out/`) and command (`npm run build`) stay the same.

## Base path

The site is served at `https://<owner>.github.io/llm-wiki-governance-web/`. `next.config.ts` reads `NEXT_PUBLIC_BASE_PATH` (empty for local development). Links to files in `public/` go through `asset()` in `src/lib/site.ts`.

## Local preview of the production build

```bash
NEXT_PUBLIC_BASE_PATH=/llm-wiki-governance-web \
NEXT_PUBLIC_SITE_URL=http://localhost:4173/llm-wiki-governance-web \
npm run build
NEXT_PUBLIC_BASE_PATH=/llm-wiki-governance-web npm run serve
# http://localhost:4173/llm-wiki-governance-web/
```

## Rollback

Every deploy is a commit on `main`. To roll back, revert the commit and push (the workflow redeploys), or re-run the "Build, test, deploy" workflow for an earlier commit from the Actions tab.

## Known platform caveat

Building on Windows with Next.js 16.4.3 writes per-segment prefetch files into nested folders (`__next.$d$lang/__PAGE__.txt`) while the client requests flat names (`__next.$d$lang.__PAGE__.txt`). The site no longer prefetches any route, so this has no effect, and production builds run on Linux.
