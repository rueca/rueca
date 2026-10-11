import { boards, fixed, scores } from './boards.js'
import { images } from './images.js'

const $ = (s, r = document) => r.querySelector(s)
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const PAL = { Lana: '#F3F1EB', Platino: '#DCDAD5', Nogal: '#181411', Rubia: '#5E2219', Achiote: '#E8582C', Cochinilla: '#EE7A68', Malva: '#A88BF6', Cielo: '#5DB4E8', Hoja: '#2FA57C', Gualda: '#F2C744', 'Añil': '#3440C8' }
const DARK = new Set(['Nogal', 'Rubia', 'Añil'])

/* public-domain / CC BY engravings the samples recolour (Wikimedia sends CORS headers, so canvas can read them) */
const WM = 'https://upload.wikimedia.org/wikipedia/commons/thumb/'
const ENG = {
  diderot: WM + 'a/a3/Textiles%3B_spinning-wheel_with_various_components_used_in_the_Wellcome_V0023697ER.jpg/1280px-Textiles%3B_spinning-wheel_with_various_components_used_in_the_Wellcome_V0023697ER.jpg',
  spinner: WM + '7/71/A_woman_sits_spinning_at_a_spinning_wheel._Wood_engraving._Wellcome_V0039778.jpg/1280px-A_woman_sits_spinning_at_a_spinning_wheel._Wood_engraving._Wellcome_V0039778.jpg',
  eastgate: WM + '3/30/Textiles%3B_a_cotton_spinning_wheel._Engraving_by_Eastgate._Wellcome_V0024072EL.jpg/1280px-Textiles%3B_a_cotton_spinning_wheel._Engraving_by_Eastgate._Wellcome_V0024072EL.jpg',
}

/* ---------- theme ---------- */
const root = document.documentElement
try { const t = localStorage.getItem('rueca:moodboards:theme'); if (t) root.dataset.theme = t } catch {}
$('#theme').addEventListener('click', () => {
  const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches
  root.dataset.theme = dark ? 'light' : 'dark'
  try { localStorage.setItem('rueca:moodboards:theme', root.dataset.theme) } catch {}
})

/* ---------- fonts: Martina Plantijn trial, installed locally, never served ---------- */
new FontFace('Plantijn', "local('TestMartinaPlantijnVF-Roman'), local('Martina Plantijn')", { weight: '300 900' })
  .load().then((f) => document.fonts.add(f)).catch(() => {})

/* ---------- the mark: Rafael's file, wordmark set to currentColor so it follows the ground ---------- */
const svgText = await fetch('./rueca-logo.svg').then((r) => r.text())
const inner = svgText.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
  .replace(/<defs>[\s\S]*?<\/defs>/, '').replace(/ clip-path="[^"]*"/g, '').replace(/fill="black"/g, 'fill="currentColor"')
const logo = (cls = 'lg') => `<svg class="${cls}" viewBox="0 0 1143 218" role="img" aria-label="Rueca">${inner}</svg>`
const mark = () => `<svg viewBox="0 0 310 218" style="display:block;width:100%;height:auto" aria-hidden="true">${inner}</svg>`
document.querySelectorAll('[data-logo]').forEach((el) => { el.innerHTML = logo() })

/* ---------- static parts ---------- */
$('#fixed').innerHTML = fixed.map(([a, b]) => `<span class="chip">${esc(a)}<i>${esc(b)}</i></span>`).join('')
$('#swatches').innerHTML = Object.entries(PAL).map(([n, h]) => `<span class="${DARK.has(n) ? 'dk' : ''}" style="background:${h}">${n}</span>`).join('')
$('#toc').innerHTML = boards.map((b) => `<a href="#${b.id}"><div class="n">${b.n}</div><div class="nm">${esc(b.name)}</div><div class="gl">${esc(b.gloss)}</div><div class="tg hand" style="color:var(--k-${b.kicker})">${esc(b.tag)}</div></a>`).join('')

