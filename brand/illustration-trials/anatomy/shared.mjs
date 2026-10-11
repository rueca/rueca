/* What every kit drawing shares: the Anatomy kit (~/.claude/skills/anatomy), one camera and
   scale, the bench plate on its feet, Rueca's engraving layer (hatched sides, hatched cast
   shadow, one flat bright) and the two outputs:
   - a trial page next to this file (<name>.html, <name>-light.html) for Anatomy's checks
     (scripts/capture.mjs, lines.mjs, drive.mjs); hover the stage to take it apart;
   - with --landing, src/landing/art/<name>.ts plus the shared src/landing/art/iso.css.
   Parts come apart with P = max(--kp, --kh), the kit card's scroll/hover progress, in pure
   CSS, so the trial page and the landing show exactly the same drawing. */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const SKILL = join(homedir(), ".claude/skills/anatomy");
const kit = await import(join(SKILL, "kit/iso-kit.mjs"));
/* Sharp, to match the lámina's crisp rules and crosshairs: every rounded plan keeps a corner of
   at most SHARP units (plates, panels, bubbles and slots get crisp corners; knobs, rings and the
   mark are drawn as circles and stay round), and the soft top bevels are halved. */
const SHARP = 1, BEVEL = 0.5;
const sharp = (plan) => ({ ...plan, r: Math.min(plan.r ?? 0, SHARP) });
export const k = {
  ...kit,
  roundedPlan: (plan, steps) => kit.roundedPlan(sharp(plan), steps),
  ringOf: (plan, steps) => kit.ringOf(sharp(plan), steps),
  slabOf: (plan, z, height, projection, steps, bevel = 0) => kit.slabOf(sharp(plan), z, height, projection, steps, bevel * BEVEL),
  planOutline: (plan, z, projection, steps) => kit.planOutline(sharp(plan), z, projection, steps),
  sideSeam: (plan, z, projection, steps) => kit.sideSeam(sharp(plan), z, projection, steps),
  extrude: (ring, z, height, projection, options = {}) => kit.extrude(ring, z, height, projection, { ...options, bevel: (options.bevel ?? 0) * BEVEL }),
  cylinder: (cx, cy, radius, z, height, projection, steps, bevel = 0) => kit.cylinder(cx, cy, radius, z, height, projection, steps, bevel * BEVEL),
};
const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = join(HERE, "../../../src/landing/art");

export const LANDING = process.argv.includes("--landing");
export const WIDTH = 600, HEIGHT = 600, FIT_H = 520; // the object sits in the upper part, the hand notes round it

// the one plate every drawing stands on (z = 0 is the bench, MT its top)
export const MOD = { x: -92, y: -60, w: 184, d: 110, r: 6 };
export const MT = 6;
// the light comes from -x, +y (the kit's shading), so the cast shadow falls toward +x
const SHADOW = [20, 0];

/* One camera and scale for the whole set, fitted to the plate plus the headroom the tallest
   lift needs, so every tile draws at the same size. */
export const P = k.fitProjection(
  [...k.boxCorners(MOD, 0, MT), [MOD.x, MOD.y, 46], [MOD.x + MOD.w, MOD.y, 46], [MOD.x, MOD.y + MOD.d, 30]],
  WIDTH, FIT_H, { pad: 40, azimuth: 38, elevation: 36 },
);
export const at = (point) => k.iso(point, P);
export const S = (paths, style) => k.solidSvg(paths, style);
export const L = (d, style) => k.lineSvg(d, style);
export const D = (points, style) => k.dotsSvg(points, style);
export const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
/** a recessed floor (glass, a well, a slot): flat, tinted */
export const floor = (plan, z, steps = 4, className = "rueca-glass") => S(k.slabOf(plan, z - 0.01, 0.01, P, steps), { tone: "lo", flat: true, crease: "none", className });

/* Engraving: each side shade is a field of vertical hatch lines, closer together on faces
   turned away from the light; lit faces and tops stay bare paper. Pattern units are viewBox
   units, sized for the tile (325–373 px for a 600-unit sheet). */
