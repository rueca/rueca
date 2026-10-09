/* First-run history: three believable sessions so the gallery is never a blank demo. Images are
   re-rendered from these params on load, so this is all that is stored. */
import { aspectOf, modelOf, type GenParams, type ModelId } from '../engine/models'
import type { Board, ImageRec, Session } from './gallery'

const HOUR = 3600_000

type Run = { prompt: string; negative?: string; model: ModelId; aspect: string; seed: number; n: number; ago: number; guidance?: number; steps?: number; fav?: number[]; board?: number[] }

const SESSIONS: { name: string; ago: number; runs: Run[] }[] = [
  {
    name: 'Alpine travel posters', ago: 3,
    runs: [
      { prompt: 'Alpine lake at dawn, layered peaks fading into mist, soft film grain, travel poster', negative: 'people, text, watermark', model: 'lumen-xl', aspect: '4:5', seed: 120417, n: 4, ago: 3.2, fav: [1], board: [1, 2] },
      { prompt: 'The same valley at night, starry sky, crescent moon over the ridge, quiet and cold', model: 'lumen-xl', aspect: '4:5', seed: 88123, n: 2, ago: 3.0, fav: [0] },
      { prompt: 'Alpine lake at dawn, layered peaks, risograph print, two inks', model: 'riso', aspect: '2:3', seed: 120417, n: 2, ago: 2.9, board: [0] },
      { prompt: 'Snow fjord at sunrise, glacier, clean minimal composition', model: 'lumen-turbo', aspect: '3:2', seed: 5521, n: 4, ago: 2.8, steps: 6, guidance: 2 },
    ],
  },
  {
    name: 'Glass & bloom moodboard', ago: 26,
    runs: [
      { prompt: 'Iridescent glass planet with rings floating in deep space, studio lighting', model: 'photon', aspect: '1:1', seed: 7, n: 4, ago: 26, fav: [2] },
      { prompt: 'Botanical bloom in coral and cream, soft pastel petals, macro, shallow depth of field', model: 'lumen-xl', aspect: '1:1', seed: 31337, n: 2, ago: 25.6, board: [0] },
      { prompt: 'Abstract liquid marble, emerald and gold silk, luxury packaging texture', model: 'lumen-xl', aspect: '16:9', seed: 2024, n: 2, ago: 25.2, fav: [0] },
    ],
  },
  {
    name: 'Night city', ago: 50,
    runs: [
      { prompt: 'Neon city skyline in the rain, wet street reflections, cinematic, 35mm film', model: 'photon', aspect: '16:9', seed: 4471, n: 3, ago: 50, fav: [0], board: [0] },
      { prompt: 'Desert dunes at golden hour, long shadows, minimal', model: 'lumen-turbo', aspect: '21:9', seed: 902, n: 2, ago: 49.5, steps: 6, guidance: 2 },
      { prompt: 'Ocean waves at sunset, glittering water, misty horizon', model: 'lumen-xl', aspect: '3:2', seed: 64, n: 2, ago: 49.2 },
    ],
  },
]

export function seedGallery(): { sessions: Session[]; boards: Board[]; images: ImageRec[] } {
  const now = Date.now()
  const boards: Board[] = [{ id: 'b-client', name: 'Client picks' }]
  const sessions: Session[] = []
  const images: ImageRec[] = []
  SESSIONS.forEach((s, si) => {
    const sid = `s-seed${si}`
    sessions.push({ id: sid, name: s.name, createdAt: now - s.ago * HOUR })
    s.runs.forEach((r, ri) => {
      const m = modelOf(r.model), a = aspectOf(r.aspect)
      for (let k = 0; k < r.n; k++) {
        const params: GenParams = { prompt: r.prompt, negative: r.negative ?? '', model: r.model, aspect: r.aspect, w: a.w, h: a.h, steps: r.steps ?? m.steps, guidance: r.guidance ?? m.guidance, seed: r.seed + k }
        images.push({
          id: `i-seed${si}${ri}${k}`, sessionId: sid, jobId: `j-seed${si}${ri}`, createdAt: now - r.ago * HOUR - k,
          params, kind: 'generate', favourite: r.fav?.includes(k), boards: r.board?.includes(k) ? ['b-client'] : [],
          ms: Math.round(m.msPerStep * params.steps * (1 + 0.14 * (r.n - 1)) + 300),
        })
      }
    })
  })
  images.sort((a, b) => b.createdAt - a.createdAt)
  return { sessions, boards, images }
}
