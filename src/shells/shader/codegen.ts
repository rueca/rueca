/* ---------------------------------------------------------------------------
   Stack → one GLSL ES 3.00 fragment shader.

   Every visible layer becomes a function L<i>(p) that renders the stack up to
   and including itself at coordinate p, calling L<i-1> for what is below. That
   one idea gives correct ordering for every kind of layer: a warp re-maps p
   before calling below, a halftone samples below at its cell centres, an RGB
   split samples below three times. No render targets, no passes.

   Pure: string in, string out. The renderer compiles it; "Copy as code" ships it.
--------------------------------------------------------------------------- */
import { LAYER_TYPES, type BlendMode, type Layer } from './layers'
import { hexToRgb01 } from './color'

export interface DocUniforms {
  /** seconds since loop start */
  time: number
  /** loop length in seconds — uPhase runs 0 → 2π once per loop */
  loop: number
  seed: number
  bg: string
  width: number
  height: number
}

export type UniformValue = number | number[]
export interface UniformDecl { name: string; type: string }

const BLEND_FN: Record<BlendMode, string> = {
  normal: 'B_normal', multiply: 'B_multiply', screen: 'B_screen', overlay: 'B_overlay',
  'soft-light': 'B_softlight', 'hard-light': 'B_hardlight', add: 'B_add', difference: 'B_difference',
}

const COMMON = /* glsl */ `#version 300 es
precision highp float;
precision highp int;

uniform vec2 uRes;    // output size in px
uniform float uTime;  // seconds into the loop
uniform float uPhase; // 0..2π across one loop — every motion is periodic in this
uniform vec3 uBg;     // document background
out vec4 fragColor;

#define TAU 6.28318530718

float hash11(float n) { return fract(sin(n * 127.1) * 43758.5453123); }
// Hash without Sine — Copyright (c) 2014 David Hoskins, MIT. See THIRD_PARTY_NOTICES.md
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }

// 2D simplex noise — webgl-noise, Copyright (C) 2011 Ashima Arts / Ian McEwan,
// (C) 2011-2016 Stefan Gustavson, MIT. See THIRD_PARTY_NOTICES.md
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
float fbm(vec2 p, int oct) {
  float s = 0.0, a = 0.5;
  // Rotate each octave by ~0.52 rad to break up grid alignment; lacunarity 1.97.
  mat2 r = mat2(0.866, 0.5, -0.5, 0.866);
  for (int i = 0; i < 8; i++) { if (i >= oct) break; s += a * snoise(p); p = r * p * 1.97 + vec2(3.1, 5.3); a *= 0.5; }
  return s;
}

// OKLab → sRGB, after Björn Ottosson's reference (c) 2020, public domain / MIT. See THIRD_PARTY_NOTICES.md
vec3 oklab2srgb(vec3 c) {
  float l_ = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
  float m_ = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
  float s_ = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;
  float l = l_ * l_ * l_, m = m_ * m_ * m_, s = s_ * s_ * s_;
  vec3 lin = clamp(vec3(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
   -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
   -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s), 0.0, 1.0);
  return mix(12.92 * lin, 1.055 * pow(lin, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, lin));
}

// blend modes (sRGB-encoded, as in Photoshop / Figma)
vec3 B_normal(vec3 b, vec3 s) { return s; }
vec3 B_multiply(vec3 b, vec3 s) { return b * s; }
vec3 B_screen(vec3 b, vec3 s) { return 1.0 - (1.0 - b) * (1.0 - s); }
vec3 B_overlay(vec3 b, vec3 s) { return mix(2.0 * b * s, 1.0 - 2.0 * (1.0 - b) * (1.0 - s), step(0.5, b)); }
vec3 B_softlight(vec3 b, vec3 s) { return mix(2.0 * b * s + b * b * (1.0 - 2.0 * s), sqrt(max(b, 0.0)) * (2.0 * s - 1.0) + 2.0 * b * (1.0 - s), step(0.5, s)); }
vec3 B_hardlight(vec3 b, vec3 s) { return B_overlay(s, b); }
vec3 B_add(vec3 b, vec3 s) { return min(b + s, 1.0); }
vec3 B_difference(vec3 b, vec3 s) { return abs(b - s); }
`

