#!/usr/bin/env node
/* ---------------------------------------------------------------------------
   accent-check — does the chrome accent clash with the prototype?

     node <skill>/scripts/accent-check.mjs http://localhost:5173/#/my-tool
     node <skill>/scripts/accent-check.mjs <url> --artboard "#preview"

   The accent (--signal) draws selection outlines, handles and focus rings ON TOP
   of the work. If the prototype is built from the same hue, selection vanishes.
   It must also stay clear of the semantic colours (--rec, --key, --ok), or
   "selected" reads as "recording" / "keyframed" / "done".

   How: screenshot the artboard alone (chrome hidden, so the panels' own accent
   states don't count), bucket the rendered pixels by OKLCH hue, and compare.
   Rendered pixels work the same for DOM, SVG, Canvas, WebGL and iframes.

   Needs playwright-core in the project (npm i -D playwright-core) and an
   installed Chrome. Exit code 1 on a clash, so it can gate a QA run.
--------------------------------------------------------------------------- */
import { createRequire } from 'node:module'

const args = process.argv.slice(2)
const url = args.find((a) => !a.startsWith('--'))
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined }
if (!url) { console.error('usage: accent-check.mjs <url> [--artboard <selector>]'); process.exit(2) }

// Resolve playwright-core from the project being checked, not from the skill folder.
const require = createRequire(process.cwd() + '/')
let chromium
try { ({ chromium } = require('playwright-core')) } catch {
  console.error('accent-check needs playwright-core in this project: npm i -D playwright-core'); process.exit(2)
}

const MIN_HUE = 35      // degrees of OKLCH hue the accent must keep from anything that matters
const MIN_SHARE = 0.04  // a hue must cover ≥4% of the artboard to count
const MIN_CHROMA = 0.06 // below this a colour reads as grey and can't clash

// Pre-audited accents: fill ≥3:1 on the panel, white text on `strong` ≥4.5:1, both themes.
const ACCENTS = {
  blue:    { h: 249, dark: ['#0d99ff', '#0a72c6'], light: ['#0b84e0', '#0a6fc0'] }, // the default
  violet:  { h: 293, dark: ['#9c78fd', '#704ec0'], light: ['#8862e5', '#6a48b9'] },
  magenta: { h: 332, dark: ['#d561c8', '#9e3a93'], light: ['#be4bb1', '#97338d'] },
  cyan:    { h: 222, dark: ['#00a5cb', '#007590'], light: ['#008eaf', '#006e89'] },
}

