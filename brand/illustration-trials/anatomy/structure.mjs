/* Kit · Structure: a layers tray. Rows sit in a shallow tray, each with its thumbnail, a name
   line, an eye stud and a lock stud. One row (Malva, the one bright) is lifted mid-drag above
   the slot it left, drawn as a dashed outline: reorder. One row's eye is pressed in: hidden.
   Coming apart, the dragged row lifts higher. node structure.mjs [--landing] */
import { k, P, at, S, L, MT, plate, floor, bright, up, emit, note, loop, caption } from "./shared.mjs";

const TRAY = { x: -66, y: -56, w: 132, d: 104, r: 1 };
const ROW = { x: -58, w: 116, d: 18 }, ROWS_Y = [-48, -26, -4, 18], DRAGGED = 1, HIDDEN = 3, H = 3, NAME_W = [40, 50, 30, 36];

function rowParts(y, z, ink = "mid", x0 = ROW.x) {
  const top = z + H, out = [];
  out.push(L(k.planOutline({ x: x0 + 6, y: y + 4, w: 8, d: 8, r: 1 }, top, P, 2), { tone: ink })); // thumbnail
  out.push(L(k.lineOnTop([x0 + 22, y + 8], [x0 + 22 + NAME_W[ROWS_Y.findIndex((r) => Math.abs(r - y) < 8)], y + 8], top, P), { tone: ink, free: true })); // name: a stand-in for text, so its ends float on purpose
  return out.join("");
}
const stud = (x, y, z, h, tone = "mid") => S(k.cylinder(x, y, 3, z, h, P, 18), { tone, crease: "none" });

function tray() {
  const out = [floor(TRAY, MT, 4, ""), L(k.planOutline(TRAY, MT, P, 4), { tone: "mid" })];
  ROWS_Y.forEach((y, i) => {
    const plan = { x: ROW.x, y, w: ROW.w, d: ROW.d, r: 1 };
    if (i === DRAGGED) { out.push(L(k.planOutline(plan, MT, P, 3), { tone: "mid", dashed: true })); return } // the slot it left
    out.push(S(k.slabOf(plan, MT, H, P, 3, 0.3), { tone: "hi", crease: "lo" }), rowParts(y, MT, i === HIDDEN ? "lo" : "mid"));
    // eye and lock studs at the right; the hidden row's eye is pressed flush
    out.push(stud(ROW.x + ROW.w - 24, y + 8, MT + H, i === HIDDEN ? 0.4 : 2.4), stud(ROW.x + ROW.w - 10, y + 8, MT + H, 2.4));
  });
  return out.join("");
}
function dragged() {
  const y = ROWS_Y[DRAGGED] + 6, z = MT + 12, plan = { x: ROW.x + 6, y, w: ROW.w, d: ROW.d, r: 1 };
  return bright(k.slabOf(plan, z, H, P, 3, 0.3), "cielo") + rowParts(y, z, "ink", plan.x)
    + stud(plan.x + ROW.w - 24, y + 8, z + H, 2.4) + stud(plan.x + ROW.w - 10, y + 8, z + H, 2.4);
}

const studs = at([ROW.x + ROW.w - 17, ROWS_Y[HIDDEN] + 8, MT + H + 1]); // the hidden row's eye and lock: they stay put, so the loop stays on them
emit({
  name: "structure", exportName: "STRUCTURE_SVG", bright: "cielo",
  label: "A layers tray: rows with thumbnails, names, eye and lock studs, one row lifted mid-drag above its empty slot.",
  art: [plate(), tray(), `<g ${up(10)}>${dragged()}</g>`],
  pen: caption({ text: "hide, lock, reorder", w: 215, side: "centre", to: studs, loop: [30, 16, 24, 1.4], seed: 11 }),
});
