"""Outline the Trompo wordmark (Gabarito 800, lowercase, -0.035em tracking) into SVG paths,
and build mark + wordmark lockups. Shaping (kerning) by HarfBuzz at wght=800."""
import re, sys
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

SRC, OUT = sys.argv[1], sys.argv[2]
TEXT, WGHT, TRACK = 'trompo', 800, -0.035
SIZE = 100  # wordmark font-size in SVG units

static = instantiateVariableFont(TTFont(SRC), {'wght': WGHT})
upm = static['head'].unitsPerEm
gs = static.getGlyphSet()

blob = hb.Blob.from_file_path(SRC)
font = hb.Font(hb.Face(blob)); font.set_variations({'wght': WGHT})
buf = hb.Buffer(); buf.add_str(TEXT); buf.guess_segment_properties()
hb.shape(font, buf, {'kern': True, 'liga': True})

k = SIZE / upm
x = 0.0
d_parts, bounds = [], BoundsPen(gs)
for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
    name = static.getGlyphName(info.codepoint)
    ox, oy = x + pos.x_offset, pos.y_offset
    pen = SVGPathPen(gs)
    gs[name].draw(TransformPen(pen, (k, 0, 0, -k, ox * k, -oy * k)))  # flip y: SVG grows downward
    d_parts.append(pen.getCommands())
    gs[name].draw(TransformPen(bounds, (1, 0, 0, 1, ox, oy)))
    x += pos.x_advance + TRACK * upm
x -= TRACK * upm  # no tracking after the last letter

xmin, ymin, xmax, ymax = bounds.bounds  # font units, y up
W = (xmax - xmin) * k
top, bottom = -ymax * k, -ymin * k  # in SVG y (baseline at 0)
d = ' '.join(d_parts)
H = bottom - top

def wordmark(ink, pad=0):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{xmin*k - pad:.2f} {top - pad:.2f} {W + 2*pad:.2f} {H + 2*pad:.2f}" '
            f'width="{W + 2*pad:.0f}" height="{H + 2*pad:.0f}" role="img" aria-label="trompo">'
            f'<path fill="{ink}" d="{d}"/></svg>')

def mark_body(path):
    s = open(path).read()
    return re.sub(r'^<svg[^>]*>|</svg>$', '', s.strip())

def lockup(ink, mark_file):
    # Mark at 1.18x the font size (as on the board), centred on the word's ink box, gap 0.32em.
    mh = SIZE * 1.18; gap = SIZE * 0.32; s = mh / 32
    cy = (top + bottom) / 2
    mx, my = xmin * k - gap - mh, cy - mh / 2
    vx, vy = mx, min(my, top); vw = (xmin * k + W) - mx; vh = max(my + mh, bottom) - vy
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vx:.2f} {vy:.2f} {vw:.2f} {vh:.2f}" width="{vw:.0f}" height="{vh:.0f}" role="img" aria-label="Trompo">'
            f'<g transform="translate({mx:.2f} {my:.2f}) scale({s:.4f})">{mark_body(mark_file)}</g>'
            f'<path fill="{ink}" d="{d}"/></svg>')

LIGHT, DARK = '#1C1A19', '#F6F1EA'
open(f'{OUT}/wordmark-light.svg', 'w').write(wordmark(LIGHT))
open(f'{OUT}/wordmark-dark.svg', 'w').write(wordmark(DARK))
open(f'{OUT}/lockup-light.svg', 'w').write(lockup(LIGHT, f'{OUT}/mark-light.svg'))
open(f'{OUT}/lockup-dark.svg', 'w').write(lockup(DARK, f'{OUT}/mark-dark.svg'))
print(f'upm {upm}, glyphs {[static.getGlyphName(i.codepoint) for i in buf.glyph_infos]}, '
      f'advances {[p.x_advance for p in buf.glyph_positions]}, word {W:.1f}x{H:.1f}')
