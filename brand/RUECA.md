# Rueca: brand spec

The one reference for anyone, human or agent, making something that looks like Rueca. When this file and an older note disagree, this file wins. `BRAND.md` keeps the history: the naming rounds, Trompo and the early wire styles.

**Status tags:** **[decided]** Rafael chose it. **[trial]** live, but may change. **[proposed]** waiting on Rafael. **[open]** not decided yet. If you build on something tagged proposed or open, say so in your hand-off.

Last updated 2026-10-11. Owner: `brand/RUECA.md` and `brand/lamina/` belong to the Branding agent session. `BRAND.md`, `data.js`, `index.html` and `rueca.js` belong to the Rueca branding continuation session. If a foundation here changes something the landing page already uses (tokens, type), tell that session so `src/landing/landing.css` and the board stay in step.

---

## 1. The idea

**Rueca** is Spanish for spinning wheel: raw fibre goes in, thread comes out. The tool does the same: a prompt or a prototype goes in, and a real design tool comes out. **Tagline: "Spin up a real tool."** [decided]

**Direction: Lámina técnica** [decided 2026-10-11]. Rueca explains itself the way an 18th-century encyclopaedia explained a spinning wheel: one exact drawing with every part named. The drawing is old; what the parts are is new. Moodboard: `brand/moodboards/` (board I).

**The rule under everything: there is always a tension between old and new.** It starts in the foundations and carries on up through components, patterns, imagery and motion. Every layer has an old half and a new half, and a layout needs both. A page that's only old reads as a museum shop; a page that's only new reads as any other SaaS.

| Layer | Old | New |
|---|---|---|
| Colour | Lana paper, Nogal walnut ink, Rubia, engraved hatching | Flat, chalky brights in blocks (Achiote, Cielo, Malva…) |
| Type | Serif display (book face, light weights) | IBM Plex Sans (engineering-manual grotesque) · Geist Mono for commands |
| Hand | La Belle Aurore red-pen notes | – (the hand belongs to neither; it's the person) |
| Line | Engraved hatching, plate borders, lettered parts | Neutral measure-pen construction lines, dimension marks, part numbers |
| Components | Plates, figure captions, title blocks | Buttons, chips, the install command line |
| Patterns | The labelled plate, the build guide | The live tool, the shell, the canvas |
| Imagery | Engravings (Midjourney, Diderot style) | Flat colour behind or around them, UI frames |
| Motion | Lines are drawn like ink | Colour blocks wipe in like a product |

## 2. Foundations

### Colour [decided; ramps and surfaces live in code]

| Token | Hex (light) | Dark | Role |
|---|---|---|---|
| **Lana** | `#F3F1EB` | ground in dark: `#151210` | Paper. It carries the layout. |
| **Platino** | `#DCDAD5` | `#383430` | Chrome, quiet panels, the "Figma made in the 90s" nod |
| **Nogal** | `#181411` | text in dark: `#F3F1EB` | Ink. All drawing, all text. |
| **Rubia** | `#5E2219` | `#5E2219` | The deep colour. Use it instead of black for dark blocks. |
| **Achiote** | `#E8582C` | `#F06A3E` | Lead bright: the CTA and the red pen |
| Cochinilla | `#EE7A68` | `#F38B79` | Bright |
| Malva | `#A88BF6` | `#B39AF8` | Bright |
| Cielo | `#5DB4E8` | `#6FC0EE` | Bright |
| Hoja | `#2FA57C` | `#3DB68B` | Bright |
| Gualda | `#F2C744` | `#F5D05A` | Bright |
| **Añil** | `#3440C8` | `#8C95F0` | **[open]** No longer the measure pen (2026-10-11); its role is unassigned. Never a fill. |

Six of the names are natural dyes (achiote, cochinilla, gualda, rubia, añil, nogal), and lana is wool. That story can be told; weaving can't (see Don'ts).

