/* ---------------------------------------------------------------------------
   Canvas gestures: select, move (snap, reparent, auto-layout reorder, ⌥-drag
   duplicate), resize (8 handles, ⇧ aspect, ⌥ from centre), rotate, draw
   (frame / rect / ellipse / text), marquee, hand-pan and comment drop.

   Every gesture edits with { commit: false } while the pointer moves and
   commits ONE undo step on release. Window listeners, so a drag that leaves
   the stage keeps tracking.
--------------------------------------------------------------------------- */
import { camera, toWorld } from './camera'
import { hitPath, containerAt, pickTarget } from './hit'
import { snapRect, snapEdges, type SRect } from '@kit/stage/snap'
import { resizeRect, rotateDelta, type Handle } from '@kit/stage/TransformBox'
import * as S from '../model/store'
import { prefs } from '../model/prefs'
import { find, ancestors, locate, remove, insert, topMost, update } from '../model/tree'
import { union, contains, intersects, sizeOf } from '../model/layout'
import { frame, rect, ellipse, text } from '../model/factory'
import { uid, type Box, type Node } from '../model/types'

const LABEL_H = 22

function track(onMove: (e: PointerEvent) => void, onUp: (e: PointerEvent) => void) {
  const move = (e: PointerEvent) => onMove(e)
  const up = (e: PointerEvent) => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); onUp(e) }
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up)
  window.addEventListener('pointercancel', up)
}

const threshold = () => prefs.values().snapDistance / camera.getState().zoom
const px = (v: number) => (prefs.values().snapPixels ? Math.round(v) : Math.round(v * 100) / 100)

/** top-level frame whose name label is under the point */
function labelHit(x: number, y: number): Node | null {
  const z = camera.getState().zoom
  const L = S.layout()
  for (const n of [...S.nodesOf()].reverse()) {
    if (n.type !== 'frame' || !n.visible) continue
    const b = L.get(n.id)!
    const w = Math.max(60, n.name.length * 6.6 + 70) / z
    if (x >= b.x && x <= b.x + w && y >= b.y - LABEL_H / z && y <= b.y) return n
  }
  return null
}

function snapTargets(parentId: string | null, exclude: Set<string>): SRect[] {
  const L = S.layout()
  const sibs = parentId ? find(S.nodesOf(), parentId)?.children ?? [] : S.nodesOf()
  const out = sibs.filter((n) => n.visible && !exclude.has(n.id)).map((n) => L.get(n.id)!).filter(Boolean)
  if (parentId) out.push(L.get(parentId)!)
  return out
}

/* --- entry point --------------------------------------------------------------- */
export function onCanvasPointerDown(e: React.PointerEvent) {
  if (e.button !== 0) return
  ;(document.activeElement as HTMLElement | null)?.blur?.()
  const s = S.get()
  if (s.editing) { S.design.setState({ editing: null }); return }
  const p = toWorld(e.clientX, e.clientY)
  if (s.openComment) S.design.setState({ openComment: null })
  if (s.tool === 'hand') return pan(e)
  if (s.tool === 'comment') return dropComment(p)
  if (s.tool !== 'move') return draw(e, p)

  const label = labelHit(p.x, p.y)
  if (label) {
    if (e.shiftKey) S.select(s.selection.includes(label.id) ? s.selection.filter((x) => x !== label.id) : [...s.selection, label.id])
    else if (!s.selection.includes(label.id)) S.select([label.id])
    return move(e, p)
  }
  const L = S.layout()
  const path = hitPath(S.nodesOf(), L, p.x, p.y)
  const target = path ? pickTarget(S.nodesOf(), path, s.selection, e.metaKey || e.ctrlKey) : null
  if (!target) {
    if (!e.shiftKey) S.select([])
    return marquee(e, p)
  }
  if (e.shiftKey) {
    S.select(s.selection.includes(target.id) ? s.selection.filter((x) => x !== target.id) : [...s.selection, target.id])
    if (!S.get().selection.includes(target.id)) return
  } else if (!s.selection.includes(target.id)) S.select([target.id])
  // clicking (not dragging) one item of a multi-selection narrows to it on release
  move(e, p, !e.shiftKey && s.selection.length > 1 && s.selection.includes(target.id) ? target.id : undefined)
}

