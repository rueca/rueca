/* ---------------------------------------------------------------------------
   Design tab — Figma UI3 order: selection header · Position · Layout (size,
   auto layout) · Appearance · Fill · Stroke · Effects · Text · Export.
   Hand-built from the kit's Section / Row / ScrubValue so it matches the
   schema-driven inspector exactly; multi-selection shows "Mixed".
--------------------------------------------------------------------------- */
import { useState } from 'react'
import { Popover } from '@base-ui/react/popover'
import {
  AlignStartVertical, AlignCenterVertical, AlignEndVertical, AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal,
  ArrowRight, ArrowDown, Plus, Minus, Link2, Unlink2, Scan, SquareDashed, Sun, TextAlignStart, TextAlignCenter, TextAlignEnd,
  RotateCcw, ArrowDownToLine, Maximize2, Component, ImageDown, CodeXml, ChevronDown, Square, Type, Hash, Circle, Shapes, Combine, Columns3, Rows3, Group,
  PanelLeft, PanelTop,
} from 'lucide-react'
import { Section, Row, ScrubValue, Segmented, Select, Checkbox, IconButton, Button, Tip, Menu, ColorField, Badge, cn, type MenuItem } from '@kit'
import * as S from '../model/store'
import { common, numField, setAll, MIXED } from './fields'
import { EffectStack } from '@kit/ui/stack'
import { AlignGrid, QuadField, PaintField, CORNER_NAMES, type Quad } from '@kit/ui/layout-fields'
import { FONTS, wrapText } from '../model/layout'
import { imageURL, IMAGE_LABELS } from '../model/images'
import { solid, shadow } from '../model/factory'
import { locate } from '../model/tree'
import { exportSelection, copyCSS } from '../actions'
import { prefs } from '../model/prefs'
import { useValues } from '@kit'
import { uid, type Effect, type Node, type Paint, type Sizing, type Blend } from '../model/types'

const DEVICES = [
  { label: 'iPhone 15', w: 390, h: 844 }, { label: 'iPhone 15 Pro Max', w: 430, h: 932 }, { label: 'iPhone SE', w: 375, h: 667 },
  { label: 'Pixel 8', w: 412, h: 915 }, { label: 'iPad mini', w: 744, h: 1133 }, { label: 'Desktop', w: 1440, h: 1024 }, { label: 'Social card', w: 1200, h: 630 },
]
const WEIGHTS = [
  { value: '300', label: 'Light' }, { value: '400', label: 'Regular' }, { value: '500', label: 'Medium' }, { value: '600', label: 'Semibold' },
  { value: '650', label: 'Semibold+' }, { value: '700', label: 'Bold' }, { value: '800', label: 'Extra bold' },
]
const BLENDS: Blend[] = ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'luminosity']

export function typeIcon(n: Node) {
  if (n.component) return Component
  if (n.type === 'frame') return n.group ? Group : n.layout ? (n.layout.dir === 'row' ? Columns3 : Rows3) : Hash
  if (n.type === 'text') return Type
  if (n.type === 'ellipse') return Circle
  if (n.type === 'icon') return Shapes
  if (n.type === 'boolean') return Combine
  return Square
}
export const typeName = (n: Node) => (n.component ? 'Component' : n.type === 'frame' ? (n.group ? 'Group' : 'Frame') : n.type === 'rect' ? (n.fills.some((f) => f.kind === 'image') ? 'Image' : 'Rectangle') : n.type === 'boolean' ? `Boolean · ${n.bool}` : n.type[0].toUpperCase() + n.type.slice(1))

function useSections() {
  const [closed, setClosed] = useState<Record<string, boolean>>({})
  return (id: string) => ({ open: !closed[id], onToggle: () => setClosed((c) => ({ ...c, [id]: !c[id] })) })
}

