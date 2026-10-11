/* Rueca section of the board: Trove patterns, three directions, palette, pairings.
   Imagery here is stand-in only. Rafael is drawing the mark and pictures by hand. */
import { ruecaLink, ruecaPairs, ruecaPalette, ruecaTaglines, ruecaPaletteRules, ruecaTrove, ruecaWatch, ruecaDirections, ruecaEcho, ruecaPaid, ruecaPaidAlsoTried, hexRefs, ruecaHands, ruecaRamps } from './data.js'

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const $ = (id) => document.getElementById(id)
const font = (r) => `font-family:'${r.family}';font-weight:${r.weight};${r.tracking ? `letter-spacing:${r.tracking};` : ''}${r.settings ? `font-variation-settings:${r.settings};` : ''}`
const BODY = { family: 'IBM Plex Sans', weight: 400 }
const MONO = "'Geist Mono', ui-monospace, monospace"
/* the hand replaces the mono for labels and notes; S scales sizes since handwriting fonts run small */
let hand = ruecaHands.find((h) => h.star) || ruecaHands[0]
const HAND = () => `'${hand.family}', cursive`
const S = (px) => +(px * hand.size).toFixed(1)

{ const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = ruecaLink; document.head.append(l) }

/* paid trials: installed on this Mac, loaded by PostScript name with local(), never served */
const paidFamily = (p) => `Paid ${p.name}`
const paidOk = {}
const paidReady = Promise.all(ruecaPaid.map((p) => {
  const face = new FontFace(paidFamily(p), `local('${p.ps}')`, p.variable ? { weight: '300 900' } : {})
  return face.load().then((f) => { document.fonts.add(f); paidOk[p.id] = true }).catch(() => { paidOk[p.id] = false })
}))
const paidDisplay = (p) => ({ family: paidFamily(p), weight: p.variable ? p.weight : 'normal', tracking: p.tracking })
let directionFont = (ruecaPaid.find((p) => p.chosen) || {}).id || ''

const pal = (dark) => Object.fromEntries(ruecaPalette.map((c) => [c.name, dark ? c.dark : c.hex]))
/* ground and ink swap in dark; the accents use their lifted dark values */
const tones = (dark) => {
  const p = pal(dark)
  return dark
    ? { ...p, bg: p.Nogal, ink: p.Lana, mute: 'rgba(243,241,235,.7)', line: 'rgba(243,241,235,.22)', chip: 'rgba(243,241,235,.08)', onBright: '#181411' }
    : { ...p, bg: p.Lana, ink: p.Nogal, mute: 'rgba(24,20,17,.72)', line: 'rgba(24,20,17,.2)', chip: 'rgba(24,20,17,.06)', onBright: '#181411' }
}
const BRIGHTS = ['Achiote', 'Cochinilla', 'Malva', 'Cielo', 'Hoja', 'Gualda']

/* ---------- stand-in treatments, one per direction (600×260) ---------- */

/* external tangent points of two circles, for the drive band */
function band(c1, c2) {
  const dx = c2.x - c1.x, dy = c2.y - c1.y, d = Math.hypot(dx, dy)
  const a = Math.atan2(dy, dx), b = Math.acos((c1.r - c2.r) / d)
  const pt = (c, t) => [c.x + c.r * Math.cos(t), c.y + c.r * Math.sin(t)]
  return [[pt(c1, a + b), pt(c2, a + b)], [pt(c1, a - b), pt(c2, a - b)]]
}

