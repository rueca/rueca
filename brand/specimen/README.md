# Specimen

Rueca's colours as a nomenclature, after Werner's *Nomenclature of Colours* (1821). Each colour gets its swatch, its Spanish name, the Latin of what dyes it, one checked fact, an engraving of the source, and its job in Rueca written in the margin by the hand. The entries come from `brand/NOMENCLATURE.md` (proposed, 16 Oct 2026).

Open it with the `brand-board` dev server at `/brand/specimen/`.

## Formats

- **Tile**: a bento tile (285 × 297, the bento's units), one colour a beat. The next colour comes up from the bottom over the last one, the words follow, then the pen writes the job. Nine beats make a loop that closes on Achiote.
- **Plate**: the whole table on one 1080 × 1440 sheet, Werner's columns: No., Colour, Name, Source, Note & job, Engraved. **Write the jobs** animates the pen down the margin, one row a beat.

Export a PNG of the current frame, or one loop as MP4.

## Files

- `entries.ts`: the nomenclature, hex values from `brand/RUECA.md`.
- `artifact.ts`: the drawing, a pure function of (values, t).
- `engravings/*.webp`: the sources in Nogal ink on transparent. `engravings/source/` keeps the Midjourney originals. They were made with the RUECA.md §6 recipe (seed 4417), with the Diderot `--sref`, or an earlier engraving as the reference when Wikimedia wouldn't load. They were inked with `python3 brand/tools/ink.py <src> <out>.webp --w 900 --crop l,t,r,b --sides 0.015`, and alpha below 34 was cleared so no paper tone shows on a coloured block.

| Colour | Source | Midjourney job |
|---|---|---|
| Achiote | *Bixa orellana*, pods and flower | `8f6ae11a…` #0 |
| Gualda | *Reseda luteola* | `5529acd9…` #2 |
| Hoja | Gualda and Añil side by side (two dips) | (reuses both) |
| Cielo | *Indigofera suffruticosa* | `bf2442d0…` #1 |
| Malva | *Malva sylvestris* | `94de79c3…` #3 |
| Mora | *Rubus ulmifolius* | `e3aa366a…` #0 |
| Nogal | *Juglans regia*, split hull | `19fa8f06…` #0 |
| Lana | a skein and carded fleece | `af0ab5d4…` #1 |
| Platino | a native platinum nugget | `80668db7…` #2 |