const HATCH = [2.4, 3.6, 6, 0];
const pattern = (id, spacing, cls, angle = 0, bg = "") =>
  `<pattern id="${id}" width="${spacing}" height="20" patternUnits="userSpaceOnUse"${angle ? ` patternTransform="rotate(${angle})"` : ""}>${bg ? `<rect width="${spacing}" height="20" fill="${bg}"/>` : ""}<path class="${cls}" d="M${spacing / 2} 0V20"/></pattern>`;
export const BRIGHTS = { achiote: "#E8582C", cielo: "#5DB4E8", gualda: "#F2C744", hoja: "#2FA57C", malva: "#A88BF6", cochinilla: "#EE7A68" };
/** the hatch patterns; `brights` is the drawing's flat colour (or, for the build-up, one per step) */
export const defs = (brights) => `<defs>${HATCH.map((sp, i) => (sp ? pattern(`kit-h${i}`, sp, "rueca-hatch") + [brights].flat().map((b) => pattern(`kit-b${i}-${b}`, sp, "rueca-hatch-bright", 0, BRIGHTS[b])).join("") : "")).join("")}${HATCH.map((sp, i) => (sp ? `<pattern id="kit-b${i}-logo" width="${sp}" height="20" patternUnits="userSpaceOnUse"><rect width="${sp}" height="20" style="fill:var(--logo-card)"/><path class="rueca-hatch-bright" d="M${sp / 2} 0V20"/></pattern>` : "")).join("")}${pattern("kit-cast", 3, "rueca-hatch-cast", 45)}<linearGradient id="kit-fade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><mask id="kit-mask" maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill="url(#kit-fade)"/></mask></defs>`;
/** a solid in this drawing's bright, hatched on its shaded sides */
export const bright = (paths, name, style = {}) => S(paths, { tone: "hi", crease: "lo", lit: true, className: `rueca-bright rueca-${name}`, ...style });

/** the plate the parts are mounted in, for the objects that are a panel or a bed */
export const plate = (plan = MOD, top = MT) => `<g class="rueca-plate">${S(k.slabOf(plan, 0, top, P, 6, 0.8), { tone: "mid" })}</g>`;

/* The pen: handwritten notes, arrows and loops in Achiote, as if marked up on the drawing.
   A little wobble, drawn from a seed, so each gesture reads hand-made and stays the same
   between builds. Coordinates are the sheet's (0–600). */
const wob = (seed) => (t) => Math.sin(seed * 12.9898 + t * 7.3) * 0.5 + Math.sin(seed * 4.1 + t * 13.7) * 0.3;
const pts = (list) => list.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("");
/** a note in the hand, tilted a touch */
export const note = (x, y, text, { rotate = -3, size = 30, anchor = "middle" } = {}) =>
  `<text class="rueca-note" x="${x}" y="${y}" font-size="${size}" text-anchor="${anchor}" transform="rotate(${rotate} ${x} ${y})">${text}</text>`;
/** a hand arrow: a bowed stroke from `a` to `b`, an open head of two flicks */
export function arrow([ax, ay], [bx, by], { bend = 0.18, seed = 1 } = {}) {
  const w = wob(seed), dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len;
  const line = Array.from({ length: 25 }, (_, i) => {
    const t = i / 24, bow = Math.sin(Math.PI * t) * bend * len + w(t) * 1.2;
    return [ax + dx * t + nx * bow, ay + dy * t + ny * bow];
  });
  const [px, py] = line[22], ang = Math.atan2(by - py, bx - px), head = 11;
  const flick = (da, l) => [[bx, by], [bx - Math.cos(ang + da) * l, by - Math.sin(ang + da) * l]];
  return `<path class="rueca-pen" d="${pts(line)}${pts(flick(0.5, head))}${pts(flick(-0.42, head * 0.85))}"/>`;
}
/** a hand loop round something: an ellipse that overshoots where it closes */
export function loop([cx, cy], rx, ry, { tilt = -8, seed = 2, from = -2.2, tail } = {}) {
  const w = wob(seed), c = Math.cos((tilt * Math.PI) / 180), s = Math.sin((tilt * Math.PI) / 180);
  const line = Array.from({ length: 56 }, (_, i) => {
    const t = i / 55, a = from + t * (Math.PI * 2 + 0.55), grow = 1 + 0.07 * t + w(t) * 0.03;
    const x = Math.cos(a) * rx * grow, y = Math.sin(a) * ry * grow;
    return [cx + x * c - y * s, cy + x * s + y * c];
  });
  // a tail: the pen runs on from where the loop closes to the note it belongs to
  if (tail) {
    const [sx, sy] = line[line.length - 1], [tx, ty] = tail, len = Math.hypot(tx - sx, ty - sy), nx = -(ty - sy) / len, ny = (tx - sx) / len;
    for (let i = 1; i <= 16; i++) { const t = i / 16, bow = Math.sin(Math.PI * t) * 0.12 * len + w(t + 3) * 1.2; line.push([sx + (tx - sx) * t + nx * bow, sy + (ty - sy) * t + ny * bow]); }
  }
  return `<path class="rueca-pen" d="${pts(line)}"/>`;
}

