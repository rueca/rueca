/* ---------------------------------------------------------------------------
   Node catalogue: what each node is called, where it lives in the library,
   and its parameter schema (the same kit schema the inspector renders).
   Ports live in engine/spec.ts so the worker can read them.
--------------------------------------------------------------------------- */
import type { ComponentType } from 'react'
import {
  Waves, Blend, Circle, Square, Star, Hexagon, Move3d, Droplets, Contrast, Palette, Layers2, Hash, Pipette, MonitorPlay,
  SwatchBook, MoveRight, CircleDot, RotateCw, Diamond,
} from 'lucide-react'
import { defineSchema, folder, p, defaultsOf, type Schema } from '@kit'
import { BLEND_MODES } from '../engine/ops'

export type Category = 'Generate' | 'Filter' | 'Composite' | 'Colour' | 'Value' | 'Output'
export const CATEGORIES: Category[] = ['Generate', 'Filter', 'Composite', 'Colour', 'Value', 'Output']
/** CSS var per category — graph/graph.css maps them onto the kit's categorical tokens. */
export const catVar = (c: Category) => `var(--node-cat-${c.toLowerCase()})`

type Icon = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>

export interface NodeDef {
  kind: string
  label: string
  category: Category
  icon: Icon
  description: string
  keywords?: string[]
  schema: Schema
}

const pct = (v: number) => `${Math.round(v * 100)}%`