export function DesignPanel() {
  S.useDesign((s) => s.doc)
  S.useDesign((s) => s.selection)
  const sec = useSections()
  const st = S.get()
  const nodes = S.selectedNodes(st)
  const L = S.layout(st)
  if (!nodes.length) return null
  const single = nodes.length === 1 ? nodes[0] : null
  const autoChild = nodes.every((n) => S.inAutoLayout(n.id, st))
  const anyAuto = nodes.some((n) => S.inAutoLayout(n.id, st))
  const parentBox = (n: Node) => { const p = locate(S.nodesOf(st), n.id)?.parent; return p ? L.get(p.id)! : { x: 0, y: 0, w: 0, h: 0 } }

  const X = numField('x', nodes, L, (n, b) => b.x - parentBox(n).x, (n, v, b) => ({ x: Math.round(n.x + (v - (b.x - parentBox(n).x))) }))
  const Y = numField('y', nodes, L, (n, b) => b.y - parentBox(n).y, (n, v, b) => ({ y: Math.round(n.y + (v - (b.y - parentBox(n).y))) }))
  const R = numField('rot', nodes, L, (n) => n.rotation, (_n, v) => ({ rotation: ((((v + 180) % 360) + 360) % 360) - 180 }))
  const resizeW = (n: Node, v: number): Partial<Node> => ({ w: Math.max(1, v), sizingW: 'fixed', ...(n.text?.resize === 'auto-width' ? { text: { ...n.text, resize: 'auto-height' as const } } : {}), ...(n.type === 'boolean' ? scaleKids(n, v / n.w, 1) : {}) })
  const resizeH = (n: Node, v: number): Partial<Node> => ({ h: Math.max(1, v), sizingH: 'fixed', ...(n.text ? { text: { ...n.text, resize: 'fixed' as const } } : {}), ...(n.type === 'boolean' ? scaleKids(n, 1, v / n.h) : {}) })
  const W = numField('w', nodes, L, (_n, b) => b.w, (n, v) => resizeW(n, v))
  const H = numField('h', nodes, L, (_n, b) => b.h, (n, v) => resizeH(n, v))
  const O = numField('opacity', nodes, L, (n) => Math.round(n.opacity * 100), (_n, v) => ({ opacity: Math.min(1, Math.max(0, v / 100)) }))

  return (
    <div className="flex flex-col">
      <Header nodes={nodes} />

      <Section title="Position" first {...sec('pos')}>
        <Row label="Alignment">
          <div className="flex w-full justify-between">
            {([['left', AlignStartVertical], ['hcenter', AlignCenterVertical], ['right', AlignEndVertical], ['top', AlignStartHorizontal], ['vcenter', AlignCenterHorizontal], ['bottom', AlignEndHorizontal]] as const).map(([k, I]) => (
              <IconButton key={k} icon={I} size="icon-sm" label={`Align ${k === 'hcenter' ? 'horizontal centres' : k === 'vcenter' ? 'vertical centres' : k}${single ? ' to parent' : ''}`} disabled={autoChild || (single !== null && !locate(S.nodesOf(st), single.id)?.parent)} onClick={() => S.align(k)} />
            ))}
          </div>
        </Row>
        <Row label="Position">
          <ScrubValue boxed align="left" prefix="X" label="X" {...X} disabled={autoChild} className="flex-1" />
          <ScrubValue boxed align="left" prefix="Y" label="Y" {...Y} disabled={autoChild} className="flex-1" />
        </Row>
        <Row label="Rotation">
          <ScrubValue boxed align="left" prefix="↻" label="Rotation" unit="°" step={0.1} {...R} className="flex-1" defaultValue={0} />
          <div className="flex flex-1 justify-end gap-0.5">
            <IconButton icon={RotateCcw} size="icon-sm" label="Rotate 90° left" onClick={() => setAll(nodes, (n) => ({ rotation: ((n.rotation + 90 + 180) % 360) - 180 }))} />
            <IconButton icon={ArrowDownToLine} size="icon-sm" label="Reset rotation" disabled={!nodes.some((n) => n.rotation)} onClick={() => setAll(nodes, () => ({ rotation: 0 }))} />
          </div>
        </Row>
      </Section>

      <Section title="Layout" {...sec('layout')}
        actions={single?.type === 'frame' && !single.layout ? <IconButton icon={Plus} size="icon-sm" label="Add auto layout" shortcut="shift+a" onClick={S.addAutoLayout} /> : single?.layout ? <IconButton icon={Minus} size="icon-sm" label="Remove auto layout" shortcut="shift+a" onClick={S.addAutoLayout} /> : undefined}>
        <SizeRow nodes={nodes} W={W} H={H} anyAuto={anyAuto} />
        {single?.layout && <AutoLayoutRows n={single} />}
        {nodes.every((n) => n.type === 'frame') && (
          <Row label="Clip content">
            <div className="flex flex-1 justify-end">
              <Checkbox checked={common(nodes, (n) => !!n.clip) === true} onChange={(b) => setAll(nodes, () => ({ clip: b }))} label="Clip content" />
            </div>
          </Row>
        )}
      </Section>

      <Section title="Appearance" {...sec('appearance')}>
        <Row label="Opacity">
          <ScrubValue boxed align="left" prefix={<Sun size={10} strokeWidth={1.75} />} unit="%" min={0} max={100} label="Opacity" {...O} className="flex-1" defaultValue={100} />
          <div className="flex-1">
            <Select value={blendOf(nodes)} placeholder="Mixed" label="Blend mode"
              onChange={(b) => setAll(nodes, () => ({ blend: b as Blend }))} options={BLENDS.map((b) => ({ value: b, label: b === 'color-dodge' ? 'Colour dodge' : b[0].toUpperCase() + b.slice(1) }))} />
          </div>
        </Row>
        {nodes.every((n) => n.type === 'rect' || n.type === 'frame') && <RadiusRow nodes={nodes} />}
      </Section>

      <PaintSection title="Fill" nodes={nodes} prop="fills" open={sec('fill')} />
      <PaintSection title="Stroke" nodes={nodes} prop="strokes" open={sec('stroke')} />
      <EffectsSection nodes={nodes} open={sec('fx')} />
      {nodes.every((n) => n.type === 'text') && <TextSection nodes={nodes} open={sec('text')} />}
      {nodes.every((n) => n.type === 'icon') && <IconSection nodes={nodes} open={sec('icon')} />}
      <ExportSection open={sec('export')} />
    </div>
  )
}

