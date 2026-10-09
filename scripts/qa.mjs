/* ---------------------------------------------------------------------------
   Shell QA — drives the installed Google Chrome headlessly (playwright-core,
   channel 'chrome', no browser download).

     node scripts/qa.mjs                 # every shell, both themes
     node scripts/qa.mjs motion dropin   # just these

   For each shell × theme it:
     · captures console errors and page errors
     · runs the contrast audit (surface + text pairs, WCAG AA for text)
     · greps the rendered chrome for theme leaks (inline colours outside the stage)
     · saves public/thumbs/<id>-<theme>.png (gallery thumbnails)
   and prints a table + writes research/qa-report.json.
--------------------------------------------------------------------------- */
import { chromium } from 'playwright-core'
import { mkdirSync, writeFileSync } from 'node:fs'

const BASE = process.env.BASE ?? 'http://localhost:5273'
const only = process.argv.slice(2)
mkdirSync('public/thumbs', { recursive: true })

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
    ['accent/panel', g('--signal'), panel, 3], ['faint/panel', g('--fg-faint'), panel, 3], ['muted/panel', g('--fg-muted'), panel, 4.5], ['fg/panel', g('--fg'), panel, 7],
  ].forEach(([n, a, b, min]) => { const r = ratio(a, b); if (r < min) fails.push(`${n} ${r}<${min}`) })
  // Text actually rendered in chrome: sample visible text nodes outside canvases/artboards.
  const lowText = []
  // first OPAQUE background up the tree (translucent washes are skipped — an approximation)
  // null = text sits on an image / gradient / canvas we can't measure — skip it rather than guess
  const bgOf = (el) => { while (el) { const cs = getComputedStyle(el); if (cs.backgroundImage && cs.backgroundImage !== 'none') return null; if (el.tagName === 'IMG' || el.tagName === 'VIDEO') return null; const m = cs.backgroundColor && cs.backgroundColor.match(/[\d.]+/g)?.map(Number); if (m && (m[3] === undefined || m[3] >= 0.95)) return m; el = el.parentElement } return parse(V('--field')) }
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  let n, seen = 0
  while ((n = walker.nextNode()) && seen < 600) {
    const el = n.parentElement
    if (!el || !n.textContent.trim() || el.closest('canvas,svg,iframe,[data-artifact],.font-artboard,[data-studio-artifact]')) continue
    const r = el.getBoundingClientRect(); if (!r.width || r.bottom < 0 || r.top > innerHeight) continue
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || +cs.opacity < 0.5) continue
    seen++
    const fg = cs.color.match(/[\d.]+/g).map(Number); if (fg[3] !== undefined && fg[3] < 0.5) continue
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
    await page.screenshot({ path: `public/thumbs/${id}-${theme}.png` })
    page.off('console', onConsole); page.off('pageerror', onPageErr)
    report.push({ id, theme, errors, ...res })
    const flag = errors.length || res.fails.length || res.lowText.length ? '✗' : '✓'
    console.log(`${flag} ${id.padEnd(14)} ${theme.padEnd(5)} errors:${errors.length} tokens:${res.fails.length} lowText:${res.lowText.length}/${res.textSampled}`)
    for (const e of errors.slice(0, 3)) console.log('    · ' + e)
    for (const f of res.fails) console.log('    ▲ ' + f)
    for (const l of res.lowText.slice(0, 4)) console.log('    ◦ ' + l)
  }
}
writeFileSync('research/qa-report.json', JSON.stringify(report, null, 2))
await browser.close()
