/* The demo photograph, painted procedurally so the lab works with no upload
   and no network: the spinning top in continuous tone (see ./top). */
import { paintTop } from '@/demo/top'

export function paintSample(W = 1600, H = 1000): ImageData {
  return paintTop(W, H, { at: 0.5, size: 0.66, tilt: -0.18, grain: 0.6, vignette: 0.12 }).getContext('2d')!.getImageData(0, 0, W, H)
}
