/* ---------------------------------------------------------------------------
   encodeVideo — frame-accurate MP4 export for any `draw(ctx, t)` artifact.

   The kit's `recordCanvas` captures in real time with MediaRecorder, so a
   busy main thread drops frames and the file is WebM on most browsers. This
   steps the composition one frame at a time, encodes each with WebCodecs via
   mediabunny's CanvasSource, and muxes a real MP4. Rendering is decoupled
   from wall-clock time, so a 1080×1920 composition exports identically on a
   fast or a slow machine.

     const job = encodeVideo({
       width: 1080, height: 1920, fps: 30, duration: 8000,
       draw: (ctx, t) => draw(ctx, values, t, 1080, 1920),
       onProgress: (p) => …,
     })
     job.cancel()                        // stops at the next frame, resolves null
     const blob = await job.done         // Blob | null (cancelled)

   Pair with `progressToast` for the standard "Exporting 42% · Cancel" toast.
   Promote to kit `core/io.ts` as `exportFrames` (io.ts already promises a
   `recordFrames` in a comment that does not exist).
--------------------------------------------------------------------------- */
import { BufferTarget, CanvasSource, Mp4OutputFormat, Output, QUALITY_HIGH, getFirstEncodableVideoCodec } from 'mediabunny'

export interface EncodeOptions {
  width: number
  height: number
  fps: number
  /** ms */
  duration: number
  /** draw the frame at time t (ms). May be async (e.g. waits for an image). */
  draw: (ctx: CanvasRenderingContext2D, t: number, frame: number) => void | Promise<void>
  onProgress?: (p: number, frame: number, total: number) => void
  /** ms → composition time, e.g. ping-pong remaps; defaults to identity */
  timeAt?: (ms: number) => number
}

export interface EncodeJob { done: Promise<Blob | null>; cancel: () => void }

export function encodeVideo(o: EncodeOptions): EncodeJob {
  let cancelled = false
  const done = (async () => {
    // H.264 needs even dimensions.
    const W = Math.round(o.width / 2) * 2, H = Math.round(o.height / 2) * 2
    if (typeof VideoEncoder === 'undefined') throw new Error('This browser has no WebCodecs encoder. Try Chrome, Edge or Safari 17+.')
    const codec = await getFirstEncodableVideoCodec(['avc', 'hevc', 'vp9', 'av1'], { width: W, height: H })
    if (!codec) throw new Error('No video codec available for this size.')
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d', { alpha: false })!
    const output = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target: new BufferTarget() })
    const source = new CanvasSource(canvas, { codec, quality: QUALITY_HIGH, keyFrameInterval: 1 })
    output.addVideoTrack(source, { frameRate: o.fps })
    await output.start()
    const total = Math.max(1, Math.round((o.duration / 1000) * o.fps))
    for (let i = 0; i < total; i++) {
      if (cancelled) { await output.cancel(); return null }
      const ms = (i * 1000) / o.fps
      ctx.setTransform(W / o.width, 0, 0, H / o.height, 0, 0)
      await o.draw(ctx, o.timeAt ? o.timeAt(ms) : ms, i)
      await source.add(i / o.fps, 1 / o.fps)
      o.onProgress?.((i + 1) / total, i + 1, total)
      // Yield so the toast can paint and Cancel stays clickable.
      if (i % 4 === 0) await new Promise((r) => setTimeout(r, 0))
    }
    source.close()
    await output.finalize()
    const buf = (output.target as BufferTarget).buffer
    return buf ? new Blob([buf], { type: 'video/mp4' }) : null
  })()
  return { done, cancel: () => { cancelled = true } }
}
