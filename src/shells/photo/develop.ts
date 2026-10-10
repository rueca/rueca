/* ---------------------------------------------------------------------------
   The develop engine — one WebGL2 fragment shader, a pure function of
   (source, values, view). Non-destructive: the source texture is never
   touched; every frame re-derives the result from the settings.

   Order of operations (roughly Lightroom's):
     sharpen → white balance + exposure (linear) → black/white points →
     highlights / shadows / texture / clarity / dehaze (luminance) →
     contrast → colour mixer + vibrance + saturation (HSL) → tone curves →
     vignette + grain (in crop space) → clipping overlay / before-after.

   The same program renders the screen canvas, small FBO reads (histogram,
   navigator, preset thumbnails), full-size exports, and a .cube LUT (an
   identity lattice pushed through the global colour ops only).
--------------------------------------------------------------------------- */
import { sampleCurve, type CurvePoint } from '@kit/ui/charts'
import type { CropRect as Rect } from '@kit/stage/overlays'
import { BANDS, type V } from './state'
import { site } from '../../site.config'

export interface ViewOpts {
  crop: Rect
  angle: number // degrees
  bypass?: boolean
  split?: number | null
  clip?: { shadows: boolean; highlights: boolean }
}

const VERT = `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`

const FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uSrc;
uniform sampler2D uCurve;
uniform vec2 uSrcSize;
uniform vec4 uCrop;
uniform float uAngle;
uniform int uMode;
uniform float uBypass;
uniform float uSplit;
uniform int uClip;
uniform float uExposure, uContrast, uHighlights, uShadows, uWhites, uBlacks, uTemp, uTint;
uniform float uTexture, uClarity, uDehaze, uVibrance, uSaturation;
uniform float uHslH[8];
uniform float uHslS[8];
uniform float uHslL[8];
uniform float uVig, uVigMid, uVigFeather, uGrain, uGrainSize, uSharpen, uSharpRadius;

const float CENTERS[8] = float[8](0.0, 30.0, 60.0, 120.0, 180.0, 240.0, 270.0, 300.0);

float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
vec3 toLin(vec3 c) { c = max(c, 0.0); return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
vec3 toSrgb(vec3 c) { c = max(c, 0.0); return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }

vec3 rgb2hsl(vec3 c) {
  float mx = max(c.r, max(c.g, c.b)), mn = min(c.r, min(c.g, c.b));
  float l = (mx + mn) * 0.5, d = mx - mn;
  if (d < 1e-5) return vec3(0.0, 0.0, l);
  float s = d / (1.0 - abs(2.0 * l - 1.0) + 1e-5);
  float h;
  if (mx == c.r) h = mod((c.g - c.b) / d, 6.0);
  else if (mx == c.g) h = (c.b - c.r) / d + 2.0;
  else h = (c.r - c.g) / d + 4.0;
  return vec3(h / 6.0, clamp(s, 0.0, 1.0), l);
}
vec3 hsl2rgb(vec3 hsl) {
  vec3 k = mod(vec3(0.0, 8.0, 4.0) + hsl.x * 12.0, 12.0);
  float a = hsl.y * min(hsl.z, 1.0 - hsl.z);
  return hsl.z - a * max(min(min(k - 3.0, 9.0 - k), vec3(1.0)), vec3(-1.0));
}

void bandWeights(float h, out float w[8]) {
  for (int i = 0; i < 8; i++) w[i] = 0.0;
  for (int i = 0; i < 8; i++) {
    float a = CENTERS[i];
    float b = i == 7 ? 360.0 : CENTERS[i + 1];
    if (h >= a && h < b) { float t = (h - a) / (b - a); w[i] = 1.0 - t; w[(i + 1) % 8] = t; }
  }
}

// Integer lattice hash (multiply–xorshift, our own constants). Callers pass integer-valued lattice points.
float hash(vec2 p) {
  uvec2 q = uvec2(ivec2(floor(p)) + 65536);
  uint h = (q.x * 0x2c1b3c6du) ^ (q.y * 0x297a2d39u);
  h ^= h >> 15u;
  h *= 0x2c9277b5u;
  h ^= h >> 13u;
  return float(h) * (1.0 / 4294967295.0);
}
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i), b = hash(i + vec2(1.0, 0.0)), c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

