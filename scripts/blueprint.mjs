/* ---------------------------------------------------------------------------
   Blueprint: a hairline tracing of a shell's real layout, for the landing rail's
   skeletons (src/landing/blueprints.json). Run in the page by thumbs-rail.mjs at
   the same 1440×900 the thumbnail is shot at, so the skeleton and the screenshot
   line up exactly through the wipe.

   Marks (viewport px):
     box   { x, y, w, h, r }   panels, toolbar clusters, fields, filled buttons (r = corner radius)
     rule  { x, y, w }         a divider: the toolbar's edge, section borders inside panels
     media { x, y, w, h }      the artwork: canvas, image, video, iframe, big svg
     text  { x, y, w }         one line per run of text, on its vertical centre
     track { x, y, w, v }      a slider: the track, and its knob at v (0–1)
     pill  { x, y, w, h, on }  a switch
     dot   { x, y, r }         an icon button (toolbars only)
     vrule { x, y, h }         a vertical edge (a docked panel's inner side)
   Then tidied (tidy, below): fewer marks where dense, no doubled lines.
   --------------------------------------------------------------------------- */
export function traceBlueprint() {
  const W = innerWidth, H = innerHeight, out = []
  const R = (n) => Math.round(n * 10) / 10
  const vis = (r) => r.width > 2 && r.height > 2 && r.right > 0 && r.bottom > 0 && r.left < W && r.top < H
  const shown = (e) => { const s = getComputedStyle(e); return s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.05 }
  const radius = (e) => Math.min(16, parseFloat(getComputedStyle(e).borderTopLeftRadius) || 0)

  // panels: floating (.panel, .cluster) and docked (<aside>, the docked toolbar <header>)
  const chrome = [...document.querySelectorAll('.panel, .cluster, aside')].filter((e) => shown(e) && vis(e.getBoundingClientRect()))
  // nested chrome (a panel inside a panel) is drawn once, as its outer edge
  for (const e of chrome) { if (e.parentElement?.closest('.panel, .cluster, aside')) continue; const r = e.getBoundingClientRect(); out.push({ k: 'box', x: R(r.x), y: R(r.y), w: R(r.width), h: R(r.height), r: radius(e) }) }
  // what a panel hides past its edge (scrolled or clipped) isn't drawn
  const within = (r, e) => { const c = e.closest('.panel, .cluster, aside'); if (!c) return true; const b = c.getBoundingClientRect(); return r.top >= b.top - 1 && r.bottom <= b.bottom + 1 && r.left >= b.left - 1 && r.right <= b.right + 1 }
  const alpha = (bg) => { const m = bg.match(/rgba?\(([^)]+)\)/); if (!m) return 0; const p = m[1].split(/[ ,/]+/).filter(Boolean); return p.length > 3 ? parseFloat(p[3]) : 1 }

  // artboards on the stage: the biggest framed boxes outside the chrome (a background or a shadow), outermost only
  const boards = []
  for (const e of document.querySelectorAll('div, section, article, figure')) {
    if (e.closest('.panel, .cluster, aside, header') || !shown(e)) continue
    const r = e.getBoundingClientRect(), cs = getComputedStyle(e)
    if (!vis(r) || r.width < 120 || r.height < 120 || r.width * r.height > W * H * 0.5) continue
    if (alpha(cs.backgroundColor) < 0.5 && cs.boxShadow === 'none') continue
    boards.push({ e, r })
  }
  boards.sort((a, b) => b.r.width * b.r.height - a.r.width * a.r.height)
  const picked = []
  for (const b of boards) if (!picked.some((p) => p.e.contains(b.e))) picked.push(b)
  for (const { e, r } of picked) out.push({ k: 'box', x: R(r.x), y: R(r.y), w: R(r.width), h: R(r.height), r: radius(e) })

  // bars inside panels (timeline clips, meters): thin filled shapes, drawn as rounded outlines
  for (const e of document.querySelectorAll('.panel div, .panel span, aside div, aside span')) {
    const r = e.getBoundingClientRect()
    if (!vis(r) || r.height < 3 || r.height > 16 || r.width < 24 || r.width / r.height < 3 || !shown(e) || !within(r, e)) continue
    if (e.closest('button, [role="slider"], .group\\/slider') || alpha(getComputedStyle(e).backgroundColor) < 0.2 || e.textContent.trim()) continue
    out.push({ k: 'box', x: R(r.x), y: R(r.y), w: R(r.width), h: R(r.height), r: R(r.height / 2) })
  }
  const bar = document.querySelector('header')
  // the docked toolbar's bottom edge, only in the docked layout (floating toolbars have no edge)
  if (bar && [...document.querySelectorAll('aside')].some((x) => shown(x) && x.getBoundingClientRect().width > 40) && !bar.closest('.panel, .cluster') && shown(bar)) { const r = bar.getBoundingClientRect(); if (vis(r) && r.width > W * 0.6) out.push({ k: 'rule', x: R(0), y: R(r.bottom + 6), w: R(W) }) }

  // section dividers inside panels: their top border, edge to edge
  for (const e of document.querySelectorAll('.panel *, aside *')) {
    const cs = getComputedStyle(e)
    if (parseFloat(cs.borderTopWidth) < 0.5 || cs.borderTopStyle === 'none' || !shown(e)) continue
    const r = e.getBoundingClientRect()
    if (vis(r) && r.width > 120) out.push({ k: 'rule', x: R(r.x), y: R(r.y), w: R(r.width) })
  }

  // fields and filled buttons: their outline (text inside them is traced below as usual)
  for (const e of document.querySelectorAll('input:not([type=range]):not([type=checkbox]):not([type=radio]), textarea, select, [role="combobox"], button')) {
    if (!shown(e)) continue
    const r = e.getBoundingClientRect()
    if (!vis(r) || r.width < 40 || r.height < 18 || !within(r, e)) continue
    const isButton = e.tagName === 'BUTTON'
    if (isButton) { const bg = getComputedStyle(e).backgroundColor; if (!bg || bg === 'transparent' || /rgba\(.*, 0\)$/.test(bg) || !e.textContent.trim()) continue }
    out.push({ k: 'box', x: R(r.x), y: R(r.y), w: R(r.width), h: R(r.height), r: radius(e) })
  }

  for (const e of document.querySelectorAll('canvas, img, video, iframe, svg')) {
    if (e.closest('.panel, .cluster') || !shown(e)) continue
    if (e.tagName.toLowerCase() === 'svg' && e.parentElement?.closest('svg')) continue
    const r = e.getBoundingClientRect()
    if (r.width < 80 || r.height < 60 || !vis(r)) continue
    // media that fills an artboard already drawn takes the board's frame: draw only its diagonal
    const same = picked.some((p) => Math.abs(p.r.x - r.x) < 8 && Math.abs(p.r.y - r.y) < 8 && Math.abs(p.r.width - r.width) < 8 && Math.abs(p.r.height - r.height) < 8)
    out.push({ k: 'media', framed: same || undefined, x: R(r.x), y: R(r.y), w: R(r.width), h: R(r.height) })
  }

  // text: one line per rendered run (a Range per text node), skipping icons and hidden text
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  for (let n; (n = walker.nextNode());) {
    if (!n.textContent.trim()) continue
    const el = n.parentElement
    if (!el || el.closest('svg, [aria-hidden="true"], script, style, [data-studio-toaster]') || !shown(el)) continue
    const rg = document.createRange(); rg.selectNodeContents(n)
    for (const r of rg.getClientRects()) if (vis(r) && r.width >= 4 && within(r, el)) out.push({ k: 'text', x: R(r.x), y: R(r.y + r.height / 2), w: R(r.width), size: R(r.height) })
  }

  // sliders (the kit's: a track with an indicator), switches, icon buttons
  for (const e of document.querySelectorAll('.group\\/slider')) {
    const t = e.querySelector('[class*="rounded-full"]'), th = e.querySelector('[role="slider"], [data-index]')
    const r = (t ?? e).getBoundingClientRect(); if (!vis(r)) continue
    const k = th?.getBoundingClientRect()
    out.push({ k: 'track', x: R(r.x), y: R(r.y + r.height / 2), w: R(r.width), v: k ? Math.max(0, Math.min(1, (k.x + k.width / 2 - r.x) / r.width)) : 0.5 })
  }
  for (const e of document.querySelectorAll('[role="switch"]')) {
    const r = e.getBoundingClientRect(); if (!vis(r)) continue
    out.push({ k: 'pill', x: R(r.x), y: R(r.y), w: R(r.width), h: R(r.height), on: e.getAttribute('aria-checked') === 'true' || e.hasAttribute('data-checked') })
  }
  for (const e of document.querySelectorAll('button')) {
    if (e.textContent.trim() || !shown(e)) continue
    const r = e.getBoundingClientRect()
    if (!vis(r) || r.width > 44 || Math.abs(r.width - r.height) > 6) continue
    out.push({ k: 'dot', x: R(r.x + r.width / 2), y: R(r.y + r.height / 2), r: R(Math.min(r.width, r.height) * 0.22), bar: !!e.closest('.cluster, header') })
  }
  return { w: W, h: H, marks: out }
}

