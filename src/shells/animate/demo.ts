/* ---------------------------------------------------------------------------
   The demo document (a like button with three animations and a state
   machine) and a Canvas 2D renderer used by PNG / MP4 export. The stage uses
   the SVG renderer in Scene.tsx; both read the same Resolved values.
--------------------------------------------------------------------------- */
import type { Anim, Doc, Ease, Key, Obj, PropKey, Resolved, Val } from './engine'
import { bindText, childrenOf } from './engine'
import { WIRE } from '@/demo/wire'

export const HEART = 'M0,15 C-7,9 -18,2 -18,-6 C-18,-12.5 -13.5,-16 -8.75,-16 C-4.75,-16 -1.6,-13.6 0,-10.4 C1.6,-13.6 4.75,-16 8.75,-16 C13.5,-16 18,-12.5 18,-6 C18,2 7,9 0,15 Z'

const E = {
  lin: { kind: 'bezier', p: [0, 0, 1, 1] } as Ease,
  in: { kind: 'bezier', p: [0.42, 0, 1, 1] } as Ease,
  out: { kind: 'bezier', p: [0, 0, 0.58, 1] } as Ease,
  io: { kind: 'bezier', p: [0.42, 0, 0.58, 1] } as Ease,
  expo: { kind: 'bezier', p: [0.16, 1, 0.3, 1] } as Ease,
  back: { kind: 'bezier', p: [0.34, 1.56, 0.64, 1] } as Ease,
  hold: { kind: 'hold' } as Ease,
  spring: (duration: number, bounce: number): Ease => ({ kind: 'spring', duration, bounce }),
}

let n = 0
const k = (t: number, v: Val, ease: Ease = E.io): Key => ({ id: `d${n++}`, t, v, ease })

const obj = (id: string, name: string, kind: Obj['kind'], parent: string | null, base: Obj['base'], extra: Partial<Obj> = {}): Obj =>
  ({ id, name, kind, parent, visible: true, locked: false, base, ...extra })

/* Drawn in the wire style (src/demo/wire.ts): a paper card with a hairline
   on a paper artboard, one ink. The like is shown by the heart going from faint
   to ink, not by colour. */
const SPARK = [WIRE.ink, WIRE.muted, WIRE.ink, WIRE.muted, WIRE.ink, WIRE.muted]

export function demoDoc(): Doc {
  n = 0
  const objects: Obj[] = [
    obj('caption', 'Caption', 'text', null, { x: 240, y: 296, fill: WIRE.muted, opacity: 0.55 }, { text: 'Tap to like', fontSize: 15, fontWeight: 500, align: 'middle' }),
    obj('button', 'Button', 'group', null, { x: 240, y: 184 }),
    obj('pill', 'Pill', 'rect', 'button', { w: 212, h: 80, radius: 40, fill: WIRE.card, stroke: WIRE.line, strokeWidth: 1 }),
    obj('burst', 'Burst', 'ellipse', 'button', { x: -58, w: 44, h: 44, fill: '#1C1A1900', stroke: WIRE.ink, strokeWidth: 2, scale: 0.2, opacity: 0 }),
    obj('sparkles', 'Sparkles', 'group', 'button', { x: -58, scale: 0.5, opacity: 0 }),
    ...SPARK.map((c, i) => {
      const a = (i / SPARK.length) * Math.PI * 2 - Math.PI / 2
      return obj(`s${i + 1}`, `Spark ${i + 1}`, 'ellipse', 'sparkles', { x: Math.round(Math.cos(a) * 40), y: Math.round(Math.sin(a) * 40), w: 6, h: 6, fill: c })
    }),
    obj('heart', 'Heart', 'path', 'button', { x: -58, y: 1, fill: WIRE.faint }, { d: HEART }),
    obj('label', 'Count', 'text', 'button', { x: -24, y: 2, fill: WIRE.ink }, { text: '{likes}', fontSize: 30, fontWeight: 650, align: 'start' }),
  ]

  const idle: Anim = {
    id: 'idle', name: 'Idle', duration: 2400, loop: 'loop', tracks: {
      'heart.scale': [k(0, 1), k(1200, 1.08), k(2400, 1)],
      'button.y': [k(0, 184), k(1200, 178), k(2400, 184)],
      'caption.opacity': [k(0, 0.55), k(1200, 0.85), k(2400, 0.55)],
      'button.scale': [k(0, 1)],
      'pill.fill': [k(0, WIRE.card)],
      'heart.rotation': [k(0, 0)],
    },
  }
  const hover: Anim = {
    id: 'hover', name: 'Hover', duration: 420, loop: 'once', tracks: {
      'button.scale': [k(0, 1, E.spring(380, 0.35)), k(420, 1.06)],
      'pill.fill': [k(0, WIRE.card, E.out), k(300, WIRE.sheet)],
      'heart.rotation': [k(0, 0, E.back), k(300, -10)],
    },
  }
  const press: Anim = {
    id: 'press', name: 'Press', duration: 1000, loop: 'once', tracks: {
      'button.scale': [k(0, 1, E.in), k(110, 0.93, E.spring(450, 0.4)), k(600, 1)],
      'heart.scale': [k(0, 1, E.in), k(110, 0.7, E.spring(520, 0.5)), k(720, 1)],
      'heart.fill': [k(0, WIRE.faint, E.hold), k(110, WIRE.ink)],
      'heart.rotation': [k(0, -10, E.out), k(300, 0)],
      'burst.scale': [k(0, 0.2, E.hold), k(110, 0.2, E.expo), k(560, 2.3)],
      'burst.opacity': [k(0, 0, E.hold), k(110, 1, E.in), k(560, 0)],
      'burst.strokeWidth': [k(110, 2.5, E.out), k(560, 0.5)],
      'sparkles.scale': [k(0, 0.5, E.hold), k(150, 0.5, E.expo), k(700, 1.9)],
      'sparkles.opacity': [k(0, 0, E.hold), k(150, 1, E.in), k(760, 0)],
      'sparkles.rotation': [k(150, 0, E.out), k(760, 28)],
      'label.y': [k(0, 2, E.hold), k(110, 2, E.out), k(260, -5, E.io), k(520, 2)],
    },
  }
  return {
    width: 480, height: 360, objects, anims: [idle, hover, press],
    sm: {
      entry: 'idle',
      inputs: [
        { id: 'hover', name: 'hover', type: 'boolean', value: false },
        { id: 'press', name: 'press', type: 'trigger', value: false },
        { id: 'likes', name: 'likes', type: 'number', value: 128 },
      ],
      transitions: [
        { id: 't1', from: 'idle', to: 'hover', conds: [{ input: 'hover', op: 'is', value: true }], mix: 120 },
        { id: 't2', from: 'hover', to: 'idle', conds: [{ input: 'hover', op: 'is', value: false }], mix: 220 },
        { id: 't3', from: 'any', to: 'press', conds: [{ input: 'press', op: 'fired' }], mix: 60 },
        { id: 't4', from: 'press', to: 'hover', conds: [{ input: 'hover', op: 'is', value: true }], exit: true, mix: 160 },
        { id: 't5', from: 'press', to: 'idle', conds: [{ input: 'hover', op: 'is', value: false }], exit: true, mix: 240 },
      ],
    },
  }
}

