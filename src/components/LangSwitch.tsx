"use client";

import { useEffect, useState } from "react";

// A full page load on purpose: the other locale is a different document
// (<html lang>, metadata), not a client-side state change. The two pages share
// section ids, so the link follows the current hash and lands on the
// equivalent section. Before hydration (or without JavaScript) it is a plain
// link to the other locale's top.
export function LangSwitch({ href, hrefLang, label, name }: { href: string; hrefLang: string; label: string; name: string }) {
  const [target, setTarget] = useState(href);

  useEffect(() => {
    const sync = () => {
      const hash = window.location.hash;
      setTarget(hash && /^#[a-z-]+$/.test(hash) ? `${href}${hash}` : href);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [href]);

  return (
    <a href={target} hrefLang={hrefLang} lang={hrefLang} className="lang-switch" aria-label={`${label}: ${name}`}>
      {name}
    </a>
  );
}
