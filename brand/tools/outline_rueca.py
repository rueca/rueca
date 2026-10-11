"""Outline the Rueca wordmark to vector paths, sized and weighted from the mark (I · Pulido).

The rule (brand/logo/, "the word is built from the mark"; Rafael's own file had it this way):
  the word fills the band's inner box. Baseline on the band's inner bottom edge (so the band's
  lower run sits under the word like a rule), x-height up to the band's inner top.
  weight     450 (500 small) on variable faces; a single-weight face like Sorts Mill Goudy is
             thickened to the same stem/x-height (0.228, 0.26 small), because the word has to carry
             the mark's solid mass (the wheel and whorl are discs), not just match its line.
  gap        half the x-height, from the mark's right edge to the r's ink.
  spacing    tracking -0.045em (-0.025em small) plus PAIRS
  (Tried first: x-height = the whorl's loop, baseline on the bottom edge, weight solved so the stems
  match the band. Every line matched, but the word read small and light next to the discs.
  Rafael's 11 Oct redraw of the mark was tried and reverted on his call; it's kept in brand/logo/rafael/.)
Two cuts, like the mark: regular (band 25) and small (band 34, used at 24px and under).

Usage (needs fonttools, uharfbuzz, brotli, and skia-pathops for single-weight faces):
  python brand/tools/outline_rueca.py
Writes src/landing/logo.generated.ts and brand/logo/rueca-lockup-*.svg.
The mark's paths come from brand/logo/pulido.json (written from brand/logo/marks.js: base() and
base(SMALL)); regenerate that first if the mark's params change."""
import json, os, re, sys
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.pointInsidePen import PointInsidePen

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TEXT = 'rueca'
FACES = {
    # Klim trial, installed on Rafael's Mac only. Evaluation licence: do not ship these outlines.
    'signifier': {'path': os.path.expanduser('~/Library/Fonts/TestSignifierVF-Roman.ttf'), 'fixed': {}},
    # OFL, shipped by the landing from src/landing/fonts. Static: one weight (400).
    'goudy': {'path': os.path.expanduser('~/Library/Fonts/SortsMillGoudy-Regular.ttf'), 'fixed': {}, 'static': True},
    # OFL, already a dependency: safe to ship. The display optical size, like the landing's h1.
    'newsreader': {'path': os.path.join(ROOT, 'node_modules/@fontsource-variable/newsreader/files/newsreader-latin-opsz-normal.woff2'), 'fixed': {'opsz': 72}},
}
# The mark, from brand/logo/marks.js: base() and base(SMALL). Bottoms level; y grows down.
MARK = json.load(open(os.path.join(ROOT, 'brand/logo/pulido.json')))
CUTS = {
    'regular': {'w': 25, 'Ra': 96.1, 'Rb': 64, 'track': -0.045, 'wght': 450, 'stemTarget': 0.228, **MARK['regular']},
    'small': {'w': 34, 'Ra': 96.1, 'Rb': 65, 'track': -0.025, 'wght': 500, 'stemTarget': 0.26, **MARK['small']},
}
# Pair adjustments on top of the font's kerning and the tracking, in 1/1000 em. The open pairs
# (e-c, r-u) close a little more than the tight one (c-a), so the word reads evenly once tightened.
PAIRS = {'ru': -8, 'ec': -14, 'ca': 6}
# The face the site ships: Sorts Mill Goudy (OFL), swapped in 11 Oct, so no licence is needed.
SHIP = 'goudy'


def as_ttf(face):
    """HarfBuzz can't read woff2: decompress once next to the script's temp dir."""
    if not face['path'].endswith('.woff2'): return face
    import tempfile
    out = os.path.join(tempfile.gettempdir(), os.path.basename(face['path']).replace('.woff2', '.ttf'))
    if not os.path.exists(out):
        f = TTFont(face['path']); f.flavor = None; f.save(out)
    return {**face, 'path': out}


def instance(face, wght):
    f = TTFont(face['path'])
    if face.get('static'): return f  # one weight: wght is ignored
    return instantiateVariableFont(f, {'wght': wght, **face['fixed']})


def x_height(font):
    b = BoundsPen(font.getGlyphSet()); font.getGlyphSet()[font.getBestCmap()[ord('x')]].draw(b)
    return b.bounds[3]


def stem(font):
    """The u's left stem at half the x-height, in font units: scan for inside runs."""
    gs = font.getGlyphSet(); name = font.getBestCmap()[ord('u')]
    y = x_height(font) * 0.5
    adv = font['hmtx'][name][0]
    runs, start = [], None
    for x in range(-20, adv + 20):
        p = PointInsidePen(gs, (x + 0.5, y)); gs[name].draw(p)
        if p.getResult() and start is None: start = x
        if not p.getResult() and start is not None: runs.append(x - start); start = None
    return runs[0]