/* Coming apart: a part moves by `by` (world units) times P; `delay` (0–1) staggers it. */
const PROGRESS = "max(var(--kp, 0), var(--kh, 0))";
export function apart(by, delay = 0) {
  const [dx, dy] = k.axisVector(P, by);
  const t = delay ? `clamp(0, (${PROGRESS} - ${delay}) / ${1 - delay}, 1)` : PROGRESS;
  return `style="transform:translate(calc(${t} * ${dx.toFixed(2)}px), calc(${t} * ${dy.toFixed(2)}px));transition:transform 600ms cubic-bezier(.22,1,.36,1)"`;
}
export const up = (z, delay) => apart([0, 0, z], delay);
/** a part that arrives as P plays: drawn where it ends up, it starts offset by `by` and travels in */
export function arrive(by, delay = 0) {
  const [dx, dy] = k.axisVector(P, by);
  const t = `(1 - clamp(0, (${PROGRESS} - ${delay}) / ${1 - delay}, 1))`;
  return `style="transform:translate(calc(${t} * ${dx.toFixed(2)}px), calc(${t} * ${dy.toFixed(2)}px));transition:transform 700ms cubic-bezier(.22,1,.36,1)"`;
}
/** fades in as P plays (pen marks that point at a part that has arrived) */
export const appear = (delay = 0) => `style="opacity:clamp(0, (${PROGRESS} - ${delay}) / ${1 - delay}, 1);transition:opacity 500ms ease"`;
/** fades out as P plays (a part that leaves) */
export const leave = (delay = 0) => `style="opacity:calc(1 - clamp(0, (${PROGRESS} - ${delay}) / ${1 - delay}, 1));transition:opacity 500ms ease"`;

