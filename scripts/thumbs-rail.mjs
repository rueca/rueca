/* ---------------------------------------------------------------------------
   Rail thumbnails for the landing page's shell rail:
     public/thumbs/rail/<id>-<theme>.jpg        the whole tool
     public/thumbs/rail/<id>-<theme>-bare.jpg   the artwork alone

   Both come from the same page load, so they line up pixel for pixel. For the
   bare one every element except the artwork is made invisible (visibility,
   not display, so nothing moves). The landing page shows the artwork first
   and reveals the harness around it as the card scrolls in. JPEG at 1440×900
   keeps big cards sharp at a fraction of PNG weight.

     npm run thumbs:rail              # every shell
     npm run thumbs:rail motion type  # just these

   The artwork is the kit's Artboard ([data-studio-artifact]); shells without
   one fall back to their largest canvas / iframe / video / svg / flow graph.
   A shell where nothing is found gets no bare thumb; the page then animates
   the full thumb on its own.
--------------------------------------------------------------------------- */
import { chromium } from 'playwright-core'
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'

const BASE = process.env.BASE ?? 'http://localhost:5273'
const only = process.argv.slice(2)

const browser = await chromium.launch({ channel: 'chrome', headless: true })
mkdirSync('public/thumbs/rail', { recursive: true })
// same 1440×900 layout as qa.mjs; cards on the landing page are up to ~1000px wide
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
const page = await ctx.newPage()

await page.goto(BASE + '/#/shells')
await page.waitForTimeout(800)
const ids = [...new Set(await page.$$eval('[data-shell-id]', (as) => as.map((a) => a.dataset.shellId)))]
const shells = only.length ? ids.filter((i) => only.includes(i)) : ids

const isolate = () => {
  const marked = [...document.querySelectorAll('[data-studio-artifact]')]
  let keep = marked
  if (!keep.length) {
    const cands = [...document.querySelectorAll('canvas, iframe, video, svg, .react-flow__renderer')]
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.width > 240 && r.height > 160)
      .sort((a, b) => b.r.width * b.r.height - a.r.width * a.r.height)
    keep = cands.length ? [cands[0].el] : []
  }
  if (!keep.length) return null
  const style = document.createElement('style')
  style.textContent = `body * { visibility: hidden !important; transition: none !important; }
    [data-bare-keep], [data-bare-keep] * { visibility: visible !important; }
    html, body { background: var(--field) !important; }`
  keep.forEach((el) => el.setAttribute('data-bare-keep', ''))
  document.head.appendChild(style)
  // where the artwork sits, as fractions of the viewport — the zoom-out origin
  const rs = keep.map((el) => el.getBoundingClientRect())
  const l = Math.max(0, Math.min(...rs.map((r) => r.left))), t = Math.max(0, Math.min(...rs.map((r) => r.top)))
  const r = Math.min(innerWidth, Math.max(...rs.map((r) => r.right))), b = Math.min(innerHeight, Math.max(...rs.map((r) => r.bottom)))
  const f = (n) => +n.toFixed(4)
  return { x: f(l / innerWidth), y: f(t / innerHeight), w: f((r - l) / innerWidth), h: f((b - t) / innerHeight) }
}

const MANIFEST = 'public/thumbs/rail/manifest.json'
const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {}

for (const id of shells) {
  for (const theme of ['dark', 'light']) {
    const full = `public/thumbs/rail/${id}-${theme}.jpg`
    const out = `public/thumbs/rail/${id}-${theme}-bare.jpg`
    await page.addInitScript((t) => localStorage.setItem('studio:theme', t), theme)
    // the dev server can reload under us (another session saving files) — retry
    for (let tries = 0; ; tries++) {
      try { await page.goto(`${BASE}/?qa=${Date.now()}#/${id}`); break }
      catch (err) { if (tries >= 3) throw err; await page.waitForTimeout(1500) }
    }
    await page.waitForTimeout(2200)
    await page.screenshot({ path: full, type: 'jpeg', quality: 80 })
    const ok = await page.evaluate(isolate)
    if (theme === 'dark') { manifest[id] = ok ?? null; writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n') }
    if (ok) { await page.waitForTimeout(60); await page.screenshot({ path: out, type: 'jpeg', quality: 80 }) }
    else if (existsSync(out)) unlinkSync(out)
    console.log(`${ok ? '✓' : '–'} ${id.padEnd(14)} ${theme}${ok ? '' : '  (no artwork found, skipped)'}`)
  }
}
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n')
await browser.close()