vec3 develop(vec3 src, float lSmall, float lLarge) {
  float l0 = luma(src);
  vec3 lin = toLin(src);
  float t = uTemp / 100.0, ti = uTint / 100.0;
  vec3 wb = vec3(1.0 + 0.32 * t, 1.0 - 0.26 * ti, 1.0 - 0.36 * t);
  wb /= luma(wb);
  lin *= wb * exp2(uExposure);
  vec3 c = toSrgb(lin);

  float bp = -uBlacks / 100.0 * 0.12;
  float wp = 1.0 - uWhites / 100.0 * 0.18;
  c = (c - bp) / (wp - bp);

  float L = luma(c);
  float sMask = 1.0 - smoothstep(0.0, 0.55, L);
  float hMask = smoothstep(0.42, 1.0, L);
  float mid = 1.0 - abs(2.0 * clamp(L, 0.0, 1.0) - 1.0);
  float dh = uDehaze / 100.0;
  float L2 = L + uShadows / 100.0 * 0.26 * sMask + uHighlights / 100.0 * 0.24 * hMask;
  L2 += uTexture / 100.0 * 1.1 * (l0 - lSmall) * (0.4 + 0.6 * mid);
  L2 += uClarity / 100.0 * 0.85 * (l0 - lLarge) * (0.25 + 0.75 * mid);
  L2 += dh * (0.45 * (l0 - lLarge) - 0.05 * lLarge);
  L2 = max(L2, -0.02);
  c *= (L2 + 0.03) / (L + 0.03);

  float k = uContrast / 100.0;
  vec3 cc = clamp(c, 0.0, 1.0);
  vec3 sc = cc * cc * (3.0 - 2.0 * cc) + (c - cc);
  c = k >= 0.0 ? mix(c, sc, k * 0.9) : mix(c, 0.5 + (c - 0.5) * 0.55, -k);

  vec3 hsl = rgb2hsl(clamp(c, 0.0, 1.0));
  float w[8];
  bandWeights(hsl.x * 360.0, w);
  float hh = 0.0, ss = 0.0, ll = 0.0;
  for (int i = 0; i < 8; i++) { hh += w[i] * uHslH[i]; ss += w[i] * uHslS[i]; ll += w[i] * uHslL[i]; }
  float colourful = smoothstep(0.02, 0.25, hsl.y);
  hsl.x = fract(hsl.x + hh / 100.0 * (30.0 / 360.0) + 1.0);
  hsl.z = clamp(hsl.z + ll / 100.0 * 0.22 * colourful, 0.0, 1.0);
  hsl.y = clamp(hsl.y * (1.0 + ss / 100.0), 0.0, 1.0);
  float vib = uVibrance / 100.0 * (1.0 - 0.55 * w[1]);
  hsl.y = clamp(hsl.y * (1.0 + vib * (1.0 - hsl.y) * 1.1) * (1.0 + dh * 0.25), 0.0, 1.0);
  hsl.y = clamp(hsl.y * (1.0 + uSaturation / 100.0), 0.0, 1.0);
  c = hsl2rgb(hsl);

  vec3 u = clamp(c, 0.0, 1.0) * (255.0 / 256.0) + 0.5 / 256.0;
  c = vec3(texture(uCurve, vec2(u.r, 0.5)).r, texture(uCurve, vec2(u.g, 0.5)).g, texture(uCurve, vec2(u.b, 0.5)).b);
  return c;
}