const mix = (n, base = "var(--sheet)") => `color-mix(in srgb, var(--fg) ${n}%, ${base})`;
const brightCss = Object.entries(BRIGHTS).map(([n, c]) => [
  `.rueca-${n}>.iso-fill,.rueca-${n}>.iso-top{fill:${c}!important}`,
  ...[0, 1, 2].map((i) => `.rueca-${n}>.iso-shade[data-shade="${i}"]{fill:url(#kit-b${i}-${n})!important}`),
  `.rueca-${n}>.iso-shade[data-shade="3"]{fill:${c}!important}`,
].join("\n")).join("\n");
const ENGRAVING = `
.iso-shade[data-shade="0"]{fill:url(#kit-h0)}
.iso-shade[data-shade="1"]{fill:url(#kit-h1)}
.iso-shade[data-shade="2"]{fill:url(#kit-h2)}
.iso-shade[data-shade="3"]{fill:none}
.iso-solid[data-lit]>.iso-shade{fill:url(#kit-h2)}
${brightCss}
.rueca-bright>.iso-edge,.rueca-bright>.iso-crease,.rueca-bright>.iso-bevel{stroke:#181411!important}
.rueca-bright{color:#181411}
.rueca-glass>.iso-fill{fill:var(--anatomy-shade-0)}
.rueca-hatch,.rueca-hatch-bright,.rueca-hatch-cast{fill:none;stroke-width:.45;stroke-linecap:butt}
.rueca-hatch{stroke:var(--rueca-hatch)}
.rueca-hatch-bright{stroke:#3a1408;stroke-opacity:.45}
.rueca-hatch-cast{stroke:var(--rueca-hatch);stroke-opacity:.7}
.rueca-cast{fill:url(#kit-cast);stroke:none}
.iso-line[data-tone="ink"]{stroke:#181411}
.iso-face-text[data-tone="ink"]{fill:#181411}
@media (prefers-reduced-motion: reduce){.iso-svg *{transition:none!important}}
@property --s1{syntax:'<number>';inherits:true;initial-value:0}
@property --s2{syntax:'<number>';inherits:true;initial-value:0}
@property --s3{syntax:'<number>';inherits:true;initial-value:0}
.rueca-chat{fill:var(--anatomy-hi);font-family:var(--font-body,"IBM Plex Sans",system-ui,sans-serif);font-weight:450}
.rueca-chat-ink{fill:#181411}
.rueca-chat-strong{font-weight:550}
/* the logo on its card: a deep Cielo with a white mark in dark, the light Cielo with an ink mark in light */
.rueca-logo-card>.iso-fill,.rueca-logo-card>.iso-top,.rueca-logo-card>.iso-shade[data-shade="3"]{fill:var(--logo-card)!important}
.rueca-logo-card>.iso-shade[data-shade="0"]{fill:url(#kit-b0-logo)!important}
.rueca-logo-card>.iso-shade[data-shade="1"]{fill:url(#kit-b1-logo)!important}
.rueca-logo-card>.iso-shade[data-shade="2"]{fill:url(#kit-b2-logo)!important}
.rueca-pale .rueca-logo-card>.iso-fill,.rueca-pale .rueca-logo-card>.iso-top,.rueca-pale .rueca-logo-card>.iso-shade{fill:color-mix(in srgb,var(--logo-card) 34%,var(--anatomy-paper))!important}
.rueca-mark-outline{fill:none;stroke:var(--logo-ink);stroke-opacity:.6;stroke-width:.55px;vector-effect:non-scaling-stroke}
.rueca-mark-trace{fill:none;stroke:var(--logo-ink);stroke-width:1.1;stroke-linecap:round;stroke-linejoin:round}
.rueca-mark-fill{fill:var(--logo-ink)}
/* the mark's strokes scale with the sheet (the kit pins every other stroke to screen pixels), so their dashes measure true */
.iso-svg .rueca-mark-band,.iso-svg .rueca-mark-trace,.iso-svg .rueca-mark-edge{vector-effect:none}
.rueca-mark-band{fill:none;stroke:var(--logo-ink);stroke-linejoin:round}
.rueca-pale .iso-fill,.rueca-pale .iso-top{fill:color-mix(in srgb,#5DB4E8 30%,var(--anatomy-paper))!important}
.rueca-pale .iso-shade{fill:color-mix(in srgb,#5DB4E8 22%,var(--anatomy-paper))!important}
.rueca-pale .iso-edge{stroke:var(--anatomy-mid)!important}
.iso-line[data-tone="ink-faint"]{stroke:#181411;stroke-opacity:.2}
.rueca-board>.iso-fill{fill:#fff;fill-opacity:.35}
.rueca-board>.iso-edge{stroke:#181411}
.iso-svg .rueca-note{fill:var(--ink-achiote,#b8381b);font-family:var(--font-hand,"La Belle Aurore",cursive)}
.iso-svg .pen-ink{fill:none;stroke:#fff;stroke-linecap:round;stroke-linejoin:round;vector-effect:none;stroke-dasharray:var(--len) var(--len);stroke-dashoffset:calc(var(--len) * (1 - clamp(0, (var(--pw, 1) - var(--a)) / var(--f), 1)))}
.iso-svg .rueca-pen{fill:none;stroke:var(--ink-achiote,#b8381b);stroke-width:1.5px;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}
`;
// Rueca's paper and ink on the landing: the tile is the sheet with 2.5% ink over it
const SITE_TOKENS = `
.site .rueca-iso{
  --anatomy-paper:${mix(2.5)};--anatomy-face:${mix(5)};--anatomy-top:${mix(5)};--anatomy-lit-top:${mix(6)};--anatomy-lit-shade:${mix(5)};
  --anatomy-shade-0:${mix(9)};--anatomy-hi:var(--fg);--anatomy-mid:${mix(62)};--anatomy-lo:${mix(38)};--anatomy-faint:${mix(20)};
  --anatomy-lit:var(--fg);--anatomy-dot:var(--fg);--anatomy-weight:.6px;--rueca-hatch:${mix(46)};
  --logo-card:#1B668E;--logo-ink:#F3F1EB;
}
:root.light .site .rueca-iso{
  --anatomy-face:color-mix(in srgb, #fff 65%, var(--sheet));--anatomy-top:color-mix(in srgb, #fff 65%, var(--sheet));--anatomy-lit-top:color-mix(in srgb, #fff 65%, var(--sheet));
  --anatomy-shade-0:${mix(8)};--anatomy-mid:${mix(54)};--anatomy-lo:${mix(32)};--anatomy-faint:${mix(16)};--anatomy-weight:.55px;--rueca-hatch:${mix(48)};
  --logo-card:#5DB4E8;--logo-ink:#181411;
}
.rueca-iso .iso-svg{width:100%;height:100%}
`;
// the same paper and ink for the trial pages, which have no .site
const TRIAL_TOKENS = `
.iso{--sheet:#1a1714;--fg:#f3f1eb;--ink-achiote:#fe8562;--font-hand:"La Belle Aurore",cursive}
.iso[data-theme="light"]{--sheet:#fbfaf7;--fg:#181411;--ink-achiote:#b8381b}
${SITE_TOKENS.replaceAll(".site .rueca-iso", ".iso").replace(":root.light .iso", '.iso[data-theme="light"]').replace(".rueca-iso .iso-svg", ".iso-stage .iso-svg")}
.iso{--anatomy-page:${mix(0)};--anatomy-card:${mix(2.5)};--anatomy-text:${mix(70)};--anatomy-muted:${mix(50)}}
.iso-stage:hover,.iso-stage:focus-visible{--kh:1}
.iso-plate{padding:24px}.iso-plate-corner{font-family:"IBM Plex Mono",ui-monospace,monospace}
`;

