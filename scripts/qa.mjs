/* ---------------------------------------------------------------------------
   Shell QA — drives the installed Google Chrome headlessly (playwright-core,
   channel 'chrome', no browser download).

     node scripts/qa.mjs                 # every shell, both themes
     node scripts/qa.mjs motion dropin   # just these (the report keeps the other shells' last results)
     BASE=http://127.0.0.1:5400 node scripts/qa.mjs   # another server (default: finds the local dev server)

   For each shell × theme it:
     · captures console errors and page errors
     · runs the contrast audit (surface + text pairs, WCAG AA for text)
     · greps the rendered chrome for theme leaks (inline colours outside the stage)
     · saves research/qa-shots/<id>-<theme>.png (git-ignored; the site's thumbnails are thumbs/rail/*.jpg)
   and prints a table + writes research/qa-report.json.
--------------------------------------------------------------------------- */
import { chromium } from 'playwright-core'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

// Vite may listen on IPv4 or IPv6 only — try each loopback address unless BASE is given.
const BASE = process.env.BASE ?? await (async () => {
  for (const host of ['localhost', '127.0.0.1', '[::1]']) {
    try { const r = await fetch(`http://${host}:5273/`, { signal: AbortSignal.timeout(3000) }); if (r.ok) return `http://${host}:5273` } catch { /* next */ }
  }
  console.error('No dev server on :5273 (tried localhost, 127.0.0.1, [::1]). Run `npm run dev`, or set BASE.'); process.exit(1)
})()
const only = process.argv.slice(2)
mkdirSync('research/qa-shots', { recursive: true })

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
const page = await ctx.newPage()

// #/shells lists every shell; each card carries data-shell-id
await page.goto(BASE + '/#/shells')
await page.waitForTimeout(800)
const ids = [...new Set(await page.$$eval('[data-shell-id]', (as) => as.map((a) => a.dataset.shellId)))]
const shells = only.length ? ids.filter((i) => only.includes(i)) : ids

const audit = () => {
  const root = document.documentElement
  const V = (n) => getComputedStyle(root).getPropertyValue(n).trim()
  const parse = (c) => { const d = document.createElement('div'); d.style.color = c; document.body.appendChild(d)
    const m = getComputedStyle(d).color.match(/[\d.]+/g).map(Number); d.remove(); return m }
  const lum = (r) => { const f = r.slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }); return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2] }
  const ratio = (a, b) => +(((Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05))).toFixed(2)
  const g = (n) => parse(V(n)), panel = g('--panel')
  const fails = []
  ;[['well/panel', g('--well'), panel, 1.08], ['track/panel', g('--track'), panel, 1.15], ['raised/well', g('--raised'), g('--well'), 1.3],
    ['active/panel', g('--active'), panel, 1.12], ['accent-fg/accent-strong', g('--signal-fg'), g('--signal-strong'), 4.5],
    ['accent/panel', g('--signal'), panel, 3], ['faint/panel', g('--fg-faint'), panel, 4.5], ['muted/panel', g('--fg-muted'), panel, 4.5], ['fg/panel', g('--fg'), panel, 7],
  ].forEach(([n, a, b, min]) => { const r = ratio(a, b); if (r < min) fails.push(`${n} ${r}<${min}`) })
  // Text actually rendered in chrome: sample visible text nodes outside canvases/artboards.
  const lowText = []
  // computed colours come as rgb(255 255 255 / .9) or, from color-mix(), color(srgb 1 1 1 / 0.9) in 0–1
  // any computed colour (rgb(), color(srgb …), oklab(…) from Tailwind's /15 opacity) → sRGB 0–255 + alpha, via canvas
  const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  const rgba = (c) => {
    if (!c || c === 'transparent') return [0, 0, 0, 0]
    probe.clearRect(0, 0, 1, 1); probe.fillStyle = '#000'; probe.fillStyle = c; probe.fillRect(0, 0, 1, 1)
    const [r, g, b, a] = probe.getImageData(0, 0, 1, 1).data
    return [r, g, b, a / 255]
  }
  // the background up the tree: translucent layers (washes, 90% glass panels) are composited over the first
  // opaque one, or over --field. null = text sits on an image / gradient / canvas we can't measure — skip it
  const bgOf = (el) => {
    const layers = []
    let base = null
    while (el) {
      const cs = getComputedStyle(el)
      if (cs.backgroundImage && cs.backgroundImage !== 'none') return null
      if (el.tagName === 'IMG' || el.tagName === 'VIDEO') return null
      const m = rgba(cs.backgroundColor)
      if (m && (m[3] === undefined || m[3] >= 0.95)) { base = m; break }
      if (m && m[3] > 0) layers.push(m)
      el = el.parentElement
    }
    base ??= parse(V('--field'))
    for (const l of layers.reverse()) base = [0, 1, 2].map((i) => l[i] * l[3] + base[i] * (1 - l[3]))
    return base
  }
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  let n, seen = 0
  while ((n = walker.nextNode()) && seen < 600) {
    const el = n.parentElement
    if (!el || !n.textContent.trim() || el.closest('canvas,svg,iframe,[data-artifact],.font-artboard,[data-studio-artifact]')) continue
    const r = el.getBoundingClientRect(); if (!r.width || r.bottom < 0 || r.top > innerHeight) continue
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || +cs.opacity < 0.5) continue
    seen++
    const fg = rgba(cs.color); if (fg[3] < 0.5) continue
    const bg = bgOf(el); if (!bg) continue
    // text stacked over an image sibling (absolute overlay) — skip
    if ([...(el.parentElement?.children ?? [])].some((c) => c !== el && (c.tagName === 'IMG' || c.tagName === 'CANVAS' || c.tagName === 'VIDEO'))) continue
    const rr = ratio(fg, bg)
    if (rr < 3) lowText.push(`${rr} "${n.textContent.trim().slice(0, 24)}"`)
  }
  return { fails, lowText: lowText.slice(0, 8), textSampled: seen }
}