const dots = (n) => `<span class="dots">${'<b>●</b>'.repeat(n)}${'<i>●</i>'.repeat(5 - n)}</span>`
$('#scores').innerHTML = `<thead><tr><th></th>${scores.cols.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${boards.map((b) => `<tr><td class="nm">${esc(b.name)}</td>${scores.rows[b.id].map((v) => `<td>${dots(v)}</td>`).join('')}</tr>`).join('')}</tbody>`

const sampleCap = {
  lamina: ['Diderot & d’Alembert, Encyclopédie, pl. XII, recoloured to Nogal ink', 'Añil construction lines, Achiote red pen'],
  platino: ['Wood engraving “Spinner”, Atkinson-dithered to Nogal on Lana', 'Platinum chrome, brights as the tool palette'],
  archivo: ['“Mr Antis’ improved Spinning Wheel”, engraved by Eastgate', 'A museum label as layout'],
  patron: ['Generated rings: each one turns at its own speed', 'One Achiote thread draws the underline'],
  materia: ['CSS stand-ins for a photo shoot: emboss, deboss, dyed skeins', 'Raking light sweeps once on load'],
}

$('#boards').innerHTML = boards.map((b) => `
  <section class="board" id="${b.id}">
    <div class="b-head">
      <div>
        <p class="kick hand" style="color:var(--k-${b.kicker})">board ${b.n.toLowerCase()} · ${esc(b.tag)}</p>
        <h2><span class="rn">${b.n}</span>${esc(b.name)}</h2>
        <p class="gloss">${esc(b.gloss)}</p>
      </div>
      <p class="thesis">${esc(b.thesis)}</p>
    </div>
    <div class="sample s-${b.id}" data-sample="${b.id}"></div>
    <p class="sample-cap"><span>Sample · ${esc(sampleCap[b.id][0])}</span><span>${esc(sampleCap[b.id][1])}</span></p>
    <div class="b-body">
      <aside class="spec"><dl>
        <dt>The wheel, elegantly</dt><dd>${esc(b.wheel)}</dd>
        <dt>What you’d make</dt><dd>${esc(b.make)}</dd>
        <dt>Type</dt><dd>${esc(b.type)}</dd>
        <dt>Colour, by area</dt><dd>
          <div class="mixbar">${b.mix.map(([n, p]) => `<span title="${n} ${p}%" style="flex:${p};background:${PAL[n]}"></span>`).join('')}</div>
          <div class="mixkey">${b.mix.map(([n, p]) => `<span><b>${n}</b> ${p}%</span>`).join('')}</div></dd>
        <dt>Motion</dt><dd>${esc(b.motion)}</dd>
        <dt>Watch out</dt><dd>${esc(b.risk)}</dd>
        <dt>Builds on</dt><dd><div class="chips">${b.uses.map((u) => `<span class="chip">${esc(u)}</span>`).join('')}</div></dd>
      </dl></aside>
      <div class="wall">${images[b.id].map((it) => `
        <figure><a class="im" href="${esc(it.link)}" target="_blank" rel="noopener noreferrer"><img src="${esc(it.img)}" alt="${esc(it.cap)}" loading="lazy" referrerpolicy="no-referrer" /></a>
        <figcaption>${esc(it.cap)}<span class="src">${esc(it.src)}</span></figcaption></figure>`).join('')}
      </div>
    </div>
  </section>`).join('')

/* ---------- image helpers ---------- */
const imgCache = {}
const load = (src) => (imgCache[src] ??= new Promise((res, rej) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.referrerPolicy = 'no-referrer'; i.onload = () => res(i); i.onerror = rej; i.src = src }))
const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16))