export function onCanvasDoubleClick(e: React.MouseEvent) {
  const s = S.get()
  if (s.tool !== 'move') return
  const p = toWorld(e.clientX, e.clientY)
  const L = S.layout()
  const path = hitPath(S.nodesOf(), L, p.x, p.y)
  if (!path) return
  const sel = s.selection[0]
  const deepest = path.at(-1)!
  if (deepest.type === 'text' && (sel === deepest.id || locate(S.nodesOf(), deepest.id)?.parent?.id === locate(S.nodesOf(), sel ?? '')?.parent?.id)) {
    S.select([deepest.id]); S.design.setState({ editing: deepest.id }); return
  }
  const i = path.findIndex((n) => n.id === sel)
  const next = i >= 0 ? path[i + 1] : pickTarget(S.nodesOf(), path, s.selection, false)
  if (!next) return
  S.select([next.id])
  if (next.type === 'text' && next.id === deepest.id) S.design.setState({ editing: next.id })
}

/** hover highlight + ⌥ measurement target */
export function onCanvasHover(e: React.PointerEvent) {
  const s = S.get()
  if (s.gesture || s.tool !== 'move') { if (s.hover) S.setHover(null); return }
  const p = toWorld(e.clientX, e.clientY)
  const label = labelHit(p.x, p.y)
  if (label) return S.setHover(label.id)
  const path = hitPath(S.nodesOf(), S.layout(), p.x, p.y)
  if (!path) return S.setHover(null)
  const t = s.measuring ? path.at(-1)! : pickTarget(S.nodesOf(), path, s.selection, e.metaKey || e.ctrlKey)
  S.setHover(t?.id ?? null)
}

/* --- move ------------------------------------------------------------------- */
function move(e: React.PointerEvent, p0: { x: number; y: number }, narrowTo?: string) {
  const sx = e.clientX, sy = e.clientY
  let started = false
  let dup = e.altKey
  let ids: string[] = []
  let orig: { id: string; abs: Box }[] = []
  let bb: Box | null = null
  let parentId: string | null = null
  let single: Node | null = null
  let canReparent = false
  let origParent: string | null = null

  const begin = () => {
    if (dup) { S.duplicateSelection(0, true); dup = false }
    const s = S.get()
    const L = S.layout()
    ids = topMost(S.nodesOf(), s.selection).filter((id) => !find(S.nodesOf(), id)?.locked)
    orig = ids.map((id) => ({ id, abs: { ...L.get(id)! } })).filter((o) => o.abs)
    bb = union(orig.map((o) => o.abs))
    parentId = ids.length ? S.parentOf(ids[0])?.id ?? null : null
    single = ids.length === 1 ? find(S.nodesOf(), ids[0])! : null
    canReparent = !!single && !(parentId === null && single.type === 'frame')
    origParent = parentId
    S.design.setState({ gesture: 'move', hover: null })
  }

  track((ev) => {
    if (!started) {
      if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 3) return
      started = true
      begin()
      if (!ids.length || !bb) return
    }
    if (!ids.length || !bb) return
    const p = toWorld(ev.clientX, ev.clientY)
    let dx = p.x - p0.x, dy = p.y - p0.y
    if (ev.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0 }

    // reparent into the frame under the pointer (single selection)
    if (canReparent && single) {
      const L = S.layout()
      const cur = S.parentOf(single.id)?.id ?? null
      const curNode = cur ? find(S.nodesOf(), cur) : null
      // inside its auto-layout parent a drag reorders; it only leaves when the pointer leaves the parent
      const stay = curNode?.layout && contains(L.get(curNode.id)!, p.x, p.y)
      const target = stay ? curNode : containerAt(S.nodesOf(), L, p.x, p.y, single.id)
      const targetId = target?.id ?? null
      if (targetId !== cur && !(targetId && ancestors(S.nodesOf(), targetId).some((a) => a.id === single!.id))) {
        const abs = { x: orig[0].abs.x + dx, y: orig[0].abs.y + dy }
        S.setNodes((ns) => S.reparent(ns, single!.id, targetId, undefined, abs), { commit: false })
        parentId = targetId
      }
      S.design.setState({ dropTarget: targetId !== origParent ? targetId : null })
      const parent = parentId ? find(S.nodesOf(), parentId) : null
      if (parent?.layout) return reorderInLayout(parent, single.id, p)
      S.design.setState({ insertion: null })
    }

    let cand = { x: bb.x + dx, y: bb.y + dy, w: bb.w, h: bb.h }
    let guides: S.Guide[] = []
    if (prefs.values().snapObjects && !ev.metaKey) {
      const r = snapRect(cand, snapTargets(parentId, new Set(ids)), threshold(), { x: !(ev.shiftKey && dx === 0), y: !(ev.shiftKey && dy === 0) })
      dx += r.dx; dy += r.dy; guides = r.guides
      cand = { ...cand, x: bb.x + dx, y: bb.y + dy }
    }
    const L = S.layout()
    S.setNodes((ns) => {
      let out = ns
      for (const o of orig) {
        const pid = locate(out, o.id)?.parent
        if (pid?.layout) continue
        const pb = pid ? L.get(pid.id) ?? { x: 0, y: 0 } : { x: 0, y: 0 }
        out = update(out, o.id, (n) => ({ ...n, x: px(o.abs.x + dx - pb.x), y: px(o.abs.y + dy - pb.y) }))
      }
      return out
    }, { commit: false })
    S.design.setState({ guides })
  }, () => {
    S.design.setState({ gesture: null, guides: [], insertion: null, dropTarget: null })
    if (started) S.commit('Move')
    else if (narrowTo) S.select([narrowTo])
  })
}

