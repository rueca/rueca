"""Engraving → Nogal ink on transparent (RUECA.md §6, "post-process every output").

The same maths as inked() in brand/lamina/manual/sheets.js, in Python so the shells'
demo plates can be made from the command line:

  python3 brand/tools/ink.py in.png out.webp --w 900 --crop 0.06,0.05,0.94,0.9 --floor 0.86

  --crop  l,t,r,b  fractions of the source to keep (cut the plate border and lettering off)
  --floor y        fraction of the cropped height below which the ink fades out (drops the ground line)
  --ink  #hex      ink colour (Nogal by default; the shells re-ink it for dark themes)
"""
import argparse
import numpy as np
from PIL import Image

p = argparse.ArgumentParser()
p.add_argument('src'); p.add_argument('out')
p.add_argument('--w', type=int, default=900)
p.add_argument('--crop', default='0,0,1,1')
p.add_argument('--floor', type=float, default=None)
p.add_argument('--ink', default='#181411')
p.add_argument('--hi', type=float, default=0.55, help='paper percentile (higher keeps fainter hatching)')
p.add_argument('--auto-border', action='store_true', help='also look for a ruled plate border and cut inside it')
p.add_argument('--sides', type=float, default=0.12, help='width of the soft fade at the left and right edges')
a = p.parse_args()

im = Image.open(a.src).convert('RGB')
l, t, r, b = (float(v) for v in a.crop.split(','))
W, H = im.size
im = im.crop((round(l * W), round(t * H), round(r * W), round(b * H)))

# the plate's ruled border: a row or column near an edge that is dark most of its length. Cut inside it.
g = np.asarray(im.convert('L'), dtype=np.float32) / 255
dark = g < np.percentile(g, 50) - 0.18
def edge(prof, n, from_end):
    rng = range(n - 1, int(n * 0.8), -1) if from_end else range(0, int(n * 0.2))
    hit = None
    for i in rng:
        if prof[i] > 0.45: hit = i
    return hit
rows, cols = dark.mean(axis=1), dark.mean(axis=0)
y0, y1, x0, x1 = (edge(rows, len(rows), False), edge(rows, len(rows), True), edge(cols, len(cols), False), edge(cols, len(cols), True)) if a.auto_border else (None,) * 4
m = round(min(im.size) * 0.012)
im = im.crop((0 if x0 is None else x0 + m, 0 if y0 is None else y0 + m, im.width if x1 is None else x1 - m, im.height if y1 is None else y1 - m))
h = round(a.w * im.height / im.width)
im = im.resize((a.w, h), Image.LANCZOS)

px = np.asarray(im, dtype=np.float32) / 255
L = 0.2126 * px[..., 0] + 0.7152 * px[..., 1] + 0.0722 * px[..., 2]
s = np.sort(L.ravel()[::11])
lo, hi = s[int(len(s) * 0.02)], s[int(len(s) * a.hi)] - 0.07  # a little below paper, so grain drops out
alpha = np.clip((hi - L) / (hi - lo), 0, 1) ** 0.9
if a.floor is not None:
    ys = np.linspace(0, 1, h)[:, None]
    alpha *= np.clip((a.floor + 0.03 - ys) / 0.03, 0, 1)
# soft side edges: the ground line fades into a pool, and any leftover rule or paper edge with it
xs = np.linspace(0, 1, a.w)[None, :]
alpha *= np.clip(np.minimum(xs, 1 - xs) / max(a.sides, 1e-3), 0, 1) ** 1.5

rgb = tuple(int(a.ink[i:i + 2], 16) for i in (1, 3, 5))
out = np.zeros((h, a.w, 4), dtype=np.uint8)
out[..., 0], out[..., 1], out[..., 2] = rgb
out[..., 3] = np.round(alpha * 255).astype(np.uint8)
img = Image.fromarray(out)
# trim to the ink, with a little air
bbox = img.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox()
if bbox:
    pad = round(a.w * 0.02)
    img = img.crop((max(0, bbox[0] - pad), max(0, bbox[1] - pad), min(a.w, bbox[2] + pad), min(h, bbox[3] + pad)))
img.save(a.out, 'WEBP', quality=86, method=6)
print(a.out, img.size)
