/* ---------------------------------------------------------------------------
   Demo imagery. Image fills reference pictures by key (`image: 'astrolabe'`):
   the Gabinete plates are files in public/demo/gabinete (engravings, Nogal ink
   on transparent, src/demo/clients.ts); the wire slots are painted once and
   cached as data URLs (src/demo/wire.ts). Uploaded images are data URLs.
--------------------------------------------------------------------------- */
import { WIRE, blankSheet, wireImage } from '@/demo/wire'
import { GABINETE } from '@/demo/clients'

const cache = new Map<string, string>()
const imgCache = new Map<string, HTMLImageElement>()

const plates = Object.fromEntries(GABINETE.instruments.map((i) => [i.id, () => i.img]))
const faces = Object.fromEntries(GABINETE.people.map((p) => [p.id, () => p.face]))

const painters: Record<string, () => string> = {
  ...plates,
  ...faces,
  slot: () => wireImage(240, 240, 'image · 1:1'),
  card: () => wireImage(240, 240, 'image · 1:1', { fill: WIRE.card }),
  sheet: () => blankSheet(720, 480, 'image', '3:2'),
  avatar: () => wireImage(160, 160, 'avatar'),
}

export const IMAGE_LABELS: Record<string, string> = {
  ...Object.fromEntries(GABINETE.instruments.map((i) => [i.id, `${i.name} · plate`])),
  ...Object.fromEntries(GABINETE.people.map((p) => [p.id, `${p.name.split(' ')[0]} · portrait`])),
  slot: 'Slot · 1:1', card: 'Slot · card', sheet: 'Blank sheet · 3:2', avatar: 'Avatar slot',
}

/** URL for a key, or the value itself when it is already a URL */
export function imageURL(key?: string): string {
  if (!key) return ''
  if (key.startsWith('data:') || key.startsWith('blob:') || key.startsWith('/') || key.startsWith('http')) return key
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
