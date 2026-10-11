/* Rueca logo study: the marks, as geometry.
   Every mark is built from circles and their tangents, like a plate in an
   engraved encyclopaedia, so each one can show its own construction (Añil)
   on top of the drawing (Nogal). Coordinates are SVG (y down); angles are
   SVG angles, so a growing angle turns clockwise on screen.

   A mark is { id, vb: [w, h], draw(o) → svg string, guides(o) → svg string }.
   o = { ink, paper, dye: { wheel, whorl, band } | null, small: bool, p: params } */

export const TAU = Math.PI * 2
const r2 = (n) => Math.round(n * 100) / 100
const pt = (c, r, a) => [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]
const norm = (a) => ((a % TAU) + TAU) % TAU
const P = ([x, y]) => `${r2(x)} ${r2(y)}`

/** SVG arc from angle a0 to a1 on circle (c, r), going the way that passes through angle `via`. */
function arc(c, r, a0, a1, via) {
  const cw = norm(a1 - a0) // span going clockwise (growing angle)
  const goCw = norm(via - a0) < cw
  const span = goCw ? cw : TAU - cw
  return `A ${r2(r)} ${r2(r)} 0 ${span > Math.PI ? 1 : 0} ${goCw ? 1 : 0} ${P(pt(c, r, a1))}`
}

/** Open belt (the drive band as it really runs): centreline round two pulleys on their external tangents. */
export function belt(A, Ra, B, Rb) {
  const th = Math.atan2(B[1] - A[1], B[0] - A[0])
  const d = Math.hypot(B[0] - A[0], B[1] - A[1])
  const al = Math.acos((Ra - Rb) / d)
  const aTop = th - al, aBot = th + al
  return `M ${P(pt(A, Ra, aTop))} L ${P(pt(B, Rb, aTop))} ${arc(B, Rb, aTop, aBot, th)} L ${P(pt(A, Ra, aBot))} ${arc(A, Ra, aBot, aTop, th + Math.PI)} Z`
}

/** Tangent points of the open belt, for guides. */
export function beltPts(A, Ra, B, Rb) {
  const th = Math.atan2(B[1] - A[1], B[0] - A[0])
  const al = Math.acos((Ra - Rb) / Math.hypot(B[0] - A[0], B[1] - A[1]))
  return [pt(A, Ra, th - al), pt(B, Rb, th - al), pt(B, Rb, th + al), pt(A, Ra, th + al)]
}

/** Crossed belt (internal tangents): the band crosses between the pulleys and turns the whorl backwards.
    Returns the two runs separately so the "under" run can be broken at the crossing. */
export function crossedBelt(A, Ra, B, Rb) {
  const th = Math.atan2(B[1] - A[1], B[0] - A[0])
  const d = Math.hypot(B[0] - A[0], B[1] - A[1])
  const al = Math.acos((Ra + Rb) / d)
  const a1 = th - al, a2 = th + al
  const pA1 = pt(A, Ra, a1), pB1 = pt(B, Rb, a1 + Math.PI)
  const pA2 = pt(A, Ra, a2), pB2 = pt(B, Rb, a2 + Math.PI)
  // run 1: A(a1) → B(a1+π), round B's far side → B(a2+π), run 2 → A(a2), round A's far side → A(a1)
  const full = `M ${P(pA1)} L ${P(pB1)} ${arc(B, Rb, a1 + Math.PI, a2 + Math.PI, th)} L ${P(pA2)} ${arc(A, Ra, a2, a1, th + Math.PI)} Z`
  return { full, run1: [pA1, pB1], run2: [pB2, pA2], pts: [pA1, pB1, pB2, pA2] }
}

function intersect(a, b, c, d) {
  const den = (a[0] - b[0]) * (c[1] - d[1]) - (a[1] - b[1]) * (c[0] - d[0])
  const t = ((a[0] - c[0]) * (c[1] - d[1]) - (a[1] - c[1]) * (c[0] - d[0])) / den
  return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]
}
const circ = (c, r, attrs = '') => `<circle cx="${r2(c[0])}" cy="${r2(c[1])}" r="${r2(r)}" ${attrs}/>`
const line = (a, b, attrs = '') => `<line x1="${r2(a[0])}" y1="${r2(a[1])}" x2="${r2(b[0])}" y2="${r2(b[1])}" ${attrs}/>`