const HELPERS: Record<string, string> = {
  meshGradient: /* glsl */ `
vec3 meshGradient(vec2 p, vec3 cols[8], int n, float soft, float scale, float drift, float cycles, float salt) {
  float asp = uRes.x / uRes.y;
  vec2 q = (p - 0.5) * vec2(asp, 1.0) / scale;
  vec3 acc = vec3(0.0);
  float tw = 0.0;
  float pw = mix(7.0, 1.4, soft);
  for (int k = 0; k < 8; k++) {
    if (k >= n) break;
    float fk = float(k) + salt;
    vec2 home = (vec2(hash11(fk * 3.17 + 0.3), hash11(fk * 7.41 + 1.9)) - 0.5) * vec2(asp * 0.95, 0.95);
    float ph = hash11(fk * 1.93 + 4.2) * TAU;
    float dir = hash11(fk * 5.3 + 2.7) > 0.5 ? 1.0 : -1.0;
    float a = uPhase * cycles * dir + ph;
    vec2 orbit = vec2(cos(a), sin(a * (1.0 + mod(float(k), 2.0)))) * 0.3 * drift;
    float d = length(q - home - orbit);
    float w = 1.0 / (pow(d, pw) + 1e-4);
    acc += cols[k] * w;
    tw += w;
  }
  return oklab2srgb(acc / max(tw, 1e-6));
}`,
  gradientFill: /* glsl */ `
vec3 gradientFill(vec2 p, float pos[8], vec3 cols[8], int n, float ang, int shape, float spin) {
  float asp = uRes.x / uRes.y;
  vec2 q = (p - 0.5) * vec2(asp, 1.0);
  float a = radians(ang) + uPhase * spin;
  float t;
  if (shape == 0) { vec2 d = vec2(sin(a), cos(a)); float ext = abs(d.x) * asp * 0.5 + abs(d.y) * 0.5; t = dot(q, d) / (2.0 * ext) + 0.5; }
  else if (shape == 1) { t = length(q) / (0.5 * length(vec2(asp, 1.0))); }
  else { t = fract((atan(q.x, q.y) - a) / TAU); }
  t = clamp(t, 0.0, 1.0);
  vec3 c = cols[0];
  for (int k = 1; k < 8; k++) { if (k >= n) break; c = mix(c, cols[k], clamp((t - pos[k - 1]) / max(pos[k] - pos[k - 1], 1e-4), 0.0, 1.0)); }
  return oklab2srgb(c);
}`,
  warpDomain: /* glsl */ `
vec2 warpDomain(vec2 p, int style, float amt, float sc, int oct, float evolve, float cycles, float salt) {
  vec2 k = vec2(uRes.x / uRes.y, 1.0);
  vec2 q = (p - 0.5) * k;
  if (style == 0) {
    vec2 s = q * sc + salt * 3.1;
    vec2 o = vec2(cos(uPhase), sin(uPhase)) * evolve;
    // Two-level domain warp (technique described by Inigo Quilez, "Domain warping"); offsets are our own.
    vec2 a = vec2(fbm(s + o, oct), fbm(s + vec2(3.7, 6.1) - o, oct));
    vec2 b = vec2(fbm(s + 1.6 * a + vec2(4.9, 2.3) + o * 0.5, oct), fbm(s + 1.6 * a + vec2(7.4, 8.6) - o * 0.5, oct));
    q += amt * 0.4 * b;
  } else if (style == 1) {
    float r = length(q);
    float ang = amt * 3.0 * exp(-r * sc * 1.2) * (1.0 + 0.35 * sin(uPhase * cycles));
    float c = cos(ang), s2 = sin(ang);
    q = mat2(c, s2, -s2, c) * q;
  } else if (style == 2) {
    q += amt * 0.06 * vec2(sin(q.y * sc * TAU + uPhase * cycles), sin(q.x * sc * 5.3 + uPhase * cycles + 1.7));
  } else {
    float r = length(q) + 1e-4;
    q += (q / r) * amt * 0.03 * sin(r * sc * 24.0 - uPhase * cycles);
  }
  return q / k + 0.5;
}`,
  gradientMap: /* glsl */ `
vec3 gradientMap(float t, vec3 cols[8], int n) {
  if (n < 2) return oklab2srgb(cols[0]);
  float x = t * float(n - 1);
  int i = clamp(int(floor(x)), 0, n - 2);
  return oklab2srgb(mix(cols[i], cols[i + 1], clamp(x - float(i), 0.0, 1.0)));
}`,
  grainNoise: /* glsl */ `
vec3 grainNoise(vec2 p, float size, float anim, float chroma, float salt) {
  vec2 cell = floor(p * uRes / max(size * uRes.y / 1080.0, 1e-3));
  float f = anim > 0.5 ? floor(uTime * 24.0) : 0.0;
  vec2 o = vec2(f * 17.13 + salt * 11.0, f * 7.31);
  // two taps → a soft bell around 0.5, closer to film than flat white noise
  float n = (hash12(cell + o) + hash12(cell + o + 91.3)) * 0.5;
  return chroma > 0.5 ? vec3(n, (hash12(cell + o + 31.7) + hash12(cell + o + 12.9)) * 0.5, (hash12(cell + o + 63.1) + hash12(cell + o + 47.3)) * 0.5) : vec3(n);
}`,
}
const HELPER_FOR: Partial<Record<string, string>> = { mesh: 'meshGradient', gradient: 'gradientFill', warp: 'warpDomain', gradmap: 'gradientMap', grain: 'grainNoise' }

