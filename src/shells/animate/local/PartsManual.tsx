/* The rueca, taken apart: a parts breakdown laid out around the plate like the pages of a manual.
   Three assemblies, each a page of hairline cells: part, part number, name and quantity, all in the hand.
   Decoration only: drawn on the stage overlay (not in the doc, Layers or exports), never animated.
   The pages sit beyond the plate, under the panels; zoom out to read the whole breakdown. */
import sizes from '../parts.json'
import { HAND } from '../demo'

const PEN = '#E8582C'
const RULE = 'var(--plate-measure, rgba(24,20,17,.42))'
const src = (id: string) => `${import.meta.env.BASE_URL}demo/animate/part-${id}.webp`

interface Part { id: string; name: string; qty?: number }
interface Page { code: string; title: string; x: number; y: number; cols: number; parts: Part[] }

const CELL = { w: 300, h: 236, pad: 26, label: 44 }

const PAGES: Page[] = [
  { code: 'A', title: 'the flyer', x: -720, y: 40, cols: 2, parts: [
    { id: 'flyer', name: 'flyer' }, { id: 'bobbin', name: 'bobbin' }, { id: 'whorl', name: 'whorl' },
    { id: 'spindle', name: 'spindle' }, { id: 'hook', name: 'orifice hook' }, { id: 'bearing', name: 'leather bearing', qty: 2 },
  ] },
  { code: 'B', title: 'the drive', x: 1500, y: 40, cols: 2, parts: [
    { id: 'spoke', name: 'spoke', qty: 8 }, { id: 'hub', name: 'hub' }, { id: 'crank', name: 'crank & axle' },
    { id: 'band', name: 'drive band' }, { id: 'peg', name: 'tension peg' }, { id: 'distaff', name: 'distaff' },
  ] },
  { code: 'C', title: 'the frame & treadle', x: -210, y: 960, cols: 6, parts: [
    { id: 'bench', name: 'bench' }, { id: 'leg', name: 'leg', qty: 3 }, { id: 'maiden', name: 'maiden', qty: 2 },
    { id: 'mother', name: 'mother-of-all' }, { id: 'treadle', name: 'treadle' }, { id: 'footman', name: 'footman' },
  ] },
]

const S = sizes as Record<string, number[]>

function Cell({ part, code, x, y }: { part: Part; code: string; x: number; y: number }) {
  const size = S[part.id]
  const boxW = CELL.w - CELL.pad * 2, boxH = CELL.h - CELL.pad - CELL.label
  const k = size ? Math.min(2.2, boxW / size[0], boxH / size[1]) : 1 // small parts (hook, bearing) scale up to fill their cell
  const w = size ? size[0] * k : 0, h = size ? size[1] * k : 0
  const ly = y + CELL.h - 22
  return (
    <g>
      <rect x={x + 0.5} y={y + 0.5} width={CELL.w - 1} height={CELL.h - 1} fill="none" stroke={RULE} strokeWidth={1} />
      {size && <image href={src(part.id)} x={x + (CELL.w - w) / 2} y={y + CELL.pad + (boxH - h) / 2} width={w} height={h} filter="url(#tw-ink)" />}
      <circle cx={x + 30} cy={ly} r={15} fill="none" stroke={PEN} strokeWidth={1.3} />
      <text x={x + 30} y={ly + 1} dominantBaseline="central" textAnchor="middle" style={{ font: `400 18px ${HAND}`, fill: PEN }}>{code}</text>
      <text x={x + 54} y={ly + 2} dominantBaseline="central" style={{ font: `400 24px ${HAND}`, fill: PEN }}>{part.name}</text>
      {part.qty && <text x={x + CELL.w - 16} y={ly + 2} dominantBaseline="central" textAnchor="end" style={{ font: `400 24px ${HAND}`, fill: PEN }}>{part.qty}×</text>}
    </g>
  )
}

export function PartsManual() {
  return (
    <g data-overlay pointerEvents="none">
      {PAGES.map((pg) => {
        const rows = Math.ceil(pg.parts.length / pg.cols)
        const W = pg.cols * CELL.w, H = rows * CELL.h
        return (
          <g key={pg.code}>
            {/* page title, in the hand, with the assembly letter circled */}
            <circle cx={pg.x + 22} cy={pg.y - 30} r={20} fill="none" stroke={PEN} strokeWidth={1.5} />
            <text x={pg.x + 22} y={pg.y - 29} dominantBaseline="central" textAnchor="middle" style={{ font: `400 26px ${HAND}`, fill: PEN }}>{pg.code}</text>
            <text x={pg.x + 54} y={pg.y - 26} dominantBaseline="central" style={{ font: `400 36px ${HAND}`, fill: PEN }}>{pg.title}</text>
            <text x={pg.x + W} y={pg.y - 26} dominantBaseline="central" textAnchor="end" style={{ font: `400 22px ${HAND}`, fill: PEN }}>{pg.parts.length} parts</text>
            <rect x={pg.x} y={pg.y} width={W} height={H} fill="none" stroke={RULE} strokeWidth={1.6} />
            {pg.parts.map((p, i) => (
              <Cell key={p.id} part={p} code={`${pg.code}${i + 1}`} x={pg.x + (i % pg.cols) * CELL.w} y={pg.y + Math.floor(i / pg.cols) * CELL.h} />
            ))}
          </g>
        )
      })}
    </g>
  )
}
