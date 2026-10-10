import { chromium } from '/Users/raf/Documents/Prototype UI Harness/node_modules/playwright-core/index.mjs'
const out = process.argv[2], theme = process.argv[3] || 'dark', w = +(process.argv[4] || 1280)
const b = await chromium.launch({ channel: 'chrome' })
const p = await b.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2, colorScheme: theme })
const errs = []; p.on('console', (m) => m.type() === 'error' && errs.push(m.text())); p.on('pageerror', (e) => errs.push(e.message))
await p.goto('http://localhost:5273/brand/', { waitUntil: 'networkidle' })
await p.evaluate(() => document.fonts.ready)
const hw = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth])
for (const id of ['wmocks', 'wire']) {
  const el = id === 'top' ? null : await p.$('#' + id)
  if (el) await el.screenshot({ path: `${out}/${theme}-${w}-${id}.png` })
  else await p.screenshot({ path: `${out}/${theme}-${w}-top.png` })
}
console.log('errors', errs, 'scroll/inner', hw)
await b.close()
