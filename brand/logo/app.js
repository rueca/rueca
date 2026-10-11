import { marks, svg, base, ORIGINAL, belt, beltPts, SMALL, G, gCirc, gLine, gCross, gNote, circ, line, pt, P } from './marks.js'

const $ = (s) => document.querySelector(s)
const DYE = { light: { band: '#F2C744', wheel: '#5DB4E8', whorl: '#E8582C' }, dark: { band: '#F5D05A', wheel: '#6FC0EE', whorl: '#F06A3E' } }
const state = { guides: true, colour: false, dark: false, p: { w: 25, Ra: 96.1, Rb: 64, dist: 124, gapA: 22.5, gapB: 22.5 } }

const ink = () => (state.dark ? '#f3f1eb' : '#181411')
const paper = () => (state.dark ? '#201c19' : '#faf8f4')
const opts = (over = {}) => ({ ink: ink(), paper: paper(), dye: state.colour ? DYE[state.dark ? 'dark' : 'light'] : null, small: false, p: state.p, ...over })

/* ---------------------------------------------------------------------------
   Concepts: the copy. Tag: close (polish) · twist · new.
--------------------------------------------------------------------------- */
const CONCEPTS = [
  { id: 'pulido', no: 'I', name: 'Pulido', gloss: 'Polished', tag: 'close',
    idea: 'Your mark, rebuilt: one stroked band on true tangents, both discs concentric with their loops, optical gaps, and a heavier cut for 16–24px.',
    oldnew: 'The silhouette stays. The change is in the drawing, which is what Lámina is about: the same object, drawn exactly.',
    risk: 'It\'s a polish, not a new idea. Still the strongest base for everything below.' },
  { id: 'mando', no: 'II', name: 'Mando', gloss: 'The wheel is a knob', tag: 'close',
    idea: 'A knob\'s scale (eleven ticks over 270°, open at the bottom where the band leaves) sits in the gap round the drive wheel, and one notch cuts the disc. The drive wheel becomes the knob you tune with.',
    oldnew: 'The best old/new split in one shape: a spinning wheel that is also the control you tune a prototype with.',
    risk: 'The ticks vanish under 32px, which is fine: the small cut is Pulido plus the notch, and the notch alone still says knob. More ticks and it turns into a gear.' },
  { id: 'torcido', no: 'III', name: 'Torcido', gloss: 'The crossed band', tag: 'twist',
    idea: 'The band crosses between the pulleys, over and under, like thread. On a real wheel a crossed band turns the whorl the other way, and "rueca" also means a twist.',
    oldnew: 'The over/under break is an engraver\'s convention, and it gives the mark motion without any swooshes.',
    risk: 'With equal pulleys it\'s an infinity sign. The size difference has to stay big (2:1 here).' },
  { id: 'doble', no: 'IV', name: 'Doble', gloss: 'Double drive', tag: 'twist',
    idea: 'A double-drive wheel runs one band round twice, to the whorl and to the bobbin. Two nested loops, concentric at both ends, close up towards the whorl. One dot marks the axle.',
    oldnew: 'It\'s the WheelField hero texture in two rings. The mark and the pattern become the same drawing, so the texture can come back as the mark repeated.',
    risk: 'Without the whorl disc it reads less as a machine and more as a contour or a paperclip.' },
  { id: 'rayos', no: 'V', name: 'Rayos', gloss: 'Spokes', tag: 'close',
    idea: 'The drive wheel drawn as a wheel: rim, eight spokes, hub. The most literal reading of "rueca"; it falls back to Pulido under 32px.',
    oldnew: 'Mostly old. It would be the engraved version for large, rare moments (the footer title block, a print), not the everyday mark.',
    risk: 'Close to the "cartoon wheel" in the don\'ts if it\'s drawn loosely. Only works exact.' },
  { id: 'hilo', no: 'VI', name: 'Hilo', gloss: 'Thread out', tag: 'twist', lockupOnly: true,
    idea: 'A lockup move, not a new mark. The band\'s level lower run carries on as one thread under the word, thinning to a hairline and ending loose. The word sits on the drive band.',
    oldnew: '"Raw fibre in, thread out" in one line. It also gives the site a rule to underline with: the thread.',
    risk: 'Only works horizontally, and the tail needs space. The stacked and mark-only versions are just Pulido.' },
  { id: 'huso', no: 'VII', name: 'Huso', gloss: 'The flyer u', tag: 'twist', lockupOnly: true,
    idea: 'The u in the wordmark becomes the flyer, the U-shaped arm with hooks that winds thread onto the bobbin. Here it\'s Signifier\'s own u with a row of hooks down one arm in the red pen, and the gap after it opened a touch.',
    oldnew: 'Old part hidden in a modern word. Nobody needs to get it for it to work; the people who spin will.',
    risk: 'Hooks on a serif u can look like a broken glyph. They need to be hand-drawn into Signifier\'s stroke, not stuck on.' },
  { id: 'erre', no: 'VIII', name: 'Erre', gloss: 'An r made of the wheel', tag: 'new',
    idea: 'A serif r already has a wheel and a whorl: the shoulder is an arc, the ball terminal a dot. Here the shoulder is a quarter of the drive wheel and the ball is the whorl, at the band\'s weight.',
    oldnew: 'A monogram from the same parts as the main mark, for places a wide mark can\'t go: the favicon, an avatar, the shell toolbar.',
    risk: 'On its own it\'s "an r", like many. It earns its place next to the wheel mark, not instead of it.' },
  { id: 'malacate', no: 'IX', name: 'Malacate', gloss: 'The spindle whorl seal', tag: 'new',
    idea: 'Malacate is Spanish and Nahuatl for the clay whorl on a hand spindle. Pre-Columbian ones were stamped with hatched half-circles forming a star. A round seal with a hole through it.',
    oldnew: 'The oldest spinning tool in the Americas, from the same place as the dyes (achiote, cochinilla). Round, so it\'s a ready app icon and avatar; the half-circles also read as a dial.',
    risk: 'It drops the wheel, the most recognisable part of "rueca". It\'s the bigger departure, and a strong one for a stamp or seal.' },
  { id: 'lamina', no: 'X', name: 'Lámina', gloss: 'The plate emblem', tag: 'new',
    idea: 'Pulido as Fig. I on a round plate, lettered in Plex small caps with the tagline in the red-pen hand. An emblem for the README, stickers, the footer and social avatars.',
    oldnew: 'A secondary mark, and the direction\'s name made literal. It sits next to the main mark, it doesn\'t replace it.',
    risk: 'Lettering is unreadable under 48px; the small cut is the ring and the mark.' },
]

