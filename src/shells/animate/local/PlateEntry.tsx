/* The plate itself: the drawing and its three parts pages, set as one Encyclopédie plate (the
   Lámina moodboard: "Lám. I · Rueca · Détails du rouet", after Diderot's spinning-wheel plate).
   - A plate border, one fine rule, round the whole spread: the parts pages A (left), B (right) and
     C (below) and the drawing between them are now one sheet, not things floating on the canvas.
   - A head band inside the border, centred on the drawing: the plate number and year printed small
     at the corners, the headword "Rueca" in the display face, then the entry as a dictionary gives
     it (pronunciation, part of speech, two numbered senses: the old one and the new one).
   - A foot line under page C: the figure caption, printed small.
   Decoration only, like PartsManual: on the stage overlay, never in the doc, Layers or exports.
   Rules in the measure ink, text in the stage's ink (it follows the theme). Doc units. */
import './plate-entry.css'

const DISPLAY = '"Rueca Display", Georgia, ui-serif, serif'
const BODY = '"IBM Plex Sans Variable", "Inter Variable", system-ui, sans-serif'
const RULE = 'var(--plate-measure, rgba(24,20,17,.42))'

/* the spread, from PartsManual's pages: A x -720…-120, B x 1500…2100 (both y 40…748), C y 960…1196;
   the artboard is 0…1380 × 0…833, so the spread and the artboard share a centre line */
const L = -800, R = 2180, CX = (L + R) / 2
const HEAD_TOP = -380, HEAD_RULE = -26, FOOT_RULE = 1256, BOTTOM = 1316
const IN = 12 // the border's inset from the spread's edge

/** how far above the artboard the head band reaches: the stage frames it on its first fit */
export const ENTRY_TOP = -HEAD_TOP

const SENSES = [
  'A spinning wheel. Raw fibre goes in, thread comes out.',
  'A kit that does the same for prototypes: one goes in, a design tool comes out.',
]
const small = (size = 22) => ({ font: `500 ${size}px ${BODY}`, letterSpacing: '0.14em', fill: 'var(--fg-muted)' })

export function PlateEntry() {
  return (
    <g data-overlay pointerEvents="none">
      {/* the plate border: one fine rule (Rafael, 11 Oct: a single rule, not double) */}
      <rect x={L + IN} y={HEAD_TOP + IN} width={R - L - IN * 2} height={BOTTOM - HEAD_TOP - IN * 2} fill="none" stroke={RULE} strokeWidth={0.9} />

      {/* head band: corners printed small, the headword and its entry centred on the drawing */}
      <text x={L + 44} y={HEAD_TOP + 64} style={small(24)}>LÁM. I</text>
      <text x={R - 44} y={HEAD_TOP + 64} textAnchor="end" style={small(24)}>MMXXVI</text>
      <text x={CX} y={HEAD_TOP + 158} textAnchor="middle" style={{ font: `400 150px ${DISPLAY}`, letterSpacing: '-0.015em', fill: 'var(--fg)' }}>Rueca</text>
      <text x={CX} y={HEAD_TOP + 206} textAnchor="middle" style={small(22)}>
        RUE·CA<tspan dx="26" style={{ letterSpacing: '0.02em' }}>/ˈrwe.ka/</tspan><tspan dx="26">SPANISH NOUN</tspan>
      </text>
      {SENSES.map((s, i) => (
        <text key={i} x={CX} y={HEAD_TOP + 246 + i * 34} textAnchor="middle" style={{ font: `italic 400 27px ${DISPLAY}`, fill: 'var(--fg)' }}>
          <tspan style={{ font: `500 20px ${BODY}`, fontStyle: 'normal', fill: 'var(--fg-muted)' }}>{i + 1}</tspan><tspan dx="12">{s}</tspan>
        </text>
      ))}
      <path d={`M${L + IN} ${HEAD_RULE}H${R - IN}`} stroke={RULE} strokeWidth={0.9} fill="none" />

      {/* foot line: the figure caption */}
      <path d={`M${L + IN} ${FOOT_RULE}H${R - IN}`} stroke={RULE} strokeWidth={0.9} fill="none" />
      <text x={L + 44} y={FOOT_RULE + 36} style={small(20)}>FIG. 1 — THE WHEEL, FRONT VIEW, AND ITS EIGHTEEN PARTS</text>
      <text x={R - 44} y={FOOT_RULE + 36} textAnchor="end" style={small(20)}>A · THE FLYER   B · THE DRIVE   C · THE FRAME & TREADLE</text>
    </g>
  )
}
