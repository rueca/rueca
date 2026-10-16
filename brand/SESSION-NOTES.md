# Branding session — handoff (updated 11 Oct 2026, Trove pass done)

Read this first. Full history is in `BRAND.md`.

> **16 Oct 2026: the palette is now Mora** (near-neutral paper and ink, Achiote "Clean" #F6571C, Mora the plum, Malva, Cielo, Gualda, Hoja). The palette notes below are history. Current values and rules: `brand/RUECA.md` → Colour. The board is http://localhost:5273/brand/ (the dev server is owned by the main session, "OG agent").

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
     - Layout: the small wheel is level with the big wheel's TOP (SMALL.y = BIG.y − (60.5−21)·K). The logo has their bottoms level; this is Rafael's call for the hero. The strings derive from the two circles, so they follow automatically.
     - Wheels: still lattices of dashes (pitch 24 big / 16 small). Each dash turns in place: angle = tangent + SPIN·t·speed − TEETH·θ, so a teeth wave travels round the hub. TEETH = 6 on both; the small wheel spins faster by the radius ratio.
     - Strings (the band): must stay LINES (Rafael: "too much abstracting… the strings got lost… they have to be a line, maybe dashed"). They're 20 contour rings whose spacing starts tight and widens outward (offset = 15 + 18i + 0.8i², i.e. a 15-unit clearance off the wheels (Rafael asked for space there, then for half of the 30 first tried), so gaps go from about 19 to 48 units; Rafael found the first version (8i + 1.1i²) too tight at the start), each drawn as 18-unit dashes with 12-unit gaps that RUN along the ring like a belt.
     - Speed is matched (Rafael: "match their speed"): belt speed = RIM_SPEED = BIG.r·SPIN/TEETH, the rim speed of both wheels' teeth wave, all clockwise.
     - Ring alpha fades outward. CSS opacity .18 light / .14 dark with a radial mask. It pauses offscreen/hidden, shows a still frame under reduced motion, and redraws on theme change.
   - Board palette matched to the de-tinted surfaces: Lana #F3F1EB, Platino #DCDAD5/#383430, Nogal #181411 (night ground #151210). The Tierra ramp was regenerated with lower chroma (brand/tools/ramps.mjs). Landing --signal-fg is now #181411.
   - **Hero line is now "Spin up a real tool."** (11 Oct, Rafael picked it from 7 options; content.ts `hero.lines = ['Spin up', 'a real tool.']`). The board's Rueca headline default matches.
   - **Logo is Packaging agent's now:** parts.tsx Logo/Mark come from Rafael's rueca-logo.svg, one colour, with `LOGO_IN_COLOUR = false`. Keep that when touching parts.tsx.
   - **Display is now Signifier (Klim) on trial (11 Oct, after Lámina técnica was picked).** landing.css `Rueca Display` = local() TestSignifier-VF → Alegreya, now at wght 400 (Rafael: "lets not use bold… lamina style might work better in the light-medium range"; 300–500 is the allowed range). Verified by width match. Alternatives sheet: brand/references/fonts/martina-alts.html. Best free options there: Newsreader Display, Old Standard TT.
   - The hero's "← one line, then ask" note was removed by another session (comment updated). I left it out.
   - **Hand is now La Belle Aurore (11 Oct, Rafael picked it from 16 free options in brand/references/fonts/hand-lamina.html).** landing.css imports @fontsource/la-belle-aurore/latin-400.css; --font-hand = "La Belle Aurore"; .font-hand is weight 400 with font-synthesis none. Kickers stay 24px. Caveat is no longer used by the site. The board's Hand menu defaults to it.
   - **Body is now IBM Plex Sans (11 Oct).** Re-tested 15 free fonts against Signifier 400 + La Belle Aurore (brand/references/fonts/body-lamina.html); runner-up Instrument Sans. landing.css imports @fontsource-variable/ibm-plex-sans and --font-body = "IBM Plex Sans Variable". Libre Franklin is no longer used.
   - **Landing became the Lámina "sheet" layout (Packaging agent, 11 Oct; src/landing/plate.tsx + plate.css).** Title strips with a <Hand> component replace the coloured kickers; the footer is a title block; the hero preview has an Añil dimension line. Rafael asked Packaging to kill the hero background, so **WheelField is no longer rendered**. WheelField.tsx, the .wheel-field CSS and the kicker colour CSS (--kick-1..6, [data-kicker]) are now unused and kept until Rafael decides; the Heading `kicker` prop has no callers.
   - **How it works + kit visuals redrawn in the manual language (11 Oct, Rafael: "rethink the how it works and kits visuals to better align with our updated look").** New `src/landing/manualArt.tsx`:
     - `StepSheet`: the build guide (RUECA §4). 1 = prompt card in Gualda → three numbered controls drop out. 2 = your prototype (Cielo) drops into the harness slot unchanged ("no rebuild", ✓ wraps / ✗ rewrites). 3 = the assembled tool, with the hand dragging an Achiote thumb while the artwork grows. It plays on the deck's `active`.
     - `KitSheet`: a spec sheet per kit group, each with one bright (Controls Achiote thumb, Layout Cielo stage, Time Gualda key, Structure Malva layer, Working Hoja preset, Hand-off Cochinilla file). Part tags 4xx. Parts come apart with P = max(--kp, --kh), leaving dashed ghosts.
     - StepDeck's Visual now renders StepSheet (the old Chat/Drop/Shell mock-UI visuals are deleted). KitThumbs now renders `<Tile><KitSheet/></Tile>` (old mock-UI thumbs deleted). The Tile lost data-studio-embed, since it's brand art now and takes the paper/ink tokens.
     - Backups of the old StepDeck/KitThumbs are in this session's scratchpad. Local preview: brand/manual-preview.html (dev only, toggles active/explode/dark).
   - **Polish pass on those visuals (11 Oct, Rafael: "all the visuals need a lot of polish… composition, sizing, placement, overlap").**
     - Research distilled into `brand/manual-art-rules.md`: 14 rules (IKEA clarity/continuity, ISO 128 line weights, leader conventions, no tangents, designed rest pose, honest explode, measure then look) plus the real rendered sizes.
     - `brand/manual-audit.ts` measures each rendered drawing: margins against the visible paper, fill, rendered type px per role, text against text, text against lines (occlusion-aware), whether leader/guide ends land, and tangents. `brand/manual-preview.html` shows every sheet at its landing sizes. Params: `?state=played`, `?theme=dark`, `?only=steps|kit`, `?big=step3|Working` for close-ups. `window.__audit()` returns the findings.
     - Both cells went square (Packaging agent, at Rafael's request), so every drawing was recomposed. Steps use a 360² sheet; phones crop to `14 14 332 332`. The kit uses a 300² spec-sheet template, with the subject centred around y 120 and the hand caption centred on baseline 252 across all six.
     - The measure pen is now the sheet's neutral `var(--measure)`, not Añil (Rafael's call via the Packaging agent).
     - Result: zero findings, rest and played, light and dark, at 561/644/phone 337 and kit 325. Minimum rendered type: tag 9.6, label 10.7, dim 10.2, note 16.2 px.
     - Rafael: still disappointing, and the drawings need better reference to work from. Next direction is open.
   - **New direction for the kit art (11 Oct): the Anatomy skill plus an engraving layer.**
     - **Comparison:** references from the Trove are at `brand/references/illustration/` (git-ignored). Skill trials are in `brand/illustration-trials/`: Anatomy vs Hairline, the same Controls object in each. Rafael picked Anatomy.
     - **Hatching:** added on top. Side faces get vertical hatching, denser the further a face turns from the light, and lit faces stay bare. The cast shadow is hatched at 45° and fades out. The fader cap is the one Achiote bright.
     - **All six kit tiles are on the landing (11 Oct): minimal, marked up in the hand.** Rafael: "go more minimal or it will start feeling repetitive"; "the written font needs to be baked in more natural… arrows and circular drawings"; "do we even need the bottom plate and shadow?"
       - **Formula:** one object per tile, two to four real parts, one flat bright, one motion. No bench, screws or cast shadow.
       - **Plates:** only where the parts are mounted in one (Controls panel, Layout table, Time bed). Structure, Working and Hand-off stand on the paper, framed a touch larger so all six carry the same weight.
       - **Pen** (`note`, `arrow`, `loop` in shared.mjs): the tile's phrase, tilted and handwritten in the open paper, with one hand-drawn gesture (a bowed arrow, or a loop with a tail) pointing at a part that doesn't move.
       - **The objects:**
         - Controls: fader, knob, value window.
         - Layout: glass stage, two docked panels that float up, a tool dock.
         - Time: tracks of keyframe studs under a gantry playhead that slides.
         - Structure: three layer plates on spacers that open.
         - Working: a swatch fan of presets on a rivet.
         - Hand-off: a toaster of PNG/SVG/MP4/settings files that pop up.
       - **Checks and size:** line check is zero for all six at rest and apart. All six together are about 31 KB gzipped.
     - **Exploring: How it works as one drawing that builds as you scroll (11 Oct).** Rafael: "what if the three steps built off each other's illustration?"
       - **The drawing:** `steps.mjs` → `buildup` (BUILDUP_SVG) is one harness tray, and each step runs on its own progress (`--s1`, `--s2`, `--s3`; helpers `seg`, `moves`, `fades` in shared.mjs).
         - Step 1: the card floats in and the controls drop out of it.
         - Step 2: the card lifts away and the prototype lowers into the slot.
         - Step 3: the prototype fades to pale, the cursor takes the fader and the artwork grows.
         - Each step's note shows once that step is done. The trial page `buildup.html` has a scrubber.
       - **The page:** `src/landing/StepBuild.tsx`, the default from StepDeck; `?deck=panels` shows the three separate plates.
         - Desktop: the pinned step list on the left; on the right one sticky drawing over a track about three screens tall, scroll-linked with no jacking. Clicking a step scrolls to where it's finished.
         - Phones: the drawing pins under the nav (no rule under it; Rafael: "remove the divider line"), and the step texts scroll beneath it, fading under its edge. Each step's progress follows its own text, so the drawing shows the step you're reading.
         - Reduced motion: each step cuts in halfway through.
       - **Step 1 is now a chat (11 Oct).** Rafael: "this step needs an agentic natural language (chat box) element… individual conversation bubbles instead of the note… IBM Plex Sans or our mono font."
         - Your message is a right-aligned Gualda bubble with a tail: "Make the threads / tunable: colour, / grain and drift."
         - The agent's reply is a neutral bubble with a left tail: "Added three controls to the inspector:" plus chips for Grain, Drift and Colour.
         - Both are set in Plex in the drawing's plane at z 70. The controls drop out of the reply.
       - **Simplified for a general design audience (11 Oct).** Rafael's script: User "Build me a prototype to animate my logo" / Agent "Using the rueca skill" with checks for shell, motion presets and components.
         - Each check lands its part of the motion shell: shell is the plate, toolbar and artboard; motion presets is the timeline with lanes and a playhead; components is the Design inspector with sliders, easing curve and toggle.
         - Step 2: the logo drops onto the artboard on a Cielo card. It's the mark only, per Rafael ("only use the mark"), read from logo.generated.ts. Pen note: "your logo, as it is".
         - Step 3: the cursor scrubs the Achiote playhead and the mark's wheels turn. Pen note: "tune it live".
         - **New step copy (content.ts):**
           - "Describe what you need" (was "Ask for a tool"): Tell your agent what you're making. It sets up a real editor around it: canvas, timeline and controls.
           - "Bring your design": Your logo, animation or page comes in as it is. Nothing gets rebuilt.
           - "Tune it like a real tool": Scrub the timeline, nudge the curves and export when it looks right.
           - Note: the section heading "Ask for a tool, get a real one." now repeats step 1's title.
         - **Sharper drawings.** Rafael: "they're very round… make them more sharp to match our visual language". shared.mjs wraps the Anatomy kit so every rounded plan keeps a corner of at most 1 unit and bevels are halved. Knobs, rings, studs and the mark stay round. Line check is still zero on all seven drawings.
         - **Hand-off redrawn.** Rafael: "i dont understand this one and the file types look off". The toaster is replaced by a fanned hand of four export files lying flat, each with a folded corner. Each format is on its top strip with an icon (PNG picture, SVG curve, MP4 play), and the Cochinilla settings file "{ }" is on top, with "or hand it to an agent" pointing at it. Coming apart, the hand fans wider. It's framed on its measured outline at rest and apart.
         - **The logo is drawn the isometric-illustration way.** Rafael: "shouldnt isometric style keep the weights the same even when its in a perspective?"
           - The band is now one constant-weight line along its centre: the outline of the two circles, 96.1 round the wheel and 54.5 round the whorl, projected flat and stroked at the band's full 25-unit width on the sheet. The wheels are filled projected ellipses.
           - Step 2 shows the outline: the band's two edges, offset half its weight, plus the wheel rims. Step 3 draws the band at full weight, then traces and fills each wheel.
           - Bug found on the way: the Anatomy kit puts `vector-effect: non-scaling-stroke` on every path, so dashes were measured in screen pixels and the trace stopped short at any zoom. The mark's strokes now opt out.
         - **Dark theme logo colours.** Rafael: "the logo should be white and maybe a darker blue for the container". In dark, the logo card is Cielo 700 (#1B668E) and the mark is drawn and filled in #F3F1EB. Light stays Cielo 400 with an ink mark. These are the `--logo-card` and `--logo-ink` tokens in shared.mjs; the step 3 tint mixes from whichever card colour is showing.
         - **The mark draws itself.** Rafael: "have the mark come in outlined, then the mark animation is something like the logo drawing itself". Step 2 brings the mark in as a fine outline. In step 3 a pen traces the band, then the drive wheel, then the whorl (pathLength 1, dash offset tied to --s3), and the ink fills in once they close. The spinning is gone.
         - The chat bubbles have no tails (Rafael: "remove the pointy part").
         - One drawing (`buildup`) now serves both variants: StepArt animates --s1…--s3 as registered @property values for ?deck=panels. The old step1–3 builds are gone.
       - **The tray waits for step 2.** Rafael: "maybe we dont bring in the plate until the second step". In step 1 the inspector stands alone; the tray rises in under it at the start of step 2, then the prototype lowers into its slot.
       - **Deleted:** `src/landing/manualArt.tsx` and `brand/manual-preview.*`. `manual-art-rules.md` and `manual-audit.ts` are kept because RUECA.md line 121 still points the shell placeholders at them.
     - **QA pass and the three steps (11 Oct).**
       - **Kit QA:** Rafael saw things shift once the plates went. Measured with `qa.js`, which reports outline, centre, margins, and pen marks over parts at rest and apart. Structure sat 36 units high, Hand-off 17 high, and Working 69 left and small. Free-standing objects are now framed from their measured outline (`frame(box)`, measure with `FRAME=off`) to the plate tiles' centre (300, 302) and a 470×320 fit. Also fixed: Hand-off's arrow now lands at the face's foot, and face text in ink is now dark.
       - **Steps, isometric:** Rafael confirmed this, so it supersedes manual-art rule 1. `steps.mjs` draws three plates on one harness tray (slot, layers panel, inspector with three sockets), so they read as one assembly line.
         - Step 1: a Gualda prompt card with the request handwritten on it hovers over the tray; dashed guides and the three controls drop into their sockets, looped and noted "a control each".
         - Step 2: the Cielo cartridge lowers along dashed guides into the slot ("drops in unchanged").
         - Step 3: the earlier brights fade to a pale tint; a cursor drags the Achiote fader cap and the artwork grows inside a loop ("tune it live").
       - **On the landing:** steps play off `active` via `--kp` (art/StepArt.tsx); reduced motion shows them finished. Line check is zero for all three at rest and played.
       - **Superseded and unused:** `src/landing/manualArt.tsx`, `brand/manual-preview.*`, `brand/manual-audit.ts`, `brand/manual-art-rules.md`. Asking Rafael before deleting.
     - **Controls and Layout tiles are on the landing.** `src/landing/art/KitArt.tsx` renders the generated `<name>.ts` files and shared `iso.css`.
       - Every drawing is built from `brand/illustration-trials/anatomy/<name>.mjs` on `shared.mjs`: the same bench plate, camera, scale, hatching and caption line.
       - Regenerate with `node <name>.mjs --landing`. Each run also writes a trial page `<name>.html` / `<name>-light.html` for Anatomy's checks.
       - Layout is a light table: a Cielo glass stage with grid and artboard, two panels docked on pogo pins that float up, a tool dock, and a ruler.
       - Controls is the control module (fader, keypad, knob, switch, LCD). It's static SVG, the caps lift with `max(--kp, --kh)`, and the paper is `color-mix(var(--fg) 2.5%, var(--sheet))`. The other five kit tiles and the three steps are still the old manualArt drawings.
   - **SaaS landing reference pass (11 Oct, for the steps and the remaining kit tiles).** All 559 pages in saaslandingpage.com's archive were reviewed, and 81 crops from 60 sites were kept, each scored 1–5 with a note on what to borrow. Board: `brand/references/saaslandingpage/index.html` (via `brand-board` on :5281). Contact sheets: `sheet-how-it-works.jpg`, `sheet-kits.jpg`, `sheet-house-style.jpg`. Data: `refs.json`. Crops are `img/<name>.jpg`. Git-ignored; never publish.
     - **Recommendation: go isometric for the three steps too, not only the kits.** Nearly every top pick is on a 30° grid, which is what lets parts lift, stack and drop in. It matches the Anatomy kit tiles and RUECA §6 (line and engraving on one isometric grid). It supersedes manual-art rule 1 ("flat orthographic") once Rafael confirms.
     - **What the strongest ones share:**
       1. A bigger subject: the drawing fills the top ~55% of the cell, with the title and caption below it, never inside.
       2. The bright goes on the part that matters (cartesia, armadillo, cloudflare-workers), and idle parts can drop to a pale "pencil" grey (amplemarket).
       3. Something does the action: a hand, tool or cursor (steep, tranch, brilliant).
       4. The bright can also sit behind the ink as a flat shape the lines cross (heron-ai, kitchen, tranch).
     - **Redraw first from:**
       - Kits: `carta-kit` (constant plinth over a dot grid, one orange face per object; the shared stage for the remaining four tiles) and `cartesia-kit` (exploded stack where only the active plate is bright and the rest ghost; model for Structure and for the hover explode).
       - Steps: `tracky-hiw` (Step 1: one card, three things dropping out on pen arrows), `tars-hiw` (Step 2: parts on tethers landing in one tray) and `steep-kit1` / `steep-hiw` (Step 3: hands lifting the one coloured part, with dashed links).
     - **Also worth a look:**
       - Steps:
         - Step 1: `ditto-style` (source → hub → three outputs), `prismic-style1`.
         - Step 2: `doss-kit` (recessed slot; the dropped part is the only fill), `reducto-hiw`.
         - Step 3: `brilliant-style` (dashed guides, one bright, cursor mid-drag).
         - Across the three: `clutch-hiw` (shared baseline and projection, so the steps read as one assembly line), `say-briefly-hiw` (the change is named on the arrow).
       - Kits:
         - Cell anatomy: `heron-ai-kit` ([0N] on the top rule), `reducto-kit`, `hex-kit`, `kota-kit`.
         - Explode: `tars-kit` (pins and dowels), `equals-kit` (Structure), `steep-kit2` (radial).
         - Working: `laravel-cloud-kit2` (active card with alternatives fanned behind).
         - Time: `harvest-style` (stopwatch over flat timeline blocks).
       - Annotation: `operate-style` (section.item part numbers on dotted leaders), `kitchen-style` (brackets plus handwritten notes), `steep-style1`, `carta-style`, `atlius-style` (plate frame).
       - Rendering closest to Lámina: `heron-ai-style2`, `uconnect-kit` (ink plus stipple on one flat field), `wunderbucket-style`, `armadillo-kit`.
       - Composition only (off-brand rendering): `config-kit`, `marqeta-kit`, `linear-style`, `doss-hiw`, `fly-io-kit`.
   - **Cleanup (11 Oct):** deleted `src/landing/WheelField.tsx` and its `.wheel-field` CSS, plus the unused kicker colour cycling (`--kick-1..6`) in landing.css.
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

## Logo study (logo session)
- `brand/logo/` (index.html, marks.js, app.js) → http://localhost:5281/brand/logo/ via the `brand-board` launch config. It measures Rafael's `rueca-logo.svg` (whorl sits 2.4 above its loop's centre, gaps 23.1 vs ~20.8, outline drifts up to 1.1 units near the top-left joint) and rebuilds it as I · Pulido (tunable, with a 16–24px cut). It also has nine concepts: II Mando (knob scale + notch) · III Torcido (crossed band) · IV Doble (double drive) · V Rayos · VI Hilo (band → thread under the word) · VII Huso (flyer hooks on the u) · VIII Erre (r monogram) · IX Malacate (spindle-whorl seal) · X Lámina (emblem). Every concept has a construction toggle, a size ladder, lockups and in-context tiles.
- **Pulido applied** (Rafael: "apply pulido"): `src/landing/parts.tsx` `Mark` now draws the rebuilt geometry (regular cut over 24px, small cut at ≤24px, so the 18px nav and 16px footer use the small one), `public/favicon.svg` is the small cut, and exports are in `brand/logo/rueca-mark*.svg`. `LOGO_IN_COLOUR` and the dye classes are unchanged. `brand/moodboards/rueca-logo.svg` (Rafael's original) is untouched.
- **Wordmark outlined** (Rafael: "make the wordmark a vector"): `Logo` in parts.tsx is now one SVG from `src/landing/logo.generated.ts` (generator `brand/tools/outline_rueca.py`; needs fonttools + uharfbuzz + brotli). The word follows the mark's rule (see RUECA.md §Mark). Signifier outlines on the site (Rafael: "use signifier on the site for now. i'll buy the license"). **Licence TODO: Klim Signifier, before or right after this deploys.** `SHIP = 'newsreader'` in the generator is the fallback.
- Still proposed: Mando as the twist, Hilo as the horizontal lockup, Erre for small spaces and Lámina as the emblem. 

### Build-up · mobile pass and an even gap round the drive wheel (11 Oct)
- **Mobile (StepBuild `Stacked`):**
  - Before: step 1 finished before the drawing was on screen, the pinned drawing hung over blank space after step 3, and the marked step lagged.
  - Fixes: a 34vh lead-in so step 1 plays as the drawing pins, no trailing spacer, and the marked step is the one being built.
  - The stack now sits on one ground (bg-field), so there's no seam where the divider used to be.
  - Checked at 390×844 and 375×667.
- **Logo, drive wheel:** the band kept a constant weight on the sheet while the gap inside it foreshortened, so the gap pinched on the near side. The wheel is now the band's line pulled in by half the band's width plus the mark's gap, as a true ellipse on that line's axes, so the gap is even all round.
- **Logo, whorl:** it can't take the same treatment, because its gap is deeper than the turned circle and it collapses to a sliver. It stays a true projection.

### Sheet grid · crosshairs only where lines cross (11 Oct, Rafael)
- **Rule:** "Don't include the crosshair in the edges, only when two things are intersecting."
- **Removed:** every mark on the sheet's rails.
  - The row-end marks (Row's two `<Cross>` spans).
  - The cells' right-rail corners (`::before`).
  - The left corners of any cell in the first column (per layout: 1 column on phones, 2 / 4 from sm, 5 from md, 3 / 6 from lg).
  - The stacked split's marks on phones.
- **Kept:** marks where an inner divider meets a rule.
- **Checked:** no marks on the rails at 375, 724 and 1280px.
- **Files:** `plate.css` and `plate.tsx`, which are Packaging's (notified). ShellRail's focus corners are a different thing and stay.
- **Follow-up:** the kit tiles' own crosshair, where the tile's bottom rule meets the cell's left side, also landed on the edge in the first column. It's now tagged `.cell-cross` and follows the same per-column rule (KitThumbs.tsx, Packaging's, notified).

### Isometric drawings · thinner strokes (11 Oct, Rafael: "too pronounced")
- **Line weight** (`--anatomy-weight`, held at screen pixels): 0.85 → 0.6px in dark, 0.8 → 0.55px in light.
- **Hatching:** 0.55 → 0.45 (sheet units).
- **Cursor:** 1.2 → 0.9px.
- **Logo outline:** 0.7 → 0.55px.
- **Unchanged:** the pen marks (handwriting and arrows), since they're the note-taker's pen, not the engraving.
- All seven regenerated with `--landing`.

### Build-up · the cursor is an isometric part, in Gualda (11 Oct, Rafael)
- **Before:** a flat screen-space arrow outline.
- **Now:** the pointer outline lies in the drawing's plane, extruded 2.4 like every other part, turned to point up-left on the sheet, its tip pressing the playhead head. It rides the scrub with the head.
- **Gualda:** the colour of your message in step 1, so yellow reads as "you". It also stands apart from the Achiote playhead head.
- **Gotcha:** `k.extrude` defaults to convex. The pointer's tail notch needs `{ convex: false }`, or its walls paint over the top face.
- The old `.rueca-cursor` CSS is removed. All seven regenerated with `--landing`.
- **Then:** the pointer became Figma's tail-less arrowhead (Rafael). It has a tip, a left edge, a notch in its back and the right wing. Plan outline `[[0,0],[0,22],[6.2,16.2],[16,16]]` at 0.7 scale, still Gualda and still `{ convex: false }`.
  - Then a touch bigger (0.85 scale), its tip moved right and down onto the head's lower-right: `[HEAD + 2.5, TIMELINE.y + 4.5]`.

### Handwriting that writes itself · trial (11 Oct, Rafael: "feel like it's actually being written")
- **Trial:** `brand/illustration-trials/handwriting/` (index.html + handwrite.js). Open `/brand/illustration-trials/handwriting/` on the dev server; `#frames` shows stopped frames.
- **How:** a font has no stroke order, so today's left-to-right wipe reads as a reveal. For each string:
  1. Render it in La Belle Aurore on a canvas at 4×.
  2. Zhang–Suen thinning, plus staircase cleanup.
  3. Trace the skeleton into a graph.
  4. Order it into pen-down runs:
     - pieces left to right, starting at their top-left;
     - carry on through joins along the heading, and over the knots thinning leaves (reach ≈ a nib);
     - after a lift, go back to the leftmost stroke still to do;
     - dots wait until after their word.
  5. Those runs, dash-drawn at the pen's speed, mask the real `<text>`. The letterforms stay the font's.
- **Timing:**
  - Pen at 200 px/s per 24 px of type.
  - A slide back along ink just laid (down an i's stem) is quick; a real lift is a 0.12s beat.
  - The whole string is capped at 2.4s, so long notes write briskly.
  - Reduced motion shows it written.
- **Fixed on the way:**
  - A full stop thins to one pixel; it's kept as a dab.
  - Junction knots caused 20+ lifts per glyph.
  - Short i-stems were treated as dots.
  - An e's tail or a t's bar was chosen as the start.
- **Not yet on the landing.** Next steps would be `<Hand>` in plate.tsx (Packaging's) and the `.rueca-note` pen notes in the drawings.
- **On the landing, title strips first (11 Oct, Rafael):**
  - The pen now lives in `src/landing/handwrite.ts`; the trial page imports it, so the trial is what ships.
  - `<Hand pen>` (plate.tsx, Packaging's, notified) lays the written SVG over the span's own text. The text stays for layout and is hidden; the SVG is placed by measured left edge and baseline, landing within a pixel.
  - The writing runs on the same scroll reveal as before (`[data-in]`), keeps each value's delay and lean, and falls back to the wipe if anything fails.
  - On: the landing's TitleStrip (No., Title, Sheet) and the gallery's strip (Title, Count).
  - Still wiped: the footer title block and the cards' "fig. n".
- **Pen notes in the drawings (11 Oct, Rafael):** the notes write themselves and their arrows and loops draw, on each drawing's own scroll progress instead of a timer.
  - **Generator:** each mark set (a note plus its arrow or loop, in the hand's order) is a `.rueca-marks` group carrying its write progress, `--pw` (`marks()` in shared.mjs).
    - Kit tiles write as they come apart: `(P − 0.08) / 0.7`, with P from `--kp` and hover's `--kh`.
    - Build-up: "your logo, as it is" plus its arrow write over `seg(2, .62, .98)` and still fade out as step 3 takes over. The loop, then "tune it live", draw over `seg(3, .7, 1)`.
  - **Runtime:** `usePenMarks` in handwrite.ts (KitArt, BuildArt and StepArt call it).
    - It traces each note's strokes, and each arrow or loop sub-path as a stroke.
    - Every mark gets a mask of its strokes, timed as fractions of the set's run (`--a`, `--f`).
    - `.pen-ink` in iso.css draws each as `--pw` passes it. Scrolling back un-writes.
    - Masks live inside the set so they inherit `--pw`. The mask follows the note's tilt.
  - **Trial pages** (static HTML) don't run the pen; their notes just show.
- **Every `<Hand>` writes now (11 Oct, Rafael: footer and fig labels too).** `pen` defaults to true; `pen={false}` keeps the wipe. That covers the footer title block (author, licence, sheets) and the gallery cards' "fig. n", with no edits to their files. The explicit `pen` props in TitleStrip and Gallery are gone.

## Display face: Sorts Mill Goudy (11 Oct, logo session)
- Rafael found Signifier too sharp. Compared installed and free faces (`brand/references/fonts/friendly-display.html`, `friendly-closeup.html`, `friendly-free.html`); GT Alpina was picked, then **Sorts Mill Goudy** (OFL) swapped in. It ships from `src/landing/fonts/` (woff2 + OFL), `size-adjust: 106%`, one weight. Installed on Rafael's Mac (`~/Library/Fonts`).
- Logo: the generator handles single-weight faces by thickening the outline (skia-pathops) to stem/x-height 0.228 (0.26 small) and opening the spacing to match. `SHIP = 'goudy'`. Mark is still I · Pulido; Rafael's 11 Oct redraw (`brand/logo/rafael/`) was tried and reverted on his call.
- The animate shell's plate headword (`src/shells/animate/local/plate-entry.css`) now loads the same Goudy woff2 (Rafael asked; shells are OG agent's area, so tell it).
- Paid alternatives researched, not installed: ABC Marist (Dinamo; best "Alpina but warmer", Book/Regular/Medium), LL Bradford (Lineto; Alpina's relative), Quincy CF (Connary Fagen; friendliest bookish, cheap, demo), Feijoa (Klim; softest, 400/500 only). Too 70s: Recoleta, Gelica, Souvenir, GT Super. Too sharp: Fragment, Fern, Gaisyr.
- Unused now: the GT Alpina local() rules were replaced; `brand/lamina/*` study pages still load Signifier locally.
