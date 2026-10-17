/* The wheel's moods (research/28, device 1: the wheel is the character, no face, no figure). The Pulido mark, exact,
   in five states, each made of the race's own vocabulary (colour folds sweeping round a wheel, the band filling like
   thread) and each named for a spinning word (research/28, device 4; proposals, not decided):
     · Working, Hilar (to spin): fans race round the wheel without stopping, the whorl twice as fast (it's half the size).
     · Idle, Cardar (to card): one slow Malva fan, then the ink wipes it clean.
     · Snag, Torcer (to twist): an Achiote fold catches, snaps back past where it started, and settles.
     · Loading, Devanar (to wind): thread winds along the band, then clears.
     · Done: the race itself (E2, approved), then the mark clears for the next loop.
   Only the wheel turns (brand/RUECA.md §7, rule 6). Pure functions of (values, t). */
import { defineSchema, folder, p, createParams, createClock } from '@kit'
import { cubicBezier } from '@kit/core/ease'
import plexUrl from '@fontsource-variable/ibm-plex-sans/files/ibm-plex-sans-latin-wght-normal.woff2?url' // the site's text face; Host Grotesk is for the logo only (Rafael, 16 Oct)
import goudyUrl from '@/landing/fonts/sorts-mill-goudy-regular.woff2?url'
import goudyItalicUrl from '@/landing/fonts/sorts-mill-goudy-italic.woff2?url'

const FONT = { sans: '"Moods Plex", sans-serif', serif: '"Moods Goudy", serif' }
const DAY = { field: '#FDFBFA', ink: '#171615', muted: '#6B6866', gualda: '#FFD000', malva: '#EFA6FF', achiote: '#F6571C', cochinilla: '#B0006A', cielo: '#5070F0', hoja: '#84C900' }
const NIGHT = { field: '#181716', ink: '#F7F5F4', muted: '#A8A4A1', gualda: '#FFD84D', malva: '#F2B3FF', achiote: '#FF6A2C', cochinilla: '#D23A84', cielo: '#7088FF', hoja: '#9BD83A' }
type Pal = typeof DAY

export const MOODS = [
  { id: 'working', word: 'Hilar', gloss: 'to spin', mood: 'Working', line: 'Fans race round; the whorl turns twice as fast.' },
  { id: 'idle', word: 'Cardar', gloss: 'to card', mood: 'Idle', line: 'One slow fan, then the ink wipes it clean.' },
  { id: 'snag', word: 'Torcer', gloss: 'to twist', mood: 'Snag', line: 'A fold catches and snaps back past the start.' },
  { id: 'loading', word: 'Devanar', gloss: 'to wind', mood: 'Loading', line: 'Thread winds along the band, then clears.' },
  { id: 'done', word: 'Hilar', gloss: 'the race', mood: 'Done', line: 'The race, once, then the mark rests.' },
] as const
type Mood = (typeof MOODS)[number]['id']

const sec = (v: number) => `${(v / 1000).toFixed(2)}s`
export const schema = defineSchema({
  moods: folder('Moods', {
    view: p.select('board', [{ value: 'board', label: 'All five' }, { value: 'one', label: 'One' }], { display: 'segmented', label: 'Show', hint: 'All five side by side, named, or one mood large.' }),
    mood: p.select('working', MOODS.map((m) => ({ value: m.id, label: `${m.mood} · ${m.word}` })), { label: 'Mood', when: (v) => v.view === 'one' }),
    ground: p.select('lana', [{ value: 'lana', label: 'Lana' }, { value: 'nogal', label: 'Nogal' }], { display: 'segmented', label: 'Ground' }),
    loopMs: p.number(4800, { min: 2400, max: 9600, step: 100, fmt: sec, label: 'Loop', hint: 'Every mood repeats on this loop, so the board stays in step.' }),
  }),
  feel: folder('Feel', {
    ease: p.curve([0.33, 1, 0.68, 1], { label: 'Fold ease', hint: 'How every colour fold moves (the race’s, E2).' }),
    fans: p.number(5, { min: 1, max: 10, step: 1, label: 'Working fans', hint: 'Fans a loop on the wheel (the whorl gets twice as many). Five keeps the five colours in step with the loop.' }),
    snagAt: p.number(0.62, { min: 0.2, max: 0.95, step: 0.01, fmt: (v) => `${Math.round(v * 100)}%`, label: 'Snag at', hint: 'How far round the fold gets before it catches.' }),
    overshoot: p.number(0.16, { min: 0, max: 0.4, step: 0.01, fmt: (v) => `${Math.round(v * 100)}%`, label: 'Snaps past', hint: 'How far back past the start the snap carries before it settles.' }),
  }, { collapsed: true }),
})

