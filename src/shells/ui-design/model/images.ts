/* ---------------------------------------------------------------------------
   Procedural demo photography. No network: every "photo" in the demo file is
   painted here once, cached as a data URL and referenced by key from image
   fills (`image: 'ridge'`). Uploaded images are stored as data URLs instead.
--------------------------------------------------------------------------- */

const cache = new Map<string, string>()
const imgCache = new Map<string, HTMLImageElement>()

function rng(seed: number) {
  let s = seed >>> 0
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
/** 1D fractal noise from a few detuned sines — cheap and smooth enough for ridgelines */
function ridge(seed: number, oct = 5) {
  const r = rng(seed)
  const waves = Array.from({ length: oct }, (_, i) => ({ f: (0.6 + r()) * 2 ** i, p: r() * 100, a: 1 / 2 ** (i * 0.9) }))
  const norm = waves.reduce((s, w) => s + w.a, 0)
  return (x: number) => waves.reduce((s, w) => s + Math.sin(x * w.f * Math.PI * 2 + w.p) * w.a, 0) / norm
}

function canvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  return [c, c.getContext('2d')!] as const
}

function grain(ctx: CanvasRenderingContext2D, w: number, h: number, amt = 10, seed = 3) {
  const r = rng(seed)
  const d = ctx.getImageData(0, 0, w, h)
  for (let i = 0; i < d.data.length; i += 4) {
    const n = (r() - 0.5) * amt
    d.data[i] += n; d.data[i + 1] += n; d.data[i + 2] += n
  }
  ctx.putImageData(d, 0, 0)
}

function mountains(ctx: CanvasRenderingContext2D, w: number, h: number, o: { sky: string[]; layers: string[]; sun?: [number, number, number]; seed: number; horizon: number; amp: number }) {
  const g = ctx.createLinearGradient(0, 0, 0, h * o.horizon)
  o.sky.forEach((c, i) => g.addColorStop(i / (o.sky.length - 1), c))
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  if (o.sun) {
    const [sx, sy, sr] = o.sun
    const glow = ctx.createRadialGradient(sx * w, sy * h, 0, sx * w, sy * h, sr * w * 5)
    glow.addColorStop(0, 'rgba(255,240,200,.85)'); glow.addColorStop(0.2, 'rgba(255,210,150,.35)'); glow.addColorStop(1, 'rgba(255,200,150,0)')
    ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = 'rgba(255,248,230,.95)'; ctx.beginPath(); ctx.arc(sx * w, sy * h, sr * w, 0, Math.PI * 2); ctx.fill()
  }
  const n = o.layers.length
  o.layers.forEach((col, i) => {
    const f = ridge(o.seed + i * 17, 6)
    const base = h * (o.horizon - 0.12 + (i / n) * (1.05 - o.horizon))
    const amp = h * o.amp * (1 - i / (n + 1))
    ctx.fillStyle = col
    ctx.beginPath(); ctx.moveTo(0, h)
    for (let x = 0; x <= w; x += 2) ctx.lineTo(x, base - (f(x / w * (0.8 + i * 0.25)) * 0.5 + 0.5) * amp)
    ctx.lineTo(w, h); ctx.closePath(); ctx.fill()
    // haze between layers — atmospheric perspective
    const haze = ctx.createLinearGradient(0, base - amp, 0, base + h * 0.12)
    haze.addColorStop(0, 'rgba(255,255,255,0)'); haze.addColorStop(1, `rgba(255,236,214,${0.18 * (1 - i / n)})`)
    ctx.fillStyle = haze; ctx.fillRect(0, base - amp, w, h * 0.3)
  })
}

