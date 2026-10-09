/* ---------------------------------------------------------------------------
   The sample photo, generated: a lake at dusk under layered ridges. Built so
   every develop control has something to bite on — a clipped sun for the
   highlight warning, crushed tree shadows, a blue sky, green meadow and warm
   wildflowers for the colour mixer, haze for dehaze, fine grass for texture.
   Deterministic (seeded), ~2000 × 1333, no network.
--------------------------------------------------------------------------- */

function mulberry(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* Integer lattice hash: multiply–xorshift mixing with arbitrary odd constants of our own. */
const mix32 = (x: number, y: number) => {
  let h = (Math.imul(x | 0, 0x2c1b3c6d) ^ Math.imul(y | 0, 0x297a2d39)) + 0x6f1d
  h = Math.imul(h ^ (h >>> 15), 0x2c9277b5)
  h ^= h >>> 13
  return (h >>> 0) / 4294967296
}
const hash = (n: number) => mix32(n, 0x51ed)
const smooth = (t: number) => t * t * (3 - 2 * t)
const noise1 = (x: number) => { const i = Math.floor(x), f = x - i; return hash(i) + (hash(i + 1) - hash(i)) * smooth(f) }
const fbm1 = (x: number, oct = 5) => { let v = 0, a = 0.5, f = 1; for (let i = 0; i < oct; i++) { v += a * noise1(x * f + i * 23.9); f *= 1.94; a *= 0.5 } return v }
const hash2 = (x: number, y: number) => mix32(x, y)
const noise2 = (x: number, y: number) => {
  const ix = Math.floor(x), iy = Math.floor(y), fx = smooth(x - ix), fy = smooth(y - iy)
  const a = hash2(ix, iy), b = hash2(ix + 1, iy), c = hash2(ix, iy + 1), d = hash2(ix + 1, iy + 1)
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy
}
const fbm2 = (x: number, y: number, oct = 5) => { let v = 0, a = 0.5, f = 1; for (let i = 0; i < oct; i++) { v += a * noise2(x * f + i * 4.3, y * f - i * 6.7); f *= 1.97; a *= 0.5 } return v }

export function generateLandscape(W = 2000, H = 1333, seed = 7): HTMLCanvasElement {
  const rnd = mulberry(seed)
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')!
  const horizon = H * 0.62
  const shore = H * 0.705
  const sun = { x: W * 0.655, y: H * 0.415 }

  /* sky */
  const sky = g.createLinearGradient(0, 0, 0, shore)
  sky.addColorStop(0, '#203a68')
  sky.addColorStop(0.3, '#46699f')
  sky.addColorStop(0.56, '#9c97bb')
  sky.addColorStop(0.76, '#eaa985')
  sky.addColorStop(0.9, '#ffcf98')
  sky.addColorStop(1, '#ffe3b4')
  g.fillStyle = sky
  g.fillRect(0, 0, W, shore)

  /* sun glow + disc (the disc clips to white on purpose) */
  const glow = g.createRadialGradient(sun.x, sun.y, 0, sun.x, sun.y, W * 0.55)
  glow.addColorStop(0, 'rgba(255,226,170,0.75)')
  glow.addColorStop(0.12, 'rgba(255,200,140,0.35)')
  glow.addColorStop(0.4, 'rgba(255,170,130,0.08)')
  glow.addColorStop(1, 'rgba(255,170,130,0)')
  g.fillStyle = glow
  g.fillRect(0, 0, W, shore)

  /* clouds: low-res fbm, stretched and blurred by the upscale */
  const cw = 420, ch = 150
  const cc = document.createElement('canvas')
  cc.width = cw
  cc.height = ch
  const cg = cc.getContext('2d')!
  const img = cg.createImageData(cw, ch)
  for (let y = 0; y < ch; y++)
    for (let x = 0; x < cw; x++) {
      const n = fbm2(x * 0.018, y * 0.07, 5)
      const fade = Math.sin((y / ch) * Math.PI) ** 0.8
      const a = Math.max(0, Math.min(1, (n - 0.52) * 3.2)) * fade
      const near = Math.max(0, 1 - Math.hypot(x / cw - sun.x / W, (y / ch) * 0.45 - 0.42) * 1.6)
      const i = (y * cw + x) * 4
      img.data[i] = 205 + 50 * near
      img.data[i + 1] = 160 + 50 * near
      img.data[i + 2] = 190 - 30 * near
      img.data[i + 3] = a * 170
    }
  cg.putImageData(img, 0, 0)
  g.imageSmoothingQuality = 'high'
  g.drawImage(cc, 0, H * 0.05, W, H * 0.42)

  g.fillStyle = 'rgba(255,253,244,1)'
  g.beginPath(); g.arc(sun.x, sun.y, 30, 0, Math.PI * 2); g.fill()
  const disc = g.createRadialGradient(sun.x, sun.y, 26, sun.x, sun.y, 64)
  disc.addColorStop(0, 'rgba(255,246,214,0.9)')
  disc.addColorStop(1, 'rgba(255,230,180,0)')
  g.fillStyle = disc
  g.beginPath(); g.arc(sun.x, sun.y, 64, 0, Math.PI * 2); g.fill()

  /* ridges, far → near, with atmospheric haze between them */
  const layers = [
    { base: horizon - H * 0.04, amp: H * 0.09, freq: 1.6, oct: 4, top: '#9d97bb', bottom: '#8a8db3', seed: 1 },
    { base: horizon + H * 0.005, amp: H * 0.12, freq: 2.2, oct: 5, top: '#7c84ab', bottom: '#5f6d96', seed: 2 },
    { base: horizon + H * 0.04, amp: H * 0.1, freq: 2.8, oct: 5, top: '#56688c', bottom: '#3c516d', seed: 3 },
    { base: horizon + H * 0.07, amp: H * 0.075, freq: 3.6, oct: 6, top: '#36505a', bottom: '#253c42', seed: 4 },
  ]
  for (const L of layers) {
    g.beginPath()
    g.moveTo(0, shore)
    for (let x = 0; x <= W; x += 4) {
      const u = x / W
      const n = fbm1(u * L.freq + L.seed * 9.1, L.oct)
      const ridge = 1 - Math.abs(2 * n - 1) // sharper peaks
      g.lineTo(x, L.base - (ridge * 0.65 + n * 0.35) * L.amp)
    }
    g.lineTo(W, shore)
    g.closePath()
    const grad = g.createLinearGradient(0, L.base - L.amp, 0, shore)
    grad.addColorStop(0, L.top)
    grad.addColorStop(1, L.bottom)
    g.fillStyle = grad
    g.fill()
    // sun-side rim light on the ridge
    const rim = g.createRadialGradient(sun.x, sun.y, 0, sun.x, sun.y, W * 0.35)
    rim.addColorStop(0, 'rgba(255,190,140,0.22)')
    rim.addColorStop(1, 'rgba(255,190,140,0)')
    g.fillStyle = rim
    g.fill()
    const haze = g.createLinearGradient(0, L.base - L.amp * 0.2, 0, shore)
    haze.addColorStop(0, 'rgba(225,200,215,0)')
    haze.addColorStop(1, 'rgba(225,200,215,0.28)')
    g.fillStyle = haze
    g.fillRect(0, L.base - L.amp * 0.2, W, shore - L.base + L.amp * 0.2)
  }

  /* far shoreline trees */
  g.fillStyle = '#16302a'
  for (let x = 0; x < W; x += 3 + rnd() * 5) {
    const h = 6 + fbm1(x * 0.01 + 40, 3) * 26 + rnd() * 6
    g.beginPath()
    g.moveTo(x - 3, shore + 1)
    g.lineTo(x, shore - h)
    g.lineTo(x + 3, shore + 1)
    g.fill()
  }
  g.fillRect(0, shore - 2, W, 4)

  /* lake: mirrored, rippled, darkened */
  const lakeEnd = H * 0.86
  for (let y = Math.floor(shore); y < lakeEnd; y++) {
    const d = (y - shore) / (lakeEnd - shore)
    const src = shore - (y - shore) * 1.15 - 2
    const dx = Math.sin(y * 0.55) * (1 + d * 7) + Math.sin(y * 0.13 + 1.7) * d * 4
    g.drawImage(c, 0, Math.max(0, src), W, 1, dx, y, W, 1)
  }
  const water = g.createLinearGradient(0, shore, 0, lakeEnd)
  water.addColorStop(0, 'rgba(20,40,70,0.18)')
  water.addColorStop(1, 'rgba(10,25,45,0.5)')
  g.fillStyle = water
  g.fillRect(0, shore, W, lakeEnd - shore)
  // glitter path under the sun
  for (let i = 0; i < 900; i++) {
    const y = shore + (rnd() ** 1.6) * (lakeEnd - shore)
    const spread = 18 + ((y - shore) / (lakeEnd - shore)) * 140
    const x = sun.x + (rnd() - 0.5) * spread * 2 * rnd()
    const w = 3 + rnd() * 16
    g.fillStyle = `rgba(255,${200 + rnd() * 50},${150 + rnd() * 70},${0.25 + rnd() * 0.55})`
    g.fillRect(x - w / 2, y, w, 1 + rnd() * 1.4)
  }

  /* meadow */
  g.beginPath()
  g.moveTo(0, H)
  for (let x = 0; x <= W; x += 6) {
    const u = x / W
    g.lineTo(x, H * 0.835 + Math.sin(u * 3.1 + 0.4) * H * 0.02 - fbm1(u * 6 + 3, 4) * H * 0.035 + u * H * 0.02)
  }
  g.lineTo(W, H)
  g.closePath()
  const meadow = g.createLinearGradient(0, H * 0.8, 0, H)
  meadow.addColorStop(0, '#5c7a3a')
  meadow.addColorStop(0.35, '#3c5a29')
  meadow.addColorStop(1, '#1a2d16')
  g.fillStyle = meadow
  g.fill()
  // warm light grazing the meadow from the sun side
  const graze = g.createRadialGradient(sun.x, H * 0.84, 0, sun.x, H * 0.84, W * 0.5)
  graze.addColorStop(0, 'rgba(255,190,110,0.28)')
  graze.addColorStop(1, 'rgba(255,190,110,0)')
  g.fillStyle = graze
  g.fill()

  /* grass blades */
  g.lineCap = 'round'
  for (let i = 0; i < 5200; i++) {
    const x = rnd() * W
    const y = H * 0.85 + (rnd() ** 0.7) * H * 0.16
    const depth = (y - H * 0.85) / (H * 0.16)
    const h = 5 + depth * 26 * (0.5 + rnd())
    const lean = (rnd() - 0.5) * h * 0.6
    const lit = Math.max(0, 1 - Math.abs(x - sun.x) / (W * 0.45))
    const r = 60 + rnd() * 50 + lit * 70, gg = 90 + rnd() * 50 + lit * 40, b = 30 + rnd() * 25
    g.strokeStyle = `rgba(${r},${gg},${b},${0.55 + rnd() * 0.4})`
    g.lineWidth = 0.8 + depth * 1.8
    g.beginPath()
    g.moveTo(x, y)
    g.quadraticCurveTo(x + lean * 0.3, y - h * 0.6, x + lean, y - h)
    g.stroke()
  }
  /* wildflowers */
  const petals = ['#e9b23f', '#d9483b', '#f3e9d6', '#c95b8f', '#efd04a']
  for (let i = 0; i < 420; i++) {
    const x = rnd() * W
    const y = H * 0.87 + (rnd() ** 0.8) * H * 0.13
    const s = 1.5 + ((y - H * 0.87) / (H * 0.13)) * 4.5 * (0.6 + rnd() * 0.6)
    g.fillStyle = petals[Math.floor(rnd() * petals.length)]
    g.beginPath(); g.arc(x, y, s, 0, Math.PI * 2); g.fill()
  }

  /* foreground pines, right edge, nearly black */
  const pine = (x: number, base: number, h: number, w: number) => {
    g.fillStyle = '#0b1712'
    g.fillRect(x - w * 0.04, base - h * 0.15, w * 0.08, h * 0.2)
    const tiers = 9
    for (let t = 0; t < tiers; t++) {
      const k = t / tiers
      const ty = base - h * 0.1 - k * h * 0.88
      const tw = w * (1 - k) * (0.85 + rnd() * 0.3)
      g.beginPath()
      g.moveTo(x - tw / 2, ty)
      g.lineTo(x + (rnd() - 0.5) * 4, ty - h * 0.2)
      g.lineTo(x + tw / 2, ty)
      g.closePath()
      g.fill()
    }
  }
  pine(W * 0.9, H * 1.02, H * 0.62, W * 0.12)
  pine(W * 0.965, H * 1.03, H * 0.78, W * 0.14)
  pine(W * 0.835, H * 0.99, H * 0.38, W * 0.07)
  pine(W * 0.06, H * 0.96, H * 0.3, W * 0.055)

  return c
}
