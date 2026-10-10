/* ---------------------------------------------------------------------------
   The demo document — an engraved spinning wheel (Rueca's plate) with three
   animations and a state machine — and a Canvas 2D renderer used by PNG / MP4
   export. The stage uses the SVG renderer in SceneView.tsx; both read the same
   Resolved values.

   The artwork is two engraved parts made one by one in Midjourney and upscaled
   (public/demo/animate, ink on transparent at 2× density): the frame, with its
   own wheel cut away, and a face-on drive wheel that turns on the same axle. Old plate,
   new tool: the engraving is the "old", the keys, states and the Achiote
   thread are the "new".
--------------------------------------------------------------------------- */
import type { Anim, Doc, Ease, Key, Obj, PropKey, Resolved, Val } from './engine'
import { bindText, childrenOf } from './engine'

const B = import.meta.env.BASE_URL
export const ART = { frame: `${B}demo/animate/frame.webp`, wheel: `${B}demo/animate/wheel.webp` }
const NOGAL = '#181411', MUTED = '#6E6A64', ACHIOTE = '#E8582C'

const E = {
  lin: { kind: 'bezier', p: [0, 0, 1, 1] } as Ease,
  in: { kind: 'bezier', p: [0.42, 0, 1, 1] } as Ease,
  out: { kind: 'bezier', p: [0, 0, 0.58, 1] } as Ease,
  io: { kind: 'bezier', p: [0.42, 0, 0.58, 1] } as Ease,
  expo: { kind: 'bezier', p: [0.16, 1, 0.3, 1] } as Ease,
  spinUp: { kind: 'bezier', p: [0.5, 0, 0.18, 1] } as Ease, // gathers, then coasts
  hold: { kind: 'hold' } as Ease,
  spring: (duration: number, bounce: number): Ease => ({ kind: 'spring', duration, bounce }),
}

let n = 0
const k = (t: number, v: Val, ease: Ease = E.io): Key => ({ id: `d${n++}`, t, v, ease })

const obj = (id: string, name: string, kind: Obj['kind'], parent: string | null, base: Obj['base'], extra: Partial<Obj> = {}): Obj =>
  ({ id, name, kind, parent, visible: true, locked: false, base, ...extra })

/* the plate is 1056 × 704; the artboard runs on to the right so the thread has somewhere to go */
const WHEEL = { x: 307.3, y: 255 }, ORIFICE = { x: 955, y: 248 }, YARN = 190

