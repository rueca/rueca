# One tone, one paper: a historical survey of single-ink image styles

16 Oct 2026. Thirty image-making styles that work as one ink on one paper, with where each came from, what makes it look real, how to draw it on an HTML canvas, how to ask Midjourney for it, and whether it suits Rueca. It ends with a ranked shortlist of 12, each with an ink-and-paper pair.

## How to read this

- **Rating** is fit for a calm, editorial, open-source design-tool brand, 1 to 5. It is a judgement about mood and brand rules, not about how good the style is.
- **Brand rules in play** (from `brand/RUECA.md`, as briefed): no weaving or loom imagery, no gradients, no glows, no glossy 3D, "lines stay lines". Styles that normally lean on smooth tone (mezzotint, lithographic crayon, cyanotype) are marked where they could slide into gradient territory. The fix is the same each time: build tone out of marks or a small number of flat steps, never a smooth ramp.
- **Sources.** Links are to pages I opened or that came back from search. Where a claim comes from my own background knowledge and I could not find a page that states it, I say "unverified". Dates that sources disagree on are shown as ranges.
- **Rueca's two inputs.** (1) Procedural motifs: the drive wheel, the spindle whorl, the band joining them, thread paths. These are vector geometry. (2) Engraved plant plates, which arrive as greyscale raster. Each "Generate" entry says what it does with each.
- **Palette shorthand.** Nogal ink `#171615`, Lana paper `#FDFBFA`, Achiote `#F6571C`, Cielo `#5070F0`, Mora `#6E1A3E`, Malva `#EFA6FF`.

## Contents

| # | Style | Era | Family | Fit |
|---|---|---|---|---|
| 1 | Copperplate and steel line engraving | 1430s onward, peak 1700 to 1850 | Intaglio | 5 |
| 2 | Wood engraving (Bewick) | 1790s onward | Relief | 5 |
| 3 | Woodcut | 1400s onward | Relief | 3 |
| 4 | Linocut | 1900s onward | Relief | 4 |
| 5 | Mezzotint | 1642 onward | Intaglio | 3 |
| 6 | Aquatint | 1760s onward | Intaglio | 4 |
| 7 | Stipple engraving | 1750s onward | Intaglio | 5 |
| 8 | Etching and drypoint | 1500s onward | Intaglio | 4 |
| 9 | Lithographic crayon | 1796 onward | Planographic | 3 |
| 10 | Cyanotype | 1842 onward | Photographic | 4 |
| 11 | Blueprint and diazo | 1870s to 1990s | Reprographic | 4 |
| 12 | Newspaper halftone (AM dots) | 1880s onward | Photomechanical | 4 |
| 13 | Line screen and grain (mezzotint) screens | 1880s onward | Photomechanical | 5 |
| 14 | Risograph, one drum | 1980s onward | Stencil duplicating | 5 |
| 15 | Letraset and Zipatone screens | 1930s to 1990s | Paste-up | 4 |
| 16 | Photocopy (xerox) zine | 1960s onward | Reprographic | 2 |
| 17 | Ben-Day dots | 1879 onward | Photomechanical | 3 |
| 18 | Guilloché | 1500s onward, banknotes from 1800s | Engine turning | 5 |
| 19 | Op-art moiré | 1930s, peak 1960s | Optical | 4 |
| 20 | Concrete and typewriter art | 1890s, peak 1960s | Typographic | 4 |
| 21 | ASCII and ANSI | 1960s onward | Text mode | 3 |
| 22 | Teletext | 1974 onward | Broadcast | 2 |
| 23 | 1-bit dithering (Atkinson, Bayer) | 1973 and 1984 onward | Digital | 4 |
| 24 | Early plotter art (Nake, Nees, Molnár) | 1963 onward | Computer | 5 |
| 25 | Contour-line cartography | 1700s onward | Cartographic | 5 |
| 26 | Swiss technical line drawing | 1920s to 1960s | Drafting | 5 |
| 27 | Isotype pictograms | 1925 to 1934 onward | Information graphics | 4 |
| 28 | Silhouette and paper cut (scherenschnitte) | 1700s onward | Cut paper | 4 |
| 29 | Stencil and pochoir | 1900s onward | Stencil | 3 |
| 30 | Shibori and indigo resist | 700s onward | Dye resist | 3 |

---

## Shared toolkit

Most of the 30 styles use the same eight parts. Build these once on the canvas and every style becomes a small recipe.

