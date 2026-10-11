"""The workshop under the footer: a cleaned engraving → two pre-inked prints for the page ground.

  python3 brand/tools/workshop.py clean.jpeg public/art/workshop --w 2400

Writes <out>-light.{avif,webp} (Nogal ink) and <out>-dark.{avif,webp} (Lana ink). The page loads the
AVIF (about 40% of the WebP: WebP keeps alpha lossless, and the hatching is all alpha); WebP is the fallback. Same levels as ink.py,
then the strength each theme wants is baked into the alpha, and the top fades out so the
picture rises out of the paper behind the sheet (landing.css, .site background).

  --light / --dark   ink strength per theme (0–1 alpha at full ink)
  --fade             fraction of the height, from the top, over which the ink fades in
  --sides            fraction of the width at each side over which it fades in
"""
import argparse
import numpy as np
from PIL import Image

p = argparse.ArgumentParser()
p.add_argument('src'); p.add_argument('out')
p.add_argument('--w', type=int, default=2000)
p.add_argument('--crop', default='0,0,1,1')
p.add_argument('--hi', type=float, default=0.6, help='paper percentile (higher keeps fainter hatching)')
p.add_argument('--light', type=float, default=0.2)
p.add_argument('--dark', type=float, default=0.11)
p.add_argument('--fade', type=float, default=0.55)
p.add_argument('--sides', type=float, default=0.06)
p.add_argument('--q', type=int, default=74, help='webp quality')
p.add_argument('--aq', type=int, default=88, help='avif quality (below ~85 the faint wall hatching smears)')
a = p.parse_args()

im = Image.open(a.src).convert('RGB')
l, t, r, b = (float(v) for v in a.crop.split(','))
W, H = im.size
im = im.crop((round(l * W), round(t * H), round(r * W), round(b * H)))
h = round(a.w * im.height / im.width)
im = im.resize((a.w, h), Image.LANCZOS)

px = np.asarray(im, dtype=np.float32) / 255
L = 0.2126 * px[..., 0] + 0.7152 * px[..., 1] + 0.0722 * px[..., 2]
s = np.sort(L.ravel()[::11])
lo, hi = s[int(len(s) * 0.02)], s[int(len(s) * a.hi)] - 0.07
alpha = np.clip((hi - L) / (hi - lo), 0, 1) ** 0.9

ys = np.linspace(0, 1, h)[:, None]
xs = np.linspace(0, 1, a.w)[None, :]
fade = np.clip(ys / max(a.fade, 1e-3), 0, 1)
fade = fade * fade * (3 - 2 * fade)  # smoothstep, so the top edge never shows
side = np.clip(np.minimum(xs, 1 - xs) / max(a.sides, 1e-3), 0, 1)
alpha *= fade * side

for name, ink, k in (('light', '#181411', a.light), ('dark', '#F3F1EB', a.dark)):
    rgb = tuple(int(ink[i:i + 2], 16) for i in (1, 3, 5))
    out = np.zeros((h, a.w, 4), dtype=np.uint8)
    out[..., 0], out[..., 1], out[..., 2] = rgb
    out[..., 3] = np.round(alpha * k * 255).astype(np.uint8)
    img = Image.fromarray(out)
    img.save(f'{a.out}-{name}.webp', 'WEBP', quality=a.q, method=6)
    img.save(f'{a.out}-{name}.avif', 'AVIF', quality=a.aq)
    print(f'{a.out}-{name}.{{avif,webp}}', (a.w, h))
