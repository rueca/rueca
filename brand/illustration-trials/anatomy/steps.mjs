/* How it works, as one drawing that the three steps build in turn as you scroll. It speaks to
   a general design audience: you ask an agent for a prototype to animate your logo, it builds
   the motion editor around it, and you tune it. Every step runs on its own progress (--s1,
   --s2, --s3, 0–1, written by the page as you scroll; StepArt transitions them for the
   three-plate variant).
     1  ask: your message (Gualda), the agent's reply "Using the rueca skill" and three checks.
        Each check lands its part of the motion shell (src/shells/motion): ✓ shell, the plate with
        its toolbar and artboard · ✓ motion presets, the timeline · ✓ components, the inspector.
     2  bring it: your logo (Rueca's own mark, the two wheels, from src/landing/logo.generated.ts)
        drops onto the artboard on a Cielo card, as a fine outline.
     3  tune: the card's bright fades to a tint, a cursor drags the playhead (Achiote) along the
        timeline and the logo draws itself as it scrubs: traced band, wheel, whorl, then inked.
   node steps.mjs [--landing] */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { k, P, at, S, L, D, MT, MOD, bright, emit, note, arrow, loop, seg, moves, fades, marks } from "./shared.mjs";

// the logo's outlines, as the landing draws them (only the mark is used)
const SRC = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../../../src/landing/logo.generated.ts"), "utf8");
// logo.generated.ts holds one cut as JSON (const V2 = {...}) since the v2 lockup; older files held { regular, small }
const LOCKUP = SRC.includes("const V2")
  ? JSON.parse(SRC.slice(SRC.indexOf("{", SRC.indexOf("const V2")), SRC.indexOf("\nexport const LOCKUP")).trim())
  : JSON.parse(SRC.slice(SRC.indexOf("= {", SRC.indexOf("export const LOCKUP")) + 2).trim().replace(/;?\s*$/, "")).regular;

// ── the motion shell, laid out as the real one: toolbar on top, artboard in the middle, the
//    Design inspector on the right, the timeline along the bottom ("up" on screen is −y) ──
const TOOLBAR = { x: -86, y: -56, w: 172, d: 9, r: 2 }, BAR_H = 2;
const ARTBOARD = { x: -72, y: -40, w: 108, d: 56, r: 5 }, BOARD_H = 1.2;
const INSPECTOR = { x: 44, y: -40, w: 44, d: 56, r: 3 }, PANEL_H = 4, PT = MT + PANEL_H;
const TIMELINE = { x: -86, y: 22, w: 174, d: 26, r: 3 }, TT = MT + PANEL_H;
const LANES = [[29, -58, -8], [36, -42, 26], [43, -24, 54]]; // y, from, to
const HEAD = -50, SCRUB = 92; // the playhead's x at rest, and how far step 3 drags it
const CARD = k.insetPlan(ARTBOARD, 5), CARD_T = 1.4;

