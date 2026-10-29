import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import { notFound } from "next/navigation";
import { preload } from "react-dom";
import { getDictionary } from "@/content";
import { LOCALES, PRODUCT, SITE_URL, asset, isLocale, pageUrl } from "@/lib/site";
import "../globals.css";

// One variable family; the width axis does the display work (docs/DESIGN.md).
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
  variable: "--font-archivo",
});

// Korean h1/h2 lettering: a 52-glyph cut of IBM Plex Sans KR Bold
// (scripts/subset-display-ko.py). Declared here rather than with next/font so
// that only the Korean page preloads it; the Hangul unicode-range keeps the
// English page from requesting it at all.
const DISPLAY_KO = asset("/fonts/display-ko-bold.woff2");
const DISPLAY_KO_FACE = `@font-face{font-family:"LLM-WIKI Display KR";src:url(${DISPLAY_KO}) format("woff2");font-weight:700;font-display:swap;unicode-range:U+1100-11FF,U+3130-318F,U+AC00-D7A3}`;

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export const viewport: Viewport = {
  // The header is a night bar in every scene.
  themeColor: "#0f2536",
};

type Params = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getDictionary(lang);
  const og = `${SITE_URL}/og/og-${lang}.png`;
  return {
    metadataBase: new URL(`${SITE_URL}/`),
    title: t.meta.title,
    description: t.meta.description,
    applicationName: PRODUCT.name,
    alternates: {
      canonical: pageUrl(lang),
      languages: { ko: pageUrl("ko"), en: pageUrl("en"), "x-default": pageUrl("ko") },
    },
    openGraph: {
      type: "website",
      siteName: PRODUCT.name,
      title: t.meta.title,
      description: t.meta.description,
      url: pageUrl(lang),
      locale: lang === "ko" ? "ko_KR" : "en_US",
      alternateLocale: lang === "ko" ? ["en_US"] : ["ko_KR"],
      images: [{ url: og, width: 1200, height: 630, alt: t.meta.ogAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: t.meta.title,
      description: t.meta.description,
      images: [{ url: og, alt: t.meta.ogAlt }],
    },
    icons: { icon: [{ url: asset("/icon.svg"), type: "image/svg+xml" }] },
  };
}

export default async function LocaleLayout({ children, params }: Params & { children: React.ReactNode }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  if (lang === "ko") preload(DISPLAY_KO, { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  return (
    <html lang={lang} className={archivo.variable}>
      <head>
        <style>{DISPLAY_KO_FACE}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
