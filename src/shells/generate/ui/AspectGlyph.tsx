/* Tiny ratio glyphs, usable anywhere an icon component is accepted (Menu items, Segmented). */
import type { ComponentType } from 'react'

const cache = new Map<string, ComponentType<{ size?: number; strokeWidth?: number }>>()

export function aspectIcon(w: number, h: number) {
  const k = `${w}x${h}`
  if (!cache.has(k)) {
    const s = 12 / Math.max(w, h)
    const rw = w * s, rh = h * s
    const Icon = ({ size = 14, strokeWidth = 1.5 }: { size?: number; strokeWidth?: number }) => (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={strokeWidth}>
        <rect x={8 - rw / 2} y={8 - rh / 2} width={rw} height={rh} rx={1.5} />
      </svg>
    )
    cache.set(k, Icon)
  }
  return cache.get(k)!
}
