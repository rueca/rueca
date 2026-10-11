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
     dot   { x, y, r }         an icon button
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
    for (const r of rg.getClientRects()) if (vis(r) && r.width >= 4 && within(r, el)) out.push({ k: 'text', x: R(r.x), y: R(r.y + r.height / 2), w: R(r.width) })
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
    out.push({ k: 'dot', x: R(r.x + r.width / 2), y: R(r.y + r.height / 2), r: R(Math.min(r.width, r.height) * 0.22) })
  }
  return { w: W, h: H, marks: out }
}