function plateAndShell() {
  const out = [S(k.slabOf(MOD, 0, MT, P, 6, 0.8), { tone: "mid" })];
  // toolbar: brand dot, the doc's name, the device pill, the Export button
  const top = MT + BAR_H;
  out.push(S(k.slabOf(TOOLBAR, MT, BAR_H, P, 3, 0.3), { tone: "hi", crease: "lo" }));
  out.push(L(k.ring(TOOLBAR.x + 6, TOOLBAR.y + 4.5, 2, top, P, 16), { tone: "mid" }));
  out.push(L(k.lineOnTop([TOOLBAR.x + 12, TOOLBAR.y + 4.5], [TOOLBAR.x + 34, TOOLBAR.y + 4.5], top, P), { tone: "lo", free: true }));
  out.push(L(k.planOutline({ x: -14, y: TOOLBAR.y + 2, w: 28, d: 5, r: 2.5 }, top, P, 4), { tone: "lo" }));
  out.push(S(k.slabOf({ x: TOOLBAR.x + TOOLBAR.w - 20, y: TOOLBAR.y + 1.5, w: 16, d: 6, r: 1.5 }, top, 1, P, 3), { tone: "hi", crease: "lo" }));
  // the artboard: a sheet of paper on the canvas
  out.push(S(k.slabOf(ARTBOARD, MT, BOARD_H, P, 4, 0.3), { tone: "hi", crease: "lo" }));
  return out.join("");
}
function timeline() {
  const out = [S(k.slabOf(TIMELINE, MT, PANEL_H, P, 4, 0.5), { tone: "hi", crease: "lo" })];
  // the lane names, then the bars (one per lane, staggered)
  LANES.forEach(([y, from, to]) => {
    out.push(L(k.lineOnTop([TIMELINE.x + 5, y], [TIMELINE.x + 20, y], TT, P), { tone: "lo", free: true }));
    out.push(S(k.slabOf({ x: from, y: y - 2.2, w: to - from, d: 4.4, r: 2.2 }, TT, 0.8, P, 4), { tone: "hi", crease: "lo" }));
  });
  out.push(L(k.lineOnTop([TIMELINE.x + 24, TIMELINE.y], [TIMELINE.x + 24, TIMELINE.y + TIMELINE.d], TT, P), { tone: "faint" }));
  return out.join("");
}
function inspector() {
  const out = [S(k.slabOf(INSPECTOR, MT, PANEL_H, P, 4, 0.5), { tone: "hi", crease: "lo" })];
  // two sliders (duration, stagger), the easing curve, a toggle
  [[-31, 0.55], [-22, 0.3]].forEach(([y, v]) => {
    const x0 = INSPECTOR.x + 6, x1 = INSPECTOR.x + INSPECTOR.w - 6, xv = x0 + (x1 - x0) * v;
    out.push(L(k.lineOnTop([x0, y], [x1, y], PT, P), { tone: "lo", free: true }), L(k.lineOnTop([x0, y], [xv, y], PT, P), { tone: "hi", free: true }));
    out.push(S(k.cylinder(xv, y, 1.8, PT, 1, P, 16), { tone: "hi", crease: "lo" }));
  });
  const tile = { x: INSPECTOR.x + 6, y: -14, w: INSPECTOR.w - 12, d: 18, r: 1.5 };
  out.push(L(k.planOutline(tile, PT, P, 3), { tone: "lo" }));
  const curve = Array.from({ length: 17 }, (_, i) => { const t = i / 16, e = 1 - Math.pow(2, -8 * t); return [tile.x + 3 + t * (tile.w - 6), tile.y + tile.d - 3 - e * (tile.d - 6)]; });
  out.push(L(k.onTop(curve, PT, P), { tone: "hi", free: true }));
  out.push(L(k.planOutline({ x: INSPECTOR.x + INSPECTOR.w - 17, y: 7, w: 11, d: 5, r: 2.5 }, PT, P, 4), { tone: "mid" }), D([at([INSPECTOR.x + INSPECTOR.w - 9, 9.5, PT])], { size: 1.3, tone: "hi" }));
  return out.join("");
}
// the playhead: a blade across the lanes with its head (Achiote in step 3) on the timeline's edge
const playhead = (lit) => {
  const blade = S(k.slabOf({ x: HEAD - 0.6, y: TIMELINE.y + 2, w: 1.2, d: TIMELINE.d - 4, r: 0.4 }, TT, 1.6, P, 2), { tone: "hi", crease: "none" });
  const head = k.slabOf({ x: HEAD - 3, y: TIMELINE.y + 1, w: 6, d: 5, r: 1.2 }, TT, 2.4, P, 3, 0.3);
  return blade + (lit ? bright(head, "achiote") : S(head, { tone: "hi", crease: "lo" }));
};
// your logo (the mark alone, Rafael: "only use the mark") lying on the card, drawn the way an
// isometric illustration draws a mark: the band is one line of constant weight round its centre
// (the outline of the two circles it runs round), the drive wheel and whorl are filled ellipses.
// A projected fill would thin the band where the view foreshortens it; a line keeps its weight.
// Geometry from the mark's own outlines (logo.generated.ts, the v2 lockup of 11 Oct): wheel r 74.07 at
// (228.77, 117.36), whorl r 27.04 at (66.68, 168.06), the band 16 wide with its centre 109.36 round the
// wheel and 58.68 round the whorl.
// It arrives as an outline (step 2); as step 3 scrubs it draws itself: the band at full weight,
// then each wheel traced and inked, and the outline fades.
const MARK = { wheel: [228.77, 117.36, 74.07], whorl: [66.68, 168.06, 27.04], band: [[228.73, 117.36, 109.36], [66.68, 168.06, 58.68]], width: 16 };
const LOGO_H = 34, LS = LOGO_H / LOCKUP.markH, LOGO_AT = [CARD.x + (CARD.w - LOCKUP.markW * LS) / 2, CARD.y + (CARD.d - LOGO_H) / 2];
const hull = (pts) => {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]), cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length > 1 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.reverse()) { while (up.length > 1 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
};
const circle = ([cx, cy, r], n = 96) => Array.from({ length: n }, (_, i) => [cx + Math.cos((i / n) * Math.PI * 2) * r, cy + Math.sin((i / n) * Math.PI * 2) * r]);
function logo() {
  const z = MT + BOARD_H + CARD_T, to = ([x, y]) => at([LOGO_AT[0] + x * LS, LOGO_AT[1] + y * LS, z]);
  // everything below is on the sheet: weights and gaps are held constant there, as an engraver would
  const path = (sp) => "M" + sp.map((q) => q.map((v) => v.toFixed(2)).join(" ")).join("L") + "Z";
  // each closed path's length, so its dash can run exactly once round it
  const length = (sp) => sp.reduce((sum, q, i) => sum + Math.hypot(q[0] - sp[(i + 1) % sp.length][0], q[1] - sp[(i + 1) % sp.length][1]), 0);
  const drawn = (sp, t) => { const n = length(sp).toFixed(1); return `stroke-dasharray:${n} ${n};stroke-dashoffset:calc((1 - ${t}) * ${n})`; };
  // a closed line moved d inward (d < 0: outward), square to itself at every point
  const inset = (sp, d) => {
    const n = sp.length, c = sp.reduce((m, q) => [m[0] + q[0] / n, m[1] + q[1] / n], [0, 0]);
    return sp.map((q, i) => {
      const a = sp[(i + n - 1) % n], b = sp[(i + 1) % n], tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1;
      let nx = ty / l, ny = -tx / l;
      if (nx * (c[0] - q[0]) + ny * (c[1] - q[1]) < 0) { nx = -nx; ny = -ny; }
      return [q[0] + nx * d, q[1] + ny * d];
    });
  };
  const unit = Math.max(...[[1, 0, 0], [0, 1, 0]].map((v) => Math.hypot(...k.axisVector(P, v)))) * LS;
  const weight = MARK.width * unit; // the band's full width
  const bandPts = hull([...circle(MARK.band[0], 160), ...circle(MARK.band[1], 120)].map(to));
  // the drive wheel is its end of the band's line brought in by the band's half width and the mark's gap, so the
  // gap round it stays even however the card is turned (projected on its own, it pinched on the near side). The
  // whorl can't take the same: its gap is deeper than the turned circle, so it stays a true projection.
  // (a true ellipse on the band line's own axes, each shortened by that much: a straight offset goes lemon-shaped)
  const wheelPts = (() => {
    const line = circle(MARK.band[0], 192).map(to), c = to(MARK.band[0]), d = (MARK.band[0][2] - MARK.wheel[2]) * unit;
    const far = line.reduce((m, q) => (Math.hypot(q[0] - c[0], q[1] - c[1]) > Math.hypot(m[0] - c[0], m[1] - c[1]) ? q : m));
    const A = Math.hypot(far[0] - c[0], far[1] - c[1]), u = [(far[0] - c[0]) / A, (far[1] - c[1]) / A];
    const B = Math.min(...line.map((q) => Math.hypot(q[0] - c[0], q[1] - c[1])));
    return Array.from({ length: 96 }, (_, i) => { const t = (i / 96) * Math.PI * 2, a = (A - d) * Math.cos(t), b = (B - d) * Math.sin(t); return [c[0] + u[0] * a - u[1] * b, c[1] + u[1] * a + u[0] * b]; });
  })();
  const whorlPts = circle(MARK.whorl, 64).map(to);
  const band = path(bandPts), wheel = path(wheelPts), whorl = path(whorlPts);
  // the outline: the band's two edges, half its weight either side of its line, and each wheel's rim
  const outline = `<g style="opacity:calc(1 - ${seg(3, 0.84, 0.98)})"><path class="rueca-mark-outline" d="${path(inset(bandPts, -weight / 2))}"/><path class="rueca-mark-outline" d="${path(inset(bandPts, weight / 2))}"/>`
    + `<path class="rueca-mark-outline" d="${wheel}"/><path class="rueca-mark-outline" d="${whorl}"/></g>`;
  const draw = `<path class="rueca-mark-band" style="stroke-width:${weight.toFixed(2)};${drawn(bandPts, seg(3, 0.18, 0.56))}" d="${band}"/>`
    + `<path class="rueca-mark-trace" style="${drawn(wheelPts, seg(3, 0.4, 0.62))};opacity:calc(1 - ${seg(3, 0.84, 0.98)})" d="${wheel}"/>`
    + `<path class="rueca-mark-trace" style="${drawn(whorlPts, seg(3, 0.54, 0.76))};opacity:calc(1 - ${seg(3, 0.84, 0.98)})" d="${whorl}"/>`
    + `<path class="rueca-mark-fill" style="opacity:${seg(3, 0.6, 0.72)}" d="${wheel}"/><path class="rueca-mark-fill" style="opacity:${seg(3, 0.74, 0.86)}" d="${whorl}"/>`;
  return outline + draw;
}
// the card the logo arrives on: Cielo, a deeper one in dark (the logo card colours, shared.mjs)
const card = () => S(k.slabOf(CARD, MT + BOARD_H, CARD_T, P, 4, 0.3), { tone: "hi", crease: "lo", lit: true, className: "rueca-bright rueca-logo-card" });

// ── the conversation, in the drawing's plane above the plate, set in Plex ──
const CHAT_Z = 70, BUBBLE_T = 2.4;
const ASK = { x: -30, y: -90, w: 88, d: 30, r: 8 }, REPLY = { x: -46, y: -50, w: 96, d: 56, r: 8 };
const words = (b, lines, top, cls, size = 7.6) => lines.map((t, i) => `<text class="${cls}" font-size="${size}" transform="${k.topMatrix([b.x + 9, b.y + 12.5 + i * 10.5], top, P, "x")}">${t}</text>`).join("");
const ask = () => bright(k.slabOf(ASK, CHAT_Z, BUBBLE_T, P, 4, 0.4), "gualda") + words(ASK, ["Build me a prototype", "to animate my logo"], CHAT_Z + BUBBLE_T, "rueca-chat rueca-chat-ink");
const CHECKS = ["shell", "motion presets", "components"];
// one check row: a ticked box and its name; `when` fades it in as its part lands
function check(i, when) {
  const top = CHAT_Z + BUBBLE_T, x = REPLY.x + 9, y = REPLY.y + 23 + i * 10.5, box = { x, y: y - 3.8, w: 5.6, d: 5.6, r: 1.2 };
  return `<g ${fades(when)}>${L(k.planOutline(box, top, P, 3), { tone: "mid" })}${L(k.onTop([[x + 1.3, y - 0.9], [x + 2.5, y + 0.6], [x + 4.4, y - 2.4]], top, P), { tone: "hi", free: true })}`
    + `<text class="rueca-chat" font-size="7.2" transform="${k.topMatrix([x + 9, y + 1.8], top, P, "x")}">${CHECKS[i]}</text></g>`;
}
const reply = (whens) => S(k.slabOf(REPLY, CHAT_Z, BUBBLE_T, P, 4, 0.4), { tone: "hi", crease: "lo" })
  + words(REPLY, ["Using the rueca skill"], CHAT_Z + BUBBLE_T, "rueca-chat rueca-chat-strong") + whens.map((w, i) => check(i, w)).join("");
// the pointer, built like every other part: Figma's tail-less arrowhead (tip, left edge, a notch in
// its back, the right wing) lying in the drawing's plane, cut from a slab, its tip pressing the
// playhead's head. Gualda, the colour of your message in step 1: it's your hand.
const POINTER = [[0, 0], [0, 22], [6.2, 16.2], [16, 16]];
function cursor([tx, ty], z) {
  // turned so it points up-left on the sheet, like a screen pointer, at 0.85 of the outline's size
  const c = Math.SQRT1_2 * 0.85, ring = POINTER.map(([x, y]) => [tx + (x + y) * c, ty + (y - x) * c]);
  return bright(k.extrude(ring, z, 2.4, P, { convex: false }), "gualda"); // the notch in its back isn't convex
}

// ── the build ──
const landed = (a, b) => [`(1 - ${seg(1, a, b)})`, `opacity:${seg(1, a, a + 0.06)}`];
const fall = (z, [t, op]) => moves([[[0, 0, z], t]], op);
const [lx, ly] = at([CARD.x + CARD.w / 2, CARD.y + CARD.d / 2, MT + 3]);
const edge = at([CARD.x + 10, CARD.y + CARD.d, MT + BOARD_H]);
const run = moves([[[SCRUB, 0, 0], seg(3, 0.2, 1)]]);
emit({
  name: "buildup", exportName: "BUILDUP_SVG", bright: ["gualda", "cielo", "achiote"], scrub: 3,
  label: "Asking an agent to build a prototype that animates a logo: the motion editor arrives part by part, the logo's outline drops onto the artboard, and as a cursor scrubs the timeline the logo draws itself.",
  art: [
    // ✓ shell: the plate, toolbar and artboard rise in · ✓ motion presets: the timeline drops in · ✓ components: the inspector drops in
    `<g ${moves([[[0, 0, -24], `(1 - ${seg(1, 0.28, 0.46)})`]], `opacity:${seg(1, 0.28, 0.36)}`)}>${plateAndShell()}</g>`,
    `<g ${fall(30, landed(0.48, 0.64))}>${timeline()}</g>`,
    `<g ${fall(30, landed(0.66, 0.82))}>${inspector()}</g>`,
    // your logo arrives on its card; its bright fades to a tint once step 3 takes over
    `<g ${moves([[[0, 0, 56], `(1 - ${seg(2, 0.28, 0.85)})`]], `opacity:${seg(2, 0.22, 0.32)}`)}><g class="rueca-pale">${card()}</g><g ${fades(`calc(1 - ${seg(3, 0, 0.3)})`)}>${card()}</g>${logo()}</g>`,
    // the playhead, which step 3 drags; its head turns Achiote as the cursor takes it
    `<g ${fall(30, landed(0.48, 0.64))}><g ${run}>${playhead(false)}<g ${fades(seg(3, 0, 0.2))}>${playhead(true)}</g><g ${fades(seg(3, 0.1, 0.22))}>${cursor([HEAD + 2.5, TIMELINE.y + 4.5], TT + 2.4)}</g></g></g>`,
    // the conversation: your message, then the agent's reply with its checks; both leave in step 2
    `<g ${moves([[[0, 0, 12], `(1 - ${seg(1, 0, 0.1)})`], [[0, 0, 60], seg(2, 0, 0.3)]], `opacity:calc(${seg(1, 0, 0.08)} * (1 - ${seg(2, 0, 0.25)}))`)}>${ask()}</g>`,
    `<g ${moves([[[0, 0, 12], `(1 - ${seg(1, 0.1, 0.2)})`], [[0, 0, 60], seg(2, 0.04, 0.34)]], `opacity:calc(${seg(1, 0.1, 0.18)} * (1 - ${seg(2, 0.04, 0.29)}))`)}>${reply([seg(1, 0.26, 0.3), seg(1, 0.46, 0.5), seg(1, 0.64, 0.68)])}</g>`,
  ],
  pen: [
    // written as the logo lands (and gone once step 3 takes over), then the loop and its note once it's inked
    `<g ${fades(`calc(1 - ${seg(3, 0, 0.15)})`)}>${marks(seg(2, 0.62, 0.98), [note(150, 508, "your logo, as it is", { rotate: -5 }), arrow([170, 474], [edge[0] - 4, edge[1] + 6], { bend: 0.25, seed: 31 })])}</g>`,
    marks(seg(3, 0.7, 1), [loop([lx, ly], 66, 34, { tilt: 37, seed: 41, from: 2.6, tail: [150, 404] }), note(118, 440, "tune it live", { rotate: -5 })]),
  ],
});