function artGrabado(k, uid) {
  const W = { x: 372, y: 142, r: 84 }, F = { x: 548, y: 82, r: 13 }
  const [[a1, a2], [b1, b2]] = band(W, F)
  const spokes = Array.from({ length: 10 }, (_, i) => {
    const t = (i / 10) * Math.PI * 2
    return `<line x1="${W.x + 12 * Math.cos(t)}" y1="${W.y + 12 * Math.sin(t)}" x2="${W.x + (W.r - 8) * Math.cos(t)}" y2="${W.y + (W.r - 8) * Math.sin(t)}"/>`
  }).join('')
  const cross = (x, y) => `<path d="M${x - 7} ${y}h14M${x} ${y - 7}v14" stroke="${k.ink}" stroke-width=".8" opacity=".55"/>`
  return `<svg viewBox="0 0 600 260" role="img" aria-label="Stand-in: engraving slot beside a technical diagram of a spinning wheel">
    <defs><filter id="grain-${uid}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 .14  0 0 0 0 .1  0 0 0 0 .08  0 0 0 .22 0"/><feComposite in2="SourceGraphic" operator="in"/></filter></defs>
    <rect width="600" height="260" fill="${k.bg}"/>
    <rect x="12.5" y="12.5" width="575" height="235" fill="none" stroke="${k.ink}" stroke-width=".8" opacity=".35"/>
    ${cross(12.5, 12.5)}${cross(587.5, 12.5)}${cross(12.5, 247.5)}${cross(587.5, 247.5)}
    <g>
      <rect x="34.5" y="34.5" width="196" height="192" fill="${k.Malva}"/>
      <rect x="34.5" y="34.5" width="196" height="192" fill="#000" filter="url(#grain-${uid})"/>
      <path d="M34.5 34.5 230.5 226.5" stroke="${k.onBright}" stroke-width=".6" opacity=".4"/>
      <rect x="198" y="40" width="26" height="26" fill="${k.Gualda}"/>
      <text x="40" y="218" font-family="${HAND()}" font-size="${S(9)}" fill="${k.onBright}">IMAGE · rueca, engraved · flat malva</text>
    </g>
    <g fill="none" stroke="${k['Añil']}" stroke-width="1">
      <circle cx="${W.x}" cy="${W.y}" r="${W.r}"/><circle cx="${W.x}" cy="${W.y}" r="${W.r - 8}"/><circle cx="${W.x}" cy="${W.y}" r="12"/>
      <g stroke-width=".8">${spokes}</g>
      <circle cx="${F.x}" cy="${F.y}" r="${F.r}"/><circle cx="${F.x}" cy="${F.y}" r="4"/>
      <path d="M${F.x + 18} ${F.y}h34" stroke-width="2.4"/>
      <line x1="${a1[0]}" y1="${a1[1]}" x2="${a2[0]}" y2="${a2[1]}"/><line x1="${b1[0]}" y1="${b1[1]}" x2="${b2[0]}" y2="${b2[1]}"/>
      <path d="M${W.x} ${W.y + W.r + 14}v10M${W.x - 10} ${W.y + W.r + 24}h20" stroke-width=".8"/>
    </g>
    <g font-family="${HAND()}" font-size="${S(9.5)}" fill="${k.ink}" opacity=".8">
      <path d="M${W.x - 60} ${W.y + 58} 270 236" stroke="${k.ink}" stroke-width=".6" opacity=".6"/>
      <text x="252" y="246">rueda · wheel Ø 600</text>
      <text x="466" y="146">correa · drive band</text>
      <text x="${F.x - 32}" y="${F.y - 26}">huso · flyer</text>
    </g>
    <g stroke="${k.Achiote}" fill="none" stroke-width="1.6" stroke-linecap="round">
      <path d="M${F.x - 26} ${F.y - 4}c2-22 44-26 56-6 10 18-14 34-34 30-18-3-28-14-22-30"/>
      <path d="M${F.x - 8} ${F.y + 26}l-14 82m0 0-3-9m3 9 6-7"/>
    </g>
    <text x="${F.x - 96}" y="${F.y + 128}" font-family="${HAND()}" font-size="${S(10)}" fill="${k.Achiote}">the part that spins</text>
  </svg>`
}

