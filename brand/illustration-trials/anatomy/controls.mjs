/* Kit · Controls: three real controls on one plate. A fader (its cap the one bright, Achiote)
   in a slot, a knurled knob on a dial, and a window that reads the value. Coming apart, the
   cap and the knob lift off their stems. node controls.mjs [--landing] */
import { k, P, at, S, L, D, MT, plate, floor, bright, up, emit, caption } from "./shared.mjs";

const SLOT = { x: -72, y: -40, w: 104, d: 6, r: 3 }, SLOT_Y = SLOT.y + 3;
const TRAVEL = [SLOT.x + 8, SLOT.x + SLOT.w - 8], GRAIN = 18 / 40;
const CAP = { w: 11, d: 15 }, CAP_H = 9, CAP_X = TRAVEL[0] + GRAIN * (TRAVEL[1] - TRAVEL[0]);
const KNOB = [-44, 20], KNOB_R = 10, DIAL_R = 19, SWEEP = [-0.75 * Math.PI, 1.5 * Math.PI];
const LCD = { x: 18, y: 4, w: 54, d: 28, r: 3 };

function face() {
  const out = [floor(SLOT, MT, 6, ""), L(k.planOutline(SLOT, MT, P, 6), { tone: "mid" })];
  const [kx, ky] = KNOB;
  out.push(S(k.cylinder(kx, ky, DIAL_R, MT, 0.6, P, 64), { tone: "lo", crease: "none" }));
  const dial = k.radialTicks(kx, ky, DIAL_R, 4, 1, MT + 0.6, [3, 3.6], P, SWEEP[0], SWEEP[1]);
  out.push(L(dial.major, { tone: "mid" }), L(k.ring(kx, ky, DIAL_R - 3.6, MT + 0.6, P, 64), { tone: "faint" }));
  out.push(S(k.cylinder(kx, ky, 2.6, MT + 0.6, 9, P, 16), { tone: "mid", crease: "none" }));
  out.push(S(k.slabOf(LCD, MT, 3, P, 4, 0.6), { tone: "mid" }));
  const glass = k.insetPlan(LCD, 4);
  out.push(floor(glass, MT + 3, 3), L(k.planOutline(glass, MT + 3, P, 3), { tone: "lo" }));
  out.push(k.faceTextSvg(k.topMatrix([glass.x + glass.w - 5, glass.y + glass.d / 2 + 4], MT + 3, P, "x"), "18", { size: 11, tone: "hi", anchor: "end" }));
  return out.join("");
}
const stem = () => S(k.slabOf({ x: CAP_X - 1.5, y: SLOT_Y - 1.2, w: 3, d: 2.4, r: 0.6 }, MT - 2, 8, P, 2), { tone: "mid", crease: "none" });
const cap = () => {
  const plan = { x: CAP_X - CAP.w / 2, y: SLOT_Y - CAP.d / 2, w: CAP.w, d: CAP.d, r: 2 };
  return bright(k.slabOf(plan, MT + 0.6, CAP_H - 0.6, P, 4, 0.6), "achiote")
    + [-2.8, 0, 2.8].map((dx) => L(k.lineOnTop([CAP_X + dx, plan.y], [CAP_X + dx, plan.y + plan.d], MT + CAP_H, P), { tone: "ink" })).join("");
};
const knob = () => {
  const [kx, ky] = KNOB, z0 = MT + 2.5, z1 = z0 + 11, a = SWEEP[0] + 0.72 * SWEEP[1], s = Math.sin(a), c = -Math.cos(a);
  return S(k.cylinder(kx, ky, KNOB_R, z0, z1 - z0, P, 48, 0.8), { tone: "hi", crease: "lo" }) + L(k.knurl(kx, ky, KNOB_R, z0, z1, 40, P), { tone: "lo" })
    + L(k.lineOnTop([kx + s * 1.5, ky + c * 1.5], [kx + s * KNOB_R, ky + c * KNOB_R], z1, P), { tone: "hi", free: "start" });
};

const lcdAt = at([LCD.x + LCD.w * 0.35, LCD.y + LCD.d, MT + 1.5]); // the readout's front edge: the field you type in (and drag the fader to)
emit({
  name: "controls", exportName: "CONTROLS_SVG", bright: "achiote",
  label: "Three controls on a plate: a fader in its slot, a knurled knob on a dial, and a window that reads 18.",
  art: [plate(), face(), stem(), `<g ${up(22)}>${cap()}</g>`, `<g ${up(24, 0.1)}>${knob()}</g>`],
  pen: caption({ text: "drag, type, or do maths", w: 294, side: "left", to: [lcdAt[0], lcdAt[1] + 6], bend: -0.25, seed: 3 }),
});