/** Frame a free-standing object (one with no plate) the way the plate tiles sit: its drawn
   outline at rest, `box` = [x0, y0, x1, y1] in sheet units as measured unframed, is scaled to
   fit FIT and centred on CENTRE, the plate tiles' own centre. `map` takes a sheet point to
   where it lands, for pen marks that point at it. Measure: FRAME=off node <name>.mjs. */
const CENTRE = [300, 302], FIT = [470, 320];
export function frame([x0, y0, x1, y1]) {
  const zoom = Math.min(FIT[0] / (x1 - x0), FIT[1] / (y1 - y0)), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  return {
    transform: `translate(${CENTRE[0]} ${CENTRE[1]}) scale(${zoom.toFixed(3)}) translate(${(-cx).toFixed(1)} ${(-cy).toFixed(1)})`,
    map: ([x, y]) => [CENTRE[0] + (x - cx) * zoom, CENTRE[1] + (y - cy) * zoom],
  };
}

/* Scroll-built drawings (the build-up How it works): each step has its own progress, --s1,
   --s2, --s3 (0–1), written by the page as you scroll. No transitions: the drawing follows the
   scroll. `seg(step, a, b)` is that step's progress remapped so a → b runs 0 → 1. */
export const seg = (step, a, b) => `clamp(0, (var(--s${step}, 0) - ${a}) / ${b - a}, 1)`;
/** move by the sum of world vectors, each times its own progress: [[vec, t], …] */
export function moves(terms, extra = "") {
  const xy = terms.map(([v, t]) => [k.axisVector(P, v), t]);
  const sum = (i) => xy.map(([d, t]) => `${t} * ${d[i].toFixed(2)}px`).join(" + ");
  return `style="transform:translate(calc(${sum(0)}), calc(${sum(1)}));${extra}"`;
}
export const fades = (expr) => `style="opacity:${expr}"`;
/* The pen writes, it doesn't fade in: a set of marks (a note and its arrow or loop, in the order the
   hand makes them) carries its write progress, --pw, 0–1. On the landing, handwrite.ts traces each
   note's strokes and masks the note and its marks with them, each running its own share of --pw;
   without that (the trial pages) they simply show. A kit tile writes its marks as it comes apart. */
