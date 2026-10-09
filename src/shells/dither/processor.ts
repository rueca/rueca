/* Main-thread side of the worker. Latest-wins for the stage (a drag fires
   dozens of requests; only the newest matters), FIFO for thumbnails, and
   the stage always jumps the queue. Falls back to the main thread if module
   workers are unavailable. */
import { process, type Result, type Settings, type Source } from './engine'

interface Job { settings: Settings; maxWork?: number; thumb?: boolean; scale?: number }
type Waiter = { job: Job; resolve: (r: Result) => void; reject: (e: Error) => void }

export class Processor {
  private worker: Worker | null = null
  private busy = false
  private stage: Waiter | null = null
  private thumbs: Waiter[] = []
  private inflight = new Map<number, Waiter>()
  private seq = 0
  private src: Source | null = null
  private thumbSrc: Source | null = null
  private cache = new Map<string, Float32Array>()
  private thumbCache = new Map<string, Float32Array>()

  constructor() {
    try {
      this.worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module', name: 'dither' })
      this.worker.onmessage = (e) => {
        const m = e.data as { type: 'result' | 'error'; id: number; result?: Result; message?: string }
        const w = this.inflight.get(m.id)
        this.inflight.delete(m.id)
        this.busy = false
        if (w) m.type === 'result' ? w.resolve(m.result!) : w.reject(new Error(m.message))
        this.pump()
      }
      this.worker.onerror = (e) => { console.warn('[dither] worker failed, using main thread', e.message); this.worker = null; this.busy = false; this.resendSource(); this.pump() }
    } catch { this.worker = null }
  }

  get threaded() { return !!this.worker }

  setSource(src: Source, thumb: Source) {
    this.src = src
    this.thumbSrc = thumb
    this.cache.clear()
    this.thumbCache.clear()
    this.resendSource()
  }
  private resendSource() {
    if (this.worker && this.src && this.thumbSrc) this.worker.postMessage({ type: 'source', src: this.src, thumb: this.thumbSrc })
  }

  /** Stage render — replaces any stage job still waiting. */
  render(settings: Settings, maxWork?: number) {
    return new Promise<Result>((resolve, reject) => {
      this.stage?.reject(new Error('superseded'))
      this.stage = { job: { settings, maxWork }, resolve, reject }
      this.pump()
    })
  }

  thumb(settings: Settings, scale: number) {
    return new Promise<Result>((resolve, reject) => { this.thumbs.push({ job: { settings, thumb: true, scale }, resolve, reject }); this.pump() })
  }

  clearThumbs() { this.thumbs.forEach((t) => t.reject(new Error('cancelled'))); this.thumbs = [] }

  private pump() {
    if (this.busy) return
    const w = this.stage ?? this.thumbs.shift()
    if (!w) return
    if (w === this.stage) this.stage = null
    this.busy = true
    if (this.worker) {
      const id = ++this.seq
      this.inflight.set(id, w)
      this.worker.postMessage({ type: 'job', id, ...w.job })
    } else {
      setTimeout(() => {
        try {
          const from = w.job.thumb ? this.thumbSrc : this.src
          if (!from) throw new Error('No image')
          w.resolve(process(from, w.job.settings, { maxWork: w.job.maxWork, scale: w.job.scale, cache: w.job.thumb ? this.thumbCache : this.cache }))
        } catch (e) { w.reject(e as Error) }
        this.busy = false
        this.pump()
      }, 0)
    }
  }

  dispose() { this.worker?.terminate(); this.worker = null }
}
