/* Kit · Time: three tracks with keyframe studs, a ruler along the back and a gantry riding
   two rails over them: the playhead. One key is being set (Gualda, the one bright). Coming
   apart, the gantry slides along the tracks. node time.mjs [--landing] */
import { k, P, at, S, L, MT, plate, floor, bright, apart, emit, note, loop, caption } from "./shared.mjs";

const X0 = -76, X1 = 68;
const RULER = { x: X0, y: -58, w: X1 - X0, d: 5, r: 1 };
const RAILS = [{ x: X0, y: -50, w: X1 - X0, d: 6, r: 3 }, { x: X0, y: 28, w: X1 - X0, d: 6, r: 3 }];
const TRACKS = [-30, -8, 14], KEYS = [[-58, -10, 36], [-40, 14, 50], [-64, -26, 28]], SET = [1, 1];
const HEAD = -22, TRAVEL = 40;

function bed() {
  const out = [S(k.slabOf(RULER, MT, 0.6, P, 3), { tone: "lo" })];
  const t = k.topTicks(X0 + 4, X1 - 4, 6.8, 5, RULER.y + RULER.d, MT + 0.6, [-2.4, -RULER.d], P);
  out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
  for (const r of RAILS) out.push(floor(r, MT, 6, ""), L(k.planOutline(r, MT, P, 6), { tone: "mid" }));
  for (const y of TRACKS) { const tr = { x: X0, y: y - 4, w: X1 - X0, d: 8, r: 4 }; out.push(floor(tr, MT, 6), L(k.planOutline(tr, MT, P, 6), { tone: "mid" })); }
  return out.join("");
}
const diamond = (x, y, r) => [[x + r, y], [x, y + r], [x - r, y], [x, y - r]];
function keys() {
  const list = [];
  TRACKS.forEach((y, t) => KEYS[t].forEach((x, i) => list.push({ x, y, set: t === SET[0] && i === SET[1] })));
  list.sort((a, b) => k.depthOf([a.x, a.y, 0], P) - k.depthOf([b.x, b.y, 0], P));
  return list.map(({ x, y, set }) => { const paths = k.extrude(diamond(x, y, 5), MT, 3.6, P, { bevel: 0.4 }); return set ? bright(paths, "malva") : S(paths, { tone: "hi", crease: "lo" }); }).join("");
}
function gantry() {
  const legs = [RAILS[0].y - 1, RAILS[1].y - 1].map((y) => S(k.slabOf({ x: HEAD - 3, y, w: 6, d: 8, r: 1.5 }, MT, 16, P, 3, 0.4), { tone: "hi", crease: "lo" }));
  const beam = S(k.slabOf({ x: HEAD - 2.5, y: RAILS[0].y - 1, w: 5, d: RAILS[1].y - RAILS[0].y + 8, r: 1.5 }, MT + 16, 3, P, 3, 0.4), { tone: "hi", crease: "lo" });
  return legs[0] + legs[1] + beam;
}

const key = at([KEYS[1][1], TRACKS[1], MT + 2]);
emit({
  name: "time", exportName: "TIME_SVG", bright: "malva",
  label: "Three tracks of keyframe studs under a gantry that rides two rails, with a ruler along the back.",
  art: [plate(), bed(), keys(), `<g ${apart([TRAVEL, 0, 0])}>${gantry()}</g>`],
  pen: caption({ text: "always in sync", w: 185, side: "left", to: key, loop: [30, 19, 24, 1.2], seed: 7 }),
});
