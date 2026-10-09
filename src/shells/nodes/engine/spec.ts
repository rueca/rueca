/* ---------------------------------------------------------------------------
   Port specs — the typed interface of every node. Pure data, no React, no
   kit imports, so the evaluation worker can load it.

   A port with `param` drives that parameter when connected (Cables / TD
   "parameter inputs"): the inspector row greys out and says what drives it.
--------------------------------------------------------------------------- */

export type PortType = 'image' | 'number' | 'color'

export interface PortSpec {
  key: string
  label: string
  type: PortType
  /** a missing optional input is not an error */
  optional?: boolean
  /** when connected, this input overrides the named param */
  param?: string
}

export interface NodeSpec { inputs: PortSpec[]; outputs: PortSpec[] }

const img = (key: string, label: string, o: Partial<PortSpec> = {}): PortSpec => ({ key, label, type: 'image', ...o })
const num = (key: string, label: string, o: Partial<PortSpec> = {}): PortSpec => ({ key, label, type: 'number', ...o })
const col = (key: string, label: string, o: Partial<PortSpec> = {}): PortSpec => ({ key, label, type: 'color', ...o })

export const SPECS: Record<string, NodeSpec> = {
  noise: { inputs: [num('scale', 'Scale', { optional: true, param: 'scale' })], outputs: [img('out', 'Image')] },
  gradient: { inputs: [col('colorA', 'Start', { optional: true }), col('colorB', 'End', { optional: true })], outputs: [img('out', 'Image')] },
  shape: { inputs: [col('fill', 'Fill', { optional: true, param: 'fill' }), num('size', 'Size', { optional: true, param: 'size' })], outputs: [img('out', 'Image')] },
  transform: { inputs: [img('in', 'Image'), num('rotate', 'Rotate', { optional: true, param: 'rotate' })], outputs: [img('out', 'Image')] },
  blend: { inputs: [img('base', 'Base'), img('top', 'Blend'), num('opacity', 'Opacity', { optional: true, param: 'opacity' })], outputs: [img('out', 'Image')] },
  blur: { inputs: [img('in', 'Image'), num('radius', 'Radius', { optional: true, param: 'radius' })], outputs: [img('out', 'Image')] },
  threshold: { inputs: [img('in', 'Image'), num('level', 'Level', { optional: true, param: 'level' })], outputs: [img('out', 'Mask')] },
  ramp: { inputs: [img('in', 'Image')], outputs: [img('out', 'Image')] },
  mix: { inputs: [img('a', 'A'), img('b', 'B'), img('mask', 'Mask', { optional: true }), num('amount', 'Amount', { optional: true, param: 'amount' })], outputs: [img('out', 'Image')] },
  number: { inputs: [], outputs: [num('out', 'Value')] },
  color: { inputs: [], outputs: [col('out', 'Colour')] },
  output: { inputs: [img('in', 'Image')], outputs: [] },
}

export const specOf = (type: string): NodeSpec => SPECS[type] ?? { inputs: [], outputs: [] }
export const portOf = (type: string, key: string | null | undefined, side: 'in' | 'out') =>
  (side === 'in' ? specOf(type).inputs : specOf(type).outputs).find((p) => p.key === key)

/** Serializable graph the engine evaluates. Mirrors the editor graph minus UI state. */
export interface EngineNode { id: string; type: string; params: Record<string, unknown>; bypass?: boolean; title?: string }
export interface EngineEdge { source: string; sourceHandle: string; target: string; targetHandle: string }
export interface EngineGraph { nodes: EngineNode[]; edges: EngineEdge[] }
