"""Cut the Korean display font down to the glyphs the h1/h2 lines use.

    python scripts/subset-display-ko.py path/to/IBMPlexSansKR-Bold.ttf

Source: IBM Plex Sans KR Bold, SIL Open Font License 1.1
(https://github.com/google/fonts/tree/main/ofl/ibmplexsanskr). "Plex" is a
Reserved Font Name, so the subset is a Modified Version and is renamed.
Needs fonttools and brotli (pip install fonttools brotli). Writes
public/fonts/display-ko-bold.woff2, and src/fonts/display-ko-bold.chars.txt
with the Hangul it contains (checked by tests/unit/display-font.test.ts).
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]
FONT = ROOT / "public" / "fonts" / "display-ko-bold.woff2"
CHARS = ROOT / "src" / "fonts" / "display-ko-bold.chars.txt"
FAMILY = "LLM-WIKI Display KR"

# The dictionary is the source of truth; ask src/lib/display-font.ts for the lines.
PRINT_HANGUL = (
    "import { ko } from './src/content/ko.ts';"
    "import { displayHeadings, hangulIn } from './src/lib/display-font.ts';"
    "process.stdout.write(hangulIn(displayHeadings(ko)).join(''));"
)


def main(source: str) -> None:
    hangul = subprocess.run(
        ["node", "--experimental-strip-types", "--no-warnings", "--input-type=module", "-e", PRINT_HANGUL],
        cwd=ROOT, check=True, capture_output=True, encoding="utf-8",
    ).stdout
    font = TTFont(source)
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["kern", "liga", "ccmp", "locl"]
    options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]  # keep copyright and licence
    subsetter = subset.Subsetter(options)
    subsetter.populate(text=hangul + " ")
    subsetter.subset(font)

    name = font["name"]
    for record in list(name.names):
        if record.nameID in (1, 16):
            name.setName(FAMILY, record.nameID, record.platformID, record.platEncID, record.langID)
        elif record.nameID in (3, 4):
            name.setName(f"{FAMILY} Bold", record.nameID, record.platformID, record.platEncID, record.langID)
        elif record.nameID == 6:
            name.setName("LLM-WIKIDisplayKR-Bold", record.nameID, record.platformID, record.platEncID, record.langID)

    FONT.parent.mkdir(exist_ok=True)
    font.save(FONT)
    CHARS.write_text(hangul + "\n", encoding="utf-8")
    size = FONT.stat().st_size
    print(f"{len(hangul)} Hangul glyphs, {size} bytes")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
