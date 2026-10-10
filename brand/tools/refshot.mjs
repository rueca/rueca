import { chromium } from '/Users/raf/Documents/Prototype UI Harness/node_modules/playwright-core/index.mjs'
const OUT = '/Users/raf/Documents/Prototype UI Harness/brand/references/wireframe'
const list = JSON.parse(process.argv[2])
const b = await chromium.launch({ channel: 'chrome' })
const hide = `[id*="cookie" i],[class*="cookie" i],[id*="consent" i],[class*="consent" i],[aria-label*="cookie" i],#onetrust-banner-sdk,.cky-consent-container{display:none!important}`
await Promise.all(list.map(async ([slug, url, scroll = 0]) => {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, colorScheme: 'light',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36' })
  const p = await ctx.newPage()
  try {
    await p.goto(url, { waitUntil: 'load', timeout: 45000 })
    await p.addStyleTag({ content: hide }).catch(() => {})
    await p.waitForTimeout(6000)
    if (scroll) { await p.mouse.wheel(0, scroll); await p.waitForTimeout(1500) }
    await p.screenshot({ path: `${OUT}/${slug}.png` })
    console.log('ok  ', slug, (await p.title()).slice(0, 60))
  } catch (e) { console.log('FAIL', slug, e.message.split('\n')[0].slice(0, 80)) }
  await ctx.close()
}))
await b.close()