/* Guides: the Añil measuring pen. Hairline, construction circles dashed. */
const G = (body, k = 1) => `<g class="guides" fill="none" stroke="var(--anil)" stroke-width="${0.9 * k}" vector-effect="non-scaling-stroke">${body}</g>`
const gCirc = (c, r) => circ(c, r, 'stroke-dasharray="3 3"')
const gCross = (c, s = 7) => line([c[0] - s, c[1]], [c[0] + s, c[1]]) + line([c[0], c[1] - s], [c[0], c[1] + s])
const gLine = (a, b, dash = true) => line(a, b, dash ? 'stroke-dasharray="1 3"' : '')
const gLabel = (p, t, anchor = 'start') => `<text x="${r2(p[0])}" y="${r2(p[1])}" fill="var(--anil)" stroke="none" font-size="9" font-family="var(--body)" text-anchor="${anchor}" letter-spacing=".04em">${t}</text>`
const gNote = (p, t, anchor = 'start', size = 15) => `<text x="${r2(p[0])}" y="${r2(p[1])}" fill="var(--pen)" stroke="none" font-size="${size}" font-family="var(--hand)" text-anchor="${anchor}">${t}</text>`

/* colour helpers: one-colour by default, the three dyes when asked */
const fillOf = (o, part) => (o.dye ? o.dye[part] : o.ink)

/* ---------------------------------------------------------------------------
   The base geometry, measured from Rafael's file (rueca-logo.svg, mark crop 310 × 218):
     band outer   big  c(200.47,108.59) r108.6   small c(66.8,150.39) r66.8
     band inner   big  r83.59                    small r41.8      → band 25 thick both ends
     wheel disc   c(200.5,108.5) r60.5  → gap 23.1
     whorl disc   c(67,148) r21         → 2.4 above its loop's centre, gap 18.4 to 23.2
   The bottoms are level (both outer edges end at y 217.19), so the band's lower run is a
   level line the wordmark can sit on.
--------------------------------------------------------------------------- */
export const ORIGINAL = {
  A: [200.47, 108.59], B: [66.8, 150.39], Ra: 96.1, Rb: 54.3, w: 25,
  wheel: { c: [200.5, 108.5], r: 60.5 }, whorl: { c: [67, 148], r: 21 },
}

/** The rebuilt base, from tunable params. Bottoms stay level; everything is concentric. */
export function base(p = {}) {
  const w = p.w ?? 25
  const Ra = p.Ra ?? 96.1
  const Rb = p.Rb ?? 54.3
  const dist = p.dist ?? 133.7
  const gapA = p.gapA ?? 22.5
  const gapB = p.gapB ?? 19.5
  const pad = w / 2
  const A = [pad + 2 * Rb + dist - Rb + 0, pad + Ra] // placed so the mark starts at x = 0
  A[0] = pad + Rb + dist
  const B = [pad + Rb, A[1] + (Ra - Rb)] // bottoms level
  return {
    A, B, Ra, Rb, w,
    wheel: { c: A, r: Ra - w / 2 - gapA },
    whorl: { c: B, r: Rb - w / 2 - gapB },
    W: A[0] + Ra + pad, H: A[1] + Ra + pad,
  }
}

/** Small-size cut: under ~24px the band thickens, the gaps close and the whorl grows, so 16px still reads. */
export const SMALL = { w: 34, gapA: 19, gapB: 15 }

const baseGuides = (g, extra = '') => {
  const [t1, t2, b2, b1] = beltPts(g.A, g.Ra, g.B, g.Rb)
  return G(
    gCirc(g.A, g.Ra) + gCirc(g.B, g.Rb) + gCross(g.A) + gCross(g.B) +
    gLine(g.A, g.B) + gLine(g.A, t1) + gLine(g.B, t2) +
    gLine([g.B[0] - g.Rb - 20, g.A[1] + g.Ra], [g.A[0] + g.Ra + 20, g.A[1] + g.Ra], false) +
    extra,
  )
}

/* ---------------------------------------------------------------------------
   The concepts
--------------------------------------------------------------------------- */
export const marks = {}

/* 0 · the file as Rafael drew it, for comparison */
marks.original = {
  vb: [310, 218],
  draw(o) {
    const g = ORIGINAL
    return `<path d="${belt(g.A, g.Ra, g.B, g.Rb)}" fill="none" stroke="${fillOf(o, 'band')}" stroke-width="${g.w}"/>` +
      circ(g.wheel.c, g.wheel.r, `fill="${fillOf(o, 'wheel')}"`) + circ(g.whorl.c, g.whorl.r, `fill="${fillOf(o, 'whorl')}"`)
  },
}

