# Layering: how Rafael's Trove does it, and the "Capas" series

17 Oct 2026. Rafael asked for the styles to be layered, starting from how others layer in his Trove. These are the devices his saves use, each with the save it comes from. The Styles tool now composes them, in `brand/styles/layers.ts`.

## Eight devices from the Trove

1. **Spot-colour overprint.** Flat fields, halftone and photographic overprints trade transparency. Sources:
   - a screenprint collage ([are.na/block/1862106](https://www.are.na/block/1862106))
   - "filtered undergrowth", a two-colour halftone over botanical forms and cut type (lab.rat.xl)
   - a newsprint halftone portrait sliced by flat pink columns
2. **Ghost plus one sharp layer.** Sources:
   - the blind-embossed St George with three red stars ([are.na/block/29659225](https://www.are.na/block/29659225))
   - "phantom press", a figure dissolved into halftone and fabric texture
   - cream bars with ghost outlines drifting behind them ([are.na/block/38118284](https://www.are.na/block/38118284))
3. **Diagram over texture.** Sources:
   - nested keylines and technical annotations over coarse halftone nature imagery ([pinterest](https://uk.pinterest.com/pin/468092955042105053/))
   - neon registration lines over a concrete object ([are.na/block/26888255](https://www.are.na/block/26888255))
   - a black silhouette over a red-and-black technical grid ([are.na/block/30835671](https://www.are.na/block/30835671))
   - Tschumi's *Manhattan Transcripts* registers ([are.na/block/559814](https://www.are.na/block/559814))
4. **Glyphs filling a silhouette.** Sources:
   - letter grids filling a seated woman over a repainted landscape
   - an ASCII horse over a blurred sepia painting ([are.na/block/34440910](https://www.are.na/block/34440910))
   - ASCII botanicals in glitch collage
5. **The image cut into a grid or strips.** Sources:
   - swallows sliced into tiles ([pinterest](https://uk.pinterest.com/pin/1548181186215800/))
   - a lily cut and offset
   - a still life sliced into strips
   - Anthony Gerace's gridded Rosetta Stone ([anthonygerace.co.uk](https://www.anthonygerace.co.uk/editorial?itemId=cjy3gb8we6pw8kaqy7hbfas8l5tkv0))
6. **Type knocked out of a texture, or dissolving into it.** Sources:
   - ghosted oversized type on a Japanese architecture cover ([are.na/block/39311536](https://www.are.na/block/39311536))
   - letterforms built from dots ([are.na/block/38785415](https://www.are.na/block/38785415))
   - type smeared into a dot matrix ([are.na/block/13686072](https://www.are.na/block/13686072))
7. **The resolution ladder.** Sources:
   - four halftone renderings of one cat ([are.na/block/33287385](https://www.are.na/block/33287385))
   - a plate at rising screen frequencies ([are.na/block/34126723](https://www.are.na/block/34126723))
   - a floral form degrading into grid quantisation
8. **Veils and translucent sheets.** Sources:
   - glassine over a print with fine silver linework
   - a translucent overlay sheet with numbered dots and a stapled K ([are.na/block/30430505](https://www.are.na/block/30430505))
   - layered paper circles making a rosette

## Rules the Rueca version keeps

- **No transparency.** A ghost is the same ink screened through a 4 × 4 ordered dither, so it stays one ink.
- **Real overprint.** A second ink multiplies only where it crosses the first, as on a press.
- **At most two inks a sheet.** The second is always Nogal, and type prints in Nogal.
- **Misregistration is deliberate and stated,** for example "off 10, −6".
- **Same master sheet.** It uses the grid, Goudy title, hand note, settings line and caption block of "Una rueda, doce manos".

## The twelve "Capas"

| # | Name | Layers | Inks |
|---|---|---|---|
| 1 | Fantasma | Stipple ghost (50%, zoomed) under engraving | Nogal |
| 2 | Sobreimpresión | Riso off register under a line screen | Achiote, Nogal |
| 3 | Construcción | Construction drawing over dither | Nogal, Achiote |
| 4 | Máscara de letras | ASCII in the mark, rings round it | Nogal |
| 5 | Doce manos en una | All twelve hands as 100 px columns | Nogal |
| 6 | Escalera | Dither, riso, line screen, engraving in four bands | Nogal |
| 7 | Calado | *hilar* knocked out of rings | Nogal |
| 8 | Velo | Rose engine over a ghosted woodcut | Nogal, Mora |
| 9 | Plano | Engraving in the mark over a cyanotype | Cielo, Nogal |
| 10 | Doble muaré | Two moirés, out of register | Malva, Nogal |
| 11 | Bloque y mapa | A solid block over a contour survey | Cielo, Nogal |
| 12 | Orden y desorden | Plotter over engraving | Nogal, Achiote |

In Figma, these are under "Capas, doce manos apiladas" on the "Una rueda, doce manos" page, with live type.