Rules:
1. Paper carries the layout. Brights are **flat blocks, one or two per layout**. All six together only in mark/system moments.
2. On a bright, text is **Nogal, never white**.
3. Rubia is the dark, not black.
4. Achiote is the CTA. Product previews and `[data-studio-embed]` fall back to the kit's neutral tokens, and **the tools stay blue**.
5. Tonal ramps 50–900 per family are in `brand/data.js` (`ruecaRamps`); regenerate with `brand/tools/ramps.mjs`. The neutral "Tierra" ramp runs from Lana (50) to Nogal (900).
6. Site surfaces are slightly de-tinted so the shells' neutral UI sits well. See `.site` in `src/landing/landing.css`. Light: field `#f3f1eb`, panel `#faf8f4`, control `#ece9e2`, fg `#181411`, muted `#58524d`. Dark: field `#151210`, panel `#201c19`, fg `#f3f1eb`, muted `#b9b3ac`.
7. The coloured kickers are retired (2026-10-11). Sections are now labelled by **title strips** (§3), in ink, not brights.

### Type

| Role | Face | Status |
|---|---|---|
| Display | **"Rueca Display"**: `local()` **Signifier** (Klim, trial), falling back to Newsreader. Previously Martina Plantijn, with an Alegreya fallback. | Face [trial] · weight [decided] |
| Body / UI | **IBM Plex Sans** (OFL, `@fontsource-variable/ibm-plex-sans`, `--font-body: "IBM Plex Sans Variable"`). It was born in IBM's engineering documentation, so it's the technical-manual voice; Libre Franklin read too heavy under the light display. Runner-up: Instrument Sans. | [decided 2026-10-11] |
| Hand | **La Belle Aurore** 400 (OFL, `@fontsource/la-belle-aurore`, latin), a fine-nib 18th–19th-century hand. It replaced Caveat on 2026-10-11 (options: `brand/references/fonts/hand-lamina.html`). | [decided] |
| Code | **Geist Mono**, for commands and code only | [decided] |

- **Display weight: 300–500 and never bold** [decided 2026-10-11]. Lámina lives in the light-to-medium range; the default is 400 with `font-synthesis: none`. Tracking is −0.02 to −0.025em at large sizes.
- Hero h1: `clamp(56px, 11.5vw, 136px)`, leading 0.82. Section h2s are set at −0.02em.
- Free fallbacks if the Klim licence doesn't happen: **Newsreader** (the current fallback), or **Old Standard TT**, which fits Lámina best conceptually. The comparison sheet is `brand/references/fonts/martina-alts.html`.
- Display is for headings, step numerals and plate titles. Plex is for everything you read or click. The hand is for notes and filled-in values only (the red pen, title-strip values, captions on dimension lines), never for body copy or buttons.
- Sentence case everywhere.

### Line: three pens, three jobs [decided]

| Pen | Colour | Job |
|---|---|---|
| Ink | Nogal | Draws the thing: outlines, hatching, text |
| Measure | **Neutral ink** (2026-10-11, was Añil): `--measure` rgba(24,20,17,.42) / dark rgba(243,241,235,.4); crosshairs `--cross` #aba9a6 / #5b5855; ruler ticks `--tick` .3 and `--tick-minor` .11 (`src/landing/plate.css`) | Construction circles, dimensions, grids, crosshairs, rulers |
| Correct | Achiote | La Belle Aurore notes, leader lines to notes, ✗, the circled letters A–D |

Weights carry the hierarchy: **object 1.4 · detail 0.8 · hairline 0.5**, and hidden edges are dashed. **Lines stay lines:** no gradients, glows or neon, and no fills except hatching and the one flat bright.

### Mark [decided]