/** Crop, then read luminance; returns {cv, ctx, W, H, L} at width w. */
function lum(img, crop, w) {
  const [x0, y0, x1, y1] = crop, sw = (x1 - x0) * img.width, sh = (y1 - y0) * img.height
  const W = w, H = Math.round((w * sh) / sw)
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H
  const ctx = cv.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, x0 * img.width, y0 * img.height, sw, sh, 0, 0, W, H)
  const d = ctx.getImageData(0, 0, W, H).data, L = new Float32Array(W * H)
  for (let i = 0; i < W * H; i++) L[i] = (0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2]) / 255
  return { cv, ctx, W, H, L }
}
/* paper level = the median; ink = darkest few percent. Auto-levels so each engraving prints the same. */
function levels(L) { const s = Array.from(L.filter((_, i) => i % 7 === 0)).sort((a, b) => a - b); return [s[Math.floor(s.length * 0.02)], s[Math.floor(s.length * 0.5)]] }

/** Engraving → one ink on transparent paper. Lines stay lines. */
function inkify(img, { crop = [0, 0, 1, 1], ink = PAL.Nogal, w = 1400, gamma = 1.1 } = {}) {
  const { cv, ctx, W, H, L } = lum(img, crop, w), [lo, paper] = levels(L), hi = paper - 0.05
  const out = ctx.createImageData(W, H), [r, g, b] = hex(ink)
  for (let i = 0; i < W * H; i++) { const a = Math.min(1, Math.max(0, (hi - L[i]) / (hi - lo))) ** (1 / gamma); out.data.set([r, g, b, Math.round(a * 255)], i * 4) }
  ctx.putImageData(out, 0, 0)
  return cv
}

/** Engraving → two colours, kept small and scaled up pixelated. Atkinson dither, or `bits` for a plain 1-bit threshold. */
function dither(img, { crop = [0, 0, 1, 1], ink = PAL.Nogal, paper = PAL.Lana, w = 230, bits = false } = {}) {
  const { cv, ctx, W, H, L } = lum(img, crop, w), [lo, pap] = levels(L)
  for (let i = 0; i < L.length; i++) L[i] = Math.min(1, Math.max(0, (L[i] - lo) / (pap - lo))) * 1.04
  const on = new Uint8Array(W * H)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, o = L[i] < (bits ? 0.62 : 0.5) ? 0 : 1, e = bits ? 0 : (L[i] - o) / 8; on[i] = o
    for (const [dx, dy] of [[1, 0], [2, 0], [-1, 1], [0, 1], [1, 1], [0, 2]]) { const X = x + dx, Y = y + dy; if (X >= 0 && X < W && Y < H) L[Y * W + X] += e }
  }
  const out = ctx.createImageData(W, H), A = hex(paper), B = hex(ink)
  for (let i = 0; i < W * H; i++) out.data.set([...(on[i] ? A : B), 255], i * 4)
  ctx.putImageData(out, 0, 0)
  return cv
}
const place = (el, p) => p.then((cv) => el.replaceWith(Object.assign(cv, { className: el.className, ariaHidden: 'true' }))).catch(() => {})

/* ================= samples ================= */
const S = {}

