"""Re-tint the shells' demo pictures (public/demo/) from the walnut-and-wool palette to Mora (16 Oct 2026).

  python3 scripts/retint-demo.py [--out DIR]   # writes over public/demo/ unless --out is given

Four treatments, by what each picture is (brand/RUECA.md → Colour):
  - ink:     engravings inked onto transparency (luminance → alpha): every pixel takes Mora's ink, alpha kept.
  - plate:   engravings printed on yellowed parchment: the sepia goes to Mora's near-neutral paper and ink
             (OKLab lightness kept and stretched so the paper reads as Mora's paper, chroma replaced by Mora's tint).
  - balance: photographs with a warm cast: the neutrals are white-balanced toward Mora's tint; saturated colour
             (a wax seal, a brass bell) is left alone.
  - dye:     product shots on a backdrop in an old dye: pixels near the old dye's hue move to the Mora dye's hue
             and chroma, so the ink bottles and bells follow the new palette.
Needs numpy and Pillow. Run it once: running it again re-applies the shifts to already shifted pictures.
"""
import argparse
import os

import numpy as np
from PIL import Image

INK = (0x17, 0x16, 0x15)
TINT_C, TINT_H = 0.0024, np.deg2rad(45)  # Mora's paper tint, OKLCH
PAPER_L = 0.966  # Mora's paper #F5F3F2

# hue (degrees, OKLCH) of each dye in the old pictures, and the Mora target: hue, chroma multiplier and a lightness
# shift (a yellow or lime that stays mid-dark reads olive, so they lift; the raspberry deepens toward the plum)
DYES = {
    'achiote': (37, 38, 1.10, 0.0),
    'gualda': (78, 88, 1.20, 0.05),
    'cochinilla': (27, 2, 1.15, -0.10),  # coral → raspberry, the plum's bright
    'anil': (220, 268, 1.45, 0.0),       # pale blue → periwinkle (Cielo)
    'hoja': (165, 128, 1.60, 0.14),      # teal → lime
}

JOBS = {
    'ink': ['animate/*', 'gabinete/*', 'campana/bell.webp', 'campana/bell-plate.webp'],
    'plate': ['generate/plate-*'],
    'balance': ['agalla/still.webp', 'generate/desk-a.webp', 'generate/desk-b.webp', 'generate/desk-c.webp'],
    'dye:achiote': ['agalla/hero.webp', 'agalla/ink-achiote.webp', 'generate/ink-seal-*'],
    'dye:gualda': ['agalla/ink-gualda.webp', 'campana/bell-gualda.webp', 'generate/bell-saffron-*'],
    'dye:cochinilla': ['agalla/ink-cochinilla.webp'],
    'dye:anil': ['agalla/ink-anil.webp'],
    'dye:hoja': ['agalla/ink-hoja.webp'],
}


# ---- sRGB ↔ OKLab -------------------------------------------------------------------------------------------
def to_linear(c):
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def to_srgb(c):
    c = np.clip(c, 0, 1)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(c, 1 / 2.4) - 0.055)


def rgb_to_oklab(rgb):
    r, g, b = [to_linear(rgb[..., i]) for i in range(3)]
    l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
    m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
    s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b
    l, m, s = np.cbrt(l), np.cbrt(m), np.cbrt(s)
    return np.stack([0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
                     1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
                     0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s], -1)


def oklab_to_rgb(lab):
    L, a, b = lab[..., 0], lab[..., 1], lab[..., 2]
    l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
    m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
    s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3
    r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
    g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
    bb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
    return to_srgb(np.stack([r, g, bb], -1))


# ---- treatments ---------------------------------------------------------------------------------------------
def ink(px):
    px[..., :3] = INK
    return px


def plate(px):
    lab = rgb_to_oklab(px[..., :3] / 255)
    L = lab[..., 0]
    lo, hi = np.percentile(L, 1), np.percentile(L, 92)  # the darkest ink and the paper
    L = np.clip((L - lo) / max(hi - lo, 1e-6), 0, 1) * (PAPER_L - 0.16) + 0.16
    lab[..., 0] = np.minimum(L, PAPER_L + 0.02)
    lab[..., 1], lab[..., 2] = TINT_C * np.cos(TINT_H), TINT_C * np.sin(TINT_H)
    px[..., :3] = np.round(oklab_to_rgb(lab) * 255)
    return px


def balance(px):
    lab = rgb_to_oklab(px[..., :3] / 255)
    a, b = lab[..., 1], lab[..., 2]
    c = np.hypot(a, b)
    neutral = c < 0.06
    if neutral.any():
        da = a[neutral].mean() - TINT_C * np.cos(TINT_H)
        db = b[neutral].mean() - TINT_C * np.sin(TINT_H)
        w = np.clip(1 - c / 0.12, 0, 1)  # saturated colour keeps its own cast
        lab[..., 1] -= da * w * 0.85
        lab[..., 2] -= db * w * 0.85
    px[..., :3] = np.round(oklab_to_rgb(lab) * 255)
    return px


def dye(px, name):
    src, dst, cmul, dl = DYES[name]
    lab = rgb_to_oklab(px[..., :3] / 255)
    a, b = lab[..., 1], lab[..., 2]
    c, h = np.hypot(a, b), np.rad2deg(np.arctan2(b, a)) % 360
    dist = np.abs((h - src + 180) % 360 - 180)
    # full shift inside ±22° of the old dye, fading out by ±40°; greys and near-greys stay put
    w = np.clip((40 - dist) / 18, 0, 1) * np.clip((c - 0.02) / 0.04, 0, 1)
    rot = ((dst - src + 180) % 360 - 180) * w
    nh = np.deg2rad(h + rot)
    nc = c * (1 + (cmul - 1) * w)
    lab[..., 0] = lab[..., 0] + dl * w
    lab[..., 1], lab[..., 2] = nc * np.cos(nh), nc * np.sin(nh)
    rgb = oklab_to_rgb(lab)
    px[..., :3] = np.round(rgb * 255)
    return px


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default=None)
    args = ap.parse_args()
    root = 'public/demo'
    import glob
    for job, patterns in JOBS.items():
        for pat in patterns:
            for path in sorted(glob.glob(os.path.join(root, pat))):
                im = Image.open(path).convert('RGBA')
                px = np.asarray(im).astype(np.float64).copy()
                kind = job.split(':')
                px = ink(px) if kind[0] == 'ink' else plate(px) if kind[0] == 'plate' else balance(px) if kind[0] == 'balance' else dye(px, kind[1])
                out = Image.fromarray(np.clip(px, 0, 255).astype(np.uint8))
                if not Image.open(path).mode.endswith('A') and out.getextrema()[3][0] == 255:
                    out = out.convert('RGB')
                dest = os.path.join(args.out, os.path.relpath(path, root)) if args.out else path
                os.makedirs(os.path.dirname(dest), exist_ok=True)
                out.save(dest, 'WEBP', quality=88, method=6)
                print(job.ljust(16), os.path.relpath(path, root))


if __name__ == '__main__':
    main()
