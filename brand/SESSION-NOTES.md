# Branding session — handoff (updated 11 Oct 2026, Trove pass done)

Read this first. Full history is in `BRAND.md`. The board is http://localhost:5273/brand/ (the dev server is owned by the main session, "OG agent").

## START HERE (next session)
1. **The product is now RUECA** (Spanish for spinning wheel). It was Trompo, which Rafael dropped because it reads like "Trump".
   - Rename done 11 Oct: site.config (repo `rueca/rueca`, url `rueca.github.io/rueca`), `npm run sync` (skill now `skills/rueca`), personal skill symlink `~/.claude/skills/rueca`, demo caption.
   - The main session is fixing leftover "trompo" strings in src/kit, src/shells, tests, evals and docs, and will commit the rename separately.
   - Availability (checked 11 Oct): npm `rueca`, `@rueca` scope, GitHub `rueca` handle, rueca.dev/.studio/.design/.app/.io are all free; rueca.com is taken. Rafael still has to claim them.
2. **Brand rethink pending.** Rafael: "requires a rethink… more rustic, probably a serif display font." He'll redesign the images (mark, placeholders) by hand himself. Reference: spinning-wheel photography (wood, undyed wool, thread).
   - Drafted in `brand/data.js` (not yet on the board): `ruecaPairs` (7 rustic serif pairings: Alegreya★, IM Fell, Fraunces WONK, Young Serif, Vollkorn, Gloock, Piazzolla), `ruecaPalette` (Lana/Nogal/Rubia/Añil/Lino/Roble), `ruecaTaglines`.