const browser = await chromium.launch({ channel: 'chrome' })
let clashed = false, failed = false
const picks = new Set()
const reloaded = (e) => /context was destroyed|Cannot find context|navigation/i.test(e.message)
for (const theme of ['dark', 'light']) for (let attempt = 1; attempt <= 2; attempt++) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: theme })
  try {
  const page = await ctx.newPage()
  await page.goto(url, { waitUntil: 'load', timeout: 30000 }) // not networkidle: live artifacts may never go idle
  // the kit's own theme attribute (installs) and the classes (sites that opt into configureTheme({ htmlClass }))
  await page.evaluate((t) => { const h = document.documentElement; h.setAttribute('data-studio-theme', t); h.classList.toggle('dark', t === 'dark'); h.classList.toggle('light', t === 'light') }, theme)
  await page.waitForTimeout(800) // let a canvas / WebGL artifact draw a frame

  // Find the artboard: --artboard selector → the kit's hook [data-studio-artifact] (on Artboard, and on
  // <Stage fill>'s display:contents wrapper) → .font-artboard (older kits) → the biggest canvas/iframe/media if it fills a good part of
  // the stage (hand-built pages) → the stage itself (graphs, sheets, grids have no single artboard).
  // Kit panels (.panel .cluster .pop) are always hidden so their own accent states don't count.
  const locate = (sel) => {
    // display:contents has no box of its own: measure the union of its children instead
    const box = (e) => {
      if (getComputedStyle(e).display !== 'contents') return e.getBoundingClientRect()
      const rs = [...e.children].map(box).filter((r) => r.width && r.height)
      if (!rs.length) return new DOMRect()
      const x = Math.min(...rs.map((r) => r.left)), y = Math.min(...rs.map((r) => r.top))
      return new DOMRect(x, y, Math.max(...rs.map((r) => r.right)) - x, Math.max(...rs.map((r) => r.bottom)) - y)
    }
    const area = (e) => { const r = box(e); return r.width * r.height }
    const biggest = (q) => [...document.querySelectorAll(q)].sort((a, b) => area(b) - area(a))[0]
    const stage = document.querySelector('main') ?? document.body
    const media = biggest('canvas, iframe, video, img')
    let el = sel && document.querySelector(sel), how = 'selector'
    if (!el) { el = biggest('[data-studio-artifact]'); how = 'kit artifact' }
    if (!el) { el = biggest('.font-artboard'); how = 'kit artboard' } // kits installed before the hook existed
    if (!el && media && area(media) >= area(stage) * 0.25) { el = media; how = 'largest media' }
    if (!el) { el = stage; how = 'whole stage' }
    if (area(el) < 64 * 64) return null
    el.setAttribute('data-accent-check', '')
    const r = box(el), vw = innerWidth, vh = innerHeight // clip to the viewport for the screenshot
    const clip = { x: Math.max(0, r.left), y: Math.max(0, r.top) }
    clip.width = Math.min(vw, r.right) - clip.x; clip.height = Math.min(vh, r.bottom) - clip.y
    const s = document.createElement('style')
    s.textContent = 'body *{visibility:hidden!important}[data-accent-check],[data-accent-check] *{visibility:visible!important}' +
      '[data-accent-check] :is(.panel,.cluster,.pop),[data-accent-check] :is(.panel,.cluster,.pop) *{visibility:hidden!important}'
    document.head.append(s)
    return { clip, label: `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : el.classList.length ? '.' + [...el.classList].slice(0, 2).join('.') : ''} (${how})` }
  }
  let found = null
  for (let i = 0; i < 10 && !found; i++) { // artifacts can mount late
    found = await page.evaluate(locate, flag('--artboard')).catch(() => null)
    if (!found) await page.waitForTimeout(500)
  }
  if (!found) throw new Error('no artboard found — pass --artboard <selector>')

  const png = await page.screenshot({ clip: found.clip })
  const result = await page.evaluate(async ({ b64, MIN_HUE, MIN_SHARE, MIN_CHROMA, ACCENTS }) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode()
    const cv = document.createElement('canvas'); cv.width = cv.height = 96
    const cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(img, 0, 0, 96, 96)
    const px = cx.getImageData(0, 0, 96, 96).data

    const oklch = (r, g, b) => {
      const lin = (c) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
      const [R, G, B] = [lin(r), lin(g), lin(b)]
      const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B)
      const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B)
      const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B)
      const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
      const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
      return { C: Math.hypot(a, bb), H: ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360 }
    }
    const dist = (x, y) => { const d = Math.abs(x - y) % 360; return Math.min(d, 360 - d) }
    const cssHue = (name) => {
      const d = document.createElement('div'); d.style.color = getComputedStyle(document.querySelector('.studio') ?? document.documentElement).getPropertyValue(name).trim()   // tokens live on the kit's roots
      document.body.append(d); const v = getComputedStyle(d).color.match(/[\d.]+/g).map(Number); d.remove()
      return oklch(v[0], v[1], v[2]).H
    }

    // Bucket the artboard's chromatic pixels into 10° hue bins.
    const bins = new Map(); let n = 0
    for (let i = 0; i < px.length; i += 4) {
      if (px[i + 3] < 128) continue; n++
      const { C, H } = oklch(px[i], px[i + 1], px[i + 2]); if (C < MIN_CHROMA) continue
      const k = (Math.round(H / 10) * 10) % 360; bins.set(k, (bins.get(k) ?? 0) + 1)
    }
    const palette = [...bins].map(([k, c]) => [k, c / Math.max(1, n)]).filter(([, s]) => s >= MIN_SHARE).sort((a, b) => b[1] - a[1])
    const semantic = { rec: cssHue('--rec'), key: cssHue('--key'), ok: cssHue('--ok') }
    const accent = cssHue('--signal')
    const near = (h) => [
      ...palette.filter(([k]) => dist(k, h) < MIN_HUE).map(([k, s]) => `artboard hue ${k}° (${Math.round(s * 100)}%)`),
      ...Object.entries(semantic).filter(([, k]) => dist(k, h) < MIN_HUE).map(([nm, k]) => `--${nm} (${Math.round(k)}°)`),
    ]
    const clearance = (h) => Math.min(360, ...palette.map(([k]) => dist(k, h)), ...Object.values(semantic).map((k) => dist(k, h)))
    const ranked = Object.entries(ACCENTS).map(([name, a]) => [name, clearance(a.h)]).sort((a, b) => b[1] - a[1])
    return { palette: palette.map(([k, s]) => `${k}° ${Math.round(s * 100)}%`), accent: Math.round(accent), clashes: near(accent), best: [ranked[0][0], Math.round(ranked[0][1])] }
  }, { b64: png.toString('base64'), MIN_HUE, MIN_SHARE, MIN_CHROMA, ACCENTS })

  const head = `${theme.padEnd(5)} artboard ${found.label} · chromatic hues ${result.palette.join(', ') || 'none (greyscale)'} · accent ${result.accent}°`
  if (!result.clashes.length) console.log(`${head}\n      PASS — the accent clears the artboard and the semantic colours`)
  else {
    clashed = true
    const [name, clear] = result.best
    console.log(`${head}\n      CLASH — too close to ${result.clashes.join(', ')}`)
    if (clear >= MIN_HUE) { picks.add(name); console.log(`      → switch to ${name} (clears everything by ${clear}°)`) }
    else console.log(`      → nothing clears ${MIN_HUE}°: keep blue and give selection a two-tone outline (visual-rules.md)`)
  }
    await ctx.close(); break
  } catch (e) {
    await ctx.close()
    if (attempt === 1 && reloaded(e)) continue // the dev server hot-reloaded mid-check: try once more
    failed = true; console.error(`${theme.padEnd(5)} ERROR ${e.message.split('\n')[0]}`); break
  }
}
await browser.close()