const report = []
for (const id of shells) {
  for (const theme of ['dark', 'light']) {
    const errors = []
    const onConsole = (m) => m.type() === 'error' && errors.push(m.text().slice(0, 160))
    const onPageErr = (e) => errors.push('PAGEERROR ' + String(e).slice(0, 160))
    page.on('console', onConsole); page.on('pageerror', onPageErr)
    await page.addInitScript((t) => localStorage.setItem('studio:theme', t), theme)
    await page.goto(`${BASE}/?qa=${Date.now()}#/${id}`)
    await page.waitForTimeout(2200)
    const res = await page.evaluate(audit)
    await page.screenshot({ path: `research/qa-shots/${id}-${theme}.png` })
    page.off('console', onConsole); page.off('pageerror', onPageErr)
    report.push({ id, theme, errors, ...res })
    const flag = errors.length || res.fails.length || res.lowText.length ? '✗' : '✓'
    console.log(`${flag} ${id.padEnd(14)} ${theme.padEnd(5)} errors:${errors.length} tokens:${res.fails.length} lowText:${res.lowText.length}/${res.textSampled}`)
    for (const e of errors.slice(0, 3)) console.log('    · ' + e)
    for (const f of res.fails) console.log('    ▲ ' + f)
    for (const l of res.lowText.slice(0, 4)) console.log('    ◦ ' + l)
  }
}
// A partial run updates only the shells it checked; everyone else's last result stays (merge by id + theme).
const REPORT = 'research/qa-report.json'
let previous = []
try { if (only.length && existsSync(REPORT)) previous = JSON.parse(readFileSync(REPORT, 'utf8')) } catch { /* start fresh */ }
const ran = new Set(report.map((r) => `${r.id}:${r.theme}`))
const merged = [...previous.filter((r) => !ran.has(`${r.id}:${r.theme}`) && ids.includes(r.id)), ...report]
  .sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id) || a.theme.localeCompare(b.theme))
writeFileSync(REPORT, JSON.stringify(merged, null, 2))
await browser.close()