function artHilo(k, uid, dark, word) {
  const hi = dark ? 'rgba(255,255,255,.07)' : 'rgba(255,255,255,.75)'
  const lo = dark ? 'rgba(0,0,0,.6)' : 'rgba(58,42,31,.28)'
  const t = (y, fill) => `<text x="300" y="${y}" text-anchor="middle" style="${font(word)}" font-size="112" fill="${fill}">rueca</text>`
  return `<svg viewBox="0 0 600 260" role="img" aria-label="Stand-in: wordmark pressed into felt, crossed by one red thread">
    <defs>
      <filter id="felt-${uid}" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" seed="4"/>
        <feColorMatrix values="0 0 0 0 ${dark ? 1 : .23}  0 0 0 0 ${dark ? .95 : .16}  0 0 0 0 ${dark ? .88 : .12}  0 0 0 ${dark ? .07 : .16} 0"/>
        <feComposite in2="SourceGraphic" operator="in"/>
      </filter>
    </defs>
    <rect width="600" height="260" fill="${k.bg}"/>
    ${t(149.5, lo)}${t(152.5, hi)}${t(151, k.bg)}
    <rect width="600" height="260" fill="#000" filter="url(#felt-${uid})"/>
    ${['Achiote', 'Cochinilla', 'Malva', 'Cielo', 'Hoja'].map((c, i) => `<path transform="translate(0 ${i * 4 - 8})" d="M-10 196C80 176 140 220 220 198C290 178 304 136 274 132C244 128 250 182 322 192C404 204 470 168 610 182" fill="none" stroke="${k[c]}" stroke-width="2.2" stroke-linecap="round"/>`).join('')}
    <text x="22" y="242" font-family="${HAND()}" font-size="${S(9)}" fill="${k.mute}">stand-in · debossed into felt · five dyed threads</text>
  </svg>`
}

function artTaller(k, uid, dark, word) {
  const stitch = (x, y) => `<path d="M${x - 5} ${y - 5}l10 10M${x + 5} ${y - 5}l-10 10" />`
  const ties = [56, 104, 152, 200].map((y) => stitch(300, y)).join('')
  return `<svg viewBox="0 0 600 260" role="img" aria-label="Stand-in: maker's mark incised in walnut, two panels tied with yellow thread">
    <defs>
      <filter id="grain-${uid}" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency=".004 .16" numOctaves="2" seed="9"/>
        <feColorMatrix values="0 0 0 0 .14  0 0 0 0 .09  0 0 0 0 .05  1.1 0 0 0 -.35"/>
        <feComposite in2="SourceGraphic" operator="in"/>
      </filter>
    </defs>
    <rect width="600" height="260" fill="${k.bg}"/>
    <rect x="16" y="16" width="276" height="228" rx="4" fill="#8A6A47"/>
    <rect x="16" y="16" width="276" height="228" rx="4" fill="#000" filter="url(#grain-${uid})"/>
    <text x="154" y="141.5" text-anchor="middle" style="${font(word)}" font-size="66" fill="rgba(255,236,210,.32)">rueca</text>
    <text x="154" y="140" text-anchor="middle" style="${font(word)}" font-size="66" fill="#2A1D14">rueca</text>
    <text x="154" y="176" text-anchor="middle" font-family="${HAND()}" font-size="${S(9.5)}" letter-spacing=".18em" fill="#2A1D14" opacity=".75">HECHO A MANO · MMXXVI</text>
    <rect x="308" y="16" width="276" height="228" rx="4" fill="${k.Cielo}"/>
    <g fill="none" stroke="${k.onBright}" stroke-width="1.2" opacity=".8">
      <rect x="342" y="58" width="208" height="128" rx="6"/>
      <path d="M342 82h208"/><circle cx="356" cy="70" r="3"/><circle cx="366" cy="70" r="3"/>
      <path d="M362 112h96M362 134h60M362 156h120"/>
      <circle cx="486" cy="112" r="5" fill="${k.Achiote}" stroke="none"/><circle cx="436" cy="134" r="5" fill="${k.Gualda}" stroke="none"/><circle cx="452" cy="156" r="5" fill="${k.Malva}" stroke="none"/>
    </g>
    <text x="324" y="230" font-family="${HAND()}" font-size="${S(9)}" fill="${k.onBright}">old tool · new tool</text>
    <g stroke="${k.Gualda}" stroke-width="2.4" stroke-linecap="round">${ties}</g>
  </svg>`
}

const ART = { grabado: artGrabado, hilo: artHilo, taller: artTaller }

