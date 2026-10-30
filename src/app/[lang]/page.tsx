import { notFound } from "next/navigation";
import { getDictionary } from "@/content";
import { Experience } from "@/components/Experience";
import { isLocale } from "@/lib/site";

export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <Experience lang={lang} t={getDictionary(lang)} />;
}