/* ---------- Canvas 2D renderer (export) ---------- */
export function drawCanvas(ctx: CanvasRenderingContext2D, doc: Doc, r: Resolved, bg: [string, string], w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, bg[0]); g.addColorStop(1, bg[1])
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  ctx.save()
  ctx.scale(w / doc.width, h / doc.height)
  const walk = (parent: string | null) => {
    for (const o of childrenOf(doc, parent)) {
      if (!o.visible) continue
      const p = r[o.id]
      ctx.save()
      ctx.translate(+p.x, +p.y)
      ctx.rotate((+p.rotation * Math.PI) / 180)
      ctx.scale(+p.scale, +p.scale)
      ctx.globalAlpha *= Math.max(0, Math.min(1, +p.opacity))
      shape(ctx, doc, o, p)
      walk(o.id)
      ctx.restore()
    }
  }
  walk(null)
  ctx.restore()
}

function shape(ctx: CanvasRenderingContext2D, doc: Doc, o: Obj, p: Record<PropKey, Val>) {
  const fill = String(p.fill)
  if (o.kind === 'rect') {
    const w = +p.w, h = +p.h, rad = Math.min(+p.radius, w / 2, h / 2)
    if (o.shadow) { ctx.shadowColor = 'rgba(20,10,60,0.35)'; ctx.shadowBlur = 28; ctx.shadowOffsetY = 12 }
    ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, rad)
    ctx.fillStyle = fill; ctx.fill()
    ctx.shadowColor = 'transparent'
    if (+p.strokeWidth > 0) { ctx.lineWidth = +p.strokeWidth; ctx.strokeStyle = String(p.stroke); ctx.stroke() }
  } else if (o.kind === 'ellipse') {
    ctx.beginPath(); ctx.ellipse(0, 0, Math.max(0, +p.w / 2), Math.max(0, +p.h / 2), 0, 0, Math.PI * 2)
    ctx.fillStyle = fill; ctx.fill()
    if (+p.strokeWidth > 0) { ctx.lineWidth = +p.strokeWidth; ctx.strokeStyle = String(p.stroke); ctx.stroke() }
  } else if (o.kind === 'path' && o.d) {
    ctx.fillStyle = fill; ctx.fill(new Path2D(o.d))
  } else if (o.kind === 'text') {
    ctx.fillStyle = fill
    ctx.font = `${o.fontWeight ?? 500} ${o.fontSize ?? 16}px "Inter Variable", Inter, system-ui, sans-serif`
    ctx.textAlign = o.align === 'middle' ? 'center' : 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(bindText(o.text ?? '', doc.sm.inputs), 0, 0)
  }
}
