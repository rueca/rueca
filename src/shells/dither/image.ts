/* Image intake helpers: decode, cap size, derive the small sources. */
import type { Source } from './engine'

export const MAX_SIDE = 2400

const canvas = (w: number, h: number) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c }

/** Decode a file (or data URL) into ImageData, capped at MAX_SIDE on the long edge. */
export async function decode(input: Blob | string): Promise<ImageData> { return (await decodeSized(input)).data }

/** decode() plus the original size, so callers can say when an image was scaled down. */
export async function decodeSized(input: Blob | string): Promise<{ data: ImageData; from: { w: number; h: number } }> {
  let bmp: ImageBitmap | HTMLImageElement
  if (typeof input === 'string') {
    bmp = await new Promise<HTMLImageElement>((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('Could not read that image')); im.src = input })
  } else {
    try { bmp = await createImageBitmap(input) } catch { throw new Error('Could not read that image') }
  }
  const sw = 'naturalWidth' in bmp ? bmp.naturalWidth : bmp.width
  const sh = 'naturalHeight' in bmp ? bmp.naturalHeight : bmp.height
  const k = Math.min(1, MAX_SIDE / Math.max(sw, sh))
  const w = Math.max(1, Math.round(sw * k)), h = Math.max(1, Math.round(sh * k))
  const c = canvas(w, h)
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bmp, 0, 0, w, h)
  if ('close' in bmp) bmp.close()
  return { data: ctx.getImageData(0, 0, w, h), from: { w: sw, h: sh } }
}

const toCanvas = (img: ImageData) => { const c = canvas(img.width, img.height); c.getContext('2d')!.putImageData(img, 0, 0); return c }

/** A smaller copy (long edge `side`) for thumbnails and the inspector well. */
export function shrink(img: ImageData, side: number): ImageData {
  const k = Math.min(1, side / Math.max(img.width, img.height))
  const w = Math.max(1, Math.round(img.width * k)), h = Math.max(1, Math.round(img.height * k))
  const c = canvas(w, h)
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(toCanvas(img), 0, 0, w, h)
  return ctx.getImageData(0, 0, w, h)
}

export const asSource = (img: ImageData): Source => ({ w: img.width, h: img.height, data: img.data })

export function previewURL(img: ImageData, side = 360) {
  const s = shrink(img, side)
  return toCanvas(s).toDataURL('image/jpeg', 0.82)
}

/** k-means in RGB on a small sample — "pull the palette from the photo". */
export function extractPalette(img: ImageData, k: number): string[] {
  const s = shrink(img, 80)
  const px: number[][] = []
  for (let i = 0; i < s.data.length; i += 4) px.push([s.data[i], s.data[i + 1], s.data[i + 2]])
  const lum = (c: number[]) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
  px.sort((a, b) => lum(a) - lum(b))
  // seed with evenly spaced brightness quantiles: stable, no randomness
  let cent = Array.from({ length: k }, (_, i) => [...px[Math.floor(((i + 0.5) / k) * px.length)]])
  for (let it = 0; it < 12; it++) {
    const acc = cent.map(() => [0, 0, 0, 0])
    for (const p of px) {
      let best = 0, bd = Infinity
      cent.forEach((c, j) => { const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2; if (d < bd) { bd = d; best = j } })
      const a = acc[best]; a[0] += p[0]; a[1] += p[1]; a[2] += p[2]; a[3]++
    }
    cent = acc.map((a, j) => (a[3] ? [a[0] / a[3], a[1] / a[3], a[2] / a[3]] : cent[j]))
  }
  return cent.sort((a, b) => lum(a) - lum(b)).map((c) => '#' + c.map((x) => Math.round(x).toString(16).padStart(2, '0')).join(''))
}
