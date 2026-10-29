import type { Locale } from "@/lib/site";
import type { Dictionary } from "./types";
import { en } from "./en";
import { ko } from "./ko";

const dictionaries: Record<Locale, Dictionary> = { ko, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
