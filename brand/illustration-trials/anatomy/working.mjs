/* Kit · Working: undo, made physical. On the plate, a ⌘ key and a Z key, the Z pressed (Hoja,
   the one bright). Behind them, the history: four state tiles in a row, the last one only
   an outline (the step that was undone), with a hand arrow back. Coming apart, the Z springs
   up and the undone tile lifts away. node working.mjs [--landing] */
import { k, P, at, S, L, MT, plate, floor, bright, up, emit, note, arrow, caption } from "./shared.mjs";

// history along the back: four tiles, the fourth undone
const TILE = { w: 30, d: 22 }, TILES_X = [-78, -42, -6, 30], TILES_Y = -52;
// keys at the front
const KEY = { w: 30, d: 30 }, CMD = { x: -40, y: 6 }, Z = { x: 0, y: 6 }, KEY_H = 8, PRESSED = 3.5;

function history() {
  const out = [floor({ x: -86, y: TILES_Y - 6, w: 152, d: TILE.d + 12, r: 1 }, MT, 4, "")];
  TILES_X.forEach((x, i) => {
    const plan = { x, y: TILES_Y, w: TILE.w, d: TILE.d, r: 1 };
    if (i === 3) { out.push(L(k.planOutline(plan, MT, P, 3), { tone: "mid", dashed: true })); return } // undone: just the outline left behind
    out.push(S(k.slabOf(plan, MT, 2, P, 3, 0.3), { tone: "hi", crease: "lo" }));
    // each state's thumbnail: a little frame and a mark inside
    const inner = k.insetPlan(plan, 5);
    out.push(L(k.planOutline(inner, MT + 2, P, 2), { tone: "lo" }), L(k.ring(inner.x + inner.w / 2, inner.y + inner.d / 2, 3 + i, MT + 2, P, 24), { tone: "mid" }));
  });
  return out.join("");
}
// the undone state, lifted off its slot
function undone() {
  const plan = { x: TILES_X[3], y: TILES_Y, w: TILE.w, d: TILE.d, r: 1 }, z = MT + 9, inner = k.insetPlan(plan, 5);
  return S(k.slabOf(plan, z, 2, P, 3, 0.3), { tone: "hi", crease: "lo" }) + L(k.planOutline(inner, z + 2, P, 2), { tone: "lo" }) + L(k.ring(inner.x + inner.w / 2, inner.y + inner.d / 2, 6, z + 2, P, 24), { tone: "mid" });
}

function well(c) { const plan = { x: c.x - 2, y: c.y - 2, w: KEY.w + 4, d: KEY.d + 4, r: 1 }; return floor(plan, MT, 3, "") + L(k.planOutline(plan, MT, P, 3), { tone: "mid" }) }
function keycap(c, h, isBright, mark) {
  const plan = { x: c.x, y: c.y, w: KEY.w, d: KEY.d, r: 1 }, paths = k.slabOf(plan, MT, h, P, 4, 0.8);
  const body = isBright ? bright(paths, "hoja") : S(paths, { tone: "hi", crease: "lo" });
  return body + mark(c.x + KEY.w / 2, c.y + KEY.d / 2, MT + h);
}
// the key is neutral, so its mark takes the theme ink ("hi"); "ink" is fixed dark, for marks on a bright
const cmdMark = (cx, cy, z) => L(cmdGlyph(cx, cy, z), { tone: "hi" });
// ⌘: a square with a loop on each corner
const cmdGlyph = (cx, cy, z) => {
  const s = 4.5, r = 2.6, sq = [[cx - s, cy - s], [cx + s, cy - s], [cx + s, cy + s], [cx - s, cy + s]];
  return k.onTop(sq, z, P, true) + sq.map(([x, y]) => k.ring(x + Math.sign(x - cx) * r, y + Math.sign(y - cy) * r, r, z, P, 20)).join("");
};
// Z: printed on the key top in the face's own plane, so it reads as a Z from this camera (Controls' "18" does the same)
const zText = (cx, cy, z) => k.faceTextSvg(k.topMatrix([cx - 5, cy + 6], z, P, "x"), "Z", { size: 17, tone: "ink" }); // Nogal on the bright, in both themes

const zKey = at([Z.x + KEY.w * 0.4, Z.y + KEY.d, MT + (KEY_H - PRESSED) * 0.5]); // the pressed key's front face
const back = at([TILES_X[3] + TILE.w / 2, TILES_Y + TILE.d / 2, MT + 9]);
emit({
  name: "working", exportName: "WORKING_SVG", bright: "hoja",
  label: "A command key and a pressed Z key on a plate, in front of a row of saved states, the last one undone.",
  art: [plate(), history(), `<g ${up(14, 0.1)}>${undone()}</g>`, well(CMD), well(Z), keycap(CMD, KEY_H, false, cmdMark), `<g ${up(PRESSED)}>${keycap(Z, KEY_H - PRESSED, true, zText)}</g>`],
  pen: caption({ text: "undo anything", w: 164, side: "right", to: [zKey[0], zKey[1] + 6], bend: 0.2, seed: 13 }),
});
