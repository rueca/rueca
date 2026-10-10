/* ---------------------------------------------------------------------------
   Effect layer types. Each type is: a kit schema (drives its inspector), the
   uniforms it needs, and a GLSL snippet. codegen.ts stitches the visible
   stack into ONE fragment shader — so the stack you see is exactly the code
   you copy out.

   Three kinds of layer:
     fill      produces a colour `s` (+ coverage) composited onto what is below
               with a blend mode and opacity (gradients, grain, vignette…)
     domain    bends the coordinates of everything below it (warp)
     resample  re-reads what is below at other coordinates (halftone, RGB split)
--------------------------------------------------------------------------- */
import { Aperture, Blend, Contrast, Focus, Grip, Rainbow, Rows3, Sparkles, Sunset, Waves, type LucideIcon } from 'lucide-react'
import { defineSchema, folder, p, defaultsOf, type Schema } from '@kit'
import { hexToOklab, hexToRgb01 } from './color'

export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light' | 'hard-light' | 'add' | 'difference'
export const BLENDS: { value: BlendMode; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'screen', label: 'Screen' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'soft-light', label: 'Soft light' },
  { value: 'hard-light', label: 'Hard light' },
  { value: 'add', label: 'Add' },
  { value: 'difference', label: 'Difference' },
]

export type LayerType = 'mesh' | 'gradient' | 'warp' | 'chromatic' | 'halftone' | 'posterize' | 'gradmap' | 'grain' | 'vignette' | 'scanlines'

export interface Layer {
  id: string
  type: LayerType
  name: string
  visible: boolean
  blend: BlendMode
  opacity: number
  params: Record<string, any>
}

type Uni = { name: string; type: 'float' | 'int' | 'vec3' | 'vec3[8]' | 'float[8]'; get: (p: any) => number | number[] }

export interface LayerTypeDef {
  type: LayerType
  label: string
  category: 'Fill' | 'Distort' | 'Stylise' | 'Finish'
  icon: LucideIcon
  kind: 'fill' | 'domain' | 'resample'
  hint: string
  schema: Schema
  blend: BlendMode
  opacity: number
  uniforms: Uni[]
  /** GLSL. `u('x')` is this layer's uniform, `prev` the function that renders everything below. */
  glsl: (u: (n: string) => string, prev: string) => string
}

/* --- helpers for uniform packing --- */
const lab8 = (colors: string[]) => { const out: number[] = []; for (let i = 0; i < 8; i++) out.push(...hexToOklab(colors[Math.min(i, colors.length - 1)] ?? '#000000')); return out }
const rgb = (hex: string) => hexToRgb01(hex) as number[]
const idx = (opts: string[]) => (v: string) => Math.max(0, opts.indexOf(v))

const WARP_STYLES = ['flow', 'swirl', 'waves', 'ripple']
const GRAD_SHAPES = ['linear', 'radial', 'conic']
const HT_SHAPES = ['dot', 'line', 'square']