/* ---------------------------------------------------------------------------
   Lockups. The word is live type; Hilo and Huso are measured after fonts load.
--------------------------------------------------------------------------- */
function markSvg(id, h, o = opts(), extra = '') {
  const small = h <= 24
  const useId = (id === 'hilo' || id === 'huso') ? 'pulido' : id
  return svg(useId, { ...o, small }, { guides: false, cls: extra, title: `${id} mark` }).replace('<svg ', `<svg height="${h}" style="height:${h}px;width:auto;display:block" `)
}

function lockup(id, h) {
  if (id === 'hilo') return `<div class="hilo" data-h="${h}"></div>`
  if (id === 'huso') return `<div class="huso" data-h="${h}"></div>`
  const square = id === 'malacate' || id === 'lamina' || id === 'erre'
  const fs = square ? h * 0.92 : h * 1.42
  return `<span style="display:inline-flex;align-items:baseline;gap:${h * (square ? 0.26 : 0.34)}px;color:var(--ink)">${markSvg(id, h)}<span class="disp" style="font-size:${fs}px;line-height:.8;position:relative;top:${square ? -h * 0.12 : h * 0.02}px">rueca</span></span>`
}

const xHeight = (() => {
  const c = document.createElement('canvas').getContext('2d')
  return (fs) => { c.font = `400 ${fs}px "Rueca Display"`; return c.measureText('x').actualBoundingBoxAscent }
})()
const advance = (() => {
  const c = document.createElement('canvas').getContext('2d')
  return (t, fs) => { c.font = `400 ${fs}px "Rueca Display"`; return c.measureText(t).width }
})()