/* Tidy the tracing so it reads as a clean drawing at card size (~0.55×):
   - fewer marks where it's dense: text runs on one line merge into one stroke, tiny text (rulers,
     captions under ~10px) is dropped, and icon buttons are kept only in toolbars;
   - no doubled lines: near-identical boxes are drawn once, a divider on a box's own edge is dropped,
     and a box against the screen's edge loses that side (the card's frame already draws it). */
export function tidy({ w: W, h: H, marks }) {
  const near = (a, b, d = 4) => Math.abs(a - b) <= d
  const boxes = [], out = []
  // boxes: dedupe; those touching the screen edge become their interior edges
  for (const m of marks.filter((m) => m.k === 'box')) {
    // the same box twice, or a box hugging the inside of another (a panel and its scroll area): drawn once
    if (boxes.some((b) => near(b.x, m.x, 6) && near(b.y, m.y, 6) && near(b.x + b.w, m.x + m.w, 6) && near(b.y + b.h, m.y + m.h, 6))) continue
    boxes.push(m)
    const L = near(m.x, 0, 3), T = near(m.y, 0, 3), Rt = near(m.x + m.w, W, 3), B = near(m.y + m.h, H, 3)
    if (!L && !T && !Rt && !B) { out.push(m); continue }
    if (!T) out.push({ k: 'rule', x: m.x, y: m.y, w: m.w })
    if (!B) out.push({ k: 'rule', x: m.x, y: m.y + m.h, w: m.w })
    if (!L) out.push({ k: 'vrule', x: m.x, y: m.y, h: m.h })
    if (!Rt) out.push({ k: 'vrule', x: m.x + m.w, y: m.y, h: m.h })
  }
  const edgeAt = (y, x0, x1) => boxes.some((b) => (near(b.y, y) || near(b.y + b.h, y)) && b.x - 4 <= x0 && b.x + b.w + 4 >= x1)
  const rules = []
  for (const m of marks.filter((m) => m.k === 'rule')) {
    if (edgeAt(m.y, m.x, m.x + m.w) || rules.some((r) => near(r.y, m.y) && near(r.x, m.x, 8) && near(r.w, m.w, 8))) continue
    rules.push(m); out.push(m)
  }
  // text: drop the tiny, merge runs that sit on one line with a small gap
  // a row of seven or more short labels on one line is a ruler or a scale: it reads as clutter, so it goes
  const rows = new Map()
  for (const m of marks) if (m.k === 'text') { const key = Math.round(m.y / 3); rows.set(key, (rows.get(key) ?? 0) + 1) }
  const ruler = (m) => (rows.get(Math.round(m.y / 3)) ?? 0) >= 7
  const text = marks.filter((m) => m.k === 'text' && (m.size ?? 14) >= 10.5 && m.w >= 12 && !ruler(m)).sort((a, b) => a.y - b.y || a.x - b.x)
  for (const m of text) {
    const prev = out.findLast((o) => o.k === 'text' && near(o.y, m.y, 2) && m.x - (o.x + o.w) < 14 && m.x >= o.x)
    if (prev) { prev.w = Math.max(prev.w, m.x + m.w - prev.x); continue }
    out.push({ k: 'text', x: m.x, y: m.y, w: m.w })
  }
  for (const m of marks) {
    if (m.k === 'dot') { if (m.bar) out.push({ k: 'dot', x: m.x, y: m.y, r: m.r }); continue }
    // media sitting in a box already drawn (an artboard) keeps only its diagonal
    if (m.k === 'media') { out.push(boxes.some((b) => near(b.x, m.x, 8) && near(b.y, m.y, 8) && near(b.w, m.w, 8) && near(b.h, m.h, 8)) ? { ...m, framed: true } : m); continue }
    if (m.k === 'track' || m.k === 'pill') out.push(m)
  }
  return { w: W, h: H, marks: out }
}