export const params = createParams(schema, { id: 'rueca-moods', version: 1 })
export type V = ReturnType<typeof params.values>
export const totalMs = (v: V) => v.loopMs
export const clock = createClock({ duration: totalMs(params.values() as V), loop: true })
params.subscribe((st) => clock.setState({ duration: totalMs(st.values as V) }))
export const sizeOf = (v: V) => (v.view === 'board' ? { w: 1800, h: 640 } : { w: 1080, h: 1080 })

export async function loadAssets() {
  const font = async (family: string, url: string, weight = '400', style = 'normal') => { const f = new FontFace(family, `url(${url})`, { weight, style }); await f.load(); document.fonts.add(f) }
  await Promise.all([font('Moods Plex', plexUrl, '100 700'), font('Moods Goudy', goudyUrl), font('Moods Goudy', goudyItalicUrl, '400', 'italic')])
}

// ── The mark: Pulido geometry (brand/logo/pulido.json), as in brand/bento/artifact.ts ──
const MARK_W = 309.1, MARK_H = 217.2
const WHEEL = { cx: 200.5, cy: 108.6, r: 61.1 }, WHORL = { cx: 76.5, cy: 140.7, r: 29 }
const BIG = { cx: 200.5, cy: 108.6, r: 96.1 }, SMALL = { cx: 76.5, cy: 140.7, r: 64 }, BAND_W = 25
const PATHS = {
  wheel: new Path2D('M139.4 108.6A61.1 61.1 0 1 0 261.6 108.6A61.1 61.1 0 1 0 139.4 108.6Z'),
  whorl: new Path2D('M47.5 140.7A29 29 0 1 0 105.5 140.7A29 29 0 1 0 47.5 140.7Z'),
  band: new Path2D('M200.5 217.2L76.5 217.2A76.5 76.5 0 0 1 39.38 73.81L147.8 13.64A108.6 108.6 0 1 1 200.5 217.2ZM200.5 192.2L76.5 192.2A51.5 51.5 0 0 1 51.51 95.67L159.94 35.5A83.6 83.6 0 1 1 200.5 192.2Z'),
}
const TAN = (() => { const dx = BIG.cx - SMALL.cx, dy = BIG.cy - SMALL.cy, L = Math.hypot(dx, dy); return Math.atan2(dy, dx) - Math.acos((SMALL.r - BIG.r) / L) })()
const tA = { x: SMALL.cx + SMALL.r * Math.cos(TAN), y: SMALL.cy + SMALL.r * Math.sin(TAN) }
const tB = { x: BIG.cx + BIG.r * Math.cos(TAN), y: BIG.cy + BIG.r * Math.sin(TAN) }
const BAND_LEN = Math.hypot(tB.x - tA.x, tB.y - tA.y) + BIG.r * (Math.PI / 2 - TAN) + (BIG.cx - SMALL.cx) + SMALL.r * (TAN + Math.PI * 1.5)
function bandPath(ctx: Ctx) {
  ctx.beginPath(); ctx.moveTo(tA.x, tA.y); ctx.lineTo(tB.x, tB.y)
  ctx.arc(BIG.cx, BIG.cy, BIG.r, TAN, Math.PI / 2); ctx.lineTo(SMALL.cx, SMALL.cy + SMALL.r)
  ctx.arc(SMALL.cx, SMALL.cy, SMALL.r, Math.PI / 2, TAN + Math.PI * 2)
}
/** E2's race (brand/logo/fan/e2-approved.json) and Mora's Stack folds (src/landing/LogoIntro.tsx) */
const RACE = { whorl: { delay: 0, dur: 500, start: 27 }, wheel: { delay: 120, dur: 600, start: 270 }, band: { delay: 240, dur: 700, start: 0 } }
const FOLDS = { band: ['malva', 'cielo', 'achiote', 'cochinilla'], wheel: ['gualda', 'malva', 'achiote', 'cochinilla'], whorl: ['hoja', 'cielo', 'achiote', 'cochinilla'] } as const

// ── Draw ───────────────────────────────────────────────────────────────────────
type Ctx = CanvasRenderingContext2D
const clamp01 = (x: number) => Math.max(0, Math.min(1, x))
const TOP = -Math.PI / 2