/** live reorder inside an auto-layout parent: the node jumps into the slot under the pointer */
function reorderInLayout(parent: Node, id: string, p: { x: number; y: number }) {
  const L = S.layout()
  const row = parent.layout!.dir === 'row'
  const sibs = (parent.children ?? []).filter((k) => k.visible && k.id !== id)
  let index = sibs.findIndex((k) => { const b = L.get(k.id)!; return row ? p.x < b.x + b.w / 2 : p.y < b.y + b.h / 2 })
  if (index < 0) index = sibs.length
  const all = parent.children ?? []
  const curIdx = all.findIndex((k) => k.id === id)
  const targetIdx = index >= sibs.length ? all.length - 1 : all.findIndex((k) => k.id === sibs[index].id) - (curIdx < all.findIndex((k) => k.id === sibs[index].id) ? 1 : 0)
  if (targetIdx !== curIdx && targetIdx >= 0) {
    S.setNodes((ns) => { const n = find(ns, id)!; return insert(remove(ns, new Set([id])), parent.id, n, targetIdx) }, { commit: false })
  }
  const nb = S.layout().get(id)
  const pb = S.layout().get(parent.id)
  if (nb && pb) {
    const ins = row ? { x: nb.x - 1, y: pb.y + parent.layout!.pad[0], w: 2, h: pb.h - parent.layout!.pad[0] - parent.layout!.pad[2] } : { x: pb.x + parent.layout!.pad[3], y: nb.y - 1, w: pb.w - parent.layout!.pad[1] - parent.layout!.pad[3], h: 2 }
    S.design.setState({ insertion: ins, guides: [] })
  }
}

/* --- resize ------------------------------------------------------------------- */
export function startResize(e: React.PointerEvent, h: Handle) {
  e.stopPropagation()
  e.preventDefault()
  const s = S.get()
  const L = S.layout()
  const ids = topMost(S.nodesOf(), s.selection).filter((id) => !find(S.nodesOf(), id)?.locked)
  const orig = ids.map((id) => ({ id, abs: { ...L.get(id)! }, node: find(S.nodesOf(), id)! })).filter((o) => o.abs)
  const bb = union(orig.map((o) => o.abs))
  if (!bb) return
  const p0 = toWorld(e.clientX, e.clientY)
  const hx = h.includes('w') ? 'l' : h.includes('e') ? 'r' : null
  const hy = h.includes('n') ? 't' : h.includes('s') ? 'b' : null
  const snapOn = (ev: PointerEvent) => prefs.values().snapObjects && !ev.metaKey
  const parentId = S.parentOf(ids[0])?.id ?? null
  const targets = snapTargets(parentId, new Set(ids))
  S.design.setState({ gesture: 'resize' })

  track((ev) => {
    const p = toWorld(ev.clientX, ev.clientY)
    // ⇧ keeps the aspect ratio, ⌥ resizes from the centre, ⌘ skips snapping (kit maths)
    let guides: S.Guide[] = []
    const { l, t, r, b } = resizeRect(bb, h, p.x - p0.x, p.y - p0.y, {
      aspect: ev.shiftKey, fromCenter: ev.altKey, min: 1,
      snap: snapOn(ev) ? (e, mv) => { const sn = snapEdges(e, mv, targets, threshold()); guides = sn.guides; return sn } : undefined,
    })
    const sxk = (r - l) / bb.w, syk = (b - t) / bb.h
    const Lnow = S.layout()
    S.setNodes((ns) => {
      let out = ns
      for (const o of orig) {
        const parent = locate(out, o.id)?.parent
        const pb = parent ? Lnow.get(parent.id) ?? { x: 0, y: 0 } : { x: 0, y: 0 }
        const nx = l + (o.abs.x - bb.x) * sxk, ny = t + (o.abs.y - bb.y) * syk
        const nw = Math.max(1, px(o.abs.w * sxk)), nh = Math.max(1, px(o.abs.h * syk))
        out = update(out, o.id, (n) => {
          const next: Node = { ...o.node, children: n.children }
          if (!parent?.layout) { next.x = px(nx - pb.x); next.y = px(ny - pb.y) }
          if (hx) { next.w = nw; next.sizingW = 'fixed' }
          if (hy) { next.h = nh; next.sizingH = 'fixed' }
          if (next.text) {
            if (hy) next.text = { ...next.text, resize: 'fixed' }
            else if (hx && next.text.resize === 'auto-width') next.text = { ...next.text, resize: 'auto-height' }
          }
          if (n.type === 'boolean' && n.children) {
            const kx = nw / o.abs.w, ky = nh / o.abs.h
            next.children = o.node.children!.map((c) => ({ ...c, x: c.x * kx, y: c.y * ky, w: c.w * kx, h: c.h * ky }))
          }
          return next
        })
      }
      return out
    }, { commit: false })
    S.design.setState({ guides })
  }, () => { S.design.setState({ gesture: null, guides: [] }); S.commit('Resize') })
}

