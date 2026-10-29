import type { MetadataRoute } from "next";
import { LOCALES, pageUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return LOCALES.map((locale) => ({
    url: pageUrl(locale),
    changeFrequency: "monthly",
    priority: locale === "ko" ? 1 : 0.9,
    alternates: { languages: { ko: pageUrl("ko"), en: pageUrl("en") } },
  }));
}
