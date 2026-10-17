/* Sources and the one call every view uses: render a style, from a source, into a box. */
import { blur, fromMark, fromPhoto, fromPlate, MARK, type Tone } from './tone'
import * as S from './styles'
import wheelUrl from './sources/wheel.jpg?url'
import wheelDarkUrl from './sources/wheel-dark.jpg?url'
import hubUrl from './sources/hub.jpg?url'
import spindleUrl from './sources/spindle.jpg?url'
import achioteUrl from './sources/achiote.jpg?url'
import saxonyUrl from './sources/saxony-plate.jpg?url'
import monoUrl from '@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2?url'

export const SOURCES = [
  { id: 'mark', label: 'The mark' },
  { id: 'hub', label: 'Wheel, close' },
  { id: 'wheel', label: 'Wheel, side' },
  { id: 'wheelDark', label: 'Wheel, dark' },
  { id: 'saxony', label: 'Saxony plate' },
  { id: 'spindle', label: 'Spindle' },
  { id: 'achiote', label: 'Achiote' },
] as const
export type SourceId = (typeof SOURCES)[number]['id']
type Src = { tone: Tone; soft: Tone }
export let sources: Record<SourceId, Src> | null = null
export const MONO = '"Styles Mono", ui-monospace, monospace'

export async function loadSources() {
  const f = new FontFace('Styles Mono', `url(${monoUrl})`, { weight: '100 900' }); await f.load(); document.fonts.add(f)
  const photo = async (url: string, o?: Parameters<typeof fromPhoto>[1]) => { const tone = await fromPhoto(url, o); return { tone, soft: blur(tone, 10) } }
  const [hub, wheel, wheelDark, spindle, achiote, plate] = await Promise.all([
    photo(hubUrl, { paper: 0.35 }), photo(wheelUrl, { paper: 0.6 }), photo(wheelDarkUrl, { paper: 0.62 }),
    photo(spindleUrl, { paper: 0.5 }), photo(achioteUrl, { paper: 0.55 }), fromPlate(saxonyUrl, { spread: 3, paper: 0.55 }),
  ])
  const mark = fromMark(720)
  sources = { mark: { tone: mark, soft: blur(mark, 8) }, hub, wheel, wheelDark, spindle, achiote, saxony: { tone: plate.tone, soft: blur(plate.tone, 8) } }
  return sources
}

export type RenderOpts = { ink: string; paper: string; scale: number; seed: number; angle: number }
/** where the source sits: `fit` it inside `frame` (contain), then `zoom` about the point (`fx`, `fy`) of the frame */
export type Fit = { frame: S.Box; zoom: number; fx: number; fy: number }

export function placeTone(t: Tone, f: Fit): S.Placed {
  const k = Math.min(f.frame.w / t.w, f.frame.h / t.h) * f.zoom, w = t.w * k, h = t.h * k
  return { tone: t, w, h, x: f.frame.x + f.frame.w * f.fx - w * f.fx, y: f.frame.y + f.frame.h * f.fy - h * f.fy }
}
export function placeMark(f: Fit): S.MarkAt {
  const k = Math.min(f.frame.w / MARK.w, f.frame.h / MARK.h) * f.zoom * 0.76
  return { k, x: f.frame.x + f.frame.w * f.fx - MARK.w * k * f.fx, y: f.frame.y + f.frame.h * f.fy - MARK.h * k * f.fy }
}

const mids = new Map<SourceId, Tone>()
/** a lighter blur for the contour survey: enough to smooth the photo's grain, not the form */
const mid = (id: SourceId) => { let m = mids.get(id); if (!m) { m = blur(sources![id].tone, 4); mids.set(id, m) } return m }

export const GEOMETRIC = new Set(['guilloche', 'moire'])

export function renderStyle(ctx: CanvasRenderingContext2D, id: S.StyleId, box: S.Box, src: SourceId, fit: Fit, o: RenderOpts) {
  const s = sources![src]
  const p = placeTone(s.tone, fit), soft = placeTone(s.soft, fit)
  // the mark's tone map carries its own paper margin; line it up with where the geometry styles draw the mark
  switch (id) {
    case 'engraving': return S.engraving(ctx, box, p, soft, o)
    case 'wood': return S.woodEngraving(ctx, box, p, soft, o)
    case 'stipple': return S.stipple(ctx, box, p, o)
    case 'lines': return S.lineScreen(ctx, box, p, o)
    case 'riso': return S.riso(ctx, box, p, o)
    case 'dither': return S.dither(ctx, box, p, o)
    case 'ascii': return S.ascii(ctx, box, p, o, MONO)
    case 'guilloche': return S.guilloche(ctx, box, placeMark(fit), o)
    case 'moire': return S.moire(ctx, box, placeMark(fit), o)
    case 'plotter': return S.plotter(ctx, box, p, o)
    case 'contour': return S.contours(ctx, box, placeTone(mid(src), fit), o)
    case 'cyanotype': return S.cyanotype(ctx, box, p, o)
  }
}

/** each style's own defaults: the source it reads best from, its mark size and angle, and its ink */
export const DEFAULTS: Record<S.StyleId, { src: SourceId; scale: number; angle: number; ink: string; zoom: number; fx: number; fy: number }> = {
  engraving: { src: 'hub', scale: 5.5, angle: -0.5, ink: '#171615', zoom: 1.15, fx: 0.5, fy: 0.5 },
  wood: { src: 'hub', scale: 5, angle: 0.35, ink: '#171615', zoom: 1.1, fx: 0.5, fy: 0.5 },
  stipple: { src: 'achiote', scale: 3.4, angle: 0, ink: '#F6571C', zoom: 1.05, fx: 0.5, fy: 0.5 },
  lines: { src: 'wheel', scale: 6, angle: 0, ink: '#171615', zoom: 1.35, fx: 0.55, fy: 0.55 },
  riso: { src: 'hub', scale: 9, angle: 0.26, ink: '#6E1A3E', zoom: 1.2, fx: 0.5, fy: 0.5 },
  dither: { src: 'wheel', scale: 4, angle: 0, ink: '#171615', zoom: 1.35, fx: 0.55, fy: 0.55 },
  ascii: { src: 'achiote', scale: 12, angle: 0, ink: '#171615', zoom: 1.05, fx: 0.5, fy: 0.5 },
  guilloche: { src: 'mark', scale: 6, angle: 0, ink: '#6E1A3E', zoom: 1.25, fx: 0.5, fy: 0.5 },
  moire: { src: 'mark', scale: 9, angle: 0, ink: '#171615', zoom: 0.95, fx: 0.5, fy: 0.5 },
  plotter: { src: 'mark', scale: 16, angle: 0, ink: '#171615', zoom: 1.1, fx: 0.5, fy: 0.5 },
  contour: { src: 'hub', scale: 6, angle: 0, ink: '#5070F0', zoom: 1.15, fx: 0.5, fy: 0.5 },
  cyanotype: { src: 'achiote', scale: 4, angle: 0, ink: '#5070F0', zoom: 1.05, fx: 0.5, fy: 0.5 },
}