Rafael's two-wheel logo: a drive wheel and a spindle whorl joined by the band (`brand/moodboards/rueca-logo.svg`, `src/landing/parts.tsx`). It's in colour (Gualda band, Cielo wheel, Achiote whorl) with a serif wordmark. The mark-only crop is `viewBox="0 0 310 218"`. For one-colour, emboss or deboss uses, mask it.
- **Drawing: "I · Pulido"** [decided]. The file's mark rebuilt on true geometry (`brand/logo/`): one 25-unit band on the external tangents of the two centres, the whorl centred in its loop, gaps 22.5 (wheel) / 19.5 (whorl), bottoms level. At ≤24px a heavier cut takes over (band 34, gaps 19 / 15). Files: `brand/logo/rueca-mark.svg`, `-small.svg`, `-dyed.svg`, `-light.svg`; the site's `Mark` and `public/favicon.svg` use it. Regenerate from `brand/logo/marks.js`. The band's two rings need `fill-rule: evenodd`.
- **Wordmark: outlined, built from the mark** [decided]. The word fills the band's inner box, as Rafael's file had it: baseline on the band's inner bottom edge, x-height up to its inner top, weight 450 (500 in the small cut) so it carries the discs' mass, half an x-height between mark and word, tracking −0.045em (−0.025em in the small cut) plus pair adjustments (r–u −8, e–c −14, c–a +6 thousandths of an em; `PAIRS` in the generator). (A first rule, x-height = the whorl's loop with stems matched to the band, read small and light.) `brand/tools/outline_rueca.py` writes `src/landing/logo.generated.ts` and `brand/logo/rueca-lockup-{signifier,newsreader}-{regular,small}[-light].svg`. **The site ships the Signifier outlines** (Rafael's call; he is buying the Klim licence). `SHIP` in the generator switches to Newsreader (OFL) if that falls through.
- **[decided 2026-10-11]** The palette tokens are canonical. The logo file is a work in progress (its hues `#F0BF11`, `#41ADDB` and `#EB4D1D` are not brand colours), so never sample colours from it. Anything coloured uses Gualda, Cielo and Achiote.

### Voice [decided, unchanged]

A good studio tech: calm, exact, a little warm. Name the thing ("inspector, timeline, layers"). Write short, plain sentences in sentence case. Show, don't adjective. No exclamation marks, and none of "supercharge", "magic" or "AI-powered". Craft words are welcome if explained once. Credit the shoulders (Toolcraft, Base UI, shadcn). Full table: `BRAND.md` → Voice.

## 3. Components

| Component | Spec | Status |
|---|---|---|
| CTA | Achiote block, Nogal text, Plex 600 | [decided] |
| Install command | Geist Mono in a quiet chip (`rgba(ink,.06)`), on one row with the CTA | [decided] |
| Title strip | Each section opens with a strip like a drawing sheet's title block: printed small-caps fields (No. · Title · Sheet) with **handwritten values** (`<Hand>`, `var(--font-hand)`, which lean slightly as if filled in with a pen). `src/landing/plate.tsx` → `TitleStrip`, `Field`, `Hand`. It replaced the coloured kickers. | [decided 2026-10-11] |
| Sheet layout | The landing is one drawing sheet: hairline rules with **neutral crosshairs** (`--cross`) where they meet, ruler ticks in the margins, engraved hatching in spare corners (`Sheet`, `Row`, `Cross`, `Hatch` in `plate.tsx` + `plate.css`). The footer is a title block. | [decided 2026-10-11] |
| Dimension line | Measure pen (neutral `--measure`): end ticks, arrows and the measured width in the middle (`DimLine`). Used on the hero preview, with a handwritten caption. | [decided 2026-10-11] |
| Figure / plate | Double-ruled frame, image or engraving inside, italic Plex caption "Fig. n · …" | [proposed] |
| Part tag | Plex 9.5px tabular in a hairline box (`101`); quantity before it (`3×`) | [proposed] |
| Lettered callout | Achiote circle with a La Belle Aurore letter, joined to its part by an Achiote leader | [decided in the moodboard] |
| Title block | A row of cells: label in small caps, value below (project / shell / drawing / sheet / scale / drawn by) | [proposed] |
| Step numeral | Display face, 400, large, in a panel's top-left corner | [proposed] |
| Chips | Hairline pill on a 5% ink tint | [decided] |

## 4. Patterns