/* I · Pulido: the same mark, rebuilt. Concentric, centred, optical gaps, a small-size cut. */
marks.pulido = {
  draw(o) {
    const g = base(o.small ? { ...o.p, ...SMALL } : o.p)
    return `<path d="${belt(g.A, g.Ra, g.B, g.Rb)}" fill="none" stroke="${fillOf(o, 'band')}" stroke-width="${g.w}"/>` +
      circ(g.wheel.c, g.wheel.r, `fill="${fillOf(o, 'wheel')}"`) + circ(g.whorl.c, g.whorl.r, `fill="${fillOf(o, 'whorl')}"`)
  },
  guides(o) {
    const g = base(o.p)
    return baseGuides(g, gCirc(g.wheel.c, g.wheel.r + 0.01) + gCirc(g.whorl.c, g.whorl.r))
  },
  geo: (o) => base(o.small ? { ...o.p, ...SMALL } : o.p),
}

/* II · Mando: the wheel is also a knob. Teeth in the gap read as a dial's scale and as the
   drive wheel's spokes; one pointer notch turns the disc into a control. Old wheel, new knob. */
marks.mando = {
  draw(o) {
    const g = base(o.small ? { ...o.p, ...SMALL } : o.p)
    const ring = g.Ra - g.w / 2
    let ticks = ''
    if (!o.small) {
      // a knob's scale: 11 ticks over 270°, open at the bottom where the band's run leaves
      const n = 11, inner = g.wheel.r + 6.5, outer = ring - 6.5
      for (let i = 0; i < n; i++) {
        const a = Math.PI * 0.75 + (i / (n - 1)) * Math.PI * 1.5
        const major = i === 0 || i === n - 1 || i === (n - 1) / 2
        ticks += line(pt(g.A, major ? inner : inner + 3.5, a), pt(g.A, outer, a), `stroke="${fillOf(o, 'band')}" stroke-width="${major ? 4.6 : 3}"`)
      }
    }
    const na = -Math.PI / 4 - 0.18
    const notch = line(pt(g.A, g.wheel.r * 0.34, na), pt(g.A, g.wheel.r + 1, na), `stroke="${o.paper}" stroke-width="${o.small ? 14 : 10}" stroke-linecap="${o.small ? 'butt' : 'round'}"`)
    return `<path d="${belt(g.A, g.Ra, g.B, g.Rb)}" fill="none" stroke="${fillOf(o, 'band')}" stroke-width="${g.w}"/>` +
      ticks + circ(g.wheel.c, g.wheel.r, `fill="${fillOf(o, 'wheel')}"`) + notch + circ(g.whorl.c, g.whorl.r, `fill="${fillOf(o, 'whorl')}"`)
  },
  guides(o) {
    const g = base(o.p)
    return baseGuides(g, gCirc(g.A, g.wheel.r + 6.5) + gCirc(g.A, g.Ra - g.w / 2 - 6.5))
  },
}

/* III · Torcido: the band crosses. On a real wheel a crossed band runs the whorl backwards,
   and "rueca" also means a twist (RAE, 3rd sense). Over/under, like thread. */
