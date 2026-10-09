/* ---------------------------------------------------------------------------
   DOM renderer. Each node is an absolutely positioned div placed from the
   layout map — never from CSS flexbox — so screen, hit-testing and export all
   agree. Pointer events are off; the canvas owns interaction.
--------------------------------------------------------------------------- */
import { memo, useId, type CSSProperties } from 'react'
import type { Box, Node } from '../model/types'
import { fontCss, lineHeightOf, textLines, type LayoutMap } from '../model/layout'
import { ICONS } from '../model/icons'
import { effectStyle, fillsCss, radiusCss, rgba } from './css'
import { shapePath } from './shapes'

export interface RenderCtx {
  layout: LayoutMap
  editing?: string | null
  /** prototype player: make nodes with interactions clickable */
  onHotspot?: (n: Node, e: React.MouseEvent) => void
  hotspots?: boolean
}

export function nodeBaseStyle(n: Node, box: Box, parent: Box): CSSProperties {
  return {
    position: 'absolute',
    left: box.x - parent.x,
    top: box.y - parent.y,
    width: box.w,
    height: box.h,
    opacity: n.opacity,
    mixBlendMode: n.blend === 'normal' ? undefined : n.blend,
    transform: n.rotation ? `rotate(${-n.rotation}deg)` : undefined,
  }
}

/** Fills/strokes/effects/radius for a frame or rect — also used for the top-level artboards. */
export function surfaceStyle(n: Node): CSSProperties {
  return {
    background: n.type === 'text' || n.type === 'icon' || n.type === 'boolean' ? undefined : fillsCss(n.fills) || undefined,
    borderRadius: n.type === 'ellipse' ? '50%' : n.radius.some(Boolean) ? radiusCss(n.radius) : undefined,
    ...effectStyle(n),
  }
}

export const NodeView = memo(function NodeView({ n, parent, ctx }: { n: Node; parent: Box; ctx: RenderCtx }) {
  const box = ctx.layout.get(n.id)
  if (!box || !n.visible) return null
  const style: CSSProperties = { ...nodeBaseStyle(n, box, parent), ...surfaceStyle(n) }
  const hot = ctx.onHotspot && n.interactions?.length
  const common = {
    'data-node': n.id,
    style: { ...style, cursor: hot ? 'pointer' : undefined, pointerEvents: hot ? 'auto' : undefined } as CSSProperties,
    onClick: hot ? (e: React.MouseEvent) => { e.stopPropagation(); ctx.onHotspot!(n, e) } : undefined,
  }
  const hotRing = hot && ctx.hotspots ? <div className="pointer-events-none absolute inset-0 animate-pulse rounded-[inherit] bg-accent-soft shadow-[inset_0_0_0_2px_var(--accent)]" /> : null

  if (n.type === 'text' && n.text) return <TextNode n={n} box={box} common={common} editing={ctx.editing === n.id} />
  if (n.type === 'icon' && n.icon) {
    const Icon = ICONS[n.icon.name]
    const f = n.fills.find((p) => p.visible)
    const s = Math.min(box.w, box.h)
    return (
      <div {...common}>
        <div style={{ position: 'absolute', left: (box.w - s) / 2, top: (box.h - s) / 2, width: s, height: s, display: 'flex' }}>
          {Icon && <Icon size={s} color={f ? rgba(f.color, f.opacity) : '#000'} strokeWidth={n.icon.stroke} />}
        </div>
        {hotRing}
      </div>
    )
  }
  if (n.type === 'boolean') return <div {...common}><BoolSVG n={n} box={box} />{hotRing}</div>

  return (
    <div {...common} style={{ ...common.style, overflow: n.clip ? 'hidden' : undefined }}>
      {n.children?.map((c) => <NodeView key={c.id} n={c} parent={box} ctx={ctx} />)}
      {hotRing}
    </div>
  )
})

function TextNode({ n, box, common, editing }: { n: Node; box: Box; common: { style: CSSProperties }; editing: boolean }) {
  const t = n.text!
  const lines = textLines(n, box.w)
  const fill = n.fills.find((p) => p.visible)
  const gradient = fill && fill.kind !== 'solid'
  return (
    <div
      {...common}
      style={{
        ...common.style,
        fontFamily: fontCss(t.family),
        fontWeight: t.weight,
        fontSize: t.size,
        lineHeight: `${lineHeightOf(t)}px`,
        letterSpacing: `${t.letterSpacing / 100}em`,
        textAlign: t.align,
        whiteSpace: 'pre',
        color: fill && !gradient ? rgba(fill.color, fill.opacity) : gradient ? 'transparent' : 'transparent',
        background: gradient ? fillsCss([fill!]) : undefined,
        WebkitBackgroundClip: gradient ? 'text' : undefined,
        backgroundClip: gradient ? 'text' : undefined,
        visibility: editing ? 'hidden' : undefined,
        fontKerning: 'normal',
      }}
    >
      {lines.join('\n')}
    </div>
  )
}

function BoolSVG({ n, box }: { n: Node; box: Box }) {
  const uidp = useId().replace(/:/g, '')
  const shapes = (n.children ?? []).filter((c) => c.visible && (c.type === 'rect' || c.type === 'ellipse'))
  const paths = shapes.map((c) => shapePath(c, c.x, c.y, c.w, c.h))
  const f = n.fills.find((p) => p.visible && p.kind === 'solid')
  const fill = f ? rgba(f.color, f.opacity) : 'transparent'
  const st = n.strokes.find((p) => p.visible && p.kind === 'solid')
  const stroke = st && n.strokeWidth ? { stroke: rgba(st.color, st.opacity), strokeWidth: n.strokeWidth } : {}
  const op = n.bool ?? 'union'
  let body: React.ReactNode
  if (op === 'union' || op === 'exclude') body = <path d={paths.join('')} fill={fill} fillRule={op === 'exclude' ? 'evenodd' : 'nonzero'} {...stroke} />
  else if (op === 'subtract')
    body = (
      <>
        <mask id={`${uidp}m`} maskUnits="userSpaceOnUse" x={-box.w} y={-box.h} width={box.w * 3} height={box.h * 3}>
          <rect x={-box.w} y={-box.h} width={box.w * 3} height={box.h * 3} fill="white" />
          {paths.slice(1).map((d, i) => <path key={i} d={d} fill="black" />)}
        </mask>
        <path d={paths[0]} fill={fill} mask={`url(#${uidp}m)`} {...stroke} />
      </>
    )
  else
    body = (
      <>
        <defs>{paths.slice(0, -1).map((d, i) => <clipPath key={i} id={`${uidp}c${i}`}><path d={d} /></clipPath>)}</defs>
        {paths.slice(0, -1).reduceRight<React.ReactNode>((inner, _, i) => <g clipPath={`url(#${uidp}c${i})`}>{inner}</g>, <path d={paths.at(-1)} fill={fill} {...stroke} />)}
      </>
    )
  return <svg width={box.w} height={box.h} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>{body}</svg>
}