1. **Seeded randomness.** Use one small seeded generator (mulberry32 or similar) so a poster re-renders identically. Nothing in an "authentic" print should come from `Math.random()`.
2. **Tone preparation.** Greyscale, then convert sRGB to linear light before any thresholding, then apply a contrast curve (S-curve, black and white points). Surma's write-up shows the cost of skipping this: gradients go bright too fast when dithered in sRGB ([surma.dev/things/ditherpunk](https://surma.dev/things/ditherpunk/)).
3. **Tone as a field.** Keep a `tone(x, y)` function (0 = ink, 1 = paper) that works for both a raster plate and for vector geometry. For a vector wheel, the "tone" can be a rendered lighting pass (a flat 2D "light from top left" cosine on each shape's local normal) drawn to an offscreen canvas and then used as the source image. That keeps vector motifs and plant plates on one code path.
4. **A direction field.** Many styles need a stroke direction (engraving, wood engraving, hatching). Two sources: the image's structure tensor (smoothed gradient, then rotate 90 degrees) for plates, and analytic fields for geometry (concentric around a wheel centre, tangent to a band).
5. **Blue noise.** For stippling, grain and dithering, a tileable blue-noise mask beats random noise. Christoph Peters publishes free CC0 tiles from 16 to 1024 pixels square ([momentsingraphics.de/BlueNoise.html](https://momentsingraphics.de/BlueNoise.html)). To make your own, use void-and-cluster ([demofox write-up](https://blog.demofox.org/2019/06/25/generating-blue-noise-textures-with-void-and-cluster/)). Poisson-disc sampling by Bridson's method is the point-set equivalent ([Bridson 2007, PDF](https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph07-poissondisk.pdf)).
6. **Ink model.** Ink is not black pixels. Draw marks, blur by 0.4 to 0.8 px, threshold at 0.5. That rounds corners and gives the slight squash that every printed edge has. Then `multiply` the result onto a paper layer.
7. **Paper.** A tileable low-contrast fibre noise in Lana, at most 3 to 4% lightness variation. Intaglio also gets a plate mark (an embossed rectangle just outside the image). Resist the urge to add stains, creases and vignettes: they read as fake and they break the calm.
8. **Vector first.** Where a style is made of lines (engraving, plotter art, guilloché, contours), keep the lines as SVG paths with variable width as filled polygons. That lets the posters go to Figma as real vectors and lets a pen plotter draw them. [vpype](https://github.com/abey79/vpype) and [vsketch](https://github.com/abey79/vsketch) are the open-source plotter toolchain; [perfect-freehand](https://github.com/steveruizok/perfect-freehand) turns a path into a pressure-sensitive outline polygon; [canvas-sketch](https://github.com/mattdesl/canvas-sketch) is a good runner.

**Two code resources worth knowing before the entries:**

- [shaders.com Engraving](https://shaders.com/docs/components/engraving) describes a ready-made engraving shader with three modes: a single line plate, cross-hatched plates building up shadows, and one continuous spiral cut. Useful as a reference for what is already available off the shelf.
- [Deussen and Isenberg, "Halftoning and stippling" (2013, PDF)](https://tobias.isenberg.cc/personal/papers/Deussen_2013_HS.pdf) is the best single survey of the algorithms behind entries 1, 2, 7, 12, 13 and 23.

---

## Intaglio and relief print

### 1. Copperplate and steel line engraving

- **Origin.** Metal-plate line engraving grew out of goldsmiths' work in 15th-century Germany and Italy. It dominated book illustration from about 1600 until photography. Key hands: Dürer (on metal), Marcantonio Raimondi, the Wierix brothers, Hogarth, Blake, and the engravers of Diderot and d'Alembert's *Encyclopédie* (1751 to 1772), which is Rueca's closest source. Steel plates from the 1820s allowed far longer print runs and finer, colder lines (banknotes, maps, Turner's engraved views). [Line engraving (Wikipedia)](https://en.wikipedia.org/wiki/Line_engraving); [MIT Libraries, Engraving the plates of Diderot's Encyclopedia](https://libraries.mit.edu/exhibits/diderots-encyclopedia-exhibit-preview/engraving-the-plates/). The Encyclopédie plates were cut in reverse, and the 1767 instruction plates show how the burin was held and which hatch patterns modelled which form.
- **Visual signature.** One ink, black or sepia. Tone is built entirely from lines cut by a burin, which makes a V-shaped groove. Pushing harder or tilting makes the line wider. Density ladder: bare paper, single sparse lines, parallel lines getting closer, a second set crossing at an angle (cross-hatching, often as a diamond or "lozenge" net), then dots or flicks inside the lozenges, then lines so close they nearly merge. Lines taper at both ends and swell in the middle, and they bend to follow the form. Edges are crisp and slightly sharp. The plate is pressed into damp laid paper, so the paper bulges slightly around a plate mark.
- **What makes it authentic.**
  - Lines swell and taper; they are never constant width. A line of uniform width reads as a computer plot.
  - Hatching curves with the surface. Straight parallel hatching on a round form is the commonest tell.
  - Light areas use a thin line with wide spacing, not a faint grey line. Tone is only ever line width and spacing, never opacity.
  - Cross-hatching changes angle by 45 to 60 degrees, and the second layer is thinner than the first. Never a perfect 90 degrees.
  - Lines never run across a clean contour. They stop just short of an edge, leaving a thin white lip.
  - Clean engraving has no random wobble. Smoothness comes from the engraver's hand, not from jitter. If you must add imperfection, add curvature variation, not noise.
  - There is no ink on the paper between lines. Slight plate tone (a faint grey wipe) is an etching trait, not an engraving one.
- **Generate.**
  - *From a greyscale plate:* build a direction field, then trace streamlines at a spacing `s` (for example 6 px) using evenly-spaced streamline placement ([anvaka/streamlines](https://github.com/anvaka/streamlines) does this). For each streamline, set the half-width at each point to `w = k * (1 - tone)` and draw it as a variable-width polygon (offset left and right of the centreline by `w`). Taper the first and last 10% of each line. Add layers: layer 2 at a second angle only where `tone < 0.55`, layer 3 only where `tone < 0.3`, layer 4 (dots) where `tone < 0.15`. This is the "tonal layering" idea used in the ggsketch `engrave_fill` function and the tonal art maps of [Praun et al., Real-Time Hatching](https://gfx.cs.princeton.edu/proj/hatching).
  - *Flow-following lines:* the Carleton thesis builds copperplate-style parallel lines that change direction smoothly and never intersect, with tone from thickness, density and spacing ([thesis PDF](https://gigl.scs.carleton.ca/papers/thesis.pdf)).
  - *From vector geometry:* treat each shape's local normal against a fixed light direction as `tone`, then hatch along the shape's own contour. For a wheel: concentric arcs around the hub, widening toward the shadow side. For a band: lines parallel to the path, with width swelling where the band turns away from the light.
  - *Finish:* ink model (blur 0.5 px, threshold), multiply on Lana, plate mark.
  - *Related:* the digDurer system (Technion) builds engraving from level sets of a potential field derived from the image; search the title for the PDF.
- **Midjourney keywords.** `copperplate engraving, 18th century encyclopedia plate, burin line work, fine parallel hatching and cross-hatching, swelling lines, black ink on cream laid paper, plate mark, botanical engraving --style raw --no colour, shading, gradient, grey wash`. Add `Diderot Encyclopédie plate` for the technical-illustration voice.
- **Fit: 5.** This is already Rueca's house imagery, so it is the baseline against which the other 29 are measured. It is calm, historical, and made of lines.

### 2. Wood engraving (Bewick)

- **Origin.** Thomas Bewick (Newcastle, 1753 to 1828) perfected cutting on the end grain of boxwood with a burin, which gives detail previously only possible in metal. *A General History of Quadrupeds* (1790) and *A History of British Birds* (1797, 1804) are the landmarks. Wood engraving then became the main reproductive print method of the 19th century (the Victorian press). The 20th-century revival: Eric Gill, Gwen Raverat, Clare Leighton, Thomas Sturge Moore, Eric Ravilious, and Agnes Miller Parker. [Wood engraving (Wikipedia)](https://en.wikipedia.org/wiki/Wood_engraving); [Bewick Society: technical background](https://www.bewicksociety.org/technical-background). Blocks are small (typically 3 to 4 inches), so images are small and densely worked.
- **Visual signature.** It is a relief print, so ink sits on the raised surface and the cut lines print **white**. This is the "white-line" method. Tone is built with parallel lines (Bewick avoided heavy cross-hatching), and Bewick lowered background areas of the block so that they print grey, giving atmosphere. A solid black block with the image carved out of it in white lines; a rich, dark, close-packed look with small cross-sectional marks (dashes, ticks, stipples) for texture such as fur and feather.
- **What makes it authentic.**
  - The white lines swell and taper as they are pushed. A nominally "black" area is made from very fine white lines, so it is never flat black. Even the darkest areas contain tiny lines of paper.
  - Texture is characterised by small specific marks: a short dash for each feather barb, a curved nick for each ripple. Cut marks are directional and each ends in a point.
  - The edge of the block often shows: a thin ragged black border, sometimes with a rubbed-out corner. A black vignette ground ("the oval of ground below the bird") is a Bewick signature.
  - Resolution matters: the finest lines are very fine on a small block (I have no verified figure for the pitch). Rendered at poster scale, the lines must be scaled up in number, not in thickness, or the style turns into woodcut.
- **Generate.**
  - This is entry 13 (line screen) turned inside out: start with a solid ink block and cut white lines out of it. For a grey `tone`, the white cut's half-width is `w = pitch/2 * tone` (white where light). Draw the black as a rectangle and the white lines as variable-width polygons using `destination-out` or by drawing white-on-black then mapping black to ink.
  - Direction follows form, as in entry 1, but with **one layer** only; use a second layer only for deep shadow.
  - Add a bank of "texture stamps": short tapered white dashes placed on a sparse jittered grid in mid-tone areas, oriented along the direction field. This is what makes it look like wood engraving rather than reversed line screen.
  - Break each line occasionally: when the cut line width falls below 0.4 px, end it with a point.
  - Add the block edge: a rough black border, with 5 to 10% of its edge pixels noise-eroded.
  - *Vector geometry:* a wheel becomes a black disc with white spokes and rim lines cut in; shading is the width of the white lines, widest in light areas.
- **Midjourney keywords.** `wood engraving, Thomas Bewick, white-line engraving, boxwood end grain, black ink on cream paper, small vignette, fine cut lines, Victorian book illustration, Eric Ravilious --style raw --no colour, grey, gradient`. Add `tailpiece` for the vignette form.
- **Fit: 5.** It is the same historical register as the plates, simpler to read at small sizes, and the "white lines on black" gives a bolder poster mode than copperplate. It should be a staple.

### 3. Woodcut

- **Origin.** Relief printing from side-grain wood: Chinese Buddhist prints (before the 9th century), European playing cards and devotional prints (1400s), Dürer's *Apocalypse* (1498), Japanese ukiyo-e (multi-block), then German Expressionism (Kirchner, Nolde, Munch, Käthe Kollwitz). [Woodcut (Wikipedia)](https://en.wikipedia.org/wiki/Woodcut).
- **Visual signature.** Bold black shapes, thick outlines, large solid areas. Tone is built from knife-cut lines and gouged-out hatching, rarely smooth. The wood grain prints through in large solid areas (pale streaks along the grain). Edges are slightly irregular. Dürer's woodcuts are an exception, with engraving-like fine lines.
- **What makes it authentic.**
  - Wood grain shows in the solids: ink skips along the grain direction, forming long pale streaks and knot swirls.
  - Cut marks are tapered, angular and hand-wobbly, with a visible direction of the knife. Corners are sharp but not mechanical.
  - Outlines vary in thickness (a knife cuts each side of a line separately), so a line is two cuts that never quite parallel each other.
  - Excess: people add "woodcut" as a rough texture on a smooth vector, but in a real print the roughness lives in the cutting and the printing, not as uniform noise across the page.
- **Generate.**
  - Threshold the plate hard at one level (or two, with a mid-tone hatching layer), then **displace the edges**: warp the contour with low-frequency noise at 1 to 2% of the feature size and a small high-frequency jag. In practice: blur the thresholded image, add two octaves of noise, threshold again. This is the same "blur, perturb, threshold" ink model.
  - Wood grain: anisotropic noise stretched 20:1 along one axis, then used to modulate ink coverage in large black areas (drop 5 to 12% coverage where grain is "high").
  - Gouge hatching: short tapering strokes in mid-tone areas, oriented along the direction field; each is a lens shape with a sharp end.
  - *Vector:* convert the shape's outline to a polyline, perturb each vertex with correlated noise, smooth with Chaikin.
- **Midjourney keywords.** `woodcut print, black ink, bold gouge marks, visible wood grain, German Expressionist woodcut, Kirchner, relief print on cream paper, hand-cut --style raw --no gradient, colour`.
- **Fit: 3.** The character is raw and forceful, which fights the calm brief. It is useful as the loud counterpoint inside a series (a big black poster among finer ones).

### 4. Linocut

- **Origin.** Linoleum was patented in 1860s Britain; artists adopted it as a block material in the early 1900s (Die Brücke and Bauhaus experiments, then Matisse and Picasso). Picasso's late reduction linocuts (1959 to 1963, with printer Hidalgo Arnéra) cut and reprint a single block through several colours from light to dark. Gerd Arntz used the linocut as the production medium for Isotype (entry 27). [Linocut (Wikipedia)](https://en.wikipedia.org/wiki/Linocut); [Frederick Mulder on Picasso's linocuts](https://frederickmulder.viewingrooms.com/viewing-room/5-picasso-s-journey-in-linocut/). Sources disagree on who invented reduction printing; credit varies between Picasso and his printer.
- **Visual signature.** Smooth, flat blacks with no grain; confident curves; cuts made with V-shaped and U-shaped gouges leave tapering, rounded-ended marks. Solid areas often show tiny pinholes or an orange-peel texture where ink did not fully transfer. Lines are thicker and softer than in wood engraving. Edges have a gentle roundness.
- **What makes it authentic.**
  - Large black areas show small speckle holes (the lino surface is slightly textured), and uneven ink density.
  - Gouge marks are U or V in section and end in rounded, tapered points; "chatter" is the small ridges left where the gouge skips, left deliberately as texture in clearing out the background.
  - Registration marks, a slightly squashed halo of ink around the edge (ink squash from the press), and a thin uninked margin.
  - There is no hatching finer than the gouge allows. If your marks are thinner than about 1% of the poster height, it stops looking like linocut.
- **Generate.**
  - Same pipeline as the woodcut, without grain. Threshold, blur 1 to 2 px, threshold again to round corners (this gives the "carved" corner radius).
  - Pinholes: 0.3 to 0.8 px white specks, density about 0.5% of solid ink area, placed using blue noise so they do not clump, and more of them near the edges.
  - Clearing: fill background (non-image) areas with parallel, slightly curved gouge strokes, drawn as tapered lenses 6 to 14 px wide, a feature of Matisse-like "carved-out" ground. Break them every 80 to 200 px with chatter marks.
  - *Vector:* a wheel is a thick-outlined disc with a few white spokes; render outlines with round joins and the ink model. For the band, use a thick black stroke with a white centre line in segments.
- **Midjourney keywords.** `linocut print, bold black ink, smooth flat shapes, gouge marks, Matisse, Picasso reduction linocut, cream paper, hand-carved, slight ink speckle --style raw --no gradient, colour, texture overlay`.
- **Fit: 4.** Friendly, workshop, hand-made. Close to the dye-and-spindle workshop idea in `research/28-brand-soul-audit.md`. Slightly less refined than engraving, which suits big poster shapes.

### 5. Mezzotint

- **Origin.** Invented by Ludwig von Siegen (earliest dated example 1642, a portrait of Countess Amalie Elisabeth of Hanau-Münzenberg), with the rocker often credited to Prince Rupert of the Rhine; sources disagree on who made which innovation. It became the English portrait and reproduction method in the 1700s (Valentine Green, James McArdell, John Raphael Smith) and was used for Turner's *Liber Studiorum*. [Mezzotint (Wikipedia)](https://en.wikipedia.org/wiki/Mezzotint); [Met Museum essay](https://www.metmuseum.org/essays/the-printed-image-in-the-west-mezzotint).
- **Visual signature.** A "dark manner": the plate is first roughened all over with a rocker (a serrated, curved blade rocked back and forth in many directions), so it would print a velvety solid black. The artist then scrapes and burnishes areas smooth to make lights. The tone is a soft, continuous, velvety gradation from deep black to white, with an extremely fine grain visible only close up. There are almost no lines. Subjects emerge from the dark.
- **What makes it authentic.**
  - Blacks are deep and velvety, not flat. The deepest black has a slight sheen of texture.
  - Highlights are burnished: smooth, hard-edged where the scraper stopped, and clean paper white.
  - The grain is multi-directional (a plate is rocked in many directions so no pattern is visible). A single-direction or regular grain is wrong.
  - Subjects with soft edges and rich shadows: portraits, night scenes, reflections, and clouds. Thin linear detail is rare (it is added later by etching or engraving).
  - Mezzotints have always been used for reproduction of paintings; the look is "tonal painting" more than "drawing".
- **Generate.**
  - Per pixel: `ink = smoothstep(t - w, t + w, g)` where `g` is a **fine-grain field** and `t` is the tone from the plate; `w` is a small softness (0.04 to 0.1). `g` is made by summing 6 to 12 directional noise fields (line-grain noise rotated to different angles) and normalising, which is the digital equivalent of rocking in many directions. Alternatively use blue noise with a small blur.
  - Burnish: a second mask where `tone > 0.85` forces paper white with a crisp edge, mimicking scraped highlights.
  - Black: clamp `tone` to a floor of 0.04 so the deepest shadow still has a few specks of paper showing.
  - *Vector geometry:* render shapes as flat greys to an offscreen canvas, then apply the grain pipeline. The result is a smooth-looking tone made of grain, which stays inside the "no gradients" rule only if the grain is visible. Keep grain pitch at 2 to 3 px at poster scale.
- **Midjourney keywords.** `mezzotint, rich velvety blacks, burnished highlights, 18th century mezzotint portrait, soft tonal gradations emerging from darkness, black ink on cream paper, Valentine Green, rocker grain --style raw --no colour, line art`.
- **Fit: 3.** Beautiful, but it is a smooth-tone medium, so it flirts with gradients. It also does not carry geometry well, because its edges are soft. Use it for a single, dark, atmospheric poster of a plant plate; avoid it for the wheel.

### 6. Aquatint

- **Origin.** The aquatint is an intaglio tone method: fine resin dust is melted onto a copper plate, and acid bites the plate only in the gaps between grains, so the plate prints as a tone. Jean-Baptiste Le Prince demonstrated it in 1768, the French Académie bought his secret in 1782, and sources disagree about earlier attempts (Jan van de Velde IV around 1650, and Saint-Non). Goya is its greatest master (*Los Caprichos*, 1799; *Disasters of War*). [Aquatint (Wikipedia)](https://en.wikipedia.org/wiki/Aquatint); [Elizabeth Harvey-Lee on aquatint](https://elizabethharvey-lee.com/techniques/intaglio/aquatint.htm). Also Paul Sandby and the English topographic aquatints that imitate watercolour washes.
- **Visual signature.** Flat, granular areas of tone, one distinct tone per bite of acid, with hard edges where the artist painted a stop-out varnish. It looks like a wash drawing made of fine grain. Typically 3 to 5 clear tonal steps (light grey, mid, dark, near-black). Frequently combined with etched line.
- **What makes it authentic.**
  - Tones are **stepped**, not smooth. Each step is a flat grain texture with a clear edge. Any gradation comes from several overlapping bites, not smoothness.
  - Grain is irregular: a stipple of white pin-holes in the tone, a tiny coarse "tooth". Coarser resin gives coarser grain, which is deliberate (Goya's sky).
  - The edges of tonal areas have a crisp "stop-out" line and slight irregular nibbling along the margin where acid undercut the varnish.
  - Tone areas are broad and graphic. It is a medium for shapes, not detail.
- **Generate.**
  - Quantise the tone into 3 to 5 levels. For each level `k`, draw a coverage texture: `grain(x,y) < coverage_k`, where `grain` is blue noise with a slight clumping (blue noise with a 1 to 2 px blur, then threshold) and coverage rises from 25% to 90%. Layer the textures with `multiply`. Combine with a crisp vector edge for each level (the contour of the level set, smoothed slightly).
  - Add a few "foul bite" flecks: isolated specks of the next-darker level in a lighter area, at about 0.1% density.
  - *Vector geometry:* ideal. Fill each shape with its own tone step and the grain. Flat shapes with grain are a very good match for the logo's geometry.
- **Midjourney keywords.** `aquatint print, Goya aquatint, granular tonal washes, resin grain, flat tonal areas with hard edges, etching and aquatint, black ink on cream paper --style raw --no gradient, smooth shading`.
- **Fit: 4.** A flat-tone, grainy medium that suits Rueca's flat-colour language and geometric shapes, and it avoids the gradient problem because each tone is a flat step. Use Mora or Nogal.

### 7. Stipple engraving

- **Origin.** Dots-instead-of-lines engraving, developed from the 1700s "crayon manner" (imitating chalk drawings with a roulette wheel and needle). Francesco Bartolozzi (in England 1764 to 1802) became its leading practitioner and often printed in red (sanguine), orange or brown instead of black. William Wynne Ryland and Thomas Ryland are also associated with it. Its modern descendant is the Wall Street Journal hedcut portrait (Kevin Sprouls, 1979 on). [Francesco Bartolozzi (Wikipedia)](https://en.wikipedia.org/wiki/Francesco_Bartolozzi); [Stipple engraving (Wikipedia)](https://en.wikipedia.org/wiki/Stipple_engraving); [Crayon manner (Wikipedia)](https://en.wikipedia.org/wiki/Crayon_manner). The hedcut date is from my own knowledge, unverified here.
- **Visual signature.** Tone from dots alone, with dot **density** carrying tone and dot **size** nearly constant (or varying slightly). Often with fine line contours for edges. Soft, powdery, delicate. Slightly irregular, elongated "flick" dots following the form.
- **What makes it authentic.**
  - Dots are not perfect circles: some are slightly oval or comma-shaped, and a few are flicks along the surface direction.
  - Spacing is even: there is a minimum distance between dots (no clumps, no regular grid). Blue-noise spacing is the quality that people recognise as hand-stippled.
  - Edges are drawn with a very fine line or a ring of small dots, not by changing dot density only.
  - In the darkest areas dots merge into small clusters or short dashes; the lightest areas have just a few isolated dots.
- **Generate.**
  - **Weighted Voronoi stippling** (Secord, NPAR 2002): start with points sampled in proportion to darkness, compute the Voronoi diagram, move each point to the tone-weighted centroid of its cell, repeat 20 to 60 times. [Secord paper (PDF)](https://www.cs.ubc.ca/labs/imager/tr/2002/secord2002b/secord.2002b.pdf); canvas implementation with `d3-delaunay` in [Mike Bostock's Observable notebook](https://observablehq.com/@mbostock/voronoi-stippling) and the [Coding Train challenge](https://thecodingtrain.com/challenges/181-image-stippling). Library: [d3-delaunay](https://github.com/d3/d3-delaunay). Draw each point as a small ellipse with 8 to 15% radius variation and a random rotation weighted toward the direction field.
  - A cheaper alternative: variable-radius Poisson-disc sampling where the minimum radius is a function of tone ([Bridson](https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph07-poissondisk.pdf)).
  - Add contour lines by extracting an edge map (Sobel, then threshold) and drawing it as a very thin line, partly broken.
  - *Vector geometry:* lay stipples inside each shape using the shape's lighting as tone. The wheel becomes a disc of dots, denser at the rim shadow.
- **Midjourney keywords.** `stipple engraving, Bartolozzi, crayon manner, sanguine red chalk manner, fine dots, hedcut, dotwork, 18th century stipple portrait, cream paper --style raw --no lines, gradient, halftone grid`.
- **Fit: 5.** Soft, quiet, made of one mark, and it works from both plates and shapes. The Bartolozzi red-ink tradition gives a historical reason to use Achiote as the single ink.

### 8. Etching and drypoint

- **Origin.** Etching (acid-bitten lines through a wax ground) dates from the early 1500s (Daniel Hopfer, then Dürer, Parmigianino). Rembrandt's etchings (1620s to 1650s) are the peak; later Piranesi, Goya, Whistler, Meryon. Drypoint, scratching the plate with a point, throws up a ridge of metal (burr) that holds ink. Rembrandt used it increasingly from about the 1640s. [Etching (Wikipedia)](https://en.wikipedia.org/wiki/Etching); [Drypoint (Wikipedia)](https://en.wikipedia.org/wiki/Drypoint).
- **Visual signature.** Free, sketchy, spontaneous line, uniform in width within a single bite, but with different line weights from different times in the acid bath (a stopped-out line is light, a longer bath gives a darker, wider line). Loose hatching at irregular angles, lightly crossed. Round-ended lines. Drypoint lines add a soft, furry, velvety edge from the burr.
- **What makes it authentic.**
  - Line width is **stepped** (two to four widths on one plate) not swelling. The swell of engraving is wrong here.
  - The hand wobbles gently: lines are slightly irregular in direction, with a fluid, relaxed hatching that does not follow the form precisely.
  - Burr lines have a soft blurry shadow on one side. They wear down with printing, so impressions vary.
  - Plate tone: a faint, uneven grey veil of ink left on the plate (the artist may leave deliberate wiping), and occasional foul-bite specks.
- **Generate.**
  - Take polylines (hatch lines at 15 to 30 degree jitter around the direction field), perturb them with low-amplitude correlated noise (amplitude about 1 to 2% of spacing, wavelength 30 to 80 px), and draw with `lineCap: 'round'`. Choose one of three stepped widths per stroke, and give darker areas more strokes of the heavier width.
  - Burr: for 10 to 20% of the strokes, add a copy offset 1 px with a 1.5 px blur at 40% opacity, which gives a soft, furry shadow without a gradient.
  - Plate tone: a very light flat tint in the page (Lana lowered 3%) with patchy wipe marks. Use sparingly.
  - *Vector geometry:* sketchy contour lines (double lines with a gap, wobbling) for the wheel and band.
  - [perfect-freehand](https://github.com/steveruizok/perfect-freehand) can supply the stroke outline.
- **Midjourney keywords.** `etching, Rembrandt etching, free sketchy lines, loose cross-hatching, drypoint burr, plate tone, black ink on warm paper, 17th century etching --style raw --no colour, gradient`.
- **Fit: 4.** Warm and human; a good contrast to the colder engraving. The wobble is the risk: it must be gentle or it looks like a cheap "sketch" filter.

---

## Planographic and photographic one-tone

### 9. Lithographic crayon

- **Origin.** Alois Senefelder invented lithography in Munich around 1796. Artists draw with a greasy crayon or tusche on a grained limestone slab (or later an aluminium plate); the stone is chemically treated so that ink sticks only to the grease. Goya (*Bulls of Bordeaux*, 1825), Daumier, Redon (*Noirs*), Toulouse-Lautrec, Käthe Kollwitz. [Lithography (Wikipedia)](https://en.wikipedia.org/wiki/Lithography); [National Galleries Scotland glossary](https://www.nationalgalleries.org/art-and-artists/glossary-terms/lithography). Stones are grained with sand; a soft crayon drawn on a grained stone picks up the grain.
- **Visual signature.** Soft, granular, velvety black tone from the drag of a crayon on a toothy stone. Edges are soft and broken. Looks like charcoal but blacker and richer. Can include washes (tusche) and scraped highlights.
- **What makes it authentic.**
  - Tone **is** the grain of the stone: it is the grain pattern, thresholded, not a blur. Pressure changes how many grain peaks catch crayon.
  - Strokes show their direction (the hand's path), with broken edges where the crayon skipped.
  - Blacks are rich but a bit grainy; white paper is clean (no plate tone, unlike etching).
  - Smooth gradation without grain is the classic fake.
- **Generate.**
  - Draw strokes as many thin semi-random particles along the path (or take the plate and apply a pressure map `p = 1 - tone`). Final ink = `p > grain(x, y)` where `grain` is a mid-frequency noise (stone tooth, 1 to 2 px feature size) mixed with 30% blue noise.
  - Add directional smear: stretch the grain 3:1 along the stroke direction.
  - Edge: blur 0.5 px, threshold, then re-add a speck pass near edges.
  - *Vector geometry:* fill with pressure ramps and the grain mask.
- **Midjourney keywords.** `stone lithograph, lithographic crayon, soft grainy black tone, Odilon Redon noir, Goya Bordeaux lithograph, charcoal-like, rich black on cream paper --style raw --no colour, smooth gradient, digital`.
- **Fit: 3.** Soft and moody. It carries tone well but struggles with the brand's crispness, and it lands near the "gradient" boundary. Consider it only for plant plates.

### 10. Cyanotype

- **Origin.** Sir John Herschel invented the cyanotype in 1842. Anna Atkins used it from October 1843 to make *Photographs of British Algae: Cyanotype Impressions*, usually called the first book illustrated with photographs. She laid algae directly on sensitised paper and exposed it to sunlight. [Anna Atkins (Wikipedia)](https://en.wikipedia.org/wiki/Anna_Atkins); [Public Domain Review: Cyanotypes of British Algae](https://publicdomainreview.org/collection/cyanotypes-of-british-algae-by-anna-atkins-1843/); [Cyanotype (Wikipedia)](https://en.wikipedia.org/wiki/Cyanotype). Sources differ on whether the book or Talbot's *Pencil of Nature* (1844) came first; the common claim favours Atkins. The deep colour is Prussian blue ([Wikipedia](https://en.wikipedia.org/wiki/Prussian_blue)).
- **Visual signature.** Deep blue ground, with the subject in paper white (where the object blocked the light). Shapes are crisp where the object touched the paper and soft where it lifted. It is a photogram: specimens as silhouettes with fine internal translucency.
- **What makes it authentic.**
  - It is a **negative-looking** print: white plant on blue ground. Positive "blue plant on white" is not the classic cyanotype look.
  - The coated area has visible brush strokes at its edge and an uneven, slightly streaky coating, with a ragged border where the liquid pooled.
  - Contact softness: edges near the paper are sharp, edges lifted off the paper have a soft halo. Translucent parts (algae fronds, thin leaves) go pale blue, not white.
  - Real cyanotype blue is dark and a little green-grey (Prussian blue is usually given as about `#003153`); Cielo `#5070F0` is brighter and more violet. This is a design choice, flag it.
- **Generate.**
  - Take the plant plate, threshold it into a silhouette with a few levels of translucency (3 levels: opaque white, pale, deep). Convert to "exposure": ink = `1 - exposed`. Apply 0.8 to 1.5 px blur for the contact halo, then re-threshold at 2 to 3 levels so edges stay crisp enough to be line-like.
  - Coating shape: rectangle with edges displaced by 1D noise (amplitude 4 to 10 px), brush streaks (long thin bands of 3 to 6% density variation), and a few round "air bubble" blemishes.
  - Add paper fibre only inside the coated area.
  - *Vector geometry:* wheel and band as white shapes on blue, with their thin parts as pale-blue translucent.
- **Midjourney keywords.** `cyanotype, Anna Atkins, botanical photogram, Prussian blue, white plant silhouette on blue ground, sun print, brushed edge border, algae specimen, 1840s --style raw --no gradient, photo, 3d`.
- **Fit: 4.** A natural link between the plant plates and a single blue ink, with an open-science tone (Atkins made a catalogue of knowledge). Use Cielo. The "ground is the ink" inversion needs a decision: the poster is mostly Cielo, with Lana as the drawing.

### 11. Blueprint and diazo

- **Origin.** Herschel's cyanotype (1842) was commercialised for copying architects' and engineers' drawings from the 1870s (the French firm Marion & Co. branded it ferro-prussiate paper in 1872) and became ubiquitous by the 1890s. It gives **white lines on blue**. From the 1940s the diazo "whiteprint" (blue or violet lines on white, developed in ammonia vapour) replaced it, and both were then replaced by xerographic copying and CAD. [Blueprint (Wikipedia)](https://en.wikipedia.org/wiki/Blueprint); [Diazo (Wikipedia)](https://en.wikipedia.org/wiki/Diazo); [Scientific American: The Blueprint](https://www.scientificamerican.com/article/the-blueprint). Sources vary on the dates of mass adoption.
- **Visual signature.** Technical linework with a clear set of line types, title block, dimensions, notes in neat architect's lettering. Blueprint: white on deep blue; diazo: blue lines on white paper with a faint purple cast and slightly fuzzy edges.
- **What makes it authentic.**
  - The conventions: centre lines as long-short dashes, hidden lines as dashes, dimension lines with arrows and numbers, leaders, hatching for sections, a grid of reference letters on the border, a revision block, and a title block in the corner.
  - Line weights are set (for example 0.25, 0.35, 0.5, 0.7 mm). Weight tells you what a line is.
  - Hand lettering is uppercase, single-stroke, evenly spaced.
  - Fold lines, pin holes and fading are the tropes; they read as costume. Keep the drawing conventions and skip the decay.
- **Generate.**
  - Pure vector. Define line classes (outline, hidden, centre, dimension, construction), each with a width and dash array (centre line `[18, 3, 3, 3]`). Draw exact compass geometry (circles, tangent lines for the band between two wheels, centre marks).
  - Dimension lines: two extension lines, one dimension line with open arrowheads (15 to 20 degrees), text centred and rotated.
  - Blueprint variant: fill background with the ink, draw in paper colour. Diazo: draw in ink on paper, then blur 0.5 px at 85% opacity for the diazo softness.
  - Lettering: IBM Plex Sans in capitals with letter-spacing, or a single-stroke font.
- **Midjourney keywords.** `blueprint, technical drawing, white lines on cyanotype blue, orthographic projection, dimension lines, title block, architectural drawing, centre lines, ISO drafting --style raw --no 3d render, gradient, glow`.
- **Fit: 4.** Rueca is a tool and a spec, so this vocabulary is native. The risk is cliché (every developer tool has used blueprints). The Rueca version should rely on exact geometry (the wheel's real construction) not decorative grids.

### 12. Newspaper halftone (AM dots)

- **Origin.** Photomechanical printing of photographs: Frederic Ives patented a commercially successful halftone method in 1881; Georg Meisenbach's 1882 autotype process used crossed line screens; the first halftone in a daily paper was in the 1880s. Black is conventionally screened at 45 degrees because that angle is least visible; newsprint runs at about 65 to 85 lines per inch, with 10 to 25% dot gain. [Halftone (Wikipedia)](https://en.wikipedia.org/wiki/Halftone); [DuPont: AM screens](https://easybritecloud.dupont.com/manual/en/webhelp/DITA/RIP/Intro/AM%20screens.html); [Printplanet on screen angles](https://printplanet.com/threads/screen-angles-why-are-they-15-45-75-and-90.10650/post-114308). The dot gain range is a general reference, not newspaper-specific.
- **Visual signature.** A regular grid of round dots at 45 degrees, dot **size** carrying tone (amplitude modulation, hence "AM"). At 50% the dots touch and form a chessboard; beyond that, the paper becomes the dot (white holes in black). Visible from arm's length on newsprint, which is grey and slightly absorbent.
- **What makes it authentic.**
  - Grid angle at 45 degrees for black. A 0 degree grid looks like a computer screen.
  - Dot gain: dots print larger than their ideal size, so mid-tones are darker and shadows clog. Apply a tone curve before screening.
  - Dots are slightly irregular in shape, with edges that vary by ink absorption into the paper.
  - On newsprint the paper is grey-cream and a little see-through.
  - Dot pitch: at poster size, use a visibly coarse screen (30 to 60 lpi equivalent). People get this wrong by using a dot so fine that it looks like noise.
- **Generate.**
  - Rotate the coordinate system 45 degrees, divide into cells of pitch `p`. For each cell, sample the tone (average over the cell, or at the centre). Dot radius `r = p * sqrt(t_ink / pi)` for `t_ink < 0.5`, and for darker tones invert the logic (white dots on black) or use the standard spot function `(cos(pi x/p) + cos(pi y/p))/2` thresholded against tone, which handles the 50% merge correctly.
  - Dot gain: `t_ink' = t_ink + g * 4 * t_ink * (1 - t_ink)` with `g = 0.1 to 0.2`.
  - Ink model on the dots (blur 0.4 px, threshold).
  - *Vector geometry:* clip the dots to the shape, tone from the lighting pass.
  - Observable and Shadertoy implementations are plentiful; the maths is a two-line spot function.
- **Midjourney keywords.** `newspaper halftone, coarse black halftone dots at 45 degrees, newsprint, photomechanical reproduction, vintage press photograph, black ink on grey-cream newsprint, high-contrast dot screen --style raw --no colour, gradient`.
- **Fit: 4.** Instantly legible as "print". The commercial/news tone is editorial; the risk is that it reads as pop-art or retro. It works well for large dot treatments on a single motif.

### 13. Line screen and grain (mezzotint) screens

- **Origin.** In the 1880s two kinds of screen were tried in parallel: a **line screen** of parallel opaque lines (Meisenbach engraved lines in glass and darkened them with asphalt; two crossed line screens made the grid) and a **grain screen**, a random speckle screen. Line screens survive in engraving-style portrait effects on banknotes and in the "line halftone" filters of Photoshop and Illustrator; the Photoshop "Mezzotint" filter imitates grain screens (fine dots, grainy dots, strokes). [Deussen and Isenberg, Halftoning and stippling (PDF)](https://tobias.isenberg.cc/personal/papers/Deussen_2013_HS.pdf); [Briar Press: line screen question](https://briarpress.org/36202). The forum thread describes the demand for tone-driven parallel lines of variable width, as in wood engraving, and finds no off-the-shelf tool.
- **Visual signature.** *Line screen:* parallel lines at a constant pitch whose **width** swells with darkness; optionally wavy or concentric. At full tone the lines merge into solid; at highlights they become hairlines or break into dashes. Reads as a single dense field with a strong rhythm. *Grain screen:* random fine speckle, density carrying tone, slightly clumpy.
- **What makes it authentic.**
  - For line screen, the pitch is constant and the lines never touch until the darkest tones. Widths come from a clean function of tone, with no random width.
  - Lines may bend around shapes (the "banknote portrait" effect) via a wave offset driven by tone or by an SDF: the engraver's trick.
  - Grain screen: speckle is clumpy at the right scale (a Poisson-disc spacing looks like stipple, not grain).
  - Don't mix: a line screen with random dots added looks like a bad filter.
- **Generate.**
  - **Line screen, straight:** for each scanline `y_k = k * pitch` (rotated by angle `a`), walk along the line in steps of 1 to 2 px; at each step sample tone and draw a quad of half-width `w = (pitch/2) * (1 - tone)`; join the quads into one filled polygon per line. 300 lines is fine for a poster at 2400 px.
  - **Line screen, wavy:** add a sine offset `y' = y + A * sin(2 pi x / lambda + phase(tone))`, with `A` proportional to local tone.
  - **Concentric (for the wheel):** use a radial coordinate `r` around the hub as the line index.
  - **Grain:** compare tone to a blue-noise mask; threshold; 2 to 3 px cell.
  - See the freely available "digDurer" paper and "Freudenberg et al." real-time halftoning (engraving-style shading by thresholding in texture space) for the rigorous versions; search the titles.
- **Midjourney keywords.** `engraved line halftone, parallel line portrait, banknote portrait engraving, lines of varying thickness forming an image, line screen, wavy line shading, black ink on white --style raw --no dots, colour, gradient`. For grain: `mezzotint screen, fine random grain halftone, photomechanical grain`.
- **Fit: 5 (line screen).** Pure lines, exact, calm, easy to vector, and it carries both wheel geometry and plant plates. The most direct way to make "threads" out of an image. Grain screen scores 3.

### 14. Risograph, one drum

- **Origin.** Riso Kagaku (Japan) made the stencil-duplicating machines now called risographs; sources I found give no firm launch date, and I recall the 1980s (unverified). A thermal head burns a stencil master for one ink colour, which is wrapped round a drum, and ink is forced through the voids. One drum, one colour; adding a colour means a second pass. [Risograph (Wikipedia)](https://en.wikipedia.org/wiki/Risograph); [MCAD riso info (PDF)](https://intranet.mcad.edu/sites/default/files/knowledgeBase/riso-info-booklet-f23.pdf); [EverythingRiso (PDF)](https://sites.saic.edu/servicebureau/wp-content/uploads/sites/20/2025/03/EverythingRiso_2024.pdf). Popular with zines, small presses and many design studios since the 2010s.
- **Visual signature.** Soft, translucent, slightly grainy ink in a limited palette of bright colours. Solids are never perfectly flat: they show a speckle and subtle banding. Edges are soft and slightly rough. Images are rendered as coarse grain or screen dots. The ink is semi-transparent and soaks into uncoated paper, with a matte finish.
- **What makes it authentic.**
  - **Grain touch**: the machine's stochastic screen is a fine pepper-like grain, not ordered dots. Photos look like gritty stipple.
  - Solids have 3 to 8% density variation, tiny white pin-holes, and slight stripes along the drum axis.
  - Edge: slight ink spread, no hard vector edge.
  - One-drum prints have no registration problem, only multi-drum jobs do ("vibrating" overprint). For a one-tone brief, the misregistration trope doesn't apply; don't fake it.
  - Ink is translucent, so paper colour shows through, and an off-white paper changes the ink.
- **Generate.**
  - Photos/plates: compare tone against a blue-noise mask (grain touch) at 2 to 3 px; or use a coarse AM screen at a non-standard angle.
  - Solids: multiply ink coverage by `1 - 0.05 * lowfreq(x, y)` plus a vertical-stripe term (period about 40 px, amplitude 1 to 2%), and scatter 0.3% pin-holes.
  - Edges: blur 0.7 px and re-threshold at 0.5 with noise added to the threshold (+/- 0.08).
  - Ink colour is drawn with `multiply` at 90% opacity on Lana.
  - *Vector geometry:* export shapes as flat fills, then apply the solids treatment. Good for big colour fields.
- **Midjourney keywords.** `risograph print, one colour riso, grainy texture, speckled solid ink, stochastic grain halftone, soft ink edges, bright fluorescent ink on uncoated paper, zine, overprint --style raw --no gradient, glossy, 3d`.
- **Fit: 5.** Matches the brand mood (hand-made, open, indie, flat brights, one ink at a time) and is now the current voice of small studios. It also gives every Mora brand colour a natural home. Malva `#EFA6FF` on Lana is low contrast, so use it for large solids, not fine lines.

### 15. Letraset and Zipatone screens

- **Origin.** Pre-printed adhesive or dry-transfer sheets of tone patterns (dots, lines, cross-hatch, stipple, gradated screens), cut and burnished onto artwork. Zip-A-Tone dates to the 1930s (registration lists 1937 as first use); Chartpak followed (1949); Letraset launched dry-transfer lettering in 1961 and Letratone in 1966; they were essential in comics, manga (as screentone), maps, technical illustration and zines until desktop publishing. [Screentone (Wikipedia)](https://en.wikipedia.org/wiki/Screentone); [Zipatone (Wikipedia)](https://en.wikipedia.org/wiki/Zip-A-Tone); [Dry transfer (Wikipedia)](https://en.wikipedia.org/wiki/Dry_transfer); [Letraset (Wikipedia)](https://en.wikipedia.org/wiki/Letraset). Wikipedia flags the screentone article as relying on few sources.
- **Visual signature.** Flat areas of a **single repeating pattern**: regular dots, lines or cross-hatch at a fixed density. Tone changes only in jumps between sheets (10%, 20%, 30% and so on). Often with a graphic outline drawn first, then the tone laid inside it.
- **What makes it authentic.**
  - Patterns are mechanical and perfectly regular within a patch; a slight rotation and a visible cut edge give the paste-up feel.
  - Patches end in a hard knife-cut edge, often following the outline, with small overlaps or gaps where two sheets met.
  - Burnishing misses leave faint holes (pattern didn't transfer) near the edge or in a rubbed streak.
  - When two patches of the same pattern overlap at an angle you get moiré, which manga artists rotated to avoid.
- **Generate.**
  - Quantise tone into 4 to 6 bands. Each band has a pattern tile: dots at 10, 20, 30, 50%; lines at 20%, 40%; cross-hatch. Fill with `ctx.createPattern` on a rotated tile and clip to the band's mask.
  - Cut edges: draw the mask boundary as a straight-segment polygon (simplified with Douglas-Peucker), not a smooth curve.
  - Dropouts: remove 2 to 4 patches of a few pixels at random inside a patch.
  - *Vector geometry:* the wheel, whorl and band each get a different pattern. Strong graphic structure from tone-as-pattern.
- **Midjourney keywords.** `screentone, Letraset tone sheet, Zipatone, dot pattern shading, comic paste-up, manga screentone, black ink on white, flat tonal patterns, mechanical halftone sheet --style raw --no gradient, colour, shadow`.
- **Fit: 4.** Flat, geometric, regular, and the pattern-per-region idea is a good way to show layers (wheel, whorl, band) in one tone. It can look 1970s if the dot sizes are large.

### 16. Photocopy (xerox) zine

- **Origin.** Xerox's 914 copier (1959) made office copying cheap. Artists from the 1960s used it for "Xerox art"; punk zines, flyers and the DIY press made the high-contrast, gritty copy a visual language in the 1970s and 80s. [Photocopier (Wikipedia)](https://en.wikipedia.org/wiki/Photocopier); [Aperture: How a Xerox became a time machine](https://aperture.org/editorial/how-a-xerox-became-a-time-machine/); [Daze: Hard Copy zine exhibition](https://www.dazeddigital.com/art-photography/article/70722/1/hard-copy-zine-exhibition-photography-xerox-exhibition-collier-schorr).
- **Visual signature.** Hard thresholded black on white with grain, streaks, stray specks and toner fill-in, grey mid-tones turned to coarse noise; images degrade with each copy (generation loss); cut-and-paste edges, tape and shadow lines of pasted paper.
- **What makes it authentic.**
  - Copy darkening: contrast increases and fine detail is lost with each generation; grey becomes noise.
  - Characteristic faults: a dark edge band at the page border, streaks along the paper direction, random toner specks, and slight skew of the original.
  - Pasted-up elements leave thin black lines at their edges where the paper's edge was copied.
  - Don't fake with a uniform noise overlay: faults are local and sparse.
- **Generate.**
  - Threshold with noise-modulated threshold (`tone + 0.12 * (noise - 0.5) > 0.5`), then blur 0.8 px and threshold again; repeat 1 to 3 times for generation loss.
  - Add streaks: 1D noise along the drum axis with 1 to 3 strong lines per page.
  - Specks: scatter 100 to 300 dark specks per poster, size 1 to 3 px, from a heavy-tailed distribution.
  - Border band: a 6 to 20 px dark irregular strip at one edge.
- **Midjourney keywords.** `photocopy, xerox, punk zine, high contrast black and white, toner grain, copy machine artefacts, cut and paste collage, generation loss, 1980s flyer --style raw --no colour, clean, gradient`.
- **Fit: 2.** Grit and anarchy, not calm and editorial. A quiet version (one generation, no streaks) can serve as a "draft print" texture on spec sheets, but it is the weakest fit in the list.

### 17. Ben-Day dots

- **Origin.** Benjamin Henry Day Jr. patented the process in 1879 ([Ben Day process (Wikipedia)](https://en.wikipedia.org/wiki/Ben_Day_process)). Artists applied dot patterns from transparent films (a mechanical stippling), producing even-sized dots across a region. Four-colour comics of the 1950s and 60s used them; Roy Lichtenstein enlarged and imitated them (some sources argue he used stencils and did not paint literal Ben-Day dots). [What are Ben-Day dots? (Public Delivery)](https://publicdelivery.org/what-is/ben-day-dots); [Legion of Andy, Ben Day dots](https://legionofandy.com/page/25). The term is often confused with halftone dots.
- **Visual signature.** Dots of **equal size** in a region on a regular grid; tone is set by which dot-film was used, not by an image's detail. Reads as flat patches of dotted tone with crisp boundaries, usually only 3 to 5 different densities in a picture.
- **What makes it authentic.**
  - Within a region the dots are identical and the grid is regular, unlike a halftone where the dot size follows an image.
  - Boundaries are drawn lines, and dots stop at them, often cut in half.
  - Overprinted tones show a rosette or moiré.
  - Lichtenstein's dots are large and clearly mechanical, aligned at 45 degrees or 0.
- **Generate.**
  - Same as the tone-band pattern fill in entry 15, but with a fixed dot radius per band (for example 12, 22, 32, 42% area) on a 45 degree hexagonal or square grid.
  - Clip to region masks. Do not scale dot size by the image.
  - Optional slight misregistration only if two inks are in play, which does not apply in one-tone mode.
- **Midjourney keywords.** `Ben-Day dots, Lichtenstein style, large regular dot pattern, comic book printing, flat dotted tone, 1960s pop art, black dots on white --style raw --no gradient, photo, 3d`.
- **Fit: 3.** Strongly pop-art, which is loud and cheerful but off-brand. Entry 15 does the same job with a quieter voice.

---

## Geometry, optics and computing

### 18. Guilloché

- **Origin.** Engine-turned patterns cut by a rose-engine or straight-line engine, used on watch cases and snuffboxes (Breguet, Fabergé enamel grounds) and, from the 1800s, on banknotes, bonds and stamps as security patterns; the interlacing of fine curves is hard to forge. [Guilloché (Wikipedia)](https://en.wikipedia.org/wiki/Guilloch%C3%A9); [Rose engine lathe (Wikipedia)](https://en.wikipedia.org/wiki/Rose_engine_lathe); [Patek Philippe on guillochage](https://www.patek.com/en/manufacture/artisans-of-time/guillochage). A rosette (a cam) on the spindle moves the work against a follower while the spindle turns; the curves resemble Spirograph curves. Wikipedia describes banknote guilloché as hypotrochoids ([Hypotrochoid](https://en.wikipedia.org/wiki/Hypotrochoid)).
- **Visual signature.** Dense families of hairline curves that interlace into rosettes, ribbons and waves, in one ink. Optical moiré and shimmering emerge from line spacing. Hairline weight (0.05 to 0.15 mm in security print). Typically printed in one spot colour, often with a rainbow roll (a gradient, which Rueca skips).
- **What makes it authentic.**
  - Lines are uniform hairlines that never cross at a blunt angle: they interweave in families, each offset slightly from the last by a constant phase or radius.
  - The geometry is exact; no wobble.
  - Line count is high (dozens in a rosette), and the density gives the shimmer. A rosette of 8 lines is just a Spirograph.
  - Banknotes combine several systems: a rosette in the centre, wave borders, and fine ruled "lathe work" with slowly changing line spacing for tone.
  - Do not use gradients or glow; keep the optical effect all in the line geometry.
- **Generate.**
  - **Rosette (hypotrochoid):** `x(t) = (R - r) cos t + d cos(((R - r)/r) t)`, `y(t) = (R - r) sin t - d sin(((R - r)/r) t)`. Draw `N = 40 to 120` copies, each with `d` or a phase stepped by a small constant. Use `t` over `0..2 pi * r/gcd(R, r)`.
  - **Polar rose family:** `rho(theta) = rho0 + a sin(k theta + phi_i)`, with `phi_i` stepping per line.
  - **Wave bands:** `y_i(x) = y0_i + A sin(f1 x + phi_i) + B sin(f2 x)`, `N` copies with spacing `s`, giving ribbon crossings. Modulate `A` with an envelope to pinch the ribbon.
  - **Tone via spacing:** for a portrait, vary line spacing with image tone (the engraver's "lathe work").
  - Render at 2x with 0.4 to 0.8 px strokes; use `stroke` paths, not fills. Export as SVG.
  - *Geometry link:* the wheel, whorl and band are already circles, so a rosette with `R/r` set to the real wheel-to-whorl ratio ties the pattern to the logo's mechanics.
- **Midjourney keywords.** `guilloche pattern, banknote security print, engine turned rosette, fine hairline interlaced curves, rose engine lathe, monochrome, security printing, intaglio banknote --style raw --no rainbow gradient, glow, 3d`.
- **Fit: 5.** It is the most direct visual product of a "spinning wheel and spindle", it is exact and calm, and it is made of lines. Mora plum on Lana gives a distinct, official, bank-note register.

### 19. Op-art moiré (Riley, Vasarely)

- **Origin.** Victor Vasarely's black-and-white work from the 1930s and 1950s ("Zebra", "Vega") launched the movement; Bridget Riley's black-and-white paintings of 1961 to 1966 ("Movement in Squares", "Current") and the 1965 MoMA exhibition *The Responsive Eye* made it famous. [Tate: Op art](https://tate.org.uk/art/art-terms/op-art); [Britannica: Bridget Riley](https://www.britannica.com/biography/Bridget-Riley). Sources on moiré specifically are thin; moiré is a pattern from overlaying two regular gratings.
- **Visual signature.** Black-and-white geometric patterns (waves, lines, checks, circles) that make the eye perceive movement, vibration or depth. Modulated spacing creates bulges and ripples; overlapping gratings create beats.
- **What makes it authentic.**
  - Precision. The whole effect is exact spacing; sloppy edges kill the vibration.
  - Slow, gradual changes in frequency or phase create the swelling forms (Riley's waves).
  - The effect works at a specific viewing scale, and a pattern designed on screen can alias into false moiré at a different zoom.
- **Generate.**
  - **Two-grating moiré:** draw grating A (lines at pitch `p`), draw grating B (same pitch rotated by a small angle `delta`, or with pitch `p * (1 + e)`). Beat spacing ~ `p / (2 sin(delta/2))`.
  - **Concentric gratings:** two sets of circles with centres a short distance apart (wheel and whorl centres): the overlap gives hyperbolic moiré fringes.
  - **Riley-style wave:** `y_i(x) = i * s + A(x) sin(2 pi x / lambda(x) )` with smoothly varying `lambda(x)`; draw as filled polygons between alternate lines.
  - Avoid unintended aliasing: render as vector, or supersample 3x, and keep stroke pitch above 3 px.
  - Reduced-motion: animated moiré can be uncomfortable; offer a static default.
- **Midjourney keywords.** `op art, Bridget Riley, Victor Vasarely, black and white wave pattern, optical illusion, moiré, vibrating lines, geometric abstraction, 1960s, precise --style raw --no colour, gradient, 3d`.
- **Fit: 4.** Exact and geometric, and the concentric-circle moiré is a lovely echo of two wheels joined by a band. It is intense; use once.

### 20. Concrete and typewriter art

- **Origin.** Typewriter pictures date from the 1890s (a butterfly typed in 1898 is often credited to Flora Stacey; I could not verify this). Concrete poetry (Eugen Gomringer, Ian Hamilton Finlay, Bob Cobbing) and Dom Sylvester Houédard's "typestracts", made on an Olivetti Lettera 22 between 1950 and 1970, make the typewriter a drawing machine. Carl Andre called his poems typewriter drawings. [Typewriter art (Wikipedia)](https://en.wikipedia.org/wiki/Typewriter_art); [Concrete poetry (Wikipedia)](https://en.wikipedia.org/wiki/Concrete_poetry); [V&A: Houédard typestract](https://api.vam.ac.uk/v2/object/O155139); [Sylvester Houédard (Wikipedia)](https://en.wikipedia.org/wiki/Sylvester_Hou%C3%A9dard); [Princeton: Public Typewriter](https://graphicarts.princeton.edu/2019/04/23/public-typewriter).
- **Visual signature.** A fixed-pitch character grid; tone from overstriking characters (more strikes = darker); patterns built from letters, punctuation and the underscore/slash; ribbon ink slightly uneven; characters sit on a baseline but not exactly.
- **What makes it authentic.**
  - Fixed pitch and fixed line feed: everything sits on the grid, with a fixed cell aspect (about 1:2).
  - Each strike differs in pressure: letters like "e" and "o" fill in and darken, "i" and "l" stay light.
  - Overstrikes are slightly misaligned (0.2 to 0.5 px) and the ribbon is uneven, which gives the soft grey of layered typing.
  - Characters can be rotated by turning the paper, which gives the 90 degree vertical lines.
- **Generate.**
  - Choose a monospace font (IBM Plex Mono is a close, in-family option). Measure each candidate glyph's ink coverage by drawing it to an offscreen canvas and counting dark pixels; sort the characters into a tone ramp. Move across the plate in cells (for example 8 by 16 px), pick a glyph by tone, and for dark cells overstrike two or three glyphs with small random offsets and opacity 0.7 to 0.9.
  - Per-strike jitter: +/- 0.3 px baseline, 0.85 to 1.0 alpha, slight rotation of +/- 1 degree.
  - For lines: use `-`, `_`, `|`, `/`, `\` chosen by edge orientation (Sobel).
  - *Vector geometry:* sample the wheel's outline into cells and type along it.
- **Midjourney keywords.** `typewriter art, typestract, concrete poetry, Olivetti typewriter drawing, overstruck letters forming a picture, monospaced ribbon ink on cream paper, 1960s --style raw --no gradient, colour, digital font`.
- **Fit: 4.** Quiet, bookish, literate, and it ties to IBM Plex Mono. The calm of the grid suits the brand. It is better for type-led posters than for illustration.

### 21. ASCII and ANSI art

- **Origin.** Kenneth Knowlton and Leon Harmon's *Studies in Perception I* (1966, Bell Labs, IBM 7094) rebuilt a photograph from electronic-symbol tiles; Knowlton later described the idea as "pointillism with punctuation". Line-printer pictures spread in the 1960s; ASCII and ANSI art then flourished on bulletin boards (late 1970s and 80s) and in demoscene and warez release notes. ANSI art adds block characters and 16 colours. [ASCII art (Wikipedia)](https://en.wikipedia.org/wiki/ASCII_art); [ANSI art (Wikipedia)](https://en.wikipedia.org/wiki/ANSI_art). The IBM 1403 used EBCDIC, so some early line-printer work is not strictly ASCII.
- **Visual signature.** A grid of characters in a monospace font, tone by character density (` .:-=+*#%@`), line art by `/ \ | _`. Block characters (`░▒▓█`) give fake greys in ANSI.
- **What makes it authentic.**
  - Fixed cell aspect (about 1:2); using square cells makes images look stretched.
  - Ramps should be measured for the actual font; a stock ramp misorders glyphs.
  - Shape matters at edges: an `/` is not a darker `.`. Good renderers compare each cell against the shape of each glyph, not just its average brightness.
  - ANSI block art uses 2 or 3 vertical positions per cell with half-block characters (`▀▄`), doubling resolution.
- **Generate.**
  - Per-cell mean tone against a measured glyph ramp (see entry 20); or shape-aware: for each cell compute a 6-sample vector (two columns by three rows) and pick the glyph whose precomputed shape vector is nearest ([Alex Harri's ASCII rendering write-up](https://alexharri.com/blog/ascii-rendering) shows this clearly).
  - Half-block mode: sample two vertical halves per cell and use `▀`, `▄`, `█` or space.
  - Optionally apply a contrast enhancement to cell edges before matching.
  - [play.core](https://github.com/ertdfgcvb/play.core) is a framework for animated text-mode art.
- **Midjourney keywords.** `ASCII art, text art, monospace characters forming an image, terminal art, black on cream, Knowlton Studies in Perception, character density shading --style raw --no colour, gradient`. Midjourney is poor at actual ASCII; expect to generate this procedurally, not by prompt.
- **Fit: 3.** It speaks developer, which is the audience, but the terminal connotation is cold and it overlaps with entry 20. Best as a small detail (a spec sheet, a README strip), not a whole poster style.

### 22. Teletext

- **Origin.** Ceefax (BBC) went live on 23 September 1974, with ORACLE on the ITV side; the standard was published in September 1976 and later became World System Teletext. The display was 40 columns by 24 rows with block "mosaic" graphics characters; the French Antiope system (1977) was similar. [Ceefax (Wikipedia)](https://en.wikipedia.org/wiki/Ceefax); [Teletext (Wikipedia)](https://en.wikipedia.org/wiki/Teletext); [Typeroom on teletext](https://www.typeroom.eu/article/teletext). Sources disagree on early page geometry. I did not find a source for the 2 by 3 mosaic cell in these searches; it is from my own knowledge, and the Teletext Wikipedia article is where to confirm it.
- **Visual signature.** Chunky 2 by 3 block mosaics inside each character cell, saturated colour on black, large double-height type, rigid grid. In one tone: a blocky bitmap at about 80 by 72 pixels per screen with visible diagonal staircases.
- **What makes it authentic.**
  - The grid is rigid (every cell has six blocks, on or off). A smooth shape must be broken into cells.
  - "Separated graphics" mode draws thin gaps between blocks, giving a lattice.
  - Rules of the system: one colour pair per row segment, controlled by invisible control characters. In a one-tone style this constraint disappears, so authenticity lives in the cell structure.
- **Generate.**
  - Downsample the plate to `(cols*2) x (rows*3)`, threshold or dither each block (Bayer matrix at this size looks right), and draw rectangles. Optionally leave a 1 px gap in separated mode.
  - For geometry: rasterise the wheel to the same grid and draw blocks. This produces the characteristic stair-stepped circle.
- **Midjourney keywords.** `teletext graphics, Ceefax, blocky mosaic pixels, 1980s BBC teletext, 2x3 block characters, low resolution --style raw --no smooth, gradient`.
- **Fit: 2.** Nostalgic and noisy for a calm brand, and its main visual interest was colour. Its structure (a fixed mosaic) is a useful constraint if Rueca wants a pixel-honest style, but entry 23 is a better version of that idea.

### 23. 1-bit dithering (Atkinson, Bayer)

- **Origin.** Bryce Bayer's ordered-dither matrices (Kodak, 1973) and Floyd-Steinberg error diffusion (1976) were the standard ways to show greys on 1-bit screens. Bill Atkinson's dither for the original Macintosh (1984, via MacPaint and Apple's HyperScan software) spreads only three quarters of the error, giving a clean, high-contrast look with more "see-through" detail; the Mac's 512 by 342 black-and-white screen made it the visual identity of early Mac and HyperCard. The algorithm was never formally published; John Balestrieri obtained a description from Atkinson in 2003. [Atkinson dithering (Wikipedia)](https://en.wikipedia.org/wiki/Atkinson_dithering); [Error diffusion (Wikipedia)](https://en.wikipedia.org/wiki/Error_diffusion); [Ordered dithering (Wikipedia)](https://en.wikipedia.org/wiki/Ordered_dithering); [FontLab on Atkinson and ditherpunk](https://blog.fontlab.com/2026/03/24/dithering-ditherpunk-and-bill-atkinson/).
- **Visual signature.** Crisp black-and-white pixels at a visible pixel size, tone from pixel density. Bayer: a regular crosshatch-like pattern. Error diffusion: organic "worm" textures. Atkinson: lighter highlights and darker shadows are blown to pure white and black, clean mid-tones.
- **What makes it authentic.**
  - The pixel grid is visible and the scale is an integer: render small, then upscale with nearest-neighbour. Dithering at the device resolution and then scaling by a fractional factor destroys the pattern.
  - Atkinson kernel: the error goes to six neighbours, each 1/8 (the pixel to the right and two to the right, below-left, below, below-right, and two below). Only 6/8 of the error is diffused, so the other quarter is dropped and highlights/shadows clip ([Wikipedia](https://en.wikipedia.org/wiki/Atkinson_dithering)).
  - Do the maths in linear light, not sRGB ([Surma](https://surma.dev/things/ditherpunk/)).
  - Floyd-Steinberg weights: 7/16, 3/16, 5/16, 1/16. Serpentine scanning (left to right, then right to left) removes the diagonal drift.
  - Mac-era detail: MacPaint's fill patterns (8 by 8 repeats) are the tool for flat vector shapes.
- **Generate.**
  - **Bayer:** build the matrix recursively (level 0 is `[[0,2],[3,1]]`, each level places four scaled copies with offsets 0, 2, 3, 1), normalise to 0..1 and compare to tone. Surma's article and the interactive demo ([surma.dev/lab/ditherpunk](https://surma.dev/lab/ditherpunk/)) are the clearest; the [Atkinson demo](https://atkinson.franzai.com/) and [numbersandshapes error-diffusion write-up](https://numbersandshapes.net/posts/error_diffusion/) show kernels. [Bart Wronski](https://bartwronski.com/2016/10/30/dithering-part-three-real-world-2d-quantization-dithering/) covers the quantisation theory.
  - **Blue-noise threshold:** compare tone to a tiled blue-noise mask ([Peters](https://momentsingraphics.de/BlueNoise.html)).
  - **Error diffusion:** loop over a Float32 buffer; for each pixel quantise to 0 or 1, compute the error, add fractions to neighbours.
  - *Vector geometry:* render flat tones (0, 0.25, 0.5, 0.75, 1) to a low-res canvas and dither with a Bayer matrix: this gives MacPaint-like pattern fills.
- **Midjourney keywords.** `1-bit dithered image, Atkinson dithering, MacPaint, HyperCard, original Macintosh 1984 black and white, pixel dithering, Bayer ordered dither, high contrast --style raw --no grey, smooth, anti-aliased`. Midjourney tends to smooth the pixels; generate procedurally for fidelity.
- **Fit: 4.** Honest to software history (the tool-making audience will recognise it), crisp, and it turns every plant plate into one-bit texture. The risk is that dithering is currently fashionable; keep it rigorous (integer scale, Atkinson or Bayer) so it reads as craft.

### 24. Early plotter art (Nake, Nees, Molnár)

- **Origin.** Computer-drawn pictures on pen plotters from 1963: Frieder Nake began with Konrad Zuse's Graphomat Z64 at Stuttgart (1963; "Hommage à Paul Klee" series); A. Michael Noll at Bell Labs; Georg Nees's *Schotter* (Gravel, 1968; a grid of squares whose rotation and position grow more random down the page), shown in the 1965 Stuttgart exhibition curated by Max Bense; Vera Molnár (from the late 1960s; "(Dés)Ordres") and Manfred Mohr. [Georg Nees (Wikipedia)](https://en.wikipedia.org/wiki/Georg_Nees); [Georg Nees (Monoskop)](https://monoskop.org/Georg_Nees); [Frieder Nake (Wikipedia)](https://en.wikipedia.org/wiki/Frieder_Nake); [Vera Molnár (Wikipedia)](https://en.wikipedia.org/wiki/Vera_Moln%C3%A1r); [Plotter (Wikipedia)](https://en.wikipedia.org/wiki/Plotter); [Digital Art Archive](https://www.digitalartarchive.at). One source calls the February 1965 Stuttgart show the first public exhibition of computer-generated art; treat that as a claim, not a fact.
- **Visual signature.** Thin, uniform, black pen lines on white paper, made of straight segments; geometry (squares, lines, polygons) disturbed by controlled randomness; systematic variations in a grid of repeated cells; visible pen artefacts: ink dots where the pen touches down, slight overshoot at corners, minor wobble, and faint paper texture.
- **What makes it authentic.**
  - Lines are one width and never swell. Curves are polylines of visible straight segments, often with a corner at every vertex.
  - The idea is a rule with a controlled disorder dial. *Schotter*'s disorder grows monotonically down the rows.
  - Each pen stroke begins with a tiny ink blot (the pen dwells) and ends cleanly.
  - Composition is a grid or series. Titles are algorithmic ("Untitled, 1968").
  - Paper is smooth drafting vellum or tracing paper.
- **Generate.**
  - Define a base cell (a square, a wheel, a spindle whorl) and a 12 by 22 grid of them. For row `r`, apply random rotation `N(0, sigma_r)` and offset `N(0, tau_r)` where `sigma_r = k * r` (growing disorder). Seeded PRNG.
  - Draw paths as polylines with `lineJoin: 'miter'` and a 1.5 px stroke at poster scale; add a 1.2x dot at path starts.
  - Spacing, pen-lift order and path optimisation matter if it will ever be plotted: [vpype](https://github.com/abey79/vpype) (`linesort`, `linemerge`) and [vsketch](https://github.com/abey79/vsketch).
  - *Vector geometry:* ideal. Rueca's own motifs are the "cells" in a disorder-gradient grid.
- **Midjourney keywords.** `early computer art, pen plotter drawing, Georg Nees Schotter, Vera Molnár, Frieder Nake, generative geometric lines, black ink on white paper, 1960s algorithmic art, plotter --style raw --no colour, shading, gradient`.
- **Fit: 5.** Honest about process, geometry-first, and it is literally the lineage of a design tool that generates art. The logo itself would sit comfortably in a *Schotter*-style field.

### 25. Contour-line cartography

- **Origin.** Contour lines (isolines of equal height) came into topographic mapping in the 1700s and 1800s; before them, hachures showed slope. Swiss cartography is the high point: Eduard Imhof (ETH Zurich, professor of cartography 1925 to 1965; *Kartographische Geländedarstellung*, 1965; English *Cartographic Relief Presentation*, 1982) wrote the standard text on terrain depiction, covering contours, hillshade and rock drawing. [Contour line (Wikipedia)](https://en.wikipedia.org/wiki/Contour_line); [Hachure map (Wikipedia)](https://en.wikipedia.org/wiki/Hachure_map); [Imhof biography (Cartographic Perspectives, PDF)](https://cartographicperspectives.org/index.php/journal/article/download/cp65-youngblood/pdf/976); [Esri Press reissue notice](https://amerisurv.com/2007/05/29/esri-press-releases-new-edition-of-classic-book-cartographic-relief-presentation/).
- **Visual signature.** Many closed, smooth, non-crossing lines of constant weight, with every fifth line (the index contour) heavier and labelled in the line. The spacing of the lines carries the slope. In one tone: black or sepia, with no fill.
- **What makes it authentic.**
  - Contours never cross or end except at the map edge; they are smooth and rounded, with no sharp corners.
  - Index contours are heavier (about 1.5 to 2x) every fifth line, and carry elevation text set along the line, which breaks the line.
  - Interval is constant across the map (and stated in a legend).
  - Spot heights, hachure ticks on depressions, and a neat border complete the look.
  - Imhof's principle: reduce line weight and contrast with distance to suggest atmosphere. That is a refinement for later.
- **Generate.**
  - Treat any greyscale image or a signed-distance field as a height map. Blur (Gaussian, 2 to 6 px) to avoid jaggies, run marching squares at `N` thresholds to get polylines, and smooth them (Chaikin or Catmull-Rom). [d3-contour](https://github.com/d3/d3-contour) does this and also contours point-cloud density; see also [Marching squares (Wikipedia)](https://en.wikipedia.org/wiki/Marching_squares).
  - Every 5th level: stroke width x1.8 and break the line for a label placed along its path.
  - *Vector geometry:* compute a distance field from the wheel, whorl and band outlines (each is analytically simple), combine with a smooth minimum, and contour it: the wheel appears as concentric offset rings merging into the band. Also contour a sum of Gaussians placed at node positions to make a "terrain" of the node graph.
  - For plant plates: heightmap = blurred tone.
- **Midjourney keywords.** `topographic map, contour lines, isolines, Eduard Imhof, Swiss cartography, black contour lines on cream paper, index contours, minimal terrain map, monochrome --style raw --no colour fill, gradient, 3d`.
- **Fit: 5.** Calm, editorial, made of lines, and it makes any shape look like a considered, surveyed object. Cielo on Lana (water-contour blue) or Nogal on Lana. The distance-field rings echo thread wound round a spindle.

### 26. Swiss technical line drawing

- **Origin.** Technical drafting conventions (ISO 128 and DIN line types, Rotring-pen constant-width lines) merged with Swiss Style graphic design: Josef Müller-Brockmann, Emil Ruder, Armin Hofmann; grid systems, asymmetric layout, sans-serif type, geometry. Müller-Brockmann's *Grid Systems in Graphic Design* is the key text (sources give 1966 or later dates; I have not verified the year). [Technical drawing (Wikipedia)](https://en.wikipedia.org/wiki/Technical_drawing); [International Typographic Style (Wikipedia)](https://en.wikipedia.org/wiki/International_Typographic_Style); [The Swiss Grid (Paris LA archive)](https://paris-la.com/archive2008-2020/the-swiss-grid). Müller-Brockmann called the grid a tool for organising the surface.
- **Visual signature.** Black on white; constant-width lines (a limited set of weights); circles and tangents drawn with true compass construction; construction lines and centre marks left visible; a grid; dimension arrows and neat sans-serif notes.
- **What makes it authentic.**
  - Constant line width within each class, with a strict set of weights. No taper, no wobble.
  - Geometry is correct: tangent lines meet circles at 90 degrees to the radius, belts are true external tangents, arcs join with matching tangents.
  - Construction is shown, not hidden (centre marks, radii, light construction circles in a lighter weight).
  - Empty space is a feature. Elements align to a grid; text is flush left, ragged right.
- **Generate.**
  - Pure vector. Wheel (circle, R), whorl (circle, r), band (two external tangent lines plus arcs), centre marks (short crosses with extended arms), dimension lines and radii leaders. Line classes: 0.25, 0.5, 1.0 pt.
  - Layout: a 12-column grid with baseline units; put each element on a grid line.
  - IBM Plex Sans for notes (brand text face).
  - Sources of geometry: it is exactly how the Rueca mark is already constructed (drive wheel, spindle whorl and the band between), so this style is a "show the working" mode of the logo.
- **Midjourney keywords.** `Swiss style technical drawing, constant width lines, compass construction, circles and tangents, Josef Müller-Brockmann grid, black on white, construction lines, minimalist engineering diagram --style raw --no shading, gradient, 3d render`.
- **Fit: 5.** It is the logo's own language and the calmest style on the list. It should be the structural frame for every poster (grid, centre marks, notes), rather than one of the twelve "renderings". It is a framework more than a rendering style; that is why it is an honourable mention, not a shortlist entry.

### 27. Isotype pictograms

- **Origin.** The Vienna Method of Pictorial Statistics was developed at the Social and Economic Museum of Vienna from 1925 to 1934 by Otto Neurath (director and theorist), Gerd Arntz (artist, around 4,000 pictograms; he made the linocut the production medium) and Marie Reidemeister (later Marie Neurath, the "transformer" who turned data into charts). It became Isotype in 1935; the team moved to the Netherlands and then England (Isotype Institute in Oxford, 1942). [Isotype (Wikipedia)](https://en.wikipedia.org/wiki/Isotype_(picture_language)); [Isotype: origin, development and legacy (University of Vienna)](https://isotype.univie.ac.at/en/abstract); [Gerd Arntz Web Archive](https://gerdarntz.org/content/gerd-arntz.html); *History and Legacy of Isotype* (Burke and Sandner, open access).
- **Visual signature.** Flat, silhouetted figures and objects with minimal interior detail, front or side view, a consistent weight, used as repeated units in rows to show quantity (one icon equals a fixed number). One or two colours plus black.
- **What makes it authentic.**
  - Quantity is shown by **repeating** an icon, never by scaling it.
  - Every icon in a set has the same visual weight and style; details are reduced to the minimum (a head, a body, a hat).
  - Forms are slightly geometric, from the linocut; edges are clean, with occasional white interior lines.
  - Layout is strictly gridded, with generous space between rows.
- **Generate.**
  - Convert a plate to a silhouette: threshold, remove small islands (< 1% of area), morph-close, then vectorise ([potrace-js](https://github.com/kilobtye/potrace)) and simplify (Douglas-Peucker or Visvalingam) to a coarse polygon of 20 to 60 vertices, then optionally round corners. Add one or two interior cut lines.
  - Data layout: a function `rows(counts)` which tiles the icon in a grid with fixed gutters.
  - *Vector geometry:* the wheel, whorl and band become three icons; "number of tools made" or "stars" appear as rows of them.
- **Midjourney keywords.** `Isotype, Gerd Arntz, pictogram, Otto Neurath, flat black silhouette icons, linocut-style simple shapes, statistical pictorial chart, 1930s Vienna method --style raw --no gradient, detail, colour fill, 3d`.
- **Fit: 4.** Honest, public-minded, and it has a fine open-source ethos (a picture language for everyone). It suits a poster that carries a number. It is a layout device as much as a rendering style.

### 28. Silhouette and paper cut (scherenschnitte)

- **Origin.** Cut-paper silhouette portraiture was fashionable in 18th-century Europe (the word is traditionally linked to the French finance minister Étienne de Silhouette; I could not confirm that here). Scherenschnitte ("scissor cuts") is the Germanic, Swiss and Polish (wycinanki) folk tradition of symmetric folded cuts. Lotte Reiniger used cut silhouettes for *The Adventures of Prince Achmed* (1926), the oldest surviving animated feature film. Matisse's late cut-outs are a related painterly development. [Scherenschnitte (Wikipedia)](https://en.wikipedia.org/wiki/Scherenschnitte); [Silhouette (Wikipedia)](https://en.wikipedia.org/wiki/Silhouette); [Lotte Reiniger and the first animated feature (Publishers Weekly, book listing)](https://publishersweekly.com/9780063067394).
- **Visual signature.** A solid black shape, entirely flat, with interior openings cut through (lace, leaves, patterns), mounted on a light ground. Crisp scissor-cut edges with small facets on curves. Thin connecting bridges hold the sheet together.
- **What makes it authentic.**
  - **Everything is connected.** A real cutting is one piece of paper: no floating islands. Interior cut-outs have bridges.
  - Very fine detail is limited by the scissors or knife: no hairlines thinner than about 1% of the shape.
  - Folded work is symmetric: 2-fold (mirror), 4-fold, 8-fold (snowflake-like radial).
  - Curves are made of slightly faceted arcs; tight inner corners are sharp.
- **Generate.**
  - Threshold the plate or rasterised shapes. Find connected components (flood fill); for each floating island, add a bridge to the nearest large component (a 2 to 4 px line along the shortest path), or drop the island. Smooth edges with blur-and-threshold; simplify to cubic Bezier paths.
  - Folds: draw one wedge (angle `360/n`) and mirror it `n` times with alternating reflection.
  - *Vector geometry:* the wheel, whorl and spokes are a natural 6- or 8-fold cut; the band becomes a lace border.
  - Optional paper thickness: a 1 px lighter edge line on the lower-right edge. Avoid drop shadows and glows.
- **Midjourney keywords.** `paper cut silhouette, scherenschnitte, black paper cutting on cream, Lotte Reiniger, intricate cut-out leaves and spokes, symmetric folded paper cut, flat black shape --style raw --no gradient, shadow, 3d, colour`.
- **Fit: 4.** Solid, bold and calm. It provides the poster series with a heavy black-mass option next to its fine-line styles. The connectivity rule gives it a craft logic that people notice.

### 29. Stencil and pochoir

- **Origin.** Stencils appear in prehistoric hand prints and Asian textile printing; pochoir (Paris, 1900s to 1930s) hand-coloured prints through cut metal stencils in gouache, producing the Art Deco portfolios of the 1920s (Jean Saudé, who wrote the 1925 *Traité d'enluminure d'art au pochoir*). Matisse's *Jazz* (1947) was printed by pochoir from his paper cut-outs. The industrial "stencil" typeface and the street stencil (Blek le Rat, Banksy) followed. [Pochoir (Wikipedia)](https://en.wikipedia.org/wiki/Pochoir); [Jean Saudé (Wikipedia)](https://en.wikipedia.org/wiki/Jean_Saud%C3%A9); [Wolfsonian: Pochoir technique](https://pochoir.wolfsonian.org/Technique/Technique.htm); [MoMA: Matisse, Jazz](https://www.moma.org/collection/works/105387). The street-art lineage is from my own knowledge, not these searches.
- **Visual signature.** Flat shapes with **bridges** (ties) where the stencil would otherwise fall out, slight overspray or brush edge, and flat, slightly uneven colour. A stencil letter has gaps in "O", "A", "B".
- **What makes it authentic.**
  - Bridges are essential: every island in the design is held by at least one bridge, usually 3 to 6% of the island's width.
  - Edges are crisp where paint met the stencil, with a few overspray droplets or a slightly soft edge.
  - Pochoir fills are flat gouache with subtle brush texture, and multiple stencils are slightly out of register.
- **Generate.**
  - Similar to the paper cut, but the connectivity rule applies to the **non-ink** islands (the stencil's holes), because it is the stencil that must stay in one piece: islands of paper inside black areas need bridges. Compute the distance transform, find the thinnest necks, and add the bridges there.
  - Overspray: scatter small discrete droplets within a few px of the edge, with density falling off with distance. Keep them discrete: a soft spray glow breaks the "no glows" rule.
  - *Vector geometry:* the band between two wheels becomes a long stencil strip with ties.
- **Midjourney keywords.** `stencil print, pochoir, Art Deco pochoir portfolio, flat gouache, bridges in stencil, stencilled shapes, Matisse Jazz, black on cream, hand-cut stencil --style raw --no gradient, photo, 3d`.
- **Fit: 3.** Beautiful in the Matisse mode, but it overlaps with paper cut (28) and the street associations are noisy. Use the bridge idea inside other styles instead.

### 30. Shibori and indigo resist

- **Origin.** Japanese shaped-resist dyeing. The oldest hint is a 238 CE Chinese record of "spotted cloth"; firmer Japanese evidence is among the goods given to the Todai-ji temple in Nara in the Nara period (700s); Arimatsu, on the Tokaido road, became a major centre. Techniques: **arashi** (wrapped on a pole, giving diagonal "storm" lines), **kumo** (pleated and bound, giving spiderweb circles), **itajime** (folded and clamped between boards, giving mirrored geometric shapes), and **nui** (stitched). Standard reference: Wada, Rice and Barton, *Shibori: The Inventive Art of Japanese Shaped Resist Dyeing* (1983). [Shibori (Wikipedia)](https://en.wikipedia.org/wiki/Shibori). Technique details come partly from craft-supply sites.
- **Visual signature.** White shapes on indigo (or the reverse), with soft, feathery edges where the dye wicked into the resist. Each piece has an irregular, one-off look. One tone: a single dye.
- **What makes it authentic.**
  - Edges are soft in a specific way: a crisp core with a feathered halo, and a faint pale rim where dye pooled just outside the resist.
  - Folds create mirrored, repeating, slightly imperfect forms (itajime) or lines of uneven width (arashi).
  - Deep indigo is uneven, with pale patches where the cloth was compressed.
  - **Rueca rule:** no weaving or loom imagery, so no warp-and-weft cloth texture. Keep it to the resist pattern on a flat ground. Treat it as a dye-on-paper style, not a textile picture.
- **Generate.**
  - *Itajime:* draw an `n`-fold wedge of resist shapes (clamped squares, triangles), mirror to the full plate by alternating reflections, and use them as resist masks.
  - *Arashi:* diagonal lines at 20 to 35 degrees with sinusoidal wobble and varying thickness, repeated with phase shifts.
  - *Kumo:* concentric rings around random centres, each ring with an uneven radius from noise.
  - Dye bleed: compute a distance field from the resist mask, warp it with domain-warping noise ([Inigo Quilez, domain warping](https://iquilezles.org/articles/warp/)), set `dye = smoothstep(...)`, then quantise to 2 or 3 steps so edges remain crisp but wobbly (avoiding a smooth ramp).
  - *Vector geometry:* rings and mirrored folds can be built from wheel and whorl shapes; the band becomes a pleat line.
- **Midjourney keywords.** `shibori, indigo resist dye, itajime folded geometric pattern, arashi, kumo, white pattern on deep blue, Japanese resist dyeing, bleed edges, flat pattern, handmade --style raw --no woven texture, fabric weave, gradient, 3d`. Add `flat graphic, no fabric weave` to avoid the loom look.
- **Fit: 3.** A lovely, calm, handmade look and Cielo is a fair stand-in for indigo, but it points at textile, which the brand has deliberately avoided. Use it only as a pattern, never as cloth.

---

## Ranked shortlist: the 12 strongest for Rueca

Ranking weighs four things: (1) fit with the calm editorial brief and the brand rules, (2) how well it carries both the wheel/band/thread geometry and the plant plates, (3) how robust it is to generate on canvas, and (4) how different it is from the others, so a 12-poster series does not repeat itself. Ink pairs follow the briefed palette. Swiss technical line drawing (26) is not in the twelve because it is better used as the frame and grid for all of them.

| Rank | Style | Why | Ink on paper |
|---|---|---|---|
| 1 | **Copperplate and steel line engraving** (1) | It is the existing imagery, so it is the reference all other styles are measured against. Line-built, historical, calm. Works from plates and, via lit-contour hatching, from the wheel and band. | Nogal `#171615` on Lana `#FDFBFA` |
| 2 | **Guilloché** (18) | The one style that is mechanically the same object as the logo: a wheel, a follower and a path. Exact hairlines, no gradient needed, and it feels like authority and craft. | Mora `#6E1A3E` on Lana |
| 3 | **Line screen, modulated lines** (13) | Turns any image or shape into threads of varying width. Pure vector, scalable, and it matches "lines stay lines" exactly. | Nogal on Lana (or Cielo for a lighter poster) |
| 4 | **Stipple engraving** (7) | Soft and quiet, made of one mark, works from plates and shapes, and the Bartolozzi red-ink tradition gives a historical reason for Achiote. | Achiote `#F6571C` on Lana |
| 5 | **Wood engraving** (2) | The black-block, white-line counterpart to copperplate: bolder, with the same historical register, and good for the plant plates. | Nogal on Lana |
| 6 | **Early plotter art** (24) | A generative-art ancestor of the product itself. Geometry-first, honest about process, and the "disorder gradient" grid can carry any Rueca motif. | Nogal on Lana |
| 7 | **Contour-line cartography** (25) | Calm, surveyed, and made of lines; turns the wheel, whorl and band into a distance-field landscape and the plates into terrain. | Cielo `#5070F0` on Lana |
| 8 | **Risograph, one drum** (14) | The current voice of small studios and zines; gives each Mora colour a natural, hand-made home and softens the geometry. | Achiote on Lana (or Malva `#EFA6FF` for big solids only) |
| 9 | **Cyanotype** (10) | Direct link to Anna Atkins's plant photograms, so it ties to the plates and to open science. Needs a decision on the ground-as-ink inversion. | Cielo on Lana |
| 10 | **1-bit dithering (Atkinson, Bayer)** (23) | Software's own printmaking. Crisp, rigorous and instantly legible to the audience, and it handles flat shapes and plates equally. | Nogal on Lana |
| 11 | **Aquatint** (6) | Flat grainy tone steps, ideal for large geometric shapes and free of the gradient problem. Gives the series a tonal-fill poster. | Mora on Lana |
| 12 | **Silhouette and paper cut** (28) | The heavy, solid-black poster of the set, with a craft rule (everything connected) and a natural 6- or 8-fold wheel form. | Nogal on Lana |

**Next in line (not in the 12):** Swiss technical line drawing (26, use as the grid and notes layer on all posters), blueprint and diazo (11, spec-sheet variant), Op-art moiré (19, one striking wheel-pair poster), Isotype (27, number-led posters), Letraset screens (15, tone-by-pattern variant), concrete and typewriter art (20, type-led posters).

**Weakest fits:** photocopy zine (2), teletext (2), woodcut (3), mezzotint (3), lithographic crayon (3), Ben-Day (3), ASCII (3), stencil (3), shibori (3). They are either too loud, too smooth-toned for the no-gradient rule, or point at textile or retro tropes the brand avoids.

## Combining and sequencing

- **Series logic.** A good 12-poster series needs a mix of mark types: line (1, 3, 13, 24, 25), dot (7, 14, 23), solid mass (2, 28) and flat tone (6). The list above has all four.
- **One ink per poster, not per series.** Using all four brand colours across the 12 (Nogal x6, Mora x2, Achiote x2, Cielo x2, with Malva only as a solid-fill option) keeps the series from reading as monochrome while every poster stays one tone.
- **Shared frame.** Put the Swiss technical frame (grid, centre marks, a mono-spaced note in IBM Plex Mono or Sans, a pen-written Achiote annotation in La Belle Aurore) on every poster. This is what makes 12 different print techniques feel like one house.
- **Build order.** Start with the shared toolkit (seed, tone field, direction field, blue noise, ink model). Entries 1, 13 and 2 share the same variable-width line renderer. Entries 7, 14 and 23 share the blue-noise and stipple code. Entries 18, 24 and 25 are pure geometry and need no image input. Entries 6 and 28 share the "threshold, quantise, clean edges" pipeline. That is five code paths for twelve styles.

## What I could not confirm

- The 2 by 3 teletext cell and Flora Stacey's 1898 typewriter butterfly are from my own knowledge; searches did not return a page that states them.
- Étienne de Silhouette as the origin of the word "silhouette" is the traditional account and was not covered by the search results.
- The Wall Street Journal hedcut date and the street-art stencil lineage are from my own knowledge.
- I could not open the Met Museum and MoMA pages in this environment (rate-limited or blocked), so their claims come from search summaries.
- The digDurer paper link (Technion) did not respond when I checked; search the title if it is still down.
- Newspaper-specific dot gain figures and early (1880s) screen angles were not established; the 45 degree black angle and 65 to 85 lpi newsprint range are from general reference pages.
- All Midjourney keywords are starting points from experience with the tool, not tested prompts. Test each with `--style raw` and with `--no` terms before relying on it. For ASCII, teletext and 1-bit dither, Midjourney will smooth the pixels, so generate those procedurally.