export const marks = (write, items) => `<g class="rueca-marks" style="--pw:${write}">${[items].flat().join("")}</g>`;
const KIT_WRITE = `clamp(0, (${PROGRESS} - 0.08) / 0.7, 1)`;

/** write the drawing: the trial pages always, and with --landing the site module + shared CSS */
export function emit({ name, exportName, label, art, pen = [], bright, framed, scrub }) {
  const drawn = framed && process.env.FRAME !== "off" ? `<g transform="${framed.transform}">${art.join("")}</g>` : art.join("");
  const written = pen.some((m) => m.includes("rueca-marks")) ? pen.join("") : pen.length ? marks(KIT_WRITE, pen) : "";
  const body = [defs(bright), drawn, written].join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" class="iso-svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="${label}">${body}</svg>`;
  for (const theme of ["dark", "light"]) {
    // a scroll-built drawing gets a scrubber in place of hover: it writes --s1…--s3 as the page's scroll would
    const scrubber = scrub ? `<input class="rueca-scrub" type="range" min="0" max="${scrub}" step="0.01" value="${scrub}" style="width:100%;margin-top:12px" oninput="const p=+this.value,st=document.querySelector('.iso-stage');for(let i=1;i<=${scrub};i++)st.style.setProperty('--s'+i,Math.min(1,Math.max(0,p-(i-1))))">` : "";
    const plateHtml = k.plateHtml({ fig: "Kit", title: name, hint: scrub ? "Drag to build it" : "Hover to take it apart", body: `<div class="iso-stage" tabindex="0"${scrub ? ` style="${Array.from({ length: scrub }, (_, i) => `--s${i + 1}:1`).join(";")}"` : ""}>${svg}</div>${scrubber}` });
    const html = k.pageHtml({ title: `${name} · Anatomy trial`, theme, body: plateHtml, width: 520 })
      .replace("</style>", ENGRAVING + TRIAL_TOKENS + "</style>")
      .replace("<head>", '<head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono&family=IBM+Plex+Sans:wght@400;500&family=La+Belle+Aurore&display=swap">');
    writeFileSync(join(HERE, `${name}${theme === "light" ? "-light" : ""}.html`), html);
  }
  console.log(`wrote ${name}.html, ${name}-light.html`);
  if (!LANDING) return;
  const site = svg.replace(' role="img"', ' aria-hidden="true"').replace(/ aria-label="[^"]*"/, "");
  writeFileSync(join(SITE, `${name}.ts`), `/* Generated by brand/illustration-trials/anatomy/${name}.mjs --landing (Anatomy skill + Rueca engraving). Don't edit: change the build and run it again. */\nexport const ${exportName} = ${JSON.stringify(site)}\n`);
  const core = k.ISO_CSS.slice(0, k.ISO_CSS.indexOf(".iso-figure{")).replace(".iso{\n", ".site .rueca-iso{\n").replace('.iso[data-theme="light"]{', ":root.light .site .rueca-iso{");
  writeFileSync(join(SITE, "iso.css"), `/* Generated by brand/illustration-trials/anatomy/shared.mjs (any drawing's --landing build): the Anatomy kit's styles scoped to .rueca-iso, in Rueca's paper and ink, with the engraving layer. Don't edit. */\n${core}${SITE_TOKENS}${ENGRAVING}`);
  console.log(`wrote src/landing/art/${name}.ts + iso.css`);
}
