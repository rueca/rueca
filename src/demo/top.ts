/* ---------------------------------------------------------------------------
   The continuous-tone spinning top on a paper sweep — the demo
   "photograph". Not dithered: the photo shell needs real gradients, the
   dither lab produces the brand look itself, and generate dithers it per
   model. Same 32-unit top geometry as ditherTop() in ./wire.ts.
   `paper: true` (day only) drops the wall, bend and light pool for a bare
   paper ground that dithers clean. Demo content — not part of the kit.
--------------------------------------------------------------------------- */

export interface TopShot {
  /** horizontal position of the top, 0–1 */
  at?: number
  /** top height as a share of the short side */
  size?: number
  /** lean in radians (negative leans left) */
  tilt?: number
  /** key light side: −1 from the left, 1 from the right */
  key?: number
  /** lit top on a dark ground */
  night?: boolean
  /** paper grain, 0–1 */
  grain?: number
  /** corner darkening, 0–1 */
  vignette?: number
  /** day only: a bare paper ground (no wall, no light pool) with a soft floor falloff right under
      the top — dithers to clean paper with ink only on the top, its shadow and the floor beneath */
  paper?: boolean
  seed?: number
}

const g = (v: number) => { const n = Math.round(Math.max(0, Math.min(1, v)) * 255); return `rgb(${n},${n},${n})` }