S.lamina = (el) => {
  el.innerHTML = `
    <div class="frame"></div>
    <div class="hd"><span>Lám. I</span><span>Rueca · Détails du rouet</span><span>MMXXVI</span></div>
    <div class="plate"><i class="ph"></i>
      <svg viewBox="0 0 1000 762" aria-hidden="true">
        <g fill="none" stroke="${PAL['Añil']}" stroke-width="1.1" vector-effect="non-scaling-stroke">
          <circle cx="759" cy="232" r="140" stroke-dasharray="5 5"/><circle cx="759" cy="232" r="162" opacity=".5"/>
          <path d="M759 50V430M560 232H965" stroke-dasharray="14 4 2 4" opacity=".75"/>
          <path d="M619 52H899M619 44v16M899 44v16" opacity=".85"/>
        </g>
        <text x="759" y="38" text-anchor="middle" font-family="Libre Franklin" font-size="16" fill="${PAL['Añil']}" letter-spacing="1">Ø 280</text>
        <path d="M872 128 C 930 96, 975 96, 1018 112" fill="none" stroke="${PAL.Achiote}" stroke-width="1.6" stroke-linecap="round"/>
        <g font-family="Caveat" font-weight="600" fill="${PAL.Achiote}" stroke-width="1.6">
          ${[['A', 862, 136], ['B', 392, 282], ['C', 640, 404], ['D', 690, 560]].map(([t, x, y]) => `<circle cx="${x}" cy="${y}" r="17" fill="${PAL.Lana}" stroke="${PAL.Achiote}"/><text x="${x}" y="${y + 9}" text-anchor="middle" font-size="27">${t}</text>`).join('')}
          <text x="1026" y="122" font-size="30" font-weight="500">the part</text>
          <text x="1026" y="152" font-size="30" font-weight="500">that spins</text>
        </g>
      </svg>
    </div>
    <div class="copy">
      ${logo()}
      <h3>Spin up a<br>real tool.</h3>
      <ol class="figs">
        <li><b>A</b><span>The skill <i>what your agent reads</i></span></li>
        <li><b>B</b><span>The prompt <i>where every tool starts</i></span></li>
        <li><b>C</b><span>The kit <i>the bench it’s built on</i></span></li>
        <li><b>D</b><span>Twelve shells <i>ready to spin</i></span></li>
      </ol>
      <div class="cta"><span class="btn">Install</span><code>npx skills add rueca/rueca</code></div>
      <span class="hn">← one line, any runtime</span>
    </div>
    <div class="ft"><span>Fig. 26 — Le rouet, vue de face</span><span>after Diderot &amp; d’Alembert, 1765</span></div>`
  place($('.ph', el), load(ENG.diderot).then((img) => inkify(img, { crop: [0.08, 0.44, 0.95, 0.8623] })))
}

const icon = {
  wheel: '<circle cx="16" cy="16" r="11"/><circle cx="16" cy="16" r="2"/><path d="M16 5v22M5 16h22M8.2 8.2l15.6 15.6M23.8 8.2 8.2 23.8"/>',
  spindle: '<path d="M16 3v26"/><ellipse cx="16" cy="21" rx="7" ry="2.6"/><path d="M12 9c3 1 5 1 8 0M12 12.5c3 1 5 1 8 0"/>',
  pencil: '<path d="M7 25l2-7L21 6l5 5-12 12z"/><path d="M18 9l5 5M7 25l7-2"/>',
  type: '<path d="M8 25h7M11.5 25 17 7l6 18M13.5 18.5h7.5M20 25h5"/>',
  select: '<rect x="6" y="6" width="20" height="20" stroke-dasharray="3 2.4"/>',
  hand: '<path d="M11 27c-3-3-5-6-5-9 0-1.5 1.8-2 3-.6L11 20V8.5c0-2 3-2 3 0V15V6.5c0-2 3-2 3 0V15V8c0-2 3-2 3 0v8.5V11c0-2 3-2 3 0v9c0 4-2 7-4 7z"/>',
}
const ic = (k, sw = 1.6) => `<svg viewBox="0 0 32 32" fill="none" stroke="${PAL.Nogal}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round">${icon[k]}</svg>`

S.platino = (el) => {
  const tiles = [['wheel', 'Achiote'], ['spindle', 'Gualda'], ['pencil', 'Malva'], ['type', 'Hoja'], ['select', 'Cochinilla'], ['hand', 'Lana']]
  el.innerHTML = `
    <div class="menubar"><span class="mk">${mark()}</span><b>Rueca</b><span>File</span><span>Edit</span><span>View</span><span>Spin</span><span>Window</span><span>Help</span><span class="clock">Sat 10:42 AM</span></div>
    <div class="win main">
      <div class="tb"><i class="box"></i><span>Spinner — Untitled tool</span><i class="box"></i><i class="box"></i></div>
      <div class="wb">
        <div class="pic"><i class="ph"></i></div>
        <div class="txt">
          <span class="eb">Rueca 1.0 · Shell Nº 07</span>
          <h3>Spin up a<br>real tool.</h3>
          <p>Describe the tool you wish existed. Rueca builds it in your project, with real panels, real controls and a canvas that works.</p>
          <div class="btns"><span class="pb">Cancel</span><span class="pb def">Spin</span></div>
        </div>
      </div>
      <div class="status"><svg viewBox="0 0 32 32" fill="none" stroke="${PAL.Nogal}" stroke-width="2">${icon.wheel}</svg>Spinning up your tool…<div class="prog"></div></div>
    </div>
    <div class="win tools"><div class="tb"><i class="box"></i></div><div class="grid">${tiles.map(([k, c]) => `<i style="background:${PAL[c]}">${ic(k)}</i>`).join('')}</div></div>
    <div class="sticky">same palette,<br>1997 chrome ✳</div>`
  place($('.ph', el), load(ENG.spinner).then((img) => dither(img, { crop: [0.26, 0.3, 0.92, 0.84], w: 300, bits: true })))
}

