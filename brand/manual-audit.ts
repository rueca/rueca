/* Geometry audit for the manual drawings (brand/manual-art-rules.md). Runs in the browser on a
   rendered <svg> and returns plain findings, so an agent (or a person) can fix to zero before
   looking. Roles come from data-a on groups: tag · note · label · dim · leader · ghost · guide,
   and parts from data-part. Not shipped. */

type Pt = { x: number; y: number }
type Box = { x0: number; y0: number; x1: number; y1: number }
export type Finding = { rule: string; detail: string }
export type Report = { scale: number; fill: number; centre: [number, number]; minPx: Record<string, number>; findings: Finding[] }

const TEXT_ROLES = ['tag', 'note', 'label', 'dim']
const MIN_PX: Record<string, number> = { label: 10, tag: 9, dim: 9, note: 14 }

function visible(el: Element, root: SVGSVGElement) {
  for (let e: Element | null = el; e && e !== root; e = e.parentElement) {
    if (parseFloat(getComputedStyle(e).opacity) < 0.05) return false
    if (getComputedStyle(e).display === 'none') return false
  }
  return true
}
const roleOf = (el: Element) => (el.closest('[data-a]') as HTMLElement | null)?.dataset.a ?? ''
const ownerOf = (el: Element) => el.closest('[data-a], [data-part]')

/** client rect → viewBox box */
function vbBox(el: Element, svg: SVGSVGElement): Box {
  const r = el.getBoundingClientRect(), m = svg.getScreenCTM()!.inverse()
  const a = new DOMPoint(r.left, r.top).matrixTransform(m), b = new DOMPoint(r.right, r.bottom).matrixTransform(m)
  return { x0: a.x, y0: a.y, x1: b.x, y1: b.y }
}
/** points along a geometry element, in viewBox coords */
function samples(g: SVGGeometryElement, svg: SVGSVGElement, step = 1): Pt[] {
  const len = g.getTotalLength(), m = svg.getScreenCTM()!.inverse().multiply(g.getScreenCTM()!)
  const out: Pt[] = []
  for (let s = 0; s <= len; s += step) { const p = g.getPointAtLength(s).matrixTransform(m); out.push({ x: p.x, y: p.y }) }
  return out
}
const overlap = (a: Box, b: Box, pad = 0) => a.x0 < b.x1 + pad && b.x0 < a.x1 + pad && a.y0 < b.y1 + pad && b.y0 < a.y1 + pad
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y)

