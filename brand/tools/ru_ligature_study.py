"""r+u ligature study (open / joined / band) for the Rueca wordmark. Run from the repo root with the
outline_rueca.py environment plus skia-pathops. Writes brand/logo/ru-ligature.html."""
import importlib.util, json
spec = importlib.util.spec_from_file_location('o', 'brand/tools/outline_rueca.py'); o = importlib.util.module_from_spec(spec); spec.loader.exec_module(o)
import pathops
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.recordingPen import RecordingPen
face = o.as_ttf(o.FACES['signifier']); f = o.instance(face, 450); gs = f.getGlyphSet()
def glyph_path(name, dx=0):
    p = pathops.Path(); gs[name].draw(TransformPen(p.getPen(), (1, 0, 0, 1, dx, 0))); return p
def poly(pts):
    p = pathops.Path(); pen = p.getPen(); pen.moveTo(pts[0]); [pen.lineTo(q) for q in pts[1:]]; pen.closePath(); return p
def qpoly(cmds):
    p = pathops.Path(); pen = p.getPen()
    for c in cmds:
        getattr(pen, c[0])(*c[1:])
    pen.closePath(); return p
def union(*ps):
    out = pathops.Path()
    b = pathops.OpBuilder(fix_winding=True)
    for q in ps: b.add(q, pathops.PathOp.UNION)
    return b.resolve()
def diff(a, b_):
    return pathops.op(a, b_, pathops.PathOp.DIFFERENCE)
def svgd(p, k, dx, dy):
    pen = SVGPathPen(None, ntos=lambda v: f'{v:.2f}'.rstrip('0').rstrip('.')); p.draw(TransformPen(pen, (k, 0, 0, -k, dx, dy))); return pen.getCommands()
U = 361
variants = {}
# 1 · open: the pair backed off so the ear clears the serif
variants['open'] = union(glyph_path('r'), glyph_path('u', U + 34))
# 2 · joined, cleaned: one top edge from the ear's crown to the serif, the notch under the join filleted
r = glyph_path('r'); u = glyph_path('u', U)
top = poly([(342, 462), (U + 188, 457), (U + 188, 430), (380, 430), (352, 452)])
fillet = qpoly([('moveTo', (392, 372)), ('qCurveTo', (404, 400), (U + 13, 402)), ('lineTo', (U + 85, 402)), ('lineTo', (U + 85, 430)), ('lineTo', (380, 430))])
variants['joined'] = union(r, u, top, fillet)
# 3 · band: the ear's bulb is cut off and the arm runs flat into the u as one thin band, like the drive band
r_no_ear = diff(glyph_path('r'), poly([(196, 300), (420, 300), (420, 480), (196, 480)]))
band = qpoly([('moveTo', (195, 372)), ('qCurveTo', (230, 418), (300, 438)), ('lineTo', (U + 85, 446)), ('lineTo', (U + 188, 457)), ('lineTo', (U + 188, 402)), ('lineTo', (U + 85, 402)), ('lineTo', (U + 85, 404)), ('lineTo', (300, 398)), ('qCurveTo', (240, 385), (195, 330))])
u_no_serif = diff(glyph_path('u', U), poly([(U - 20, 401), (U + 84.5, 401), (U + 84.5, 470), (U - 20, 470)]))
variants['band'] = union(r_no_ear, band, u_no_serif, glyph_path('r') if False else pathops.Path())

import uharfbuzz as hb
def word_path(ru):
    """the whole word in font units, with the given r+u shape; e, c, a from the shaper and the generator's spacing"""
    hbf = hb.Font(hb.Face(hb.Blob.from_file_path(face['path']))); hbf.set_variations({'wght': 450})
    buf = hb.Buffer(); buf.add_str('rueca'); buf.guess_segment_properties(); hb.shape(hbf, buf, {'kern': True})
    x, out = 0, [ru]
    for i, (inf, pos) in enumerate(zip(buf.glyph_infos, buf.glyph_positions)):
        if i >= 2: out.append(glyph_path(f.getGlyphName(inf.codepoint), x))
        x += pos.x_advance - 45 + o.PAIRS.get('rueca'[i:i + 2], 0)
        if i == 1 and ru is variants['open']: x += 34
    return union(*out)
cut = o.CUTS['regular']; W, H = cut['vb']; xh = 2 * (cut['Ra'] - cut['w'] / 2); base = H - cut['w']
k = xh / o.x_height(f)
mark = ''.join(f'<path fill-rule="evenodd" d="{q}"/>' for q in (cut['wheel'], cut['whorl'], cut['band']))
html = '<meta charset="utf-8"><body style="margin:0;background:#faf8f4;font:12px system-ui;color:#58524d;padding:20px;display:grid;gap:10px">'
for name in ('open', 'joined', 'band'):
    wp = word_path(variants[name]); b = wp.bounds
    dx = W + xh / 2 - b[0] * k
    d = svgd(wp, k, dx, base)
    vb = f'0 0 {dx + b[2] * k:.1f} {H}'
    s_ = lambda h: f'<svg viewBox="{vb}" style="height:{h}px;display:block" fill="#181411">{mark}<path d="{d}"/></svg>'
    html += f'<p style="margin:12px 0 4px">{name}</p>{s_(110)}<div style="display:flex;gap:30px;align-items:center;margin-top:8px">{s_(18)}{s_(32)}</div>'
open('brand/logo/ru-ligature.html', 'w').write(html)
print('ok')
