/* Specimen mode: a live, editable DOM artboard + glyph and waterfall panels. */
import { forwardRef, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { Segmented, cn } from '@kit'
import { params, family, type V } from './params'
import { SPECIMEN_FAMILY, variationSettings } from './fonts'

export const caseCSS: Record<string, CSSProperties['textTransform']> = { none: 'none', upper: 'uppercase', lower: 'lowercase', title: 'capitalize' }

/** The full CSS for the headline — shared by the artboard, the glyph grid and "Copy CSS". */
export function headlineStyle(v: V, size = v.size): CSSProperties {
  const fam = family(v)
  return {
    fontFamily: fam.css,
    fontSize: size,
    lineHeight: v.leading,
    letterSpacing: `${v.tracking}em`,
    fontWeight: Math.round(v.wght),
    fontVariationSettings: variationSettings(fam, v.wght, v.opsz, v.autoOpsz, size),
    fontStyle: v.italic ? 'italic' : 'normal',
    textTransform: caseCSS[v.textCase],
    color: v.fg,
  }
}

export function rgba(hex: string, a: number) {
  const n = parseInt(hex.replace('#', '').slice(0, 6), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

export function axesSummary(v: V) {
  const fam = family(v)
  const parts = [`wght ${Math.round(v.wght)}`]
  if (fam.axes.opsz) parts.push(`opsz ${v.autoOpsz ? Math.min(32, Math.max(14, v.size)) : v.opsz}`)
  parts.push(`${v.size}/${Math.round(v.size * v.leading)}`)
  parts.push(`${v.tracking >= 0 ? '+' : '−'}${Math.abs(v.tracking * 100).toFixed(1)}%`)
  if (v.width !== 100) parts.push(`width ${v.width}%`)
  if (v.slant) parts.push(`slant ${v.slant}°`)
  return parts.join(' · ')
}

/* Caret bookkeeping so glyph clicks insert where the user was typing. */
let editorEl: HTMLDivElement | null = null
let lastRange: Range | null = null
if (typeof document !== 'undefined')
  document.addEventListener('selectionchange', () => {
    const s = document.getSelection()
    if (editorEl && s && s.rangeCount && editorEl.contains(s.anchorNode)) lastRange = s.getRangeAt(0).cloneRange()
  })

export function insertAtCaret(text: string) {
  const el = editorEl
  if (!el) return
  el.focus()
  const sel = document.getSelection()!
  if (lastRange && el.contains(lastRange.startContainer)) { sel.removeAllRanges(); sel.addRange(lastRange) }
  else { const r = document.createRange(); r.selectNodeContents(el); r.collapse(false); sel.removeAllRanges(); sel.addRange(r) }
  // execCommand keeps the browser's own undo stack for the edit
  const ok = document.execCommand('insertText', false, text)
  if (!ok) params.setValue('text', params.values().text + text)
  else params.commit()
}
/** Focus the headline with the caret at the end (focus() alone puts it at the start). */
export const focusEditor = () => {
  const el = editorEl
  if (!el) return
  el.focus()
  const r = document.createRange()
  r.selectNodeContents(el)
  r.collapse(false)
  const sel = document.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(r)
}

export const SpecimenArtboard = forwardRef<HTMLDivElement, { v: V; w: number; h: number }>(function SpecimenArtboard({ v, w, h }, ref) {
  const text = useRef<HTMLDivElement>(null)
  const [editing, setEditing] = useState(false)

  useEffect(() => { editorEl = text.current; return () => { if (editorEl === text.current) editorEl = null } }, [])
  // Uncontrolled while focused; follow the store otherwise (undo, presets, the inspector field).
  useLayoutEffect(() => {
    const el = text.current
    if (el && document.activeElement !== el && el.innerText !== v.text) el.innerText = v.text
  }, [v.text])

  const sx = v.width / 100
  const caption: CSSProperties = { fontFamily: `"${SPECIMEN_FAMILY}", "Inter Variable", sans-serif`, fontSize: 15, lineHeight: 1.3, fontWeight: 500, fontVariationSettings: '"wght" 500, "opsz" 14', color: rgba(v.fg, 0.56), letterSpacing: '0.005em' }
  const fam = family(v)

  return (
    <div ref={ref} className="relative flex h-full w-full flex-col" style={{ padding: v.margin, background: v.bg, fontFeatureSettings: 'normal' }}>
      {v.showMeta && (
        <div className="flex flex-none items-baseline justify-between gap-8" style={{ paddingBottom: v.margin * 0.5 }}>
          <div data-svg-text style={caption}>{fam.label}{v.italic ? ' Italic' : ''}</div>
          <div data-svg-text style={{ ...caption, fontVariantNumeric: 'tabular-nums' }}>{axesSummary(v)}</div>
        </div>
      )}
      <div className="flex min-h-0 flex-1 flex-col justify-center overflow-hidden">
        <div
          ref={text}
          data-svg-text
          data-placeholder="Type something…"
          contentEditable="plaintext-only"
          suppressContentEditableWarning
          spellCheck={false}
          aria-label="Specimen text"
          onFocus={() => setEditing(true)}
          onInput={() => params.setValue('text', text.current!.innerText.replace(/\n$/, ''), { commit: false })}
          onBlur={() => { setEditing(false); params.commit() }}
          onKeyDown={(e) => { if (e.key === 'Escape') (e.target as HTMLElement).blur() }}
          className={cn(
            'cursor-text whitespace-pre-wrap outline-none [overflow-wrap:break-word]',
            'empty:before:opacity-30 empty:before:content-[attr(data-placeholder)]',
          )}
          style={{
            ...headlineStyle(v),
            textAlign: v.align as CSSProperties['textAlign'],
            transform: sx !== 1 || v.slant ? `scaleX(${sx}) skewX(${-v.slant}deg)` : undefined,
            transformOrigin: '0 0',
            width: `${100 / sx}%`,
            caretColor: v.fg,
            boxShadow: editing ? `0 0 0 ${2}px ${rgba(v.fg, 0.12)}` : undefined,
            borderRadius: 4,
          }}
        />
      </div>
      {v.showMeta && (
        <div className="flex flex-none flex-col gap-4" style={{ paddingTop: v.margin * 0.5 }}>
          <div data-svg-text className="truncate" style={{ ...headlineStyle(v, Math.max(24, Math.min(44, w / 40))), lineHeight: 1.2, textTransform: 'none', letterSpacing: `${v.tracking * 0.4}em` }}>
            ABCDEFGHIJKLM abcdefghijklm 0123456789 &amp;?!
          </div>
          <div className="flex items-baseline justify-between gap-8">
            <div data-svg-text style={caption}>Specimen 01 — {fam.note}</div>
            <div data-svg-text style={caption}>{w} × {h}</div>
          </div>
        </div>
      )}
    </div>
  )
})

/* ---------------- Glyphs ---------------- */
const SETS: Record<string, string> = {
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower: 'abcdefghijklmnopqrstuvwxyz',
  figures: '0123456789½¼¾%‰+−×÷=≠≈<>±$€£¥¢',
  punct: '.,:;…!?¡¿·•‐–—_()[]{}/\\|@&#*†‡§¶"\'“”‘’«»‹›',
  accents: 'ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÑÒÓÔÕÖØŒÙÚÛÜÝßàáâãäåæçèéêëìíîïñòóôõöøœùúûüýÿ',
}
const SET_OPTS = [
  { value: 'upper', label: 'A–Z' },
  { value: 'lower', label: 'a–z' },
  { value: 'figures', label: '0–9' },
  { value: 'punct', label: '?!' },
  { value: 'accents', label: 'Àé' },
]

export function GlyphPanel({ v }: { v: V }) {
  const [set, setSet] = useState('upper')
  const [hover, setHover] = useState<string>('A')
  const glyphs = [...SETS[set]]
  const style = headlineStyle(v, 22)
  const cp = hover.codePointAt(0) ?? 0
  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="relative flex h-[132px] items-center justify-center overflow-hidden rounded-[8px]" style={{ background: v.bg }}>
        <span style={{ ...headlineStyle(v, 96), lineHeight: 1, textTransform: 'none', letterSpacing: 0 }}>{hover}</span>
        <span className="absolute bottom-1.5 left-2 tabular text-[10.5px]" style={{ color: rgba(v.fg, 0.55) }}>U+{cp.toString(16).toUpperCase().padStart(4, '0')}</span>
        <span className="absolute right-2 bottom-1.5 tabular text-[10.5px]" style={{ color: rgba(v.fg, 0.55) }}>wght {Math.round(v.wght)}</span>
      </div>
      <Segmented size="sm" value={set} onChange={setSet} options={SET_OPTS} label="Glyph set" />
      <div className="grid grid-cols-6 gap-1" role="grid" aria-label="Glyphs — click to insert">
        {glyphs.map((g) => (
          <button
            key={g}
            type="button"
            aria-label={`Insert ${g}`}
            title={`Insert ${g}`}
            onMouseEnter={() => setHover(g)}
            onFocus={() => setHover(g)}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => insertAtCaret(g)}
            className="flex aspect-square items-center justify-center rounded-[6px] bg-input text-fg outline-none transition-colors hover:bg-hover hover:shadow-[inset_0_0_0_1px_var(--line-strong)] focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span style={{ ...style, color: undefined, textTransform: 'none', letterSpacing: 0, lineHeight: 1 }}>{g}</span>
          </button>
        ))}
      </div>
      <p className="px-0.5 text-[11px] leading-relaxed text-faint">Click a glyph to insert it at the caret. Rendered with the current axes.</p>
    </div>
  )
}

const WATERFALL = [12, 14, 16, 20, 24, 32, 40, 56, 72]
export function WaterfallPanel({ v }: { v: V }) {
  const sample = v.text.split('\n')[0] || 'Hamburgefonstiv'
  return (
    <div className="flex flex-col py-1">
      {WATERFALL.map((s) => (
        <div key={s} className="flex items-baseline gap-2 border-b border-line px-3 py-2 last:border-b-0">
          <span className="w-6 shrink-0 tabular text-[10.5px] text-faint">{s}</span>
          <span className="min-w-0 truncate text-fg" style={{ ...headlineStyle(v, s), color: undefined, lineHeight: 1.15 }}>{sample}</span>
        </div>
      ))}
    </div>
  )
}

export function specimenCSS(v: V) {
  const fam = family(v)
  const lines = [
    `font-family: ${fam.css.replace(`"${SPECIMEN_FAMILY}", `, '')};`,
    `font-size: ${v.size}px; /* ${+(v.size / 16).toFixed(3)}rem */`,
    `line-height: ${v.leading};`,
    `letter-spacing: ${+v.tracking.toFixed(3)}em;`,
    `font-weight: ${Math.round(v.wght)};`,
  ]
  if (fam.axes.opsz) lines.push(v.autoOpsz ? 'font-optical-sizing: auto;' : `font-variation-settings: "opsz" ${v.opsz};`)
  if (v.italic) lines.push('font-style: italic;')
  if (v.textCase !== 'none') lines.push(`text-transform: ${caseCSS[v.textCase]};`)
  lines.push(`text-align: ${v.align};`, `color: ${v.fg};`, `background: ${v.bg};`)
  const tf: string[] = []
  if (v.width !== 100) tf.push(`scaleX(${v.width / 100})`)
  if (v.slant) tf.push(`skewX(${-v.slant}deg)`)
  if (tf.length) lines.push(`transform: ${tf.join(' ')}; /* simulated width / slant */`, 'transform-origin: 0 0;')
  return `.specimen {\n${lines.map((l) => `  ${l}`).join('\n')}\n}`
}