/* --- rotate ---------------------------------------------------------------------- */
export function startRotate(e: React.PointerEvent) {
  e.stopPropagation()
  e.preventDefault()
  const s = S.get()
  const id = s.selection[0]
  const n = id && find(S.nodesOf(), id)
  const b = id && S.layout().get(id)
  if (!n || !b) return
  const c = { x: b.x + b.w / 2, y: b.y + b.h / 2 }
  const p0 = toWorld(e.clientX, e.clientY)
  const r0 = n.rotation
  S.design.setState({ gesture: 'rotate' })
  track((ev) => {
    // node rotation is counter-clockwise (Figma); the kit maths is CSS clockwise
    const r = -rotateDelta(c, p0, toWorld(ev.clientX, ev.clientY), -r0, ev.shiftKey ? 15 : undefined)
    S.patchNode(id, { rotation: Math.round(r * 10) / 10 }, { commit: false })
  }, () => { S.design.setState({ gesture: null }); S.commit('Rotate') })
}

/* --- draw ------------------------------------------------------------------------- */
function draw(e: React.PointerEvent, p0: { x: number; y: number }) {
  const tool = S.get().tool
  const L = S.layout()
  const container = containerAt(S.nodesOf(), L, p0.x, p0.y)
  const host = tool === 'frame' && !container ? null : container
  const hostBox = host ? L.get(host.id)! : { x: 0, y: 0, w: 0, h: 0 }
  const targets = snapTargets(host?.id ?? null, new Set())
  const start = { x: px(p0.x), y: px(p0.y) }
  let id: string | null = null
  const sx = e.clientX, sy = e.clientY
  S.design.setState({ gesture: 'draw' })

  const make = (box: Box): Node => {
    const geo = { x: px(box.x - hostBox.x), y: px(box.y - hostBox.y), w: Math.max(1, px(box.w)), h: Math.max(1, px(box.h)) }
    if (tool === 'frame') return frame({ ...geo, name: host ? 'Frame' : `Frame ${S.nodesOf().filter((n) => n.type === 'frame').length + 1}`, fills: [{ id: uid('p'), kind: 'solid', color: '#ffffff', opacity: 1, visible: true }] })
    if (tool === 'ellipse') return ellipse(geo)
    if (tool === 'text') return text('', { ...geo, sizingW: 'fixed', t: { size: 16, resize: 'auto-height' } })
    return rect(geo)
  }

  track((ev) => {
    if (!id && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 3) return
    const p = toWorld(ev.clientX, ev.clientY)
    let l = Math.min(start.x, p.x), t = Math.min(start.y, p.y), r = Math.max(start.x, p.x), b = Math.max(start.y, p.y)
    if (ev.shiftKey) { const s = Math.max(r - l, b - t); if (p.x < start.x) l = start.x - s; else r = start.x + s; if (p.y < start.y) t = start.y - s; else b = start.y + s }
    if (ev.altKey) { const w = Math.abs(p.x - start.x), h = Math.abs(p.y - start.y); l = start.x - w; r = start.x + w; t = start.y - h; b = start.y + h }
    let guides: S.Guide[] = []
    if (prefs.values().snapObjects && !ev.shiftKey && !ev.altKey) {
      const sn = snapEdges({ l, t, r, b }, { l: p.x < start.x, r: p.x >= start.x, t: p.y < start.y, b: p.y >= start.y }, targets, threshold())
      ;({ l, t, r, b } = sn); guides = sn.guides
    }
    const box = { x: l, y: t, w: r - l, h: b - t }
    if (!id) {
      const n = make(box)
      id = n.id
      S.setNodes((ns) => insert(ns, host?.id ?? null, n), { commit: false })
      S.select([n.id])
    } else {
      const geo = { x: px(box.x - hostBox.x), y: px(box.y - hostBox.y), w: Math.max(1, px(box.w)), h: Math.max(1, px(box.h)) }
      S.patchNode(id, geo, { commit: false })
    }
    S.design.setState({ guides })
  }, () => {
    if (!id) {
      const n = make(tool === 'text' ? { x: start.x, y: start.y - 10, w: 0, h: 0 } : { x: start.x, y: start.y, w: 100, h: 100 })
      if (tool === 'text') { n.sizingW = 'hug'; n.text = { ...n.text!, resize: 'auto-width' } }
      id = n.id
      S.setNodes((ns) => insert(ns, host?.id ?? null, n), { commit: false })
      S.select([n.id])
    }
    S.design.setState({ gesture: null, guides: [], tool: 'move', editing: tool === 'text' ? id : null })
    if (tool !== 'text') S.commit(`Draw ${tool === 'rect' ? 'rectangle' : tool}`)
  })
}