function torcidoGeo(o) {
  const small = o.small
  const w = small ? 30 : 22
  const Ra = 84, Rb = 42, pad = w / 2
  const dist = 236
  const B = [pad + Rb, pad + Ra + (Ra - Rb)]
  const A = [B[0] + dist, pad + Ra]
  // bottoms level, same as the original
  return { A, B, Ra, Rb, w, W: A[0] + Ra + pad, H: A[1] + Ra + pad, gapA: small ? 18 : 21, gapB: small ? 13 : 17 }
}
marks.torcido = {
  draw(o) {
    const g = torcidoGeo(o)
    const cb = crossedBelt(g.A, g.Ra, g.B, g.Rb)
    const col = fillOf(o, 'band')
    // the "under" run is drawn first with a paper-coloured cut where the "over" run passes
    const [p1, p2] = cb.run1, [q1, q2] = cb.run2
    // where the runs cross: cut a short paper gap in the under run, then lay the over run back on top
    const X = intersect(p1, p2, q1, q2)
    const ux = (q2[0] - q1[0]), uy = (q2[1] - q1[1]), ul = Math.hypot(ux, uy)
    const k = g.w * 1.7
    const c1 = [X[0] - (ux / ul) * k, X[1] - (uy / ul) * k], c2 = [X[0] + (ux / ul) * k, X[1] + (uy / ul) * k]
    return `<path d="${cb.full}" fill="none" stroke="${col}" stroke-width="${g.w}" stroke-linejoin="round"/>` +
      line(c1, c2, `stroke="${o.paper}" stroke-width="${g.w + (o.small ? 12 : 18)}"`) +
      line(q1, q2, `stroke="${col}" stroke-width="${g.w}"`) +
      // re-draw the ends of the over run where they meet the arcs, so the cut never bites the pulleys
      circ(g.A, g.Ra - g.w / 2 - g.gapA, `fill="${fillOf(o, 'wheel')}"`) +
      circ(g.B, g.Rb - g.w / 2 - g.gapB, `fill="${fillOf(o, 'whorl')}"`)
  },
  guides(o) {
    const g = torcidoGeo(o)
    const cb = crossedBelt(g.A, g.Ra, g.B, g.Rb)
    return G(gCirc(g.A, g.Ra) + gCirc(g.B, g.Rb) + gCross(g.A) + gCross(g.B) + gLine(g.A, g.B) +
      gLine(g.A, cb.pts[0]) + gLine(g.B, cb.pts[1]) + gLine(g.A, cb.pts[3]) + gLine(g.B, cb.pts[2]))
  },
  geo: torcidoGeo,
}

/* IV · Doble: double drive. The band goes round the wheel twice, to the whorl and to the
   bobbin, two pulleys on one axis. Two nested loops: the contour lines of the old hero. */
function dobleGeo(o) {
  const small = o.small
  const w = small ? 26 : 17
  const Ra1 = 104, Rb1 = 56
  const gap = small ? 26 : 26
  const Ra2 = Ra1 - w - gap, Rb2 = Rb1 - w - gap * 0.62
  const pad = w / 2, dist = 140
  const A = [pad + Rb1 + dist, pad + Ra1]
  const B = [pad + Rb1, A[1] + (Ra1 - Rb1)]
  return { A, B, Ra1, Rb1, Ra2, Rb2, w, hub: small ? 22 : 18, W: A[0] + Ra1 + pad, H: A[1] + Ra1 + pad }
}
marks.doble = {
  draw(o) {
    const g = dobleGeo(o)
    const col = fillOf(o, 'band')
    // the inner loop keeps the outer loop's bottom level? No: it stays concentric, so it lifts. That lift is the depth.
    return `<path d="${belt(g.A, g.Ra1, g.B, g.Rb1)}" fill="none" stroke="${col}" stroke-width="${g.w}"/>` +
      `<path d="${belt(g.A, g.Ra2, g.B, g.Rb2)}" fill="none" stroke="${o.dye ? o.dye.wheel : col}" stroke-width="${g.w}"/>` +
      circ(g.A, g.hub, `fill="${o.dye ? o.dye.whorl : o.ink}"`)
  },
  guides(o) {
    const g = dobleGeo(o)
    return G(gCirc(g.A, g.Ra1) + gCirc(g.B, g.Rb1) + gCirc(g.A, g.Ra2) + gCirc(g.B, g.Rb2) + gCross(g.A) + gCross(g.B) + gLine(g.A, g.B))
  },
}

/* V · Rayos: the wheel drawn as a wheel. Rim, eight spokes and a hub, the whorl solid.
   The most literal; it wants the small cut below 32px. */
marks.rayos = {
  draw(o) {
    if (o.small) return marks.pulido.draw(o)
    const g = base({ ...o.p, gapA: 14 })
    const col = fillOf(o, 'band'), wc = fillOf(o, 'wheel')
    const rim = g.wheel.r - 6
    let spokes = ''
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + Math.PI / 8
      spokes += line(pt(g.A, 15, a), pt(g.A, rim, a), `stroke="${wc}" stroke-width="7"`)
    }
    return `<path d="${belt(g.A, g.Ra, g.B, g.Rb)}" fill="none" stroke="${col}" stroke-width="${g.w}"/>` +
      circ(g.A, rim, `fill="none" stroke="${wc}" stroke-width="12"`) + spokes + circ(g.A, 17, `fill="${wc}"`) +
      circ(g.whorl.c, g.whorl.r, `fill="${fillOf(o, 'whorl')}"`)
  },
  guides(o) {
    const g = base({ ...o.p, gapA: 14 })
    return baseGuides(g, gCirc(g.A, g.wheel.r - 6))
  },
}

