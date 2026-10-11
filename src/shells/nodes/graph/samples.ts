/* Sample graphs — real starting points, not toy demos. */
import type { SavedGraph } from './store'

const g = (name: string, nodes: SavedGraph['nodes'], edges: [string, string, string, string][]): SavedGraph => ({
  version: 1, name, nodes,
  edges: edges.map(([source, sourceHandle, target, targetHandle]) => ({ source, sourceHandle, target, targetHandle })),
})

export const SAMPLES: { id: string; name: string; description: string; graph: SavedGraph }[] = [
  {
    id: 'survey', name: 'Survey plate', description: 'Warped fractal noise stepped into a surveyor’s terraces: water in Cielo, land from paper to ink, printed on grain.',
    graph: g('Survey plate', [
      { id: 'noise', kind: 'noise', title: 'Terrain', x: 0, y: 0, params: { kind: 'fbm', scale: 2.4, octaves: 7, roughness: 0.55, lacunarity: 2.05, seed: 12, warp: 0.4, contrast: 2.1, offset: { x: 0.2, y: -0.1 }, invert: false } },
      { id: 'ramp', kind: 'ramp', title: 'Terraces', x: 250, y: -40, params: { colors: ['#5DB4E8', '#A9D6F2', '#F3F1EB', '#E2DDD3', '#C3BCAF', '#8E877D', '#4A443E', '#181411'], interp: 'steps', bias: 0, reverse: false } },
      { id: 'grain', kind: 'noise', title: 'Paper grain', x: 250, y: 300, params: { kind: 'fbm', scale: 36, octaves: 2, roughness: 0.5, lacunarity: 2, seed: 7, warp: 0, contrast: 1.2, offset: { x: 0, y: 0 }, invert: false } },
      { id: 'blend', kind: 'blend', title: 'Print', x: 500, y: 120, params: { mode: 'multiply', opacity: 0.12 } },
      { id: 'out', kind: 'output', title: 'Output', x: 750, y: 120, params: { flatten: true, background: '#F3F1EB' } },
    ], [['noise', 'out', 'ramp', 'in'], ['ramp', 'out', 'blend', 'base'], ['grain', 'out', 'blend', 'top'], ['blend', 'out', 'out', 'in']]),
  },
  {
    id: 'moon', name: 'Riso moon', description: 'A cratered Gualda disc masked over a Rubia night — shows masks and number ports.',
    graph: g('Riso moon', [
      { id: 'size', kind: 'number', title: 'Moon size', x: -250, y: 0, params: { value: 0.64 } },
      { id: 'disc', kind: 'shape', title: 'Disc', x: 0, y: -40, params: { kind: 'circle', size: 0.64, points: 5, inner: 0.45, roundness: 0.08, rotation: 0, position: { x: 0.04, y: 0.02 }, fill: '#ffffff', background: '#00000000', outline: false, stroke: 0.02, softness: 0.004 } },
      { id: 'craters', kind: 'noise', title: 'Craters', x: 0, y: 300, params: { kind: 'cells', scale: 7, octaves: 3, roughness: 0.45, lacunarity: 2.1, seed: 4, warp: 0.15, contrast: 1.4, offset: { x: 0, y: 0 }, invert: false } },
      { id: 'tone', kind: 'ramp', title: 'Moon tone', x: 250, y: 300, params: { colors: ['#B8892E', '#F2C744', '#F7E3A3'], interp: 'smooth', bias: 0.2, reverse: false } },
      { id: 'sky', kind: 'gradient', title: 'Night sky', x: 250, y: -80, params: { kind: 'radial', grad: { angle: 90, stops: [{ pos: 0, color: '#5E2219' }, { pos: 0.55, color: '#3A1610' }, { pos: 1, color: '#181411' }] }, center: { x: 0.04, y: 0.02 }, spread: 1.9, repeat: 1 } },
      { id: 'mix', kind: 'mix', title: 'Mask', x: 500, y: 100, params: { amount: 1 } },
      { id: 'grain', kind: 'noise', title: 'Grain', x: 500, y: 420, params: { kind: 'fbm', scale: 32, octaves: 2, roughness: 0.5, lacunarity: 2, seed: 99, warp: 0, contrast: 1.6, offset: { x: 0, y: 0 }, invert: false } },
      { id: 'print', kind: 'blend', title: 'Paper grain', x: 750, y: 180, params: { mode: 'soft light', opacity: 0.3 } },
      { id: 'out', kind: 'output', title: 'Output', x: 1000, y: 180, params: { flatten: true, background: '#000000' } },
    ], [['size', 'out', 'disc', 'size'], ['craters', 'out', 'tone', 'in'], ['sky', 'out', 'mix', 'a'], ['tone', 'out', 'mix', 'b'], ['disc', 'out', 'mix', 'mask'], ['mix', 'out', 'print', 'base'], ['grain', 'out', 'print', 'top'], ['print', 'out', 'out', 'in']]),
  },
  {
    id: 'aurora', name: 'Dye bath', description: 'Warped noise smeared like dye running through water, graded from Cochinilla to Rubia and multiplied onto paper.',
    graph: g('Dye bath', [
      { id: 'field', kind: 'noise', title: 'Field', x: 0, y: 0, params: { kind: 'ridged', scale: 2.4, octaves: 5, roughness: 0.5, lacunarity: 2, seed: 31, warp: 1.2, contrast: 1.3, offset: { x: 0.3, y: 0 }, invert: false } },
      { id: 'stretch', kind: 'transform', title: 'Stretch', x: 250, y: 0, params: { offset: { x: 0, y: -0.12 }, scale: 1.4, rotate: 8, wrap: 'mirror' } },
      { id: 'smear', kind: 'blur', title: 'Smear', x: 500, y: 0, params: { radius: 5, direction: 'vertical', quality: 3 } },
      { id: 'grade', kind: 'ramp', title: 'Dye', x: 750, y: 0, params: { colors: ['#FFFFFF', '#FFFFFF', '#F6D6C8', '#EE7A68', '#E8582C', '#5E2219'], interp: 'smooth', bias: -0.6, reverse: false } },
      { id: 'sky', kind: 'gradient', title: 'Paper', x: 750, y: 320, params: { kind: 'linear', grad: { angle: 90, stops: [{ pos: 0, color: '#F3F1EB' }, { pos: 1, color: '#E7E3DB' }] }, center: { x: 0, y: 0 }, spread: 1, repeat: 1 } },
      { id: 'screen', kind: 'blend', title: 'Soak', x: 1000, y: 140, params: { mode: 'multiply', opacity: 1 } },
      { id: 'out', kind: 'output', title: 'Output', x: 1250, y: 140, params: { flatten: true, background: '#000000' } },
    ], [['field', 'out', 'stretch', 'in'], ['stretch', 'out', 'smear', 'in'], ['smear', 'out', 'grade', 'in'], ['sky', 'out', 'screen', 'base'], ['grade', 'out', 'screen', 'top'], ['screen', 'out', 'out', 'in']]),
  },
  {
    id: 'badge', name: 'Wax seal', description: 'Two shapes, a colour constant and a rotation driven by a number: Agalla’s seal in Achiote. Glow is bypassed.',
    graph: g('Wax seal', [
      { id: 'gold', kind: 'color', title: 'Wax', x: -250, y: 60, params: { color: '#E8582C' } },
      { id: 'star', kind: 'shape', title: 'Star', x: 0, y: -60, params: { kind: 'star', size: 0.62, points: 8, inner: 0.55, roundness: 0.08, rotation: 0, position: { x: 0, y: 0 }, fill: '#ffffff', background: '#00000000', outline: false, stroke: 0.02, softness: 0 } },
      { id: 'ring', kind: 'shape', title: 'Ring', x: 0, y: 290, params: { kind: 'circle', size: 0.86, points: 5, inner: 0.45, roundness: 0.08, rotation: 0, position: { x: 0, y: 0 }, fill: '#ffffff', background: '#00000000', outline: true, stroke: 0.025, softness: 0 } },
      { id: 'stack', kind: 'blend', title: 'Stack', x: 250, y: 100, params: { mode: 'normal', opacity: 1 } },
      { id: 'tilt', kind: 'number', title: 'Tilt', x: 250, y: 420, params: { value: 22.5 } },
      { id: 'spin', kind: 'transform', title: 'Spin', x: 500, y: 100, params: { offset: { x: 0, y: 0 }, scale: 1, rotate: 0, wrap: 'none' } },
      { id: 'glow', kind: 'blur', title: 'Glow', x: 750, y: 100, bypass: true, params: { radius: 1.5, direction: 'both', quality: 3 } },
      { id: 'out', kind: 'output', title: 'Output', x: 1000, y: 100, params: { flatten: true, background: '#F3F1EB' } },
    ], [['gold', 'out', 'star', 'fill'], ['gold', 'out', 'ring', 'fill'], ['ring', 'out', 'stack', 'base'], ['star', 'out', 'stack', 'top'], ['stack', 'out', 'spin', 'in'], ['tilt', 'out', 'spin', 'rotate'], ['spin', 'out', 'glow', 'in'], ['glow', 'out', 'out', 'in']]),
  },
]

export const BLANK: SavedGraph = { version: 1, name: 'Untitled', nodes: [{ id: 'out', kind: 'output', title: 'Output', x: 400, y: 80, params: { flatten: false, background: '#000000' } }], edges: [] }
