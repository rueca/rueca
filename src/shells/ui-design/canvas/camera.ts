/* One camera for the shell, so gestures, overlays and commands share it. */
import { createCamera, clamp } from '@kit'
import type { Box } from '../model/types'

export const camera = createCamera()

export function toWorld(clientX: number, clientY: number) {
  const r = camera.bounds?.()
  const c = camera.getState()
  return { x: (clientX - (r?.left ?? 0) - c.x) / c.zoom, y: (clientY - (r?.top ?? 0) - c.y) / c.zoom }
}

export const toScreen = (b: Box) => {
  const c = camera.getState()
  return { x: b.x * c.zoom + c.x, y: b.y * c.zoom + c.y, w: b.w * c.zoom, h: b.h * c.zoom }
}

/** Zoom so a world box fills the stage (Shift+2 / Shift+1). The kit's fit() assumes content starts at 0,0. */
export function zoomToBox(b: Box | null, pad = 80, maxZoom = 4) {
  const r = camera.bounds?.()
  if (!b || !r) return
  const zoom = clamp(Math.min((r.width - pad * 2) / Math.max(1, b.w), (r.height - pad * 2) / Math.max(1, b.h)), 0.05, maxZoom)
  camera.setState({ zoom, x: (r.width - b.w * zoom) / 2 - b.x * zoom, y: (r.height - b.h * zoom) / 2 - b.y * zoom })
}
