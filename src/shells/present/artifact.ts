/* A brand pattern: Truchet tiles drawn as engraved thread. Every arc is a band of
   hairlines, so neighbouring tiles join into long runs of spun thread; a few bands are
   dyed underneath (the one flat colour block). Palettes are Rueca's natural dyes
   (brand/data.js ruecaRamps). Pure in (values, t). */
import { defineSchema, folder, p, createParams, createClock } from '@kit'

export const PALETTES: Record<string, { ground: string; line: string; dyes: string[] }> = {
  Añil: { ground: '#F3F1EB', line: '#3440C8', dyes: ['#E8582C'] },
  Nogal: { ground: '#F3F1EB', line: '#181411', dyes: ['#F2C744'] },
  Rubia: { ground: '#5E2219', line: '#F3F1EB', dyes: ['#F2C744'] },
  Noche: { ground: '#151210', line: '#D7CFCA', dyes: ['#5DB4E8'] },
  Tintes: { ground: '#F3F1EB', line: '#181411', dyes: ['#E8582C', '#EE7A68', '#A88BF6', '#5DB4E8', '#2FA57C', '#F2C744'] },
}

export const schema = defineSchema({
  pattern: folder('Pattern', {
    palette: p.select('Rubia', Object.keys(PALETTES), { publish: true, hint: 'The dye set: ground, thread and the colour block.' }),
    scale: p.number(64, { min: 24, max: 160, step: 1, unit: 'px', publish: true, label: 'Tile size' }),
    seed: p.seed(11, { publish: true, label: 'Arrangement' }),
    threads: p.number(5, { min: 1, max: 9, step: 1, label: 'Threads', hint: 'Hairlines in each band.' }),
    band: p.number(0.42, { min: 0.1, max: 0.8, step: 0.01, label: 'Band width', hint: 'Width of each band of thread as a share of the tile.' }),
    fill: p.number(0.12, { min: 0, max: 1, step: 0.01, label: 'Dyed bands', hint: 'Share of tiles with one band dyed underneath.' }),
  }),
  motion: folder('Motion', {
    drift: p.boolean(true, { publish: true, label: 'Animate' }),
    speed: p.number(0.35, { min: 0, max: 2, step: 0.05, when: (v) => v.drift }),
  }),
  output: folder('Output', {
    frame: p.select('Story', ['Story', 'Post', 'Banner'], { publish: true, hint: 'Crop used for the download.' }),
  }),
})

// v2: engraved thread; `weight` became `band` (a different scale), so a v1 link or save keeps everything else (client-view C13)
export const params = createParams(schema, { id: 'present', version: 2, migrate: (old) => { const { weight: _w, ...rest } = old; return rest } })
export const clock = createClock({ duration: 10000, loop: true })
export type V = ReturnType<typeof params.values>

export const FRAMES: Record<string, [number, number]> = { Story: [1080, 1920], Post: [1080, 1080], Banner: [1600, 900] }

function rng(seed: number) {
  let s = seed >>> 0 || 1
  return () => ((s = Math.imul(s ^ (s >>> 15), 2246822507) ^ Math.imul(s ^ (s >>> 13), 3266489909)), (s >>> 0) / 4294967296)
}

export function draw(ctx: CanvasRenderingContext2D, v: V, t: number, w: number, h: number) {
  const pal = PALETTES[v.palette] ?? PALETTES.Rubia
  ctx.fillStyle = pal.ground
  ctx.fillRect(0, 0, w, h)
  const s = v.scale, half = s / 2, band = s * v.band
  const n = Math.max(1, Math.round(v.threads))
  // the band's hairlines, spread evenly across it (one thread sits on the centre line)
  const radii = Array.from({ length: n }, (_, k) => (n === 1 ? half : half - band / 2 + (band * k) / (n - 1)))
  const hair = Math.max(0.75, s * 0.016)
  const cols = Math.ceil(w / s) + 2, rows = Math.ceil(h / s) + 2
  const r = rng(v.seed * 9973)
  const off = v.drift ? ((t / 1000) * v.speed * s * 0.5) % s : 0
  ctx.lineCap = 'butt'
  for (let j = -1; j < rows; j++)
    for (let i = -1; i < cols; i++) {
      // four draws per tile, always, so changing "Dyed bands" never reshuffles the arrangement
      const rot = Math.floor(r() * 4), dyed = r() < v.fill, dye = pal.dyes[Math.floor(r() * pal.dyes.length)], far = r() < 0.5
      ctx.save()
      ctx.translate(i * s - off + half, j * s + half)
      ctx.rotate((rot * Math.PI) / 2)
      ctx.translate(-half, -half)
      if (dyed) {
        // a flat dyed block under one of the two bands
        const [cx, a0] = far ? [s, Math.PI] : [0, 0]
        ctx.fillStyle = dye
        ctx.beginPath()
        ctx.arc(cx, cx, half + band / 2, a0, a0 + Math.PI / 2)
        ctx.arc(cx, cx, Math.max(0, half - band / 2), a0 + Math.PI / 2, a0, true)
        ctx.closePath(); ctx.fill()
      }
      ctx.strokeStyle = pal.line
      ctx.lineWidth = hair
      ctx.beginPath()
      for (const rr of radii) {
        ctx.moveTo(rr, 0); ctx.arc(0, 0, rr, 0, Math.PI / 2)
        ctx.moveTo(s - rr, s); ctx.arc(s, s, rr, Math.PI, Math.PI * 1.5)
      }
      ctx.stroke()
      ctx.restore()
    }
}
