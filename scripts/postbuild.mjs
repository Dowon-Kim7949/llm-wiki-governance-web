// Writes the two pages that live outside the locale routes:
//   out/index.html  sends "/" to the Korean page (the default locale)
//   out/404.html    the not-found page GitHub Pages serves for unknown paths
// Both are plain HTML so they work without the Next.js runtime. Next.js's own
// 404 cannot be used: the root layout sits under [lang], so there is no layout
// to render a language-neutral 404 with (global-not-found is still experimental).
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const out = join(process.cwd(), "out");
if (!existsSync(out)) throw new Error("out/ is missing; run next build first");

const base = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

const style = `
:root{--paper:#e8ebe6;--ink:#17232b;--soft:#46555c;--rule:#9aa6a3;--focus:#0b57d0;color-scheme:light}
@media (prefers-color-scheme:dark){:root{--paper:#121a1f;--ink:#e5ebe7;--soft:#a9b6b3;--rule:#5f6f6d;--focus:#8ab4ff;color-scheme:dark}}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--paper);color:var(--ink);
font-family:system-ui,"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif;line-height:1.6;padding:1rem}
main{max-width:34rem;width:100%;border:2px solid var(--ink);border-radius:10px;padding:2rem 1.5rem}
h1{margin:0 0 .75rem;font-size:1.6rem;line-height:1.2}
p{margin:.4rem 0;color:var(--soft)}
ul{list-style:none;margin:1.5rem 0 0;padding:0;display:flex;flex-wrap:wrap;gap:.75rem}
a{display:inline-flex;align-items:center;min-height:48px;padding:.6rem 1.2rem;border:2px solid var(--ink);border-radius:3px;color:var(--ink);font-weight:650;text-decoration:none}
a:hover{text-decoration:underline}
:focus-visible{outline:3px solid var(--focus);outline-offset:3px}
svg{width:2.25rem;height:2.25rem;margin-bottom:1rem}
`.trim();

const mark = `<svg viewBox="0 0 28 28" aria-hidden="true"><path d="M4 22 14 5l10 17z" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/><circle cx="14" cy="16" r="3" fill="currentColor"/></svg>`;

const page = ({ lang, title, head = "", body }) => `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="icon" href="${base}/icon.svg" type="image/svg+xml">
${head}
<style>${style}</style>
</head>
<body>
<main>
${mark}
${body}
</main>
</body>
</html>
`;

writeFileSync(
  join(out, "index.html"),
  page({
    lang: "ko",
    title: "LLM-WIKI Governance",
    head: `<meta http-equiv="refresh" content="0; url=${base}/ko/">
<link rel="canonical" href="${site}/ko/">
<link rel="alternate" hreflang="ko" href="${site}/ko/">
<link rel="alternate" hreflang="en" href="${site}/en/">
<link rel="alternate" hreflang="x-default" href="${site}/ko/">
<meta name="robots" content="noindex, follow">`,
    body: `<h1>LLM-WIKI Governance</h1>
<p>한국어 페이지로 이동합니다.</p>
<p lang="en">Taking you to the Korean page. The English page is linked below.</p>
<ul><li><a href="${base}/ko/" hreflang="ko">한국어</a></li><li><a href="${base}/en/" hreflang="en" lang="en">English</a></li></ul>`,
  }),
);

writeFileSync(
  join(out, "404.html"),
  page({
    lang: "ko",
    title: "페이지를 찾을 수 없습니다 / Page not found · LLM-WIKI Governance",
    head: `<meta name="robots" content="noindex">`,
    body: `<h1>이 주소에는 페이지가 없습니다</h1>
<p>주소를 확인하거나 아래에서 언어를 골라 첫 페이지로 가세요.</p>
<h2 lang="en" style="margin:1.5rem 0 .5rem;font-size:1.3rem;line-height:1.2">There is no page at this address</h2>
<p lang="en">Check the address, or pick a language below to go to the home page.</p>
<ul><li><a href="${base}/ko/" hreflang="ko">한국어 첫 페이지</a></li><li><a href="${base}/en/" hreflang="en" lang="en">English home page</a></li></ul>`,
  }),
);

console.log(`postbuild: wrote out/index.html and out/404.html (base path "${base || "/"}")`);
