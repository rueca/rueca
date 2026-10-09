/* ---------------------------------------------------------------------------
   Getting things out. Every instrument needs at least one of these; the
   handoff is the point of a client tool.
--------------------------------------------------------------------------- */

export function download(blob: Blob, name: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}

export const stamp = () => new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')

export async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); return true } catch { return false }
}

/** PNG of a canvas. `smoothing: false` keeps pixel art crisp when scaling up. Prefer re-rendering at size when you can. */
export function exportCanvasPNG(canvas: HTMLCanvasElement, name = `export-${stamp()}.png`, scale = 1, opts: { smoothing?: boolean } = {}) {
  return new Promise<void>((res) => {
    let src = canvas
    if (scale !== 1) {
      src = document.createElement('canvas')
      src.width = Math.round(canvas.width * scale)
      src.height = Math.round(canvas.height * scale)
      const ctx = src.getContext('2d')!
      ctx.imageSmoothingEnabled = opts.smoothing !== false
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(canvas, 0, 0, src.width, src.height)
    }
    src.toBlob((b) => { if (b) download(b, name); res() }, 'image/png')
  })
}

/** Download an SVG element or SVG markup. */
export function exportSVG(svg: SVGSVGElement | string, name = `export-${stamp()}.svg`) {
  let text: string
  if (typeof svg === 'string') text = svg.includes('xmlns=') ? svg : svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
  else { const clone = svg.cloneNode(true) as SVGSVGElement; clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); text = clone.outerHTML }
  download(new Blob([text], { type: 'image/svg+xml' }), name)
}

export function exportJSON(data: unknown, name = `params-${stamp()}.json`) {
  download(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), name)
}

/**
 * Real-time capture of a canvas with MediaRecorder. Fine for a quick share.
 * For frame-accurate, dropped-frame-free output use recordFrames (./video.ts),
 * which steps your render per frame and encodes with WebCodecs.
 */
export async function recordCanvas(canvas: HTMLCanvasElement, ms: number, fps = 60, name = `capture-${stamp()}.webm`) {
  const stream = canvas.captureStream(fps)
  const type = ['video/mp4;codecs=avc1', 'video/webm;codecs=vp9', 'video/webm'].find((t) => MediaRecorder.isTypeSupported(t)) ?? 'video/webm'
  const rec = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 16_000_000 })
  const chunks: Blob[] = []
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data)
  const done = new Promise<void>((r) => (rec.onstop = () => r()))
  rec.start()
  await new Promise((r) => setTimeout(r, ms))
  rec.stop()
  await done
  const ext = type.includes('mp4') ? 'mp4' : 'webm'
  download(new Blob(chunks, { type }), name.replace(/\.\w+$/, `.${ext}`))
}

export function readFileAsDataURL(file: File) {
  return new Promise<string>((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result as string)
    r.onerror = rej
    r.readAsDataURL(file)
  })
}
