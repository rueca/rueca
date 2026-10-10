/* ---------------------------------------------------------------------------
   Demo content in the wire style (brand/BRAND.md, "Wire aesthetic v2").
   The shells show placeholders, not finished UI: one ink, line weight as the
   hierarchy, pink only as the red pen. Everything here paints procedurally to
   a canvas and returns a data URL, so no image files load with a shell.

   NOT part of the kit or the registry — this is the demo app's own content.
--------------------------------------------------------------------------- */

export const WIRE = {
  paper: '#F6F1EA',
  card: '#FBF8F2',   // a surface sitting on the paper
  sheet: '#E8E1D6',  // the blank sheet / empty slot
  ink: '#1C1A19',
  muted: '#6E6A64',  // ink at roughly 60%
  faint: '#A39E96',
  line: '#DCD5CA',   // hairline structure
  pen: '#D1006F',    // red pen: annotation only
} as const

const MONO = "'Geist Mono Variable', 'Geist Mono', ui-monospace, Menlo, monospace"
const cache = new Map<string, string>()

function canvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  return [c, c.getContext('2d')!] as const
}
const memo = (key: string, paint: () => string) => { let v = cache.get(key); if (!v) { v = paint(); cache.set(key, v) } return v }

/** An image slot: paper sheet, hairline border, both diagonals, a centred mono label. */
export function wireImage(w: number, h: number, label = 'image', { fill = WIRE.sheet as string, ink = WIRE.ink as string } = {}): string {
  return memo(`img:${w}x${h}:${label}:${fill}`, () => {
    const [c, x] = canvas(w, h)
    x.fillStyle = fill; x.fillRect(0, 0, w, h)
    x.strokeStyle = ink; x.globalAlpha = 0.28; x.lineWidth = Math.max(1, Math.min(w, h) / 320)
    x.beginPath(); x.moveTo(0, 0); x.lineTo(w, h); x.moveTo(w, 0); x.lineTo(0, h); x.stroke()
    x.globalAlpha = 0.5; x.strokeRect(0.5, 0.5, w - 1, h - 1)
    const fs = Math.max(9, Math.round(Math.min(w, h) / 22))
    x.font = `${fs}px ${MONO}`; x.textAlign = 'center'; x.textBaseline = 'middle'
    const tw = x.measureText(label).width
    x.globalAlpha = 1; x.fillStyle = fill; x.fillRect(w / 2 - tw / 2 - fs * 0.7, h / 2 - fs, tw + fs * 1.4, fs * 2)
    x.fillStyle = ink; x.globalAlpha = 0.62; x.fillText(label, w / 2, h / 2 + 0.5)
    return c.toDataURL('image/png')
  })
}

/** The blank sheet: one diagonal, two punch holes on the long edge, a caption naming the slot. */
export function blankSheet(w: number, h: number, kind = 'image', ratio?: string): string {
  return memo(`blank:${w}x${h}:${kind}`, () => {
    const [c, x] = canvas(w, h)
    const s = Math.min(w, h), portrait = h >= w
    x.fillStyle = WIRE.sheet; x.fillRect(0, 0, w, h)
    x.strokeStyle = WIRE.ink; x.globalAlpha = 0.13; x.lineWidth = Math.max(1, s * 0.0023)
    x.beginPath(); x.moveTo(0, 0); x.lineTo(w, h); x.stroke()
    // punch holes: cut through to transparent
    x.globalAlpha = 1; x.globalCompositeOperation = 'destination-out'
    const r = Math.max(3, s * 0.0185), inset = s * 0.083, len = portrait ? h : w
    for (const p of [len * 0.25, len * 0.75]) { x.beginPath(); x.arc(portrait ? inset : p, portrait ? p : inset, r, 0, Math.PI * 2); x.fill() }
    x.globalCompositeOperation = 'source-over'
    const fs = Math.max(8, s * 0.016), orient = w === h ? 'square' : portrait ? 'vertical' : 'horizontal'
    x.font = `${fs}px ${MONO}`; x.fillStyle = WIRE.ink; x.globalAlpha = 0.48; x.textAlign = 'center'
    const lines = ['Rueca placeholder', `${kind} — ${ratio ?? `${w}×${h}`} · ${orient}`]
    x.save()
    if (portrait) { x.translate(inset, h / 2); x.rotate(-Math.PI / 2) } else x.translate(w / 2, inset)
    lines.forEach((l, i) => x.fillText(l, 0, (i - 0.5) * fs * 1.35 + fs * 0.35))
    x.restore()
    return c.toDataURL('image/png')
  })
}

/** The signature image: a lit spinning top, Atkinson-dithered to two colours.
    `at` places the top horizontally (0–1), `size` is its height as a share of the short side. */
