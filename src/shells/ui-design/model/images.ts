/* ---------------------------------------------------------------------------
   Demo imagery, in the wire style (src/demo/wire.ts). No network: every
   picture in the demo file is painted once, cached as a data URL and referenced
   by key from image fills (`image: 'ridge'`). Uploaded images are data URLs.
   The keys are historical (the file used to be painted landscapes); the
   pictures are now placeholders — the dithered top for heroes, labelled slots
   for everything else.
--------------------------------------------------------------------------- */
import { WIRE, blankSheet, ditherTop, wireImage } from '@/demo/wire'

const cache = new Map<string, string>()
const imgCache = new Map<string, HTMLImageElement>()

const painters: Record<string, () => string> = {
  ridge: () => ditherTop(720, 480, { at: 0.72, size: 0.56 }), // card hero: top sits right, clear of the title
  top: () => ditherTop(720, 480),
  lake: () => ditherTop(720, 480, { night: true, light: '#E9E1D6' }),
  forest: () => wireImage(240, 240, 'image · 1:1'),
  coast: () => wireImage(240, 240, 'image · 1:1', { fill: WIRE.card }),
  dunes: () => blankSheet(720, 480, 'image', '3:2'),
  avatar: () => wireImage(160, 160, 'avatar'),
}

export const IMAGE_LABELS: Record<string, string> = { ridge: 'Top · card', top: 'Top · dithered', lake: 'Top · night', forest: 'Slot · 1:1', coast: 'Slot · card', dunes: 'Blank sheet · 3:2', avatar: 'Avatar slot' }

/** data URL for a key, or the value itself when it is already a URL */
export function imageURL(key?: string): string {
  if (!key) return ''
  if (key.startsWith('data:') || key.startsWith('blob:')) return key
  let url = cache.get(key)
  if (!url && painters[key]) { url = painters[key](); cache.set(key, url) }
  return url ?? ''
}

/** decoded image element for canvas drawing */
export function loadImage(key: string): Promise<HTMLImageElement> {
  const url = imageURL(key)
  const hit = imgCache.get(url)
  if (hit?.complete) return Promise.resolve(hit)
  return new Promise((res, rej) => {
    const im = hit ?? new Image()
    im.onload = () => res(im)
    im.onerror = rej
    if (!hit) { im.src = url; imgCache.set(url, im) }
  })
}
export const imageSync = (key: string) => imgCache.get(imageURL(key))