/** a fan of colour round a circle from `a0`, `reach` of a turn (negative runs the other way) */
function fan(ctx: Ctx, c: { cx: number; cy: number; r: number }, a0: number, reach: number, colour: string) {
  if (Math.abs(reach) < 1e-4) return
  ctx.fillStyle = colour; ctx.beginPath()
  if (Math.abs(reach) >= 1 - 1e-4) ctx.arc(c.cx, c.cy, c.r + 0.5, 0, Math.PI * 2)
  else { ctx.moveTo(c.cx, c.cy); ctx.arc(c.cx, c.cy, c.r + 0.5, a0, a0 + reach * Math.PI * 2, reach < 0); ctx.closePath() }
  ctx.fill()
}
/** the band from `from` to `to` of its length (0..1), in `colour` */
function band(ctx: Ctx, from: number, to: number, colour: string) {
  if (to - from < 1e-4) return
  ctx.save(); ctx.clip(PATHS.band, 'evenodd')
  ctx.strokeStyle = colour; ctx.lineWidth = BAND_W + 2; ctx.lineCap = 'butt'
  ctx.setLineDash([(to - from) * BAND_LEN, BAND_LEN * 2]); ctx.lineDashOffset = -from * BAND_LEN
  bandPath(ctx); ctx.stroke(); ctx.setLineDash([]); ctx.restore()
}
const solid = (ctx: Ctx, path: Path2D, colour: string) => { ctx.fillStyle = colour; ctx.fill(path, 'evenodd') }

/** fans that keep setting off round `c`: `n` a loop, `colours` in turn, each taking `turn` of the gap to go round */
function fans(ctx: Ctx, c: typeof WHEEL, t: number, L: number, n: number, colours: string[], ease: (x: number) => number, a0 = TOP) {
  const gap = L / n, dur = gap * 2.2, now = Math.floor(t / gap)
  const col = (k: number) => colours[((k % colours.length) + colours.length) % colours.length]
  let base = now - 3
  for (let k = now; k >= now - 3; k--) if (t >= k * gap + dur) { base = k; break }
  fan(ctx, c, a0, 1, col(base))
  for (let k = base + 1; k <= now; k++) fan(ctx, c, a0, ease(clamp01((t - k * gap) / dur)), col(k))
}

function mood(ctx: Ctx, v: V, id: Mood, t: number, P: Pal) {
  const L = v.loopMs, ease = cubicBezier(v.ease), pen = cubicBezier([0.65, 0, 0.35, 1])
  const c = (k: keyof Pal) => P[k]
  switch (id) {
    case 'working': {
      const cols = [c('gualda'), c('malva'), c('achiote'), c('cochinilla'), c('ink')]
      solid(ctx, PATHS.band, c('ink'))
      fans(ctx, WHEEL, t, L, v.fans, cols, ease)
      fans(ctx, WHORL, t, L, v.fans * 2, cols, ease, TOP + 0.5)
      return
    }
    case 'idle': {
      solid(ctx, PATHS.band, c('ink')); solid(ctx, PATHS.whorl, c('ink')); solid(ctx, PATHS.wheel, c('ink'))
      const slow = cubicBezier([0.45, 0, 0.55, 1])
      fan(ctx, WHEEL, TOP, slow(clamp01((t - L * 0.08) / (L * 0.36))), c('malva'))
      fan(ctx, WHEEL, TOP, slow(clamp01((t - L * 0.5) / (L * 0.34))), c('ink'))
      return
    }
    case 'snag': {
      solid(ctx, PATHS.whorl, c('ink')); solid(ctx, PATHS.wheel, c('ink')); solid(ctx, PATHS.band, c('ink'))
      const at = L * 0.08, run = 520, hold = 260, back = 620
      const reach = t < at + run ? v.snagAt * ease(clamp01((t - at) / run))
        : t < at + run + hold ? v.snagAt
        : snap(clamp01((t - at - run - hold) / back), v.snagAt, v.overshoot)
      fan(ctx, WHEEL, TOP, reach, c('achiote'))
      // the band kinks where the thread caught: a short Achiote stretch that slips back as the wheel snaps
      const kink = t < at + run ? 0 : t < at + run + hold ? 1 : 1 - pen(clamp01((t - at - run - hold) / (back * 0.6)))
      if (kink > 0) band(ctx, 0.08, 0.08 + 0.1 * kink, c('achiote'))
      return
    }
    case 'loading': {
      solid(ctx, PATHS.band, c('ink')); solid(ctx, PATHS.whorl, c('ink')); solid(ctx, PATHS.wheel, c('ink'))
      const wind = cubicBezier([0.45, 0, 0.55, 1])
      const on = wind(clamp01(t / (L * 0.72))), off = pen(clamp01((t - L * 0.78) / (L * 0.2)))
      band(ctx, off, on, c('malva'))
      fans(ctx, WHORL, t, L, 4, [c('malva'), c('ink')], ease, TOP + 0.5)
      return
    }
    case 'done': {
      const t0 = L * 0.05, clearAt = L - 620
      ctx.save()
      if (t >= clearAt) { const k = cubicBezier([0.65, 0, 0.35, 1])(clamp01((t - clearAt) / 520)); ctx.beginPath(); ctx.rect(MARK_W * k - 4, -20, MARK_W + 40, MARK_H + 40); ctx.clip() }
      for (const s of ['band', 'wheel', 'whorl'] as const) race(ctx, v, s, t - t0, FOLDS[s].map((d) => P[d]), c('ink'))
      ctx.restore()
    }
  }
}
/** Torcer: from `from` back to 0, carrying `over` past it (the other way), and settling */
function snap(q: number, from: number, over: number) {
  if (q < 0.55) { const u = cubicBezier([0.5, 0, 0.75, 0])(q / 0.55); return from - (from + over) * u }
  return -over * (1 - cubicBezier([0.22, 1, 0.36, 1])((q - 0.55) / 0.45))
}
/** one shape racing its folds from empty, then the ink (the bento's raceShape) */
function race(ctx: Ctx, v: V, s: 'band' | 'wheel' | 'whorl', t: number, folds: string[], ink: string) {
  const r = RACE[s], ease = cubicBezier(v.ease), stagger = 130
  const foldAt = (j: number) => r.delay + j * stagger + (j === 4 ? 80 : 0)
  for (let j = 0; j <= 4; j++) {
    const reach = ease(clamp01((t - foldAt(j)) / r.dur))
    if (reach <= 1e-5) continue
    const col = j === 4 ? ink : folds[j]
    if (s === 'band') band(ctx, 0, reach, col)
    else fan(ctx, s === 'wheel' ? WHEEL : WHORL, (r.start * Math.PI) / 180, reach, col)
  }
}