- **The plate** [decided]: one exact drawing with lettered parts, measure-pen construction lines, one or two red-pen notes and a figure caption. Letters A–D name the product's parts: A the skill, B the prompt, C the kit, D the twelve shells.
- **The build guide** [live on the landing as *How it works*, 2026-10-11; `src/landing/art/StepArt.tsx`, generated from `brand/illustration-trials/anatomy/` (`steps.mjs`, `shared.mjs`)]: three isometric engraved plates on one harness tray. 1: a prompt card whose controls drop into an inspector. 2: a Cielo cartridge lowering into the slot. 3: a cursor dragging the Achiote fader cap. The new part in each plate is its one flat bright. (The earlier flat-pack study is `brand/lamina/manual/` sheet 3.)
- **The spec sheet** [live on the landing as the kit cards, 2026-10-11; now isometric engravings, `src/landing/art/KitArt.tsx`]: each kit group is a drawn spec sheet with part tags and **one bright per group**: Controls Achiote, Layout Cielo, Time Gualda, Structure Malva, Working Hoja, Hand-off Cochinilla. The shells' artboards follow the same idea (§5, proposed).
- **Exploded view** [live on the kit cards]: parts lift straight off their slots along one axis (on scroll or hover), leaving dashed ghosts and guides. It can also become a shell interaction ("Explode") [proposed].
- **WheelField** [retired from the hero 2026-10-11; kept as a pattern study]: Rafael removed the hero background. `src/landing/WheelField.tsx` still exists, pending his call on deleting it. Spec, in case it returns as a pattern: the logo's two wheels are dash lattices whose dashes turn in place; the band is dashed contour rings (offset 15 + 18i + 0.8i²) whose dashes run like a belt at rim speed; faint ink (.18 light / .14 dark) behind a radial mask. Rafael rejected a whole rotating wheel, a fully abstract field and strings that only tilt.

## 5. The wireframe style v3: "the manual" [proposed, awaiting Rafael]

The placeholders inside the shells are the **only branded thing in the shells**, so they carry the brand into the product. v1 ("the harness, drawn") and v2 (drafting polish) treated them as wireframes. v3 treats them as a **flat-pack build guide or spec sheet**: every placeholder is a numbered part, every artboard is a sheet. Study: **`brand/lamina/manual/`** (`manual.js` holds the painters, `sheets.js` the sheets). **Polish rules:** `brand/manual-art-rules.md` has 14 rules distilled from IKEA, ISO 128 and illustration practice. `brand/manual-audit.ts` measures rendered SVGs against them. Follow both for any manual-style drawing.