const painters: Record<string, () => string> = {
  ridge: () => {
    const [c, ctx] = canvas(720, 480)
    mountains(ctx, 720, 480, {
      sky: ['#2f3d6b', '#8d6a8f', '#f0a868', '#fcd9a8'], seed: 11, horizon: 0.62, amp: 0.34, sun: [0.66, 0.5, 0.045],
      layers: ['#b98c95', '#8c6a83', '#5b4a6b', '#36384f', '#1e2a2e'],
    })
    grain(ctx, 720, 480, 9)
    return c.toDataURL('image/jpeg', 0.88)
  },
  lake: () => {
    const [c, ctx] = canvas(720, 480)
    mountains(ctx, 720, 290, {
      sky: ['#8fb7d8', '#c9dfe9', '#eef3ee'], seed: 5, horizon: 0.75, amp: 0.55,
      layers: ['#9fb4c0', '#6f8c95', '#3f5d5c', '#24403b'],
    })
    // reflection
    ctx.save(); ctx.translate(0, 580); ctx.scale(1, -1); ctx.globalAlpha = 0.55; ctx.drawImage(c, 0, 0, 720, 290, 0, 0, 720, 290); ctx.restore()
    const water = ctx.createLinearGradient(0, 290, 0, 480)
    water.addColorStop(0, 'rgba(60,96,104,.35)'); water.addColorStop(1, 'rgba(22,48,52,.85)')
    ctx.fillStyle = water; ctx.fillRect(0, 290, 720, 190)
    const r = rng(9)
    ctx.strokeStyle = 'rgba(255,255,255,.18)'
    for (let i = 0; i < 60; i++) { const y = 292 + r() ** 1.6 * 188, x = r() * 720; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 20 + r() * 60, y); ctx.stroke() }
    grain(ctx, 720, 480, 8)
    return c.toDataURL('image/jpeg', 0.88)
  },
  forest: () => {
    const [c, ctx] = canvas(480, 480)
    const g = ctx.createLinearGradient(0, 0, 0, 480)
    g.addColorStop(0, '#dfe7dc'); g.addColorStop(1, '#a9bfa7')
    ctx.fillStyle = g; ctx.fillRect(0, 0, 480, 480)
    const r = rng(21)
    const rows = ['#8fa98f', '#6e8f73', '#4b6e55', '#2f4f3c', '#1b3328']
    rows.forEach((col, i) => {
      ctx.fillStyle = col
      const y0 = 150 + i * 70
      for (let x = -20; x < 500; x += 16 + r() * 22) {
        const th = 90 + r() * 120 + i * 30, tw = th * (0.28 + r() * 0.08)
        ctx.beginPath(); ctx.moveTo(x, y0 - th)
        for (let k = 0; k < 4; k++) { const yy = y0 - th + (th * (k + 1)) / 4; ctx.lineTo(x + (tw * (k + 1)) / 4, yy); ctx.lineTo(x + (tw * k) / 8, yy - 4) }
        ctx.lineTo(x - tw * 0.9, y0); ctx.closePath(); ctx.fill()
        ctx.fillRect(x - 2, y0 - 6, 4, 40)
      }
      ctx.fillRect(0, y0 + 10, 480, 480)
      const fog = ctx.createLinearGradient(0, y0 - 140, 0, y0 + 30)
      fog.addColorStop(0, 'rgba(230,238,228,0)'); fog.addColorStop(1, `rgba(230,238,228,${0.35 - i * 0.06})`)
      ctx.fillStyle = fog; ctx.fillRect(0, y0 - 140, 480, 170)
    })
    grain(ctx, 480, 480, 10)
    return c.toDataURL('image/jpeg', 0.88)
  },
  coast: () => {
    const [c, ctx] = canvas(480, 480)
    const g = ctx.createLinearGradient(0, 0, 0, 260)
    g.addColorStop(0, '#9cc6e6'); g.addColorStop(1, '#e7eef0')
    ctx.fillStyle = g; ctx.fillRect(0, 0, 480, 260)
    const sea = ctx.createLinearGradient(0, 240, 0, 480)
    sea.addColorStop(0, '#5f97ad'); sea.addColorStop(1, '#2c6378')
    ctx.fillStyle = sea; ctx.fillRect(0, 240, 480, 240)
    const r = rng(4)
    ctx.strokeStyle = 'rgba(255,255,255,.3)'
    for (let i = 0; i < 40; i++) { const y = 250 + r() ** 1.4 * 220; ctx.beginPath(); ctx.moveTo(r() * 480, y); ctx.lineTo(r() * 480, y + 1); ctx.stroke() }
    const f = ridge(8, 5)
    ctx.fillStyle = '#6b6a4e'
    ctx.beginPath(); ctx.moveTo(0, 480)
    for (let y = 480; y >= 120; y -= 2) ctx.lineTo(180 + f(y / 300) * 40 - (480 - y) * 0.18, y)
    ctx.lineTo(0, 120); ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#4a5a3b'
    ctx.beginPath(); ctx.moveTo(0, 130)
    for (let x = 0; x <= 200; x += 4) ctx.lineTo(x, 130 + Math.max(0, x - 120) * 0.5 + f(x / 80) * 8)
    ctx.lineTo(0, 300); ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#e9dcc0'
    ctx.beginPath(); ctx.moveTo(140, 480); ctx.quadraticCurveTo(300, 420, 480, 440); ctx.lineTo(480, 480); ctx.fill()
    grain(ctx, 480, 480, 9)
    return c.toDataURL('image/jpeg', 0.88)
  },
  dunes: () => {
    const [c, ctx] = canvas(720, 480)
    mountains(ctx, 720, 480, {
      sky: ['#f6c79a', '#f9dfc0', '#fbeee0'], seed: 33, horizon: 0.58, amp: 0.22, sun: [0.3, 0.42, 0.05],
      layers: ['#e7b58c', '#d99a6c', '#c27a4d', '#a35c37'],
    })
    grain(ctx, 720, 480, 8)
    return c.toDataURL('image/jpeg', 0.88)
  },
  avatar: () => {
    const [c, ctx] = canvas(240, 240)
    const g = ctx.createLinearGradient(0, 0, 240, 240)
    g.addColorStop(0, '#f5c6a5'); g.addColorStop(1, '#e48f72')
    ctx.fillStyle = g; ctx.fillRect(0, 0, 240, 240)
    ctx.fillStyle = '#3b2a25'; ctx.beginPath(); ctx.ellipse(120, 104, 62, 66, 0, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#c98b6b'; ctx.beginPath(); ctx.ellipse(120, 196, 78, 50, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(42, 196, 156, 60)
    ctx.fillStyle = '#d9a184'; ctx.fillRect(104, 140, 32, 40)
    ctx.fillStyle = '#e8b294'; ctx.beginPath(); ctx.ellipse(120, 112, 42, 50, 0, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#3b2a25'; ctx.beginPath(); ctx.ellipse(120, 74, 48, 26, 0, Math.PI, 0); ctx.fill()
    ctx.fillStyle = '#2e6b56'; ctx.beginPath(); ctx.ellipse(120, 214, 82, 40, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(38, 214, 164, 40)
    grain(ctx, 240, 240, 6)
    return c.toDataURL('image/jpeg', 0.9)
  },
}

export const IMAGE_KEYS = Object.keys(painters)
export const IMAGE_LABELS: Record<string, string> = { ridge: 'Ridge at dusk', lake: 'Alpine lake', forest: 'Redwoods', coast: 'Coast', dunes: 'Dunes', avatar: 'Portrait' }

/** data URL for a key, or the value itself when it is already a URL */
export function imageURL(key?: string): string {
  if (!key) return ''
  if (key.startsWith('data:') || key.startsWith('blob:')) return key
  let url = cache.get(key)
  if (!url && painters[key]) { url = painters[key](); cache.set(key, url) }
  return url ?? ''
}

/** decoded image element for canvas drawing */
export function loadImage(key: string): Promise<HTMLImageElement> {
  const url = imageURL(key)
  const hit = imgCache.get(url)
  if (hit?.complete) return Promise.resolve(hit)
  return new Promise((res, rej) => {
    const im = hit ?? new Image()
    im.onload = () => res(im)
    im.onerror = rej
    if (!hit) { im.src = url; imgCache.set(url, im) }
  })
}
export const imageSync = (key: string) => imgCache.get(imageURL(key))