def outline(face, wght, size, track_em, dx=0.0, dy=0.0, grow=0.0):
    """Shape with HarfBuzz (kerning on), draw each glyph at `size` units per em. Baseline at y=0, y down.
    grow > 0 thickens every outline by that much per side (mark units) and opens the spacing by the
    same amount, for a single-weight face that is lighter than the lockup needs."""
    font = instance(face, wght)
    gs = font.getGlyphSet(); upm = font['head'].unitsPerEm
    blob = hb.Blob.from_file_path(face['path'])
    hbf = hb.Font(hb.Face(blob))
    if not face.get('static'): hbf.set_variations({'wght': wght, **face['fixed']})
    buf = hb.Buffer(); buf.add_str(TEXT); buf.guess_segment_properties()
    hb.shape(hbf, buf, {'kern': True, 'liga': True})
    k = size / upm
    x, parts, bounds = 0.0, [], BoundsPen(gs)
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        name = font.getGlyphName(info.codepoint)
        ox, oy = x + pos.x_offset, pos.y_offset
        pen = SVGPathPen(gs, ntos=lambda v: f'{v:.2f}'.rstrip('0').rstrip('.'))
        tf = (k, 0, 0, -k, ox * k + dx + grow, -oy * k + dy)
        if grow:
            import pathops
            g = pathops.Path(); gs[name].draw(TransformPen(g.getPen(), tf))
            rim = pathops.Path(); gs[name].draw(TransformPen(rim.getPen(), tf))
            rim.stroke(2 * grow, pathops.LineCap.ROUND_CAP, pathops.LineJoin.ROUND_JOIN, 4)
            rim.convertConicsToQuads()  # round joins come back as conics, which the union can't take
            pathops.op(g, rim, pathops.PathOp.UNION).draw(pen)
        else:
            gs[name].draw(TransformPen(pen, tf))
        parts.append(pen.getCommands())
        gs[name].draw(TransformPen(bounds, (1, 0, 0, 1, ox, oy)))
        x += pos.x_advance + track_em * upm + 2 * grow / k
        nxt = TEXT[len(parts):len(parts) + 1]
        if nxt: x += PAIRS.get(TEXT[len(parts) - 1] + nxt, 0) / 1000 * upm
    xmin, ymin, xmax, ymax = bounds.bounds
    return ' '.join(parts), {'xmin': xmin * k, 'xmax': xmax * k + 2 * grow, 'top': -ymax * k - grow, 'bottom': -ymin * k + grow}


def lockup(face_key, cut_key):
    face, cut = as_ttf(FACES[face_key]), CUTS[cut_key]
    W, H = cut['vb']
    xh_units = 2 * (cut['Ra'] - cut['w'] / 2)  # the band's inner box, top to bottom
    baseline = H - cut['w']  # the band's inner bottom edge
    wght = 400 if face.get('static') else cut['wght']
    got = stem(instance(face, wght)) / x_height(instance(face, wght))
    f = instance(face, wght)
    grow = 0.0
    if face.get('static'):  # one weight: thicken to the stem/x-height the balance rule wants
        grow = max(0.0, (cut['stemTarget'] - got) * xh_units / 2)
        got = cut['stemTarget'] if grow else got
    # the thickened outline grows `grow` past the x-height and the baseline, so draw the letters that
    # much smaller and lift them, and the ink still fills the band's inner box exactly
    size = (xh_units - 2 * grow) / x_height(f) * f['head'].unitsPerEm  # font size in mark units
    baseline -= grow
    _, b = outline(face, wght, size, cut['track'], grow=grow)
    gap = xh_units / 2
    dx = W + gap - b['xmin']  # the r's ink starts one gap after the mark
    word, _ = outline(face, wght, size, cut['track'], dx, baseline, grow)
    vb_w = dx + b['xmax']
    vb_h = max(H, baseline + b['bottom'])
    return {
        'face': face_key, 'wght': wght, 'stemRatio': round(got, 4),
        'vb': [round(vb_w, 2), round(vb_h, 2)], 'markW': W, 'markH': H, 'word': word,
        'mark': [cut['wheel'], cut['whorl'], cut['band']],
    }


if __name__ == '__main__':
    out = {fk: {ck: lockup(fk, ck) for ck in CUTS} for fk in FACES if os.path.exists(FACES[fk]['path'])}
    for fk, cuts in out.items():
        for ck, L in cuts.items():
            print(f"{fk:10} {ck:7} wght {L['wght']}  stem/xh {L['stemRatio']}  vb {L['vb']}")
            for name, fill in (('', '#181411'), ('-light', '#F3F1EB')):
                svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {L["vb"][0]} {L["vb"][1]}" fill="{fill}">'
                       + ''.join(f'<path fill-rule="evenodd" d="{p}"/>' for p in L['mark']) + f'<path d="{L["word"]}"/></svg>\n')
                open(os.path.join(ROOT, f'brand/logo/rueca-lockup-{fk}-{ck}{name}.svg'), 'w').write(svg)
    ship = out[SHIP]
    ts = ('/* GENERATED by brand/tools/outline_rueca.py. Do not edit by hand.\n'
          '   The Rueca lockup as vectors: the Pulido mark plus the outlined wordmark, two cuts.\n'
          f"   Face: {SHIP} (set SHIP in the generator to change it). */\n"
          'export type LockupCut = { vb: [number, number]; markW: number; markH: number; wght: number; mark: [string, string, string]; word: string }\n'
          f"export const LOCKUP: Record<'regular' | 'small', LockupCut> = {json.dumps({k: {kk: v[kk] for kk in ('vb', 'markW', 'markH', 'wght', 'mark', 'word')} for k, v in ship.items()}, indent=1)}\n")
    open(os.path.join(ROOT, 'src/landing/logo.generated.ts'), 'w').write(ts)
