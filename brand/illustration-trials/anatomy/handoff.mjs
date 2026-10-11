/* Kit · Hand-off: what you take away, as a fanned hand of export files lying flat, each with a
   folded corner and its format on its top strip: PNG (a picture), SVG (a curve), MP4 (play) and,
   on top, the settings file (Cochinilla, the one bright), the one you hand to an agent.
   Coming apart, the hand fans wider. node handoff.mjs [--landing] */
import { k, P, at, S, L, D, bright, apart, emit, note, arrow, frame } from "./shared.mjs";
const MT = 0; // it lies straight on the paper

const DOC = { w: 62, d: 74 }, FOLD = 11, T = 1.6, STEP = [9, 17], SPREAD = 8;
const FILES = [
  { label: "PNG", icon: "picture" },
  { label: "SVG", icon: "curve" },
  { label: "MP4", icon: "play" },
  { label: "{ }", icon: null },
];
const origin = (i) => [-58 + i * STEP[0], -66 + i * STEP[1]];
// a page with its top-right corner folded over
const page = ([x, y]) => [[x, y], [x + DOC.w - FOLD, y], [x + DOC.w, y + FOLD], [x + DOC.w, y + DOC.d], [x, y + DOC.d]];

function icon(kind, [x, y], z) {
  if (kind === "picture") return L(k.planOutline({ x, y: y - 4, w: 11, d: 8, r: 0 }, z, P), { tone: "mid" }) + L(k.onTop([[x + 1.5, y + 2.5], [x + 4.5, y - 0.5], [x + 6.5, y + 1.5], [x + 8, y], [x + 9.5, y + 2.5]], z, P), { tone: "mid", free: true });
  if (kind === "curve") return L(k.onTop(Array.from({ length: 9 }, (_, i) => { const t = i / 8; return [x + t * 11, y + 2.5 - Math.sin(t * Math.PI) * 6]; }), z, P), { tone: "mid", free: true }) + D([at([x, y + 2.5, z]), at([x + 11, y + 2.5, z])], { size: 0.9, tone: "mid" });
  if (kind === "play") return L(k.onTop([[x + 2, y - 4], [x + 10, y], [x + 2, y + 4]], z, P, true), { tone: "mid" });
  return "";
}
function doc(i) {
  const o = origin(i), z = i * T, top = z + T, f = FILES[i], last = i === FILES.length - 1;
  const ring = page(o), paths = k.extrude(ring, z, T, P, { bevel: 0.3 });
  const [x, y] = o, out = [last ? bright(paths, "cochinilla") : S(paths, { tone: "hi", crease: "lo" })];
  // the fold: the flap's crease and its turned-over corner
  out.push(L(k.onTop([[x + DOC.w - FOLD, y], [x + DOC.w - FOLD, y + FOLD], [x + DOC.w, y + FOLD]], top, P), { tone: last ? "ink" : "lo" }));
  // the top strip: icon, then the format, in mono
  const sy = y + 9;
  out.push(icon(f.icon, [x + 6, sy], top));
  out.push(k.faceTextSvg(k.topMatrix([x + (f.icon ? 22 : 7), sy + 3.6], top, P, "x"), f.label, { size: 10, tone: last ? "ink" : "hi" }));
  // a few lines of content under the strip, as on a real page
  [[20, 34], [28, 22], [36, 28]].forEach(([dy, w]) => out.push(L(k.lineOnTop([x + 7, y + dy], [x + 7 + w, y + dy], top, P), { tone: last ? "ink-faint" : "faint", free: true })));
  return out.join("");
}

const F = frame([119, 155, 463, 396]); // its outline at rest and fanned apart, measured unframed (FRAME=off)
const settings = origin(FILES.length - 1);
const tip = F.map(at([settings[0] + DOC.w * 0.3, settings[1] + DOC.d, (FILES.length - 1) * T])); // the agent file's front edge
emit({
  name: "handoff", exportName: "HANDOFF_SVG", bright: "cochinilla",
  label: "A fanned hand of export files with folded corners: PNG, SVG, MP4 and, on top, the settings file to hand to an agent.",
  framed: F,
  // the agent file on top stays put and the others fan back behind it, so the arrow stays on it
  art: FILES.map((_, i) => { const back = FILES.length - 1 - i; return back ? `<g ${apart([0, -SPREAD * back, 0], back * 0.05)}>${doc(i)}</g>` : doc(i) }),
  pen: [note(400, 530, "or hand it to an agent", { rotate: -4 }), arrow([360, 496], [tip[0] + 2, tip[1] + 5], { bend: -0.25, seed: 17 })],
});
