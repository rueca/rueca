/**
 * Controls: a hardware control strip on four feet, a fader, a knob and a
 * toggle set into one plate. The pointer picks a control; it lifts straight
 * up out of its seat, so its stem shows, and takes the bright edge, while the
 * others settle back, staggered outwards from it. At rest the fader sits a
 * little under half way, the knob is turned to 0.72 and the toggle is thrown,
 * and the fader's cap holds the bright edge. The slider is the lift, in units.
 *
 * The pattern: discrete items (Riffle). Tweens, a stagger by distance, and a
 * hit test on the rest centres' screen x, so a part rising cannot flip it.
 */
const {
  Cam, circ, clamp, facing, fillet, fit, hull, open, poly, prism, proj, rad, ringAt, rings, rrect, run, seg,
  tset, tval, tdone, tween, disposer, mk, pointer, put, register, solid,
} = HL;

const W = 160, D = 76, FT = 6, T = 10, STEP = 45, TOP = 34;
const FX = 27, FY0 = 12, FY1 = 64, FV = 0.45, FY = FY1 - FV * (FY1 - FY0);
const KX = 80, KY = 38, KV = 0.72, TX = 132, TY = 38, THROW = 24;

/** A ring moved to (cx, cy), and a circle of radius R there with its crease ring b inside. */
const at = (ring, cx, cy) => ring.map((q) => ({ ...q, u: q.u + cx, v: q.v + cy }));
const cyl = (cx, cy, R, b, n = 24) => [at(circ(R, n), cx, cy), at(circ(R - b, n), cx, cy)];