/* the palette at work: a 1997-style platinum window holding a Figma-like canvas */
function paletteInUse(k, dark) {
  const stripes = Array.from({ length: 6 }, (_, i) => `<path d="M84 ${41 + i * 3}h432" stroke="${dark ? '#ffffff22' : '#00000026'}"/>`).join('')
  return `<svg viewBox="0 0 600 320" role="img" aria-label="Palette in use: a 90s platinum window with a design canvas of flat dyed brights">
    <rect width="600" height="320" fill="${k.bg}"/>
    <rect x="40.5" y="30.5" width="520" height="262" fill="${k.Platino}" stroke="${k.ink}"/>
    <rect x="40.5" y="30.5" width="520" height="22" fill="${k.Platino}" stroke="${k.ink}"/>
    ${stripes}
    <rect x="50.5" y="36.5" width="11" height="11" fill="${k.Platino}" stroke="${k.ink}"/>
    <rect x="232" y="34" width="136" height="15" fill="${k.Platino}"/>
    <text x="300" y="45" text-anchor="middle" font-family="${HAND()}" font-size="${S(10)}" fill="${k.ink}">rueca — telar.proto</text>
    <rect x="48.5" y="60.5" width="118" height="224" fill="${k.Rubia}"/>
    <g font-family="${HAND()}" font-size="${S(9)}" fill="#F3F1EB">
      <text x="58" y="78" opacity=".6">LAYERS</text><text x="58" y="98">▸ rueda</text><text x="58" y="116">▸ correa</text><text x="66" y="134" opacity=".75">huso</text><text x="58" y="152">▸ hilo</text>
    </g>
    <rect x="174.5" y="60.5" width="378" height="224" fill="${k.Lana}" stroke="${k.ink}" stroke-opacity=".3"/>
    <g>
      <circle cx="262" cy="150" r="46" fill="${k.Achiote}"/>
      <rect x="318" y="104" width="92" height="92" fill="${k.Malva}"/>
      <rect x="420" y="104" width="92" height="44" rx="22" fill="${k.Cielo}"/>
      <path d="M420 244V158h92z" fill="${k.Hoja}"/>
      <path d="M216 244a46 46 0 0 1 46-46v46z" fill="${k.Cochinilla}"/>
      <rect x="318" y="206" width="38" height="38" fill="${k.Gualda}"/>
    </g>
    <g fill="none" stroke="${k['Añil']}" stroke-width="1"><rect x="313.5" y="99.5" width="102" height="102"/></g>
    <g fill="#fff" stroke="${k['Añil']}">${[[313.5, 99.5], [415.5, 99.5], [313.5, 201.5], [415.5, 201.5]].map(([x, y]) => `<rect x="${x - 3}" y="${y - 3}" width="6" height="6"/>`).join('')}</g>
    <text x="318" y="92" font-family="${HAND()}" font-size="${S(9)}" fill="${k['Añil']}">malva · 92 × 92</text>
    <path d="M372 150l0 22 6-6 5 10 4-2-5-10 8 0z" fill="${k.Nogal}" stroke="#F3F1EB" stroke-width="1"/>
    <text x="40" y="312" font-family="${HAND()}" font-size="${S(9)}" fill="${k.mute}">platinum chrome · madder layers panel · dyed brights on wool paper · indigo selection</text>
  </svg>`
}

/* ---------- render ---------- */

