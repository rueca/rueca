/* The mock model zoo, aspect buckets and the parameter record every image carries. Pure data. */

export type ModelId = 'lumen-xl' | 'lumen-turbo' | 'photon' | 'riso'

export interface ModelInfo { id: ModelId; name: string; blurb: string; steps: number; guidance: number; msPerStep: number; sampler: string; maxSteps: number }

export const MODELS: ModelInfo[] = [
  { id: 'lumen-xl', name: 'Lumen XL 1.2', blurb: 'Clean, balanced, true to the prompt', steps: 30, guidance: 7, msPerStep: 55, sampler: 'DPM++ 2M Karras', maxSteps: 80 },
  { id: 'lumen-turbo', name: 'Lumen Turbo', blurb: 'Soft drafts in 4–8 steps', steps: 6, guidance: 2, msPerStep: 95, sampler: 'Euler a', maxSteps: 12 },
  { id: 'photon', name: 'Photon 2', blurb: 'Photographic, graded like film', steps: 40, guidance: 6, msPerStep: 70, sampler: 'DPM++ SDE Karras', maxSteps: 80 },
  { id: 'riso', name: 'Riso Press', blurb: 'One-ink halftone print look', steps: 24, guidance: 8, msPerStep: 50, sampler: 'DDIM', maxSteps: 60 },
]
export const modelOf = (id: string) => MODELS.find((m) => m.id === id) ?? MODELS[0]

/** SDXL-style buckets: ~1 megapixel, multiples of 64. */
export const ASPECTS: { id: string; w: number; h: number; label: string }[] = [
  { id: '1:1', w: 1024, h: 1024, label: 'Square' },
  { id: '4:5', w: 896, h: 1120, label: 'Portrait' },
  { id: '2:3', w: 832, h: 1248, label: 'Poster' },
  { id: '9:16', w: 768, h: 1344, label: 'Story' },
  { id: '3:2', w: 1216, h: 832, label: 'Photo' },
  { id: '16:9', w: 1344, h: 768, label: 'Widescreen' },
  { id: '21:9', w: 1536, h: 640, label: 'Cinema' },
]
export const aspectOf = (id: string) => ASPECTS.find((a) => a.id === id) ?? ASPECTS[0]

export interface GenParams {
  prompt: string
  negative: string
  model: ModelId
  aspect: string
  w: number
  h: number
  steps: number
  guidance: number
  seed: number
  /** variation: a second seed blended in by subStrength (A1111 "variation seed") */
  subseed?: number
  subStrength?: number
  /** 2 = upscaled output */
  upscale?: number
  /** extra detail added by a creative upscale */
  detail?: number
}

/** A1111-style parameter text — what "Copy parameters" puts on the clipboard. */
export function paramsText(p: GenParams) {
  const m = modelOf(p.model)
  const lines = [p.prompt]
  if (p.negative) lines.push(`Negative prompt: ${p.negative}`)
  const kv: string[] = [
    `Steps: ${p.steps}`, `Sampler: ${m.sampler}`, `CFG scale: ${p.guidance}`, `Seed: ${p.seed}`, `Size: ${p.w}x${p.h}`, `Model: ${m.name}`,
  ]
  if (p.subseed !== undefined) kv.push(`Variation seed: ${p.subseed}`, `Variation seed strength: ${p.subStrength}`)
  if (p.upscale) kv.push(`Hires upscale: ${p.upscale}`)
  lines.push(kv.join(', '))
  return lines.join('\n')
}

/** Simulated wall-clock for one job: steps × per-step cost, scaled by pixels and batch. */
export function stepMs(p: GenParams, batch: number) {
  const m = modelOf(p.model)
  const mp = (p.w * p.h) / (1024 * 1024)
  return m.msPerStep * Math.pow(mp, 0.85) * (1 + 0.14 * (batch - 1))
}
