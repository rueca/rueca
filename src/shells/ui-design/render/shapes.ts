/* SVG path strings for shapes — shared by the boolean renderer (SVG) and
   the canvas exporter (Path2D accepts the same strings). */
import type { Node } from '../model/types'

export function roundRectPath(x: number, y: number, w: number, h: number, r: [number, number, number, number]) {
  const m = Math.min(w, h) / 2
  const [tl, tr, br, bl] = r.map((v) => Math.max(0, Math.min(v, m)))
  return [
    `M${x + tl},${y}`, `H${x + w - tr}`, tr ? `A${tr},${tr} 0 0 1 ${x + w},${y + tr}` : '',
    `V${y + h - br}`, br ? `A${br},${br} 0 0 1 ${x + w - br},${y + h}` : '',
    `H${x + bl}`, bl ? `A${bl},${bl} 0 0 1 ${x},${y + h - bl}` : '',
    `V${y + tl}`, tl ? `A${tl},${tl} 0 0 1 ${x + tl},${y}` : '', 'Z',
  ].join('')
}

export function ellipsePath(x: number, y: number, w: number, h: number) {
  const rx = w / 2, ry = h / 2
  return `M${x},${y + ry}A${rx},${ry} 0 1 1 ${x + w},${y + ry}A${rx},${ry} 0 1 1 ${x},${y + ry}Z`
}

export const shapePath = (n: Node, x: number, y: number, w: number, h: number) =>
  n.type === 'ellipse' ? ellipsePath(x, y, w, h) : roundRectPath(x, y, w, h, n.radius)