S.archivo = (el) => {
  const ring = `<svg viewBox="0 0 120 70" preserveAspectRatio="none" aria-hidden="true"><path d="M62 4C30 2 6 14 5 34c-1 22 28 33 58 32 30-1 52-13 52-32C115 13 86 3 52 6" fill="none" stroke="${PAL.Achiote}" stroke-width="2" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>`
  el.innerHTML = `
    <div class="sheet"><i class="hole" style="top:28%"></i><i class="hole" style="top:68%"></i><i class="ph"></i>
      <span class="pencil">Nº 001: the first wheel in the collection</span></div>
    <div class="lab">
      <div class="num">01${ring}</div>
      <h3>Rueca</h3>
      <p class="sub">Spinning wheel, 1807 (?)<br>Prompt-to-tool skill, 2026</p>
      <dl>
        <dt>Material</dt><dd>Walnut, wool, iron.<br>TypeScript, React.</dd>
        <dt>Use</dt><dd>Spins fibre into thread. Spins a prompt into a working tool.</dd>
        <dt>Holdings</dt><dd>Twelve shells, Nº 01–12</dd>
      </dl>
      <div class="dye">${['Achiote', 'Gualda', 'Hoja', 'Cielo', 'Malva'].map((c) => `<i style="background:${PAL[c]}"></i>`).join('')}</div>
    </div>
        <div class="lg-c">${logo()}</div>
    <div class="acc">${[['02', 'Motion'], ['03', 'Dither'], ['04', 'Journey']].map(([n, t]) => `<figure><div></div><span>Nº ${n}<br>${t}</span></figure>`).join('')}</div>`
  place($('.ph', el), load(ENG.eastgate).then((img) => inkify(img, { crop: [0.06, 0.05, 0.94, 0.965], w: 1100 })))
}

S.patron = (el) => {
  const cx = 700, cy = 330
  let rings = '', r = 26, i = 0
  const dashes = ['1.5 5', '16 6', '1 3', '34 7 2 7', '3 9', '60 10', '2 4', '22 4 22 12']
  while (r < 900) {
    const sp = 70 + ((i * 37) % 140), dir = i % 3 === 1 ? 'reverse' : 'normal', op = 0.28 + ((i * 13) % 50) / 100
    rings += `<circle class="ring" style="animation-duration:${sp}s;animation-direction:${dir}" cx="${cx}" cy="${cy}" r="${r.toFixed(1)}" stroke-dasharray="${dashes[i % dashes.length]}" opacity="${op.toFixed(2)}"/>`
    r += 14 + ((i * 7) % 11); i++
  }
  // the thread: spirals out of the hub, leaves the field, and underlines the headline
  let d = `M${cx} ${cy}`, t = 0, px = cx, py = cy
  for (; t < Math.PI * 5.75; t += 0.08) { const rr = 4 + t * 11.5; px = cx + Math.cos(t + Math.PI) * rr; py = cy + Math.sin(t + Math.PI) * rr; d += `L${px.toFixed(1)} ${py.toFixed(1)}` }
  d += `C${px - 70} ${py - 70}, 520 414, 430 415 S 130 418, 62 416`
  el.innerHTML = `
    <svg class="field" viewBox="0 0 1000 625" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs><linearGradient id="pf" x1="0" x2="1"><stop offset=".12" stop-color="#fff" stop-opacity="0"/><stop offset=".55" stop-color="#fff" stop-opacity="1"/></linearGradient><mask id="pm"><rect width="1000" height="625" fill="url(#pf)"/></mask></defs>
      <g mask="url(#pm)" fill="none" stroke="${PAL.Lana}" stroke-width="1" vector-effect="non-scaling-stroke">${rings}</g>
      <g fill="none" stroke="${PAL['Añil']}" stroke-width="1.2" opacity=".9"><circle cx="${cx}" cy="${cy}" r="3" fill="${PAL['Añil']}"/></g>
      <path class="thread" d="${d}" fill="none" stroke="${PAL.Achiote}" stroke-width="2.2" stroke-linecap="round"/>
    </svg>
    ${logo()}
    <h3>Spin up a<br>real tool.</h3>
    <span class="sub">Twelve design tools, spun from one prompt.</span>
    <span class="hn">← the thread becomes the underline</span>`
}

