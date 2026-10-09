/* ---------------------------------------------------------------------------
   The renderer: draw(ctx, comp, t, W, H) — pure in (composition, time), so
   scrubbing, preview and frame-stepped MP4 export are the same code path.
   Images are procedural (no network): generated once per (kind, seed, size)
   and cached.
--------------------------------------------------------------------------- */
import { cubicBezier } from '@kit/core/ease'
import { ASPECTS, type Clip, type Comp, type FontKey, type ImageGen, type Motion } from './comp'

/* ---------- maths ---------- */
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
function rng(seed: number) {
  let a = seed >>> 0 || 1
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

export const FONTS: Record<FontKey, { label: string; css: string }> = {
  sans: { label: 'Inter', css: '"Inter Variable", Inter, system-ui, sans-serif' },
  display: { label: 'Inter Display', css: '"Inter Variable", Inter, system-ui, sans-serif' },
  serif: { label: 'Serif', css: '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif' },
  mono: { label: 'Mono', css: 'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace' },
}

/* ---------- layout ---------- */
/** The size unit U (px) for a frame: 1080 in the frame the video was designed
    for; other aspects scale it to fit (min of the two axis ratios), so text and
    shapes keep their spacing instead of colliding when the frame gets shorter. */
export function frameUnit(comp: Pick<Comp, 'design'>, W: number, H: number) {
  const d = ASPECTS[comp.design ?? '9:16']
  return 1080 * Math.min(W / d.w, H / d.h)
}
export interface Box { cx: number; cy: number; w: number; h: number; rotation: number }
const measurer = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d')! : null

export function textLayout(ctx: CanvasRenderingContext2D, c: Clip, W: number, U: number, chars = Infinity) {
  const px = ((c.size ?? 80) * U) / 1080
  ctx.font = `${c.weight ?? 600} ${px}px ${FONTS[c.font ?? 'sans'].css}`
  try { (ctx as unknown as { letterSpacing: string }).letterSpacing = `${(c.tracking ?? 0) * px}px` } catch { /* unsupported */ }
  const maxW = (c.maxWidth ?? 0.9) * W
  const lines: string[] = []
  for (const para of (c.text ?? '').split('\n')) {
    let line = ''
    for (const word of para.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word
      if (line && ctx.measureText(next).width > maxW) { lines.push(line); line = word } else line = next
    }
    lines.push(line)
  }
  // typewriter: reveal the first `chars` characters across lines
  let left = chars
  const shown = lines.map((l) => { const s = l.slice(0, Math.max(0, left)); left -= l.length + 1; return s })
  const lh = px * (c.lineHeight ?? 1.1)
  const widths = lines.map((l) => ctx.measureText(l).width)
  return { px, lh, lines, shown, widths, w: Math.max(1, ...widths), h: lh * lines.length, total: (c.text ?? '').length }
}

/** The clip's layout box in frame pixels, ignoring animation. Used for hit tests and the selection frame. */
export function clipBox(c: Clip, W: number, H: number, U: number): Box {
  const S = U
  if (c.kind === 'bg' || (c.kind === 'image' && c.frame)) return { cx: W / 2, cy: H / 2, w: W, h: H, rotation: 0 }
  if (c.kind === 'progress') { const th = ((c.thickness ?? 8) * S) / 1080; return { cx: W / 2, cy: c.edge === 'bottom' ? H - th * 3 : th * 3, w: W - th * 6, h: th, rotation: 0 } }
  if (c.kind === 'text') {
    const L = textLayout(measurer!, c, W, U)
    const pad = c.highlight ? L.px * 0.3 : 0
    return { cx: c.x * W + (c.align === 'left' ? L.w / 2 : c.align === 'right' ? -L.w / 2 : 0), cy: c.y * H, w: L.w + pad * 2, h: L.h + pad, rotation: c.rotation }
  }
  // shapes and images: U units, then contained in 94% of the frame (re-layout across aspects)
  let w = c.w * S, h = c.h * S
  const k = Math.min(1, (W * 0.94) / w, (H * 0.94) / h)
  w *= k; h *= k
  return { cx: c.x * W, cy: c.y * H, w, h, rotation: c.rotation }
}

/* ---------- motion presets ---------- */
interface Fx { alpha: number; dx: number; dy: number; scale: number; blur: number; wipe: [number, number]; chars: number }
function motionAt(c: Clip, local: number, U: number): Fx {
  const fx: Fx = { alpha: 1, dx: 0, dy: 0, scale: 1, blur: 0, wipe: [0, 1], chars: Infinity }
  const S = U
  const apply = (m: Motion, k: number, dir: 1 | -1) => {
    // k: 0 = fully out, 1 = fully in. dir: -1 for exit (keep moving the same way)
    const off = 1 - k
    switch (m.preset) {
      case 'fade': fx.alpha *= k; break
      case 'slide-up': fx.dy += off * 0.07 * S * dir; fx.alpha *= clamp01(k * 1.6); break
      case 'slide-down': fx.dy -= off * 0.07 * S * dir; fx.alpha *= clamp01(k * 1.6); break
      case 'slide-left': fx.dx += off * 0.1 * S * dir; fx.alpha *= clamp01(k * 1.6); break
      case 'slide-right': fx.dx -= off * 0.1 * S * dir; fx.alpha *= clamp01(k * 1.6); break
      case 'pop': fx.scale *= 0.55 + 0.45 * k; fx.alpha *= clamp01(k * 2.2); break
      case 'blur': fx.blur += off * 0.03 * S; fx.alpha *= clamp01(k * 1.4); break
      case 'wipe': if (dir > 0) fx.wipe = [0, clamp01(k)]; else fx.wipe = [clamp01(off), 1]; break
      case 'typewriter': fx.chars = Math.floor(k * 1e6); break
    }
  }
  if (c.enter.preset !== 'none' && c.enter.dur > 0 && local < c.enter.dur) apply(c.enter, cubicBezier(c.enter.ease)(clamp01(local / c.enter.dur)), 1)
  const exitAt = c.dur - c.exit.dur
  if (c.exit.preset !== 'none' && c.exit.dur > 0 && local > exitAt) apply(c.exit, 1 - cubicBezier(c.exit.ease)(clamp01((local - exitAt) / c.exit.dur)), -1)
  return fx
}

/* ---------- procedural images ---------- */
const imgCache = new Map<string, HTMLCanvasElement>()
export function proceduralImage(kind: ImageGen, seed: number, w: number, h: number): HTMLCanvasElement {
  const W = Math.max(64, Math.round(w / 64) * 64), H = Math.max(64, Math.round(h / 64) * 64)
  const key = `${kind}:${seed}:${W}x${H}`
  const hit = imgCache.get(key)
  if (hit) return hit
  if (imgCache.size > 40) imgCache.clear()
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const g = c.getContext('2d')!
  const r = rng(seed * 9301 + 49297)
  const S = Math.min(W, H)
  if (kind === 'aurora' || kind === 'mesh') {
    const pal = kind === 'aurora'
      ? ['#0B0820', '#3B2BBF', '#18C3B1', '#B84DFF', '#FF5FA2', '#2A6BFF']
      : ['#FFE7D6', '#FF8A65', '#FF5C8A', '#8E7CFF', '#58C4FF', '#FFD166']
    g.fillStyle = pal[0]; g.fillRect(0, 0, W, H)
    for (let i = 0; i < (kind === 'aurora' ? 7 : 6); i++) {
      const x = r() * W, y = (kind === 'aurora' ? 0.15 + r() * 0.6 : r()) * H, rad = (0.35 + r() * 0.5) * S
      const col = pal[1 + Math.floor(r() * (pal.length - 1))]
      const grd = g.createRadialGradient(x, y, 0, x, y, rad)
      grd.addColorStop(0, col + (kind === 'aurora' ? 'cc' : 'ff'))
      grd.addColorStop(1, col + '00')
      g.globalCompositeOperation = kind === 'aurora' ? 'screen' : 'source-over'
      g.fillStyle = grd
      g.fillRect(0, 0, W, H)
    }
    g.globalCompositeOperation = 'source-over'
    if (kind === 'aurora') { // vertical curtains
      for (let i = 0; i < 26; i++) {
        const x = r() * W, wd = (0.01 + r() * 0.04) * W
        const grd = g.createLinearGradient(0, H * 0.1, 0, H * 0.75)
        grd.addColorStop(0, 'rgba(120,255,220,0)'); grd.addColorStop(0.5, `rgba(140,255,230,${0.05 + r() * 0.08})`); grd.addColorStop(1, 'rgba(120,255,220,0)')
        g.fillStyle = grd; g.fillRect(x, 0, wd, H)
      }
      for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(255,255,255,${r() * 0.7})`; const s = r() * 1.6 + 0.4; g.fillRect(r() * W, r() * H * 0.5, s, s) }
    }
  } else if (kind === 'sunset') {
    const grd = g.createLinearGradient(0, 0, 0, H)
    grd.addColorStop(0, '#2B1055'); grd.addColorStop(0.45, '#D53369'); grd.addColorStop(0.7, '#FF9A5A'); grd.addColorStop(1, '#2B1055')
    g.fillStyle = grd; g.fillRect(0, 0, W, H)
    const sx = W * (0.35 + r() * 0.3), sy = H * 0.58, sr = S * 0.22
    const sun = g.createLinearGradient(0, sy - sr, 0, sy + sr)
    sun.addColorStop(0, '#FFE29A'); sun.addColorStop(1, '#FF6A88')
    g.fillStyle = sun; g.beginPath(); g.arc(sx, sy, sr, 0, Math.PI * 2); g.fill()
    g.fillStyle = '#2B1055'
    for (let i = 0; i < 9; i++) { const y = sy + i * i * S * 0.0035 + S * 0.01; g.fillRect(0, y, W, 2 + i * 1.2) }
    g.fillStyle = '#1A0B33'; g.beginPath(); g.moveTo(0, H)
    for (let x = 0; x <= W; x += W / 12) g.lineTo(x, H * 0.72 + Math.sin(x * 0.01 + seed) * S * 0.03 + r() * S * 0.04)
    g.lineTo(W, H); g.fill()
  } else if (kind === 'app') {
    drawAppScreen(g, W, H, r)
  }
  // film grain, very light
  const img = g.getImageData(0, 0, W, H)
  for (let i = 0; i < img.data.length; i += 4) { const nz = (r() - 0.5) * 10; img.data[i] += nz; img.data[i + 1] += nz; img.data[i + 2] += nz }
  g.putImageData(img, 0, 0)
  imgCache.set(key, c)
  return c
}

function drawAppScreen(g: CanvasRenderingContext2D, W: number, H: number, r: () => number) {
  const u = W / 100
  g.fillStyle = '#F6F4FF'; g.fillRect(0, 0, W, H)
  const font = '"Inter Variable", Inter, system-ui, sans-serif'
  g.fillStyle = '#16122B'; g.font = `700 ${u * 6.4}px ${font}`; g.textBaseline = 'alphabetic'
  g.fillText('This week', u * 7, u * 16)
  g.fillStyle = '#8A85A8'; g.font = `500 ${u * 3.4}px ${font}`
  g.fillText('12 events · 3 focus blocks', u * 7, u * 22)
  g.fillStyle = '#6E5BFF'; g.beginPath(); g.arc(W - u * 11, u * 13, u * 4.4, 0, Math.PI * 2); g.fill()
  g.fillStyle = '#FFFFFF'; g.font = `700 ${u * 3.4}px ${font}`; g.textAlign = 'center'; g.fillText('MK', W - u * 11, u * 14.2); g.textAlign = 'left'
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const top = u * 30, colW = (W - u * 14) / 7
  days.forEach((d, i) => {
    const x = u * 7 + i * colW
    g.fillStyle = i === 2 ? '#6E5BFF' : '#8A85A8'; g.font = `600 ${u * 3}px ${font}`; g.textAlign = 'center'
    g.fillText(d, x + colW / 2, top)
    g.fillStyle = i === 2 ? '#16122B' : '#4A4566'; g.font = `600 ${u * 3.6}px ${font}`
    g.fillText(String(12 + i), x + colW / 2, top + u * 5.4)
  })
  g.textAlign = 'left'
  const gridTop = top + u * 10, gridH = H - gridTop - u * 26
  g.strokeStyle = '#E6E2F6'; g.lineWidth = Math.max(1, u * 0.15)
  for (let i = 0; i <= 8; i++) { const y = gridTop + (i / 8) * gridH; g.beginPath(); g.moveTo(u * 7, y); g.lineTo(W - u * 7, y); g.stroke() }
  const cols = ['#6E5BFF', '#FF6B9A', '#18B8A6', '#FFB020', '#4C8DFF']
  for (let d = 0; d < 7; d++) {
    let y = gridTop + r() * gridH * 0.15
    while (y < gridTop + gridH * 0.85) {
      const h = (0.08 + r() * 0.16) * gridH
      if (r() > 0.35) {
        const col = cols[Math.floor(r() * cols.length)]
        const x = u * 7 + d * colW + u * 0.6
        g.fillStyle = col + '2a'; g.beginPath(); g.roundRect(x, y, colW - u * 1.2, Math.min(h, gridTop + gridH - y), u * 1.4); g.fill()
        g.fillStyle = col; g.beginPath(); g.roundRect(x, y, u * 0.8, Math.min(h, gridTop + gridH - y), u * 0.4); g.fill()
      }
      y += h + r() * gridH * 0.08
    }
  }
  // focus card
  const cy = H - u * 22
  g.fillStyle = '#16122B'; g.beginPath(); g.roundRect(u * 7, cy, W - u * 14, u * 16, u * 4); g.fill()
  g.fillStyle = '#B9AEFF'; g.font = `600 ${u * 3}px ${font}`; g.fillText('Next up · 10:30', u * 12, cy + u * 6.4)
  g.fillStyle = '#FFFFFF'; g.font = `700 ${u * 4.4}px ${font}`; g.fillText('Design review', u * 12, cy + u * 12)
}

/* ---------- draw ---------- */
export interface DrawOpts { matte: string; skipMuted?: boolean }

export function drawComp(ctx: CanvasRenderingContext2D, comp: Comp, t: number, W: number, H: number, opts: DrawOpts) {
  ctx.save()
  ctx.fillStyle = opts.matte
  ctx.fillRect(0, 0, W, H)
  const S = frameUnit(comp, W, H)
  // bottom track first
  for (let ti = comp.tracks.length - 1; ti >= 0; ti--) {
    const tr = comp.tracks[ti]
    if (tr.muted) continue
    for (const c of comp.clips) {
      if (c.track !== tr.id) continue
      const local = t - c.start
      if (local < 0 || local >= c.dur) continue
      drawClip(ctx, c, local, W, H, S)
    }
  }
  ctx.restore()
}

function drawClip(ctx: CanvasRenderingContext2D, c: Clip, local: number, W: number, H: number, S: number) {
  const fx = motionAt(c, local, S)
  if (fx.alpha <= 0.001) return
  const b = clipBox(c, W, H, S)
  ctx.save()
  ctx.globalAlpha = Math.max(0, Math.min(1, c.opacity * fx.alpha))
  if (fx.blur > 0.3) ctx.filter = `blur(${fx.blur.toFixed(1)}px)`
  ctx.translate(b.cx + fx.dx, b.cy + fx.dy)
  ctx.rotate((b.rotation * Math.PI) / 180)
  ctx.scale(fx.scale, fx.scale)
  if (fx.wipe[0] > 0 || fx.wipe[1] < 1) {
    ctx.beginPath()
    ctx.rect(-b.w / 2 + fx.wipe[0] * b.w - 1, -b.h / 2 - S, (fx.wipe[1] - fx.wipe[0]) * b.w + 2, b.h + S * 2)
    ctx.clip()
  }
  switch (c.kind) {
    case 'bg': {
      const a = ((c.angle ?? 180) - 90) * (Math.PI / 180)
      const len = Math.abs(W * Math.cos(a)) + Math.abs(H * Math.sin(a))
      const g = ctx.createLinearGradient(-Math.cos(a) * len / 2, -Math.sin(a) * len / 2, Math.cos(a) * len / 2, Math.sin(a) * len / 2)
      g.addColorStop(0, c.from ?? '#000'); g.addColorStop(1, c.to ?? '#222')
      ctx.fillStyle = g; ctx.fillRect(-W / 2, -H / 2, W, H)
      break
    }
    case 'progress': {
      const p = Math.max(0, Math.min(1, local / c.dur))
      const r = b.h / 2
      ctx.fillStyle = c.trackColor ?? '#ffffff33'; ctx.beginPath(); ctx.roundRect(-b.w / 2, -b.h / 2, b.w, b.h, r); ctx.fill()
      ctx.fillStyle = c.fill ?? '#fff'; ctx.beginPath(); ctx.roundRect(-b.w / 2, -b.h / 2, Math.max(b.h, b.w * p), b.h, r); ctx.fill()
      break
    }
    case 'shape': {
      const fill = c.fill ?? '#fff'
      if (c.shape === 'circle' || c.shape === 'ring') {
        ctx.beginPath(); ctx.ellipse(0, 0, b.w / 2, b.h / 2, 0, 0, Math.PI * 2)
        if (c.shape === 'ring') { ctx.lineWidth = (c.stroke ?? 0.02) * S; ctx.strokeStyle = fill; ctx.stroke() } else { ctx.fillStyle = fill; ctx.fill() }
      } else if (c.shape === 'blob') {
        const rr = rng(Math.round(c.w * 1000 + c.h * 7))
        ctx.beginPath()
        const n = 7, pts = Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2, k = 0.78 + rr() * 0.22; return [Math.cos(a) * (b.w / 2) * k, Math.sin(a) * (b.h / 2) * k] })
        for (let i = 0; i < n; i++) {
          const p0 = pts[i], p1 = pts[(i + 1) % n]
          const mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2
          if (i === 0) ctx.moveTo(mx, my)
          const p2 = pts[(i + 2) % n]
          ctx.quadraticCurveTo(p1[0], p1[1], (p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2)
        }
        ctx.closePath(); ctx.fillStyle = fill; ctx.fill()
      } else {
        ctx.beginPath(); ctx.roundRect(-b.w / 2, -b.h / 2, b.w, b.h, Math.min((c.radius ?? 0) * S, b.w / 2, b.h / 2)); ctx.fillStyle = fill; ctx.fill()
      }
      break
    }
    case 'image': {
      const img = proceduralImage(c.image ?? 'mesh', c.seed ?? 1, Math.min(b.w, 1600), Math.min(b.h, 1600) * (b.h > 1600 ? 1 : 1))
      const kb = 1 + (c.kenBurns ?? 0) * (local / c.dur)
      ctx.save()
      ctx.beginPath(); ctx.roundRect(-b.w / 2, -b.h / 2, b.w, b.h, Math.min((c.radius ?? 0) * S, b.w / 2, b.h / 2)); ctx.clip()
      const k = Math.max(b.w / img.width, b.h / img.height) * kb
      ctx.drawImage(img, (-img.width * k) / 2, (-img.height * k) / 2, img.width * k, img.height * k)
      ctx.restore()
      if (!c.frame && (c.radius ?? 0) > 0) { // device-ish edge
        ctx.lineWidth = S * 0.004; ctx.strokeStyle = 'rgba(255,255,255,0.18)'
        ctx.beginPath(); ctx.roundRect(-b.w / 2, -b.h / 2, b.w, b.h, Math.min((c.radius ?? 0) * S, b.w / 2, b.h / 2)); ctx.stroke()
      }
      break
    }
    case 'text': {
      const L = textLayout(ctx, c, W, S, fx.chars === Infinity ? Infinity : Math.floor((fx.chars / 1e6) * (c.text ?? '').length))
      ctx.textBaseline = 'middle'
      ctx.textAlign = c.align === 'left' ? 'left' : c.align === 'right' ? 'right' : 'center'
      const x0 = c.align === 'left' ? -L.w / 2 : c.align === 'right' ? L.w / 2 : 0
      L.lines.forEach((line, i) => {
        const y = -L.h / 2 + L.lh * (i + 0.5)
        if (c.highlight) {
          const lw = L.widths[i], pad = L.px * 0.22
          const lx = c.align === 'left' ? x0 : c.align === 'right' ? x0 - lw : -lw / 2
          ctx.fillStyle = c.highlight
          ctx.beginPath(); ctx.roundRect(lx - pad, y - L.lh / 2 + pad * 0.2, lw + pad * 2, L.lh - pad * 0.4, pad * 0.8); ctx.fill()
        }
        ctx.fillStyle = c.color ?? '#fff'
        ctx.fillText(L.shown[i] ?? line, x0, y)
      })
      break
    }
  }
  ctx.restore()
}

/** Topmost visible clip under a frame-space point at time t. */
export function hitTest(comp: Comp, t: number, W: number, H: number, x: number, y: number): Clip | null {
  const U = frameUnit(comp, W, H)
  for (const tr of comp.tracks) {
    if (tr.muted) continue
    const clips = comp.clips.filter((c) => c.track === tr.id && t >= c.start && t < c.start + c.dur && c.kind !== 'bg')
    for (const c of clips.reverse()) {
      const b = clipBox(c, W, H, U)
      const a = (-b.rotation * Math.PI) / 180
      const dx = x - b.cx, dy = y - b.cy
      const lx = dx * Math.cos(a) - dy * Math.sin(a), ly = dx * Math.sin(a) + dy * Math.cos(a)
      const pad = Math.min(W, H) * 0.01
      if (Math.abs(lx) <= b.w / 2 + pad && Math.abs(ly) <= b.h / 2 + pad) return c
    }
  }
  return null
}
