/* ---------------------------------------------------------------------------
   The design document. A plain, serialisable node tree — the same shape a
   Figma/Framer file has, cut down to what a client prototype needs.

   Coordinates: a node's x/y are relative to its parent. Children of an
   auto-layout frame ignore x/y; the layout engine places them. Top-level
   nodes on a page are in world space.
--------------------------------------------------------------------------- */

export type NodeType = 'frame' | 'rect' | 'ellipse' | 'text' | 'icon' | 'boolean'
export type Sizing = 'fixed' | 'hug' | 'fill'
export type Align = 'start' | 'center' | 'end'
export type BoolOp = 'union' | 'subtract' | 'intersect' | 'exclude'
export type Blend = 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'luminosity'

export interface Paint {
  id: string
  kind: 'solid' | 'linear' | 'radial' | 'image'
  /** #rrggbb — opacity lives in `opacity`, like Figma */
  color: string
  opacity: number
  visible: boolean
  /** gradients */
  angle?: number
  stops?: { pos: number; color: string }[]
  /** image fills: a procedural image key or a data URL */
  image?: string
  fit?: 'fill' | 'fit' | 'tile'
}

export interface Effect {
  id: string
  kind: 'drop-shadow' | 'inner-shadow' | 'layer-blur' | 'background-blur'
  visible: boolean
  x: number
  y: number
  blur: number
  spread: number
  color: string
  opacity: number
}

export interface AutoLayout {
  dir: 'row' | 'column'
  gap: number
  /** distribute children along the main axis ("Auto" gap in Figma) */
  between?: boolean
  /** top, right, bottom, left */
  pad: [number, number, number, number]
  /** spatial alignment, independent of direction — the 3×3 grid */
  alignX: Align
  alignY: Align
}

export interface TextStyle {
  content: string
  family: string
  weight: number
  size: number
  /** px; 0 = auto (1.25 × size) */
  lineHeight: number
  /** percent of font size, Figma-style */
  letterSpacing: number
  align: 'left' | 'center' | 'right'
  resize: 'auto-width' | 'auto-height' | 'fixed'
}

export interface Interaction {
  id: string
  trigger: 'tap' | 'hover' | 'drag'
  action: 'navigate' | 'back' | 'overlay' | 'url'
  target?: string
  transition: 'instant' | 'dissolve' | 'smart' | 'move-in' | 'push'
  duration: number
  easing: [number, number, number, number]
}

export interface Node {
  id: string
  type: NodeType
  name: string
  x: number
  y: number
  w: number
  h: number
  rotation: number
  opacity: number
  blend: Blend
  visible: boolean
  locked: boolean
  fills: Paint[]
  strokes: Paint[]
  strokeWidth: number
  strokeAlign: 'inside' | 'center' | 'outside'
  effects: Effect[]
  /** tl, tr, br, bl */
  radius: [number, number, number, number]
  sizingW: Sizing
  sizingH: Sizing
  clip?: boolean
  layout?: AutoLayout | null
  children?: Node[]
  text?: TextStyle
  icon?: { name: string; stroke: number }
  bool?: BoolOp
  component?: boolean
  group?: boolean
  interactions?: Interaction[]
}

export interface Comment { id: string; x: number; y: number; text: string; author: string; at: number; resolved?: boolean }

export interface Page {
  id: string
  name: string
  /** '' = follow the studio theme */
  bg: string
  nodes: Node[]
  comments: Comment[]
  start?: string
}

export interface Doc { name: string; pages: Page[] }

export interface Box { x: number; y: number; w: number; h: number }

export type Tool = 'move' | 'frame' | 'rect' | 'ellipse' | 'text' | 'hand' | 'comment'

let n = 0
export const uid = (p = 'n') => `${p}${Date.now().toString(36).slice(-4)}${(n++).toString(36)}${Math.random().toString(36).slice(2, 5)}`

