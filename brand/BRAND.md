# Brand — Rueca

## Decision (11 Oct 2026): **Rueca**, rustic meets modern

Renamed from Trompo (it read like "Trump"). *Rueca* is Spanish for spinning wheel: raw fibre in, thread out.

| What | Decision |
|---|---|
| Direction | **Grabado**: an engraved picture (Rafael draws it by hand), indigo construction lines, handwritten notes and one flat dyed block. It keeps the wire identity ("the harness, drawn"). |
| Display | **Signifier** (Klim Type Foundry, Kris Sowersby), weight **400**, on trial since 11 Oct. Lámina sits in the light–medium range, never bold (Rafael). It went Dominicale → Martina Plantijn → Signifier on the same day; Signifier is the Fell types redrawn with digital precision, which suits Lámina técnica. Paid, licence still needed; the site falls back to Alegreya at the same weight. Free fallbacks if needed: Newsreader Display, Old Standard TT. |
| Tagline | **Spin your prototype into a tool.** (chosen 11 Oct, later the same day, replacing “Spin up a real tool.”, because “real” read as defensive and said nothing about the tool). It's what a rueca does: raw fibre in, thread out. The hero breaks it *Spin your / prototype into / a tool.* Earlier: *Spin up a real tool.* · *Give it a spin.* Runners-up: *Turn it into a tool.* · *Your prototype, with handles.* |
| Body | **IBM Plex Sans** (free, OFL), chosen 11 Oct for Lámina. It was born in IBM's engineering documentation, so it's the technical-manual voice under Signifier's engraved one. It replaced Libre Franklin, which read heavy under Signifier 400. Runner-up: Instrument Sans. Free fonts only for body. |
| Handwriting | **La Belle Aurore** 400 (free, OFL), chosen 11 Oct for Lámina: a fine-nib period hand, the plate annotator’s pen. Used for labels, measurements, red-pen notes and the label above each heading; never body copy or buttons. It replaced Caveat (a felt-tip marker). |
| Code | Geist Mono, for commands only |
| Palette | **Mora** (16 Oct, replaced the walnut-and-wool palette): near-neutral paper and ink, Achiote, Mora the plum, and accents Malva (lilac), Cielo (blue-violet), Gualda (yellow), Hoja (lime). Values and rules: `brand/RUECA.md` → Colour; history below under "Palette: Mora". |
| Accent | Achiote "Clean" (#F6571C, #FF6A2C on dark) with ink text on it (never white on a bright). Product previews stay neutral; the tools stay blue. |
| Mark | Rafael's two-wheel logo (`rueca-logo.svg`, in `src/landing/parts.tsx`), one colour for now; a dyed version is ready behind `LOGO_IN_COLOUR`. |
| Hero texture | The logo's two wheels and drive band as faint contour rings (`src/landing/WheelField.tsx`), HEX-style pattern rather than an illustration. |

The board's `#rueca` section has the research (Trove patterns, HEX/ayushsoni references), the options and the reasoning. Everything below is the Trompo-era record.

## Palette: Mora (16 Oct 2026)

**Why.** Rafael: the palette's vintage tint felt "too on the nose"; pull it back and modernise it while it still feels nostalgic. He kept Achiote.

**How we got there (one session, 16 Oct).**
1. Four directions on the same Achiote: A · Papel blanco (cool the neutrals), B · Naranja y añil, C · Risografía, D · Platino. Rafael picked **A** as the base.
2. References: Planted (LIT), iFest (Maat Studio), Euphemia (Love + Money), MoMA Family Festival (Little Troop), Stack Overflow (Koto), all from brrranding.com. He narrowed them to Stack Overflow, iFest and MoMA. All three share one structure: a hot orange-red, a violet, a pink, a green, and one or two extras.
3. Four blends on A's neutrals: Hilo (the midpoint), **Mora** (leans Stack Overflow), Eléctrico (iFest), Museo (MoMA). Rafael chose **Mora**, but with surfaces truer to neutral.
4. On the site (as a `?palette=mora` trial): fully neutral greys, then "leave a very small tint" (chroma 0.0024 at hue 45). On the light theme, the darkened yellow, lime and plum read muddy, so their text values turn hue as they darken (marigold, clean green, raspberry). The hero's yellow loop read muddy too and became **Malva**.
5. The logo race in Mora's colours read as a rainbow. Stack Overflow's rules fixed it: the **Stack** sequence (each shape's own two accents, then Achiote, then the plum, then ink).
6. Achiote was the least saturated colour beside the new accents and read a touch brick, so it went **Clean**: the same hue, ~10% more chroma (#E8582C → #F6571C). "Vivid" (#FA5F00) was rejected because it lands on Stack Overflow's own orange.
7. The kit section's six drawings each had a different bright (a rainbow). They now use three, Achiote, Cielo and Malva, with Achiote last on Hand-off.
8. The shells' sample content followed (the shared demo palette, each shell's presets, the demo pictures re-tinted by `scripts/retint-demo.py`) and their thumbnails were reshot.

**Stack Overflow audit** (official palette at stackoverflow.design/brand/color): orange #FF5E00, "Medium Orange" #6E1527 (the burgundy, named as orange's shade), pink #F39FFF, purple #9D9CFF, yellow #FFCC00, blue #5074EF, green #86AF25, neutrals and darks. What we borrowed: orange is in every composition (the top face of all 12 approved stack combinations), each piece uses two accents and never all of them, accents are never backgrounds, orange's share is set by surface (product 5%, poster 20%, campaign 50%), orange lands last as the punchline, and they avoid gradients, shadows and all-dark combinations. Not borrowed yet: a soft periwinkle like their #9D9CFF, the light cool accent Mora doesn't have. Pulling the plum toward #6E1527 would tie it closer to Achiote; it's an option, not done.

**Changed in code:** `src/landing/landing.css`, `plate.css`, `LogoIntro.tsx` (Mora dyes and the Stack sequence), `LiveShell.tsx` (window dots), `parts.tsx` (colour E values), `brandArt.tsx`, `public/favicon.svg`, and the drawings (`brand/illustration-trials/anatomy/shared.mjs` → `src/landing/art/`). The shells' demo artwork keeps its own colours: it's sample client work, not Rueca's palette.


---

# Brand — Trompo (superseded)

Board: http://localhost:5273/brand/ · source data: `brand/data.js` · marks: `brand/marks.js` · exported files: `brand/trompo/`

## Decision (9 Oct 2026): **Trompo**

Chosen by Rafael from a final four of Trompo, Thumbwheel, Periaktos and Jigwork, after five rounds and 249 names.
The runner-up and safe fallback is **Thumbwheel**. The rest of this file is the record of how we got here.

**The idea.** A trompo is the Latin American spinning top: wind the string, throw it, and it comes alive. The
harness does the same to a prototype: it's inert on its own and alive once it has controls. Developers already say
"spin up", so "spin up a tool around your prototype" comes for free.

| | |
|---|---|
| Name | **Trompo**, said TROM-po. Display name `Trompo`, slug `trompo` |
| Tagline | *Give it a spin.* Alternates: *Wind it up. Let it go.* · *Every prototype wants to spin.* |
| Mark | A spinning top with a pink band and two motion swooshes. The swooshes drop below 24px. Files: `brand/trompo/mark-light.svg`, `mark-dark.svg`, `mark-small.svg`, `app-icon.svg`, `favicon.svg` (theme-aware) |
| Logo files | `brand/trompo/lockup-light.svg` / `lockup-dark.svg` (mark + wordmark) and `wordmark-light.svg` / `wordmark-dark.svg`. Gabarito 800 is outlined to paths, kerned with HarfBuzz and tracked −0.035em, so they need no font installed. The mark is 1.18× the type size, with a 0.32em gap |
| Wordmark | **Gabarito ExtraBold (800)**, lowercase, −0.035em. Explored in Fredoka; switched 9 Oct |
| Type | **Geométrica**, revised 10 Oct: Gabarito (display, 700–900, big: about 7–10× body) · **Hanken Grotesk** (body, 16–19px; replaced Lexend) · Geist Mono (code). All OFL; self-host via `@fontsource-variable/gabarito`, `/hanken-grotesk`, `/geist-mono`. Site and marketing only: the product chrome stays Inter |
| Palette | Ink `#1C1A19` · Paper `#F6F1EA` · Rosa mexicano `#E4007C` (mark accent `#D1006F` on light, `#FF3EA5` on dark) · Wood `#C58B4E` · Turquesa `#1E9AA0` |
| Rule | Brand colour lives on the site and the mark only. The product chrome stays neutral (Inter and kit tokens). **The pink is never the chrome accent** (decided 9 Oct): at hue 353–360° it sits 25–32° from the record red, and it would stamp clients' tools with our brand. The accent stays system blue, and the skill checks it against each prototype (`skills/trompo/scripts/accent-check.mjs`). |

### Type (chosen 9 Oct 2026: Geométrica)

Six pairings are rendered live on the board under **Type**. All are Google Fonts under the SIL Open Font License,
free to use commercially, self-host and bundle. Sizes are the Latin woff2 files Chrome actually downloads.
Whatever is picked, the product chrome stays Inter.

| Pairing | Display / body / mono | Size | Character |
|---|---|---|---|
| **Geométrica** ★ | Gabarito ExtraBold / Lexend / Geist Mono | 96 KB | Round bowls echo the top. Calm, readable body. Lightest. Mostly Latin American makers (Brazil, Mexico, Argentina) |
| Hecho en Buenos Aires | Archivo Expanded / Chivo / Chivo Mono | 146 KB | One Argentine foundry (Omnibus-Type), a matched system. Most editorial |
| Del juguete a la herramienta | Recursive Casual / Linear / Mono | 139 KB | One family whose Casual axis runs toy → tool, the brand idea in type. Boldest |
| Juguete | Fredoka / Instrument Sans / Geist Mono | 108 KB | The current wordmark. Friendliest, and most at risk of reading as "for kids" |
| Taller | Bricolage Grotesque / Geist / Geist Mono | 127 KB | Hand-made workshop grotesque, dev-tool body. A bit familiar already |
| Suave | Fraunces SOFT / Inter / JetBrains Mono | 205 KB | Soft serif with the product's own Inter. Warmest, heaviest |

**Chosen: Geométrica**, Rafael's pick from the six. It sits best beside the mark, it's the lightest, and it stays readable at length.
If you want the type itself to carry the "toy outside, tool inside" story, Recursive is the bolder alternative.

### Claim these the same day (needs Rafael's accounts)

| What | Where | Note |
|---|---|---|
| GitHub org **`trompo-dev`** | github.com/organizations/plan | The plain `trompo` handle is an empty account from 2009. You can ask GitHub to release it under its name-squatting policy later. |
| npm scope **`@trompo`** | npmjs.com/org/create | Free for public packages. The unscoped `trompo` package name is also free, so publish a placeholder to hold it. |
| Domain **trompo.dev** | any registrar (Vercel quotes $9.99 for the first year, $13/yr renewal) | Optional extras: trompo.io ($14.99, then $46), trompo.studio ($21.99, then $45.76) |
| Trademark search | USPTO / EUIPO, classes 9 and 42 | Neighbours: Trompo App (Spanish food delivery), Twisted Trompo (restaurant ordering) |

### Rename in the code

- ✅ 9 Oct: `src/site.config.ts` now has name `Trompo`, slug `trompo`, repo `trompo-dev/trompo`, url `https://trompo-dev.github.io/trompo`. Switch the url to `https://trompo.dev` once the domain is live, then run `npm run sync`.
- ✅ 9 Oct: `npm run sync` moved `skills/prototype-studio` → `skills/trompo` and rewrote the docs, plugin, registry and package.json.
- ✅ 9 Oct: the landing `Mark` (`src/landing/parts.tsx`) is the Trompo top, and `public/favicon.svg` is the favicon.
- ⏳ The other session renames the leftover `prototype-studio` strings in `src/shells` and `src/kit/index.ts` once its builders finish. The `studio:` storage keys stay as they are, so people's saved settings survive.

---

# Round 1

## Positioning

**Promise:** Put a real design tool around the prototype you already have.

**Pitch.** Designers now build shaders, motion studies, 3D scenes and asset generators with an agent, and they end
up with a canvas and a wall of debug sliders. This gives that work the interface it deserves: an inspector,
timeline, layers, presets, undo and export, in the calm style of Figma or Spline. It wraps what you already have,
whether that's canvas, three.js, React or any page in an iframe. You install it piece by piece, so the code stays
yours and it can still be updated. It also has a present mode clean enough to hand to a client, and it works on
their phone too. It ships as an agent skill, a Claude Code plugin and a shadcn component registry.

**Audiences**
1. **Designers who prototype with agents** (primary): a pro-grade tool around their idea without becoming engineers, ready to show a client.
2. **Design engineers and creative coders**: better controls than Leva or Tweakpane, plus undo, presets and export for shaders, 3D and motion, in any runtime.
3. **Studios and agencies**: instruments for clients (brand generators, multi-size ad export, demos) with a present mode and share links.
4. **Agent and tool builders**: an agent that builds pro tooling by default, from a skill plus a registry.

**How we differ**

| Alternative | What it is | Ours |
|---|---|---|
| Toolcraft | An agent generates a whole new app from a ~1,900-file starter. It's React-only, desktop-only and can't be updated after generation. | Wraps the prototype you have, in any runtime. It installs per component, stays updatable and works on phones. |
| DialKit | A floating panel for tuning springs and values, with "copy prompt for agent". | The panel is one part of the whole tool: stage, timeline, layers, export, presets and a client view. |
| Figma PropsKit | Web components for Figma's agent to build panels inside Figma. | Runs anywhere on the web, outside Figma. |
| Leva · Tweakpane · lil-gui | Debug panels that look like debug panels. | Presentation-grade chrome with undo, A/B, presets, share links and export. |
| Theatre.js | A studio for sequencing animated values over time. | Animation is one shell among many: 3D, photo, flows, journeys, node graphs and batch export. |
| shadcn/designer | A commercial studio template. | MIT, built from parts. Take only what you need. |

## Names (20 of 39 checked)

npm / scope / GitHub: ✓ free · ✗ taken · ~ taken but a variant is free.

| Name | Idea | npm | @scope | GitHub | Free domains | Already out there | Verdict |
|---|---|---|---|---|---|---|---|
| **Thumbwheel** | Ridged wheel you roll to fine-tune a value | ✓ | ✓ | ✓ | .dev .studio .design .tools | Only the generic control name | **Shortlist ★** |
| **Wingspace** | Theatre wings hold the controls; the show owns the stage | ✓ | ✓ | ~ wingspace-dev | .dev .studio .design .tools | Wingspace Theatrical Design owns .com | **Shortlist** |
| **Jigwork** | A jig holds the work and guides the tool | ✓ | ✓ | ~ jigworkhq | .studio .tools .design | JigWorks (special-ed jigsaw app); JigSpace nearby | **Shortlist** |
| **Clampwork** | Clamps free both hands for the work; CSS clamp() | ✓ | ✓ | ✓ | **.com** .dev | Nothing found | **Shortlist** |
| Plinthkit | A plinth shows the work | ✓ | ✓ | ✓ | .dev | Nothing; "kit" suffix weak | Reserve |
| Knobwork | Craft of the controls | ✓ | ✓ | ✓ | .com .dev | "Knob" is British slang | Pass |
| Detent | The click that seats a dial | ✓ | ✗ | ✗ | .design .tools | Detent SEO SaaS; SwiftUI "detents" | Pass |
| Trimpot | Calibration potentiometer | ✓ | ✗ | ✗ | .dev .studio | **Registered trademark (Bourns)** | Pass |
| Truing | Truing stand holds a wheel | ✓ | ✗ | ✗ | .studio | Obscure word | Pass |
| Faderworks | Mixing desk for your prototype | ✓ | ✓ | ✓ | .dev | FaderWorks audio plug-in exists | Pass |
| Flyrail | Theatre fly-system rail | ✓ | ✓ | ✗ (org created 2026) | — | Looks like a launch in progress | Pass |
| Workstand | Bike workstand | ✓ | ✗ | ✓ | .studio | Bike-coop app uses it | Pass |
| Pegrail | Pegboard tool rail | ✓ | ✓ | ✓ | .dev | Meaning doesn't land | Pass |
| Knobhouse | House of controls | ✓ | ✓ | ✓ | .dev | "Knob"; sounds like a pub | Pass |
| Plinth | What sculpture stands on | ✗ | ✗ | ✗ | — | 391 repos | Taken |
| Jig | Holds the work | ✗ | ✗ | ✗ | — | JigSpace, withjig | Taken |
| Maquette | Sculptor's study model | ✗ | ✗ | ✗ | — | maquette JS UI library | Taken |
| Holdfast | Bench holdfast | ✗ | ✗ | ✗ | — | — | Taken |
| Vernier | Fine-reading scale | ✗ | ✗ | ✗ | — | Vernier Ruby profiler, science brand | Taken |
| Gantry | Frame that carries tools/lights | ✗ | ✗ | ✗ | — | Gantry 5 CMS framework | Taken |

Also checked and taken: Easel, Trellis, Caliper, Gimbal, Bezel, Lathe, Patchbay, Armature, Vitrine, Pegboard,
Knurl, Benchtop, Surround, Sightline, Scrim, Tenon, Fixture.

**Method.** npm package and `@scope` via the registry, GitHub handle via the users API, a repo search by name,
live registrar availability for domains (taken ones opened to see what's there), and a web search for existing
software. Trademarks were only spot-checked, so run a USPTO/EUIPO search (classes 9 and 42) before launch.

## Shortlist

| | Mark | Wordmark | Palette |
|---|---|---|---|
| **Thumbwheel** | A thumbwheel edge-on in its slot: ridges bunch towards the edges like a rolling cylinder, and an orange line marks the value | Geist SemiBold, lowercase | Graphite `#18181B` · Paper `#F4F2ED` · Signal `#FF5B1F` · Steel `#8B9099` · Fog `#D9D6CF` |
| **Wingspace** | Two wing flats in perspective, with the work lit between them | Instrument Serif | Stage `#141210` · Footlight `#FFF1CC` · Velvet `#8E1B2E` · Boards `#6B5B4E` · House `#F3EFE7` |
| **Jigwork** | An L-shaped fence holding the workpiece; the hole is the drill bushing | Archivo Expanded Bold, lowercase | Ink `#16181D` · Birch `#EAD9B5` · Layout blue `#2346D8` · Steel `#9AA1AB` · Shop white `#F6F4EF` |
| **Clampwork** | A C-clamp closing on the work; it reads as a C at 16px | Bricolage Grotesque Bold, lowercase | Cast iron `#1E2120` · Machine green `#3D6B52` · Chartreuse `#D6F25B` · Rust `#B4532A` · Mint paper `#EEF2EC` |

Marks are drawn on a 32-unit grid and tested from 96px down to 16px. Brand colour lives on the site and the mark
only. The product chrome stays neutral (Inter, kit tokens), per the kit rules.

## Voice

A good studio tech: calm, exact, a little warm. We talk about the work and the person making it, never about ourselves.

1. **Name the thing.** Say "inspector, timeline, layers", not "powerful controls".
2. **Short, plain sentences.** One idea each.
3. **Sentence case, always.** Headings, buttons and menus too.
4. **Show, don't adjective.** A screenshot or a number beats "beautiful", "seamless" or "intuitive".
5. **Calm confidence.** No exclamation marks, and none of "supercharge", "unleash", "magic", "game-changer" or "AI-powered".
6. **Craft words are welcome.** Scrub, artboard, detent and jig are fine, as long as you explain each once.
7. **Credit the shoulders.** Toolcraft, Base UI and shadcn get named, generously.

| Say | Not |
|---|---|
| Drop it around a three.js scene and you get an inspector, a timeline and export. | Supercharge your creative workflow with AI-powered controls! |
| Undo works on every control, mid-drag included. | A seamless, intuitive editing experience. |
| Send the link. Your client changes the colours on their phone. | Delight stakeholders with immersive presentations. |

**Taglines**
- Thumbwheel: *Fine-tune anything.* · *Roll it till it's right.* · *Every prototype deserves proper controls.*
- Wingspace: *Your work, centre stage.* · *Everything around the work. Nothing in front of it.* · *The crew stays in the wings.*
- Jigwork: *Build the tool that builds the work.* · *Hold it steady. Make it repeatable.* · *Jigs for the things you make.*
- Clampwork: *Clamp a studio onto anything.* · *Both hands free for the work.* · *Grips any prototype.*

## Once a name is picked

1. Claim the GitHub org, the npm `@scope` and the domain on the same day.
2. Edit `src/site.config.ts` (name, slug, tagline, repo, url), then run `npm run sync`.
3. Replace the placeholder `Mark` in `src/landing/parts.tsx` with the chosen SVG from `brand/marks.js`.
4. Run a trademark search before the public launch.

---

# Round 2: Spanish, Latin, history, inventors, pop culture

Checked 9 Oct 2026, same method as round 1, 74 more names. Full table, marks and palettes are on the board under **Round 2**.

## Recommendation

**Cruceta**, the wooden cross a puppeteer holds to work a marionette. A marionette control doesn't make the
puppet, it makes the puppet move. That's the product: we don't build your prototype, we give it the controls.
It's clean on every check: npm, `@cruceta`, `.dev` `.studio` `.design` `.tools` `.app` `.io`, and no software uses the name.
The GitHub handle is an empty 2017 account (`cruceta-dev` and `crucetahq` are free).

## Shortlist

| Name | Lens | Story | Availability | Watch out |
|---|---|---|---|---|
| **Cruceta** ★ | Spanish | Marionette control bar: the controls that bring it to life | npm ✓ · scope ✓ · 6 domains · GH ~ cruceta-dev | Unfamiliar word in English |
| **Tramoya** | Spanish | Stage machinery: everything behind the show | npm ✓ · scope ✓ · .dev .studio .design .tools .io · GH ~ tramoya-dev | Three small GitHub projects use the same metaphor; tramoya.app exists |
| **Bastidor** | Spanish | Canvas stretcher, embroidery hoop, chassis, theatre wings: the frame around the work | npm ✓ · scope ✓ · .dev .studio .design .tools .io · GH ~ bastidorhq | .com is an embroidery shop |
| **Juanelo** | Inventors | Juanelo Turriano, Charles V's clockmaker and automaton-builder | npm ✓ (scope held, empty) · .studio .design .tools .app · GH ~ juanelohq | .com/.dev taken; English pronunciation |
| **Periaktos** | History | Greek three-sided turning scenery prism: presets, about 2,000 years early | Free on every check | Hard to spell and say |

Marks (first drafts in `brand/marks.js`): Cruceta = control cross with strings to the work · Tramoya = fly-loft
beam, pulley, flown flat and counterweight · Bastidor = embroidery hoop · Juanelo = clockwork winding key set in
the work · Periaktos = prism from above with the lit face.

## Interesting but out

- **Telekino**: Torres Quevedo's 1903 radio remote control, a great story. But it's also a big Argentine lottery, and scam apps use the name.
- **Marey**: Moonvalley's AI video model.
- **Frisket**: a live AI-spreadsheet product.
- **Atrezo**: sounds like Atrezzo, a health-care software platform.
- **Torelli**: an active developer holds the handle, and it's a common surname.
- **Rotula**: means "kneecap".
- **Maqueta**: unsearchable, because "maquetación" means web layout in Spanish.
- **Trimpot** (round 1): a registered trademark.

## Stories to borrow, whatever the name

Spline ducks (the draughtsman's weights that held a curve), Heinlein's and Henson's **waldo**, Okuda's Star Trek
panels, ILM **kitbashing**, Chaplin's **Candilejas**, the Greek **mechane** (deus ex machina), the man behind
the curtain, **Torelli's one winch** (a preset in 1641), the **Telekino** steering a boat in Bilbao (1906),
and Juanelo's **lute-playing lady**.

---

# Round 3: cute prefixes, toys, fictional makers

Checked 9 Oct 2026, same method, 64 more names (177 total across three rounds). The board has it under **Round 3**.

**Cute pick: Trompo**, the Latin American spinning top. It's inert in your hand and alive once you spin it. It's six
letters and easy in English. npm, `@trompo` and `.dev` `.studio` `.design` `.tools` `.io` are free, and `trompo-dev` is free on GitHub.
Watch out: a small Spanish food-delivery app and a restaurant ordering app share the name.

| Name | Lens | Story | Availability | Watch out |
|---|---|---|---|---|
| **Trompo** ★ | Toys | Spinning top; also the al-pastor spit | npm ✓ · scope ✓ · 5 domains · GH ~ trompo-dev | Small food apps use it |
| **Ruedita** | Cute (Spanish -ita) | "Little wheel", Thumbwheel's cute cousin | npm ✓ · scope ✓ · 5 domains · GH ~ ruedita-dev | Needs hearing once |
| **Lilknob** | Cute (lil-) | A lil knob that smiles back | **Everything free, incl. .com** | Echoes lil-gui (a competitor); "knob" is British slang |
| **Tornasol** | Fictional makers | Professor Calculus in Spanish Tintin; the everyday word means iridescent shimmer | npm ✓ · scope ✓ · 5 domains · GH ~ tornasol-dev | Tornasol Studio (Madrid design collective); keep clear of Tintin |

**Reserve:**
- Lildial: all free, but the same lil-gui echo.
- Drosselmeyer: the Nutcracker's clockmaker. Long.
- Busyboard: "busy" fights the calm-chrome promise.
- Perillita: "little knob". Hard to say.
- Juguetero: "toymaker".

**Out:**
- "Lite-" anything: it reads as the cut-down edition.
- Knobby: svelte-knobby is a tuning panel in our exact space.
- Balero: Balero Labs, a Uruguayan software company.
- Papalote: the Mexico City children's museum.
- Perinola: slang.
- Geppetto: several AI products.
- Gearloose: Disney.
- Coppelius: CoppeliaSim.
- Twiddle, Whirligig, Zoetrope, Pinwheel, Windup, Fiddly, Pygmalion, Daedalus and Penelope: all taken.

**Stories:**
- **Penelope's loom**: she unpicked her weaving every night, the oldest undo.
- **Drosselmeyer's clockwork castle**: the children want to change what the figures do.
- **The busy board**: fiddling is how you learn what a thing can do.

---

# Favourites and round 4: Thumbwheel, shorter

**Rafael's favourites so far:** Trompo, Thumbwheel, Periaktos, Jigwork. They're pinned at the top of the board.

**Thumbwheel in a shorter word:**
- **Molette** (7 letters) is the French word for exactly this object: the knurled wheel on a lighter, a camera dial, a mouse scroll wheel, the adjustable wrench (clé à molette).
  - Free: npm, `@molette`, `.dev` `.studio` `.design` `.tools` `.io`, and `molette-dev` on GitHub.
  - Taken: the .com and .app.
  - No software uses it.
- **Knurly** (6 letters) comes from knurl, the cross-hatched grip, and sounds like "gnarly".
  - Free: npm, `@knurly`, the GitHub handle, and `.dev` `.studio` `.design` `.tools` `.app`.
  - The .com is a small weightlifting-apparel brand.
- **Reserve:** Trimwheel (the pilot's pitch-trim wheel), but it's only one letter shorter.
- **Out:**
  - Rotella: Shell Rotella motor oil.
  - JogDial: JogDial.js already exists.
  - Rueda: a common surname. Ruedita covers it, and Latin Americans already call the mouse scroll wheel "la ruedita".
  - Knurl and Rowel: taken.

Mark note: the Molette draft's ridged rim edges towards a gear (the settings icon). Since it's the same object,
the Thumbwheel mark could simply carry over to Molette.

---

# Round 5: a general search

56 more names (249 total), steered by the favourites: real objects, turning/tuning/holding, two syllables.
Most plain dictionary words came back taken.

**New find: Turnwork.** All four favourites turn: a trompo, a periaktos, a thumbwheel, and in the workshop "turning"
means shaping wood on a lathe, which is Jigwork's world. Turnwork names that common thread in Jigwork's form.
- Free: npm, `@turnwork`, the GitHub handle, `.dev` `.studio` `.app`.
- The .com is held, with nothing public on it.
- Downside: it describes more than it sparks.

**Reserve:**
- Pegtop: the English trompo, a fallback if Trompo's food-app neighbours bother you.
- Peonza: Spain's word for a spinning top.
- Stagework

**Out:**
- Telari: probably the Italian Renaissance word for the turning prisms, but it's now a macOS Markdown reader for typography, which also holds the npm scope.
- Diabolo: domains and scope taken.
- Tambour: a GitHub org appeared in 2026.
- Twirly: too generic.
- Kreisel: harsh in English.
- About 45 workshop, stage, textile and music words were taken outright.

---

# Wireframe identity (9 Oct 2026: the proposal is chosen)

**Idea (Rafael):** Trompo is a harness that holds any content, so the shells demo with tasteful wireframe
placeholders instead of high-fidelity UI. Board section **Wireframe** has 33 reference screenshots in six
directions, and the same artboard mocked up four ways. The screenshots are third-party work: they live in
`brand/references/wireframe/`, which is git-ignored and must never be published.

| Direction | Reference | What makes it tasteful |
|---|---|---|
| One curated placeholder, repeated | Cargo Basic templates | No grey boxes. One muted photo repeated in every slot, with tiny numbered captions. Calm, deliberate, and obviously placeholder |
| Single-hue construction diagram | Apple HIG | UI drawn in tints of one hue, with guide lines and dimension marks. An explanation of the UI, not the UI |
| Lo-fi component greys | Relume, Whimsical, Figma kits | Labelled grey blocks. The good ones add callouts in a single accent |
| Visible structure | Vercel Geist grid, Dub | Hairline grids and crosshairs left visible: the scaffold is the ornament. Closest to "harness" |
| Typographic austerity | Teenage Engineering, Are.na | Small type, lists and labels do the work. Placeholders become words |
| Skeleton loaders | shadcn, Mobbin | Soft rounded bars. On their own they read as "loading", so use them as an ingredient only |

**Avoid:** hand-drawn or sketchy (Excalidraw, Balsamiq), which reads unfinished, and decorative abstract shapes (Material), which are illustration rather than placeholder.

**Proposal: "the harness, drawn":**
1. **Scaffold.** A hairline frame, crosshair corners and a size label around every artboard.
2. **Placeholders.** Labelled warm-grey blocks and skeleton text lines, with Geist Mono labels ("image · 16:9").
3. **Signature image.** One placeholder image we own, used everywhere a photo goes, Cargo-style. A dithered or photographed spinning top would make the placeholder itself a piece of Trompo.
4. **Annotation.** Callouts and dimensions in Trompo pink, inside the artboard only (the chrome accent stays blue).

**Decided 9 Oct: go with the proposal.**

**Signature image:** dithered trompo stand-ins are generated by `brand/tools/dither-trompo.mjs` into `brand/trompo/placeholders/`. Rafael will supply the final image(s).

**Missed in the first pass, now added:** Cargo's *Blank* placeholder, a flat card with one corner-to-corner hairline, two binder punch holes and a tiny vertical caption naming its own format. Trompo gets its own version for empty slots. Status and next steps are in `brand/SESSION-NOTES.md`.

---

# Type at scale + body font (10 Oct 2026: chosen, Hanken Grotesk + stacked hero)

Rafael: "go a lot bigger with Gabarito" (reference: Circular at Spotify), and replace Lexend with something more neutral.
Board section **Type scale** has big-type brands measured at a 1440px viewport, three full-width Trompo heroes,
and a live body-font switcher. Screenshots are in `brand/references/type-scale/` (git-ignored).

**Measured:**
- Spotify Premium: 128px / 900, **10.7× body**.
- Spotify, For the Record: 140px / −0.04em.
- Uber: 120px, line-height 0.90.
- Wise: 89px / 900, line-height 0.85.
- Robinhood: 110px. Gumroad: 96px.
- Trompo today: 52px, 3.1×.

**Principles:**
- Go 7–10× the body: about 120–150px on desktop (9–12vw), 48–56px on phones.
- Use weights 800–900. Gabarito goes up to 900.
- Line height 0.85–0.95; tracking −0.03 to −0.045em.
- Two to five words per line, with deliberate breaks.
- Let the type fill the frame or bleed off it.
- Keep the body plain at 16–18px.
- Set big type on full pink fields, with white text on #D1006F.
- Emphasise with weight or pink, since Gabarito has no italic.

**Body font candidates** (all Google Fonts / OFL):
- **Geist** (29 KB, my pick: neutral, and the same family as the Geist Mono we already use)
- Inter (47 KB, the product's own chrome font)
- Instrument Sans (29 KB)
- Figtree (20 KB)
- Hanken Grotesk (34 KB)
- Public Sans (26 KB)

**Decided 10 Oct: body = Hanken Grotesk (briefly Public Sans); hero = stacked** (Gabarito 900, about 150px desktop, line-height 0.88, −0.045em, two to five words per line).
Then apply them to `src/landing` + `src/gallery/Gallery.tsx`, after pinging the main session first.

---

# Placeholders + Paper-inspired socials (10 Oct 2026)

**Blank card (built).** Trompo's version of Cargo's blank sheet:
- a warm card with one hairline diagonal
- two **real cut-out punch holes** on the long edge: left for portrait or square cards, top for landscape
- a Geist Mono caption: "Trompo placeholder / image — 16:9 · horizontal". No ®, since the mark isn't registered.

Source: `brand/placeholders.js` (`blankCard()`). Files: `brand/tools/blank-card.mjs` → `brand/trompo/placeholders/blank-{light,dark}-{16x9,4x3,1x1,3x4,2x3,9x16}.{svg,png}`.

**Dithered top:** night variants are now a lit top on clean ink, with no dot halo. Rafael will supply the final image(s).

**Paper (paper.design) studied:** site, X and YouTube. Instagram is behind a login. Screenshots are in `brand/references/paper/` (git-ignored). What to borrow:
- **The mark as a window.** Paper fills its mark with different materials. Trompo's top can hold solid, halftone, overprint, dither, wood or a blank sheet.
- **Brand art made with your own tools.** Their textures come from Paper Shaders; ours should come from Trompo's dither shell.
- **Measurement as ornament:** rulers, dashed column guides, selection handles, guide arcs.
- **Paper, not white,** with a faint grain.
- **Where we differ:** Paper's voice is quiet and lowercase-light; Trompo's is loud Gabarito Black and pink.

**Mock-ups on the board (`#paper`):**
- an X/YouTube banner: six material tops on ruled paper
- light and dark post/thumbnail templates: stacked Gabarito plus the dithered top

---

# Wire aesthetic v2 (10 Oct 2026): polish rules

Research: 14 are.na channels (placeholder as form, markup & annotation, wireframe → prototype, technical drawing,
diagrams) and 7 Cosmos searches (wireframe, placeholder, technical drawing, annotation, blueprint, ui wireframe,
grid layout). Screenshots are in `brand/references/wire2/` (git-ignored).

Why v1 looked unfinished: it mixed grey fills, teal arcs, pink and black, with loose labels and no drafting logic.

**Rules (implemented in `brand/wire.js`):**
1. **One ink; line weight is the hierarchy:** hair 0.75 (structure), thin 1 (objects), mid 1.6 (emphasis).
2. **Pink is the red pen.** It's only for annotation: dimensions, numbered callouts, notes.
3. **Real drafting conventions:** extension lines, 45° ticks, the value in a gap in the line.
4. **Every sheet is a document:** border, ruler ticks, registration marks, and a title block (project / drawing / sheet n / N / scale / date / drawn).
5. **Placeholders follow type.** Headlines are heavy bars at real leading. Body is thin bars on a baseline with a short last line. Images are a box with both diagonals.
6. **Numbered callouts.** Each one is a dot, a straight leader and a circled number, and leaders never cross content.
7. **Stationery:** sheet numbers and punch holes (pairs with the blank card).

**Sheets:** `landingSheet(theme)` (landing hero, 1200×760) and `markSheet(theme)` (the mark as a technical drawing on the 32-unit grid), both on the board under **Wireframe → v2**.