/* --- marquee ---------------------------------------------------------------------- */
function marquee(e: React.PointerEvent, p0: { x: number; y: number }) {
  const s0 = S.get().selection
  const L = S.layout()
  const host = S.nodesOf().slice().reverse().find((n) => n.type === 'frame' && n.visible && n.children?.length && contains(L.get(n.id)!, p0.x, p0.y))
  const pool = (host ? host.children! : S.nodesOf()).filter((n) => n.visible && !n.locked)
  const shift = e.shiftKey
  let moved = false
  track((ev) => {
    const p = toWorld(ev.clientX, ev.clientY)
    const box = { x: Math.min(p0.x, p.x), y: Math.min(p0.y, p.y), w: Math.abs(p.x - p0.x), h: Math.abs(p.y - p0.y) }
    if (!moved && box.w * camera.getState().zoom < 3 && box.h * camera.getState().zoom < 3) return
    moved = true
    const hits = pool.filter((n) => { const b = L.get(n.id); return b && intersects(b, box) }).map((n) => n.id)
    S.design.setState({ marquee: box, gesture: 'marquee' })
    S.select(shift ? [...new Set([...s0, ...hits])] : hits)
  }, () => S.design.setState({ marquee: null, gesture: null }))
}

/* --- hand ------------------------------------------------------------------------- */
export function pan(e: React.PointerEvent | PointerEvent) {
  const c0 = camera.getState()
  const sx = e.clientX, sy = e.clientY
  S.design.setState({ gesture: 'pan' })
  track((ev) => camera.setState({ x: c0.x + ev.clientX - sx, y: c0.y + ev.clientY - sy }), () => S.design.setState({ gesture: null }))
}

/* --- comments --------------------------------------------------------------------- */
function dropComment(p: { x: number; y: number }) {
  const id = uid('c')
  S.setPage({ comments: [...S.page().comments, { id, x: Math.round(p.x), y: Math.round(p.y), text: '', author: 'You', at: Date.now() }] }, { commit: false })
  S.design.setState({ openComment: id })
}

/* --- prototype noodle: drag from a node's knob to a frame ------------------------- */
export function startConnect(e: React.PointerEvent, fromId: string, onPreview: (p: { x: number; y: number } | null, target: string | null) => void) {
  e.stopPropagation()
  e.preventDefault()
  track((ev) => {
    const p = toWorld(ev.clientX, ev.clientY)
    const L = S.layout()
    const target = S.nodesOf().find((n) => n.type === 'frame' && n.id !== fromId && contains(L.get(n.id)!, p.x, p.y) && !ancestors(S.nodesOf(), fromId).some((a) => a.id === n.id))
    onPreview(p, target?.id ?? null)
  }, (ev) => {
    const p = toWorld(ev.clientX, ev.clientY)
    const L = S.layout()
    const target = S.nodesOf().find((n) => n.type === 'frame' && n.id !== fromId && contains(L.get(n.id)!, p.x, p.y) && !ancestors(S.nodesOf(), fromId).some((a) => a.id === n.id))
    onPreview(null, null)
    if (!target) return
    S.patchNode(fromId, (n) => ({
      interactions: [...(n.interactions ?? []).filter((i) => !(i.trigger === 'tap' && i.action === 'navigate')), { id: uid('i'), trigger: 'tap', action: 'navigate', target: target.id, transition: 'smart', duration: 350, easing: [0.16, 1, 0.3, 1] }],
    }), { label: 'Link to frame' })
  })
}

export { sizeOf }