/* VI · Erre: a lowercase r made of the logo's parts. The shoulder is a quarter of the drive
   wheel, the ball terminal is the whorl. A serif r already has a wheel and a whorl in it. */
function erreGeo(o) {
  const small = o.small
  const w = small ? 38 : 30
  const stemX = 46, top = 46, bottom = 214
  const R = 58 // the shoulder: an arc of the wheel
  const C = [stemX + R, top + R + 6]
  const ballR = small ? 27 : 23
  return { w, stemX, top, bottom, R, C, ballR, W: 196, H: 228 }
}
marks.erre = {
  vbFixed: true,
  draw(o) {
    const g = erreGeo(o)
    const col = fillOf(o, 'band')
    const a0 = Math.PI, a1 = -0.28 // from the stem, over the top, to the right
    const s = pt(g.C, g.R, a0), e = pt(g.C, g.R, a1)
    const ball = pt(g.C, g.R + g.w / 2 - g.ballR + 2, a1 + 0.16)
    return `<line x1="${g.stemX}" y1="${g.top - 4}" x2="${g.stemX}" y2="${g.bottom}" stroke="${col}" stroke-width="${g.w}"/>` +
      `<path d="M ${P([s[0], s[1] + 26])} L ${P(s)} ${arc(g.C, g.R, a0, a1, -Math.PI / 2)}" fill="none" stroke="${col}" stroke-width="${g.w}"/>` +
      circ(ball, g.ballR, `fill="${fillOf(o, 'whorl')}"`)
  },
  guides(o) {
    const g = erreGeo(o)
    return G(gCirc(g.C, g.R) + gCross(g.C) + gLine([g.stemX, 10], [g.stemX, 222]) + gLine([10, g.bottom], [190, g.bottom], false) +
      gLine([10, g.top - 4], [190, g.top - 4]))
  },
  geo: erreGeo,
}

/* VII · Malacate: the spindle whorl seal. Malacate is the Spanish and Nahuatl word for the clay
   whorl of a hand spindle; pre-Columbian ones were stamped with hatched half-circles that make a
   star. The same Mesoamerica the dyes come from (achiote, cochinilla). Round, so it is an app icon. */
function malacateGeo(o) {
  const n = o.small ? 6 : 8
  const rin = o.small ? 58 : 60
  return { c: [120, 120], R: 112, hole: o.small ? 19 : 14, n, rin, rs: rin * Math.sin(Math.PI / n) }
}
marks.malacate = {
  vbFixed: true,
  draw(o) {
    const g = malacateGeo(o)
    const col = fillOf(o, 'band')
    const id = `mal${Math.random().toString(36).slice(2, 7)}`
    let petals = ''
    for (let i = 0; i < g.n; i++) {
      const a = (i / g.n) * TAU - Math.PI / 2 + Math.PI / g.n
      // the diameter is the chord between two neighbouring points on the ring; the half-disc faces out
      const p0 = pt(g.c, g.rin, a - Math.PI / g.n), p1 = pt(g.c, g.rin, a + Math.PI / g.n)
      const m = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2]
      const ang0 = Math.atan2(p0[1] - m[1], p0[0] - m[0]), ang1 = Math.atan2(p1[1] - m[1], p1[0] - m[0])
      petals += `<path d="M ${P(p0)} ${arc(m, g.rs, ang0, ang1, a)} Z"/>`
    }
    const hatch = Array.from({ length: 44 }, (_, k) => line([0, k * 6 - 20], [240, k * 6 + 30])).join('')
    return `<defs><clipPath id="${id}">${petals}</clipPath></defs>` +
      circ(g.c, g.R - 1, `fill="${col}"`) +
      // the stamp: half-circles pressed into the clay (paper), hatched in ink above 24px
      `<g fill="${o.paper}">${petals}</g>` +
      (o.small ? '' : `<g clip-path="url(#${id})" stroke="${col}" stroke-width="2.4">${hatch}</g>`) +
      // the inner polygon between the half-circles' diameters stays ink: that's the star
      circ(g.c, g.R - (o.small ? 15 : 13), `fill="none" stroke="${o.paper}" stroke-width="${o.small ? 0 : 3}"`) +
      circ(g.c, g.hole + (o.small ? 13 : 12), `fill="none" stroke="${o.dye ? o.dye.whorl : o.paper}" stroke-width="${o.small ? 7 : 5}"`) +
      circ(g.c, g.hole, `fill="${o.paper}"`)
  },
  guides(o) {
    const g = malacateGeo(o)
    let s = gCirc(g.c, g.R) + gCirc(g.c, g.rin) + gCross(g.c, 10)
    for (let i = 0; i < g.n; i++) s += gLine(g.c, pt(g.c, g.R, (i / g.n) * TAU - Math.PI / 2))
    return G(s)
  },
}