function blendOf(nodes: Node[]) { const b = common(nodes, (n) => n.blend); return b === MIXED ? '' : b }

function scaleKids(n: Node, kx: number, ky: number): Partial<Node> {
  return { children: n.children?.map((c) => ({ ...c, x: c.x * kx, y: c.y * ky, w: c.w * kx, h: c.h * ky })) }
}

/* --- header ---------------------------------------------------------------- */
function Header({ nodes }: { nodes: Node[] }) {
  const single = nodes.length === 1 ? nodes[0] : null
  const Icon = single ? typeIcon(single) : Shapes
  const isTop = single && !locate(S.nodesOf(), single.id)?.parent && single.type === 'frame'
  return (
    <div className="flex h-10 items-center gap-2 border-b border-line px-3">
      <Icon size={14} strokeWidth={1.5} className={single?.component ? 'text-signal' : 'text-fg-faint'} />
      <span className="min-w-0 flex-1 truncate text-[12px] font-medium">{single ? typeName(single) : `${nodes.length} layers`}</span>
      {single?.component && <Badge tone="accent">Main</Badge>}
      {isTop && (
        <Menu align="end" trigger={<Button size="sm" variant="ghost" className="gap-1">Presets<ChevronDown size={11} /></Button>}
          items={[{ type: 'label', label: 'Frame size' }, ...DEVICES.map((d) => ({ label: `${d.label}  ·  ${d.w} × ${d.h}`, checked: single!.w === d.w && single!.h === d.h, onClick: () => S.patchNode(single!.id, { w: d.w, h: d.h, sizingW: 'fixed', sizingH: 'fixed' }) }))]} />
      )}
    </div>
  )
}