3. **Trove read, board section built (11 Oct).** The board's `#rueca` section (top of the page) is built from about 90 of Rafael's saves read through the **x-book** MCP (`list_vocabulary`, `search_library`, `browse_tag`). Do not read `.env` or query the DB.
   - **Seven patterns** (`ruecaTrove` in `data.js`), each linked to the saves: the mark lives in the material · old picture, new drawing · oldest tool next to the newest · near-invisible image, one loud accent · warm serif, never a costume · dyed, not printed · keep the old mark beside the new.
   - **Three directions, one world** (`ruecaDirections`): **Grabado** ★ (engraving + indigo diagram + red pen; Alegreya 800; it's the chosen wire identity with an engraving inside, so the shell rollout carries over), **Hilo** (mark debossed into felt, one madder thread; Gloock), **Taller** (maker's mark in walnut, old tool / new tool, yellow thread ties; Young Serif).
   - Palette gains **Gualda** (weld yellow), so the three natural dyes are Rubia, Añil and Gualda on Lana. Each swatch now has a dark value.
   - Watch-outs (`ruecaWatch`): Rafael saved a shelved "Weaver" design-tool brand (Figma bought Weave), so lean on the wheel and the hand, not on weaving. Rafael also saved an essay against safe/middle/bold routes, so the directions are framed as materials that combine, not as a risk ladder.
   - Code: render lives in `brand/rueca.js` (stand-in SVG treatments, theme-aware). The older branding session's image grid (`troveRefs`) is kept at the end of the section, and its lessons are folded into the patterns.
   - Preview: launch config `brand-board` (vite on :5281) → http://localhost:5281/brand/#rueca. :5273 belongs to OG agent.
   - **Paid display serifs (11 Oct, later):** Rafael asked to try paid fonts. The board now loads 7 foundry trials already installed in `~/Library/Fonts` via CSS `local()` (data: `ruecaPaid`). They render on this Mac only and are never copied or shipped. ★ Dominicale (Altiplano, Raphael Verona) and ★ Signifier (Klim, Fell types redrawn), then GT Sectra, Ivar Display, Martina Plantijn, F37 Incise and ABC Arizona Flare. A "Display" menu puts any of them into the three directions. Trials are evaluation-only, so the site needs a licence. Tagada (saved in Trove) isn't installed and is sold through Future Fonts.
   - **HEX swipe file** (swipe.hex.inc, shared by Rafael): 8 pieces in `hexRefs`, images hotlinked. Best fits are Vorflux (flat Roman picture + construction lines → Grabado), Ryvn (type on a spiral → spinning motion idea), Anthrogen emboss/scribble, AgentMail stamp, and the First Star pen plotter. Rafael: "don't get discouraged by hex, this is an open source project", so treat overlap with commercial brands as validation, not a warning.
   - Scratch contact sheets (git-ignored): `brand/references/fonts/sheet.html` (about 40 installed serifs), `hex.html`.
   - **Palette v2 (11 Oct, later):** Rafael: "leaning a little too hard on rustic. it should be rustic meets modern… imagine if figma was created in the 90s". The new `ruecaPalette` (+ `ruecaPaletteRules`) keeps a rustic base (Lana paper, Platino 90s chrome, Nogal walnut ink, Rubia madder oxblood as the dark block) and adds flat, chalky brights: Figma's five hues each named after a natural dye (Achiote, Cochinilla, Malva, Cielo, Hoja), plus Gualda yellow, with Añil cobalt for lines. Tuned against colours sampled from ayushsoni_io/HEX work (Ayush Soni founded HEX): Cardinal, the legal-tech system, the Klein biotech set. The board shows it as a 1997 platinum window holding a Figma-like canvas. The CTA is Achiote with Nogal text (never white on brights). The direction art is updated: a flat Malva picture block in Grabado, five dyed threads in Hilo, a Cielo software panel in Taller.
   - **Handwriting replaces the mono (11 Oct, Rafael's call):** labels, measurements, captions and red-pen notes now use a hand (`ruecaHands`, with a "Hand" menu and clickable cards on the board). Recommended: Architects Daughter (draftsman lettering, technical but hand-made). Other options: Caveat, Nanum Pen Script, Kalam, Walter Turncoat, Covered By Your Grace, Reenie Beanie. All are OFL/Apache so the open-source site can ship them. Geist Mono stays for code only (the install command). Locally installed handwriting fonts were skipped because their licences are unclear.
   - **DECIDED 11 Oct (Rafael):** **Grabado** (engraving) direction · display **Dominicale** · handwriting **Caveat** · **Geist Mono kept for commands** · palette v2 plus **tonal ramps** (`ruecaRamps`, 50–900 per family, OKLCH, generator `brand/tools/ramps.mjs`).
   - **Landing page updated (11 Oct, uncommitted; OG agent, Packaging and nav sessions all OK'd it):**
     - `src/landing/landing.css`: fonts (Rueca Display = local Dominicale → Alegreya 780 fallback from `@fontsource-variable/alegreya`, Caveat 500 latin via `@fontsource/caveat`), palette tokens on `.site` (paper/walnut in both themes, Achiote signal with walnut text), product previews reset to the kit's neutral values.
     - `parts.tsx`: stand-in wheel Mark + live-text Logo (export names kept); h2 now regular weight with −0.02em tracking.
     - `Landing.tsx`: hero grid with the `Engraving` beside the headline, plus a Caveat note by the install command (reveal attributes kept).
     - New `src/landing/Engraving.tsx`: a stand-in engraved spinning wheel, Añil diagram, Caveat notes, Gualda disc. Swap in Rafael's drawing when it's ready.
     - `public/favicon.svg`: wheel on Achiote.
     - Checked in light, dark, 1440 and 375; tsc passes.
   - **Display switched to Martina Plantijn (Klim) for a trial, 11 Oct (Rafael: "lets try Martina").** landing.css `Rueca Display` now does local() Martina → Alegreya, both at wght 700. To revert, swap the local() names back to Dominicale (and wght 780). Verified: the hero renders in Martina (width match) in light and dark.
   - Section kickers (the label above every heading, `Heading` in parts.tsx) are now Caveat 24px, still muted grey (Rafael asked for grey, not pink, earlier), with the reveal kept.
   - **Body is now Libre Franklin (11 Oct, Rafael: free body fonts only).** `@fontsource-variable/libre-franklin` was installed and replaces the hanken-grotesk import in landing.css. The comparison sheet is `brand/references/fonts/body-fonts.html` (git-ignored). `@fontsource-variable/hanken-grotesk` may now be unused by the site, so it's OG agent's call (shared package.json).
   - Section kickers cycle through the six brights (CSS nth-of-type over the page's sections, `--kick-1..6` in landing.css).
   - **Surfaces de-tinted (11 Oct, Rafael: "slightly more true to white and black… dont over do it").** In landing.css, light and dark surface/text tokens keep about 55% of the warm chroma (OKLCH). Light lightness moved about 15% toward white, and dark lightness is unchanged so it matches the kit's #131313/#1e1e1e. Light field #f3f1eb, panel #faf8f4. Dark field #151210, panel #201c19. The brand swatch Lana (#F3EEE3) is unchanged; this is just the page surface.
   - **Hero illustration replaced by a texture (11 Oct, Rafael: "kill the top hero illustration… a background pattern/texture. subtle, maybe just the two wheels… hex does a lot of good illustrations that feel like patterns").** New `src/landing/WheelField.tsx` draws the logo's own two wheels and drive band as about 46 contour rings rippling outward, with grooves inside the wheels. Every fourth ring is dashed and runs slowly (36s; still under reduced motion). It sits behind the hero as an absolute -z-10 layer (root got `relative isolate`), ink only, opacity .16 light / .12 dark, radial mask at 78% 40%. The motif sits right of the text column at desktop width. The hero is back to a single text column. Engraving.tsx was removed (a copy is in the old session scratchpad).
   - **Hero texture (11 Oct, settled after several rounds with Rafael).** `src/landing/WheelField.tsx`, one canvas.
     - Wheels: still lattices of dashes (pitch 24 big / 16 small). Each dash turns in place: angle = tangent + SPIN·t·speed − TEETH·θ, so a teeth wave travels round the hub. TEETH = 6 on both; the small wheel spins faster by the radius ratio.
     - Strings (the band): must stay LINES (Rafael: "too much abstracting… the strings got lost… they have to be a line, maybe dashed"). They're 20 contour rings whose spacing starts tight and widens outward (offset = 15 + 18i + 0.8i², i.e. a 15-unit clearance off the wheels (Rafael asked for space there, then for half of the 30 first tried), so gaps go from about 19 to 48 units; Rafael found the first version (8i + 1.1i²) too tight at the start), each drawn as 18-unit dashes with 12-unit gaps that RUN along the ring like a belt.
     - Speed is matched (Rafael: "match their speed"): belt speed = RIM_SPEED = BIG.r·SPIN/TEETH, the rim speed of both wheels' teeth wave, all clockwise.
     - Ring alpha fades outward. CSS opacity .18 light / .14 dark with a radial mask. It pauses offscreen/hidden, shows a still frame under reduced motion, and redraws on theme change.
   - Board palette matched to the de-tinted surfaces: Lana #F3F1EB, Platino #DCDAD5/#383430, Nogal #181411 (night ground #151210). The Tierra ramp was regenerated with lower chroma (brand/tools/ramps.mjs). Landing --signal-fg is now #181411.
   - **Hero line is now "Spin up a real tool."** (11 Oct, Rafael picked it from 7 options; content.ts `hero.lines = ['Spin up', 'a real tool.']`). The board's Rueca headline default matches.
   - **Logo is Packaging agent's now:** parts.tsx Logo/Mark come from Rafael's rueca-logo.svg, one colour, with `LOGO_IN_COLOUR = false`. Keep that when touching parts.tsx.
   - **Licence TODO:** the display face is a trial (was Dominicale, now Martina). It renders only where it's installed locally; everyone else sees Alegreya. Buy a web licence from Altiplano, then add its woff2 as the first `url()` in landing.css. `@fontsource-variable/gabarito` is now unused; OG agent decides on removing it (package.json is shared).
, then the next step is BRAND.md, the wordmark outline (`outline_wordmark.py` with the chosen serif), and the landing font swap (coordinate with OG agent).
4. **Wire rollout** (12 shells in wire style), done and verified, awaiting Rafael's review. NOT committed; the main session is holding it. Open calls: component-lab's "destructive" red, the colour chrome swatches. Note: the wire placeholders use the old Trompo top and palette, and Rafael will redraw imagery by hand.
5. Still on Trompo's look until the rethink lands: landing `Mark` (the top), `public/favicon.svg`, hero copy "Give it a spin.", the pink in landing.css, brand/trompo/*.

## Earlier decisions (Trompo era — partly superseded)
| What | Decision | Where it lives |
|---|---|---|
| Name | **Trompo** (runner-up: Thumbwheel) | `BRAND.md` top · `src/site.config.ts` · repo renamed via `npm run sync` |
| Wordmark | Lowercase `trompo`, **Gabarito 800**, −0.035em | `brand/trompo/lockup-*.svg`, `wordmark-*.svg` (outlined) |
| Type | **Geométrica**: Gabarito (display) · Lexend (body) · Geist Mono (code). Site only; product chrome stays Inter | `BRAND.md` → Type |
| Mark | Spinning top with pink band and swooshes | `brand/marks.js` (`trompo`), `brand/trompo/*.svg`, favicon in `public/favicon.svg` |
| Palette | Ink `#1C1A19` · Paper `#F6F1EA` · Rosa mexicano `#E4007C` (`#D1006F` light / `#FF3EA5` dark) · Wood · Turquesa | `BRAND.md` |
| Accent rule | The pink is **never** the chrome accent. The chrome stays system blue, and the skill checks the accent against each prototype | `skills/trompo/` (SKILL.md, references/visual-rules.md §3, references/qa.md §2, scripts/accent-check.mjs) |
| Lowercase | Lowercase in the logo, `Trompo` in sentences, lowercase in commands and slugs | — |
| Personal skill | `~/.claude/skills/trompo` → symlink to the repo's `skills/trompo`. The old skill is archived in `~/.claude/skill-backups/prototype-studio-2026-09-21` | — |
| Wireframe identity | **Go with the proposal, "the harness, drawn"**: visible scaffold (hairline frame, crosshairs, size label) + labelled warm-grey placeholders (Geist Mono labels) + one signature image + pink annotations inside the artboard | `BRAND.md` → Wireframe identity · board `#wire` |

## In progress / open
- **11 Oct, wire rollout done (awaiting Rafael's review, NOT committed).** Demo content in 12 shells is redrawn in the wire style (ui-design pilot + dropin/hero.html, component-lab, batch, video, animate, motion, photo, dither, generate, flows, journey). The shared demo painters are `src/demo/wire.ts` (ditherTop, wireImage, blankSheet, WIRE) and `src/demo/top.ts` (continuous-tone top). Storage versions are bumped per shell. Checks: `npm run check` passes and qa 38/38. Untouched by design: shader, synth, marks, nodes, present, type, scene (optional 3D trompo).
  - Open judgement calls for Rafael:
    - component-lab keeps a toned-down red for "destructive". Should it become an outlined ink style?
    - Chrome swatches (journey team colours, Insights Low/High badges, flows Owner dot, minimap note colour) were left in colour.
    - Tool presets in photo/dither (Game Boy, CGA…) still produce colour. That's the tools' output, so it was left on purpose.
0. **10 Oct, done.** The site uses **Gabarito (big) + Hanken Grotesk (body) + Geist Mono**. The hero is stacked ("Give it / a spin." at clamp(64px,13vw,156px), 900 weight, 0.88 line height, −0.045em), from `hero` in src/landing/content.ts. Section h2s are 56px/800, and the gallery h1 is 96px/900. Lexend is gone. Verified in both themes at 1280 and 390, with QA at 38/38. Research and options are on the board under `#scale`.
   - 10 Oct: blank placeholder card built, night dither fixed, Paper studied, social banner and post mock-ups on the board (`#paper`). See BRAND.md "Placeholders + Paper-inspired socials".
   - 10 Oct: **wire aesthetic v2.** Researched are.na and Cosmos, wrote the rules plus `brand/wire.js` (sheet, image, lines, button, dim, callout primitives), and drew landing and mark sheets (board `#wire`). Next: redraw the social mock-ups and v1 proposal with wire.js (one ink + red pen). The socials still use v1's teal arcs.
   - Next: Rafael reacts to the social mock-ups. Possibly export the banner and posts as real 1500×500 / 1200×675 PNGs, and use blank cards in the shells' demo content (ask the main session first; shells are theirs).
   - Open copy question for Rafael: is "Give it a spin." the hero line, or should the hero show a longer tagline?
1. **Site fonts (done 10 Oct, superseded by item 0).** Apply Geométrica to the landing page and gallery. The main session ("OG agent") approved it, but asked me to **wait for its message "go fonts"** (its QA agents are running dev servers). The prepared plan:
   - `npm i @fontsource-variable/gabarito @fontsource-variable/lexend @fontsource-variable/geist-mono`
   - In `src/landing/landing.css`: import the three fonts. Set `.site` to Lexend. Add `.font-display` (Gabarito) and `.font-code` (Geist Mono) classes. Set `.site code` to Geist Mono. Reset `.site .preview, .site [data-studio-embed]` (and their `code`) to `var(--font-ui, "Inter Variable", …)` / the kit mono.
   - h1 (`Landing.tsx`) and h2 (`Heading` in `parts.tsx`): `font-display font-bold`. h3s: `font-display`. Ledes go to 16px (Lexend's minimum).
   - Header brand in `Landing.tsx` Nav and `gallery/Gallery.tsx`: `<span class="font-display font-extrabold lowercase tracking-[-0.035em]">{site.name}</span>` next to `<Mark/>`.
   - CommandLine (`parts.tsx`): `font-mono` → `font-code`.
   - **Don't touch `src/kit/` or `src/shells/`.** The kit's chrome font token is `--font-ui` / `font-ui`.
   - Verify in both themes and at 390px, then report the changed files to the main session and ping Rafael.
2. **Dithered trompo image (stand-in until Rafael supplies the final images).** Generator: `brand/tools/dither-trompo.mjs` (headless Chrome, Atkinson dither). Output goes to `brand/trompo/placeholders/trompo-{ink,pink,night}-{4x3,16x9,1x1,3x4,2x3}.png`.
   - Current output is **v2, the cone shape**: it reads as a top, but a little like a cone with a lid.
   - **v3, the onion shape, was reverted**: a bulbous shoulder plus a pale dome dithered into a **heart**. Lesson: the top face must stay mid-tone with a defined rim, and the shoulder can't have two lobes.
   - Next: a gentler shoulder curve, and maybe a slight perspective on the stem. Review all three palettes.
3. **Cargo "Blank" placeholder (newly found; was missed in the first research pass).** It's a flat card, `#2D2D2D` in Cargo's version, with one corner-to-corner hairline, two binder punch holes on the left (at ¼ and ¾ height, `#191919`) and a tiny vertical caption naming its own format ("Cargo® Rectangular Placeholder / Image — vertical"). Reference: `brand/references/wireframe/cargo-blank-placeholder.png`.
   - Plan: build **Trompo's own blank card** (paper and ink tints, hairline diagonal, punch holes, Geist Mono caption such as "Trompo placeholder — image 16:9" (no ®: not registered)) as an SVG generator.
   - Use it for empty slots, and the dithered top as the signature image.
4. **Board still to update:**
   - Add the Cargo Blank direction to `wireframeDirections` in `brand/data.js`.
   - Mark the proposal as **chosen** in the `#wire` section.
   - Add a "Placeholders" block showing the dithered images and the blank cards.
   - Swap the SVG stand-in in the proposal mock-up for the dithered PNG.
5. **Waiting on Rafael:** the final placeholder image(s) ("I'll give you the final image(s) later"), and buying trompo.dev plus claiming the GitHub org `trompo-dev` and npm `@trompo` (checklist in `BRAND.md`).
6. **Main session's step 5:** renaming leftover `prototype-studio` strings in `src/shells` and `src/kit/index.ts` is theirs.

## Working agreements with the main session ("OG agent")
- Stay out of `src/kit/` and `src/shells/`. Ask before running `npm i` or editing `src/` while its QA agents run.
- The repo has **no commits yet**. Back up before any bulk rewrite. A pre-rename backup is in the old session's scratch folder (temporary, may be gone).
- `brand/references/` is **git-ignored** (third-party screenshots). Never publish it.

## Tools (in `brand/tools/`)
| File | Does |
|---|---|
| `dither-trompo.mjs` | Renders a lit 3D top and Atkinson-dithers it into the palettes. `node brand/tools/dither-trompo.mjs` |
| `outline_wordmark.py` | Outlines Gabarito 800 "trompo" with HarfBuzz kerning into lockup/wordmark SVGs. Needs a Python env with `fonttools` + `uharfbuzz` and the Gabarito VF TTF (from google/fonts `ofl/gabarito`) |
| `refshot.mjs` | Batch screenshots of reference sites (playwright-core + installed Chrome) |
| `contact-sheet.mjs` | Puts a folder of screenshots on one sheet |
| `fontcost.mjs` | Measures the real Latin woff2 size of Google Fonts specs |
| `board-shot.mjs` | Screenshots board sections in a theme/width: `node brand/tools/board-shot.mjs <outdir> <light\|dark> <width>` (edit the id list inside) |