/* VI · Hilo: mark + word sitting on the band's lower run, which thins and ends loose */
function drawHilo(el) {
  const h = +el.dataset.h
  const o = opts()
  const g = base(o.p)
  const k = h / g.H // svg units → px
  const fs = g.H * 1.32 // word size in svg units
  const gap = g.H * 0.3
  const wx = g.W + gap
  const word = advance('rueca', fs)
  const yb = g.A[1] + g.Ra + g.w / 2 // outer bottom of the band = the run's lower edge
  const top = yb - g.w
  const baseY = top - g.w * 0.55 // the word sits just above the band
  const x0 = g.A[0], x1 = wx + word * 0.12, xe = wx + word + g.w * 1.2
  const col = o.dye ? o.dye.band : o.ink
  // the run: full weight under the wheel, thinning to a 2.4 hairline by the word's first letters
  const hair = 2.6
  const run = `M ${x0} ${top} C ${x0 + (x1 - x0) * 0.55} ${top} ${x1 - 30} ${yb - hair} ${x1} ${yb - hair} L ${xe} ${yb - hair} L ${xe} ${yb} L ${x0} ${yb} Z`
  // loose end: the thread lifts and frays into three fibres
  const ex = xe, ey = yb - hair / 2
  const fibres = [[46, -34, 72, -40], [52, -20, 84, -18], [40, -46, 54, -66]]
    .map(([a, b, c, d], i) => `<path d="M ${ex} ${ey} c ${a * 0.5} 0 ${a} ${b * 0.4} ${c} ${d}" fill="none" stroke="${col}" stroke-width="${i ? 1.4 : 2.2}" stroke-linecap="round"/>`).join('')
  const W = xe + 90
  el.innerHTML = `<svg viewBox="0 0 ${W} ${g.H}" height="${h}" style="height:${h}px;width:auto;overflow:visible;display:block">
    ${svg('pulido', o).replace(/^<svg[^>]*>/, '<g>').replace(/<\/svg>$/, '</g>')}
    <path d="${run}" fill="${col}"/>${fibres}
    <text x="${wx}" y="${baseY}" font-family="var(--display)" font-size="${fs}" fill="${o.ink}" letter-spacing="${-0.02 * fs}" style="font-synthesis:none">rueca</text>
  </svg>`
}

/* VII · Huso: the real u from the display face, with the flyer's hooks drawn onto its arms in the
   red pen. The arms' outer edges are found by rendering the glyph and scanning one row. */
function uStems(fs) {
  const c = document.createElement('canvas'); c.width = Math.ceil(fs * 1.2); c.height = Math.ceil(fs * 1.2)
  const x = c.getContext('2d', { willReadFrequently: true })
  x.font = `400 ${fs}px "Rueca Display"`; x.fillStyle = '#000'; x.textBaseline = 'alphabetic'
  const base = Math.round(fs)
  x.fillText('u', 0, base)
  const xh = x.measureText('x').actualBoundingBoxAscent
  const row = (y) => { const d = x.getImageData(0, Math.round(y), c.width, 1).data; const on = []; for (let i = 0; i < c.width; i++) on.push(d[i * 4 + 3] > 128); return on }
  const r = row(base - xh * 0.55)
  const runs = []; let st = -1
  r.forEach((v, i) => { if (v && st < 0) st = i; if (!v && st >= 0) { runs.push([st, i]); st = -1 } })
  return { xh, runs } // runs[0] = left arm, runs[1] = right arm
}
function drawHuso(el) {
  const h = +el.dataset.h
  const o = opts()
  const fs = h * 2.1
  const { xh, runs } = uStems(fs)
  const tr = -0.02 * fs
  const sw = fs * 0.02, hl = fs * 0.06
  const room = hl * 1.1 // only the gap after the u opens, so the hooks have air
  const rW = advance('r', fs) + tr
  const ux = rW, ex = ux + advance('u', fs) + tr + room
  const baseY = fs * 0.92, topY = baseY - xh
  const pen = o.dye ? o.dye.whorl : 'var(--pen)'
  let hooks = ''
  if (runs.length >= 2) {
    const R = ux + runs[1][1]
    // a flyer's hooks, in a row down the outside of one arm
    for (let i = 0; i < 4; i++) {
      const y = topY + xh * (0.14 + i * 0.2)
      hooks += `<path d="M ${R + sw * 0.4} ${y} h ${hl * 0.6} q ${hl * 0.4} 0 ${hl * 0.4} ${-hl * 0.4}" fill="none" stroke="${pen}" stroke-width="${sw * 0.85}" stroke-linecap="round"/>`
    }
  }
  const T = (x, t, ls = 0) => `<text x="${x}" y="${baseY}" font-family="var(--display)" font-size="${fs}" fill="${o.ink}" letter-spacing="${ls}" style="font-synthesis:none">${t}</text>`
  const W = ex + advance('eca', fs) + tr * 3
  el.innerHTML = `<svg viewBox="0 ${baseY - fs * 0.78} ${W} ${fs * 0.95}" height="${h * 1.2}" style="height:${h * 1.2}px;width:auto;overflow:visible;display:block">
    ${T(0, 'r')}${T(ux, 'u')}${T(ex, 'eca', tr)}${hooks}
  </svg>`
}