/* --------------------------------------------------------------------------- */
export const LAYER_TYPES: Record<LayerType, LayerTypeDef> = {
  mesh: {
    type: 'mesh', label: 'Mesh gradient', category: 'Fill', icon: Blend, kind: 'fill', blend: 'normal', opacity: 1,
    hint: 'Soft colour points drifting on looping orbits, mixed in OKLab.',
    schema: defineSchema({
      mesh: folder('Mesh', {
        colors: p.palette(['#181411', '#5E2219', '#E8582C', '#F2C744', '#F3F1EB'], { max: 8, hint: 'Each colour is a point in the mesh. Up to eight.' }),
        softness: p.number(0.55, { min: 0, max: 1, step: 0.01, hint: 'How far each colour bleeds into its neighbours.' }),
        scale: p.number(1, { min: 0.3, max: 3, step: 0.01, unit: '×', hint: 'Zoom of the point field.' }),
        drift: p.number(0.6, { min: 0, max: 1.5, step: 0.01, hint: 'How far points travel around their home position.' }),
        cycles: p.number(1, { min: 0, max: 4, step: 1, hint: 'Orbits per loop. Whole numbers keep the loop seamless.' }),
      }),
    }),
    uniforms: [
      { name: 'colors', type: 'vec3[8]', get: (v) => lab8(v.colors) },
      { name: 'count', type: 'int', get: (v) => Math.min(8, v.colors.length) },
      { name: 'softness', type: 'float', get: (v) => v.softness },
      { name: 'scale', type: 'float', get: (v) => v.scale },
      { name: 'drift', type: 'float', get: (v) => v.drift },
      { name: 'cycles', type: 'float', get: (v) => v.cycles },
    ],
    glsl: (u) => `s = vec4(meshGradient(p, ${u('colors')}, ${u('count')}, ${u('softness')}, ${u('scale')}, ${u('drift')}, ${u('cycles')}, ${u('salt')}), 1.0);`,
  },

  gradient: {
    type: 'gradient', label: 'Gradient', category: 'Fill', icon: Sunset, kind: 'fill', blend: 'normal', opacity: 1,
    hint: 'Linear, radial or conic ramp, interpolated in OKLab.',
    schema: defineSchema({
      gradient: folder('Gradient', {
        ramp: p.gradient({ angle: 160, stops: [{ pos: 0, color: '#5E2219' }, { pos: 0.55, color: '#E8582C' }, { pos: 1, color: '#F0DBA1' }] }, { hint: 'Stops and direction.' }),
        shape: p.select('linear', GRAD_SHAPES),
        spin: p.number(0, { min: -3, max: 3, step: 1, hint: 'Full turns per loop.' }),
      }),
    }),
    uniforms: [
      { name: 'pos', type: 'float[8]', get: (v) => { const s = [...v.ramp.stops].sort((a: any, b: any) => a.pos - b.pos); return Array.from({ length: 8 }, (_, i) => s[Math.min(i, s.length - 1)].pos) } },
      { name: 'colors', type: 'vec3[8]', get: (v) => lab8([...v.ramp.stops].sort((a: any, b: any) => a.pos - b.pos).map((s: any) => s.color)) },
      { name: 'count', type: 'int', get: (v) => Math.min(8, v.ramp.stops.length) },
      { name: 'angle', type: 'float', get: (v) => v.ramp.angle },
      { name: 'shape', type: 'int', get: (v) => idx(GRAD_SHAPES)(v.shape) },
      { name: 'spin', type: 'float', get: (v) => v.spin },
    ],
    glsl: (u) => `s = vec4(gradientFill(p, ${u('pos')}, ${u('colors')}, ${u('count')}, ${u('angle')}, ${u('shape')}, ${u('spin')}), 1.0);`,
  },

  warp: {
    type: 'warp', label: 'Warp', category: 'Distort', icon: Waves, kind: 'domain', blend: 'normal', opacity: 1,
    hint: 'Bends everything below it. Opacity blends between straight and warped.',
    schema: defineSchema({
      warp: folder('Warp', {
        style: p.select('flow', WARP_STYLES, { display: 'dropdown', hint: 'Flow is a two-level noise domain warp; the others are geometric.' }),
        amount: p.number(0.45, { min: 0, max: 1.5, step: 0.01 }),
        scale: p.number(1.4, { min: 0.2, max: 8, step: 0.05, hint: 'Feature size. Higher = busier.' }),
        detail: p.number(4, { min: 1, max: 7, step: 1, hint: 'Noise octaves. Costs GPU time.', when: (v) => v.style === 'flow' }),
        evolve: p.number(0.6, { min: 0, max: 2, step: 0.01, hint: 'How far the noise travels through one loop.', when: (v) => v.style === 'flow' }),
        cycles: p.number(1, { min: 0, max: 6, step: 1, hint: 'Wave cycles per loop.', when: (v) => v.style !== 'flow' }),
      }),
    }),
    uniforms: [
      { name: 'style', type: 'int', get: (v) => idx(WARP_STYLES)(v.style) },
      { name: 'amount', type: 'float', get: (v) => v.amount },
      { name: 'scale', type: 'float', get: (v) => v.scale },
      { name: 'detail', type: 'int', get: (v) => v.detail },
      { name: 'evolve', type: 'float', get: (v) => v.evolve },
      { name: 'cycles', type: 'float', get: (v) => v.cycles },
    ],
    glsl: (u) => `w = warpDomain(p, ${u('style')}, ${u('amount')}, ${u('scale')}, ${u('detail')}, ${u('evolve')}, ${u('cycles')}, ${u('salt')});`,
  },

  chromatic: {
    type: 'chromatic', label: 'Chromatic aberration', category: 'Distort', icon: Aperture, kind: 'resample', blend: 'normal', opacity: 1,
    hint: 'Splits red and blue apart. Renders everything below three times.',
    schema: defineSchema({
      rgb: folder('Split', {
        amount: p.number(6, { min: 0, max: 60, step: 0.5, unit: 'px', hint: 'Offset at 1080p; scales with the output.' }),
        radial: p.boolean(true, { hint: 'Push channels away from the centre, like a lens.' }),
        angle: p.angle(0, { when: (v) => !v.radial }),
      }),
    }),
    uniforms: [
      { name: 'amount', type: 'float', get: (v) => v.amount },
      { name: 'radial', type: 'float', get: (v) => (v.radial ? 1 : 0) },
      { name: 'angle', type: 'float', get: (v) => v.angle },
    ],
    glsl: (u, prev) => `
    vec2 dir = ${u('radial')} > .5 ? (p - .5) * 2.0 * vec2(uRes.x / uRes.y, 1.0) : vec2(cos(radians(${u('angle')})), sin(radians(${u('angle')})));
    vec2 o = dir * (${u('amount')} / 1080.0) / vec2(uRes.x / uRes.y, 1.0);
    b = ${prev}(p);
    s = vec3(${prev}(p + o).r, b.g, ${prev}(p - o).b);`,
  },

  halftone: {
    type: 'halftone', label: 'Halftone', category: 'Stylise', icon: Grip, kind: 'resample', blend: 'normal', opacity: 1,
    hint: 'Re-screens everything below as a rotated dot, line or square grid.',
    schema: defineSchema({
      screen: folder('Screen', {
        shape: p.select('dot', HT_SHAPES),
        cell: p.number(14, { min: 3, max: 80, step: 0.5, unit: 'px', hint: 'Cell size at 1080p.' }),
        angle: p.angle(45),
        contrast: p.number(1.1, { min: 0.3, max: 3, step: 0.01, hint: 'Gamma on darkness before it becomes dot size.' }),
      }),
      ink: folder('Ink', {
        inkMode: p.select('source', [{ value: 'source', label: 'Source' }, { value: 'ink', label: 'Single ink' }], { label: 'Colour', hint: 'Dots take the colour beneath them, or one ink.' }),
        ink: p.color('#181411', { alpha: false, when: (v) => v.inkMode === 'ink' }),
        paper: p.color('#F3F1EB', { alpha: false }),
      }),
    }),
    uniforms: [
      { name: 'shape', type: 'int', get: (v) => idx(HT_SHAPES)(v.shape) },
      { name: 'cell', type: 'float', get: (v) => v.cell },
      { name: 'angle', type: 'float', get: (v) => v.angle },
      { name: 'contrast', type: 'float', get: (v) => v.contrast },
      { name: 'mode', type: 'int', get: (v) => (v.inkMode === 'ink' ? 1 : 0) },
      { name: 'ink', type: 'vec3', get: (v) => rgb(v.ink) },
      { name: 'paper', type: 'vec3', get: (v) => rgb(v.paper) },
    ],
    glsl: (u, prev) => `
    float asp = uRes.x / uRes.y;
    float cell = ${u('cell')} / 1080.0;
    float a = radians(${u('angle')});
    mat2 R = mat2(cos(a), sin(a), -sin(a), cos(a));
    vec2 g = (R * ((p - .5) * vec2(asp, 1.0))) / cell;
    vec2 id = floor(g) + .5;
    vec2 f = g - id;
    vec2 cp = (transpose(R) * (id * cell)) / vec2(asp, 1.0) + .5;
    vec3 sc = ${prev}(cp);
    b = ${prev}(p);
    float dark = clamp(pow(1.0 - dot(sc, vec3(.299, .587, .114)), ${u('contrast')}), 0.0, 1.0);
    float d, r;
    if (${u('shape')} == 0) { d = length(f); r = sqrt(dark) * .7072; }
    else if (${u('shape')} == 1) { d = abs(f.y); r = dark * .5; }
    else { d = max(abs(f.x), abs(f.y)); r = sqrt(dark) * .5; }
    float aa = max(length(fwidth(g)) * .75, 1e-4);
    float m = 1.0 - smoothstep(r - aa, r + aa, d);
    s = mix(${u('paper')}, ${u('mode')} == 0 ? sc : ${u('ink')}, m);`,
  },

  posterize: {
    type: 'posterize', label: 'Posterize', category: 'Stylise', icon: Contrast, kind: 'fill', blend: 'normal', opacity: 1,
    hint: 'Quantises each channel to a few levels — screen-print bands.',
    schema: defineSchema({
      bands: folder('Bands', {
        levels: p.number(5, { min: 2, max: 16, step: 1 }),
        gamma: p.number(1, { min: 0.4, max: 2.5, step: 0.01, hint: 'Shifts where the band edges fall.' }),
      }),
    }),
    uniforms: [
      { name: 'levels', type: 'float', get: (v) => v.levels },
      { name: 'gamma', type: 'float', get: (v) => v.gamma },
    ],
    glsl: (u) => `vec3 g = pow(b, vec3(${u('gamma')})); s = vec4(pow(floor(g * ${u('levels')} + .5) / ${u('levels')}, vec3(1.0 / ${u('gamma')})), 1.0);`,
  },

  gradmap: {
    type: 'gradmap', label: 'Gradient map', category: 'Stylise', icon: Rainbow, kind: 'fill', blend: 'normal', opacity: 1,
    hint: 'Maps brightness onto a colour ramp — duotones and tritones.',
    schema: defineSchema({
      map: folder('Map', {
        colors: p.palette(['#181411', '#E8582C', '#F3F1EB'], { max: 8, hint: 'Shadows to highlights.' }),
        offset: p.number(0, { min: -0.5, max: 0.5, step: 0.01, hint: 'Slides the ramp along brightness.' }),
      }),
    }),
    uniforms: [
      { name: 'colors', type: 'vec3[8]', get: (v) => lab8(v.colors) },
      { name: 'count', type: 'int', get: (v) => Math.min(8, v.colors.length) },
      { name: 'offset', type: 'float', get: (v) => v.offset },
    ],
    glsl: (u) => `s = vec4(gradientMap(clamp(dot(b, vec3(.299, .587, .114)) + ${u('offset')}, 0.0, 1.0), ${u('colors')}, ${u('count')}), 1.0);`,
  },

  grain: {
    type: 'grain', label: 'Grain', category: 'Finish', icon: Sparkles, kind: 'fill', blend: 'overlay', opacity: 0.32,
    hint: 'Film grain. Overlay at low opacity is the classic recipe.',
    schema: defineSchema({
      grain: folder('Grain', {
        size: p.number(1.4, { min: 0.5, max: 6, step: 0.1, unit: 'px', hint: 'Grain size at 1080p.' }),
        animated: p.boolean(true, { hint: 'Re-roll every frame at 24 fps, like film.' }),
        chroma: p.boolean(false, { label: 'Colour grain', hint: 'Independent noise per channel.' }),
      }),
    }),
    uniforms: [
      { name: 'size', type: 'float', get: (v) => v.size },
      { name: 'animated', type: 'float', get: (v) => (v.animated ? 1 : 0) },
      { name: 'chroma', type: 'float', get: (v) => (v.chroma ? 1 : 0) },
    ],
    glsl: (u) => `s = vec4(grainNoise(p, ${u('size')}, ${u('animated')}, ${u('chroma')}, ${u('salt')}), 1.0);`,
  },

  vignette: {
    type: 'vignette', label: 'Vignette', category: 'Finish', icon: Focus, kind: 'fill', blend: 'multiply', opacity: 0.75,
    hint: 'Darkens or tints toward the edges.',
    schema: defineSchema({
      vignette: folder('Vignette', {
        size: p.number(0.55, { min: 0, max: 1.6, step: 0.01, hint: 'Radius of the clear centre.' }),
        softness: p.number(0.9, { min: 0.02, max: 2, step: 0.01 }),
        roundness: p.number(0.6, { min: 0, max: 1, step: 0.01, hint: '0 follows the frame, 1 is a circle.' }),
        tint: p.color('#181411', { alpha: false }),
      }),
    }),
    uniforms: [
      { name: 'size', type: 'float', get: (v) => v.size },
      { name: 'softness', type: 'float', get: (v) => v.softness },
      { name: 'roundness', type: 'float', get: (v) => v.roundness },
      { name: 'tint', type: 'vec3', get: (v) => rgb(v.tint) },
    ],
    glsl: (u) => `
    vec2 q = (p - .5) * 2.0 * vec2(mix(1.0, uRes.x / uRes.y, ${u('roundness')}), 1.0);
    float m = smoothstep(${u('size')}, ${u('size')} + ${u('softness')}, length(q));
    s = vec4(mix(vec3(1.0), ${u('tint')}, m), 1.0);`,
  },

  scanlines: {
    type: 'scanlines', label: 'Scanlines', category: 'Finish', icon: Rows3, kind: 'fill', blend: 'overlay', opacity: 0.35,
    hint: 'CRT-style horizontal lines that can roll through the loop.',
    schema: defineSchema({
      lines: folder('Lines', {
        pitch: p.number(4, { min: 1.5, max: 40, step: 0.5, unit: 'px', hint: 'Line spacing at 1080p.' }),
        sharpness: p.number(0.5, { min: 0, max: 1, step: 0.01 }),
        roll: p.number(0, { min: -8, max: 8, step: 1, hint: 'Line pitches travelled per loop.' }),
      }),
    }),
    uniforms: [
      { name: 'pitch', type: 'float', get: (v) => v.pitch },
      { name: 'sharpness', type: 'float', get: (v) => v.sharpness },
      { name: 'roll', type: 'float', get: (v) => v.roll },
    ],
    glsl: (u) => `
    float y = p.y * 1080.0 / ${u('pitch')} + uPhase / 6.2831853 * ${u('roll')};
    float l = .5 + .5 * sin(y * 6.2831853);
    l = mix(l, step(.5, l), ${u('sharpness')});
    s = vec4(vec3(l), 1.0);`,
  },
}

export const CATEGORIES = ['Fill', 'Distort', 'Stylise', 'Finish'] as const

export const typeDefaults = (t: LayerType) => defaultsOf(LAYER_TYPES[t].schema) as Record<string, any>

let n = 0
export const newId = () => `l${Date.now().toString(36)}${(n++).toString(36)}`

export function makeLayer(type: LayerType, over: Partial<Omit<Layer, 'params'>> & { params?: Record<string, any> } = {}): Layer {
  const def = LAYER_TYPES[type]
  return {
    id: newId(),
    type,
    name: def.label,
    visible: true,
    blend: def.blend,
    opacity: def.opacity,
    ...over,
    params: { ...typeDefaults(type), ...(over.params ?? {}) },
  }
}
