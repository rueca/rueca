/* Sample graphs — real starting points, not toy demos. */
import type { SavedGraph } from './store'

const g = (name: string, nodes: SavedGraph['nodes'], edges: [string, string, string, string][]): SavedGraph => ({
  version: 1, name, nodes,
  edges: edges.map(([source, sourceHandle, target, targetHandle]) => ({ source, sourceHandle, target, targetHandle })),
})

export const SAMPLES: { id: string; name: string; description: string; graph: SavedGraph }[] = [
  {
    id: 'terrain', name: 'Terrain study', description: 'Warped fractal noise graded into a topographic palette, vignetted.',
    graph: g('Terrain study', [
      { id: 'noise', kind: 'noise', title: 'Noise', x: 0, y: 0, params: { kind: 'fbm', scale: 2.6, octaves: 7, roughness: 0.55, lacunarity: 2.05, seed: 12, warp: 0.35, contrast: 1.35, offset: { x: 0.2, y: -0.1 }, invert: false } },
      { id: 'ramp', kind: 'ramp', title: 'Colour ramp', x: 250, y: -40, params: { colors: ['#0b2a44', '#14506e', '#2f8aa0', '#e3d6a8', '#7d9a55', '#4c6a33', '#6b5a43', '#f2efe8'], interp: 'linear', bias: 0, reverse: false } },
      { id: 'vignette', kind: 'gradient', title: 'Vignette', x: 250, y: 300, params: { kind: 'radial', grad: { angle: 90, stops: [{ pos: 0.35, color: '#ffffff' }, { pos: 1, color: '#2a2a2a' }] }, center: { x: 0, y: 0 }, spread: 1.45, repeat: 1 } },
      { id: 'blend', kind: 'blend', title: 'Blend', x: 500, y: 120, params: { mode: 'multiply', opacity: 0.85 } },
      { id: 'out', kind: 'output', title: 'Output', x: 750, y: 120, params: { flatten: true, background: '#000000' } },
    ], [['noise', 'out', 'ramp', 'in'], ['ramp', 'out', 'blend', 'base'], ['vignette', 'out', 'blend', 'top'], ['blend', 'out', 'out', 'in']]),
  },
  {
    id: 'moon', name: 'Riso moon', description: 'A cratered disc masked over a night gradient — shows masks and number ports.',
    graph: g('Riso moon', [
      { id: 'size', kind: 'number', title: 'Moon size', x: -250, y: 0, params: { value: 0.64 } },
      { id: 'disc', kind: 'shape', title: 'Disc', x: 0, y: -40, params: { kind: 'circle', size: 0.64, points: 5, inner: 0.45, roundness: 0.08, rotation: 0, position: { x: 0.04, y: 0.02 }, fill: '#ffffff', background: '#00000000', outline: false, stroke: 0.02, softness: 0.004 } },
      { id: 'craters', kind: 'noise', title: 'Craters', x: 0, y: 300, params: { kind: 'cells', scale: 7, octaves: 3, roughness: 0.45, lacunarity: 2.1, seed: 4, warp: 0.15, contrast: 1.4, offset: { x: 0, y: 0 }, invert: false } },
      { id: 'tone', kind: 'ramp', title: 'Moon tone', x: 250, y: 300, params: { colors: ['#8c7f6a', '#cdbf9f', '#f3e8cc'], interp: 'smooth', bias: 0.2, reverse: false } },
      { id: 'sky', kind: 'gradient', title: 'Night sky', x: 250, y: -80, params: { kind: 'radial', grad: { angle: 90, stops: [{ pos: 0, color: '#2a2c5e' }, { pos: 0.45, color: '#161838' }, { pos: 1, color: '#07070f' }] }, center: { x: 0.04, y: 0.02 }, spread: 1.9, repeat: 1 } },
      { id: 'mix', kind: 'mix', title: 'Mask', x: 500, y: 100, params: { amount: 1 } },
      { id: 'grain', kind: 'noise', title: 'Grain', x: 500, y: 420, params: { kind: 'fbm', scale: 32, octaves: 2, roughness: 0.5, lacunarity: 2, seed: 99, warp: 0, contrast: 1.6, offset: { x: 0, y: 0 }, invert: false } },
      { id: 'print', kind: 'blend', title: 'Paper grain', x: 750, y: 180, params: { mode: 'soft light', opacity: 0.3 } },
      { id: 'out', kind: 'output', title: 'Output', x: 1000, y: 180, params: { flatten: true, background: '#000000' } },
    ], [['size', 'out', 'disc', 'size'], ['craters', 'out', 'tone', 'in'], ['sky', 'out', 'mix', 'a'], ['tone', 'out', 'mix', 'b'], ['disc', 'out', 'mix', 'mask'], ['mix', 'out', 'print', 'base'], ['grain', 'out', 'print', 'top'], ['print', 'out', 'out', 'in']]),
  },
  {
    id: 'aurora', name: 'Aurora', description: 'Heavily warped noise smeared vertically and screened over a dusk sky.',
    graph: g('Aurora', [
      { id: 'field', kind: 'noise', title: 'Field', x: 0, y: 0, params: { kind: 'ridged', scale: 2.4, octaves: 5, roughness: 0.5, lacunarity: 2, seed: 31, warp: 1.2, contrast: 1.3, offset: { x: 0.3, y: 0 }, invert: false } },
      { id: 'stretch', kind: 'transform', title: 'Stretch', x: 250, y: 0, params: { offset: { x: 0, y: -0.12 }, scale: 1.4, rotate: 8, wrap: 'mirror' } },
      { id: 'smear', kind: 'blur', title: 'Smear', x: 500, y: 0, params: { radius: 5, direction: 'vertical', quality: 3 } },
      { id: 'grade', kind: 'ramp', title: 'Aurora grade', x: 750, y: 0, params: { colors: ['#000000', '#000000', '#03211f', '#0c6b57', '#2fe0a8', '#a78bff', '#f1fff9'], interp: 'smooth', bias: -0.85, reverse: false } },
      { id: 'sky', kind: 'gradient', title: 'Dusk', x: 750, y: 320, params: { kind: 'linear', grad: { angle: 90, stops: [{ pos: 0, color: '#03050c' }, { pos: 0.7, color: '#101a3d' }, { pos: 1, color: '#3a2a55' }] }, center: { x: 0, y: 0 }, spread: 1, repeat: 1 } },
      { id: 'screen', kind: 'blend', title: 'Screen', x: 1000, y: 140, params: { mode: 'screen', opacity: 1 } },
      { id: 'out', kind: 'output', title: 'Output', x: 1250, y: 140, params: { flatten: true, background: '#000000' } },
    ], [['field', 'out', 'stretch', 'in'], ['stretch', 'out', 'smear', 'in'], ['smear', 'out', 'grade', 'in'], ['sky', 'out', 'screen', 'base'], ['grade', 'out', 'screen', 'top'], ['screen', 'out', 'out', 'in']]),
  },
  {
    id: 'badge', name: 'Star badge', description: 'Two shapes, a colour constant and a rotation driven by a number. Glow is bypassed.',
    graph: g('Star badge', [
      { id: 'gold', kind: 'color', title: 'Gold', x: -250, y: 60, params: { color: '#ffc93c' } },
      { id: 'star', kind: 'shape', title: 'Star', x: 0, y: -60, params: { kind: 'star', size: 0.62, points: 8, inner: 0.55, roundness: 0.08, rotation: 0, position: { x: 0, y: 0 }, fill: '#ffffff', background: '#00000000', outline: false, stroke: 0.02, softness: 0 } },
      { id: 'ring', kind: 'shape', title: 'Ring', x: 0, y: 290, params: { kind: 'circle', size: 0.86, points: 5, inner: 0.45, roundness: 0.08, rotation: 0, position: { x: 0, y: 0 }, fill: '#ffffff', background: '#00000000', outline: true, stroke: 0.025, softness: 0 } },
      { id: 'stack', kind: 'blend', title: 'Stack', x: 250, y: 100, params: { mode: 'normal', opacity: 1 } },
      { id: 'tilt', kind: 'number', title: 'Tilt', x: 250, y: 420, params: { value: 22.5 } },
      { id: 'spin', kind: 'transform', title: 'Spin', x: 500, y: 100, params: { offset: { x: 0, y: 0 }, scale: 1, rotate: 0, wrap: 'none' } },
      { id: 'glow', kind: 'blur', title: 'Glow', x: 750, y: 100, bypass: true, params: { radius: 1.5, direction: 'both', quality: 3 } },
      { id: 'out', kind: 'output', title: 'Output', x: 1000, y: 100, params: { flatten: true, background: '#16161d' } },
    ], [['gold', 'out', 'star', 'fill'], ['gold', 'out', 'ring', 'fill'], ['ring', 'out', 'stack', 'base'], ['star', 'out', 'stack', 'top'], ['stack', 'out', 'spin', 'in'], ['tilt', 'out', 'spin', 'rotate'], ['spin', 'out', 'glow', 'in'], ['glow', 'out', 'out', 'in']]),
  },
]

export const BLANK: SavedGraph = { version: 1, name: 'Untitled', nodes: [{ id: 'out', kind: 'output', title: 'Output', x: 400, y: 80, params: { flatten: false, background: '#000000' } }], edges: [] }
