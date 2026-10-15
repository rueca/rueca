/* ---------------------------------------------------------------------------
   Rail thumbnails for the landing page's shell rail:
     public/thumbs/rail/<id>-<theme>.jpg   (2160×1350, the homepage rail and hero)
     public/thumbs/grid/<id>-<theme>.webp  (720w, the shells page grid)
     public/thumbs/blueprints/<id>.json    (each shell's layout traced, for the rail's skeletons)
     public/thumbs/client/<id>-<theme>.webp (the phone hero's client view, 880×1360, for CLIENT shells)

   Same 1440×900 layout and timing as qa.mjs, saved as JPEG so the big rail
   cards stay sharp at a fraction of PNG weight. These are marketing images,
   so the accent is neutral (src/landing/neutral.ts) — the real blue only
   appears in the full-screen tools.

     npm run thumbs:rail              # every shell
     npm run thumbs:rail motion type  # just these
--------------------------------------------------------------------------- */
import { chromium } from 'playwright-core'
import { mkdirSync, writeFileSync } from 'node:fs'
import { tidy, traceBlueprint } from './blueprint.mjs'
import { NEUTRAL_ACCENT_CSS } from '../src/landing/neutral.ts'

const BASE = process.env.BASE ?? 'http://localhost:5273'
const only = process.argv.slice(2)

const browser = await chromium.launch({ channel: 'chrome', headless: true })
mkdirSync('public/thumbs/rail', { recursive: true })
mkdirSync('public/thumbs/grid', { recursive: true })
// 1.5× (2160×1350): the centred rail card shows up to ~1960 device pixels wide on a retina screen
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 })
const page = await ctx.newPage()
// the dev server's notes route shows "Send to agent", a dev-only button the public site never has: hide it
await ctx.route('**/__rueca/notes', (r) => r.abort())

await page.goto(BASE + '/#/shells')
await page.waitForTimeout(800)
const ids = [...new Set(await page.$$eval('[data-shell-id]', (as) => as.map((a) => a.dataset.shellId)))]
const shells = only.length ? ids.filter((i) => only.includes(i)) : ids

// the rail skeletons: a tracing of each shell's real layout, one small file per shell (fetched by its card)
mkdirSync('public/thumbs/blueprints', { recursive: true })

for (const id of shells) {
  for (const theme of ['dark', 'light']) {
    await page.addInitScript((t) => localStorage.setItem('studio:theme', t), theme)
    // the dev server can reload under us (another session saving files) — retry
    for (let tries = 0; ; tries++) {
      try { await page.goto(`${BASE}/?qa=${Date.now()}#/${id}`); break }
      catch (err) { if (tries >= 3) throw err; await page.waitForTimeout(1500) }
    }
    // a dev-server reload mid-capture leaves a blank white page: wait for the shell to be on screen
    await page.waitForFunction(() => { const r = document.getElementById('root'); return !!r && r.querySelectorAll('*').length > 40 && !/Loading/.test(r.innerText.slice(0, 80)) }, null, { timeout: 15000 }).catch(() => {})
    await page.waitForTimeout(2200)
    await page.addStyleTag({ content: NEUTRAL_ACCENT_CSS })
    await page.waitForTimeout(100)
    const shot = await page.screenshot({ path: `public/thumbs/rail/${id}-${theme}.jpg`, type: 'jpeg', quality: 86 })
    // a 720w WebP for the shells page grid (its cards are ~340px): the browser downsizes and encodes it, no extra deps
    const webp = await page.evaluate(async (b64) => {
      const img = new Image(); img.src = `data:image/jpeg;base64,${b64}`; await img.decode()
      const c = document.createElement('canvas'); c.width = 720; c.height = Math.round(720 * img.height / img.width)
      const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, c.width, c.height)
      return c.toDataURL('image/webp', 0.82).split(',')[1]
    }, shot.toString('base64'))
    writeFileSync(`public/thumbs/grid/${id}-${theme}.webp`, Buffer.from(webp, 'base64'))
    if (theme === 'light') writeFileSync(`public/thumbs/blueprints/${id}.json`, JSON.stringify(tidy(await page.evaluate(`(${traceBlueprint.toString()})()`))))
    console.log(`✓ ${id.padEnd(14)} ${theme}`)
  }
}

// The phone hero shows a shell's client view (content.ts HERO_PHONE_SHELL); its stand-in while the live
// frame loads is that view too, at the phone frame's tallest shape (w × 1.55, capped at 680), not the desktop tool
const CLIENT = ['shader']
mkdirSync('public/thumbs/client', { recursive: true })
const phone = await browser.newContext({ viewport: { width: 440, height: 680 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
const pp = await phone.newPage()
for (const id of shells.filter((i) => CLIENT.includes(i))) {
  for (const theme of ['dark', 'light']) {
    await pp.addInitScript((t) => localStorage.setItem('studio:theme', t), theme)
    for (let tries = 0; ; tries++) {
      try { await pp.goto(`${BASE}/?qa=${Date.now()}#/${id}?client`); break }
      catch (err) { if (tries >= 3) throw err; await pp.waitForTimeout(1500) }
    }
    await pp.waitForFunction(() => { const r = document.getElementById('root'); return !!r && r.querySelectorAll('*').length > 40 }, null, { timeout: 15000 }).catch(() => {})
    await pp.waitForTimeout(2500)
    await pp.addStyleTag({ content: NEUTRAL_ACCENT_CSS })
    await pp.waitForTimeout(100)
    const shot = await pp.screenshot({ type: 'png' })
    const webp = await pp.evaluate(async (b64) => {
      const img = new Image(); img.src = `data:image/png;base64,${b64}`; await img.decode()
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height
      c.getContext('2d').drawImage(img, 0, 0)
      return c.toDataURL('image/webp', 0.84).split(',')[1]
    }, shot.toString('base64'))
    writeFileSync(`public/thumbs/client/${id}-${theme}.webp`, Buffer.from(webp, 'base64'))
    console.log(`✓ ${id.padEnd(14)} ${theme} client`)
  }
}
await browser.close()
