"use client";

// A full page load on purpose: the other locale is a different document
// (<html lang>, metadata), not a client-side state change. The two pages share
// section ids, so the current hash is carried over to land on the equivalent
// section. Without JavaScript it is a plain link to the other locale's top.
export function LangSwitch({ href, hrefLang, label, name }: { href: string; hrefLang: string; label: string; name: string }) {
  return (
    <a
      href={href}
      hrefLang={hrefLang}
      lang={hrefLang}
      className="lang-switch"
      aria-label={`${label}: ${name}`}
      onClick={(event) => {
        const hash = window.location.hash;
        if (hash && /^#[a-z-]+$/.test(hash)) event.currentTarget.href = `${href}${hash}`;
      }}
    >
      {name}
    </a>
  );
}
