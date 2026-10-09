/* Product geometry — all lathe profiles and procedural textures, no assets.
   Units are decimetres-ish: the speaker is 1.4 tall and sits on a 0.6 plinth. */
import * as THREE from 'three'

const SEG = 128

/** A rounded-cylinder profile: flat bottom, bottom fillet, gently barrelled side, top shoulder, flat top. */
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

export const DIM = { bodyR: 0.62, bodyH: 1.36, bodyY: 0.045, capR: 0.44, plinthR: 1.1, plinthH: 0.6 }

export function bodyGeometry() {
  const g = new THREE.LatheGeometry(roundedProfile(DIM.bodyR, DIM.bodyH, 0.09, 0.17, 0.025, DIM.bodyY), SEG)
  g.computeVertexNormals()
  return g
}

export function capGeometry() {
  const top = DIM.bodyY + DIM.bodyH
  const r = DIM.capR
  const pts = [new THREE.Vector2(0, top + 0.028)]
  for (let i = 1; i <= 16; i++) {
    const t = i / 16
    // a very slightly domed disc with a rolled edge
    const x = r * t
    const y = top + 0.028 - 0.008 * t * t - (t > 0.9 ? ((t - 0.9) / 0.1) ** 2 * 0.02 : 0)
    pts.push(new THREE.Vector2(x, y))
  }
  pts.push(new THREE.Vector2(r, top - 0.004), new THREE.Vector2(0, top - 0.004))
  const g = new THREE.LatheGeometry(pts, SEG)
  g.computeVertexNormals()
  return g
}

export function ringGeometry() {
  const g = new THREE.TorusGeometry(DIM.capR * 0.7, 0.011, 16, SEG)
  g.rotateX(Math.PI / 2)
  g.translate(0, DIM.bodyY + DIM.bodyH + 0.024, 0)
  return g
}

export function baseGeometry() {
  return new THREE.LatheGeometry(roundedProfile(0.5, 0.06, 0.012, 0.02, 0, 0), SEG)
}

export function pedestalGeometry() {
  return new THREE.LatheGeometry(roundedProfile(DIM.plinthR, DIM.plinthH, 0.012, 0.035, 0, 0), SEG)
}

/** Knit fabric as a tiling normal map: rows of interlocking loops. */
export function knitNormalMap() {
  const S = 128
  const h = new Float32Array(S * S)
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      // two staggered "V" loops per 16×12 cell
      const cx = (x % 16) / 16, cy = (y % 12) / 12
      const row = Math.floor(y / 12) % 2
      const lx = (cx + row * 0.5) % 1
      const leg = Math.min(Math.abs(lx - 0.27 - cy * 0.12), Math.abs(lx - 0.73 + cy * 0.12))
      h[y * S + x] = Math.exp(-(leg * leg) * 140) * (0.75 + 0.25 * Math.sin(cy * Math.PI))
    }
  // A canvas (not a DataTexture) so GLTFExporter can embed it in the .glb.
  const cv = document.createElement('canvas')
  cv.width = cv.height = S
  const img = cv.getContext('2d')!.createImageData(S, S)
  const data = img.data
  const at = (x: number, y: number) => h[((y + S) % S) * S + ((x + S) % S)]
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * 2.2
      const dy = (at(x, y + 1) - at(x, y - 1)) * 2.2
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
  t.repeat.set(44, 13)
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