void main() {
  if (uMode == 1) {
    vec3 c = texelFetch(uSrc, ivec2(gl_FragCoord.xy), 0).rgb;
    float l = luma(c);
    outColor = vec4(clamp(develop(c, l, l), 0.0, 1.0), 1.0);
    return;
  }
  vec2 t = vec2(vUv.x, 1.0 - vUv.y);
  vec2 p = (uCrop.xy + t * uCrop.zw) * uSrcSize;
  vec2 ctr = 0.5 * uSrcSize;
  float ca = cos(uAngle), sa = sin(uAngle);
  vec2 d = p - ctr;
  vec2 q = vec2(ca * d.x + sa * d.y, -sa * d.x + ca * d.y) + ctr;
  vec2 uv = q / uSrcSize;
  if (any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0)))) { outColor = vec4(0.1, 0.1, 0.1, 1.0); return; }
  vec3 src = texture(uSrc, uv).rgb;
  bool before = uBypass > 0.5 || (uSplit >= 0.0 && t.x < uSplit);
  if (before) { outColor = vec4(src, 1.0); return; }

  vec3 s = src;
  if (uSharpen > 0.0) {
    vec2 o = uSharpRadius / uSrcSize;
    vec3 blur = (texture(uSrc, uv + vec2(o.x, 0.0)).rgb + texture(uSrc, uv - vec2(o.x, 0.0)).rgb + texture(uSrc, uv + vec2(0.0, o.y)).rgb + texture(uSrc, uv - vec2(0.0, o.y)).rgb) * 0.25;
    s = clamp(src + luma(src - blur) * (uSharpen / 100.0) * 1.6, 0.0, 1.0);
  }
  float big = log2(max(uSrcSize.x, uSrcSize.y) / 2000.0);
  float lS = luma(textureLod(uSrc, uv, 1.6 + big).rgb);
  vec2 r = 24.0 / uSrcSize;
  float lL = (luma(textureLod(uSrc, uv, 5.0 + big).rgb) * 2.0
    + luma(textureLod(uSrc, uv + vec2(r.x, r.y), 5.0 + big).rgb) + luma(textureLod(uSrc, uv - vec2(r.x, r.y), 5.0 + big).rgb)
    + luma(textureLod(uSrc, uv + vec2(r.x, -r.y), 5.0 + big).rgb) + luma(textureLod(uSrc, uv + vec2(-r.x, r.y), 5.0 + big).rgb)) / 6.0;
  vec3 c = develop(s, lS, lL);

  if (uVig != 0.0) {
    float aspect = (uCrop.z * uSrcSize.x) / (uCrop.w * uSrcSize.y);
    vec2 vc = (t - 0.5) * vec2(aspect, 1.0);
    float rr = length(vc) / length(vec2(aspect, 1.0) * 0.5);
    float m0 = mix(0.1, 1.0, uVigMid / 100.0);
    float f = mix(0.05, 0.95, uVigFeather / 100.0);
    float m = smoothstep(m0 - f * 0.5, m0 + f * 0.5, rr);
    float a = uVig / 100.0;
    c = a < 0.0 ? c * (1.0 + a * m) : mix(c, vec3(1.0), a * m * 0.85);
  }
  if (uGrain > 0.0) {
    float sz = mix(0.7, 3.6, uGrainSize / 100.0);
    vec2 gp = q / sz;
    float n = vnoise(gp) * 0.65 + vnoise(gp * 1.93 + 11.9) * 0.35 - 0.5;
    float L = luma(clamp(c, 0.0, 1.0));
    c += n * uGrain / 100.0 * 0.32 * (0.35 + 0.65 * (1.0 - abs(2.0 * L - 1.0)));
  }
  c = clamp(c, 0.0, 1.0);
  if ((uClip & 1) != 0 && max(c.r, max(c.g, c.b)) <= 0.004) c = vec3(0.16, 0.42, 1.0);
  if ((uClip & 2) != 0 && max(c.r, max(c.g, c.b)) >= 0.996) c = vec3(1.0, 0.18, 0.2);
  outColor = vec4(c, 1.0);
}`

const SCALARS: [string, string][] = [
  ['uExposure', 'exposure'], ['uContrast', 'contrast'], ['uHighlights', 'highlights'], ['uShadows', 'shadows'], ['uWhites', 'whites'], ['uBlacks', 'blacks'],
  ['uTemp', 'temp'], ['uTint', 'tint'], ['uTexture', 'texture'], ['uClarity', 'clarity'], ['uDehaze', 'dehaze'], ['uVibrance', 'vibrance'], ['uSaturation', 'saturation'],
  ['uVig', 'vignette'], ['uVigMid', 'vigMid'], ['uVigFeather', 'vigFeather'], ['uGrain', 'grain'], ['uGrainSize', 'grainSize'], ['uSharpen', 'sharpen'], ['uSharpRadius', 'sharpRadius'],
]

export class Develop {
  readonly gl: WebGL2RenderingContext
  private prog: WebGLProgram
  private src: WebGLTexture
  private curve: WebGLTexture
  private loc = new Map<string, WebGLUniformLocation | null>()
  private curveKey = ''
  private floatFbo: boolean
  w = 1
  h = 1

  constructor(readonly canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: false })
    if (!gl) throw new Error('WebGL2 is not available')
    this.gl = gl
    this.floatFbo = !!gl.getExtension('EXT_color_buffer_float')
    const sh = (type: number, code: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, code)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader')
      return s
    }
    const prog = gl.createProgram()!
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'link')
    this.prog = prog
    this.src = gl.createTexture()!
    this.curve = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, this.curve)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  }

  private u(name: string) {
    if (!this.loc.has(name)) this.loc.set(name, this.gl.getUniformLocation(this.prog, name))
    return this.loc.get(name)!
  }

  /** Upload a new source photo. Mipmapped, because texture / clarity read blurred mip levels. */
  setSource(img: TexImageSource, w: number, h: number) {
    const gl = this.gl
    gl.bindTexture(gl.TEXTURE_2D, this.src)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, img)
    gl.generateMipmap(gl.TEXTURE_2D)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    this.w = w
    this.h = h
  }

  private updateCurves(v: V) {
    const key = JSON.stringify([v.curveRGB, v.curveR, v.curveG, v.curveB])
    if (key === this.curveKey) return
    this.curveKey = key
    const m = sampleCurve(v.curveRGB as CurvePoint[], 256)
    const ch = [v.curveR, v.curveG, v.curveB].map((c) => sampleCurve(c as CurvePoint[], 256))
    const data = new Float32Array(256 * 4)
    const look = (lut: Float32Array, x: number) => { const f = x * 255, i = Math.min(254, Math.floor(f)); return lut[i] + (lut[i + 1] - lut[i]) * (f - i) }
    for (let i = 0; i < 256; i++) {
      const y = m[i]
      data[i * 4] = look(ch[0], y)
      data[i * 4 + 1] = look(ch[1], y)
      data[i * 4 + 2] = look(ch[2], y)
      data[i * 4 + 3] = 1
    }
    const gl = this.gl
    gl.bindTexture(gl.TEXTURE_2D, this.curve)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, 256, 1, 0, gl.RGBA, gl.FLOAT, data)
  }

  private setUniforms(v: V, view: ViewOpts, mode = 0) {
    const gl = this.gl
    gl.useProgram(this.prog)
    this.updateCurves(v)
    for (const [u, k] of SCALARS) gl.uniform1f(this.u(u), Number(v[k]) || 0)
    gl.uniform1fv(this.u('uHslH'), BANDS.map((b) => v[`hsl_${b.id}_h`] ?? 0))
    gl.uniform1fv(this.u('uHslS'), BANDS.map((b) => v[`hsl_${b.id}_s`] ?? 0))
    gl.uniform1fv(this.u('uHslL'), BANDS.map((b) => v[`hsl_${b.id}_l`] ?? 0))
    gl.uniform2f(this.u('uSrcSize'), this.w, this.h)
    gl.uniform4f(this.u('uCrop'), view.crop.x, view.crop.y, view.crop.w, view.crop.h)
    gl.uniform1f(this.u('uAngle'), (view.angle * Math.PI) / 180)
    gl.uniform1i(this.u('uMode'), mode)
    gl.uniform1f(this.u('uBypass'), view.bypass ? 1 : 0)
    gl.uniform1f(this.u('uSplit'), view.split ?? -1)
    gl.uniform1i(this.u('uClip'), (view.clip?.shadows ? 1 : 0) | (view.clip?.highlights ? 2 : 0))
    gl.uniform1i(this.u('uSrc'), 0)
    gl.uniform1i(this.u('uCurve'), 1)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, this.curve)
    gl.activeTexture(gl.TEXTURE0)
  }

  outSize(view: ViewOpts) {
    return { w: Math.max(1, Math.round(view.crop.w * this.w)), h: Math.max(1, Math.round(view.crop.h * this.h)) }
  }

  /** Draw to the visible canvas at the crop's native pixel size. */
  draw(v: V, view: ViewOpts) {
    const gl = this.gl
    const { w, h } = this.outSize(view)
    if (this.canvas.width !== w || this.canvas.height !== h) { this.canvas.width = w; this.canvas.height = h }
    this.setUniforms(v, view)
    gl.bindTexture(gl.TEXTURE_2D, this.src)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, w, h)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  /** Render offscreen and read back RGBA8, top row first. */
  pixels(v: V, view: ViewOpts, w: number, h: number): Uint8ClampedArray<ArrayBuffer> {
    const gl = this.gl
    const tex = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, w, h)
    const fbo = gl.createFramebuffer()!
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
    this.setUniforms(v, view)
    gl.bindTexture(gl.TEXTURE_2D, this.src)
    gl.viewport(0, 0, w, h)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
    const raw = new Uint8Array(w * h * 4)
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, raw)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.deleteFramebuffer(fbo)
    gl.deleteTexture(tex)
    // flip to top-down
    const out = new Uint8ClampedArray(new ArrayBuffer(w * h * 4))
    const row = w * 4
    for (let y = 0; y < h; y++) out.set(raw.subarray((h - 1 - y) * row, (h - y) * row), y * row)
    return out
  }

  toCanvas(v: V, view: ViewOpts, w: number, h: number) {
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    c.getContext('2d')!.putImageData(new ImageData(this.pixels(v, view, w, h), w, h), 0, 0)
    return c
  }

  thumb(v: V, view: ViewOpts, w: number, h: number) {
    return this.toCanvas(v, view, w, h).toDataURL('image/jpeg', 0.82)
  }

  /** The global colour transform as an N³ .cube LUT (spatial effects excluded by definition). */
  cube(v: V, n = 33, title = 'Look') {
    const gl = this.gl
    const W = n * n, H = n
    const lattice = new Float32Array(W * H * 4)
    for (let g = 0; g < n; g++)
      for (let b = 0; b < n; b++)
        for (let r = 0; r < n; r++) {
          const i = (g * W + b * n + r) * 4
          lattice[i] = r / (n - 1)
          lattice[i + 1] = g / (n - 1)
          lattice[i + 2] = b / (n - 1)
          lattice[i + 3] = 1
        }
    const inTex = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, inTex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, W, H, 0, gl.RGBA, gl.FLOAT, lattice)
    const outTex = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, outTex)
    gl.texStorage2D(gl.TEXTURE_2D, 1, this.floatFbo ? gl.RGBA32F : gl.RGBA8, W, H)
    const fbo = gl.createFramebuffer()!
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, outTex, 0)
    this.setUniforms(v, { crop: { x: 0, y: 0, w: 1, h: 1 }, angle: 0 }, 1)
    gl.bindTexture(gl.TEXTURE_2D, inTex)
    gl.viewport(0, 0, W, H)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
    let px: Float32Array
    if (this.floatFbo) {
      px = new Float32Array(W * H * 4)
      gl.readPixels(0, 0, W, H, gl.RGBA, gl.FLOAT, px)
    } else {
      const b = new Uint8Array(W * H * 4)
      gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, b)
      px = Float32Array.from(b, (x) => x / 255)
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.deleteFramebuffer(fbo)
    gl.deleteTexture(inTex)
    gl.deleteTexture(outTex)
    gl.bindTexture(gl.TEXTURE_2D, this.src)
    const lines = [`TITLE "${title.replace(/"/g, '')}"`, `# Exported from Develop (${site.name})`, `LUT_3D_SIZE ${n}`, 'DOMAIN_MIN 0.0 0.0 0.0', 'DOMAIN_MAX 1.0 1.0 1.0', '']
    for (let b = 0; b < n; b++)
      for (let g = 0; g < n; g++)
        for (let r = 0; r < n; r++) {
          const i = (g * W + b * n + r) * 4
          lines.push(`${px[i].toFixed(6)} ${px[i + 1].toFixed(6)} ${px[i + 2].toFixed(6)}`)
        }
    return lines.join('\n') + '\n'
  }

  dispose() {
    const gl = this.gl
    gl.deleteTexture(this.src)
    gl.deleteTexture(this.curve)
    gl.deleteProgram(this.prog)
    // No loseContext(): React StrictMode remounts on the same <canvas>, and a lost context never comes back.
  }
}