/* VIII · Hilo: a lockup, not a new mark. The band's level lower run carries on as one thread
   under the word and ends loose. Fibre in, thread out; the wordmark sits on the drive band. */
marks.hilo = { lockupOnly: true }

/* IX · Huso: the wordmark's u is the flyer, the U-shaped arm with hooks that winds thread
   onto the bobbin. A wordmark idea for Rafael to draw; here it's a sketch over live type. */
marks.huso = { lockupOnly: true }

/* X · Lámina: an emblem, the mark as a figure on a plate, with its construction kept. For
   the footer title block, stickers, the README and social avatars. */
marks.lamina = {
  vbFixed: true,
  draw(o) {
    const g = base({ ...o.p })
    const s = o.small ? 0.6 : 0.44, tx = 120 - (g.W * s) / 2, ty = 120 - (g.H * s) / 2 + (o.small ? 0 : 4)
    const inner = `<g transform="translate(${r2(tx)} ${r2(ty)}) scale(${s})">${marks.pulido.draw({ ...o, small: !!o.small })}</g>`
    if (o.small) return circ([120, 120], 110, `fill="none" stroke="${o.ink}" stroke-width="14"`) + inner
    const id = `lam${Math.random().toString(36).slice(2, 7)}`
    const rt = 90, rb = 100
    return circ([120, 120], 116, `fill="none" stroke="${o.ink}" stroke-width="3"`) +
      circ([120, 120], 110, `fill="none" stroke="${o.ink}" stroke-width="1"`) +
      circ([120, 120], 80, `fill="none" stroke="${o.ink}" stroke-width="1"`) +
      `<defs><path id="${id}t" d="M ${120 - rt} 120 A ${rt} ${rt} 0 0 1 ${120 + rt} 120"/><path id="${id}b" d="M ${120 - rb} 120 A ${rb} ${rb} 0 0 0 ${120 + rb} 120"/></defs>` +
      `<text font-family="var(--body)" font-size="12" letter-spacing="3.4" fill="${o.ink}" font-weight="500"><textPath href="#${id}t" startOffset="50%" text-anchor="middle">RUECA · LÁMINA I</textPath></text>` +
      `<text font-family="var(--hand)" font-size="15" fill="${o.dye ? o.dye.whorl : o.ink}"><textPath href="#${id}b" startOffset="50%" text-anchor="middle">spin up a real tool</textPath></text>` +
      line([30, 120], [38, 120], `stroke="${o.ink}" stroke-width="1"`) + line([202, 120], [210, 120], `stroke="${o.ink}" stroke-width="1"`) +
      inner
  },
}

/* ---------------------------------------------------------------------------
   viewBox per mark (fixed ones are 240 square, or as declared)
--------------------------------------------------------------------------- */
export function viewBox(id, o) {
  const m = marks[id]
  if (id === 'original') return [0, 0, 310, 218]
  if (id === 'erre') { const g = erreGeo(o); return [0, 0, g.W, g.H] }
  if (id === 'malacate' || id === 'lamina') return [0, 0, 240, 240]
  if (id === 'torcido') { const g = torcidoGeo(o); return [0, 0, g.W, g.H] }
  if (id === 'doble') { const g = dobleGeo(o); return [0, 0, g.W, g.H] }
  const g = base(o.small ? { ...o.p, ...SMALL } : o.p)
  return [0, 0, g.W, g.H]
}

export function svg(id, o, { guides = false, cls = '', title = '' } = {}) {
  const vb = viewBox(id, o)
  const m = marks[id]
  return `<svg class="${cls}" viewBox="${vb.map(r2).join(' ')}" xmlns="http://www.w3.org/2000/svg" overflow="visible" role="img" aria-label="${title}">${m.draw(o)}${guides && m.guides ? m.guides(o) : ''}</svg>`
}

export { gNote, gLabel, G, gCirc, gLine, gCross, circ, line, pt, P, arc }
