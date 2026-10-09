/* A brand pattern: quarter-circle Truchet tiles in a palette. Pure in (values, t). */
import { defineSchema, folder, p, createParams, createClock } from '@kit'

export const PALETTES: Record<string, string[]> = {
  Harbour: ['#0e2a47', '#f2e8d5', '#e2583e', '#3d8eb9', '#f6b941'],
  Orchard: ['#1f3a2e', '#f4efe2', '#d9643a', '#9cb380', '#e8c36a'],
  Studio: ['#111111', '#f5f5f0', '#ff4f2e', '#2f6bff', '#ffd23f'],
  Dusk: ['#1b1433', '#f3e9ff', '#ff6f91', '#845ec2', '#ffc75f'],
}

export const schema = defineSchema({
  pattern: folder('Pattern', {
    palette: p.select('Harbour', Object.keys(PALETTES), { publish: true, hint: 'The brand palette the tiles are drawn from.' }),
    scale: p.number(64, { min: 24, max: 160, step: 1, unit: 'px', publish: true, label: 'Tile size' }),
    seed: p.seed(11, { publish: true, label: 'Arrangement' }),
    weight: p.number(0.34, { min: 0.08, max: 0.5, step: 0.01, label: 'Line weight', hint: 'Arc thickness as a share of the tile.' }),
    fill: p.number(0.22, { min: 0, max: 1, step: 0.01, label: 'Solid tiles', hint: 'Share of tiles drawn as solid quarter discs.' }),
  }),
  motion: folder('Motion', {
    drift: p.boolean(true, { publish: true, label: 'Animate' }),
    speed: p.number(0.35, { min: 0, max: 2, step: 0.05, when: (v) => v.drift }),
  }),
  output: folder('Output', {
    frame: p.select('Story', ['Story', 'Post', 'Banner'], { publish: true, hint: 'Crop used for the download.' }),
  }),
})

export const params = createParams(schema, { id: 'present' })
export const clock = createClock({ duration: 10000, loop: true })
export type V = ReturnType<typeof params.values>

export const FRAMES: Record<string, [number, number]> = { Story: [1080, 1920], Post: [1080, 1080], Banner: [1600, 900] }

function rng(seed: number) {
  let s = seed >>> 0 || 1
  return () => ((s = Math.imul(s ^ (s >>> 15), 2246822507) ^ Math.imul(s ^ (s >>> 13), 3266489909)), (s >>> 0) / 4294967296)
}

export function draw(ctx: CanvasRenderingContext2D, v: V, t: number, w: number, h: number) {
  const pal = PALETTES[v.palette] ?? PALETTES.Harbour
  const [bg, , ...ink] = pal
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)
  const s = v.scale
  const cols = Math.ceil(w / s) + 2, rows = Math.ceil(h / s) + 2
  const r = rng(v.seed * 9973)
  const off = v.drift ? ((t / 1000) * v.speed * s * 0.5) % s : 0
  ctx.lineCap = 'butt'
  for (let j = -1; j < rows; j++)
    for (let i = -1; i < cols; i++) {
      const rot = Math.floor(r() * 4), solid = r() < v.fill, c = ink[Math.floor(r() * ink.length)]
      const x = i * s - off, y = j * s
      ctx.save()
      ctx.translate(x + s / 2, y + s / 2)
      ctx.rotate((rot * Math.PI) / 2)
      ctx.translate(-s / 2, -s / 2)
      if (solid) {
        ctx.fillStyle = c
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, s, 0, Math.PI / 2); ctx.closePath(); ctx.fill()
      } else {
        ctx.strokeStyle = c
        ctx.lineWidth = s * v.weight
        ctx.beginPath(); ctx.arc(0, 0, s / 2, 0, Math.PI / 2); ctx.stroke()
        ctx.beginPath(); ctx.arc(s, s, s / 2, Math.PI, Math.PI * 1.5); ctx.stroke()
      }
      ctx.restore()
    }
}