/* ---------------------------------------------------------------------------
   1 · Audit: Rafael's file (faint), the rebuild, the construction and notes
--------------------------------------------------------------------------- */
function renderAudit() {
  const o = opts()
  const g = base(state.p)
  const og = ORIGINAL
  const file = `<svg viewBox="-24 -24 358 266"><g>${marks.original.draw({ ...o, dye: null })}</g>
    <g class="guides">${G(gCirc(og.B, og.Rb) + gCross(og.B, 9) + gCross(og.whorl.c, 5).replace(/var\(--anil\)/g, 'var(--pen)') + gCirc(og.A, og.Ra) + gCross(og.A))}
      ${circ(og.whorl.c, og.whorl.r + 4, 'fill="none" stroke="var(--pen)" stroke-width="1.4" vector-effect="non-scaling-stroke"')}
      ${line([og.B[0] - 12, og.whorl.c[1] - 34], [og.B[0] - 12, og.whorl.c[1] - 64], 'stroke="var(--pen)" stroke-width="1" vector-effect="non-scaling-stroke"')}
      ${gNote([og.B[0] - 46, og.whorl.c[1] - 72], 'sits high', 'start', 26)}
      ${gNote([og.B[0] + 30, og.B[1] - 96], 'band thins ~1 unit here', 'middle', 24)}</g></svg>`
  const rebuilt = `<svg viewBox="${-24} ${-24} ${g.W + 48} ${g.H + 48}">${marks.pulido.draw(o)}${marks.pulido.guides(o)}</svg>`
  // close-up: the file's whorl in its loop. Blue: the loop's centre. Red: the whorl's.
  const zc = og.B, zr = 48
  const cross = (c, col, k = 6) => line([c[0] - k, c[1]], [c[0] + k, c[1]], `stroke="${col}" stroke-width="1.2" vector-effect="non-scaling-stroke"`) + line([c[0], c[1] - k], [c[0], c[1] + k], `stroke="${col}" stroke-width="1.2" vector-effect="non-scaling-stroke"`)
  const zoom = `<svg viewBox="${zc[0] - zr} ${zc[1] - zr} ${zr * 2} ${zr * 2}" style="overflow:hidden">
    <path d="${belt(og.A, og.Ra, og.B, og.Rb)}" fill="none" stroke="${o.ink}" stroke-opacity=".18" stroke-width="${og.w}"/>
    ${circ(og.whorl.c, og.whorl.r, `fill="${o.ink}" fill-opacity=".85"`)}
    ${circ(og.B, og.Rb - og.w / 2 - 20.8, 'fill="none" stroke="var(--anil)" stroke-width="1" stroke-dasharray="3 3" vector-effect="non-scaling-stroke"')}
    ${cross(og.B, 'var(--anil)')}${cross(og.whorl.c, 'var(--pen)')}
    ${line([og.B[0] + 26, og.B[1]], [og.B[0] + 26, og.whorl.c[1]], 'stroke="var(--pen)" stroke-width="1" vector-effect="non-scaling-stroke"')}
    <text x="${og.B[0] + 29}" y="${og.B[1] + 0.6}" font-size="4.4" fill="var(--pen)" font-family="var(--body)">2.4</text>
    <text x="${og.B[0] - 45}" y="${og.B[1] - 40}" font-size="6.5" fill="var(--pen)" font-family="var(--hand)">gap 18.4</text>
    <text x="${og.B[0] - 45}" y="${og.B[1] + 44}" font-size="6.5" fill="var(--pen)" font-family="var(--hand)">gap 23.2</text>
  </svg>`
  $('#auditfig').innerHTML = `<div class="pair"><figure>${file}<figcaption>Your file</figcaption></figure><figure>${rebuilt}<figcaption>Rebuilt (I · Pulido)</figcaption></figure></div>
    <figure class="zoom">${zoom}<figcaption>Close-up: the whorl’s centre (red) against its loop’s (blue)</figcaption></figure>`
}

