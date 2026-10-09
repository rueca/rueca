/* The demo photograph, painted procedurally so the lab works with no upload
   and no network: dusk sky, sun, layered ridges with atmospheric haze, a lake
   with a broken reflection, a glossy sphere on the shore, film grain.
   Lots of smooth gradients + hard edges + texture = a good dithering test. */

const hash = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }
const noise1 = (x: number) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return hash(i) * (1 - u) + hash(i + 1) * u }
const fbm1 = (x: number, oct = 5) => { let s = 0, a = 0.5, f = 1; for (let i = 0; i < oct; i++) { s += a * noise1(x * f + i * 17.3); f *= 2.03; a *= 0.5 } return s }

export function paintSample(W = 1600, H = 1000): ImageData {
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  const horizon = H * 0.66

  // sky
  const sky = ctx.createLinearGradient(0, 0, 0, horizon)
  sky.addColorStop(0, '#1f2a63'); sky.addColorStop(0.3, '#55408f'); sky.addColorStop(0.55, '#c0608a')
  sky.addColorStop(0.78, '#f0866a'); sky.addColorStop(0.93, '#ffc27f'); sky.addColorStop(1, '#ffe2b0')
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, horizon + 2)

  // sun glow + disc
  const sx = W * 0.64, sy = horizon - H * 0.06
  const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, W * 0.42)
  glow.addColorStop(0, 'rgba(255,236,190,0.95)'); glow.addColorStop(0.12, 'rgba(255,200,140,0.55)'); glow.addColorStop(0.45, 'rgba(255,140,110,0.12)'); glow.addColorStop(1, 'rgba(255,120,100,0)')
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, horizon + 2)
  ctx.fillStyle = '#fff4dc'; ctx.beginPath(); ctx.arc(sx, sy, H * 0.055, 0, Math.PI * 2); ctx.fill()

  // cloud streaks
  for (let i = 0; i < 14; i++) {
    const y = H * (0.12 + hash(i) * 0.38), x = W * hash(i + 40), w = W * (0.18 + hash(i + 9) * 0.35), h = H * (0.008 + hash(i + 3) * 0.022)
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1)
    const warm = y > H * 0.3
    g.addColorStop(0, warm ? 'rgba(255,170,150,0.45)' : 'rgba(190,140,220,0.35)'); g.addColorStop(1, 'rgba(255,170,150,0)')
    ctx.save(); ctx.translate(x, y); ctx.scale(w, h); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill(); ctx.restore()
  }

  // ridges, far → near, with haze
  const ridges = [
    { base: horizon - H * 0.13, amp: H * 0.16, freq: 2.2, top: '#b0607e', bot: '#d98a7f', seed: 3 },
    { base: horizon - H * 0.07, amp: H * 0.13, freq: 3.4, top: '#6b3f6e', bot: '#9a5a74', seed: 11 },
    { base: horizon - H * 0.02, amp: H * 0.09, freq: 5.1, top: '#3a2650', bot: '#4e3157', seed: 23 },
  ]
  for (const r of ridges) {
    const g = ctx.createLinearGradient(0, r.base - r.amp, 0, horizon)
    g.addColorStop(0, r.top); g.addColorStop(1, r.bot)
    ctx.fillStyle = g
    ctx.beginPath(); ctx.moveTo(0, horizon + 2)
    for (let x = 0; x <= W; x += 4) ctx.lineTo(x, r.base - Math.pow(fbm1((x / W) * r.freq + r.seed), 1.6) * r.amp * 1.6)
    ctx.lineTo(W, horizon + 2); ctx.closePath(); ctx.fill()
  }

  // lake: mirrored, darker sky
  ctx.save(); ctx.translate(0, horizon * 2); ctx.scale(1, -1)
  ctx.globalAlpha = 0.55; ctx.drawImage(c, 0, 0, W, horizon, 0, 0, W, horizon)
  ctx.restore()
  const lake = ctx.createLinearGradient(0, horizon, 0, H)
  lake.addColorStop(0, 'rgba(40,24,70,0.2)'); lake.addColorStop(1, 'rgba(12,8,30,0.8)')
  ctx.globalAlpha = 1; ctx.fillStyle = lake; ctx.fillRect(0, horizon, W, H - horizon)
  // sun path on the water
  for (let i = 0; i < 70; i++) {
    const y = horizon + 4 + Math.pow(hash(i + 100), 1.4) * (H - horizon) * 0.8
    const spread = 0.25 + ((y - horizon) / (H - horizon)) * 1.4
    const w = W * 0.05 * spread * (0.4 + hash(i + 7)), x = sx + (hash(i + 200) - 0.5) * W * 0.1 * spread
    ctx.fillStyle = `rgba(255,${200 + hash(i) * 40},${150 + hash(i + 1) * 60},${0.25 + hash(i + 2) * 0.45})`
    ctx.fillRect(x - w / 2, y, w, 1.5 + hash(i + 3) * 2.5)
  }

  // shore
  ctx.fillStyle = '#120c1f'
  ctx.beginPath(); ctx.moveTo(0, H)
  for (let x = 0; x <= W * 0.55; x += 4) { const t = x / (W * 0.55); ctx.lineTo(x, H * 0.84 + Math.pow(t, 2.2) * H * 0.2 - fbm1(x * 0.02 + 5, 3) * H * 0.025) }
  ctx.lineTo(W * 0.55, H); ctx.closePath(); ctx.fill()

  // sphere on the shore — lit from the sun, reflecting the sky
  const bx = W * 0.27, by = H * 0.76, br = H * 0.12
  ctx.fillStyle = 'rgba(0,0,0,0.45)'
  ctx.save(); ctx.translate(bx - br * 0.15, by + br * 0.95); ctx.scale(br * 1.3, br * 0.18); ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill(); ctx.restore()
  const body = ctx.createLinearGradient(bx, by - br, bx, by + br)
  body.addColorStop(0, '#f6b38a'); body.addColorStop(0.45, '#a6537a'); body.addColorStop(0.55, '#3b2654'); body.addColorStop(1, '#120b22')
  ctx.fillStyle = body; ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill()
  const shade = ctx.createRadialGradient(bx + br * 0.45, by - br * 0.35, br * 0.1, bx, by, br * 1.05)
  shade.addColorStop(0, 'rgba(255,220,180,0.0)'); shade.addColorStop(0.7, 'rgba(10,5,25,0.15)'); shade.addColorStop(1, 'rgba(10,5,25,0.65)')
  ctx.fillStyle = shade; ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill()
  const rim = ctx.createRadialGradient(bx + br * 0.9, by - br * 0.1, 0, bx + br * 0.9, by - br * 0.1, br * 0.9)
  rim.addColorStop(0, 'rgba(255,190,120,0.75)'); rim.addColorStop(1, 'rgba(255,190,120,0)')
  ctx.save(); ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.clip(); ctx.fillStyle = rim; ctx.fillRect(bx - br, by - br, br * 2, br * 2); ctx.restore()
  const spec = ctx.createRadialGradient(bx + br * 0.38, by - br * 0.48, 0, bx + br * 0.38, by - br * 0.48, br * 0.28)
  spec.addColorStop(0, 'rgba(255,255,245,1)'); spec.addColorStop(0.35, 'rgba(255,245,230,0.6)'); spec.addColorStop(1, 'rgba(255,240,220,0)')
  ctx.fillStyle = spec; ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill()

  // grass tufts on the shore
  ctx.strokeStyle = '#0b0714'; ctx.lineWidth = 1.6
  for (let i = 0; i < 260; i++) {
    const x = hash(i + 500) * W * 0.5, y0 = H * 0.86 + Math.pow(x / (W * 0.55), 2.2) * H * 0.2 + 4
    const h = 8 + hash(i + 800) * 34, lean = (hash(i + 900) - 0.5) * 14
    ctx.beginPath(); ctx.moveTo(x, y0); ctx.quadraticCurveTo(x + lean * 0.3, y0 - h * 0.6, x + lean, y0 - h); ctx.stroke()
  }

  // grain + soft vignette
  const img = ctx.getImageData(0, 0, W, H)
  const d = img.data
  let seed = 1234567
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4
      const dx = x / W - 0.5, dy = y / H - 0.5
      const v = 1 - Math.min(0.35, (dx * dx + dy * dy) * 0.9)
      const g = (rnd() + rnd() - 1) * 9
      d[i] = d[i] * v + g; d[i + 1] = d[i + 1] * v + g; d[i + 2] = d[i + 2] * v + g
    }
  return img
}
