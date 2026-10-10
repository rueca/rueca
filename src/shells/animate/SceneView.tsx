/* The stage renderer: SVG, a pure function of (doc, resolved). Plus selection
   outline, onion-skin ghosts, direct manipulation and preview listeners. */
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useStore } from 'zustand'
import { useCamera, useValues } from '@kit'
import { bindText, childrenOf, resolve, type Doc, type Obj, type PropKey, type Resolved, type Val } from './engine'
import { animTime, clock, currentAnim, editProps, params, runtime, ui, useDoc, useUI } from './store'

const num = (v: Val) => (typeof v === 'number' ? v : parseFloat(v))

/* On the bare stage the plate's two inks follow the theme (Nogal on light, Lana on dark), set as CSS vars on the wrapper.
   The fallbacks are the light values, so an exported SVG frame prints Nogal on Lana. */
const INK: Record<string, string> = { '#181411': 'var(--plate-ink, #181411)', '#6e6a64': 'var(--plate-mute, #6E6A64)' }
const inked = (fill: Val) => INK[String(fill).toLowerCase()] ?? String(fill)

function Shape({ o, p, doc, inputs }: { o: Obj; p: Record<PropKey, Val>; doc: Doc; inputs: Record<string, boolean | number> }) {
  if (o.kind === 'rect') {
    const w = num(p.w), h = num(p.h)
    return <rect x={-w / 2} y={-h / 2} width={Math.max(0, w)} height={Math.max(0, h)} rx={Math.min(num(p.radius), w / 2, h / 2)} fill={String(p.fill)} stroke={num(p.strokeWidth) > 0 ? String(p.stroke) : undefined} strokeWidth={num(p.strokeWidth)} filter={o.shadow ? 'url(#tw-shadow)' : undefined} />
  }
  if (o.kind === 'ellipse')
    return <ellipse rx={Math.max(0, num(p.w) / 2)} ry={Math.max(0, num(p.h) / 2)} fill={String(p.fill)} stroke={num(p.strokeWidth) > 0 ? String(p.stroke) : undefined} strokeWidth={num(p.strokeWidth)} />
  if (o.kind === 'path') return <path d={o.d} fill={String(p.fill)} />
  if (o.kind === 'image' && o.href) {
    const w = num(p.w), h = num(p.h)
    return <image href={o.href} x={-w / 2} y={-h / 2} width={Math.max(0, w)} height={Math.max(0, h)} preserveAspectRatio="none" filter="url(#tw-ink)" />
  }
  if (o.kind === 'text') {
    const merged = doc.sm.inputs.map((i) => ({ ...i, value: inputs[i.name] ?? i.value }))
    return (
      <text x={0} y={0} dominantBaseline="central" textAnchor={o.align === 'middle' ? 'middle' : 'start'}
        style={{ fill: inked(p.fill), font: `${o.fontWeight ?? 500} ${o.fontSize ?? 16}px "Inter Variable", Inter, system-ui, sans-serif`, fontFeatureSettings: '"tnum"' }}>
        {bindText(o.text ?? '', merged)}
      </text>
    )
  }
  return null
}

const tf = (p: Record<PropKey, Val>) => `translate(${num(p.x)} ${num(p.y)}) rotate(${num(p.rotation)}) scale(${num(p.scale)})`

export function SceneSVG({
  doc, r, inputs, bg, bare = false, interactive = false, onObjectDown, svgRef, ghosts = [], ghostOf, children,
}: {
  doc: Doc; r: Resolved; inputs: Record<string, boolean | number>; bg: [string, string]
  /** no background: the scene sits straight on the canvas */
  bare?: boolean
  interactive?: boolean
  onObjectDown?: (o: Obj, e: React.PointerEvent) => void
  svgRef?: React.Ref<SVGSVGElement>
  ghosts?: { r: Resolved; opacity: number }[]
  ghostOf?: string | null
  children?: React.ReactNode
}) {
  const node = (o: Obj, res: Resolved, live: boolean): React.ReactNode => {
    if (!o.visible) return null
    const p = res[o.id]
    return (
      <g key={o.id} data-id={live ? o.id : undefined} transform={tf(p)} opacity={Math.max(0, Math.min(1, num(p.opacity)))}
        onPointerDown={live && interactive ? (e) => onObjectDown?.(o, e) : undefined}
        style={live && interactive && !o.locked ? { cursor: 'default' } : undefined}>
        <g data-content={live ? o.id : undefined}>
          <Shape o={o} p={p} doc={doc} inputs={inputs} />
          {childrenOf(doc, o.id).map((c) => node(c, res, live))}
        </g>
      </g>
    )
  }
  // A ghost renders only the selected object, inside its ancestors' transforms.
  const ghost = (res: Resolved) => {
    const target = doc.objects.find((o) => o.id === ghostOf)
    if (!target) return null
    const chain: Obj[] = []
    for (let p = target.parent; p; p = doc.objects.find((o) => o.id === p)?.parent ?? null) { const o = doc.objects.find((x) => x.id === p); if (o) chain.unshift(o) }
    return chain.reduceRight<React.ReactNode>((inner, o) => <g transform={tf(res[o.id])}>{inner}</g>, node(target, res, false))
  }
  return (
    <svg ref={svgRef} width={doc.width} height={doc.height} viewBox={`0 0 ${doc.width} ${doc.height}`} className="block" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="tw-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={bg[0]} /><stop offset="1" stopColor={bg[1]} /></linearGradient>
        {/* engraved layers are ink-alpha images: recolour them to the plate ink */}
        <filter id="tw-ink" colorInterpolationFilters="sRGB"><feFlood style={{ floodColor: 'var(--plate-ink, #181411)' }} /><feComposite in2="SourceAlpha" operator="in" /></filter>
        <filter id="tw-shadow" x="-50%" y="-50%" width="200%" height="220%"><feDropShadow dx="0" dy="12" stdDeviation="14" floodColor="#140a3c" floodOpacity="0.35" /></filter>
      </defs>
      <rect data-bg width={doc.width} height={doc.height} fill={bare ? 'transparent' : 'url(#tw-bg)'} />
      {ghosts.map((g, i) => <g key={i} opacity={g.opacity} pointerEvents="none" data-overlay>{ghost(g.r)}</g>)}
      {childrenOf(doc, null).map((o) => node(o, r, true))}
      {children}
    </svg>
  )
}

