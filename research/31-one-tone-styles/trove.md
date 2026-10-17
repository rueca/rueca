# One-tone styles from Rafael's Trove

Source: the x-book MCP only (`list_vocabulary`, `browse_tag`, `search_library`). Pulled on 16 Oct 2026.

This feeds two jobs: the 12-style exploration of Rueca's generative art, and the poster series in Figma.

## How to read this

- **What was read.** All 15 tags you named, plus the eight plain-language searches, plus four extra searches (stipple and hatching, woodcut and screenprint, blueprint and cyanotype, Anthropic's engraving collage). Several hundred results came back, many of them repeats. 56 are written up in full below. Another 54 are listed as "also seen" so the family counts are honest.
- **Craft detail is what the save shows.** Trove notes almost never record dot size, screen angle or line count. Where I give a number it is under **Try**, and it is my starting value from print practice, not something read from the save. Check it by eye on the first proof.
- **Links.** X and Instagram tracking strings are trimmed. A few saves only have an expired Dropbox link or a long Google Images search link. Those say so, and the Trove title is given so you can find them.
- **Brand filter.** Rueca is one ink on Lana paper, no gradients, no glows, no weaving. I kept saves that show a technique in one tone. Where a save is colourful, the technique is what is worth copying, not the colour. Things to avoid are listed near the end.
- **Marked POSTER** means the save already works as a poster composition. The one-line composition follows.

## Tag sizes, for context

| Tag | Saves | Tag | Saves |
|---|---|---|---|
| Print Aesthetics | 447 | Pixel Art | 46 |
| Micrographics | 295 | ASCII Art | 36 |
| Generative Design | 179 | Moire | 23 |
| Poster Design | 173 | Dithering | 15 |
| Cover Art | 189 | Risograph | 12 |
| Line Drawing | 134 | Cyanotype | 5 under its own tag |
| Halftone | 99 | Technical Diagram | 49 |
| Glitch Aesthetics | 83 | | |

The Trove is deepest in print, micro-type, line and halftone. Dithering, riso and cyanotype are small tags, but they are very consistent in what they show.

---

## Family A. Dither and bitmap (1-bit tone from pixels)

**A1. Four-variant poster system, dithered botanicals, 404 copy, bitmap horses** (mechibaz)
https://x.com/mechibaz/status/2109733798745436298
- Does: one layout held fixed across four posters while palette and texture change.
- Copy: the layout never moves, only the texture. Error-log copy in small type is the second voice. This is the exploration's structure in miniature.
- POSTER: one grid, one title block, four dither textures, shown as a set of four.

**A2. Dithered animation series, one algorithm per operator** (ertdfgcvb, "Operators")
https://ertdfgcvb.xyz/+/operators/
- Does: sets Bayer ordered dithering against Floyd-Steinberg, one per arithmetic operator, in the 6-bit EGA palette.
- Copy: show the two algorithms side by side. Bayer gives a regular cross-hatched pattern. Floyd-Steinberg gives organic worms.
- POSTER: a 2 by 2 sheet, same wheel, four algorithms, each labelled in small mono caps.

**A3. Mate Act Now, DesignStudio** (Are.na)
https://www.are.na/block/36849067
- Does: coarse pixel squares resolve into a fine dithered Earth.
- Copy: the resolution gradient is the image. A tonal ramp with no gradient fill.
- POSTER: top row of big squares, bottom row fine dither, the wheel emerging down the page.

**A4. Archer** (praveenisomer)
https://x.com/praveenisomer
- Does: a classical archer engraving rendered as a blue dot-dither.
- Copy: a real antique engraving as the source, one ink, no outlines kept. This is the closest save to Rueca's own engraving-plus-digital idea.
- POSTER: yes. Centre the figure on Lana, one ink, title in Goudy below.

**A5. Figma shaders magic** (praveenisomer)
https://x.com/praveenisomer/status/2075195768777191488
- Does: monochrome halftone-dither renders of a classical sculpture, cupid, chess knight and shark, all made with Figma shaders.
- Copy: it proves the whole look can be built inside Figma, which is where the poster series will live. Worth opening the shader settings before building anything by hand.

**A6. Dithered ring** (mwrc, Are.na "Motion")
https://www.are.na/block/14871647
- Does: a black ring on warm grey with a hard core that breaks into scattered pixels at the edge.
- Copy: radial threshold falloff, so the dither density is a function of distance from the centre. Perfect for a wheel.
- POSTER: yes. One ring, off-centre, the title tucked in the clear hub.

*Also seen (6):* sixteen-step progression from outlined squares to a dithered portrait https://www.are.na/block/45233810 · Atkinson-dithered portrait https://www.are.na/block/10478895 · Boiler Room running figures dissolving into dither https://www.are.na/block/20474497 · "Dither Motion", Klein blue dithered brand layout https://x.com/Oriku175/status/2079192780581339453 · dithered gradients as a brand system (angehyc) https://t.co/Rtvl4XkzjG · dense stochastic dither in black and bone (e_zvirgzdins) https://x.com/e_zvirgzdins/status/2082959037545529547

**Try (mine):** Bayer 4x4 or 8x8 for a regular grid, Atkinson for clean highlights and clumped shadows, Floyd-Steinberg for an organic grain. Work at one output pixel per dither cell, then scale up with nearest-neighbour so the cells stay crisp.

---

## Family B. Halftone dot and line screens

**B1. Same image at rising screen frequency** (Are.na plate)
https://www.are.na/block/34126723
- Does: four panels of one image, from blobby merged dots to legible tone.
- Copy: the coarsest panel is the most graphic one. Keep one frequency that is too coarse to read at first glance.
- POSTER: yes. Four vertical strips, coarse to fine, left to right.

**B2. Four halftone cats: circle grid against variable-weight lines**
https://www.are.na/block/33287385
- Does: shows how screen type changes legibility of a bitmap image.
- Copy: a line screen with swelling weight looks like engraving, a dot screen looks like newsprint. For Rueca the line screen is the bridge between the copperplate look and the halftone look.

**B3. Exhibition title card on an all-over dot ground**
https://www.are.na/block/28712664
- Does: tight-tracked bold grotesk, three lines centred, over a dot field. Nothing else.
- Copy: the restraint. Swap the grotesk for Goudy and keep the three-line centred stack.
- POSTER: dot field edge to edge, three lines in the middle.

**B4. Type inside halos of scattered ink dots** (Tiempo Extra announcement)
https://uk.pinterest.com/pin/682999099782677990/
- Does: every text block sits in a blobby cloud of ink dots, so the type seems to emerge from noise.
- Copy: dots thin out toward the edge of each cloud (a threshold falloff, as in A6). Use it as the way text sits on an image.

**B5. Image Halftone Emulator** (tool, saved to try)
https://cmyk.danielpetho.com/
- Does: runs an image through a CMYK halftone shader in the browser.
- Copy: for Rueca use only the black channel. It is a quick way to get a screen angle and dot size to compare before rebuilding the look in Figma.

*Also seen (4):* oversized coral and pale-blue dots with misregistration (Instagram CDN link, may have expired; find as "217127039_235299098246628…") · German instructional poster with giant halftone numerals https://www.are.na/block/40094146 · halftone lab photo in a circular crop with orange registration crosses (Are.na channel "lab.rat.xl", Dropbox link expired) · coarse RGB halftone bloom https://www.are.na/block/40536915

**Try (mine):** one ink at 45 degrees for a classic screen. For a line screen, run the lines at 45 degrees too and let the weight swell with tone. Make the dots large enough that they still read on a phone screen.

---

## Family C. Stipple and particle figures (form from density alone)

**C1. Classical bust in scattered black dots** (Are.na "IRIS")
https://savee.it/i/4oOPBJZ/
- Does: no outlines, the form is only dot density on flat grey.
- Copy: no edge lines at all. Highlights are simply empty. Stipple engraving's oldest rule, now generated.
- POSTER: yes. Bust on Lana with a lot of margin and small caption caps.

**C2. Daruma emerging from hundreds of glowing moths**
https://www.are.na/block/39311525
- Does: a Japanese exhibition poster where the figure is built purely from a swarm.
- Copy: the swarm needs a few dense cores and a loose edge. Drop the glow and the black ground, and use Nogal dots on Lana.
- POSTER: the figure in the middle third, small type on the long edge.

**C3. Dotted red fingers** (Are.na "lab.rat.xl")
Dropbox link has expired. Find it in Trove as "dotted red fingers / stretch across white paper void / almost touching now".
- Does: a single-colour halftone dither pushed to extremes, a hand dissolving into red stipple against blown-out white.
- Copy: one colour, and the paper does half the work. The blown-out white is the highlight. Closest in spirit to Rueca's Achiote on Lana.
- POSTER: a hand at the page edge reaching in. The brief's "spinning" could be a hand with thread.

**C4. Dot-plotted sphere with a red radial burst**
https://www.are.na/block/38193239
- Does: a sphere drawn as plotted dots on deep blue, burst of red at the core.
- Copy: dots placed on a surface (like a globe) rather than a flat grid. The spacing tightens toward the silhouette. Good for the wheel as a sphere or a bobbin.

*Also seen (2):* tennis players as scattered squares and dots in one blue https://www.are.na/block/32013488 · black dots of varying scale as a metaball street map https://www.are.na/block/29433250

**Try (mine):** Poisson-disc or blue-noise placement with a density map. It avoids the tell-tale grid of a plain random scatter.

---

## Family D. ASCII and character mosaic (type as image)

**D1. Anthropic's "humanist collage"** (liamjmcgregor thread)
https://x.com/liamjmcgregor/status/2074852273100877962
- Does: ASCII typography over 19th-century engravings, halftones, ink bleeds and grid overlays, with the artists credited in the replies.
- Copy: the pairing of engraved plate and character texture. D2 is the same direction from the Claude brand team. Rueca is open source, so overlap with a big brand reads as validation. Rueca's own ground is the wheel geometry, Goudy and the Achiote pen.

**D2. Claude seascape rebuilt in typed words** (@claudeai)
https://x.com/claudeai
- Does: a split frame where the painted half is retyped as repeating words, CLOUDS, BOAT, OCEAN.
- Copy: words matched to what they depict. Your note on the save: "technical meets classical, another take on softening AI imagery, by claude brand team".
- POSTER: half engraving, half the same scene in type, split on a clean vertical line.

**D3. Ascii furniture objects** (enigmatriz)
https://x.com/enigmatriz/status/2109422341818290622
- Does: antique vessel engravings from Racinet refilled with dense ASCII in flat colour.
- Copy: keep the engraved outline, replace the interior shading with characters. Weight of glyph equals tone. Do it in one ink.
- POSTER: yes. One vessel or one wheel, big, on a plain ground.

**D4. Contour map from typed zeros and eights**
https://uk.pinterest.com/pin/1010284128917299869/
- Does: a topographic map made only of typed 0 and 8, blue on cream.
- Copy: two glyphs are enough for a tonal ramp. The glyph choice sets the grain.

**D5. Album-track posters on dense character grids over hard colour blocks** (oliverhamrin)
https://x.com/oliverhamrin/status/2071320114486542462
- Does: generative character pattern in flat blocks, Helvetica-style titling.
- Copy: a character grid with one block of plain colour behind it. The title is small and sits in the corner.
- POSTER: one character field, one block, one title line.

*Also seen (5):* Greek temple rebuilt in ASCII, "Polished Snow" https://x.com/devxnuj · ASCII sports car sliced into colour panels https://www.are.na/block/37864783 · typewriter ASCII over hard red shapes https://www.are.na/block/9148943 · weather-style data map from typographic marks https://www.are.na/block/26087825 · "Breaking imagery down to unicode" https://www.are.na/block/39563048

**Try (mine):** a monospace like IBM Plex Mono for the glyph field (check it against the "Host only in the logo" rule, since the brand names Plex Sans for text). Ramp: space . : - = + * # % @ from light to dark.

---

## Family E. Engraving, emboss and antique plate reworked

**E1. Blind-embossed engraving of St George, with three red stars**
https://www.instagram.com/p/C4gJaJUCW7b/ (also https://www.are.na/block/29659225)
- Does: an engraving ghosted into the stock with almost no contrast, and three flat red stars joined by hairlines laid over it.
- Copy: near-invisible image plus one loud accent. For the poster, the emboss can be a Lana-on-Lana effect.
- POSTER: yes. This is the strongest single-idea layout for Rueca. The engraved wheel is almost invisible, three Achiote points joined by hairlines sit over it.

**E2. Victorian Pegasus in a quatrefoil frame** (dakshpixelup)
https://x.com/dakshpixelup/status/2109618280013152512
- Does: a winged rider on Pegasus, centred in a quatrefoil, off-white and restrained.
- Copy: the frame. A quatrefoil is a four-lobed outline, a formal way to hold a round wheel.
- POSTER: yes. Centred plate, small caps beneath.

**E3. Conference poster with a cropped classical wing** (dakshpixelup)
https://x.com/dakshpixelup/status/2104821180394099043
- Does: a tight crop of a painted wing, tiny mono caps, a cream ornamental mark, dark moody palette.
- Copy: the crop. Show a fragment of a plate, not the whole picture.
- POSTER: yes. Fragment fills two thirds, small caps in the bottom third.

**E4. Source code set in copperplate script, title blind-embossed**
https://uk.pinterest.com/pin/401524123044972921/
- Does: a book cover with Processing/Arduino code in copperplate, title embossed white on white.
- Copy: code as hand-lettered script. The pairing of generative code and copperplate is Rueca's thesis in one object.
- POSTER: yes. Three or four lines of code in La Belle Aurore, big, with the title as emboss.

**E5. Acropolis jewellery identity** (FLIP Studio)
https://x.com/welovedaily/status/2108210950251979005
- Does: an engraved Pegasus seal and interlocking monogram, blind deboss on navy and bone boxes.
- Copy: the seal in a circle as an engraved roundel, which echoes the wheel.

*Also seen (2):* emboss-filtered unicorn engraving, grainy relief https://www.instagram.com/p/DKfnGEWPW6B/ · antique engraving of stem vascular bundles, stacked like a pattern https://uk.pinterest.com/pin/46724914879221216/

**Try (mine):** for a ghosted plate, use the engraving at 6 to 10 percent tone against the paper, plus a one-pixel highlight offset down and right to fake the emboss.

---

## Family F. Line density, hatching and continuous line

**F1. Two blue diagrams, contour-warped and flat-ruled**
https://www.are.na/block/20147053
- Does: the same figure turned into pure line two ways. One bends the lines with the form, one rules them flat.
- Copy: the contrast between them. Line spacing alone builds the form.
- POSTER: yes. Left half contour-warped wheel, right half flat-ruled wheel, one ink.

**F2. Karel Martens cover, vertical rules of varying weight on kraft**
https://uk.pinterest.com/pin/857091372875377966/
- Does: black ink, vertical rules only, weight changes carry everything.
- Copy: stripe weight as the only variable.
- POSTER: full-bleed rules with a type-sized gap left clear for the title.

**F3. Art book cover with one continuous looping blue line**
https://uk.pinterest.com/pin/374150681564447585/
- Does: a single looping line over bare cream stock, with the title tiny.
- Copy: one line, no fill, and a lot of paper. A single drawn thread fits the spinning idea without any weave.
- POSTER: yes. One looping line crosses the sheet, small title in one corner.

**F4. Green-on-green poster, tendril drawings around a serif title**
https://www.are.na/block/30117587
- Does: dark tendril line drawings weave around the serif title in one hue.
- Copy: the title sits over the drawing, not beside it. Type and image share one tone.
- POSTER: yes. Direct template for a Goudy headline plus line drawing, one ink.

**F5. Cast-iron manhole cover, a rider drawn by interrupted rings**
Saved from a Google Images search, no stable link. Find in Trove as "moscow-manhole-spiral.jpg".
- Does: a rider and horse appear only through gaps in concentric rings.
- Copy: figure from line density alone. Concentric rings suit a wheel.

*Also seen (2):* hairline white rays from two vanishing points https://uk.pinterest.com/pin/571675746422669552/ · radial burst of rays as a loading mark https://dribbble.com/shots/3146019-Reaction

**Try (mine):** line spacing near 0.35 mm at A2 for an engraving feel. Widen the line on shadow, don't add cross-hatch, to keep the one-tone look clean.

---

## Family G. Moire and op art

**G1. Argentine 1960s exhibition poster, stepped stripes swell into ripples**
https://www.are.na/block/33200854
- Does: black stripes of changing step width, all the image from line rhythm.
- POSTER: yes. Pure stripe field with a tiny title.

**G2. 1966 Japanese psychiatry conference poster, a head from concentric stripes**
https://www.are.na/block/2743256
- Does: concentric red and green stripes on grey that vibrate.
- Copy: the vibration comes from two close hues. In one tone, get it from stripe width instead.

**G3. Rosette of overlapping ellipses in dense red line**
https://uk.pinterest.com/pin/3659243441839092/
- Does: moire shading from curve density on aged paper.
- Copy: a rosette made of overlapping ellipses is a spinning wheel, drawn. A direct bridge to the logo.
- POSTER: yes. Rosette in Achiote line on Lana, title in Goudy below.

**G4. Vasarely, Supernovae**
http://www.op-art.co.uk/op-art-gallery/var/albums/victor-vasarely/supernovae.jpeg?m=1322416008
- Does: a black and white square grid deformed by density and swelling dots.
- Copy: the grid is regular and the swell is a smooth function. It is a halftone seen as geometry.

*Also seen (4):* overlapping paper discs in a spiral rosette https://uk.pinterest.com/pin/3448137210135038/ · nested-contour silver type https://www.are.na/block/11720269 · checkerboard-filled letterforms over graph paper https://www.are.na/block/16208396 · displaced repeated elements beside the construction grids https://www.are.na/block/38243385

**Try (mine):** two copies of one line field, rotated 1 to 3 degrees against each other. Animate the angle slowly in the prototype for a motion version.

---

## Family H. Plotter and early computer art

**H1. 1976 Annual Computer Art Exposition cover**
https://www.are.na/block/4963094
- Does: a plotter-drawn radial sunburst and a stippled figure.
- Copy: a pen plotter's single line weight and slight tremor. Generative from the start.
- POSTER: yes. Sunburst in one ink, small credit line.

**H2. Drawing Programs 28A** (Zach Scheinfeld)
https://www.are.na/block/29252842
- Does: a floral image rebuilt in CMY dot grids that coarsen into chunky pixel blocks.
- Copy: the step from dot grid to block is the point.

**H3. Karl Gerstner colour-system paintings**
https://x.com/shrawberryy/status/2110394404502401393
- Does: the same stepped T composition run through four hue and value sequences.
- Copy: one composition, four sequences. Algorithmic design before computers.
- POSTER: one composition, four sheets. Matches the "one layout" idea in A1.

**H4. Nine posters where "TOGETHER" is set as helix curves**
https://uk.pinterest.com/pin/3870349675313403/
- Does: text-only generative typographic series, no imagery.
- Copy: the word is repeated and bent along a path. "Spin" could do this.
- POSTER: yes. Nine-sheet series, all type.

*Also seen (3):* plotter-style arcs and grids in orange, magenta and violet https://www.are.na/block/37745609 · Drawing Programs 28B, dithered orchid https://www.are.na/block/29252850 · Drawing Programs 27B, bird reduced to blocks https://www.are.na/block/28879823

**Try (mine):** SVG with one stroke weight, then output through an actual pen plotter or simulate the wobble with a small noise on each segment.

---

## Family I. Construction and technical diagram

**I1. Compass-and-straightedge circle lattice, labelled by point**
https://uk.pinterest.com/pin/305259681002460453/
- Does: an overlapping circle lattice built step by step on a coordinate grid.
- Copy: the labels (A, B, C) and the construction arcs are the ornament.
- POSTER: yes. Draw the wheel's own geometry, with the construction left visible. Matches the "exact geometric" logo.

**I2. Archimedean spiral by compass**
https://uk.pinterest.com/pin/547187423466255795/
- Does: step-by-step construction, the radius divided into twelve parts matched to twelve angles.
- Copy: keep the dividing marks.
- POSTER: yes. A spiral as the thread winding on to a spindle.

**I3. Personal Space poster**
https://www.are.na/block/7346517
- Does: overlapping arcs annotated with distance measurements make up the whole visual system. Cream on deep green with heavy grain.
- Copy: dimension lines as decoration.
- POSTER: yes. Dimension an arc of the wheel; add grain in one ink.

**I4. Victorian engraved eye diagrams**
https://uk.pinterest.com/pin/396809417138125661/ and https://uk.pinterest.com/pin/396809417138125665/
- Does: engraved ray diagrams, one with an arrow inverted through the lens, one white on black showing refraction in three eyes.
- Copy: thin parallel rays and tiny labels, the right weight for hairlines.

**I5. Lilies with ASCII clusters and callout boxes**
https://uk.pinterest.com/pin/784893041351646229/
- Does: lilies on black overlaid with ASCII glyph clusters and white callout boxes.
- Copy: a template for annotated specimen imagery. It combines families D, E and I in one frame.

*Also seen (8):* twelve page-proportion constructions https://uk.pinterest.com/pin/125819383334376184/ · nine hydrogen orbital densities https://uk.pinterest.com/pin/339107046950285275/ · Iridaceae floral diagram https://www.google.com/search?q=iris+schematic+diagram+flower (Google link) · numbered overlay sheet https://www.are.na/block/30430505 · nested keylines over halftone nature https://uk.pinterest.com/pin/468092955042105053/ · Mario Merz Fibonacci cover (Google link, find as "mario merz fibonacci") · mirrored lily buds with lettered points http://vvhatif.tumblr.com/page/24 · engraved Grasshopper Disk instrument face https://www.are.na/block/40764795

**Try (mine):** Lana with Nogal hairlines at 0.25 pt, labels in handwriting (La Belle Aurore) for the pen marks so the handwriting reads as the person annotating.

---

## Family J. Cyanotype and single blue ink

**J1. The Clove Club, Everything In Between**
https://e-i-b.com/work/the-clove-club/
- Does: a restaurant identity built entirely from botanical cyanotypes in Klein blue.
- Copy: nature imagery standing in for food. A one-hue identity, shown as a case study.

**J2. Three-poster set: serif display, red marker scrawl, cyanotype blue, halftone grounds** (yotasaki_log)
https://x.com/yotasaki_log/status/2107717102048264240
- Does: philosophical micro-copy under big serif type, with a raw marker line over the top.
- Copy: serif plus handwriting plus one image texture. This is Goudy plus La Belle Aurore in Achiote.
- POSTER: yes. Goudy line, one marker underline, texture ground.

**J3. Blue ink-and-salt bleed, letterspaced serif caps**
https://uk.pinterest.com/pin/678565868830477253/
- Does: abstract blue bloom on cream, wide-tracked serif capitals.
- Copy: a natural, uncontrolled texture under formal caps. Get the bloom from a displacement map, no gradient.
- POSTER: yes.

**J4. Sarah Sze catalogue, contents page against a cyanotype bird** (Atelier Dyakova)
https://www.instagram.com/p/CM2gCC_huVf/?img_index=1
- Does: bilingual contents in small mono, offset from a cyanotype bird spread.
- Copy: type pairing is small mono next to a large single-tone image.

*Also seen (6):* RM "Indigo" book scans https://uk.pinterest.com/pin/616289530297057019/ · iris as cyanotype x-ray (Google link, find as "flower xray blue") · library cyanotype proof sheet https://www.cosmos.so/e/1752628151 · architectural cyanotype cut into a mirrored cross https://www.cosmos.so/e/486162847 · glass-rim cyanotype https://uk.pinterest.com/pin/800655640005066170/ · duotone ultramarine contents spread https://www.cosmos.so/e/721538355

**Try (mine):** Prussian blue near #003153 on warm white. It is the one family where the brand's Nogal ink could be swapped for a blue test, to see whether the look is the ink or the process.

---

## Family K. Riso, xerox and screenprint (flat spot ink, print decay)

**K1. Riso poster where stacked repeated words form a ghost R**
https://www.are.na/block/27420795
- Does: monospace type with pipe characters in place of letters builds one giant letter.
- Copy: the repeated word is the pixel. A ghost letter at 100 percent size.
- POSTER: yes. A giant "R" made of the word "rueca" or "spin".

**K2. Hong Kong tear-off almanac calendar, single green ink** (Chungking Express mood)
https://x.com/gwamoleipstop/status/2109174264738001044
- Does: dense Chinese micro-type with a ghosted photo overprint, one ink.
- Copy: ghost image at low density under dense small text. The micro-type is the texture.
- POSTER: yes. Single ink, calendar-grid layout.

**K3. Bergen Art Book Fair poster**
https://www.are.na/block/12334669
- Does: a pixelated green mass eats into a repeated serif text grid.
- Copy: legibility is the design variable. The serif grid is plain, and the eaten area is a hard-edged dither or pixel mass.
- POSTER: yes. This is the closest layout to "large serif plus image texture" for Rueca. Goudy text grid, wheel-shaped dither mass biting into it.

**K4. Interlocked serif S tiled as an all-over photocopy-degraded pattern**
https://www.are.na/block/10142772
- Does: turns a mark into a brand texture.
- Copy: tile the logo and then degrade it. Test the wheel the same way.
- POSTER: tiled wheel, degraded toward one corner.

**K5. fal Worlds, print and scan tests**
https://x.com/adamho/status/2111157287339585701
- Does: pixel-shattered globes and scribbled wireframe spheres in greyscale on tracing paper (saved 16 Oct).
- Copy: print and rescan the digital file, then put it on translucent paper. The generation loss is the texture.

*Also seen (7):* pink ribbon-lattice recital poster, riso two-colour https://www.are.na/block/29052219 (the lattice reads as weave, so copy the print behaviour, not the pattern) · red riso collage of road signs (Are.na "lab.rat.xl", Dropbox link expired) · Rauschenberg-style screenprint collage https://www.are.na/block/6970175 · New Balance photocopy sheet, serif marks under toner loss https://www.are.na/block/29809598 · xerox-grit tracklist with offset duplicate type https://uk.pinterest.com/pin/6262886977597968/ · black woodcut relief print, "carbon dated futures" (Are.na "lab.rat.xl", Dropbox link expired) · black-on-cream screenprint of masked figures (Are.na "lab.rat.xl", Dropbox link expired)

**Try (mine):** misregistration of 1 to 2 px on a second pass, a paper-grain overlay at 5 to 8 percent, and ink density that varies a little across the sheet.

---

## Family L. Pixel, cross-stitch and modular grid type

**L1. Heritage, Schriër**
https://www.are.na/block/19413544
- Does: a blackletter display face on a strict 25 by 25 pixel grid, from Emigre #14 (1990), with sword and star ornaments.
- Copy: a historical letterform on a hard grid. The grid is the translation between engraving and pixel.

**L2. Fluorescent pink cross-stitch lettering blown up past legibility**
https://www.are.na/block/17330382
- Does: huge stitched pixel letters with a tight bilingual text block at the top.
- Copy: scale. The big letters are texture and the small block is the message. Stitch is not weaving, but keep it as a grid, not a fabric.
- POSTER: yes. Giant stitch letters, small text block on top.

**L3. "What Next?" poster built inside a spreadsheet** (Bryant Wells)
https://www.are.na/block/3808460
- Does: cell fills form huge blocky letters, row numbers kept as the frame.
- Copy: the visible UI chrome is the frame. For Rueca the Figma frame could play the same part.
- POSTER: yes.

**L4. Aikido campaign: JSON payloads, PCB traces, pixel-grid halftones** (saved 16 Oct)
https://x.com/xchylerdrenth/status/2111127771649016253
- Does: a dev-tool brand whose illustration system is made of data and circuit layout.
- Copy: a recent peer in your own space, using texture from the product's world.

*Also seen (5):* Departure Mono pixel monospace (tool) https://departuremono.com/ · Koto's Stack Overflow rebrand with pixel-grid art https://x.com/brrranding/status/2110646253616840794 · dot-matrix lettering dissolving over a blurred portrait https://uk.pinterest.com/pin/944700459360827729/ · pixel-strip colour blocks across print and mural https://www.are.na/block/40582297 · monospaced technical-manual layout on black https://www.are.na/block/46720077

**Try (mine):** keep one pixel unit for everything on the sheet, type, dither and rules. A shared unit is what makes these look designed.

---

## Cross-cutting layer: micro-type and annotation

Micrographics is 295 saves, the second largest print tag. It is not a style but a layer that sits on any family above. These are the strongest.

- Oversized ghosted numerals with repeated micro-text headers, tonal grey on grey. https://x.com/dsgnevrywhr/status/2108856313140609178
- Swiss poster of musical notation, crop marks and rotated credits, two colours. https://www.are.na/block/49415074
- Timestamps, timezone codes and orange registration crosses as the whole composition. https://www.are.na/block/41786667
- Sepia halftone collage system with registration marks, rulers and barcodes. https://x.com/olegcoada/status/2075143489768071506
- Type overlaid with its own glyph metrics and sidebearings. https://x.com/manwon_man/status/2108471086325322049
- Mirrored monospace over a red-washed petal macro. https://www.are.na/block/49544576

---

## Things in the Trove to leave alone for Rueca

- **Glows and gradients:** the airbrush-halation-halftone stack https://x.com/nono_ai_archive/status/2106134628469973208, Koichi Sato's airbrushed covers https://x.com/studio_brasch/status/2109293192268898576, chrome-drip glitch covers https://x.com/thisisgrey/status/2108105636374622513. A dithered ramp is fine, a soft fill is not.
- **Weave-like lattices:** the pink ribbon lattice (K, also seen) and the mesh-knit moire macro https://www.are.na/block/4585770.
- **Chromatic splits and iridescence:** A24 RGB split https://www.are.na/block/20298267, iridescent ellipse sphere https://www.are.na/block/22279322.

---

## The 12 style families Rafael's saves lean towards most

Counts are saves I read in this pass: those written up in full plus those in the "also seen" lines. It is a count of this pass, not of the whole library, and each save is placed in one family only.

| Rank | Family | Count | Era it comes from | Strongest in one tone |
|---|---|---|---|---|
| 1 | I. Construction and technical diagram | 13 | Euclid onward, Victorian plates | Very strong |
| 2 | A. Dither and bitmap | 12 | 1970s dither algorithms, 1980s bitmaps | Native 1-bit |
| 2 | K. Riso, xerox and screenprint | 12 | 1960s to 1980s | Native spot ink |
| 4 | D. ASCII and character mosaic | 10 | 1960s typewriter art, 1980s terminal | Strong |
| 4 | J. Cyanotype and single blue ink | 10 | 1840s | Native, single blue |
| 6 | B. Halftone dot and line screens | 9 | 1880s | Native |
| 6 | L. Pixel, cross-stitch and modular type | 9 | 16th-century stitch, 1980s pixel | Strong |
| 8 | G. Moire and op art | 8 | 1960s | Native |
| 9 | E. Engraving, emboss and antique plate | 7 | 18th and 19th century | Native, the brand's own |
| 9 | F. Line density, hatching, continuous line | 7 | Engraving to 1960s | Native |
| 9 | H. Plotter and early computer art | 7 | 1960s and 1970s | Native |
| 12 | C. Stipple and particle figures | 6 | 18th-century stipple engraving | Native |

Total: 110 saves across 12 families.

What the spread says:

1. **Diagram and construction wins.** It is the biggest family and it is the one closest to Rueca's exact geometric wheel. Most of its saves are Are.na "IRIS" channel finds, so it may also be a quirk of one channel.
2. **Dither, riso and ASCII are the new texture side.** Together they are 34 saves, so they are a clear current interest.
3. **Cyanotype is small as a tag but strong in the pass.** It is also the family with a real brand-site example (J1).
4. **Engraving (E) is only 7.** That is thin for a brand built on copperplate. The saves that exist are the best ones (E1, E3, E4), but a gap worth filling with a deliberate search before the exploration.

---

## 5 poster layouts drawn from the saves

All five are one ink on Lana (#FDFBFA) with Nogal (#171615), Goudy for the title, Plex Sans for small text, and La Belle Aurore only for pen marks. Achiote appears once per poster at most.

**1. One layout, four textures.** After A1 (mechibaz) and H3 (Gerstner).
Fix the grid: wheel at the centre, Goudy title above, small mono-style credit at the foot. Make four sheets that differ only in texture, for example Bayer dither, halftone line screen, ASCII, plotter line. Shown together as a 2 by 2 in Figma, it is the exploration and the series in one.

**2. Resolution ladder.** After A3 (DesignStudio), B1 (frequency plate) and the sixteen-step progression.
Cut the sheet into five horizontal bands. The wheel appears as coarse squares at the top, then dither, then halftone, then engraving line at the bottom. Title in the clear band at the foot. The poster tells the story of "prototype to tool" as increasing resolution.

**3. Ghosted plate, one accent.** After E1 (St George) and E2 (Pegasus quatrefoil).
An engraved wheel inside a quatrefoil, embossed so faintly it almost vanishes, Lana on Lana. Three Achiote dots joined by hairlines mark three spokes. Title in small Goudy caps below. This is the quiet poster in the set.

**4. Serif over a texture field.** After K3 (Bergen), F4 (tendril poster) and B3 (title card).
A block of repeated Goudy text fills the sheet in tight columns. A dither mass shaped like the wheel eats into it from the lower right, so letters disappear where the dither is densest. One large Goudy title line sits on the clear area. This is the "large serif plus image texture" brief.

**5. Construction plate.** After I1 (circle lattice), I2 (Archimedean spiral) and I3 (Personal Space).
Draw the logo's own geometry as a compass construction: circles, spiral, labelled points A to H, dimension lines on one arc. Handwritten annotations in La Belle Aurore, as if the maker is marking up the drawing. Title in Goudy at the top left. Nothing is decorative, every line is a construction line.

*Runner-up:* the word "spin" repeated and bent into a helix across nine sheets, after H4 (TOGETHER) and K1 (ghost R). It needs no image at all and works well as a set of small prints.

---

## Gaps and follow-ups

- No save records dot size, screen angle or line count. Pick them by proof on the first board.
- Engraving is thin (family E). Run a deliberate pass on copperplate, mezzotint and stipple engraving before the exploration, from outside the Trove if needed.
- A few saves have only an expired Dropbox link (C3 and three K items). If a shortlisted one is wanted, re-save it from its Are.na "lab.rat.xl" channel.
- Departure Mono (L also seen) and a monospace field in family D need a decision against the "Host only in the logo" and Plex-only text rule.
