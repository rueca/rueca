import { chromium } from '/Users/raf/Documents/Prototype UI Harness/node_modules/playwright-core/index.mjs'
import { readdirSync, readFileSync } from 'node:fs'
const [dir, out, filter] = process.argv.slice(2)
const files = readdirSync(dir).filter((f) => f.endsWith('.png') && (!filter || new RegExp(filter).test(f))).sort()
const html = `<body style="margin:0;background:#ddd;font:13px sans-serif;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:10px">` +
  files.map((f) => `<figure style="margin:0;background:#fff"><img style="width:100%;display:block" src="data:image/png;base64,${readFileSync(dir + '/' + f).toString('base64')}"><figcaption style="padding:4px 6px">${f}</figcaption></figure>`).join('') + '</body>'
const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage({ viewport: { width: 1500, height: 900 } })
await p.setContent(html); await p.waitForTimeout(500); await p.screenshot({ path: out, fullPage: true }); await b.close()
console.log(files.length, 'images')