Rules:
1. **Every placeholder is a part.** It has a number tag (101, 204), and repeats carry a quantity (3×). The number replaces the label.
2. **Ink is built, colour is new.** Everything is Nogal line on Lana. The one part a step adds, or the primary action, is a flat bright, never more than one per sheet.
3. **Line weight is the hierarchy** (1.4 / 0.8 / 0.5, hidden edges dashed). No fills except hatching and the one bright.
4. **Text is engraved.** Headings are hatched bars, body copy is hairlines with a short last line. Use real words only where words are the point.
5. **Pictures are plates.** An image slot is a double-ruled frame with an engraved shadow band and a "Fig." caption. Where a real picture helps, use the one **signature engraving** recoloured to Nogal (Cargo's trick: one picture, repeated).
6. **Three pens, three jobs** (§2).
7. **Wordless where possible.** Steps are display numerals, actions are arrows, and **the hand** stands in for IKEA's little man. Use ✓ in ink and ✗ in Achiote.
8. **Every sheet is a document:** double-ruled frame, crop marks, parts list and title block.

Part numbers: **1xx** placeholder parts (101 image, 102 signature image, 103 heading + body, 104 button, 105 avatar, 106 video, 107 chart, 108 icon, 109 empty slot, 110 the hand). **2xx** a shell's own assemblies. **3xx** build-guide steps (302 prompt, 304–306 controls). **4xx** kit components on the landing, by group: 41x Controls, 42x Layout, 43x Time, 44x Structure, 45x Working, 46x Hand-off. A sheet never has inner frames or crosshairs inside a drawing; the crosshairs belong to the sheet's rules.

**Implementation, after approval:** these painters replace `wireImage`, `blankSheet` and `ditherTop` in `src/demo/wire.ts`. The dithered spinning top is retired, and the signature image becomes the engraved rueca. The 12 shells already call `src/demo/wire.ts` (wire rollout, uncommitted), so the swap is mostly in one file, plus shell-specific redraws. Coordinate with the OG agent session before touching `src/shells`.

## 6. Illustration [proposed: both takes, each with a job]

Rafael will draw or direct the final pictures. Both takes use the same subject list: the wheel at rest, the wheel exploded A–D, the flyer close-up, hands at the wheel, and modern tools drawn as plates.

**Take A, isometric line** [exploring]: made with the **Anatomy** skill (`~/.claude/skills/anatomy`, shaded isometric solids with live readouts) and the **Hairline** skill (`~/.claude/skills/hairline-create`, single-stroke isometric line). Variations are in `brand/lamina/illustration/anatomy/` and `.../hairline/`.

**Take B, true to the engravings** [exploring, strong]: Midjourney, using a **public-domain Diderot plate as the image style reference** instead of a code. It's stable because the URL is Wikimedia's:

```
<subject>, copperplate engraving, 18th-century encyclopedia technical plate, fine parallel hatching,
single dark ink on warm off-white laid paper, small engraved letters labelling the parts, thin plate border,
generous white space --no photograph, 3d render, color --ar 4:5 --seed 4417
--sref https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Textiles%3B_spinning-wheel_with_various_components_used_in_the_Wellcome_V0023697ER.jpg/1280px-Textiles%3B_spinning-wheel_with_various_components_used_in_the_Wellcome_V0023697ER.jpg
```

- It carries over to modern subjects: laptops and synthesizers come out as believable plates, and that's the old/new tension in one picture.
- Adding the Eastgate plate as a second sref gives darker, more modelled wheels. The Diderot plate alone is crisper and airier.
- `--sref random` missed both times (one photographic, one cartoon woodcut).
- **Post-process every output:** recolour to Nogal ink on transparent (luminance → alpha, auto-levels, see `inked()` in `brand/lamina/manual/sheets.js`). That way it sits on Lana like a print and the measure pen and Achiote can draw on top.
- Results so far: `brand/lamina/illustration/midjourney/`, prefixed b1–b3 by batch.

**Isometric engravings, and pairing them with line** [proposed]: the Diderot sref pulls Midjourney toward flat side views, so for isometric, drop the sref and ask for the engraving in words:

```
true isometric projection of <subject> seen from above, 30 degree axonometric, like a patent drawing or an IKEA assembly diagram,
copperplate engraving with fine parallel hatching, single black ink on white, isolated object on plain white, no floor
--no photograph, 3d render, color, perspective, border, shadow --ar 4:3 --seed 4417
```

This puts Hairline's line and the engraving on the same 30° grid, so they can share one sheet (shared isometric axes in the measure pen): **line explains how it's built (new), the engraving shows what it is (old)**. In a build guide the steps are line, the final "assembled" panel is the engraving, and shared isometric axes in the measure pen tie them together. Study: `brand/lamina/illustration/` → "Line + engraving, same angle". The Hairline art is exported as SVG and recoloured to Nogal (`hairline/line-*-ink.svg`).

**In the product: the animate shell's demo** [built 2026-10-11, the first shell in the hero]: the "1A" idea (the tool working on an old plate) made real. An engraved Saxony wheel, built from two Midjourney parts made one by one and upscaled: the frame with its wheel cut away, and a face-on drive wheel that turns on the same axle (`public/demo/animate/`, ink on transparent). It sits straight on the canvas with no artboard, and its ink follows the theme (Nogal on light, Lana on dark). The tool's own selection, keys and states do the "new". The Achiote thread draws out of the orifice on *Spin up*.

**Recommendation** (comparison: `brand/lamina/illustration/`):
- **Engraving = what it is (old).** Use it for the signature image, hero plates, hands and finished objects.
- **Hairline line = how it's built (new).** Use it for build-guide steps, diagrams and anything that animates.
- Put them together on the same isometric grid.
- **Anatomy** is a special-occasion interactive piece: the flyer close-up as the "one push, many turns" moment. It is not the house style. Its smooth shading reads as product art, not copperplate, and a figure takes about an hour and a 2 MB page.

Rules for either take: one ink, no gradients, letters A–D in Achiote, construction in the measure pen. At most one flat bright block may sit behind or beside the drawing (for example a Malva block behind a hands engraving), and that block is the "new" half.

## 7. Motion [proposed; research: `brand/lamina/motion-research.md`]

**Tools:** **Motion 14** is already installed and covers line drawing (`pathLength`), scroll, springs and reduced motion, so no new library is needed. Use CSS scroll timelines for simple draw-ins. **GSAP stays out of the kit and the shells** because of its licence clause about visual builders. **[open]** Install Emil Kowalski's `animate` + `review-animations` skills (free, MIT, text only).

Rules (starting numbers; Rafael tunes the feel):
1. **Lines are drawn, never faded.** Order: measure-pen construction, then Nogal outline, then leaders, then letters and notes.
2. **The pen has a speed, not a duration.** Strokes take 0.4–1.2 s depending on length, on a soft start and stop (`cubic-bezier(0.65, 0, 0.35, 1)`). A whole plate takes about 2.5 s, one stroke at a time per region.
3. **A label waits for its line.** It appears at about 85% of its leader: a 150–200 ms fade with no movement.
4. **Exploded parts slide along their own axis on springs** (`visualDuration 0.6, bounce 0.1`), staggered 35 ms, outer parts first out and last home.
5. **Two clocks:** steps and tabs get a 500–700 ms ease-out (`.32, .72, 0, 1`); anything that follows the pointer or scroll gets a spring.
6. **Only the wheel turns:** the spin-up spinner (and WheelField, if it ever comes back). Nothing else loops, pulses or glows.
7. **Old moves like ink, new moves like a product.** Engraved lines draw; flat colour blocks wipe in (clip-path) or fade in ≤ 250 ms.
8. **Plate theatrics are for rare moments** (landing, empty states, first run). Shell UI stays under 250 ms, and anything triggered from the keyboard doesn't animate.
9. **Reduced motion shows the finished plate:** everything drawn, labels placed, the wheel still.
10. **No scroll-jacking.** Reveals fire once.

## 8. Don'ts

- No weaving, looms or cloth (Weaver is a crowded space). Show the wheel, the hand and the dye, never the fabric.
- No bold display type.
- No white text on a bright. No Añil fills, and Añil is no longer the measure pen. Never more than two bright blocks per layout outside mark moments.
- No gradients, glows, neon or glossy 3D. Lines stay lines.
- No mascot wheel or cartoon wheel. The wheel is always an exact drawing.
- No sketchy or Balsamiq hand-drawn UI. The hand is red-pen notes only, and the drawing is always exact.
- Don't publish third-party references: `brand/references/` is git-ignored, and the moodboard pages hotlink them for study only.

## 9. Where things are

| What | Where |
|---|---|
| This spec | `brand/RUECA.md` |
| History, naming, voice table | `brand/BRAND.md` |
| Board (palette, ramps, Trove patterns, directions) | `brand/index.html` → `#rueca`, data in `brand/data.js` |
| Moodboards (five directions) | `brand/moodboards/` |
| Manual wire style study | `brand/lamina/manual/` |
| Illustration takes | `brand/lamina/illustration/{anatomy,hairline,midjourney}/` |
| Motion research | `brand/lamina/motion-research.md` |
| Landing tokens | `src/landing/landing.css` (`.site`) |
| Landing sheet layout | `src/landing/plate.tsx` + `plate.css` (Packaging) |
| Retired hero texture (study) | `src/landing/WheelField.tsx` |
| Demo placeholders in the shells | `src/demo/wire.ts` (v2 today; v3 pending) |
| Rueca skill (accent rule, visual rules) | `skills/rueca/` |

## 10. Open decisions

1. Display face: Signifier (Klim trial), Martina Plantijn or a free fallback, plus the licence.
2. Illustration: the proposal is both takes (engraving for objects, line for steps) plus one Anatomy explainer. Approve it, or pick one.
3. Wire style v3 "the manual" inside the shells: the landing already uses it (How it works, kit cards). Approve it before it replaces `src/demo/wire.ts`.
4. Whether to install Emil Kowalski's motion skills.
5. Añil's role, now that the measure pen is neutral ink: retire it from the palette or give it a new job.