const KNOBS = [
  ['w', 'Band weight', 16, 36, 0.5], ['gapA', 'Gap, wheel', 10, 34, 0.5], ['gapB', 'Gap, whorl', 8, 30, 0.5],
  ['Rb', 'Whorl loop', 40, 70, 0.5], ['dist', 'Centre distance', 100, 170, 0.5],
]
function renderKnobs() {
  const box = $('#knobs')
  for (const [k, label, min, max, step] of KNOBS) {
    const l = document.createElement('label')
    l.innerHTML = `<span>${label}</span><input type="range" min="${min}" max="${max}" step="${step}" value="${state.p[k]}"><output>${state.p[k]}</output>`
    const input = l.querySelector('input'), out = l.querySelector('output')
    input.addEventListener('input', () => { state.p[k] = +input.value; out.textContent = input.value; renderAll() })
    box.appendChild(l)
  }
  const reset = document.createElement('div')
  reset.className = 'row'
  reset.innerHTML = `<button class="tg" id="kreset">Reset</button><button class="tg" id="kcopy">Copy SVG</button>`
  box.appendChild(reset)
  $('#kreset').onclick = () => { Object.assign(state.p, { w: 25, Ra: 96.1, Rb: 64, dist: 124, gapA: 22.5, gapB: 22.5 }); box.querySelectorAll('label').forEach((l, i) => { const k = KNOBS[i][0]; l.querySelector('input').value = state.p[k]; l.querySelector('output').textContent = state.p[k] }); renderAll() }
  $('#kcopy').onclick = () => navigator.clipboard?.writeText(svg('pulido', { ...opts(), dye: null, ink: '#181411' }))
}

/* ---------------------------------------------------------------------------
   2 · Plates
--------------------------------------------------------------------------- */
function ladder(id) {
  const sizes = id === 'malacate' || id === 'lamina' || id === 'erre' ? [72, 40, 24, 16] : [56, 32, 20, 16]
  const useId = id === 'hilo' || id === 'huso' ? 'pulido' : id
  const items = sizes.map((s) => `<figure>${markSvg(useId, s)}<figcaption>${s}</figcaption></figure>`).join('')
  const dark = `<figure class="push"><div class="dark">${markSvg(useId, 28, opts({ ink: '#f3f1eb', paper: '#151210', dye: state.colour ? DYE.dark : null }))}</div><figcaption>night</figcaption></figure>`
  const tile = `<figure><div class="tile" style="background:#E8582C">${markSvg(useId, id === 'malacate' || id === 'lamina' || id === 'erre' ? 30 : 22, opts({ ink: '#181411', paper: '#E8582C', dye: null }))}</div><figcaption>Achiote</figcaption></figure>`
  return `<div class="ladder">${items}${dark}${tile}</div>`
}

