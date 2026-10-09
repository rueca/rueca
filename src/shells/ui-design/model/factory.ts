/* Node constructors with Figma's defaults. Terse on purpose — the demo file
   and the drawing tools are both written with these. */
import { uid, type AutoLayout, type Effect, type Node, type Paint, type TextStyle } from './types'

export const solid = (color: string, opacity = 1): Paint => ({ id: uid('p'), kind: 'solid', color, opacity, visible: true })
export const linear = (stops: { pos: number; color: string }[], angle = 180, opacity = 1): Paint => ({ id: uid('p'), kind: 'linear', color: stops[0].color.slice(0, 7), opacity, visible: true, stops, angle })
export const imageFill = (image: string): Paint => ({ id: uid('p'), kind: 'image', color: '#d9d9d9', opacity: 1, visible: true, image, fit: 'fill' })
export const shadow = (y = 8, blur = 24, opacity = 0.12, color = '#000000', x = 0, spread = 0): Effect => ({ id: uid('e'), kind: 'drop-shadow', visible: true, x, y, blur, spread, color, opacity })

type Partial2 = Partial<Omit<Node, 'radius'>> & { radius?: number | [number, number, number, number] }

export function base(type: Node['type'], o: Partial2 = {}): Node {
  const r = o.radius ?? 0
  return {
    id: uid(), type, name: type === 'rect' ? 'Rectangle' : type === 'ellipse' ? 'Ellipse' : type === 'frame' ? 'Frame' : type === 'text' ? 'Text' : type === 'icon' ? 'Icon' : 'Boolean',
    x: 0, y: 0, w: 100, h: 100, rotation: 0, opacity: 1, blend: 'normal', visible: true, locked: false,
    fills: [], strokes: [], strokeWidth: 1, strokeAlign: 'inside', effects: [],
    sizingW: 'fixed', sizingH: 'fixed',
    ...o,
    radius: typeof r === 'number' ? [r, r, r, r] : r,
  }
}

export const rect = (o: Partial2 = {}) => base('rect', { fills: [solid('#d9d9d9')], ...o })
export const ellipse = (o: Partial2 = {}) => base('ellipse', { fills: [solid('#d9d9d9')], ...o })

export function frame(o: Partial2 & { auto?: Partial<AutoLayout> | null } = {}): Node {
  const { auto, ...rest } = o
  const layout: AutoLayout | null = auto ? { dir: 'row', gap: 8, pad: [0, 0, 0, 0], alignX: 'start', alignY: 'start', ...auto } : null
  return base('frame', { fills: [solid('#ffffff')], clip: true, children: [], layout, ...(auto ? { sizingW: 'hug', sizingH: 'hug' } : {}), ...rest })
}

export function text(content: string, o: Partial2 & { t?: Partial<TextStyle>; color?: string } = {}): Node {
  const { t, color, ...rest } = o
  return base('text', {
    name: content.slice(0, 32),
    fills: [solid(color ?? '#1b1f1c')],
    sizingW: t?.resize === 'auto-width' || !t?.resize ? 'hug' : 'fixed',
    sizingH: 'hug',
    ...rest,
    text: { content, family: 'Inter', weight: 400, size: 14, lineHeight: 0, letterSpacing: 0, align: 'left', resize: 'auto-width', ...t },
  })
}

export function icon(name: string, o: Partial2 & { color?: string; stroke?: number } = {}): Node {
  const { color, stroke, ...rest } = o
  return base('icon', { name, w: 20, h: 20, fills: [solid(color ?? '#1b1f1c')], icon: { name, stroke: stroke ?? 1.75 }, ...rest })
}
