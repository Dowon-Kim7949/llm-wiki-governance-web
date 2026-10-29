import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import { notFound } from "next/navigation";
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

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e8ebe6" },
    { media: "(prefers-color-scheme: dark)", color: "#121a1f" },
  ],
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
  return (
    <html lang={lang} className={archivo.variable}>
      <body>{children}</body>
    </html>
  );
}