/* --- size + sizing mode ----------------------------------------------------- */
type NF = ReturnType<typeof numField>
function SizeRow({ nodes, W, H, anyAuto }: { nodes: Node[]; W: NF; H: NF; anyAuto: boolean }) {
  const [lock, setLock] = useState(false)
  const hasLayout = nodes.some((n) => n.layout || n.type === 'text')
  const sizingW = common(nodes, (n) => n.sizingW)
  const sizingH = common(nodes, (n) => n.sizingH)
  const canFill = anyAuto
  const sizingMenu = (axis: 'w' | 'h', cur: Sizing | typeof MIXED): MenuItem[] => [
    { type: 'label', label: axis === 'w' ? 'Horizontal resizing' : 'Vertical resizing' },
    { label: 'Fixed', checked: cur === 'fixed', icon: Scan, onClick: () => setAll(nodes, (n) => { const b = S.layout().get(n.id)!; return axis === 'w' ? { sizingW: 'fixed', w: Math.round(b.w), ...(n.text?.resize === 'auto-width' ? { text: { ...n.text, resize: 'auto-height' as const } } : {}) } : { sizingH: 'fixed', h: Math.round(b.h), ...(n.text ? { text: { ...n.text, resize: 'fixed' as const } } : {}) } }) },
    { label: 'Hug contents', checked: cur === 'hug', icon: SquareDashed, disabled: !hasLayout, onClick: () => setAll(nodes, (n) => (n.layout || n.text ? (axis === 'w' ? { sizingW: 'hug', ...(n.text ? { text: { ...n.text, resize: 'auto-width' as const } } : {}) } : { sizingH: 'hug', ...(n.text ? { text: { ...n.text, resize: n.text.resize === 'auto-width' ? 'auto-width' as const : 'auto-height' as const } } : {}) }) : {})) },
    { label: 'Fill container', checked: cur === 'fill', icon: Maximize2, disabled: !canFill, onClick: () => setAll(nodes, (n) => (axis === 'w' ? { sizingW: 'fill', ...(n.text?.resize === 'auto-width' ? { text: { ...n.text, resize: 'auto-height' as const } } : {}) } : { sizingH: 'fill', ...(n.text ? { text: { ...n.text, resize: 'fixed' as const } } : {}) })) },
  ]
  const tag = (s: Sizing | typeof MIXED) => (s === 'hug' ? 'Hug' : s === 'fill' ? 'Fill' : null)
  const field = (axis: 'w' | 'h', f: NF, s: Sizing | typeof MIXED) => (
    <div className="relative flex min-w-0 flex-1">
      <ScrubValue boxed align="left" prefix={axis === 'w' ? 'W' : 'H'} label={axis === 'w' ? 'Width' : 'Height'} min={1} max={10000} {...f}
        onChange={(v, fin) => {
          if (lock && !f.mixed && nodes.length === 1) {
            const n = nodes[0], b = S.layout().get(n.id)!
            const ratio = b.w / Math.max(1, b.h)
            setAll(nodes, (cur) => (axis === 'w' ? { w: Math.max(1, v), h: Math.max(1, Math.round(v / ratio)), sizingW: 'fixed', sizingH: 'fixed', ...(cur.text ? { text: { ...cur.text, resize: 'fixed' as const } } : {}) } : { h: Math.max(1, v), w: Math.max(1, Math.round(v * ratio)), sizingW: 'fixed', sizingH: 'fixed', ...(cur.text ? { text: { ...cur.text, resize: 'fixed' as const } } : {}) }), fin)
          } else f.onChange(v, fin)
        }}
        fmt={tag(s) ? () => tag(s)! : undefined} className="flex-1 pr-5" />
      <Menu align="end" items={sizingMenu(axis, s)} trigger={
        <button type="button" aria-label={`${axis === 'w' ? 'Horizontal' : 'Vertical'} resizing`} className="absolute top-0 right-0 flex h-6 w-5 items-center justify-center rounded-r-[5px] text-fg-faint outline-none hover:text-fg focus-visible:ring-2 focus-visible:ring-signal">
          <ChevronDown size={11} strokeWidth={1.75} />
        </button>} />
    </div>
  )
  return (
    <Row>
      {field('w', W, sizingW)}
      {field('h', H, sizingH)}
      <Tip label={lock ? 'Unlock aspect ratio' : 'Lock aspect ratio'}>
        <button type="button" aria-pressed={lock} onClick={() => setLock(!lock)}
          className={cn('flex size-6 shrink-0 items-center justify-center rounded-[5px] outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-signal', lock ? 'text-signal' : 'text-fg-faint')}>
          {lock ? <Link2 size={13} strokeWidth={1.5} /> : <Unlink2 size={13} strokeWidth={1.5} />}
        </button>
      </Tip>
    </Row>
  )
}