/* Plate marks (Lámina): annotation only, drawn on the stage overlay so SVG/PNG
   export never carries them. A measure-pen diameter under the wheel, and one
   Achiote note on the flyer. They follow the wheel as it moves. */
const MEASURE = 'var(--plate-measure, rgba(24,20,17,.42))', PEN = '#E8582C'
const MONO = "'Geist Mono Variable', 'Geist Mono', ui-monospace, Menlo, monospace"
function PenMarks({ doc, r }: { doc: Doc; r: Resolved }) {
  const wheel = r.wheel
  if (!wheel || !doc.objects.find((o) => o.id === 'wheel')?.visible) return null
  const s = num(wheel.scale), cx = num(wheel.x), cy = num(wheel.y), rad = (num(wheel.w) / 2) * s * 0.996
  const y0 = cy - rad, y1 = cy + rad, x = cx - rad - 34
  const font = { font: `500 15px ${MONO}` }
  const fx = 836, fy = 118 // above the flyer
  return (
    <g data-overlay pointerEvents="none" fill="none">
      {/* measure pen: the wheel's diameter, up its left side */}
      <g stroke={MEASURE} strokeWidth={1.2}>
        <path d={`M${x - 8} ${y0}H${cx - rad * 0.55}M${x - 8} ${y1}H${cx - rad * 0.55}`} strokeDasharray="3 4" />
        <path d={`M${x} ${y0}V${cy - 24}M${x} ${cy + 24}V${y1}M${x - 5} ${y0 + 5}l10 -10M${x - 5} ${y1 + 5}l10 -10`} />
      </g>
      <text x={x} y={cy} dominantBaseline="central" textAnchor="middle" transform={`rotate(-90 ${x} ${cy})`} style={{ ...font, fill: MEASURE }}>Ø 560</text>
      {/* red pen: one note on the part that pays it back */}
      <g stroke={PEN} strokeWidth={1.4}>
        <path d={`M${fx - 4} ${fy + 78}C${fx - 10} ${fy + 50} ${fx - 6} ${fy + 26} ${fx + 2} ${fy + 12}`} />
        <circle cx={fx + 12} cy={fy} r={13} />
      </g>
      <text x={fx + 12} y={fy + 0.5} dominantBaseline="central" textAnchor="middle" style={{ font: `600 14px ${MONO}`, fill: PEN }}>1</text>
      <text x={fx + 33} y={fy + 0.5} dominantBaseline="central" style={{ ...font, fill: PEN }}>turns 9.7× the wheel</text>
    </g>
  )
}