/** stable 0–10 salt per layer id, so reordering never reshuffles a layer's noise */
const saltOf = (id: string, seed: number) => {
  let h = 2166136261
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return (((h >>> 0) % 1000) / 100 + (seed % 997) * 0.731) % 50
}

const visibleBottomUp = (layers: Layer[]) => layers.filter((l) => l.visible).slice().reverse()

/** A key that changes only when the shader source must change (types, order, visibility, blend). */
export const structureKey = (layers: Layer[]) => visibleBottomUp(layers).map((l) => `${l.type}:${l.blend}`).join('|')

export function buildShader(layers: Layer[]): { fragment: string; uniforms: UniformDecl[] } {
  const stack = visibleBottomUp(layers)
  const decls: UniformDecl[] = [
    { name: 'uRes', type: 'vec2' }, { name: 'uTime', type: 'float' }, { name: 'uPhase', type: 'float' }, { name: 'uBg', type: 'vec3' },
  ]
  const helpers = new Set<string>()
  const fns: string[] = ['vec3 L0(vec2 p) { return uBg; }']
  const uniformLines: string[] = []

  stack.forEach((layer, k) => {
    const i = k + 1
    const def = LAYER_TYPES[layer.type]
    const u = (n: string) => `u${i}_${n}`
    const prev = `L${i - 1}`
    const all = [...def.uniforms.map((x) => ({ name: x.name, type: x.type })), { name: 'opacity', type: 'float' }, { name: 'salt', type: 'float' }]
    for (const x of all) {
      const arr = x.type.match(/^(\w+)\[(\d+)\]$/)
      uniformLines.push(arr ? `uniform ${arr[1]} ${u(x.name)}[${arr[2]}];` : `uniform ${x.type} ${u(x.name)};`)
      decls.push({ name: u(x.name), type: x.type })
    }
    const h = HELPER_FOR[layer.type]
    if (h) helpers.add(h)
    const head = `// ${i} · ${layer.name}${def.kind === 'domain' ? '' : ` · ${layer.blend}`}`
    if (def.kind === 'fill') {
      fns.push(`${head}\nvec3 L${i}(vec2 p) {\n  vec3 b = ${prev}(p);\n  vec4 s;\n  ${def.glsl(u, prev).trim()}\n  return mix(b, ${BLEND_FN[layer.blend]}(b, s.rgb), clamp(s.a * ${u('opacity')}, 0.0, 1.0));\n}`)
    } else if (def.kind === 'domain') {
      fns.push(`${head}\nvec3 L${i}(vec2 p) {\n  vec2 w;\n  ${def.glsl(u, prev).trim()}\n  return ${prev}(mix(p, w, ${u('opacity')}));\n}`)
    } else {
      fns.push(`${head}\nvec3 L${i}(vec2 p) {\n  vec3 b, s;\n  ${def.glsl(u, prev).trim()}\n  return mix(b, ${BLEND_FN[layer.blend]}(b, s), clamp(${u('opacity')}, 0.0, 1.0));\n}`)
    }
  })

  const top = `L${stack.length}`
  const fragment = [
    COMMON.trim(),
    uniformLines.length ? `\n// layer uniforms\n${uniformLines.join('\n')}` : '',
    ...[...helpers].map((h) => HELPERS[h]),
    '',
    fns.join('\n\n'),
    '',
    `void main() {
  vec2 p = gl_FragCoord.xy / uRes;
  vec3 c = ${top}(p);
  c += (hash12(gl_FragCoord.xy) - 0.5) / 255.0; // de-band smooth gradients
  fragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}`,
  ].join('\n')
  return { fragment, uniforms: decls }
}

/** Uniform values for one frame. Pure in (layers, doc). */
export function uniformValues(layers: Layer[], doc: DocUniforms): Record<string, UniformValue> {
  const out: Record<string, UniformValue> = {
    uRes: [doc.width, doc.height],
    uTime: doc.time,
    uPhase: (doc.time / Math.max(0.001, doc.loop)) * Math.PI * 2,
    uBg: hexToRgb01(doc.bg),
  }
  visibleBottomUp(layers).forEach((layer, k) => {
    const i = k + 1
    const def = LAYER_TYPES[layer.type]
    for (const x of def.uniforms) out[`u${i}_${x.name}`] = x.get(layer.params)
    out[`u${i}_opacity`] = layer.opacity
    out[`u${i}_salt`] = saltOf(layer.id, doc.seed)
  })
  return out
}
