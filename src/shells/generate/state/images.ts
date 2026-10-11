/* ---------------------------------------------------------------------------
   Pixel cache. Images are rendered on demand from their params, at two
   tiers: `thumb` (~560px long side, for the grid) and `full`. Renders run
   one per tick so a reload with forty images never freezes the UI; the
   grid shows a developing shimmer until each arrives.
--------------------------------------------------------------------------- */
import { useEffect, useState } from 'react'
import { download } from '@kit'
import { paint } from '../engine/paint'
import type { GenParams } from '../engine/models'
import { slug as toSlug } from '../../util'

export type Tier = 'thumb' | 'full'
export interface Pix { url: string; w: number; h: number }

const cache = new Map<string, Pix>()
const listeners = new Map<string, Set<() => void>>()
const pending = new Map<string, { id: string; params: GenParams; tier: Tier; at: number }>()
let pumping = false

const key = (id: string, tier: Tier) => `${id}@${tier}`
const notify = (k: string) => listeners.get(k)?.forEach((fn) => fn())
export const scaleFor = (p: GenParams, tier: Tier) => (tier === 'full' ? 1 : Math.min(1, 560 / (Math.max(p.w, p.h) * (p.upscale ?? 1))))

function toURL(c: HTMLCanvasElement): Promise<string> {
  return new Promise((res) => c.toBlob((b) => res(b ? URL.createObjectURL(b) : c.toDataURL('image/jpeg', 0.9)), 'image/jpeg', 0.92))
}

/** Store an already-rendered canvas (a finished job hands its full render over). */
export async function put(id: string, tier: Tier, c: HTMLCanvasElement) {
  const k = key(id, tier)
  cache.set(k, { url: await toURL(c), w: c.width, h: c.height })
  pending.delete(k)
  notify(k)
}

/** Downscale a full render into a thumb without repainting. */
export function thumbFrom(c: HTMLCanvasElement, p: GenParams) {
  const s = scaleFor(p, 'thumb')
  if (s >= 1) return c
  const t = document.createElement('canvas')
  t.width = Math.round(c.width * s); t.height = Math.round(c.height * s)
  const x = t.getContext('2d')!
  x.imageSmoothingQuality = 'high'
  x.drawImage(c, 0, 0, t.width, t.height)
  return t
}

async function pump() {
  if (pumping) return
  pumping = true
  while (pending.size) {
    // newest request first: what the user just scrolled to or clicked
    const [k, job] = [...pending.entries()].sort((a, b) => b[1].at - a[1].at)[0]
    pending.delete(k)
    if (cache.has(k)) continue
    await new Promise((r) => setTimeout(r, 0))
    const c = paint(job.params, scaleFor(job.params, job.tier))
    cache.set(k, { url: await toURL(c), w: c.width, h: c.height })
    notify(k)
  }
  pumping = false
}

export function request(id: string, params: GenParams, tier: Tier) {
  const k = key(id, tier)
  if (cache.has(k)) return cache.get(k)!
  pending.set(k, { id, params, tier, at: performance.now() })
  void pump()
  return null
}

/** React: the image URL for a record at a tier (falls back to the thumb while full renders). */
export function usePix(id: string | undefined, params: GenParams | undefined, tier: Tier = 'thumb'): Pix | null {
  const [, force] = useState(0)
  useEffect(() => {
    if (!id || !params) return
    const ks = [key(id, tier), key(id, 'thumb')]
    const fn = () => force((n) => n + 1)
    ks.forEach((k) => { if (!listeners.has(k)) listeners.set(k, new Set()); listeners.get(k)!.add(fn) })
    request(id, params, tier)
    return () => ks.forEach((k) => listeners.get(k)?.delete(fn))
  }, [id, params, tier])
  if (!id || !params) return null
  return cache.get(key(id, tier)) ?? cache.get(key(id, 'thumb')) ?? null
}

/** A small, fast render for progress previews (data URL). */
export function sketch(params: GenParams, longSide = 200) {
  const c = paint(params, longSide / (Math.max(params.w, params.h) * (params.upscale ?? 1)))
  return c.toDataURL('image/jpeg', 0.8)
}

const slug = (s: string) => toSlug(s, 'image', 48)

/** Full-resolution PNG, painted fresh. */
export function exportPNG(params: GenParams, id: string) {
  return new Promise<void>((res) => {
    const c = paint(params, 1)
    c.toBlob((b) => { if (b) download(b, `${slug(params.prompt)}-${params.seed}${params.upscale ? '-2x' : ''}-${id.slice(-4)}.png`); res() }, 'image/png')
  })
}