export function ditherTop(w: number, h: number, { dark = WIRE.ink as string, light = WIRE.paper as string, night = false, grid = 260, at = 0.53, size = 0.64 } = {}): string {
  return memo(`top:${w}x${h}:${dark}:${light}:${night}:${at}:${size}`, () => {
    const W = w >= h ? grid : Math.round((grid * w) / h), H = w >= h ? Math.round((grid * h) / w) : grid
    const SS = 3, cw = W * SS, ch = H * SS
    const [cv, x] = canvas(cw, ch)
    const bg = x.createRadialGradient(cw * 0.4, ch * 0.32, 0, cw * 0.5, ch * 0.5, Math.hypot(cw, ch) * 0.62)
    if (night) { bg.addColorStop(0, '#141414'); bg.addColorStop(1, '#0a0a0a') } else { bg.addColorStop(0, '#fbfbfb'); bg.addColorStop(1, '#d4d4d4') }
    x.fillStyle = bg; x.fillRect(0, 0, cw, ch)
    const S = (Math.min(cw, ch) * size) / 32, cx = cw * at, cy = ch * 0.5
    x.save(); x.filter = `blur(${S * 1.5}px)`; x.fillStyle = 'rgba(0,0,0,.5)'
    x.beginPath(); x.ellipse(cx + S * 3.8, cy + S * 14.6, S * 8.5, S * 1.5, 0, 0, Math.PI * 2); x.fill(); x.restore()
    x.save(); x.translate(cx, cy); x.rotate(-0.2); x.scale(S, S); x.translate(-16, -16)
    const side = new Path2D('M5.4 11 C5.2 15.2 8.4 19.6 12.2 23.8 C13.8 25.6 15.2 27.2 16 28.8 C16.8 27.2 18.2 25.6 19.8 23.8 C23.6 19.6 26.8 15.2 26.6 11 Z')
    const lin = (x0: number, x1: number, stops: [number, string][]) => { const g = x.createLinearGradient(x0, 0, x1, 0); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g }
    x.fillStyle = lin(5.4, 26.6, [[0, '#303030'], [0.24, '#8e8e8e'], [0.38, '#cfcfcf'], [0.66, '#6c6c6c'], [1, '#1e1e1e']]); x.fill(side)
    const g2 = x.createLinearGradient(0, 11, 0, 28.8); g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(0,0,0,.5)'); x.fillStyle = g2; x.fill(side)
    x.save(); x.clip(side)
    x.beginPath(); x.ellipse(16, 13.1, 10.6, 2.8, 0, 0, Math.PI); x.ellipse(16, 15.6, 10, 2.6, 0, Math.PI, 0, true); x.closePath()
    x.fillStyle = lin(5.4, 26.6, [[0, '#101010'], [0.36, '#474747'], [1, '#0a0a0a']]); x.fill(); x.restore()
    const g4 = x.createRadialGradient(12.5, 10, 0.3, 16, 11, 11); g4.addColorStop(0, '#d4d4d4'); g4.addColorStop(1, '#7a7a7a')
    x.fillStyle = g4; x.beginPath(); x.ellipse(16, 11, 10.6, 2.8, 0, 0, Math.PI * 2); x.fill()
    x.strokeStyle = '#4c4c4c'; x.lineWidth = 0.25; x.stroke()
    x.fillStyle = lin(15, 17, [[0, '#1c1c1c'], [0.45, '#bdbdbd'], [1, '#141414']]); x.beginPath(); x.moveTo(15.1, 28.1); x.lineTo(16.9, 28.1); x.lineTo(16, 31); x.closePath(); x.fill()
    x.fillStyle = 'rgba(0,0,0,.35)'; x.beginPath(); x.ellipse(16.6, 11.2, 2.2, 0.7, 0, 0, Math.PI * 2); x.fill()
    x.fillStyle = lin(14.6, 17.4, [[0, '#262626'], [0.42, '#a8a8a8'], [1, '#1a1a1a']]); x.beginPath(); x.roundRect(14.6, 3.6, 2.8, 7.6, [1.4, 1.4, 0.4, 0.4]); x.fill()
    x.restore()
    // downsample → luminance → Atkinson
    const [, sx] = canvas(W, H); sx.imageSmoothingQuality = 'high'; sx.drawImage(cv, 0, 0, W, H)
    const d = sx.getImageData(0, 0, W, H).data, L = new Float32Array(W * H)
    for (let i = 0; i < W * H; i++) { const v = (0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2]) / 255; L[i] = Math.min(1, Math.max(0, (v - 0.5) * 1.12 + 0.52)) * (night ? 1.08 : 1) }
    const on = new Uint8Array(W * H)
    for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) {
      const i = yy * W + xx, o = L[i] < 0.5 ? 0 : 1, e = (L[i] - o) / 8; on[i] = o
      for (const [dx, dy] of [[1, 0], [2, 0], [-1, 1], [0, 1], [1, 1], [0, 2]]) { const X = xx + dx, Y = yy + dy; if (X >= 0 && X < W && Y < H) L[Y * W + X] += e }
    }
    const [out, ox] = canvas(w, h)
    ox.imageSmoothingEnabled = false
    const [px, pxx] = canvas(W, H), img = pxx.createImageData(W, H)
    const hex = (s: string) => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)]
    const [A, B] = night ? [hex(dark), hex(light)] : [hex(light), hex(dark)] // ground, dots
    for (let i = 0; i < W * H; i++) { const lit = on[i] === 1, col = night ? (lit ? B : A) : (lit ? A : B); img.data.set([...col, 255], i * 4) }
    pxx.putImageData(img, 0, 0); ox.drawImage(px, 0, 0, w, h)
    return out.toDataURL('image/png')
  })
}