export function renderRueca(dark) {
  if (!$('rueca')) return
  const k = tones(dark)
  const head = esc($('ruecaHead')?.value || 'Spin up a real tool.')
  const byId = Object.fromEntries(ruecaPairs.map((p) => [p.id, p]))
  const trove = Object.fromEntries(ruecaTrove.map((t) => [t.id, t]))

  $('rtrove').innerHTML = ruecaTrove.map((t, i) => `<article class="panel rpat" id="rt-${t.id}">
    <span class="k">0${i + 1}</span><b>${esc(t.title)}</b><p>${esc(t.says)}</p>
    <ul>${t.refs.map((r) => `<li><a href="${esc(r.u)}" target="_blank" rel="noopener noreferrer">${esc(r.t)}</a></li>`).join('')}</ul>
  </article>`).join('')

  $('rwatch').innerHTML = ruecaWatch.map((w) => `<p>${esc(w.t)} <a href="${esc(w.u)}" target="_blank" rel="noopener noreferrer">Saved item ↗</a></p>`).join('')

  const over = ruecaPaid.find((x) => x.id === directionFont && paidOk[x.id])
  $('rdirs').innerHTML = ruecaDirections.map((d, i) => {
    const p = over ? { display: paidDisplay(over) } : byId[d.pair]
    return `<article class="panel rdir" id="rd-${d.id}">
      <div class="hd"><span class="idx">0${i + 1}</span><b>${esc(d.name)}</b><span class="gl">${esc(d.gloss)}</span>${d.chosen ? '<span class="rec">Chosen</span>' : d.rec ? '<span class="rec">Recommended</span>' : ''}<span class="ln">“${esc(d.line)}”</span></div>
      <div class="stage" style="background:${k.bg};color:${k.ink}">
        <div class="copy">
          <span class="wm" style="${font(p.display)}">rueca</span>
          <h4 style="${font(p.display)}">${head}</h4>
          <p style="${font(BODY)}color:${k.mute}">Put a real design tool around the prototype you already have: inspector, timeline, layers and export, in any runtime.</p>
          <div class="cta"><span class="b" style="${font({ ...BODY, weight: 600 })}background:${k.Achiote};color:${k.onBright}">Install</span><span class="c" style="font-family:${MONO};background:${k.chip}">npx skills add rueca/rueca</span><span class="hn" style="font-family:${HAND()};font-size:${S(17)}px;color:${k.Achiote}">← one line, any runtime</span></div>
        </div>
        <div class="art">${ART[d.id](k, `${d.id}-${dark ? 'd' : 'l'}`, dark, p.display)}</div>
      </div>
      <dl>
        <div><dt>The idea</dt><dd>${esc(d.idea)}</dd></div>
        <div><dt>Type</dt><dd>${esc(d.type)}</dd></div>
        <div><dt>Imagery</dt><dd>${esc(d.image)}</dd></div>
        <div><dt>Watch</dt><dd>${esc(d.watch)}</dd></div>
      </dl>
      <div class="from"><span>Rests on</span>${d.from.map((f) => `<a href="#rt-${f}">${esc(trove[f].title)}</a>`).join('')}</div>
    </article>`
  }).join('')

  const GROUPS = [['base', 'Ground and ink: the rustic half'], ['bright', 'Brights: Figma’s hues, dyed and printed (the modern half)'], ['line', 'Line']]
  $('rpal').innerHTML = GROUPS.map(([g, label]) => `<div class="pg"><span class="pgl">${label}</span><div class="pgs">${ruecaPalette.filter((c) => c.group === g).map((c) => `<div class="sw">
    <div class="chips"><span style="background:${c.hex}"></span><span style="background:${c.dark}"></span></div>
    <b>${esc(c.name)}</b><code>${c.hex}${c.dark !== c.hex ? ` · ${c.dark}` : ''}</code>${c.figma ? `<code class="fg"><i style="background:${c.figma}"></i>Figma ${c.figma}</code>` : ''}<em>${esc(c.role)}</em>
  </div>`).join('')}</div></div>`).join('')
  $('rpal').innerHTML += `<div class="pg"><span class="pgl">Ramps: lights and darks in each family (base marked ●)</span><div class="ramps">${Object.entries(ruecaRamps).map(([name, r]) => `<div class="rr"><span class="rn"><b>${esc(name)}</b><em>${esc(r.note)}</em></span>${r.steps.map((x) => `<span class="rc" style="background:${x.hex}" title="${esc(name)} ${x.s} · ${x.hex}"><i style="color:${x.s >= 500 ? '#fff' : '#181411'}">${x.base ? '● ' : ''}${x.s}</i></span>`).join('')}</div>`).join('')}</div></div>`
  $('rpalrules').innerHTML = ruecaPaletteRules.map(([t, d]) => `<div><b>${esc(t)}</b><p>${esc(d)}</p></div>`).join('')
  $('rpaluse').innerHTML = paletteInUse(k, dark)

  $('rpairs').innerHTML = ruecaPairs.map((p) => `<article class="panel rpair">
    <div class="sp" style="background:${k.bg};color:${k.ink}">
      <span class="wm" style="${font(p.display)}">rueca</span>
      <span class="h" style="${font(p.display)}">${head}</span>
      <span class="bd" style="${font(BODY)}color:${k.mute}">Inspector, timeline, layers and export, around any prototype.</span>
    </div>
    <div class="tx">
      <div class="nm"><b>${esc(p.display.family)}</b><span>${esc(p.name)}</span>${p.pick ? '<span class="rec">Earlier pick</span>' : ''}</div>
      <p class="mk">${esc(p.makers)}</p>
      <p>${esc(p.why)}</p>
      <p class="echo">${esc(ruecaEcho[p.id] || '')}</p>
    </div>
  </article>`).join('')

  const dirName = Object.fromEntries(ruecaDirections.map((d) => [d.id, d.name]))
  $('rpaid').innerHTML = ruecaPaid.map((p) => {
    const d = paidDisplay(p), ok = paidOk[p.id] !== false
    return `<article class="panel rpair" id="rp-${p.id}">
    <div class="sp" style="background:${k.bg};color:${k.ink}">
      ${ok ? `<span class="wm" style="${font(d)}">rueca</span>
      <span class="h" style="${font(d)}">${head}</span>` : `<span class="h" style="color:${k.mute}">Not installed on this machine</span>`}
      <span class="bd" style="${font(BODY)}color:${k.mute}">Inspector, timeline, layers and export, around any prototype.</span>
    </div>
    <div class="tx">
      <div class="nm"><b>${esc(p.name)}</b>${p.chosen ? '<span class="rec">Chosen</span>' : p.star ? '<span class="rec">Strongest fit</span>' : ''}<span class="trial">Trial · this Mac only</span></div>
      <p class="mk"><a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">${esc(p.foundry)} ↗</a> · fits ${p.fit.map((f) => esc(dirName[f])).join(', ')}</p>
      <p>${esc(p.why)}</p>
      <p class="echo">${esc(p.watch)}</p>
    </div>
  </article>`
  }).join('')
  $('rpaidalso').textContent = ruecaPaidAlsoTried
  $('rdisplay').innerHTML = `<option value="">As drafted (free fonts)</option>` + ruecaPaid.filter((p) => paidOk[p.id] !== false).map((p) => `<option value="${p.id}"${p.id === directionFont ? ' selected' : ''}>${esc(p.name)} (paid trial)</option>`).join('')

  $('rhex').innerHTML = hexRefs.map((r) => `<a href="https://swipe.hex.inc/" target="_blank" rel="noopener noreferrer"><div class="im" style="background-image:url('${r.img}')"></div><p><b>${esc(r.t)}</b>${esc(r.take)}</p></a>`).join('')

  $('rhand').innerHTML = ruecaHands.map((h) => `<option value="${h.id}"${h.id === hand.id ? ' selected' : ''}>${esc(h.family)}${h.star ? ' ★' : ''}</option>`).join('')
  $('rhands').innerHTML = ruecaHands.map((h) => `<button type="button" class="panel rh${h.id === hand.id ? ' on' : ''}" data-h="${h.id}" aria-pressed="${h.id === hand.id}">
    <span class="s" style="font-family:'${h.family}',cursive;font-size:${(22 * h.size).toFixed(1)}px;color:${k.ink};background:${k.bg}">huso · flyer — rueda Ø 600 <em style="color:${k.Achiote};font-style:normal">the part that spins →</em></span>
    <span class="t"><b>${esc(h.family)}</b>${h.star ? '<span class="rec">Chosen</span>' : ''}</span><span class="d">${esc(h.note)}</span></button>`).join('')

  $('rtags').innerHTML = ruecaTaglines.map((t) => `<button type="button" class="chip" data-t="${esc(t)}">${esc(t)}</button>`).join('')
}

export function wireRueca(rerender) {
  paidReady.then(rerender)
  $('rdisplay')?.addEventListener('change', (e) => { directionFont = e.target.value; rerender() })
  const setHand = (id) => { hand = ruecaHands.find((h) => h.id === id) || ruecaHands[0]; document.fonts.load(`16px '${hand.family}'`).finally(rerender) }
  $('rhand')?.addEventListener('change', (e) => setHand(e.target.value))
  $('rhands')?.addEventListener('click', (e) => { const b = e.target.closest('[data-h]'); if (b) setHand(b.dataset.h) })
  document.fonts.load(`16px '${hand.family}'`).then(rerender)
  $('ruecaHead')?.addEventListener('input', rerender)
  $('rtags')?.addEventListener('click', (e) => {
    const b = e.target.closest('[data-t]'); if (!b) return
    $('ruecaHead').value = b.dataset.t; rerender()
  })
}
