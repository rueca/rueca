/* ---------------------------------------------------------------------------
   Empty-shell thumbnails (trial, Rafael 10 Oct): each shell with nothing on its
   stage, the window squeezed until the chrome dominates.
     public/thumbs/empty/<id>-<theme>.webp   (720w, the shells page grid)

   Per shell: load at 1440×900, measure the docked/floating side columns, then
   shrink the window (16:10, the card's frame) until the chrome fills all but
   CANVAS of its width. The stage's contents are hidden, its space and
   background kept, and any chrome inside it (the zoom pill, a floating toolbar) stays.
   The pictures inside the panels (thumbnails, looks, a navigator) become Cargo-style
   blank cards: flat grey, one hairline diagonal, punched holes when there's room.

     npm run thumbs:empty              # every shell
     npm run thumbs:empty motion type  # just these
--------------------------------------------------------------------------- */
import { chromium } from 'playwright-core'
import { mkdirSync, writeFileSync } from 'node:fs'
import { NEUTRAL_ACCENT_CSS } from '../src/landing/neutral.ts'

const BASE = process.env.BASE ?? 'http://localhost:5273'
const only = process.argv.slice(2)
/** the share of the window the empty canvas keeps: just enough that it still reads as a tool */
const CANVAS = 0.3
/** single-column shells would get too narrow for their toolbar; Present also swaps to its client view under 761px */
const MIN_W = 800, WIDE_W = 800

/** Empties the stage, in the page: everything in <main> goes transparent except its chrome (zoom pills,
    floating toolbars, a short floating panel like Generate's prompt bar) and the boxes that hold it, so the
    canvas's own background and grid stay. Opacity, not visibility: React Flow and others set visibility inline. */
const emptyStage = () => {
  const main = document.querySelector('main')
  if (!main) return
  const H = main.getBoundingClientRect().height
  const CHROME = '.cluster, header, .panel'
  const isChrome = (e) => e.matches('.cluster, header') || (e.matches('.panel') && e.getBoundingClientRect().height < H * 0.4)
  const walk = (el) => {
    for (const c of el.children) {
      if (isChrome(c)) continue
      if ([...c.querySelectorAll(CHROME)].some(isChrome)) walk(c)
      else c.style.setProperty('opacity', '0', 'important')
    }
  }
  walk(main)
  // what stayed in <main> is chrome; mark it so blankPictures only touches chrome
  for (const e of main.querySelectorAll(CHROME)) if (isChrome(e)) e.dataset.thumbChrome = ''
}

/** The pictures the chrome itself shows (library thumbnails, looks, a navigator, a scope) become blank cards,
    after Cargo's Blank placeholder (brand/placeholders.js, brand/references/wireframe/cargo-blank-placeholder.png):
    a flat grey card, one corner-to-corner hairline, and two punched holes where the card is big enough. */
const blankPictures = (theme) => {
  const T = theme === 'dark' ? { card: '#2d2d2d', line: 'rgba(255,255,255,0.10)' } : { card: '#dcdcdc', line: 'rgba(0,0,0,0.13)' }
  const W = innerWidth, H = innerHeight
  const shown = (e) => { const s = getComputedStyle(e); return s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.05 }
  const inChrome = (e) => (e.closest('main') ? !!e.closest('[data-thumb-chrome]') : !!e.closest('.panel, .cluster, aside, header, section'))
  const card = (w, h) => {
    const s = Math.min(w, h), portrait = h >= w
    // the holes only where they read as holes (Cargo: 8px holes, 36px in, on a 432px card)
    const r = s * 0.0185 < 2 ? 0 : s * 0.0185, inset = s * 0.083, len = portrait ? h : w
    const holes = s < 72 ? [] : [len * 0.25, len * 0.75].map((p) => (portrait ? [inset, p] : [p, inset]))
    const hole = ([cx, cy]) => `M${cx - Math.max(r, 2.5)} ${cy}a${Math.max(r, 2.5)} ${Math.max(r, 2.5)} 0 1 0 ${2 * Math.max(r, 2.5)} 0a${Math.max(r, 2.5)} ${Math.max(r, 2.5)} 0 1 0 ${-2 * Math.max(r, 2.5)} 0Z`
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">` +
      `<path d="M0 0H${w}V${h}H0Z ${holes.map(hole).join(' ')}" fill="${T.card}" fill-rule="evenodd"/>` +
      `<line x1="0" y1="0" x2="${w}" y2="${h}" stroke="${T.line}" stroke-width="1" vector-effect="non-scaling-stroke"/></svg>`
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
  }
  const big = (r) => r.width >= 28 && r.height >= 28 && r.width * r.height < W * H * 0.4
  const picked = []
  for (const e of document.querySelectorAll('img, canvas, video, iframe, svg, *')) {
    const tag = e.tagName.toLowerCase()
    if (tag === 'svg' && e.parentElement?.closest('svg')) continue
    const r = e.getBoundingClientRect()
    if (!big(r) || !shown(e) || !inChrome(e)) continue
    const media = /^(img|canvas|video|iframe)$/.test(tag) || (tag === 'svg' && r.width >= 48 && r.height >= 48)
    const painted = !media && /url\(|gradient\(/.test(getComputedStyle(e).backgroundImage)
    if ((media || painted) && !picked.some((p) => p.contains(e))) picked.push(e)
  }
  for (const e of picked) {
    const r = e.getBoundingClientRect(), cs = getComputedStyle(e), bg = card(Math.round(r.width), Math.round(r.height))
    if (/^(img|canvas|video|iframe|svg)$/i.test(e.tagName)) {
      // media can't take a background over its own pixels: a blank stand-in of the same box takes its place
      const b = document.createElement('div')
      b.style.cssText = `display:${cs.display === 'inline' ? 'inline-block' : cs.display};width:${r.width}px;height:${r.height}px;border-radius:${cs.borderRadius};flex:none;background:${bg} 0 0/100% 100% no-repeat;`
      if (cs.position === 'absolute' || cs.position === 'fixed') for (const k of ['position', 'top', 'left', 'right', 'bottom', 'inset']) b.style[k] = cs[k]
      e.after(b)
      e.style.setProperty('display', 'none', 'important')
    } else {
      e.style.setProperty('background', `${bg} 0 0/100% 100% no-repeat`, 'important')
    }
  }
}

const browser = await chromium.launch({ channel: 'chrome', headless: true })
mkdirSync('public/thumbs/empty', { recursive: true })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 })
const page = await ctx.newPage()

