# Third-party material

| Item | Licence | How it is used |
| --- | --- | --- |
| Archivo (Omnibus-Type) | SIL Open Font License 1.1 | Downloaded from Google Fonts at build time by `next/font/google` and served from this site |
| Next.js, React, React DOM | MIT | Runtime framework |
| axe-core | MPL-2.0 | Dev dependency, injected into pages only during tests |
| Playwright (Python) | Apache-2.0 | Test tool, not part of the site |

All illustrations, icons and the Open Graph cards are original SVG/HTML drawn in this repository. No stock images, no third-party icon sets.

`node scripts/licenses.mjs` lists the licence of every installed production dependency. On 2026-10-29 it reported MIT, ISC, Apache-2.0, BSD-3-Clause and 0BSD, plus three build-time packages outside that list:

- `@img/sharp-*` (Apache-2.0 and LGPL-3.0-or-later): an optional Next.js dependency for image optimisation. This site sets `images.unoptimized`, so it never runs, and nothing from it is in `out/`.
- `caniuse-lite` (CC-BY-4.0): browser support data read at build time. Not shipped in `out/`.

The published site (`out/`) contains only this repository's code, Next.js/React runtime code (MIT) and the Archivo font files (OFL-1.1).