S.materia = (el) => {
  const grain = (a) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${a} 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`)}")`
  el.style.setProperty('--grain', grain(0.16)); el.style.setProperty('--grain-d', grain(0.35))
  const dyes = [['Achiote', 'annatto'], ['Cochinilla', 'cochineal'], ['Gualda', 'weld'], ['Rubia', 'madder'], ['Añil', 'indigo'], ['Nogal', 'walnut hull']]
  const W = 420, H = 300, sw = 46, gap = (W - 40 - sw * 6) / 5
  const skein = (c, i) => {
    const x = 20 + i * (sw + gap), base = PAL[c], y0 = 50, y1 = 222
    let strands = ''
    for (let k = 0; k < 14; k++) { const xx = x + 3 + k * ((sw - 6) / 13); strands += `<path d="M${xx} ${y0 + 8}C${xx + 7} ${y0 + 60},${xx - 7} ${y1 - 60},${xx} ${y1 - 6}" />` }
    return `<g>
      <clipPath id="sk${i}"><rect x="${x}" y="${y0}" width="${sw}" height="${y1 - y0}" rx="${sw / 2}"/></clipPath>
      <rect x="${x}" y="${y0}" width="${sw}" height="${y1 - y0}" rx="${sw / 2}" fill="${base}"/>
      <g stroke="${DARK.has(c) ? '#fff' : '#000'}" stroke-opacity="${DARK.has(c) ? 0.14 : 0.13}" stroke-width=".9" fill="none" clip-path="url(#sk${i})">${strands}</g>
      <path d="M${x - 2} ${y0 + 34}c${sw / 3} 7 ${(sw * 2) / 3} 7 ${sw + 4} 0" stroke="${PAL.Lana}" stroke-width="2.4" fill="none" opacity=".8"/>
      <text x="${x + sw / 2}" y="${y1 + 30}" text-anchor="middle" font-family="Caveat" font-weight="600" font-size="20" fill="${PAL.Nogal}">${c.toLowerCase()}</text>
      <text x="${x + sw / 2}" y="${y1 + 47}" text-anchor="middle" font-family="Libre Franklin" font-size="10.5" fill="rgba(24,20,17,.55)">${dyes[i][1]}</text>
    </g>`
  }
  el.innerHTML = `
    <div class="paper"><div class="emb"><i></i></div><div class="sweep"></div>
      <span class="tag">blind emboss · cotton rag, 600 gsm</span><div class="foil">Nº 01</div></div>
    <div class="leather"><div class="deb"><i></i></div><span class="tag">debossed · leather in rubia</span></div>
    <div class="skeins"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${dyes.map(([c], i) => skein(c, i)).join('')}</svg>
      <span class="tag">six of our colours are dyes</span></div>`
}

/* build samples as they approach the viewport, so heavy engravings load lazily */
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); S[e.target.dataset.sample]?.(e.target) } }), { rootMargin: '600px 0px' })
document.querySelectorAll('[data-sample]').forEach((el) => io.observe(el))