export function demoDoc(): Doc {
  n = 0
  const objects: Obj[] = [
    obj('frame', 'Frame', 'image', null, { x: 528, y: 352, w: 1056, h: 704 }, { href: ART.frame, locked: true }),
    obj('wheel', 'Drive wheel', 'image', null, { x: WHEEL.x, y: WHEEL.y, w: 460.5, h: 460.5 }, { href: ART.wheel, spin: true }),
    obj('thread', 'Thread', 'group', null, { x: ORIFICE.x, y: ORIFICE.y, rotation: 14 }),
    obj('yarn', 'Yarn', 'rect', 'thread', { x: 0, w: 0, h: 2.5, radius: 1.25, fill: ACHIOTE }),
    obj('count', 'Count', 'text', null, { x: 1128, y: 318, fill: NOGAL, opacity: 0 }, { text: '{turns} turns', fontSize: 26, fontWeight: 600, align: 'middle' }),
    obj('caption', 'Caption', 'text', null, { x: 1128, y: 356, fill: MUTED, opacity: 0.55 }, { text: 'click to spin', fontSize: 17, fontWeight: 500, align: 'middle' }),
  ]

  // the yarn grows from the orifice: its centre rides at half its length
  const yarn = (t0: number, t1: number, ease: Ease) => ({
    'yarn.w': [k(0, 0, E.hold), k(t0, 0, ease), k(t1, YARN)],
    'yarn.x': [k(0, 0, E.hold), k(t0, 0, ease), k(t1, YARN / 2)],
  })

  const idle: Anim = {
    id: 'idle', name: 'Idle', duration: 9000, loop: 'loop', tracks: {
      'wheel.rotation': [k(0, 0, E.lin), k(9000, 360)],
      'caption.opacity': [k(0, 0.55), k(2250, 0.9), k(4500, 0.55), k(6750, 0.9), k(9000, 0.55)],
    },
  }
  const hover: Anim = {
    id: 'hover', name: 'Hover', duration: 2800, loop: 'loop', tracks: {
      'wheel.rotation': [k(0, 0, E.lin), k(2800, 360)],
      'caption.opacity': [k(0, 0.55, E.out), k(300, 1)],
    },
  }
  const press: Anim = {
    id: 'press', name: 'Spin up', duration: 2400, loop: 'loop', tracks: {
      'wheel.rotation': [k(0, 0, E.spinUp), k(1800, 1080)],
      'wheel.scale': [k(0, 1, E.in), k(90, 0.985, E.spring(500, 0.35)), k(560, 1)],
      ...yarn(240, 1300, E.expo),
      'count.opacity': [k(0, 0, E.hold), k(900, 0, E.out), k(1200, 1, E.hold), k(2050, 1, E.in), k(2400, 0)],
      'yarn.opacity': [k(0, 1, E.hold), k(2050, 1, E.in), k(2400, 0)],
      'count.y': [k(0, 318, E.hold), k(900, 330, E.spring(520, 0.45)), k(1400, 318)],
      'caption.opacity': [k(0, 1, E.out), k(400, 0.4, E.hold), k(2050, 0.4, E.io), k(2400, 1)],
    },
  }
  return {
    width: 1200, height: 704, objects, anims: [idle, hover, press],
    sm: {
      entry: 'idle',
      inputs: [
        { id: 'hover', name: 'hover', type: 'boolean', value: false },
        { id: 'press', name: 'press', type: 'trigger', value: false },
        { id: 'turns', name: 'turns', type: 'number', value: 27 },
      ],
      transitions: [
        { id: 't1', from: 'idle', to: 'hover', conds: [{ input: 'hover', op: 'is', value: true }], mix: 500 },
        { id: 't2', from: 'hover', to: 'idle', conds: [{ input: 'hover', op: 'is', value: false }], mix: 900 },
        { id: 't3', from: 'any', to: 'press', conds: [{ input: 'press', op: 'fired' }], mix: 80 },
        { id: 't4', from: 'press', to: 'hover', conds: [{ input: 'hover', op: 'is', value: true }], exit: true, mix: 160 },
        { id: 't5', from: 'press', to: 'idle', conds: [{ input: 'hover', op: 'is', value: false }], exit: true, mix: 400 },
      ],
    },
  }
}

/* ---------- images ---------- */
/** Decoded images for the canvas exporters, keyed by href. The SVG stage loads its own. */
const imgs = new Map<string, HTMLImageElement>()
export async function loadImages(doc: Doc) {
  await Promise.all(doc.objects.filter((o) => o.kind === 'image' && o.href).map(async (o) => {
    if (imgs.get(o.href!)?.complete) return
    const im = new Image()
    im.src = o.href!
    await im.decode()
    imgs.set(o.href!, im)
  }))
}
/** An SVG frame that opens anywhere: image hrefs become data URLs. */
export async function inlineImages(svg: SVGSVGElement) {
  await Promise.all(Array.from(svg.querySelectorAll('image')).map(async (el) => {
    const href = el.getAttribute('href')
    if (!href || href.startsWith('data:')) return
    const blob = await (await fetch(href)).blob()
    el.setAttribute('href', await new Promise<string>((ok) => { const fr = new FileReader(); fr.onload = () => ok(String(fr.result)); fr.readAsDataURL(blob) }))
  }))
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
  } else if (o.kind === 'image' && o.href) {
    const im = imgs.get(o.href), w = +p.w, h = +p.h
    if (im) ctx.drawImage(im, -w / 2, -h / 2, w, h)
  } else if (o.kind === 'text') {
    ctx.fillStyle = fill
    ctx.font = `${o.fontWeight ?? 500} ${o.fontSize ?? 16}px "Inter Variable", Inter, system-ui, sans-serif`
    ctx.textAlign = o.align === 'middle' ? 'center' : 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(bindText(o.text ?? '', doc.sm.inputs), 0, 0)
  }
}
