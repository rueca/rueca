# Styles

Rueca's generative art in twelve historical one-tone styles, and a poster series made from them: **Una rueda, doce manos** (one wheel, twelve hands). Open it with the `brand-board` dev server at `/brand/styles/`. The posters are also in Figma, on the "Una rueda, doce manos" page of Rueca Branding, with live type.

## The series

The idea is the same subject at the same crop, drawn by twelve renderers, like a type specimen. The style is the only thing that changes. The subject is the logo itself, carved as a relief from its exact geometry (`tone.ts`, `markRelief`):
- the band is a round belt
- the wheel and the whorl are domes
- the light comes from the upper left

No photo is involved. Each sheet prints in one ink: art, type, rules and the hand's note. The "Settings" line is the renderer's own report of the numbers it used.

| # | Style | Ink | How it's drawn |
|---|---|---|---|
| 1 | Talla dulce (copperplate engraving) | Nogal | Hatching that follows the form, along the belt and round the domes, swelling into the shadow, with a cross-hatch in the darks |
| 2 | Grabado a la testa (wood engraving) | Nogal | A solid block with white lines cut along the form, widest in the light |
| 3 | Punteado (stipple) | Achiote | One dot size, its density set by the tone |
| 4 | Trama de líneas (line screen) | Nogal | Straight lines whose width is the tone |
| 5 | Risografía (riso, one drum) | Mora | Solids in the darks, halftone in the midtones, drum grain |
| 6 | Tramado de 1 bit (dither) | Nogal | Atkinson error diffusion on an 8 px pixel |
| 7 | Arte ASCII | Nogal | Characters picked by the ink each one carries, measured from the font |
| 8 | Guilloché (rose engine) | Mora | Rose curves round the wheels, a wave chain along the band |
| 9 | Muaré (moiré) | Nogal | Rings round both wheels, inside the mark's silhouette |
| 10 | Trazador (plotter, after Nees) | Achiote | Squares on the grid; disorder grows down the sheet |
| 11 | Curvas de nivel (contours) | Cielo | The shading surveyed at 32 levels |
| 12 | Cianotipia (cyanotype) | Cielo | A photogram: the coated plate is the ink, the mark stays white |

The **Sketchbook** view shows the twelve styles side by side on other sources: Midjourney photographs of a spinning wheel, a hub, a spindle and achiote (`sources/`), Rafael's chosen Saxony plate, and the mark itself.

## Two more series

- **Images** ("Doce manos, doce imágenes"): the same sheets, but each style draws its own subject again, at the v3 crops. The subjects are photographs of a hub, a wheel or achiote, the Saxony plate, or the mark. Renders are in `renders/images/`.
- **Layers** ("Capas, doce manos apiladas"): the hands stacked, after the layering devices in Rafael's Trove (`research/31-one-tone-styles/layering.md`). There are twelve recipes in `layers.ts`:
  - ghost and line
  - overprint
  - a diagram over texture
  - glyphs in the mark
  - twelve hands in columns
  - a resolution ladder
  - type knocked out
  - a veil
  - and others

  There's no transparency anywhere: a ghost is the same ink screened through a dither, and a second ink multiplies only where it crosses the first. Renders are in `renders/layers/`.

Switch between the three with **Series** in the inspector. All three are on the Figma page, one section below the other.

## Files

- `wheel12.ts`: the twelve renderers used on the posters
- `layers.ts`: the layering recipes and compositor
- `tone.ts`: tone maps, plus the mark's relief
- `styles.ts` and `render.ts`: the Sketchbook renderers and sources
- `posters.ts`: the master sheet as a list of elements, so the canvas and Figma build the same thing
- `devtools.ts`: off-screen renders, plate exports and the Figma spec, for review and rebuilding the Figma page
- `renders/`: the twelve posters (1200 × 1600) and a contact sheet

## Where it came from

The research is in `research/31-one-tone-styles/`:
- the history of one-tone styles
- the peers, HEX and others
- Midjourney style references
- your Trove
- the art-director critique of v3, which turned "a catalogue of looks" into one wheel through twelve hands

## Exports

Export a PNG of the current view, or all twelve posters, from the Export menu.
