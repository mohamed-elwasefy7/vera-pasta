# -*- coding: utf-8 -*-
"""
VERA PASTA — image pipeline.

Reads the source photo folder, slugifies filenames, and writes optimized
web assets. Idempotent: skips outputs newer than their source. Run again
whenever a photo is added or replaced in the source folder.

Outputs
  assets/images/dishes/{slug}.webp      1400px  q82
  assets/images/dishes/{slug}-sm.webp    750px  q82
  assets/images/dishes/{slug}.jpg       1400px  q85   (fallback)
  assets/images/dishes/{slug}-sm.jpg     750px  q85
  assets/images/dishes/{slug}.avif      (only if Pillow has AVIF support)
  assets/images/drinks/{slug}.webp       400px  q80  (+ .jpg fallback)
  assets/hero/hero.webp                 1600px  (+ hero-sm.webp 800px, hero.jpg)
"""
import sys
import unicodedata
from pathlib import Path

from PIL import Image, features

SRC = Path(r"C:\Users\Owner\Desktop\شغل كلود\المطاعم - التسويق\صور المنيو\فيرا باستا\منيو فيرا باساتا")
ROOT = Path(__file__).resolve().parent.parent
DISHES_OUT = ROOT / "assets" / "images" / "dishes"
DRINKS_OUT = ROOT / "assets" / "images" / "drinks"
HERO_OUT = ROOT / "assets" / "hero"

# source subfolder -> kind
KINDS = {"PASTA": "dish", "SALADS": "dish", "Vera BOX": "dish", "DRINKS": "drink"}
HERO_SOURCE = "pastanine-box"  # signature shot doubles as the hero image

AVIF = features.check("avif")
SUPPORTED = {".jpg", ".jpeg", ".png", ".webp", ".avif"}


def slugify(name: str) -> str:
    s = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    s = "".join(c if c.isalnum() else "-" for c in s.lower())
    while "--" in s:
        s = s.replace("--", "-")
    return s.strip("-")


def load_rgb(path: Path) -> Image.Image:
    im = Image.open(path)
    if im.mode in ("RGBA", "LA", "P"):
        # flatten any transparency onto brand Crema
        bg = Image.new("RGB", im.size, (245, 239, 224))
        im = im.convert("RGBA")
        bg.paste(im, mask=im.split()[-1])
        return bg
    return im.convert("RGB")


def save_variants(im: Image.Image, out_dir: Path, slug: str, sizes, jpeg=True, avif=False):
    out_dir.mkdir(parents=True, exist_ok=True)
    written = []
    for label, px in sizes:
        suffix = "" if label == "lg" else f"-{label}"
        w, h = im.size
        scale = min(1.0, px / max(w, h))
        variant = im.resize((round(w * scale), round(h * scale)), Image.LANCZOS) if scale < 1 else im
        webp = out_dir / f"{slug}{suffix}.webp"
        variant.save(webp, "WEBP", quality=82, method=6)
        written.append(webp)
        if jpeg:
            jpg = out_dir / f"{slug}{suffix}.jpg"
            variant.save(jpg, "JPEG", quality=85, optimize=True, progressive=True)
            written.append(jpg)
        if avif and AVIF:
            av = out_dir / f"{slug}{suffix}.avif"
            variant.save(av, "AVIF", quality=60)
            written.append(av)
    return written


def fresh(src: Path, out_dir: Path, slug: str) -> bool:
    probe = out_dir / f"{slug}.webp"
    return probe.exists() and probe.stat().st_mtime >= src.stat().st_mtime


def main():
    if not SRC.exists():
        sys.exit(f"Source folder not found: {SRC}")
    total, skipped = 0, 0
    hero_im = None
    for sub, kind in KINDS.items():
        folder = SRC / sub
        if not folder.exists():
            continue
        for f in sorted(folder.iterdir()):
            if f.suffix.lower() not in SUPPORTED:
                continue
            slug = slugify(f.stem)
            out_dir = DISHES_OUT if kind == "dish" else DRINKS_OUT
            if kind == "dish" and slug == HERO_SOURCE:
                hero_im = load_rgb(f)
            if fresh(f, out_dir, slug):
                skipped += 1
                continue
            im = load_rgb(f)
            if kind == "dish":
                files = save_variants(im, out_dir, slug, [("lg", 1400), ("sm", 750)], jpeg=True, avif=True)
            else:
                files = save_variants(im, out_dir, slug, [("lg", 400)], jpeg=True, avif=False)
            total += len(files)
            print(f"  {kind}: {f.name} -> {slug} ({len(files)} files)")
    if hero_im is not None and not fresh(SRC / "Vera BOX" / "PastaNine Box.png", HERO_OUT, "hero"):
        files = save_variants(hero_im, HERO_OUT, "hero", [("lg", 1600), ("sm", 800)], jpeg=True, avif=AVIF)
        total += len(files)
        print(f"  hero: PastaNine Box -> hero ({len(files)} files)")
    print(f"Done. {total} files written, {skipped} sources up to date. AVIF support: {AVIF}")


if __name__ == "__main__":
    main()
