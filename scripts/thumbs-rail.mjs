/* ---------------------------------------------------------------------------
   Rail thumbnails for the landing page's shell rail:
     public/thumbs/rail/<id>-<theme>.jpg

   Same 1440×900 layout and timing as qa.mjs, saved as JPEG so the big rail
   cards stay sharp at a fraction of PNG weight. These are marketing images,
   so the accent is neutral (src/landing/neutral.ts) — the real blue only
   appears in the full-screen tools.

     npm run thumbs:rail              # every shell
     npm run thumbs:rail motion type  # just these
--------------------------------------------------------------------------- */
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'
import { NEUTRAL_ACCENT_CSS } from '../src/landing/neutral.ts'

const BASE = process.env.BASE ?? 'http://localhost:5273'
const only = process.argv.slice(2)

const browser = await chromium.launch({ channel: 'chrome', headless: true })
mkdirSync('public/thumbs/rail', { recursive: true })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
const page = await ctx.newPage()

await page.goto(BASE + '/#/shells')
await page.waitForTimeout(800)
const ids = [...new Set(await page.$$eval('[data-shell-id]', (as) => as.map((a) => a.dataset.shellId)))]
const shells = only.length ? ids.filter((i) => only.includes(i)) : ids

for (const id of shells) {
  for (const theme of ['dark', 'light']) {
    await page.addInitScript((t) => localStorage.setItem('studio:theme', t), theme)
    // the dev server can reload under us (another session saving files) — retry
    for (let tries = 0; ; tries++) {
      try { await page.goto(`${BASE}/?qa=${Date.now()}#/${id}`); break }
      catch (err) { if (tries >= 3) throw err; await page.waitForTimeout(1500) }
    }
    await page.waitForTimeout(2200)
    await page.addStyleTag({ content: NEUTRAL_ACCENT_CSS })
    await page.waitForTimeout(100)
    await page.screenshot({ path: `public/thumbs/rail/${id}-${theme}.jpg`, type: 'jpeg', quality: 80 })
    console.log(`✓ ${id.padEnd(14)} ${theme}`)
  }
}
await browser.close()