/* --- auto layout -------------------------------------------------------------- */
function AutoLayoutRows({ n }: { n: Node }) {
  const L = n.layout!
  const set = (patch: Partial<typeof L>, final = true) => S.patchNode(n.id, (x) => ({ layout: { ...x.layout!, ...patch } }), { commit: final })
  return (
    <>
      <Row label="Direction">
        <div className="w-[92px]">
          <Segmented size="sm" iconOnly value={L.dir} onChange={(d) => set({ dir: d as 'row' | 'column' })} label="Direction"
            options={[{ value: 'row', label: 'Horizontal', icon: ArrowRight, hint: 'Horizontal' }, { value: 'column', label: 'Vertical', icon: ArrowDown, hint: 'Vertical' }]} />
        </div>
        <div className="flex flex-1 justify-end">
          <Tip label="Space between (Auto gap)">
            <Button size="sm" variant={L.between ? 'default' : 'ghost'} active={!!L.between} onClick={() => set({ between: !L.between })}>Auto gap</Button>
          </Tip>
        </div>
      </Row>
      <div className="flex gap-2 px-3 py-1">
        <AlignGrid x={L.alignX} y={L.alignY} dir={L.dir} between={L.between} onChange={(x, y) => set({ alignX: x, alignY: y })} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <ScrubValue boxed align="left" prefix={L.dir === 'row' ? <PanelLeft size={10} strokeWidth={1.75} className="rotate-90" /> : <PanelTop size={10} strokeWidth={1.75} />} label="Gap"
            value={L.gap} min={0} max={400} mixed={L.between} fmt={L.between ? () => 'Auto' : undefined} onChange={(v, f) => set({ gap: v, between: false }, f)} className="w-full" />
          <div className="text-[10.5px] leading-tight text-fg-faint">Gap between items{L.between ? ' — distributed' : ''}</div>
        </div>
      </div>
      <Row label="Padding">
        <QuadField mode="pairs" value={L.pad} onChange={(v, f) => set({ pad: v }, f)} max={400}
          prefix={[<span key="h" className="text-[9px]">↔</span>, <span key="v" className="text-[9px]">↕</span>]} labels={['T', 'R', 'B', 'L']} />
      </Row>
    </>
  )
}

function RadiusRow({ nodes }: { nodes: Node[] }) {
  const r = common(nodes, (n) => n.radius)
  const value = r === MIXED ? nodes[0].radius : r
  return (
    <Row label="Radius">
      <QuadField mode="single" value={value as Quad} mixed={r === MIXED} max={999}
        onChange={(v, f) => setAll(nodes, () => ({ radius: v }), f)}
        prefix={<span className="text-[10px]">◜</span>} labels={['↖', '↗', '↘', '↙']} names={CORNER_NAMES} />
    </Row>
  )
}

/* --- fills / strokes ------------------------------------------------------------ */
const strip = (ps: Paint[]) => ps.map(({ id: _id, ...rest }) => rest)
const PAINT_NAME: Record<Paint['kind'], string> = { solid: 'Solid', linear: 'Linear gradient', radial: 'Radial gradient', image: 'Image' }

