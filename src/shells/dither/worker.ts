/* Processing worker. Holds the source (and a small thumbnail source), keeps
   resampled grids cached across jobs, and answers one job at a time. */
import { process, type Result, type Settings, type Source } from './engine'

let src: Source | null = null
let thumbSrc: Source | null = null
const cache = new Map<string, Float32Array>()
const thumbCache = new Map<string, Float32Array>()

type Msg =
  | { type: 'source'; src: Source; thumb: Source }
  | { type: 'job'; id: number; settings: Settings; maxWork?: number; thumb?: boolean; scale?: number }

const post = (data: unknown, transfer: Transferable[] = []) => (self as unknown as Worker).postMessage(data, transfer)

self.onmessage = (e: MessageEvent<Msg>) => {
  const m = e.data
  if (m.type === 'source') { src = m.src; thumbSrc = m.thumb; cache.clear(); thumbCache.clear(); return }
  const from = m.thumb ? thumbSrc : src
  if (!from) { post({ type: 'error', id: m.id, message: 'No image' }); return }
  try {
    const r: Result = process(from, m.settings, { maxWork: m.maxWork, scale: m.scale, cache: m.thumb ? thumbCache : cache })
    const transfer: Transferable[] = r.kind === 'raster' ? [r.rgba.buffer] : r.kind === 'halftone' ? [r.dots.buffer] : r.rgb ? [r.rgb.buffer] : []
    post({ type: 'result', id: m.id, result: r }, transfer)
  } catch (err) {
    post({ type: 'error', id: m.id, message: (err as Error).message })
  }
}