/** A hexagon nut as a ring of samples, its corners filleted; inner is the crease ring, b inside. */
function hex(cx, cy, R, b) {
  const mkRing = (r) => fillet([0, 1, 2, 3, 4, 5].map((k) => [r * Math.cos(rad(60 * k + 15)), r * Math.sin(rad(60 * k + 15))]), [1, 1, 1, 1, 1, 1], 3)
    .map(([u, v]) => { const l = Math.hypot(u, v); return { u: u + cx, v: v + cy, nu: u / l, nv: v / l }; });
  return [mkRing(R), mkRing(R - b)];
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let LIFT = value;

  // Fitted to the knob lifted its furthest (the range's top), so no pose leaves the frame.
  const C = Cam(45, 0.5, 1.82);
  fit(C, [[0, 0, 0], [W, D, 0], [W, 0, 0], [0, D, 0], [KX - 12, KY - 12, T + 21 + TOP], [TX + 10, TY, T + 30 + TOP]], 200, 170);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  const path = (cls, d = "") => mk("path", { d, class: cls }, g);

  // The base: four feet, the plate, its seam, its screws. None of it moves.
  for (const [x, y] of [[14, 14], [W - 14, 14], [14, D - 14], [W - 14, D - 14]]) {
    const [r, i] = rings(x - 6, y - 6, x + 6, y + 6, 4, 1); put(solid(g), prism(P, front, r, i, 0, FT));
  }
  const [pr, pi] = rings(0, 0, W, D, 9, 1.6);
  put(solid(g), prism(P, front, pr, pi, FT, T));
  path("nf lo", poly(ringAt(P, rrect(4.5, 4.5, W - 4.5, D - 4.5, 6.5, 6), T)));
  const screw = (x, y, a) => {
    path("nf", poly(ringAt(P, at(circ(2.8, 12), x, y), T)));
    path("nf lo", seg(P(x - 2 * Math.cos(rad(a)), y - 2 * Math.sin(rad(a)), T), P(x + 2 * Math.cos(rad(a)), y + 2 * Math.sin(rad(a)), T)));
  };
  screw(9.5, 9.5, 20); screw(W - 9.5, 9.5, 70); screw(9.5, D - 9.5, 110);

  // Fader: a slot with its scale beside it, and a stepped cap on a blade stem.
  path("nf", poly(ringAt(P, rrect(FX - 2.2, FY0 - 3, FX + 2.2, FY1 + 3, 2.2, 4), T)));
  path("nf lo", open(ringAt(P, run(rrect(FX - 2.2, FY0 - 3, FX + 2.2, FY1 + 3, 2.2, 4), (q) => !front(q)), T - 1.5)));
  for (let k = 0; k <= 10; k++) {
    const y = FY1 - k * (FY1 - FY0) / 10, long = k % 5 === 0;
    path("nf lo", seg(P(FX + 12, y, T), P(FX + (long ? 19 : 16), y, T)));
  }
  const fader = { stem: solid(g), skirt: solid(g), grip: solid(g), line: path("nf") };
  const fs = rings(FX - 1.2, FY - 3, FX + 1.2, FY + 3, 1, 0.4), fk = rings(FX - 9, FY - 6, FX + 9, FY + 6, 2.6, 1.1);
  const fg = rings(FX - 7, FY - 3.6, FX + 7, FY + 3.6, 2, 0.9);
  fader.draw = (z) => {
    const b = T + 2 + z;
    put(fader.stem, prism(P, front, ...fs, T, b));
    put(fader.skirt, prism(P, front, ...fk, b, b + 3.5));
    put(fader.grip, prism(P, front, ...fg, b + 3.5, b + 11));
    fader.line.setAttribute("d", seg(P(FX - 5.5, FY, b + 11), P(FX + 5.5, FY, b + 11)));
  };
  fader.sils = [fader.skirt.sil, fader.grip.sil, fader.line];

  // Knob: a scale round a collar, a shaft, and a knurled cylinder with its pointer on top.
  for (let k = 0; k <= 10; k++) {
    const a = rad(-135 + k * 27), s = Math.sin(a), c = -Math.cos(a), r1 = k % 5 === 0 ? 24 : 21.5;
    path("nf lo", seg(P(KX + 18.5 * s, KY + 18.5 * c, T), P(KX + r1 * s, KY + r1 * c, T)));
  }
  put(solid(g), prism(P, front, ...cyl(KX, KY, 15, 1.3), T, T + 3.5));
  const knob = { stem: solid(g), body: solid(g), knurl: path("nf lo"), line: path("nf") };
  const ks = cyl(KX, KY, 3.6, 0.9, 12), kb = cyl(KX, KY, 11.5, 1.8, 28), pa = rad(-135 + KV * 270);
  knob.draw = (z) => {
    const b = T + 3.5 + z;
    put(knob.stem, z > 0.2 ? prism(P, front, ...ks, T + 3.5, b) : { sil: "", crease: "" });
    put(knob.body, prism(P, front, ...kb, b, b + 17));
    let d = "";
    for (let k = 0; k < 24; k++) {
      const a = rad(k * 15), q = { nu: Math.cos(a), nv: Math.sin(a) }, n = (t) => ({ nu: Math.cos(a + t), nv: Math.sin(a + t) });
      // knurls stay well inside the silhouette, so none reads as a vertical corner
      if (front(n(-0.5)) && front(n(0.5))) d += seg(P(KX + 11.5 * q.nu, KY + 11.5 * q.nv, b + 1.5), P(KX + 11.5 * q.nu, KY + 11.5 * q.nv, b + 12));
    }
    knob.knurl.setAttribute("d", d);
    const ps = Math.sin(pa), pc = -Math.cos(pa);
    knob.line.setAttribute("d", seg(P(KX + 1 * ps, KY + 1 * pc, b + 17), P(KX + 9.7 * ps, KY + 9.7 * pc, b + 17)));
  };
  knob.sils = [knob.body.sil, knob.line];

  // Toggle: a seat, a threaded stem, a hex nut, a bushing, and a bat lever thrown toward +x.
  path("nf lo", poly(ringAt(P, at(circ(6, 16), TX, TY), T)));
  const tog = { stem: solid(g), nut: solid(g), bush: solid(g), thread: path("nf lo"), lever: path("sil") };
  const ts = cyl(TX, TY, 3.2, 0.7, 12), tn = hex(TX, TY, 9, 1.3), tb = cyl(TX, TY, 4.6, 1, 16);
  const ax = [Math.sin(rad(THROW)), 0, Math.cos(rad(THROW))], e1 = [Math.cos(rad(THROW)), 0, -Math.sin(rad(THROW))];
  tog.draw = (z) => {
    const b = T + z;
    put(tog.stem, z > 0.2 ? prism(P, front, ...ts, T, b) : { sil: "", crease: "" });
    put(tog.nut, prism(P, front, ...tn, b, b + 3.5));
    put(tog.bush, prism(P, front, ...tb, b + 3.5, b + 12.5));
    tog.thread.setAttribute("d", [b + 6.5, b + 9.5].map((h) => open(ringAt(P, run(tb[0], front), h))).join(""));
    const pts = [];
    for (const [l, r] of [[0, 2], [19, 3.2], [21.3, 2]]) for (let k = 0; k < 12; k++) {
      const c = Math.cos(rad(k * 30)) * r, s = Math.sin(rad(k * 30)) * r, o = [TX, TY, b + 12];
      pts.push(P(o[0] + ax[0] * l + e1[0] * c, o[1] + s, o[2] + ax[2] * l + e1[2] * c));
    }
    tog.lever.setAttribute("d", poly(hull(pts)));
  };
  tog.sils = [tog.nut.sil, tog.bush.sil, tog.lever];
  screw(W - 9.5, D - 9.5, 160);

  const parts = [fader, knob, tog], NAMES = ["grain 18", "drift 0.72", "loop on"];
  // Rest is a slight, uneven explode; a pick seats the others and lifts the one chosen.
  const REST = [1.5, 4.5, 3];
  parts.forEach((p, i) => { p.z = tween(REST[i]); p.drawn = NaN; });
  const cx = [P(FX, FY, T)[0], P(KX, KY, T)[0], P(TX, TY, T)[0]];

  // The gate: the hull of the base and every control lifted, a fixed shape for a given lift.
  let gate = [];
  const regate = () => {
    gate = hull([0, T].flatMap((z) => ringAt(P, pr, z)).concat(
      [[FX, FY, T + 13], [KX, KY, T + 21], [TX + 9, TY, T + 30]].flatMap(([x, y, z]) => [P(x - 12, y, z + LIFT), P(x, y - 12, z + LIFT)])));
  };
  regate();
  const inside = ([x, y]) => gate.every((a, i) => {
    const b = gate[(i + 1) % gate.length];
    return (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]) >= 0;
  }) || gate.every((a, i) => {
    const b = gate[(i + 1) % gate.length];
    return (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]) <= 0;
  });
  /** The control nearest the pointer by its REST centre's screen x; -1 off the strip. */
  const hit = (p) => (inside(p) ? cx.reduce((m, x, i) => (Math.abs(p[0] - x) < Math.abs(p[0] - cx[m]) ? i : m), 0) : -1);

  const B = register(stage, (_dt, now) => {
    let moving = false;
    for (const p of parts) {
      const z = tval(p.z, now);
      if (z !== p.drawn) { p.drawn = z; p.draw(z); }
      if (!tdone(p.z, now)) moving = true;
    }
    return moving;
  });
  bag.add(B.unregister);

  let act = -1;
  function setActive(a, force) {
    if (a === act && !force) return;
    const now = performance.now(), from = a >= 0 ? a : Math.max(act, 0);
    act = a;
    parts.forEach((p, i) => {
      tset(p.z, a < 0 ? REST[i] : i === a ? LIFT : 0, now, Math.abs(i - from) * STEP);
      const lit = a < 0 ? i === 0 : i === a;
      p.sils.forEach((el) => el.classList.toggle("hi", lit));
    });
    read.textContent = a < 0 ? "rest" : NAMES[a];
    B.wake();
  }
  setActive(-1, true);

  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { LIFT = clamp(v, 0, TOP); regate(); setActive(act, true); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "controls",
  means: "A control strip with a fader, a knob and a toggle: the one under the pointer lifts out of its seat.",
  rules: [1, 2, 5, 9],
  range: [14, 24, 34],
  tour: [[128, 122], [200, 140], [270, 182], null],
  mount,
});