function PaintSection({ title, nodes, prop, open }: { title: string; nodes: Node[]; prop: 'fills' | 'strokes'; open: { open: boolean; onToggle: () => void } }) {
  const paints = common(nodes, (n) => strip(n[prop]))
  const mixed = paints === MIXED
  const list = mixed ? [] : nodes[0][prop]
  const set = (next: Paint[], final: boolean) => setAll(nodes, () => ({ [prop]: next.map((p) => ({ ...p })) }) as Partial<Node>, final)
  const add = () => {
    const base = mixed ? [] : list
    const color = prop === 'strokes' ? '#000000' : base.length ? '#ffffff' : nodes[0].type === 'text' ? '#000000' : '#d9d9d9'
    set([...base, solid(color, prop === 'fills' && base.length ? 0.4 : 1)], true)
  }
  const strokeWidth = numField('stroke-w', nodes, S.layout(), (n) => n.strokeWidth, (_n, v) => ({ strokeWidth: Math.max(0, v) }))
  const align = common(nodes, (n) => n.strokeAlign)
  return (
    <Section title={title} {...open} actions={<IconButton icon={Plus} size="icon-sm" label={`Add ${title.toLowerCase()}`} onClick={add} />}>
      {/* kit stack in paint order (top layer first on screen); its opacity field is the paint's opacity */}
      <EffectStack order="bottom-first" label={`${title}s`} removeIcon="minus" contextMenu={false}
        items={list.map((p) => ({ ...p, name: PAINT_NAME[p.kind] }))} mixed={mixed} mixedHint={`Mixed ${title.toLowerCase()}s — click + to replace`}
        onChange={(next, f) => set(next.map(({ name: _n, ...p }) => p), f)}
        renderRow={(p, { set: upd }) => <PaintField value={p} opacity={false} onChange={(np, f) => upd(np, f)} images={IMAGE_LABELS} imageURL={imageURL} label={title} />} />
      {prop === 'strokes' && list.length > 0 && (
        <Row label="Weight">
          <ScrubValue boxed align="left" prefix="≡" label="Stroke weight" min={0} max={200} step={0.5} {...strokeWidth} className="flex-1" />
          <div className="flex-1">
            <Select value={align === MIXED ? '' : align} placeholder="Mixed" label="Stroke position" onChange={(a) => setAll(nodes, () => ({ strokeAlign: a as Node['strokeAlign'] }))}
              options={[{ value: 'inside', label: 'Inside' }, { value: 'center', label: 'Center' }, { value: 'outside', label: 'Outside' }]} />
          </div>
        </Row>
      )}
    </Section>
  )
}

/* --- effects --------------------------------------------------------------------- */
const FX_LABEL: Record<Effect['kind'], string> = { 'drop-shadow': 'Drop shadow', 'inner-shadow': 'Inner shadow', 'layer-blur': 'Layer blur', 'background-blur': 'Background blur' }

