/* ---------------------------------------------------------------------------
   Demo content in the wire style (brand/BRAND.md, "Wire aesthetic v2"), on Rueca's paper and inks.
   The shells show placeholders, not finished UI: one ink, line weight as the
   hierarchy, Achiote only as the red pen. Everything here paints procedurally to
   a canvas and returns a data URL, so no image files load with a shell.

   NOT part of the kit or the registry — this is the demo app's own content.
--------------------------------------------------------------------------- */

export const WIRE = {
  paper: '#F3F1EB',  // Lana (brand/RUECA.md §2)
  card: '#FAF8F4',   // a surface sitting on the paper
  sheet: '#E7E3DB',  // the blank sheet / empty slot
  ink: '#181411',    // Nogal
  muted: '#6E6A64',  // ink at roughly 60%
  faint: '#A39E96',
  line: '#DCD7CE',   // hairline structure
  pen: '#E8582C',    // the red pen (Achiote): annotation only
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

/* The dithered spinning top that used to be the signature image is retired (11 Oct 2026): the demo's
   pictures are its clients' engravings and photographs now (src/demo/clients.ts). */
