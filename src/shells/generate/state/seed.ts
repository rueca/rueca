/* First-run history: three believable sessions so the gallery is never a blank demo. Images are
   re-rendered from these params on load, so this is all that is stored. */
import { aspectOf, modelOf, type GenParams, type ModelId } from '../engine/models'
import type { Board, ImageRec, Session } from './gallery'

const HOUR = 3600_000

type Run = { prompt: string; negative?: string; model: ModelId; aspect: string; seed: number; n: number; ago: number; guidance?: number; steps?: number; fav?: number[]; board?: number[] }

const SESSIONS: { name: string; ago: number; runs: Run[] }[] = [
  {
    name: 'Campana studies', ago: 3,
    runs: [
      { prompt: 'A brass hand bell with a walnut handle on saffron paper, studio light', negative: 'text, watermark', model: 'lumen-xl', aspect: '4:5', seed: 120417, n: 4, ago: 3.2, fav: [1], board: [1, 2] },
      { prompt: 'The same bell on black, one hard spotlight from above', model: 'photon', aspect: '3:2', seed: 88123, n: 2, ago: 3.0, fav: [0] },
      { prompt: 'The bell as a one-ink print', model: 'riso', aspect: '2:3', seed: 120417, n: 2, ago: 2.9, board: [0] },
      { prompt: 'Brass bell, quick draft', model: 'lumen-turbo', aspect: '1:1', seed: 5521, n: 4, ago: 2.8, steps: 6, guidance: 2 },
    ],
  },
  {
    name: 'Agalla still lifes', ago: 26,
    runs: [
      { prompt: 'A bottle of red ink and a wax seal on vermilion paper', model: 'lumen-xl', aspect: '4:5', seed: 7, n: 4, ago: 26, fav: [2] },
      { prompt: 'A bottle of natural ink on its own colour, square', model: 'lumen-xl', aspect: '1:1', seed: 31337, n: 4, ago: 25.6, board: [0, 3] },
      { prompt: 'An ink bottle, a quill and a wax seal on a desk, window light', model: 'photon', aspect: '16:9', seed: 2024, n: 2, ago: 25.2, fav: [0] },
    ],
  },
  {
    name: 'Gabinete plates', ago: 50,
    runs: [
      { prompt: 'Copperplate engraving of an orrery, encyclopedia plate', model: 'lumen-xl', aspect: '1:1', seed: 4471, n: 3, ago: 50, fav: [0], board: [0] },
      { prompt: 'Armillary sphere engraving, wide, plenty of paper', model: 'photon', aspect: '4:5', seed: 902, n: 2, ago: 49.5 },
      { prompt: 'Astrolabe engraving as a halftone', model: 'riso', aspect: '1:1', seed: 64, n: 2, ago: 49.2 },
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