export function audit(svg: SVGSVGElement): Report {
  const vb = svg.viewBox.baseVal, rect = svg.getBoundingClientRect()
  const scale = Math.min(rect.width / vb.width, rect.height / vb.height)
  const findings: Finding[] = []
  const geo = ([...svg.querySelectorAll('path, rect, circle, line, ellipse, polyline, polygon')] as SVGGeometryElement[])
    .filter((g) => visible(g, svg) && roleOf(g) !== 'ghost' && !g.closest('defs, clipPath, mask, [clip-path]'))
  const texts = [...svg.querySelectorAll('[data-a]')].filter((g) => TEXT_ROLES.includes((g as HTMLElement).dataset.a!) && visible(g, svg))

  // 1 · margins and fill
  const all = [...geo, ...texts.map((t) => ((t as HTMLElement).dataset.a === 'note' ? t.querySelector('text')! : t))].map((e) => vbBox(e, svg))
  const u: Box = all.reduce((a, b) => ({ x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1) }), { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity })
  // the paper actually on screen, in viewBox units: wider or taller than the viewBox when the card letterboxes it
  const v = vbBox(svg, svg), vw = v.x1 - v.x0, vh = v.y1 - v.y0
  const m = 0.05 * Math.min(vw, vh)
  if (u.x0 < v.x0 + m || u.y0 < v.y0 + m || u.x1 > v.x1 - m || u.y1 > v.y1 - m)
    findings.push({ rule: 'margin', detail: `drawing box ${u.x0.toFixed(0)},${u.y0.toFixed(0)} → ${u.x1.toFixed(0)},${u.y1.toFixed(0)} breaks the ${m.toFixed(0)}-unit margin of ${v.x0.toFixed(0)},${v.y0.toFixed(0)} ${vw.toFixed(0)}×${vh.toFixed(0)}` })
  const fill = ((u.x1 - u.x0) * (u.y1 - u.y0)) / (vb.width * vb.height)
  const centre: [number, number] = [+(((u.x0 + u.x1) / 2 - vb.x) / vb.width).toFixed(2), +(((u.y0 + u.y1) / 2 - vb.y) / vb.height).toFixed(2)]

  // 2 · rendered type sizes
  const minPx: Record<string, number> = {}
  for (const t of svg.querySelectorAll('text')) {
    if (!visible(t, svg)) continue
    const role = roleOf(t) || 'other', px = parseFloat(getComputedStyle(t).fontSize) * scale
    minPx[role] = Math.min(minPx[role] ?? Infinity, +px.toFixed(1))
  }
  for (const [role, px] of Object.entries(minPx)) if (MIN_PX[role] && px < MIN_PX[role] - 0.05) findings.push({ rule: 'type', detail: `${role} renders at ${px}px (min ${MIN_PX[role]})` })

  // 3 · text against text
  // a note is measured by its text alone (its leader is checked as a line)
  const tb = texts.map((t) => ({ t, b: vbBox((t as HTMLElement).dataset.a === 'note' ? t.querySelector('text')! : t, svg) }))
  for (let i = 0; i < tb.length; i++) for (let j = i + 1; j < tb.length; j++)
    if (overlap(tb[i].b, tb[j].b, 2)) findings.push({ rule: 'text-text', detail: `${desc(tb[i].t)} × ${desc(tb[j].t)}` })

  // 4 · text against other strokes (a line through or within 1.5 units of a label)
  const pts = geo.map((g) => ({ g, owner: ownerOf(g), p: samples(g, svg, 1) }))
  for (const { t, b } of tb) {
    for (const { g, owner, p } of pts) {
      if (t.contains(g) || owner === t || (g as Element).closest('[data-host]')?.contains(t)) continue
      const hit = p.find((q) => q.x > b.x0 - 1.5 && q.x < b.x1 + 1.5 && q.y > b.y0 - 1.5 && q.y < b.y1 + 1.5 && !occluded(g, q, svg))
      if (hit) { findings.push({ rule: 'text-line', detail: `${desc(t)} touches ${desc(g)} at ${hit.x.toFixed(0)},${hit.y.toFixed(0)}` }); break }
    }
  }

  // 5 · leader and guide ends land on something (a ghost's outline counts: the guide shows where a part came from)
  const ghosts = ([...svg.querySelectorAll('[data-a="ghost"] :is(path, rect, circle)')] as SVGGeometryElement[]).filter((g) => visible(g, svg))
  const landing = [...pts, ...ghosts.map((g) => ({ g, p: samples(g, svg, 1) }))]
  for (const l of geo.filter((g) => ['leader', 'guide'].includes(roleOf(g)))) {
    const own = l.closest('[data-a]')
    const ps = samples(l, svg, 0.5), ends = [ps[0], ps[ps.length - 1]]
    for (const e of ends) {
      let best = Infinity
      for (const { g, p } of landing) { if (own?.contains(g)) continue; for (const q of p) best = Math.min(best, dist(e, q)) }
      // a note's own text also counts as landing
      for (const { t, b } of tb) if (own?.contains(t) || t.contains(l)) best = Math.min(best, Math.max(0, Math.max(b.x0 - e.x, e.x - b.x1, b.y0 - e.y, e.y - b.y1)))
      if (best > 2.5) findings.push({ rule: 'line-end', detail: `${desc(l)} ends ${best.toFixed(1)} units from anything at ${e.x.toFixed(0)},${e.y.toFixed(0)}` })
    }
  }

  // 6 · tangents between separate parts
  const parts = [...svg.querySelectorAll('[data-part]')].filter((p) => visible(p, svg))
  const pp = parts.map((p) => ({ p, s: pts.filter((x) => p.contains(x.g)).flatMap((x) => x.p) }))
  for (let i = 0; i < pp.length; i++) for (let j = i + 1; j < pp.length; j++) {
    if (pp[i].p.contains(pp[j].p) || pp[j].p.contains(pp[i].p)) continue
    let best = Infinity
    for (const a of pp[i].s) for (const b of pp[j].s) { const d = dist(a, b); if (d < best) best = d }
    if (best > 0.6 && best < 4) findings.push({ rule: 'tangent', detail: `${desc(pp[i].p)} and ${desc(pp[j].p)} pass ${best.toFixed(1)} units apart` })
  }
  return { scale: +scale.toFixed(2), fill: +fill.toFixed(2), centre, minPx, findings }
}

/** is this point of g painted over by a filled shape drawn after it (a card in front, a file on top)? */
function occluded(g: Element, q: Pt, svg: SVGSVGElement) {
  const s = new DOMPoint(q.x, q.y).matrixTransform(svg.getScreenCTM()!)
  return document.elementsFromPoint(s.x, s.y).some((el) => el !== g && el instanceof SVGGeometryElement && !el.closest('[data-a]')
    && getComputedStyle(el).fill !== 'none' && !!(g.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING))
}

function desc(el: Element) {
  const h = el as HTMLElement
  const a = h.closest?.('[data-part]') as HTMLElement | null, r = h.closest?.('[data-a]') as HTMLElement | null
  return [r?.dataset.a, a?.dataset.part, el.tagName.toLowerCase(), (el.textContent || '').trim().slice(0, 16)].filter(Boolean).join(':')
}