const defs: NodeDef[] = [
  {
    kind: 'noise', label: 'Noise', category: 'Generate', icon: Waves,
    description: 'Fractal gradient, ridged, turbulent or cellular noise.', keywords: ['fbm', 'perlin', 'worley', 'voronoi', 'cells', 'clouds'],
    schema: defineSchema({
      noise: folder('Noise', {
        kind: p.select('fbm', [{ value: 'fbm', label: 'Fractal' }, { value: 'ridged', label: 'Ridged' }, { value: 'turbulence', label: 'Turbulence' }, { value: 'cells', label: 'Cells' }, { value: 'cracks', label: 'Cracks' }], { label: 'Type', hint: 'Fractal = soft clouds, Ridged = mountain crests, Cells / Cracks = Worley.' }),
        scale: p.number(4, { min: 0.5, max: 32, step: 0.1, hint: 'How many features fit across the image.' }),
        octaves: p.number(5, { min: 1, max: 8, step: 1, hint: 'Layers of detail. Each one costs another pass.' }),
        roughness: p.number(0.5, { min: 0, max: 1, step: 0.01, hint: 'How much each finer octave contributes (persistence).' }),
        lacunarity: p.number(2, { min: 1.2, max: 3.5, step: 0.05, more: true, label: 'Lacunarity', hint: 'Frequency step between octaves.' }),
        seed: p.seed(7),
      }),
      shaping: folder('Shaping', {
        warp: p.number(0, { min: 0, max: 3, step: 0.01, label: 'Domain warp', hint: 'Bends the coordinates by another noise — marbled, liquid looks.' }),
        contrast: p.number(1, { min: 0.2, max: 4, step: 0.01 }),
        offset: p.vec2({ x: 0, y: 0 }, { min: -4, max: 4, step: 0.01, display: 'fields', hint: 'Pan through the noise field.' }),
        invert: p.boolean(false),
      }),
    }),
  },
  {
    kind: 'gradient', label: 'Gradient', category: 'Generate', icon: SwatchBook,
    description: 'Linear, radial, conic or diamond ramp of colour stops.', keywords: ['ramp', 'linear', 'radial', 'vignette', 'conic'],
    schema: defineSchema({
      gradient: folder('Gradient', {
        kind: p.select('linear', [{ value: 'linear', icon: MoveRight, hint: 'Linear' }, { value: 'radial', icon: CircleDot, hint: 'Radial' }, { value: 'conic', icon: RotateCw, hint: 'Conic' }, { value: 'diamond', icon: Diamond, hint: 'Diamond' }], { label: 'Type' }),
        grad: p.gradient({ angle: 90, stops: [{ pos: 0, color: '#0b1026' }, { pos: 1, color: '#f6c28b' }] }, { label: 'Stops', hint: 'The angle applies to linear and conic types.' }),
        center: p.vec2({ x: 0, y: 0 }, { min: -0.5, max: 0.5, step: 0.01, display: 'fields', hint: 'Origin for radial, conic and diamond.', when: (v) => v.kind !== 'linear' }),
        spread: p.number(1, { min: 0.1, max: 3, step: 0.01, hint: 'Stretches the ramp.' }),
        repeat: p.number(1, { min: 1, max: 12, step: 1, hint: 'Tile the ramp into bands.' }),
      }),
    }),
  },
  {
    kind: 'shape', label: 'Shape', category: 'Generate', icon: Hexagon,
    description: 'Anti-aliased circle, rectangle, star or polygon from a distance field.', keywords: ['circle', 'rect', 'star', 'polygon', 'sdf', 'mask'],
    schema: defineSchema({
      shape: folder('Shape', {
        kind: p.select('circle', [{ value: 'circle', icon: Circle, hint: 'Circle' }, { value: 'rect', icon: Square, hint: 'Rectangle' }, { value: 'star', icon: Star, hint: 'Star' }, { value: 'polygon', icon: Hexagon, hint: 'Polygon' }], { label: 'Type' }),
        size: p.number(0.55, { min: 0, max: 1.4, step: 0.01, fmt: pct }),
        points: p.number(5, { min: 3, max: 16, step: 1, when: (v) => v.kind === 'star' || v.kind === 'polygon' }),
        inner: p.number(0.45, { min: 0, max: 1, step: 0.01, label: 'Inner radius', when: (v) => v.kind === 'star', hint: '1 turns the star into a polygon.' }),
        roundness: p.number(0.08, { min: 0, max: 0.5, step: 0.005, when: (v) => v.kind === 'rect', label: 'Corner radius' }),
        rotation: p.angle(0),
        position: p.vec2({ x: 0, y: 0 }, { min: -0.5, max: 0.5, step: 0.01, display: 'fields' }),
      }),
      fill: folder('Fill', {
        fill: p.color('#ffffff'),
        background: p.color('#00000000'),
        outline: p.boolean(false, { hint: 'Stroke the edge instead of filling.' }),
        stroke: p.number(0.02, { min: 0.002, max: 0.2, step: 0.001, label: 'Stroke width', when: (v) => v.outline }),
        softness: p.number(0, { min: 0, max: 0.25, step: 0.001, hint: 'Feathers the edge. 0 is a crisp anti-aliased line.' }),
      }),
    }),
  },
  {
    kind: 'transform', label: 'Transform', category: 'Filter', icon: Move3d,
    description: 'Offset, scale and rotate with repeat, mirror or clamp edges.', keywords: ['move', 'scale', 'rotate', 'tile', 'repeat'],
    schema: defineSchema({
      transform: folder('Transform', {
        offset: p.vec2({ x: 0, y: 0 }, { min: -1, max: 1, step: 0.01, display: 'fields' }),
        scale: p.number(1, { min: 0.05, max: 8, step: 0.01, fmt: (v) => `${v.toFixed(2)}×` }),
        rotate: p.angle(0),
        wrap: p.select('repeat', ['repeat', 'mirror', 'clamp', 'none'], { label: 'Edges', hint: 'What happens outside the source image.' }),
      }),
    }),
  },
  {
    kind: 'blur', label: 'Blur', category: 'Filter', icon: Droplets,
    description: 'Gaussian-like blur, optionally in one direction.', keywords: ['soften', 'gaussian', 'motion', 'glow'],
    schema: defineSchema({
      blur: folder('Blur', {
        radius: p.number(2, { min: 0, max: 20, step: 0.1, unit: '%', hint: 'Percent of the image width, so it looks the same at every resolution.' }),
        direction: p.select('both', [{ value: 'both', label: 'Both' }, { value: 'horizontal', label: 'Horiz.' }, { value: 'vertical', label: 'Vert.' }]),
        quality: p.number(3, { min: 1, max: 4, step: 1, more: true, hint: 'Box-blur passes. 3 is close to a true gaussian.' }),
      }),
    }),
  },
  {
    kind: 'threshold', label: 'Threshold', category: 'Filter', icon: Contrast,
    description: 'Turns luminance into a black and white mask.', keywords: ['mask', 'posterize', 'step', 'cutoff'],
    schema: defineSchema({
      threshold: folder('Threshold', {
        level: p.number(0.5, { min: 0, max: 1, step: 0.005 }),
        softness: p.number(0.02, { min: 0, max: 0.5, step: 0.005, hint: 'Width of the transition. 0 is a hard edge.' }),
        invert: p.boolean(false),
      }),
    }),
  },
  {
    kind: 'blend', label: 'Blend', category: 'Composite', icon: Layers2,
    description: 'Composites Blend over Base with a blend mode.', keywords: ['multiply', 'screen', 'overlay', 'composite', 'layer'],
    schema: defineSchema({
      blend: folder('Blend', {
        mode: p.select('normal', BLEND_MODES.map((m) => ({ value: m, label: m.charAt(0).toUpperCase() + m.slice(1) }))),
        opacity: p.number(1, { min: 0, max: 1, step: 0.01, fmt: pct }),
      }),
    }),
  },
  {
    kind: 'mix', label: 'Mix', category: 'Composite', icon: Blend,
    description: 'Cross-fades A to B, optionally through a mask.', keywords: ['lerp', 'crossfade', 'mask', 'fade'],
    schema: defineSchema({
      mix: folder('Mix', {
        amount: p.number(0.5, { min: 0, max: 1, step: 0.01, fmt: pct, hint: 'With a mask connected, white areas take this much of B.' }),
      }),
    }),
  },
  {
    kind: 'ramp', label: 'Colour ramp', category: 'Colour', icon: Palette,
    description: 'Maps brightness onto a palette — the colour grading node.', keywords: ['color ramp', 'gradient map', 'palette', 'lut', 'colorize'],
    schema: defineSchema({
      ramp: folder('Ramp', {
        colors: p.palette(['#0b1026', '#3b2f6b', '#e0607e', '#f6c28b', '#fff4e0'], { label: 'Colours', max: 8, hint: 'Dark to light. Evenly spaced; use Bias to shift them.' }),
        interp: p.select('smooth', ['smooth', 'linear', 'steps'], { label: 'Blend' }),
        bias: p.number(0, { min: -1, max: 1, step: 0.01, hint: 'Pushes the mapping toward the dark or light end.' }),
        reverse: p.boolean(false),
      }),
    }),
  },
  {
    kind: 'number', label: 'Number', category: 'Value', icon: Hash,
    description: 'A constant you can wire into any number input.', keywords: ['value', 'float', 'constant', 'slider'],
    schema: defineSchema({ value: folder('Value', { value: p.number(0.5, { step: 0.01, display: 'field', hint: 'Wire into Opacity, Radius, Level, Rotate…' }) }) }),
  },
  {
    kind: 'color', label: 'Colour', category: 'Value', icon: Pipette,
    description: 'A constant colour for colour inputs.', keywords: ['color', 'swatch', 'rgb', 'constant'],
    schema: defineSchema({ color: folder('Colour', { color: p.color('#ff6a3d') }) }),
  },
  {
    kind: 'output', label: 'Output', category: 'Output', icon: MonitorPlay,
    description: 'The final image — what the preview shows and Export writes.', keywords: ['result', 'final', 'export', 'render'],
    schema: defineSchema({
      output: folder('Output', {
        flatten: p.boolean(false, { label: 'Flatten', hint: 'Composite onto a solid background so the PNG has no transparency.' }),
        background: p.color('#000000', { alpha: false, when: (v) => v.flatten }),
      }),
    }),
  },
]

export const DEFS: Record<string, NodeDef> = Object.fromEntries(defs.map((d) => [d.kind, d]))
export const DEF_LIST = defs
export const defOf = (kind: string): NodeDef => DEFS[kind] ?? DEFS.number
export const defaultParams = (kind: string) => structuredClone(defaultsOf(defOf(kind).schema)) as Record<string, unknown>