function renderPlates() {
  $('#plates').innerHTML = CONCEPTS.map((c) => {
    const big = c.lockupOnly
      ? `<div class="stage word">${lockup(c.id, c.id === 'huso' ? 64 : 62)}</div>`
      : `<div class="stage">${svg(c.id, opts(), { guides: true, cls: 'big', title: c.name })}</div>`
    return `<article class="plate" id="c-${c.id}">
      <div class="head"><span class="no">${c.no}</span><h3>${c.name}</h3><span class="gloss">${c.gloss}</span><span class="tag ${c.tag}">${c.tag === 'close' ? 'close' : c.tag === 'twist' ? 'twist' : 'new'}</span></div>
      ${big}
      ${c.lockupOnly ? '' : ladder(c.id)}
      ${c.lockupOnly ? '' : `<div class="lock">${lockup(c.id, 44)}</div>`}
      <div class="text"><p>${c.idea}</p><p><span class="k">Old / new</span>${c.oldnew}</p><p class="risk"><span class="k">Watch</span>${c.risk}</p></div>
    </article>`
  }).join('')
}

/* ---------------------------------------------------------------------------
   3 · In context
--------------------------------------------------------------------------- */
function renderContext() {
  const ids = ['pulido', 'mando', 'torcido', 'doble', 'erre', 'malacate']
  $('#ctx').innerHTML = ids.map((id) => {
    const c = CONCEPTS.find((x) => x.id === id)
    const square = id === 'malacate' || id === 'erre'
    return `<div class="cell">
      <div class="nav">${lockup(id, square ? 22 : 17)}<span class="links"><span>Shells</span><span>Kit</span><span>Docs</span></span></div>
      <div class="tab">${markSvg(id, square ? 16 : 12)}<span>Rueca · Spin your prototype into a tool</span></div>
      <div class="row">
        <div class="appicon" style="background:#181411">${markSvg(id, square ? 40 : 26, opts({ ink: '#F3F1EB', paper: '#181411', dye: state.colour ? DYE.dark : null }))}</div>
        <div class="appicon" style="background:#E8582C">${markSvg(id, square ? 40 : 26, opts({ ink: '#181411', paper: '#E8582C', dye: null }))}</div>
        <div class="avatar" style="background:#F2C744">${markSvg(id, square ? 30 : 18, opts({ ink: '#181411', paper: '#F2C744', dye: null }))}</div>
        <div class="avatar" style="background:var(--chip)">${markSvg(id, square ? 26 : 13)}</div>
      </div>
      <div class="name">${c.no} · ${c.name}</div>
    </div>`
  }).join('')
}

/* ---------------------------------------------------------------------------
   4 · Recommendation, 5 · References
--------------------------------------------------------------------------- */
function renderRec() {
  $('#recbody').innerHTML = `
    <div>
      <p style="margin-top:0"><b>Keep the wheel.</b> Your mark already has the right idea and the right silhouette. I'd ship <b>I · Pulido</b> as the drawing, then pick one twist to carry the old/new tension:</p>
      <ol>
        <li><b>II · Mando</b> if the mark should say "controls". The notch is the cheapest possible change, and the knob is the product. My first pick.</li>
        <li><b>VI · Hilo</b> as the horizontal lockup whichever mark wins: the band becoming the thread under the word is free, and it gives the site a rule.</li>
        <li><b>IV · Doble</b> if WheelField should come back: the mark and the hero texture become one drawing.</li>
      </ol>
    </div>
    <div>
      <p style="margin-top:0"><b>Around it:</b></p>
      <ol>
        <li><b>VIII · Erre</b> as the small-space monogram (favicon, shell toolbar), built from the same weights.</li>
        <li><b>X · Lámina</b> as the emblem for the README, stickers and the footer title block.</li>
        <li><b>IX · Malacate</b> is the one to keep in the drawer. It's the strongest "different" idea, and it would make a good seal for a printed piece or a v1.0 moment.</li>
        <li>Drop <b>VII · Huso</b> unless you want to hand-letter it. Stuck-on hooks don't hold up.</li>
      </ol>
      <p class="hand" style="margin-top:16px">all geometry is stand-in; redraw by hand</p>
    </div>`
}

