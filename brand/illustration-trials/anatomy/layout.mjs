/* Kit · Layout: a glass stage (Cielo, the one bright) with an artboard on it, a panel docked
   either side and a tool dock in front. Coming apart, the panels lift out of their bays and
   float; the dock follows. node layout.mjs [--landing] */
import { k, P, at, S, L, D, MT, plate, floor, bright, up, emit, note, arrow, caption } from "./shared.mjs";

const STAGE = { x: -40, y: -46, w: 80, d: 74, r: 2 }, STAGE_H = 1.6;
const PANELS = [{ x: -80, y: -46, w: 32, d: 74, r: 3 }, { x: 48, y: -46, w: 32, d: 74, r: 3 }], PANEL_H = 7;
const DOCK = { x: -30, y: 35, w: 60, d: 11, r: 5.5 }, DOCK_H = 5;

const bays = () => [...PANELS, DOCK].map((p) => { const b = k.insetPlan(p, -1.6); return floor(b, MT) + L(k.planOutline(b, MT, P, 6), { tone: "mid" }); }).join("");
function stage() {
  const top = MT + STAGE_H, grid = [];
  for (let x = STAGE.x + 10; x < STAGE.x + STAGE.w - 1; x += 10) grid.push(k.lineOnTop([x, STAGE.y], [x, STAGE.y + STAGE.d], top, P));
  for (let y = STAGE.y + 10; y < STAGE.y + STAGE.d - 1; y += 10) grid.push(k.lineOnTop([STAGE.x, y], [STAGE.x + STAGE.w, y], top, P));
  const board = { x: STAGE.x + 16, y: STAGE.y + 16, w: 48, d: 42, r: 1 };
  return bright(k.slabOf(STAGE, MT, STAGE_H, P, 3, 0.3), "cielo") + L(grid.join(""), { tone: "ink-faint" })
    + S(k.slabOf(board, top, 0.4, P, 2), { tone: "ink", crease: "none", flat: true, className: "rueca-board" })
    + L(k.ring(board.x + 17, board.y + 22, 10, top + 0.4, P, 40), { tone: "ink" });
}
function panel(p, slider) {
  const top = MT + PANEL_H, out = [S(k.slabOf(p, MT, PANEL_H, P, 4, 0.6), { tone: "hi", crease: "lo" })];
  for (let i = 0; i < 5; i++) {
    const y = p.y + 11 + i * 12;
    if (slider) {
      out.push(L(k.planOutline({ x: p.x + 5, y, w: p.w - 10, d: 5, r: 2.5 }, top, P, 4), { tone: "lo" }));
      out.push(S(k.cylinder(p.x + 9 + (p.w - 18) * [0.2, 0.7, 0.45, 0.9, 0.35][i], y + 2.5, 2.4, top, 1.8, P, 20), { tone: "hi", crease: "lo" }));
    } else {
      const indent = [0, 6, 6, 0, 0][i];
      out.push(D([at([p.x + 6, y + 2.5, top])], { size: 1, tone: "mid" }), L(k.planOutline({ x: p.x + 10 + indent, y, w: p.w - 15 - indent, d: 5, r: 1.2 }, top, P, 3), { tone: "lo" }));
    }
  }
  return out.join("");
}
const dock = () => S(k.slabOf(DOCK, MT, DOCK_H, P, 6, 0.6), { tone: "hi", crease: "lo" })
  + [0, 1, 2, 3].map((i) => S(k.cylinder(DOCK.x + 12 + i * 12, DOCK.y + DOCK.d / 2, 3.4, MT + DOCK_H, 1.6, P, 24), { tone: "hi", crease: "lo" })).join("");

const edge = at([PANELS[1].x + PANELS[1].w * 0.4, PANELS[1].y + PANELS[1].d, MT + PANEL_H * 0.5]); // the docked panel's front face: the note is about panels
emit({
  name: "layout", exportName: "LAYOUT_SVG", bright: "cielo",
  label: "A glass stage with an artboard, a panel docked either side and a tool dock in front.",
  art: [plate(), bays(), stage(), `<g ${up(26)}>${panel(PANELS[0], false)}</g>`, `<g ${up(26, 0.06)}>${panel(PANELS[1], true)}</g>`, `<g ${up(14, 0.14)}>${dock()}</g>`],
  pen: caption({ text: "floating, docked or full-bleed", w: 346, side: "right", to: [edge[0], edge[1] + 6], bend: 0.18, seed: 5, lines: ["floating, docked", "or full-bleed"] }),
});