function EffectsSection({ nodes, open }: { nodes: Node[]; open: { open: boolean; onToggle: () => void } }) {
  const fx = common(nodes, (n) => n.effects.map(({ id: _id, ...r }) => r))
  const mixed = fx === MIXED
  const list = mixed ? [] : nodes[0].effects
  const set = (next: Effect[], final: boolean) => setAll(nodes, () => ({ effects: next.map((e) => ({ ...e })) }), final)
  const add = (kind: Effect['kind']) => set([...list, kind.includes('shadow') ? { ...shadow(4, 12, 0.15), kind } : { id: uid('e'), kind, visible: true, x: 0, y: 0, blur: 8, spread: 0, color: '#000000', opacity: 1 }], true)
  return (
    <Section title="Effects" {...open}
      actions={<Menu align="end" trigger={<IconButton icon={Plus} size="icon-sm" label="Add effect" />} items={(Object.keys(FX_LABEL) as Effect['kind'][]).map((k) => ({ label: FX_LABEL[k], onClick: () => add(k) }))} />}>
      {/* an effect's `opacity` is its shadow colour's (edited in the popover) — carried as `alpha` so the stack shows no opacity field */}
      <EffectStack order="bottom-first" label="Effects" removeIcon="minus" contextMenu={false}
        items={list.map(({ opacity, ...e }) => ({ ...e, alpha: opacity, name: FX_LABEL[e.kind] }))} mixed={mixed} mixedHint="Mixed effects — click + to replace"
        onChange={(next, f) => set(next.map(({ name: _n, alpha, ...e }) => ({ ...e, opacity: alpha })), f)}
        renderRow={(e, { set: upd }) => (
          <>
            <Popover.Root>
              <Tip label="Effect settings">
                <Popover.Trigger aria-label="Effect settings" className="flex size-6 shrink-0 items-center justify-center rounded-[5px] bg-control text-fg-muted outline-none hover:text-fg data-[popup-open]:shadow-[inset_0_0_0_1px_var(--signal)] focus-visible:ring-2 focus-visible:ring-signal">
                  <Sun size={13} strokeWidth={1.5} />
                </Popover.Trigger>
              </Tip>
              <Popover.Portal>
                <Popover.Positioner side="left" align="start" sideOffset={12} collisionPadding={12} className="z-[100]">
                  <Popover.Popup className="pop w-[240px] p-1 outline-none">
                    <div className="px-2 pt-1.5 pb-1 text-[11.5px] font-medium">{FX_LABEL[e.kind]}</div>
                    {e.kind.includes('shadow') && (
                      <>
                        <Row label="Offset">
                          <ScrubValue boxed align="left" prefix="X" value={e.x} min={-200} max={200} onChange={(v, f) => upd({ x: v }, f)} className="flex-1" label="Offset X" />
                          <ScrubValue boxed align="left" prefix="Y" value={e.y} min={-200} max={200} onChange={(v, f) => upd({ y: v }, f)} className="flex-1" label="Offset Y" />
                        </Row>
                        <Row label="Spread"><ScrubValue boxed align="left" value={e.spread} min={-100} max={100} onChange={(v, f) => upd({ spread: v }, f)} className="flex-1" label="Spread" /></Row>
                      </>
                    )}
                    <Row label="Blur"><ScrubValue boxed align="left" value={e.blur} min={0} max={250} onChange={(v, f) => upd({ blur: v }, f)} className="flex-1" label="Blur" /></Row>
                    {e.kind.includes('shadow') && (
                      <Row label="Colour">
                        <ColorField value={e.color} alpha={false} onChange={(c, f) => upd({ color: c.slice(0, 7) }, f)} />
                        <ScrubValue boxed value={Math.round(e.alpha * 100)} min={0} max={100} unit="%" onChange={(v, f) => upd({ alpha: v / 100 }, f)} className="w-[50px] shrink-0" label="Shadow opacity" />
                      </Row>
                    )}
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
            <div className="min-w-0 flex-1">
              <Select value={e.kind} label="Effect type" onChange={(k) => upd({ kind: k as Effect['kind'] })} options={(Object.keys(FX_LABEL) as Effect['kind'][]).map((k) => ({ value: k, label: FX_LABEL[k] }))} />
            </div>
          </>
        )} />
    </Section>
  )
}