const REFS = [
  ['Two solid circles cradled in a broken ring', 'https://www.pinterest.com/pin/471329917245340461/', 'Trove: reads as rotation and pairing at once. Precedent for the current mark\'s grammar.'],
  ['Two counterpoint circles, one solid, one knocked out', 'https://www.are.na/block/5615166', 'Trove: rotational symmetry from two discs. Fed III · Torcido.'],
  ['Ghia, 1960s', 'https://www.are.na/block/5640995', 'Trove: a quarter-circle mass and one dot. Fed VIII · Erre.'],
  ['Kinetica: split circles repeated as pattern', 'https://www.are.na/block/20067293', 'Trove: the mark is the pattern. Fed IV · Doble.'],
  ['Moscow manhole cover', 'https://www.are.na/', 'Trove: a figure made only from interrupted concentric rings. Fed IV · Doble.'],
  ['Radial line mark, varying stroke lengths', 'https://uk.pinterest.com/pin/777715429382976698/', 'Trove: volume from flat rules. Fed II · Mando\'s teeth.'],
  ['Adinkra symbols', 'https://i.pinimg.com/564x/ab/d3/16/abd316511fe3762f46207a6baca7d284.jpg', 'Trove: how much identity a mark keeps at tiny scale. Fed IX · Malacate.'],
  ['William Spratling, Taxco silver, 1940s', 'https://letsbefrank.club/inspiredby', 'Trove: Mexican craft geometry with a spiral centre. Fed IX · Malacate.'],
  ['Product spec styled as a brand mark', 'https://www.are.na/block/27006889', 'Trove: glyph, code and diameter set as one lockup. Fed X · Lámina.'],
  ['Ayush Soni, brand kit snippets', 'https://x.com/ayushsoni_io/status/2051990880828235937', 'Trove: blueprint annotation round a mark. The construction overlay on every plate.'],
  ['Adam Ho, Rome', 'https://www.adamho.com/#rome', 'Trove: a mark drawn from the wordmark\'s own strokes. Fed VII · Huso.'],
  ['Swiss PTT', 'https://www.are.na/', 'Trove: a letter that doubles as a symbol. Fed VIII · Erre.'],
  ['Spindle whorls, Cholula (U. Calgary)', 'https://antharky.ucalgary.ca/mccafferty/cholula-mexico/material-culture/spindle-whorls', 'Web: malacate decoration, including hatched half-circles forming a star.'],
  ['Parts of the spinning wheel (Joy of Handspinning)', 'https://www.joyofhandspinning.com/wheel-parts.shtml', 'Web: drive band, whorl, flyer and its hooks, double drive vs scotch tension.'],
  ['rueca (Wiktionary)', 'https://en.wiktionary.org/wiki/rueca', 'Web: distaff, spinning wheel, and "a turn or twist".'],
]
function renderRefs() {
  $('#reflist').innerHTML = REFS.map(([t, u, n]) => `<li><a href="${u}" target="_blank" rel="noreferrer">${t}</a><br><span>${n}</span></li>`).join('')
}

function renderBar() { $('#barlogo').innerHTML = lockup('pulido', 18) }

function renderAll() {
  renderAudit(); renderPlates(); renderContext(); renderBar()
  document.querySelectorAll('.hilo').forEach(drawHilo)
  document.querySelectorAll('.huso').forEach(drawHuso)
}

/* toggles */
const tog = (id, key, after) => {
  const b = $(id)
  b.onclick = () => { state[key] = !state[key]; b.setAttribute('aria-pressed', state[key]); after?.(); renderAll() }
}
tog('#tg-guides', 'guides', () => document.body.classList.toggle('guides', state.guides))
tog('#tg-colour', 'colour')
tog('#tg-theme', 'dark', () => document.documentElement.dataset.theme = state.dark ? 'dark' : 'light')

renderKnobs(); renderRec(); renderRefs(); renderAll()
document.fonts.ready.then(renderAll)
