# Branding session — handoff (paused 9 Oct 2026, ~18:20)

Read this first when resuming. The full brand spec is in `BRAND.md`. The visual record is the board at
http://localhost:5273/brand/, which needs the dev server running (`npm run dev`, owned by the main session).

## Decided (Rafael)
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
1. **Site fonts (blocked, waiting).** Apply Geométrica to the landing page and gallery. The main session ("OG agent") approved it, but asked me to **wait for its message "go fonts"** (its QA agents are running dev servers). The prepared plan:
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
   - Plan: build **Trompo's own blank card** (paper and ink tints, hairline diagonal, punch holes, Geist Mono caption such as "Trompo® placeholder — image 16:9") as an SVG generator.
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