/* --- text ------------------------------------------------------------------------ */
function TextSection({ nodes, open }: { nodes: Node[]; open: { open: boolean; onToggle: () => void } }) {
  const L = S.layout()
  const t = (k: keyof NonNullable<Node['text']>) => common(nodes, (n) => n.text![k])
  const setT = (patch: Partial<NonNullable<Node['text']>>, final = true) => setAll(nodes, (n) => ({ text: { ...n.text!, ...patch } }), final)
  const num = (key: 'size' | 'lineHeight' | 'letterSpacing', clampMin: number) => numField(`t-${key}`, nodes, L, (n) => n.text![key], (n, v) => ({ text: { ...n.text!, [key]: Math.max(clampMin, v) } }))
  const size = num('size', 1), lh = num('lineHeight', 0), ls = num('letterSpacing', -50)
  const family = t('family'), weight = t('weight'), align = t('align'), resize = t('resize')
  return (
    <Section title="Typography" {...open}>
      <Row label="Font">
        <Select value={family === MIXED ? '' : String(family)} placeholder="Mixed" label="Font family" onChange={(f) => setT({ family: f })}
          options={FONTS.map((f) => ({ value: f.value, label: f.label }))} />
      </Row>
      <Row label="Weight">
        <div className="flex-1"><Select value={weight === MIXED ? '' : String(weight)} placeholder="Mixed" label="Font weight" onChange={(w) => setT({ weight: Number(w) })} options={WEIGHTS} /></div>
        <ScrubValue boxed align="left" prefix={<Type size={10} strokeWidth={1.75} />} label="Font size" min={1} max={400} {...size} className="w-[64px] shrink-0" />
      </Row>
      <Row label="Spacing">
        <Tip label="Line height (0 = auto)"><div className="flex min-w-0 flex-1"><ScrubValue boxed align="left" prefix="↕" label="Line height" min={0} max={400} {...lh} fmt={(v) => (v ? String(Math.round(v)) : 'Auto')} className="flex-1" /></div></Tip>
        <Tip label="Letter spacing"><div className="flex min-w-0 flex-1"><ScrubValue boxed align="left" prefix="↔" label="Letter spacing" unit="%" step={0.5} min={-50} max={100} {...ls} className="flex-1" /></div></Tip>
      </Row>
      <Row label="Align">
        <div className="w-[96px]">
          <Segmented size="sm" iconOnly value={align === MIXED ? '' : String(align)} onChange={(a) => setT({ align: a as 'left' })} label="Text align"
            options={[{ value: 'left', label: 'Left', icon: TextAlignStart }, { value: 'center', label: 'Centre', icon: TextAlignCenter }, { value: 'right', label: 'Right', icon: TextAlignEnd }]} />
        </div>
        <div className="min-w-0 flex-1">
          <Select value={resize === MIXED ? '' : String(resize)} placeholder="Mixed" label="Text resizing" onChange={(r) => setAll(nodes, (n) => {
            const b = L.get(n.id)!
            const text = { ...n.text!, resize: r as 'fixed' }
            if (r === 'auto-width') return { text, sizingW: 'hug' as const, sizingH: 'hug' as const }
            if (r === 'auto-height') return { text, w: Math.round(b.w), sizingW: n.sizingW === 'fill' ? 'fill' as const : 'fixed' as const, sizingH: 'hug' as const }
            return { text, w: Math.round(b.w), h: Math.round(b.h), sizingW: 'fixed' as const, sizingH: 'fixed' as const }
          })} options={[{ value: 'auto-width', label: 'Auto width' }, { value: 'auto-height', label: 'Auto height' }, { value: 'fixed', label: 'Fixed size' }]} />
        </div>
      </Row>
      {nodes.length === 1 && (
        <div className="px-3 pt-1 text-[10.5px] text-fg-faint tabular">
          {nodes[0].text!.content.length} characters · {wrapText(nodes[0].text!, nodes[0].text!.resize === 'auto-width' ? Infinity : L.get(nodes[0].id)?.w ?? 100).lines.length} lines
        </div>
      )}
    </Section>
  )
}

function IconSection({ nodes, open }: { nodes: Node[]; open: { open: boolean; onToggle: () => void } }) {
  const st = numField('icon-stroke', nodes, S.layout(), (n) => n.icon!.stroke, (n, v) => ({ icon: { ...n.icon!, stroke: Math.max(0.25, v) } }))
  return (
    <Section title="Icon" {...open}>
      <Row label="Stroke"><ScrubValue boxed align="left" prefix="≡" label="Icon stroke" step={0.25} min={0.25} max={4} {...st} className="flex-1" /></Row>
    </Section>
  )
}

/* --- export ---------------------------------------------------------------------- */
function ExportSection({ open }: { open: { open: boolean; onToggle: () => void } }) {
  const v = useValues(prefs)
  return (
    <Section title="Export" {...open}>
      <Row label="Settings">
        <div className="flex-1"><Select value={v.exportScale} label="Export scale" onChange={(s) => prefs.patch({ exportScale: s, exportSuffix: s === '1' ? '' : `@${s}x` })} options={[{ value: '1', label: '1×' }, { value: '2', label: '2×' }, { value: '3', label: '3×' }, { value: '4', label: '4×' }]} /></div>
        <div className="flex-1"><Select value={v.exportFormat} label="Export format" onChange={(f) => prefs.setValue('exportFormat', f)} options={[{ value: 'png', label: 'PNG' }, { value: 'jpg', label: 'JPG' }, { value: 'webp', label: 'WebP' }]} /></div>
      </Row>
      <div className="flex gap-1.5 px-3 pt-1">
        <Button variant="default" size="md" className="flex-1" onClick={exportSelection}><ImageDown size={14} strokeWidth={1.5} />Export</Button>
        <Button variant="default" size="md" className="flex-1" onClick={copyCSS}><CodeXml size={14} strokeWidth={1.5} />Copy CSS</Button>
      </div>
    </Section>
  )
}

