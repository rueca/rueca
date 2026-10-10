// Writes Trompo blank placeholder cards: SVG (needs Geist Mono for the caption, falls back to
// monospace) and PNG (rendered with Geist Mono). Light and dark, common ratios, 1280px long edge.
//   node brand/tools/blank-card.mjs
import { chromium } from '/Users/raf/Documents/Prototype UI Harness/node_modules/playwright-core/index.mjs'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { blankCard } from '../placeholders.js'

const OUT = fileURLToPath(new URL('../trompo/placeholders/', import.meta.url))
const LONG = 1280
const RATIOS = { '16x9': [16, 9], '4x3': [4, 3], '1x1': [1, 1], '3x4': [3, 4], '2x3': [2, 3], '9x16': [9, 16] }

const b = await chromium.launch({ channel: 'chrome' })
const p = await b.newPage({ deviceScaleFactor: 1 })
await p.setContent(`<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400&display=block"><body style="margin:0;background:transparent">x</body>`)
await p.evaluate(() => document.fonts.load('16px "Geist Mono"'))
for (const [name, [rw, rh]] of Object.entries(RATIOS)) {
  const w = rw >= rh ? LONG : Math.round((LONG * rw) / rh), h = rw >= rh ? Math.round((LONG * rh) / rw) : LONG
  for (const theme of ['light', 'dark']) {
    const svg = blankCard({ w, h, theme, ratio: `${rw}:${rh}` })
    const base = `${OUT}blank-${theme}-${name}`
    writeFileSync(`${base}.svg`, svg)
    await p.setViewportSize({ width: w, height: h })
    await p.evaluate((s) => { document.body.innerHTML = s }, svg)
    await p.waitForTimeout(50)
    await p.screenshot({ path: `${base}.png`, omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } })
    console.log(`blank-${theme}-${name}`, `${w}×${h}`)
  }
}
await b.close()