/** Paint the shot into a new canvas, W × H, warm grey. */
export function paintTop(W: number, H: number, { at = 0.5, size = 0.62, tilt = -0.2, key = -1, night = false, grain = 0.5, vignette = 0.3, paper = false, seed = 7 }: TopShot = {}): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const x = c.getContext('2d', { willReadFrequently: true })!
  const s = Math.min(W, H), S = (s * size) / 32
  const cx = W * at, cy = H * 0.5
  const k = key < 0 ? -1 : 1
  // where the tip lands, so the sweep and the shadow sit under it
  const tipX = cx - Math.sin(tilt) * 15 * S, tipY = cy + Math.cos(tilt) * 15 * S
  const sweep = Math.min(H * 0.86, tipY - S * 5)

  const bare = paper && !night
  if (bare) {
    x.fillStyle = g(1); x.fillRect(0, 0, W, H)
    // the floor darkens a little toward the top's footprint, then lets go
    const fall = x.createRadialGradient(tipX, tipY, 0, tipX, tipY, S * 15)
    fall.addColorStop(0, 'rgba(0,0,0,0.2)'); fall.addColorStop(0.5, 'rgba(0,0,0,0.07)'); fall.addColorStop(1, 'rgba(0,0,0,0)')
    x.save(); x.translate(tipX, tipY); x.scale(1, 0.32); x.translate(-tipX, -tipY)
    x.fillStyle = fall; x.beginPath(); x.arc(tipX, tipY, S * 15, 0, Math.PI * 2); x.fill(); x.restore()
  } else {
    /* --- ground: wall, a soft curve, the floor --- */
    const wall = x.createLinearGradient(0, 0, 0, sweep)
    const floor = x.createLinearGradient(0, sweep, 0, H)
    if (night) {
      wall.addColorStop(0, g(0.035)); wall.addColorStop(1, g(0.09))
      floor.addColorStop(0, g(0.1)); floor.addColorStop(1, g(0.03))
    } else {
      wall.addColorStop(0, g(0.72)); wall.addColorStop(1, g(0.88))
      floor.addColorStop(0, g(0.9)); floor.addColorStop(1, g(0.68))
    }
    x.fillStyle = wall; x.fillRect(0, 0, W, sweep)
    x.fillStyle = floor; x.fillRect(0, sweep, W, H - sweep)
    // the sweep's bend: a soft bright band, no hard line
    const bend = x.createLinearGradient(0, sweep - S * 3, 0, sweep + S * 3)
    bend.addColorStop(0, 'rgba(255,255,255,0)'); bend.addColorStop(0.5, `rgba(255,255,255,${night ? 0.04 : 0.12})`); bend.addColorStop(1, 'rgba(255,255,255,0)')
    x.fillStyle = bend; x.fillRect(0, sweep - S * 3, W, S * 6)
    // the key light's pool
    const lx = cx + k * s * 0.42, ly = cy - s * 0.38
    const pool = x.createRadialGradient(lx, ly, 0, lx, ly, Math.hypot(W, H) * (night ? 0.42 : 0.7))
    pool.addColorStop(0, `rgba(255,255,255,${night ? 0.1 : 0.3})`); pool.addColorStop(1, 'rgba(255,255,255,0)')
    x.fillStyle = pool; x.fillRect(0, 0, W, H)
  }
  if (night) { // a spot on the floor under the top
    const spot = x.createRadialGradient(tipX, tipY, 0, tipX, tipY, S * 14)
    spot.addColorStop(0, 'rgba(255,255,255,0.32)'); spot.addColorStop(0.55, 'rgba(255,255,255,0.08)'); spot.addColorStop(1, 'rgba(255,255,255,0)')
    x.save(); x.translate(tipX, tipY); x.scale(1, 0.28); x.translate(-tipX, -tipY)
    x.fillStyle = spot; x.beginPath(); x.arc(tipX, tipY, S * 14, 0, Math.PI * 2); x.fill(); x.restore()
  }

  /* --- shadows: long and soft away from the key, tight contact at the tip --- */
  x.save(); x.filter = `blur(${S * 1.6}px)`; x.fillStyle = `rgba(0,0,0,${night ? 0.6 : 0.42})`
  x.beginPath(); x.ellipse(tipX - k * S * 6, tipY + S * 0.2, S * 9.5, S * 1.4, 0, 0, Math.PI * 2); x.fill(); x.restore()
  x.save(); x.filter = `blur(${S * 0.35}px)`; x.fillStyle = 'rgba(0,0,0,0.7)'
  x.beginPath(); x.ellipse(tipX - k * S * 0.6, tipY + S * 0.15, S * 1.4, S * 0.32, 0, 0, Math.PI * 2); x.fill(); x.restore()

  /* --- the top --- */
  x.save(); x.translate(cx, cy); x.rotate(tilt); x.scale(S, S); x.translate(-16, -16)
  // gradient stops are written for a key from the left; mirror them for the right
  const lin = (x0: number, x1: number, stops: [number, number][]) => {
    const gr = x.createLinearGradient(x0, 0, x1, 0)
    for (const [o, v] of stops) gr.addColorStop(k < 0 ? o : 1 - o, g(v))
    return gr
  }
  const side = new Path2D('M5.4 11 C5.2 15.2 8.4 19.6 12.2 23.8 C13.8 25.6 15.2 27.2 16 28.8 C16.8 27.2 18.2 25.6 19.8 23.8 C23.6 19.6 26.8 15.2 26.6 11 Z')
  const lit = night ? 0.92 : 1
  x.fillStyle = lin(5.4, 26.6, [[0, 0.24], [0.16, 0.5 * lit], [0.3, 0.8 * lit], [0.42, 0.62 * lit], [0.66, 0.3], [0.88, 0.1], [1, 0.22]]); x.fill(side)
  // falls off toward the tip
  const down = x.createLinearGradient(0, 11, 0, 28.8); down.addColorStop(0, 'rgba(0,0,0,0)'); down.addColorStop(1, 'rgba(0,0,0,.55)'); x.fillStyle = down; x.fill(side)
  x.save(); x.clip(side)
  // specular streak: clips to white on purpose
  const sp = k < 0 ? 10.4 : 21.6
  const spec = x.createLinearGradient(sp - 1.6, 0, sp + 1.6, 0)
  spec.addColorStop(0, 'rgba(255,255,255,0)'); spec.addColorStop(0.5, 'rgba(255,255,255,1)'); spec.addColorStop(1, 'rgba(255,255,255,0)')
  const bx = sp + (16 - sp) * 0.45 // the streak follows the body in toward the tip, narrowing
  x.fillStyle = spec; x.globalAlpha = 0.95
  x.beginPath(); x.moveTo(sp - 1.6, 11); x.lineTo(sp + 1.6, 11); x.lineTo(bx + 0.3, 23); x.lineTo(bx - 0.3, 23); x.closePath(); x.fill()
  x.globalAlpha = 1
  // rim light on the shadow edge
  const rimX = k < 0 ? 26.6 : 5.4
  const rim = x.createLinearGradient(rimX + k * 1.4, 0, rimX, 0)
  rim.addColorStop(0, 'rgba(255,255,255,0)'); rim.addColorStop(1, `rgba(255,255,255,${night ? 0.5 : 0.32})`)
  x.fillStyle = rim; x.fillRect(0, 11, 32, 14)
  // the groove under the crown
  x.beginPath(); x.ellipse(16, 13.1, 10.6, 2.8, 0, 0, Math.PI); x.ellipse(16, 15.6, 10, 2.6, 0, Math.PI, 0, true); x.closePath()
  x.fillStyle = lin(5.4, 26.6, [[0, 0.05], [0.3, 0.24], [0.5, 0.12], [1, 0.02]]); x.fill()
  x.restore()
  // crown
  const ck = 16 + k * 3.5
  const crown = x.createRadialGradient(ck, 10.2, 0.3, 16, 11, 11); crown.addColorStop(0, g(0.97 * lit)); crown.addColorStop(0.5, g(0.7 * lit)); crown.addColorStop(1, g(0.4))
  x.fillStyle = crown; x.beginPath(); x.ellipse(16, 11, 10.6, 2.8, 0, 0, Math.PI * 2); x.fill()
  x.strokeStyle = g(0.24); x.lineWidth = bare ? 0.5 : 0.22; x.stroke() // on bare paper the rim carries the crown's edge
  // steel tip
  x.fillStyle = lin(15, 17, [[0, 0.1], [0.4, 0.82], [1, 0.08]]); x.beginPath(); x.moveTo(15.1, 28.1); x.lineTo(16.9, 28.1); x.lineTo(16, 31); x.closePath(); x.fill()
  // stem shadow on the crown, then the stem
  x.fillStyle = 'rgba(0,0,0,.4)'; x.beginPath(); x.ellipse(16 - k * 1.2, 11.25, 2.4, 0.75, 0, 0, Math.PI * 2); x.fill()
  x.fillStyle = lin(14.6, 17.4, [[0, 0.16], [0.32, 0.9 * lit], [0.5, 0.6], [1, 0.08]]); x.beginPath(); x.roundRect(14.6, 3.6, 2.8, 7.6, [1.4, 1.4, 0.4, 0.4]); x.fill()
  x.fillStyle = g(0.8 * lit); x.beginPath(); x.ellipse(16, 3.9, 1.35, 0.35, 0, 0, Math.PI * 2); x.fill()
  x.restore()

  /* --- vignette, then tone to warm grey + paper grain --- */
  const vig = x.createRadialGradient(W / 2, H / 2, s * 0.4, W / 2, H / 2, Math.hypot(W, H) * 0.62)
  vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, `rgba(0,0,0,${night ? Math.max(vignette, 0.5) : vignette})`)
  x.fillStyle = vig; x.fillRect(0, 0, W, H)

  const img = x.getImageData(0, 0, W, H), d = img.data
  let a = (seed * 2654435761) >>> 0
  const rnd = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
  const amp = grain * 10
  for (let i = 0; i < d.length; i += 4) {
    const L = d[i] / 255
    const n = (rnd() + rnd() - 1) * amp
    const warm = Math.sin(Math.PI * L) // the cast lives in the mid-tones; black and white stay neutral
    // ink #1C1A19 → paper #F6F1EA, stretched so pure black and white are still reachable
    d[i] = L * 255 + warm * 7 + n
    d[i + 1] = L * 253 + warm * 2 + n
    d[i + 2] = L * 248 - warm * 7 + n
  }
  x.putImageData(img, 0, 0)
  return c
}