/** Live stage: subscribes to the clock, runs the state machine in preview. */
export function LiveScene({ svgRef }: { svgRef: React.RefObject<SVGSVGElement | null> }) {
  const doc = useDoc()
  const v = useValues(params)
  const sel = useUI((s) => s.sel)
  const preview = useUI((s) => s.preview)
  const pending = useUI((s) => s.pending)
  const inputs = useUI((s) => s.inputs)
  const animId = useUI((s) => s.animId)
  const mode = useUI((s) => s.mode)
  const cam = useCamera()
  const zoom = useStore(cam, (s) => s.zoom)
  const [, force] = useState(0)
  const frame = useRef<Resolved | null>(null)

  // one subscription; the render reads the latest frame
  // Design mode shows the design-time (base) values, like Rive.
  const live = useRef({ doc, pending, preview, mode })
  live.current = { doc, pending, preview, mode }
  useEffect(() => clock.onTick((_t, dt) => {
    const L = live.current
    if (L.mode === 'design' && !L.preview) return
    frame.current = L.preview ? runtime.step(dt) : resolve(L.doc, currentAnim(L.doc), animTime(), L.pending)
    force((n) => (n + 1) % 1e6)
  }), [])
  const r = preview ? (frame.current ?? resolve(doc, currentAnim(doc), 0))
    : mode === 'design' ? resolve(doc, undefined, 0)
    : resolve(doc, currentAnim(doc), animTime(), pending)
  void animId

  // onion skin
  const anim = currentAnim(doc)
  const ghosts: { r: Resolved; opacity: number }[] = []
  if (v.onion && sel && !preview && mode === 'animate') {
    const t = animTime(), span = v.onionSpan
    for (const [d, op] of [[-2, 0.1], [-1, 0.2], [1, 0.2], [2, 0.1]] as const) {
      const at = t + d * span
      if (at >= 0 && at <= anim.duration) ghosts.push({ r: resolve(doc, anim, at), opacity: op })
    }
  }

  // selection outline, measured after paint from the live DOM
  const outline = useRef<SVGPolygonElement>(null)
  const handles = useRef<SVGGElement>(null)
  useLayoutEffect(() => {
    const svg = svgRef.current, poly = outline.current
    if (!svg || !poly) return
    const el = sel && !preview ? (svg.querySelector(`[data-content="${sel}"]`) as SVGGraphicsElement | null) : null
    if (!el) { poly.setAttribute('visibility', 'hidden'); handles.current?.setAttribute('visibility', 'hidden'); return }
    const b = el.getBBox()
    const m = el.getCTM()
    if (!m) return
    const pts = [[b.x, b.y], [b.x + b.width, b.y], [b.x + b.width, b.y + b.height], [b.x, b.y + b.height]].map(([x, y]) => new DOMPoint(x, y).matrixTransform(m))
    poly.setAttribute('points', pts.map((q) => `${q.x},${q.y}`).join(' '))
    poly.setAttribute('visibility', 'visible')
    if (handles.current) {
      handles.current.setAttribute('visibility', 'visible')
      const s = 6 / zoom
      Array.from(handles.current.children).forEach((c, i) => {
        c.setAttribute('x', String(pts[i].x - s / 2)); c.setAttribute('y', String(pts[i].y - s / 2))
        c.setAttribute('width', String(s)); c.setAttribute('height', String(s))
      })
    }
  })

  // direct manipulation
  const onObjectDown = (o: Obj, e: React.PointerEvent) => {
    if (preview) return
    if (o.locked) return // let it bubble to an unlocked parent
    e.stopPropagation()
    if (e.button !== 0) return
    ui.setState({ sel: o.id })
    const start = r[o.id]
    let ps = 1
    for (let p = o.parent; p; p = doc.objects.find((x) => x.id === p)?.parent ?? null) ps *= num(r[p]?.scale ?? 1) || 1
    const x0 = e.clientX, y0 = e.clientY, sx = num(start.x), sy = num(start.y)
    let moved = false
    const at = (ev: PointerEvent) => {
      let dx = (ev.clientX - x0) / (zoom * ps), dy = (ev.clientY - y0) / (zoom * ps)
      if (ev.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0 }
      return { x: Math.round(sx + dx), y: Math.round(sy + dy) }
    }
    const move = (ev: PointerEvent) => {
      if (!moved && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 3) return
      moved = true
      editProps(o.id, at(ev), false)
    }
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      if (moved) editProps(o.id, at(ev), true)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  // preview listeners (Rive): pointer enter/exit → `hover`, pointer down → `press`
  const previewProps = preview ? {
    onPointerMove: (e: React.PointerEvent) => {
      const over = !!(e.target as Element).closest('[data-id]')
      if (ui.getState().inputs.hover !== over) ui.setState((s) => ({ inputs: { ...s.inputs, hover: over } }))
    },
    onPointerLeave: () => ui.setState((s) => ({ inputs: { ...s.inputs, hover: false } })),
    onPointerDown: (e: React.PointerEvent) => {
      if (!(e.target as Element).closest('[data-id]')) return
      runtime.fire('press')
      ui.setState((s) => ({ fired: 'press', inputs: { ...s.inputs, turns: Number(s.inputs.turns ?? 0) + 3 } }))
    },
  } : {}

  return (
    <div className="h-full w-full" style={preview ? { cursor: 'pointer' } : undefined} {...previewProps}
      onPointerDown={preview ? previewProps.onPointerDown : (e) => { if ((e.target as Element).hasAttribute('data-bg')) ui.setState({ sel: null }) }}>
      <SceneSVG doc={doc} r={r} inputs={inputs} bg={[v.bgTop, v.bgBottom]} bare interactive={!preview} onObjectDown={onObjectDown} svgRef={svgRef} ghosts={ghosts} ghostOf={sel}>
        {!preview && <PenMarks doc={doc} r={r} />}
        <g data-overlay pointerEvents="none">
          <polygon ref={outline} fill="none" stroke="var(--signal)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" visibility="hidden" />
          <g ref={handles} visibility="hidden">
            {[0, 1, 2, 3].map((i) => <rect key={i} fill="#fff" stroke="var(--signal)" strokeWidth={1} vectorEffect="non-scaling-stroke" />)}
          </g>
        </g>
      </SceneSVG>
    </div>
  )
}
