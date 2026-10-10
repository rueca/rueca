// Render a lit spinning top in grey tones, then dither it to two brand colours (Atkinson).
// Writes brand/trompo/placeholders/trompo-<palette>-<ratio>.png, upscaled with nearest-neighbour
// so the dither dots stay crisp at any display size.
import { chromium } from '/Users/raf/Documents/Prototype UI Harness/node_modules/playwright-core/index.mjs'
import { writeFileSync } from 'node:fs'

const OUT = '/Users/raf/Documents/Prototype UI Harness/brand/trompo/placeholders'
const RATIOS = { '4x3': [4, 3], '16x9': [16, 9], '1x1': [1, 1], '3x4': [3, 4], '2x3': [2, 3] }
const PALETTES = {
  ink:   { dark: '#1C1A19', light: '#F6F1EA' }, // ink dots on paper
  pink:  { dark: '#D1006F', light: '#F6F1EA' }, // rosa mexicano on paper
  night: { dark: '#1C1A19', light: '#E9E1D6' }, // for dark UIs: the top lit in a dark room, paper dots on ink
}
const GRID = 320  // dither cells along the long edge
const SCALE = 4   // output upscale (nearest) → 1280px long edge

const b = await chromium.launch({ channel: 'chrome' })
const p = await b.newPage()
await p.setContent('<canvas id="c"></canvas>')