// Print the override for the chosen fallback, both themes, ready to paste after the theme import.
// If the themes disagree, both are printed: pick one — the accent must not change with the theme.
if (picks.size) {
  console.log('\nOverride — paste after the theme import:')
  for (const [name, a] of Object.entries(ACCENTS)) if (picks.has(name)) {
    const soft = (hex, al) => `rgb(${parseInt(hex.slice(1, 3), 16)} ${parseInt(hex.slice(3, 5), 16)} ${parseInt(hex.slice(5, 7), 16)} / ${al})`
    // Wins in a registry install (tokens on .studio / .pop / [data-studio], theme on data-studio-theme) and in a site
    // that keeps them on :root with .dark / .light classes. The media block covers the OS-follows case.
    const dark = `--signal: ${a.dark[0]}; --signal-strong: ${a.dark[1]}; --signal-soft: ${soft(a.dark[0], 0.16)};`
    const light = `--signal: ${a.light[0]}; --signal-strong: ${a.light[1]}; --signal-soft: ${soft(a.light[0], 0.12)};`
    const K = ':where(.studio, .pop, [data-studio])'
    console.log(`/* ${name} */\n:root:root, :root ${K} { ${dark} }\n:root:root.light, :root:is(.light, [data-studio-theme="light"]) ${K} { ${light} }\n@media (prefers-color-scheme: light) { :root:root:not(.dark), :root:not(.dark, [data-studio-theme="dark"]) ${K} { ${light} } }`)
  }
}
process.exit(failed ? 2 : clashed ? 1 : 0)
