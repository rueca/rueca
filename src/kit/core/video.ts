/* ---------------------------------------------------------------------------
   recordFrames — frame-accurate video export. recordCanvas (io.ts) is real-time MediaRecorder and drops frames under
   load. This steps a pure draw(t) function frame by frame and encodes with
   WebCodecs via mediabunny, so a 4K loop renders perfectly even at 5 fps.

     await recordFrames({
       canvas,                       // what to capture (fixed size)
       draw: (tMs, i) => render(tMs),// draw frame i at time tMs
       frames: 480, fps: 60,
       name: 'loop.mp4',
       onProgress: (p) => …,         // 0–1
       signal,                       // AbortController.signal to cancel
     })

   Falls back to null when WebCodecs can't encode (caller then uses the kit's
   recordCanvas). Picks H.264 in MP4, then VP9 / AV1, then WebM.
   (Promoted from shells/shader/local/recordFrames.ts.)
--------------------------------------------------------------------------- */
import { BufferTarget, CanvasSource, Mp4OutputFormat, Output, WebMOutputFormat, getFirstEncodableVideoCodec } from 'mediabunny'
import { download } from './io'

export interface RecordOptions {
  canvas: HTMLCanvasElement | OffscreenCanvas
  draw: (tMs: number, frame: number) => void | Promise<void>
  frames: number
  fps: number
  name: string
  /** frame time step in ms (defaults to 1000/fps) — use speed-scaled steps for slow/fast motion */
  stepMs?: number
  onProgress?: (p: number) => void
  signal?: AbortSignal
  /** bits per second; defaults from the pixel rate */
  bitrate?: number
}

export async function canRecordFrames(w: number, h: number) {
  if (typeof VideoEncoder === 'undefined') return false
  try { return !!(await getFirstEncodableVideoCodec(['avc', 'vp9', 'av1'], { width: w, height: h })) } catch { return false }
}

/** Returns the Blob written (and downloads it), or null if this browser can't encode. */
export async function recordFrames(o: RecordOptions): Promise<Blob | null> {
  if (typeof VideoEncoder === 'undefined') return null
  const { width: w, height: h } = o.canvas
  const codec = await getFirstEncodableVideoCodec(['avc', 'vp9', 'av1'], { width: w, height: h })
  if (!codec) return null
  const mp4 = codec === 'avc' || codec === 'av1'
  const output = new Output({ format: mp4 ? new Mp4OutputFormat({ fastStart: 'in-memory' }) : new WebMOutputFormat(), target: new BufferTarget() })
  // Bitrate from pixel rate: ~0.15 bit per pixel per frame, 4–40 Mbps. Grain is incompressible, so cap it.
  const bitrate = o.bitrate ?? Math.round(Math.min(40e6, Math.max(4e6, w * h * o.fps * 0.15)))
  const source = new CanvasSource(o.canvas, { codec, bitrate, keyFrameInterval: 2 })
  output.addVideoTrack(source, { frameRate: o.fps })
  await output.start()
  const step = o.stepMs ?? 1000 / o.fps
  try {
    for (let i = 0; i < o.frames; i++) {
      if (o.signal?.aborted) { await output.cancel(); return null }
      await o.draw(i * step, i)
      await source.add(i / o.fps, 1 / o.fps)
      o.onProgress?.((i + 1) / o.frames)
      // yield so the UI (progress, cancel) stays responsive
      if (i % 4 === 3) await new Promise((r) => setTimeout(r, 0))
    }
    source.close()
    await output.finalize()
  } catch (e) {
    try { await output.cancel() } catch { /* already gone */ }
    throw e
  }
  const buf = (output.target as BufferTarget).buffer
  if (!buf) return null
  const blob = new Blob([buf], { type: mp4 ? 'video/mp4' : 'video/webm' })
  download(blob, o.name.replace(/\.\w+$/, mp4 ? '.mp4' : '.webm'))
  return blob
}