for (const [rname, [rw, rh]] of Object.entries(RATIOS)) {
  const W = rw >= rh ? GRID : Math.round((GRID * rw) / rh), H = rw >= rh ? Math.round((GRID * rh) / rw) : GRID
  for (const [pname, pal] of Object.entries(PALETTES)) {
    const b64 = await p.evaluate(({ W, H, SCALE, pal, invert }) => {
      // 1. render the tonal image at 4x the dither grid, then sample down
      const SS = 4, w = W * SS, h = H * SS
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h
      const x = cv.getContext('2d')
      // background: a very gentle light falloff, so the edges get only sparse dots
      const bg = x.createRadialGradient(w * 0.4, h * 0.32, 0, w * 0.5, h * 0.5, Math.hypot(w, h) * 0.62)
      if (invert) { bg.addColorStop(0, '#2c2c2c'); bg.addColorStop(1, '#0c0c0c') } // night: a dark room
      else { bg.addColorStop(0, '#fbfbfb'); bg.addColorStop(1, '#d4d4d4') }
      x.fillStyle = bg; x.fillRect(0, 0, w, h)
      const S = Math.min(w, h) * 0.64 / 32, cx = w * 0.53, cy = h * 0.5
      // floor shadow under the tip, pushed away from the light
      x.save(); x.filter = `blur(${S * 1.5}px)`; x.fillStyle = 'rgba(0,0,0,.5)'
      x.beginPath(); x.ellipse(cx + S * 3.8, cy + S * 14.6, S * 8.5, S * 1.5, 0, 0, Math.PI * 2); x.fill(); x.restore()
      x.save(); x.translate(cx, cy); x.rotate(-0.2); x.scale(S, S); x.translate(-16, -16)
      // side of the body: a revolved trompo profile, convex at the shoulder, slightly concave towards the point
      const side = new Path2D('M5.4 11 C5.2 15.2 8.4 19.6 12.2 23.8 C13.8 25.6 15.2 27.2 16 28.8 C16.8 27.2 18.2 25.6 19.8 23.8 C23.6 19.6 26.8 15.2 26.6 11 Z')
      const g1 = x.createLinearGradient(5.4, 0, 26.6, 0)
      g1.addColorStop(0, '#303030'); g1.addColorStop(0.24, '#8e8e8e'); g1.addColorStop(0.38, '#cfcfcf'); g1.addColorStop(0.66, '#6c6c6c'); g1.addColorStop(1, '#1e1e1e')
      x.fillStyle = g1; x.fill(side)
      const g2 = x.createLinearGradient(0, 11, 0, 28.8)
      g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(0,0,0,.5)')
      x.fillStyle = g2; x.fill(side)
      // the band: a ring around the body just under the shoulder (front arcs of two ellipses)
      x.save(); x.clip(side)
      x.beginPath(); x.ellipse(16, 13.1, 10.6, 2.8, 0, 0, Math.PI); x.ellipse(16, 15.6, 10.0, 2.6, 0, Math.PI, 0, true); x.closePath()
      const g3 = x.createLinearGradient(5.4, 0, 26.6, 0)
      g3.addColorStop(0, '#101010'); g3.addColorStop(0.36, '#474747'); g3.addColorStop(1, '#0a0a0a')
      x.fillStyle = g3; x.fill(); x.restore()
      // top face: mid-tone (so it dithers into texture, not into nothing) with a defined rim
      const g4 = x.createRadialGradient(12.5, 10, 0.3, 16, 11, 11)
      g4.addColorStop(0, '#d4d4d4'); g4.addColorStop(1, '#7a7a7a')
      x.fillStyle = g4; x.beginPath(); x.ellipse(16, 11, 10.6, 2.8, 0, 0, Math.PI * 2); x.fill()
      x.strokeStyle = '#4c4c4c'; x.lineWidth = 0.25; x.stroke()
      // the metal point (la punta)
      const g6 = x.createLinearGradient(15, 0, 17, 0)
      g6.addColorStop(0, '#1c1c1c'); g6.addColorStop(0.45, '#bdbdbd'); g6.addColorStop(1, '#141414')
      x.fillStyle = g6; x.beginPath(); x.moveTo(15.1, 28.1); x.lineTo(16.9, 28.1); x.lineTo(16, 31); x.closePath(); x.fill()
      // stem seated on the top face, with its own little shadow
      x.fillStyle = 'rgba(0,0,0,.35)'; x.beginPath(); x.ellipse(16.6, 11.2, 2.2, 0.7, 0, 0, Math.PI * 2); x.fill()
      const g5 = x.createLinearGradient(14.6, 0, 17.4, 0)
      g5.addColorStop(0, '#262626'); g5.addColorStop(0.42, '#a8a8a8'); g5.addColorStop(1, '#1a1a1a')
      x.fillStyle = g5; x.beginPath(); x.roundRect(14.6, 3.6, 2.8, 7.6, [1.4, 1.4, 0.4, 0.4]); x.fill()
      x.restore()

      // 2. downsample to the dither grid and convert to luminance
      const sm = document.createElement('canvas'); sm.width = W; sm.height = H
      const sx = sm.getContext('2d'); sx.imageSmoothingQuality = 'high'; sx.drawImage(cv, 0, 0, W, H)
      const d = sx.getImageData(0, 0, W, H).data
      const L = new Float32Array(W * H)
      for (let i = 0; i < W * H; i++) {
        let v = (0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2]) / 255
        v = Math.min(1, Math.max(0, (v - 0.5) * 1.12 + 0.52)) // a touch of contrast
        L[i] = invert ? v * 1.08 : v // night keeps true tones; the object is lit, the room is dark
      }
      // 3. Atkinson dithering: spreads 6/8 of the error, which keeps highlights clean
      const on = new Uint8Array(W * H)
      for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) {
        const i = yy * W + xx, o = L[i] < 0.5 ? 0 : 1, e = (L[i] - o) / 8
        on[i] = o
        for (const [dx, dy] of [[1, 0], [2, 0], [-1, 1], [0, 1], [1, 1], [0, 2]]) {
          const X = xx + dx, Y = yy + dy
          if (X >= 0 && X < W && Y < H) L[Y * W + X] += e
        }
      }
      // 4. paint two colours, upscale with nearest-neighbour
      const out = document.createElement('canvas'); out.width = W * SCALE; out.height = H * SCALE
      const ox = out.getContext('2d')
      // light scenes: paper ground, ink where dark · night: ink ground, paper where lit
      ox.fillStyle = invert ? pal.dark : pal.light; ox.fillRect(0, 0, out.width, out.height)
      ox.fillStyle = invert ? pal.light : pal.dark
      for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) if (on[yy * W + xx] === (invert ? 1 : 0)) ox.fillRect(xx * SCALE, yy * SCALE, SCALE, SCALE)
      return out.toDataURL('image/png').split(',')[1]
    }, { W, H, SCALE, pal, invert: pname === 'night' })
    const file = `${OUT}/trompo-${pname}-${rname}.png`
    writeFileSync(file, Buffer.from(b64, 'base64'))
    console.log(file.split('/').pop(), `${W * SCALE}×${H * SCALE}`)
  }
}
await b.close()
