// Facts the whole site shares. Product facts are pinned to the v1.42.0 release
// (see docs/PRODUCT_CLAIMS.md for the evidence behind each one).

export const PRODUCT = {
  name: "LLM-WIKI Governance",
  version: "1.42.0",
  tag: "v1.42.0",
  baselineCommit: "7bb943f10c7ebd9ed4b1d5c3f6862a200ac1409e",
  license: "MIT",
  node: "18.18",
  npm: "https://www.npmjs.com/package/llm-wiki-governance",
  repo: "https://github.com/Dowon-Kim7949/llm-wiki-governance",
  issues: "https://github.com/Dowon-Kim7949/llm-wiki-governance/issues",
  discussions: "https://github.com/Dowon-Kim7949/llm-wiki-governance/discussions",
  docs: "https://github.com/Dowon-Kim7949/llm-wiki-governance/tree/v1.42.0/docs",
  readmeKo: "https://github.com/Dowon-Kim7949/llm-wiki-governance/blob/v1.42.0/README.ko.md",
  readmeEn: "https://github.com/Dowon-Kim7949/llm-wiki-governance/blob/v1.42.0/README.md",
  release: "https://github.com/Dowon-Kim7949/llm-wiki-governance/releases/tag/v1.42.0",
} as const;

export const SITE_REPO = "https://github.com/Dowon-Kim7949/llm-wiki-governance-web";

// The deploy workflow sets both from actions/configure-pages, so canonical and
// Open Graph URLs always name the origin the site is actually served from.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const LOCALES = ["ko", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ko";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** Absolute URL of a locale page, e.g. https://…/llm-wiki-governance-web/ko/ */
export function pageUrl(locale: Locale): string {
  return `${SITE_URL}/${locale}/`;
}

/** Path of a file in public/, prefixed with the base path for <img>/<a>. */
export function asset(path: string): string {
  return `${BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;
}