export function draw(ctx: Ctx, v: V, t: number, w: number, h: number) {
  const P = v.ground === 'nogal' ? NIGHT : DAY
  ctx.fillStyle = P.field; ctx.fillRect(0, 0, w, h)
  if (v.view === 'one') {
    const k = Math.min(w, h) * 0.62 / MARK_W
    ctx.save(); ctx.translate(w / 2 - (MARK_W * k) / 2, h / 2 - (MARK_H * k) / 2); ctx.scale(k, k)
    mood(ctx, v, v.mood as Mood, t, P); ctx.restore()
    return
  }
  // the board: five cells, the mark in each, its name under it
  const cw = w / MOODS.length, k = (cw * 0.62) / MARK_W, my = h * 0.36
  MOODS.forEach((m, i) => {
    const cx = cw * i + cw / 2
    ctx.save(); ctx.translate(cx - (MARK_W * k) / 2, my - (MARK_H * k) / 2); ctx.scale(k, k)
    mood(ctx, v, m.id, t, P); ctx.restore()
    if (i) { ctx.strokeStyle = v.ground === 'nogal' ? '#363534' : '#E0DEDD'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cw * i + 0.5, h * 0.1); ctx.lineTo(cw * i + 0.5, h * 0.9); ctx.stroke() }
    const ty = h * 0.7, x0 = cx - (MARK_W * k) / 2
    ctx.fillStyle = P.muted; ctx.font = `600 13px ${FONT.sans}`
    ;(ctx as Ctx & { letterSpacing: string }).letterSpacing = '1px'
    ctx.fillText(m.mood.toUpperCase(), x0, ty)
    ;(ctx as Ctx & { letterSpacing: string }).letterSpacing = '0px'
    ctx.fillStyle = P.ink; ctx.font = `400 44px ${FONT.serif}`; ctx.fillText(m.word, x0, ty + 50)
    ctx.font = `italic 400 19px ${FONT.serif}`; ctx.fillStyle = P.muted; ctx.fillText(m.gloss, x0, ty + 78)
    ctx.font = `400 14px ${FONT.sans}`; ctx.fillStyle = P.ink
    wrap(ctx, m.line, x0, ty + 112, MARK_W * k, 19)
  })
}
function wrap(ctx: Ctx, text: string, x: number, y: number, maxW: number, lh: number) {
  const out: string[] = []
  for (const wd of text.split(' ')) { const l = out[out.length - 1]; if (l && ctx.measureText(`${l} ${wd}`).width <= maxW) out[out.length - 1] = `${l} ${wd}`; else out.push(wd) }
  out.forEach((l, i) => ctx.fillText(l, x, y + i * lh))
}
