/* The demo photograph: Campana's brass bell on black (src/demo/clients.ts), a hard
   spotlight and deep shadow, which is what dithering loves. Decoded once and cached. */
import { CAMPANA, loadDemo } from '@/demo/clients'

let cached: Promise<ImageData> | null = null
export function paintSample(W = 1600): Promise<ImageData> {
  return (cached ??= loadDemo(CAMPANA.night).then((img) => {
    const H = Math.round((W * img.naturalHeight) / img.naturalWidth)
    const c = document.createElement('canvas'); c.width = W; c.height = H
    const x = c.getContext('2d', { willReadFrequently: true })!
    x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, W, H)
    return x.getImageData(0, 0, W, H)
  }))
}
