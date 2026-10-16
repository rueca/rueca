/* The bento → MP4, one loop, frame by frame, headless.

     node brand/bento/render.mjs [--size 1080] [--fps 60] [--base http://localhost:5281]

   Opens the tool on the dev server (the brand-board launch entry) in headless Chrome with a fresh profile, so it
   renders the defaults, and runs the tool's own exporter there: every frame drawn at its time with draw(), encoded
   with WebCodecs (H.264 MP4, ~0.15 bit per pixel per frame). Seamless: the loop's last frame runs into its first.
   Writes brand/bento/renders/rueca-bento-<size>x<size>-<fps>.mp4 and a poster PNG (a frame with everything at rest). */
import { chromium } from 'playwright-core'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d }
const SIZE = +arg('size', 1080), FPS = +arg('fps', 60), BASE = arg('base', 'http://localhost:5281')
const OUT = join(dirname(fileURLToPath(import.meta.url)), 'renders')
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--disable-background-timer-throttling', '--disable-renderer-backgrounding'] })
const page = await (await browser.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 900 } })).newPage()
await page.goto(`${BASE}/brand/bento/`)
await page.waitForSelector('canvas', { timeout: 60000 }) // the tool mounts once its fonts, drawings and pen strokes are in
await page.waitForTimeout(500)

const name = `rueca-bento-${SIZE}x${SIZE}-${FPS}`
const download = page.waitForEvent('download', { timeout: 15 * 60000 })
const info = await page.evaluate(async ({ SIZE, FPS, name }) => {
  const A = await import('/brand/bento/artifact.ts'), V = await import('/src/kit/core/video.ts')
  A.clock.pause()
  const vals = A.params.values(), canvas = document.createElement('canvas')
  canvas.width = canvas.height = SIZE
  const ctx = canvas.getContext('2d', { alpha: false })
  const frames = Math.round((vals.loopMs / 1000) * FPS)
  const blob = await V.recordFrames({ canvas, fps: FPS, frames, name: `${name}.mp4`, draw: (t) => A.draw(ctx, vals, t, SIZE, SIZE) })
  // the poster: a still where every tile is at rest (fig.1 written, the first drawing settled)
  A.draw(ctx, vals, 1400, SIZE, SIZE)
  return { frames, ms: vals.loopMs, bytes: blob?.size ?? 0, type: blob?.type, poster: canvas.toDataURL('image/png') }
}, { SIZE, FPS, name })
const file = join(OUT, `${name}.mp4`)
await (await download).saveAs(file)
writeFileSync(join(OUT, `${name}.png`), Buffer.from(info.poster.split(',')[1], 'base64'))
console.log(`wrote ${file} (${info.frames} frames, ${(info.ms / 1000).toFixed(2)} s, ${(info.bytes / 1e6).toFixed(1)} MB, ${info.type}) + poster png`)
await browser.close()
