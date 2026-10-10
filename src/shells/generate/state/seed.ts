/* First-run history: three believable sessions so the gallery is never a blank demo. Images are
   re-rendered from these params on load, so this is all that is stored. */
import { aspectOf, modelOf, type GenParams, type ModelId } from '../engine/models'
import type { Board, ImageRec, Session } from './gallery'

const HOUR = 3600_000

type Run = { prompt: string; negative?: string; model: ModelId; aspect: string; seed: number; n: number; ago: number; guidance?: number; steps?: number; fav?: number[]; board?: number[] }

const SESSIONS: { name: string; ago: number; runs: Run[] }[] = [
  {
    name: 'Spinning top studies', ago: 3,
    runs: [
      { prompt: 'A spinning top, studio light, seamless paper sweep', negative: 'text, watermark', model: 'lumen-xl', aspect: '4:5', seed: 120417, n: 4, ago: 3.2, fav: [1], board: [1, 2] },
      { prompt: 'The same top at night, a single spotlight from above', model: 'lumen-xl', aspect: '4:5', seed: 88123, n: 2, ago: 3.0, fav: [0] },
      { prompt: 'A spinning top, studio light, halftone print, one ink', model: 'riso', aspect: '2:3', seed: 120417, n: 2, ago: 2.9, board: [0] },
      { prompt: 'Spinning top on paper, wide, minimal composition', model: 'lumen-turbo', aspect: '3:2', seed: 5521, n: 4, ago: 2.8, steps: 6, guidance: 2 },
    ],
  },
  {
    name: 'Product shots', ago: 26,
    runs: [
      { prompt: 'Spinning top close-up, hard key light, long shadow', model: 'photon', aspect: '1:1', seed: 7, n: 4, ago: 26, fav: [2] },
      { prompt: 'A spinning top, centred, upright, soft light', model: 'lumen-xl', aspect: '1:1', seed: 31337, n: 2, ago: 25.6, board: [0] },
      { prompt: 'Spinning top mid-spin, low angle, studio light', model: 'lumen-xl', aspect: '16:9', seed: 2024, n: 2, ago: 25.2, fav: [0] },
    ],
  },
  {
    name: 'Dark set', ago: 50,
    runs: [
      { prompt: 'Spinning top in the dark, moody, one spotlight, 35mm', model: 'photon', aspect: '16:9', seed: 4471, n: 3, ago: 50, fav: [0], board: [0] },
      { prompt: 'A spinning top, wide, negative space, minimal', model: 'lumen-turbo', aspect: '21:9', seed: 902, n: 2, ago: 49.5, steps: 6, guidance: 2 },
      { prompt: 'Spinning top at night, low key, long shadow', model: 'lumen-xl', aspect: '3:2', seed: 64, n: 2, ago: 49.2 },
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
