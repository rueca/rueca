/* Product geometry — all lathe profiles and procedural textures, no assets.
   The product is Campana's hand bell (src/demo/clients.ts): a cast bronze
   shell with a flared lip, a turned walnut handle, a brass ferrule between
   them, and the clapper inside. Units are decimetres-ish: the bell and handle
   stand about 2 tall on a 0.6 plinth. */
import * as THREE from 'three'

const SEG = 128

/** A rounded-cylinder profile: flat bottom, bottom fillet, straight side, top shoulder, flat top. */
function roundedProfile(radius: number, height: number, rb: number, rt: number, bulge = 0, y0 = 0) {
  const pts: THREE.Vector2[] = [new THREE.Vector2(0, y0)]
  const arc = (cx: number, cy: number, r: number, a0: number, a1: number, n = 14) => {
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n
      pts.push(new THREE.Vector2(cx + Math.cos(a) * r, cy + Math.sin(a) * r))
    }
  }
  arc(radius - rb, y0 + rb, rb, -Math.PI / 2, 0)
  const side = 24
  for (let i = 1; i < side; i++) {
    const t = i / side
    const y = y0 + rb + t * (height - rb - rt)
    pts.push(new THREE.Vector2(radius + bulge * Math.sin(Math.PI * t), y))
  }
  arc(radius - rt, y0 + height - rt, rt, 0, Math.PI / 2, 18)
  pts.push(new THREE.Vector2(0, y0 + height))
  return pts
}

/** A smooth lathe profile through (radius, height) control points. */
function spline(points: [number, number][], n: number) {
  const c = new THREE.SplineCurve(points.map(([r, y]) => new THREE.Vector2(r, y)))
  return c.getPoints(n)
}

export const DIM = { bellR: 0.66, bellH: 1.04, wall: 0.035, plinthR: 1.1, plinthH: 0.6 }

/** The bell: one closed shell, crown to lip on the outside, lip back up to the crown inside, so it reads hollow from below. */
export function bodyGeometry() {
  const outer = spline([[0, 1.04], [0.2, 1.02], [0.33, 0.97], [0.41, 0.86], [0.44, 0.7], [0.47, 0.52], [0.52, 0.32], [0.59, 0.15], [0.66, 0.035]], 80)
  const lip = [new THREE.Vector2(0.665, 0.0), new THREE.Vector2(0.64, -0.005)]
  const inner = spline([[0.62, 0.02], [0.555, 0.15], [0.49, 0.32], [0.44, 0.52], [0.405, 0.7], [0.375, 0.84], [0.3, 0.94], [0.18, 0.99], [0, 1.0]], 80)
  const g = new THREE.LatheGeometry([...outer, ...lip, ...inner], SEG)
  g.computeVertexNormals()
  return g
}

/** The handle: turned walnut, a bead at the neck, a long swelling grip, a knob at the top. */
export function capGeometry() {
  const pts = spline([[0, 1.03], [0.07, 1.04], [0.075, 1.09], [0.11, 1.13], [0.075, 1.18], [0.062, 1.24], [0.09, 1.36], [0.118, 1.55], [0.108, 1.72], [0.082, 1.82], [0.1, 1.87], [0.118, 1.93], [0.08, 1.99], [0, 2.0]], 90)
  const g = new THREE.LatheGeometry(pts, SEG)
  g.computeVertexNormals()
  return g
}

/** The ferrule: a brass collar where the handle meets the bell. */
export function ringGeometry() {
  const g = new THREE.TorusGeometry(0.082, 0.026, 18, SEG)
  g.rotateX(Math.PI / 2)
  g.translate(0, DIM.bellH + 0.012, 0)
  return g
}

/** The clapper: a ball on a rod, hanging from the crown inside the bell. */
export function baseGeometry() {
  const pts = spline([[0, 0.1], [0.06, 0.115], [0.095, 0.19], [0.07, 0.27], [0.022, 0.3], [0.022, 0.6], [0.022, 0.97], [0, 0.98]], 60)
  const g = new THREE.LatheGeometry(pts, 48)
  g.computeVertexNormals()
  return g
}

export function pedestalGeometry() {
  return new THREE.LatheGeometry(roundedProfile(DIM.plinthR, DIM.plinthH, 0.012, 0.035, 0, 0), SEG)
}

/** Turning marks as a tiling normal map: fine rings round the bell, the trace of the lathe that finished it.
    (Exported as knitNormalMap for the viewport; the speaker it was made for wore knit.) */
export function knitNormalMap() {
  const S = 128
  const h = new Float32Array(S * S)
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const v = y / S
      h[y * S + x] = 0.5 + 0.5 * Math.sin(v * Math.PI * 2 * 9) * (0.6 + 0.4 * Math.sin(v * Math.PI * 2 * 2 + 1)) + 0.04 * Math.sin((x / S) * Math.PI * 2 * 3)
    }
  // A canvas (not a DataTexture) so GLTFExporter can embed it in the .glb.
  const cv = document.createElement('canvas')
  cv.width = cv.height = S
  const img = cv.getContext('2d')!.createImageData(S, S)
  const data = img.data
  const at = (x: number, y: number) => h[((y + S) % S) * S + ((x + S) % S)]
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * 0.28
      const dy = (at(x, y + 1) - at(x, y - 1)) * 0.28
      const len = Math.hypot(dx, dy, 1)
      const i = (y * S + x) * 4
      data[i] = ((-dx / len) * 0.5 + 0.5) * 255
      data[i + 1] = ((-dy / len) * 0.5 + 0.5) * 255
      data[i + 2] = ((1 / len) * 0.5 + 0.5) * 255
      data[i + 3] = 255
    }
  cv.getContext('2d')!.putImageData(img, 0, 0)
  const t = new THREE.CanvasTexture(cv)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(1, 6)
  t.magFilter = THREE.LinearFilter
  t.minFilter = THREE.LinearMipmapLinearFilter
  t.generateMipmaps = true
  t.anisotropy = 8
  t.needsUpdate = true
  return t
}

/** A light glyph for the editor-only proxy sprite (white; tinted via material colour). */
export function lightGlyph() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')!
  g.translate(32, 32)
  g.fillStyle = 'rgba(0,0,0,.45)'
  g.beginPath(); g.arc(0, 0, 30, 0, Math.PI * 2); g.fill()
  g.strokeStyle = '#fff'
  g.fillStyle = '#fff'
  g.lineWidth = 4
  g.lineCap = 'round'
  g.beginPath(); g.arc(0, 0, 9, 0, Math.PI * 2); g.fill()
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    g.beginPath(); g.moveTo(Math.cos(a) * 15, Math.sin(a) * 15); g.lineTo(Math.cos(a) * 22, Math.sin(a) * 22); g.stroke()
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

const toonCache = new Map<number, THREE.DataTexture>()
export function toonRamp(bands: number) {
  const n = Math.max(2, Math.round(bands))
  let t = toonCache.get(n)
  if (!t) {
    const d = new Uint8Array(n)
    for (let i = 0; i < n; i++) d[i] = Math.round((i / (n - 1)) * 255)
    t = new THREE.DataTexture(d, n, 1, THREE.RedFormat)
    t.minFilter = t.magFilter = THREE.NearestFilter
    t.generateMipmaps = false
    t.needsUpdate = true
    toonCache.set(n, t)
  }
  return t
}