await page.goto(BASE + '/#/shells')
await page.waitForTimeout(800)
const ids = [...new Set(await page.$$eval('[data-shell-id]', (as) => as.map((a) => a.dataset.shellId)))]
const shells = only.length ? ids.filter((i) => only.includes(i)) : ids

/** the side columns' outer edges */
const measure = () => {
  const W = innerWidth
  const cols = [...document.querySelectorAll('aside')].filter((e) => e.getBoundingClientRect().width > 40)
  const left = cols.map((e) => e.getBoundingClientRect()).filter((r) => r.left < W / 2).reduce((m, r) => Math.max(m, r.right), 0)
  const right = cols.map((e) => e.getBoundingClientRect()).filter((r) => r.left >= W / 2).reduce((m, r) => Math.max(m, W - r.left), 0)
  return { left, right, cols: cols.length }
}

for (const id of shells) {
  for (const theme of ['dark', 'light']) {
    await page.addInitScript((t) => localStorage.setItem('studio:theme', t), theme)
    await page.setViewportSize({ width: 1440, height: 900 })
    for (let tries = 0; ; tries++) {
      try { await page.goto(`${BASE}/?qa=${Date.now()}#/${id}`); break }
      catch (err) { if (tries >= 3) throw err; await page.waitForTimeout(1500) }
    }
    await page.waitForFunction(() => { const r = document.getElementById('root'); return !!r && r.querySelectorAll('*').length > 40 && !/Loading/.test(r.innerText.slice(0, 80)) }, null, { timeout: 15000 }).catch(() => {})
    await page.waitForTimeout(1800)

    const full = await page.evaluate(measure)
    // the chrome at its real size, with CANVAS of the window left empty, in the card's 16:10
    let w = Math.round(Math.max((full.left + full.right) / (1 - CANVAS), MIN_W))
    await page.setViewportSize({ width: w, height: Math.round(w * 10 / 16) })
    await page.waitForTimeout(400)
    // a shell that swaps layout when narrow (Present's client view) loses its columns: give it room back
    if ((await page.evaluate(measure)).cols < full.cols) { w = Math.max(w, WIDE_W); await page.setViewportSize({ width: w, height: Math.round(w * 10 / 16) }); await page.waitForTimeout(400) }
    const h = Math.round(w * 10 / 16)

    await page.addStyleTag({ content: NEUTRAL_ACCENT_CSS })
    await page.evaluate(emptyStage)
    await page.evaluate(blankPictures, theme)
    await page.waitForTimeout(200)
    const shot = await page.screenshot({ type: 'jpeg', quality: 90 })
    const webp = await page.evaluate(async (b64) => {
      const img = new Image(); img.src = `data:image/jpeg;base64,${b64}`; await img.decode()
      const c = document.createElement('canvas'); c.width = 720; c.height = Math.round(720 * img.height / img.width)
      const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, c.width, c.height)
      return c.toDataURL('image/webp', 0.84).split(',')[1]
    }, shot.toString('base64'))
    writeFileSync(`public/thumbs/empty/${id}-${theme}.webp`, Buffer.from(webp, 'base64'))
    console.log(`✓ ${id.padEnd(14)} ${theme}  ${w}×${h}`)
  }
}
await browser.close()
