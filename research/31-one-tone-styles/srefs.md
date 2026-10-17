# Midjourney references for one-tone styles

16 Oct 2026. Candidate `--sref` codes, image-URL references and keyword prompts for the 20 target styles, so Rueca can render its subjects in each style with Midjourney as well as on its own canvas. Nothing here has been run in Midjourney. I looked at sample thumbnails and read docs; the first test pass is for the main session.

## The short version

- **Best finds are black-ink print looks.** Engraving, wood engraving, woodcut, linocut, stipple, line-screen, contour, silhouette and paper cut all have at least one candidate that I saw as black on white. Copperplate and stipple are the strongest.
- **Nothing credible for six styles.** I found no usable code for xerox, 1-bit dithering, ASCII, blind emboss, guilloché or a true mezzotint. For these, use a keyword prompt, or make the style on Rueca's canvas and use Midjourney only for the subject.
- **Most free codes are not one tone.** Libraries are full of colour. I only list a code as "one tone" when I saw the thumbnail and it was one ink on one ground.
- **Colour should come from us, not from Midjourney.** Ask for black ink on white, let the code supply line and texture, then recolour in the canvas (Nogal, Achiote, a flat bright). That also solves cyanotype, blueprint and riso, whose colour is the hard part for a reference to carry.
- **The house style is a moodboard or an image pair, not a code.** Midjourney says a style code cannot be made from an uploaded image. See [Making our own house style](#making-our-own-house-style).

## Shortlist: historical styles that balance a modern UI

Rafael's steer (16 Oct): focus on styles with a real historical reference, and pick ones that can balance a modern UI. I read that as: the UI is flat, geometric, on a grid, in a clean sans. The art should be the opposite in temperament (cut by hand, serif-era, patient) while sharing its discipline (one ink, hairline rules, white or Lana ground). The pairing works when the plate sits on flat paper and the precision stays in the UI. Hendrick's and the Dropbox pencil-on-flat-colour work in the earlier note are the cautionary and positive precedents.

**The 12 to build the series around.** Dates are the usual textbook origins; check any you quote on a poster.

| # | Style | Historical anchor | Why it balances a modern UI | Route | Lead candidate |
|---|---|---|---|---|---|
| 1 | Copperplate and steel engraving | Diderot's *Encyclopédie* plates (1751 to 1772); steel plates from the 1820s | Fine even line is the print cousin of a hairline border. The subject is already "a tool and its parts". | Midjourney | house image pair; `2140522837`, `480609751` |
| 2 | Wood engraving | Thomas Bewick, 1790s, end-grain boxwood | Bold black masses with white cuts: strong at small size, where fine copperplate fades. | Midjourney | `3161511849`, `3717653854` |
| 3 | Woodcut | Dürer and the German woodcut, c.1500; Japanese woodblock | Hard-edged and graphic, sits next to flat colour blocks and sans type without fuss. | Midjourney | `3714080446`, `721212903` |
| 4 | Stipple | Bartolozzi and the English stipple engravers, 1770s; later newspaper hedcuts | Tone made of dots echoes pixels and dither, so it bridges old and digital. | Midjourney | `2162082566` (best find) |
| 5 | Mezzotint and aquatint | Mezzotint, 1640s; aquatint, 1760s and Goya | The one soft, dark tonal style in the set; a counterweight to the flat UI. | Canvas, with Midjourney as a start | `3190678964` (closest, not true) |
| 6 | Cyanotype | Anna Atkins, *British Algae*, 1843 | A single ink and a botanical subject: it fits the dye-plant story and gives a cool counter to Achiote. | Midjourney for line, canvas for colour | `2437183870`, `3493907939` |
| 7 | Blueprint | Herschel's process, 1842; engineering drawing from the 1870s | Already the visual language of specs and rulers; the most natural bridge to the kit's own UI. | Canvas, with Midjourney lines | `67741596` |
| 8 | Silhouette and paper cut | Named after Étienne de Silhouette, 1750s; German and Swiss *Scherenschnitte* | Solid shapes need no detail, so they read at icon size next to UI chrome. | Midjourney | `10078`, `4071460530` |
| 9 | Contour lines | Dupain-Triel's first contour map of France, 1791 | Maps and maths at once; also the shape of a height field the canvas can draw exactly. | Canvas | `3377735622` as a look target |
| 10 | Guilloché | Banknote and watch-dial engraving, 19th century | Pure geometry made by a machine: the most "tool-like" decoration in the set. | Canvas | none; draw it |
| 11 | Linocut | Die Brücke and Matisse, early 1900s | Chunkier and warmer than wood engraving; good for large poster fields. | Midjourney | `1716739391`, `3714080446` |
| 12 | Blind emboss and letterpress | Blind tooling in bookbinding; letterpress deboss | A near-invisible material layer: an accent that lets the UI stay loud. | Canvas | none; emboss from our alpha |

**Why these and not the others.**

- Left out as modern print or office-era looks: halftone (Ives, 1881, but now a pop-poster look), risograph (1980s), xerox (1960s), 1-bit dither and ASCII (computing, 1960s to 1980s), plotter (1960s), op-art moiré (1960s) and stencil. They fit a loud, digital poster series, and the earlier sections still cover them. They work against a calm, historical identity.
- **Stipple is the bridge.** It is 18th-century by origin, and its dots read as pixels. It makes the old-to-new link without leaving the period.
- **Blueprint, contour and guilloché are the UI-adjacent three.** They are historical, but they speak in grid, line and measurement, so they sit most comfortably beside inspector panels and rulers.
- **Mezzotint is the only real tonal contrast** in the series. Keep it, but expect to build it on the canvas.

**One treatment for all twelve.** Render or draw in near-black on white, key the white to transparent with `ink.py`, and set the plate on Lana paper. Add one flat bright behind or beside it (Achiote, Malva or a cyan from the palette), never inside the line. This is the same rule as the engravings already in use: lines stay lines, colour belongs to the shape.

**Poster series note.** Pair each style with a matching historical subject so the poster is an argument, not a filter: the achiote sprig as cyanotype, a malacate as steel engraving, the dye vats as wood engraving, a spindle as blueprint. That matches the brand's dye-and-spindle workshop direction.

## How `--sref` works now (read this before testing)

Facts from Midjourney's own docs ([Style Reference](https://docs.midjourney.com/hc/en-us/articles/32180011136653-Style-Reference), [Moodboards](https://docs.midjourney.com/hc/en-us/articles/39193335040013-Moodboards), [Style Creator](https://docs.midjourney.com/hc/en-us/articles/41308374558221-Style-Creator), [Version](https://docs.midjourney.com/hc/en-us/articles/32199405667853-Version)):

- The default model is **V8.2** (released 24 Jul 2026). Style reference, style codes, `--sw`, `--style raw`, `--stylize` and moodboards are all marked as working in V6, V7 and V8.1/8.2.
- `--sw` runs 0 to 1000, default 100. In V7 the docs say style weight has more effect with codes than with images. Not tested for V8.2.
- A reference can be a code (`--sref 2162082566`), an image URL (`--sref https://...`), or several of either. Several codes can be weighted: `--sref 111::2 222::1`.
- Docs advice: keep the text prompt simple and describe the content, not the style. Add style words only if the look is hard to reach.
- `--sref random` mines a new code; it turns into a number once submitted.
- Moodboards (`--p <id>`) **cannot** be combined with `--sv` or `--sw`. The `--stylize` value sets how much of a moodboard shows.

Facts from third parties, not Midjourney's docs (a [Substack explainer of the V7 change](https://geekycuriosity.substack.com/p/midjourney-complete-overview-of-the)):

- In V7, uploaded images offered `--sv 1` to `--sv 6`. Codes only work with two: **`--sv 4` for "legacy" codes** found before 16 June 2025, and **`--sv 6` (the default) for newer codes**. The same legacy code gives a different result without `--sv 4`.
- Only one `--sv` value can apply to a whole prompt, so don't mix old and new codes in one prompt.

**What I could not confirm:** how `--sv` behaves in V8.1 and V8.2. The docs page lists the V7 and V6 version charts only as images. Treat `--sv 4` against `--sv 6` as something to test per code on V8.2.

**What Midlibrary does with it.** When you press "Copy SREF code" on [Midlibrary](https://midlibrary.io/sref-codes), the copied text for newer entries already carries the flag, for example `--sref 1077786441 --sv 4`. Older entries copy as a bare code. I record exactly what the button copies in the tables below. For a bare code, the version is unconfirmed, so test both.

## How to read the tables

- **Flag** is what Midlibrary's copy button gave: `bare` or `--sv 4`.
- **Seen** means I looked at the Midlibrary sample thumbnail. Those samples use Midlibrary's own "artwork" prompt, not ours, so they show the code's look, not how it handles a plant or a spindle.
- **Listed** means I only have a third-party description, not an image.
- **One tone?** is my judgement from the thumbnail: yes (one ink, one ground), almost (one ink plus a tinted ground or light grey) or no.
- **Source** for Midlibrary codes is the filtered list that shows the sample. Open it and find the code in the grid. Sort links: add `&sorting=a-z`, `z-a`, `oldest-first` or `newest-first`, since each view shows about 72 cards.

Midlibrary filter pages used:
[bw-monochrome](https://midlibrary.io/sref-codes?filters=bw-monochrome) ·
[drawing](https://midlibrary.io/sref-codes?filters=drawing) ·
[patterns](https://midlibrary.io/sref-codes?filters=patterns) ·
[geometric](https://midlibrary.io/sref-codes?filters=geometric) ·
[bold-lines](https://midlibrary.io/sref-codes?filters=bold-lines)

## Style by style

Every keyword line below is a suggestion from my own knowledge of the techniques and a few third-party prompt pages. None is tested in Midjourney. Add `--style raw --stylize 50` as in the house recipe, and `--no colour, paper texture, border, text`.

### 1. Copperplate and steel engraving

Our own house pair already does this best (see the house recipe in `research/30-hand-and-engraving/README.md`). These are alternatives and variations.

| Code | Flag | Status | What it does | One tone? | Source |
|---|---|---|---|---|---|
| `2140522837` | bare | Seen | Fine pen-and-engraving line, a workshop interior with hatching, black on white. Closest to Rueca's dye-workshop idea. | yes | [bw-monochrome](https://midlibrary.io/styles/3410c4a) |
| `480609751` | bare | Seen | Technical engraved plate: an ornate architectural cutaway in clean black line on white. | yes | [drawing](https://midlibrary.io/sref-codes?filters=drawing&sorting=z-a) |
| `1962624673` | `--sv 4` | Seen | Victorian etching with a fine line and a moon-and-castle scene; a little grey in the shading. | almost | [bw-monochrome](https://midlibrary.io/sref-codes?filters=bw-monochrome&sorting=z-a) |
| `573839467` | unknown | Listed | "Vintage Engraving": heavy crosshatching and dramatic shadow. Third-party list. | unknown | [Moodboard newsletter](https://moodboard.beehiiv.com/p/10-midjourney-style-codes-you-can-copy-paste) |
| `1221014195` | unknown | Listed | Copperplate and woodcut-style parallel lines and crosshatching, blended with modern illustration. | unknown | [Substack list](https://underwoodxie.substack.com/p/3-must-try-midjourney-sref-codes-223) |

Keywords without a code: `copperplate line engraving, burin lines only, fine parallel hatching, cross-hatching, plain white paper`. Add `Diderot Encyclopédie plate` or `Victorian steel engraving` to push age. Avoid "etching" alone, which brings loose scribble.

### 2. Wood engraving

| Code | Flag | Status | What it does | One tone? | Source |
|---|---|---|---|---|---|
| `3161511849` | bare | Seen | Bold white-line cuts: a sunrise over a village, black on white. Reads as a real wood engraving. | yes | [bw-monochrome](https://midlibrary.io/styles/24d4ae7) |
| `3717653854` | bare | Seen | Framed landscape with radiating sun lines and dense black cuts. | yes | [bw-monochrome](https://midlibrary.io/styles/7846610) |
| `1619015900` | bare | Seen | Tree, lake and castle in black line on a cream ground. Good for the line, cream ground needs keying out. | almost | [bw-monochrome](https://midlibrary.io/styles/4a79e42) |
| `1077786441` | `--sv 4` | Seen | Dense black stippled and cut botanical (mushrooms), black on white. | yes | [bw-monochrome](https://midlibrary.io/sref-codes?filters=bw-monochrome&sorting=z-a) |

Keywords: `wood engraving, white-line engraving on end-grain boxwood, bold black masses, fine white cuts, Thomas Bewick`. Bewick as a name works as a style modifier in general use but is untested here.

### 3. Woodcut and linocut

| Code | Flag | Status | What it does | One tone? | Source |
|---|---|---|---|---|---|
| `721212903` | bare | Seen | Hard-edged woodcut portrait, thick black shapes, cream paper. | almost | [bw-monochrome](https://midlibrary.io/styles/ad97a66) |
| `3714080446` | bare | Seen | Block-print totem with birds, sun and waves; black on white. Strongest carved-block look. | yes | [patterns](https://midlibrary.io/sref-codes?filters=patterns) |
| `1716739391` | bare | Seen | A tile of carved squares and maze blocks in black on white. Good linocut texture, little subject. | yes | [patterns](https://midlibrary.io/sref-codes?filters=patterns) |
| `823214853` | bare | Seen | Japanese-style woodblock landscape in olive, yellow and cream. Not one tone, but colour-separable into inks. | no | [patterns](https://midlibrary.io/sref-codes?filters=patterns) |

Keywords: `linocut print, bold black carved shapes, visible gouge marks, rough edges, white ground`; for woodcut add `German Expressionist woodcut`. The docs-style advice applies: say what the picture is, and let the code carry the carved texture.

### 4. Mezzotint and aquatint

The weakest area. A real mezzotint is a velvet black ground with light burnished out of it. No code I saw does that. The nearest are dark, soft-toned ink looks, so treat these as "dark tonal print" and not mezzotint.

| Code | Flag | Status | What it does | One tone? | Source |
|---|---|---|---|---|---|
| `3190678964` | `--sv 4` | Seen | A glowing tunnel of trees pulled out of a black ground in soft ink tone. The closest to "light from dark". | yes | [bw-monochrome](https://midlibrary.io/sref-codes?filters=bw-monochrome&sorting=z-a) |
| `1170133511` | `--sv 4` | Seen | Soft smoky graphite, a hazy lit cave. Tone, not line. | yes | [bw-monochrome](https://midlibrary.io/sref-codes?filters=bw-monochrome&sorting=z-a) |
| `1645834821` | bare | Seen | Dark engraving of a hand, skull and clock on black. Heavy tone with an engraved edge. | almost | [bw-monochrome](https://midlibrary.io/sref-codes?filters=bw-monochrome&sorting=z-a) |

Keywords: `mezzotint, rocked black ground, burnished highlights, deep velvety black, soft tonal gradation from dark to light`; for aquatint, `aquatint, soft wash tones, atmospheric shading`. Wording taken from printmaking sources ([Tate glossary](https://www.tate.org.uk/learn/online-resources/glossary/m/mezzotint)), not from Midjourney guides. A bit of `--no line` may help keep it tonal.

Better route: a canvas pass. Rueca can build a rocked-ground grain and lift highlights out of an inked engraving.

### 5. Stipple

| Code | Flag | Status | What it does | One tone? | Source |
|---|---|---|---|---|---|
| `2162082566` | bare | Seen | **Best find.** A cloud, hill and tree landscape drawn only with black dots on white. A true stipple. | yes | [bw-monochrome](https://midlibrary.io/sref-codes?filters=bw-monochrome&sorting=z-a) |
| `1077786441` | `--sv 4` | Seen | Dense stippled and cut botanical, black on white (also under wood engraving). | yes | [bw-monochrome](https://midlibrary.io/sref-codes?filters=bw-monochrome&sorting=z-a) |
| `356965315 72544385 43130208` | bare | From Trove | "Soft-focus stippled landscapes in saturated rainbow gradients with lone silhouettes." Dot texture is right, colour is not. | no | [@sergeantsref](https://x.com/sergeantsref/status/2022822161753178562) |

Keywords: `stipple engraving, hedcut, dots only, no lines, no outlines, shading by dot density` (the Wall Street Journal hedcut idea, see the hand-and-engraving note).

### 6. Halftone dots

| Code | Flag | Status | What it does | One tone? | Source |
|---|---|---|---|---|---|
| `3167511387` | `--sv 4` | Seen | "Halftone Streetscape": a black portrait built from fine halftone and scan lines on a black ground. | yes (dark) | [bold-lines](https://midlibrary.io/sref-codes?filters=bold-lines&sorting=z-a) |
| `6822079494 6021172489` | bare | From Trove | "Blown-out halftone dot grain, blurred motion and red/blue Nike-era sports poster colour." Strong dots, but colour and motion blur. | no | [@sergeantsref](https://x.com/sergeantsref/status/2021144607875121509) |
| `359163792` | `--sv 4` | Seen | "Halftone Cosmic Heritage": a collage with halftone texture, many colours. | no | [geometric](https://midlibrary.io/sref-codes?filters=geometric&sorting=z-a) |
| `2395769938` | unknown | Listed | "Geometric Collage Mix": layered shapes with halftone texture in black, teal and pink. | no | [Moodboard newsletter](https://moodboard.beehiiv.com/p/10-midjourney-style-codes-you-can-copy-paste) |

Keywords: `coarse halftone dot screen, black dots on white, newsprint, 45 degree screen angle`. Midjourney draws the idea of dots, not an exact screen. For clean dots on a tone ramp, the canvas does this exactly (Trove's halftone tag is full of examples of the real thing).

### 7. Line-screen

| Code | Flag | Status | What it does | One tone? | Source |
|---|---|---|---|---|---|
| `220263888` | bare | Seen | "Monochrome Line Artistry": a sunset and hills drawn as horizontal black lines that swell and thin. A genuine line-screen. | yes | [bold-lines](https://midlibrary.io/sref-codes?filters=bold-lines&sorting=z-a) |
| `2011114681` | `--sv 4` | Seen | "Rhythmic Op Art Textures": a portrait of fine engraved parallel lines in red on red. One ink colour. | yes (red) | [bold-lines](https://midlibrary.io/sref-codes?filters=bold-lines&sorting=z-a) |
| `3377735622` | bare | Seen | Flowing black contour lines forming a face. Line-screen that follows form. | yes | [patterns](https://midlibrary.io/sref-codes?filters=patterns) |

Keywords: `line screen, parallel lines varying in thickness to build tone, no outlines, black on white`.

### 8. Risograph, single colour

| Code | Flag | Status | What it does | One tone? | Source |
|---|---|---|---|---|---|
| `533932399` | bare | Seen | "Polka-Dot Abstraction": red dots and shapes on cream paper, one ink and a grain you can see. Pattern, not subject. | yes (red) | [patterns](https://midlibrary.io/sref-codes?filters=patterns) |
| `2011114681` | `--sv 4` | Seen | Red monotone engraved portrait (see line-screen). | yes (red) | [bold-lines](https://midlibrary.io/sref-codes?filters=bold-lines&sorting=z-a) |

No code I found is a proper single-ink riso picture. Keywords to test (vocabulary from prompt pages for other tools such as [Morphic](https://morphic.com/resources/images/risograph-illustration-image) and [Magic Hour](https://magichour.ai/templates/details/cmtadidom0601jl0143bt1xue-riso-print), not Midjourney sources): `risograph print, one spot ink, grainy soy-ink texture, slight misregistration, flat fill, paper grain, halftone`. Ask for one ink and watch for a second colour sneaking in.

Riso is mostly flat colour plus grain. The cheapest honest route is render black on white in Midjourney, then fill and grain on the canvas.

### 9. Cyanotype

| Code | Flag | Status | What it does | One tone? | Source |
|---|---|---|---|---|---|
| `2437183870` | bare | Seen | "Cyanotype Elegance": a cell-like abstract in deep blue and pale ground. The tone is right; there is no subject. | yes (blue) | [patterns](https://midlibrary.io/sref-codes?filters=patterns) |
| `3493907939` | `--sv 4` | Seen | "Precise Engraving Vision": a fine engraved peony in one blue ink on white. A blue engraving more than a cyanotype. | yes (blue) | [drawing](https://midlibrary.io/sref-codes?filters=drawing&sorting=z-a) |
| `2072286150` | unknown | Listed | "Blueprint Cyanotype": white sketch lines on deep Prussian blue. Third-party list. | unknown | [Moodboard newsletter](https://moodboard.beehiiv.com/p/10-more-styles-to-steal) |

Keywords: `cyanotype photogram, Prussian blue on white, sun print, botanical specimen, Anna Atkins`. Untested. A real cyanotype is white subject on blue ground, so decide up front which way round we want it.

### 10. Blueprint

| Code | Flag | Status | What it does | One tone? | Source |
|---|---|---|---|---|---|
| `67741596` | `--sv 4` | Seen | "Blueprint Lattice": a white wireframe head on royal blue. One ink, fine lines. | yes (blue) | [geometric](https://midlibrary.io/sref-codes?filters=geometric&sorting=z-a) |
| `2072286150` | unknown | Listed | White sketch lines on deep blue (see cyanotype). | unknown | [Moodboard newsletter](https://moodboard.beehiiv.com/p/10-more-styles-to-steal) |
| `35639047` | unknown | Listed | "Technical Sketch": black-and-white drafting with annotations and measurements. The annotations will break our no-lettering rule. | unknown | [Moodboard newsletter](https://moodboard.beehiiv.com/p/10-more-styles-to-steal) |

Keywords: `blueprint, white line drawing on blue paper, technical drawing, orthographic, no text, no dimensions`. Midlibrary also has a ready benchmark prompt named "blueprint design" in its prompt menu, which is a quick way to see any code's blueprint behaviour.

### 11. Xerox and photocopy

No code found. The nearest are high-contrast black-and-white ink looks, and none of them has toner grain.

| Code | Flag | Status | What it does | One tone? | Source |
|---|---|---|---|---|---|
| `3007622731` | `--sv 4` | Seen | "Cosmic Noir Linework": cut-and-paste black-and-white panels with ink splatter. Reads as zine collage. | yes | [bold-lines](https://midlibrary.io/sref-codes?filters=bold-lines&sorting=z-a) |
| `4176850383` | `--sv 4` | Seen | "Chromatic Gothic Etching": hard black-and-white ink portrait, Beardsley-like. | almost | [bw-monochrome](https://midlibrary.io/sref-codes?filters=bw-monochrome&sorting=z-a) |

Keywords (vocabulary from [effect.app](https://effect.app/effects/xerox), [Morphic](https://morphic.com/resources/images/zine-cover-image) and [youmind](https://youmind.com/prompts/monochrome-carbon-dust-particle-art-29656), not Midjourney sources): `high-contrast black-and-white photocopy, toner grain, xerox artefacts, crushed blacks, blown-out highlights, zine`. The canvas can fake this with threshold, noise and a streak mask, so this style is a poor use of Midjourney time.

### 12. 1-bit dithering

No code. Midjourney does not hit a strict bit depth: a forum user trying a 1-bit game image got black-and-white pixel-art feel but not true two-level output ([tinkerdifferent thread](https://tinkerdifferent.com/goto/post?id=23366)).

| Code | Flag | Status | What it does | One tone? | Source |
|---|---|---|---|---|---|
| `3529059663 3509547948 642725741 575886827` | bare | From Trove | Four-code stack: heavy dithered grain over flat electric green and cyan, silhouette landscapes. The grain is the look; the colour is not ours. | no | [@sergeantsref](https://x.com/sergeantsref/status/2019904687642960372) |

Keywords: `1-bit dithered bitmap, black and white only, Bayer ordered dither, Atkinson dither, Macintosh`. Expect near misses. Recommended route: take a Midjourney or canvas image and threshold with Floyd-Steinberg or Bayer in Rueca's own tool. That is exact, and it is already the thing Trove's dithering tag is full of.

### 13. ASCII

No code, and Midjourney cannot set a character grid. `ASCII art` as a keyword gives something that looks like text but is not a real character mosaic ([prompt cheat sheet](https://levelup.gitconnected.com/the-ultimate-cheat-codes-to-midjourney-prompting-part-1-ed44aca3cab6)).

Route: render a Midjourney subject, then convert it to characters on the canvas (brightness to glyph ramp). Trove has the visual targets: the Racinet vessel engravings refilled with ASCII ([@enigmatriz](https://x.com/enigmatriz/status/2109422341818290622)) and Anthropic's engraving-plus-ASCII collage ([thread](https://x.com/liamjmcgregor/status/2074852273100877962)). Those are references for us, not for `--sref`, and are copyrighted work by others.

### 14. Plotter or pen line art

| Code | Flag | Status | What it does | One tone? | Source |
|---|---|---|---|---|---|
| `8732` | bare | Seen | "Minimalist Line Art": monoline pipes and machines on white, even stroke weight. The closest to a plotter drawing. | yes | [bw-monochrome](https://midlibrary.io/styles/1e6e25d) |
| `154073709` | bare | Seen | Pen line city with a radial burst, black on white, sparse. | yes | [drawing](https://midlibrary.io/sref-codes?filters=drawing&sorting=z-a) |
| `2337176700` | bare | Seen | One broken contour stroke, almost no content. Useful as a weight and spacing reference. | yes | [drawing](https://midlibrary.io/sref-codes?filters=drawing&sorting=z-a) |
| `3264578827` | bare | Seen | Continuous-line portrait in black on cream. | almost | [bw-monochrome](https://midlibrary.io/styles/c0832b0) |
| `4083046610` | bare | Seen | White single line on black. Inverted monoline. | yes | [bw-monochrome](https://midlibrary.io/styles/43cd1a1) |

Keywords: `pen plotter drawing, single weight black fineliner, no shading, no fill, vector line art, white background`.

### 15. Contour lines

| Code | Flag | Status | What it does | One tone? | Source |
|---|---|---|---|---|---|
| `3377735622` | bare | Seen | Flowing black contour lines that make up a face, like a topographic map of skin. | yes | [patterns](https://midlibrary.io/sref-codes?filters=patterns) |
| `8130` | bare | Seen | "Geometric Precision Artistry": a face built from fine wireframe contour hatching, grey-black on white. | almost | [drawing](https://midlibrary.io/sref-codes?filters=drawing&sorting=z-a) |
| `1668053434` | unknown | Listed | "ContourRendering": monochrome, often deep red or blue, fine wireframe-like contour lines. I could only read a search snippet; the page itself blocked me. | unknown | [Toolify listing](https://www.toolify.ai/midjourney-library/sref/contourrendering) |

Keywords: `topographic contour lines, elevation map, evenly spaced closed curves, black on white`. Rueca's canvas can draw true contours (marching squares) from any height field, which beats any code for accuracy.

### 16. Op-art moiré

| Code | Flag | Status | What it does | One tone? | Source |
|---|---|---|---|---|---|
| `794629902` | `--sv 4` | Seen | "Monochrome Convergence Suite": black-and-white concentric and spirograph-like line patterns wrapped around a portrait. | yes | [geometric](https://midlibrary.io/sref-codes?filters=geometric&sorting=z-a) |
| `3142249590` | bare | Seen | Black-and-white stripes and checks on a figure, a fashion op-art look. | yes | [geometric](https://midlibrary.io/sref-codes?filters=geometric) |
| `2011114681` | `--sv 4` | Seen | Red parallel-line portrait (see line-screen). | yes (red) | [bold-lines](https://midlibrary.io/sref-codes?filters=bold-lines&sorting=z-a) |

A code named "Scarlet Nouveau Moiré" (`600001111`, `--sv 4`) exists but its thumbnail is a pen-and-ink portrait with red accents, not moiré, so I'm not listing it as a candidate. Keywords: `op art, Bridget Riley, moiré interference pattern, black and white stripes, optical illusion`. Real moiré needs two overlapping grids; generate it on canvas and use the result as an image reference if the subject needs it.

### 17. Guilloché

No code found. This is a geometric pattern from a rose engine, so it suits maths better than Midjourney.

| Code | Flag | Status | What it does | One tone? | Source |
|---|---|---|---|---|---|
| `794629902` | `--sv 4` | Seen | The nearest in feel: concentric spirograph-like linework (see op-art). | yes | [geometric](https://midlibrary.io/sref-codes?filters=geometric&sorting=z-a) |
| `4071460530` | bare | Seen | Symmetrical black ornament, a mask-like motif. Ornament, not guilloché. | yes | [bw-monochrome](https://midlibrary.io/styles/1320dd8) |

Keywords: `guilloche engraving, banknote security pattern, interlaced rosettes, fine concentric lines`. Route: draw the guilloché in Rueca (it is epitrochoid maths), then use the image as an image-URL `--sref` for the subject renders.

### 18. Silhouette and paper cut

| Code | Flag | Status | What it does | One tone? | Source |
|---|---|---|---|---|---|
| `10078` | bare | Seen | "Silhouette Elegance": a black paper-cut forest scene with a wolf, on a kraft ground. A true cut-paper look. | almost | [bw-monochrome](https://midlibrary.io/sref-codes?filters=bw-monochrome&sorting=z-a) |
| `4071460530` | bare | Seen | Black symmetrical cut ornament, no ground. | yes | [bw-monochrome](https://midlibrary.io/styles/1320dd8) |
| `8654` | bare | Seen | Black ink silhouette of a face, rough edges. | yes | [bw-monochrome](https://midlibrary.io/styles/2711ab3) |
| `3408109215` | bare | Seen | Tiny white silhouettes scattered on black. Good for a night-sky or all-over pattern. | yes | [patterns](https://midlibrary.io/sref-codes?filters=patterns) |

Keywords: `black paper cut silhouette, scherenschnitte, solid black shapes, no interior detail, white ground`. Silhouettes are the style Midjourney does most reliably without a code.

### 19. Stencil

| Code | Flag | Status | What it does | One tone? | Source |
|---|---|---|---|---|---|
| `1872735488` | bare | Seen | "Geometric Monochrome Abstraction": hard black cut shapes on a pale ground, with bridges. Reads as a stencil sheet. | yes | [geometric](https://midlibrary.io/sref-codes?filters=geometric&sorting=z-a) |
| `1716739391` | bare | Seen | Carved black squares (see linocut). | yes | [patterns](https://midlibrary.io/sref-codes?filters=patterns) |

Keywords: `spray paint stencil, single layer, black on white, stencil bridges, high contrast, rough edges`.

### 20. Blind emboss

No code. A blind emboss is white paper pressed into relief, so the picture is only light and shadow. A style reference carries colour, medium and texture, and there is almost no colour to carry. I found only a paywalled Patreon note about a "monochrome relief with embossed metallic waves" ([Patreon](https://www.patreon.com/posts/159949107)), and I could not see the code.

Keywords: `blind embossed paper relief, white on white, raking light, soft shadows, letterpress deboss, cream cotton paper`. The result will be inconsistent.

Best route: take our inked engraving (transparent PNG) and emboss it on the canvas from its alpha as a height map. That is exact and can be lit from the upper left like the engravings. Trove's St George blind-emboss example ([are.na/block/29659225](https://www.are.na/block/29659225)) is the visual target.

## Which styles need the canvas, not Midjourney

| Style | Why | Midjourney's role |
|---|---|---|
| ASCII | needs a real glyph grid | make the subject only |
| 1-bit dithering | needs exactly two levels | make the subject only |
| Halftone, line-screen | wants exact dot and line pitch | optional subject |
| Contour lines | exact curves are easy in code | optional |
| Moiré, guilloché | pure geometry | none, or an image reference |
| Xerox | threshold, noise and streaks are easy | optional |
| Blind emboss | height map from alpha | none |
| Blueprint, cyanotype, riso | the colour is a fill | line source, recoloured after |

Midjourney earns its place on engraving, wood engraving, woodcut, linocut, stipple, silhouette and paper cut, where the hand matters and a code actually exists.

## Making our own house style

Options in Midjourney, best first:

1. **Image-URL pair (already in the recipe).** Two of our clean outputs as `--sref <url1> <url2> --sw 100`. It held one family across three plants in the last test. Weakness: Wikimedia links failed to load, so host the references on Midjourney's CDN (use the `cdn.midjourney.com` links we already have). Make one pair per style, each from near-black on white outputs with no letters.
2. **Moodboard.** Upload 10 to 20 of our clean plates for one style on the [Moodboards page](https://docs.midjourney.com/hc/en-us/articles/39193335040013-Moodboards), then use `--p <id>`. It gives a code that keeps working, even if you later add images (each change makes a new code). Limits: no `--sw`, no `--sv`; `--stylize` sets the strength. Good for a house look across many prompts. Needs a Midjourney account action that I did not take.
3. **Style Creator.** The [Style Creator](https://docs.midjourney.com/hc/en-us/articles/41308374558221-Style-Creator) makes a custom `--sref` code by picking from rounds of image grids. It costs GPU time and does not accept uploads, but you can start it from a style description or an existing code (for example `2140522837`). Stacking: if the prompt already has a code, the new code adds to it and both stay active, so keep both numbers.
4. **Random mining with a fixed prompt.** `--sref random` on a fixed prompt, keep what looks right. Slow, and good only for discovery.

Rules that keep it one tone:

- Use references with a **white ground, one near-black ink and no lettering**. Colour, paper tone and borders in a reference leak into every render. The earlier "old engraving" reference brought back yellow paper and heavy tone.
- Keep the **prompt about the subject**, not the style. The docs say extra style words fight the reference.
- Keep `--style raw --stylize 50` as in the v2 recipe. If the style is too thin, raise `--sw` (100 to 200) before adding words.
- After the render, **ink to near-black on transparent** with the existing `brand/tools/ink.py` step, then recolour in the canvas. This is what makes 12 styles read as one family.
- Name each set: code or URL pair, seed, ratio, `--sv`, and the three test subjects used. Put it in the lámina's notes so a style can be re-run months later.

## Suggested first test pass (for the main session)

One fixed subject (the achiote sprig), one fixed seed, same `--ar 4:5 --style raw --stylize 50`, white ground, no lettering.

1. For each seen code in the sections above, run it bare, then `--sv 4` for the bare ones, then `--sv 6` for the tagged ones. That tells us whether the flag matters on V8.2.
2. At the best flag, try `--sw` 50, 100 and 200.
3. Score each on: one ink, white ground, no letters, a clear subject. Keep the top one or two per style.
4. Build image pairs or a moodboard from the winners to make the house version.
5. For the canvas-only styles, skip Midjourney and render on the canvas.

Quickest wins to test first: `2162082566` (stipple), `3161511849` (wood engraving), `2140522837` (copperplate workshop), `220263888` (line-screen), `10078` (paper cut), `3377735622` (contour), `8732` (plotter), `67741596` (blueprint).

## What I could not get

- **Midjourney itself.** I did not run anything or open the Style Explorer, as instructed. Midjourney's own Explore page, with search, is signed in only in the built-in browser and may hold better codes for the six empty styles.
- **Paywalled lists.** The Patreon packs by ai-art-tutorials.com and the Gumroad collections (for example "35 Black and White Srefs") hide their codes. [promptsref.com](https://promptsref.com/discover?page=1) needs a sign-in for search. I did not make accounts.
- **X posts.** I did not open any tweets. The four @sergeantsref entries in this note come from Rafael's Trove summaries, so their thumbnails are unverified. Trove had halftone, dither and stipple codes only; its other tags (moire, risograph, line-drawing, ascii-art) held image references and no codes.
- **Midlibrary's keyword search.** It showed nothing for woodcut and the engraving search would not render, so I have no Midlibrary-verified keyword list. Keyword lines here come from technique knowledge plus the third-party pages cited.
- **`--sv` on V8.2.** See above.

## Sources

- Midjourney docs: [Style Reference](https://docs.midjourney.com/hc/en-us/articles/32180011136653-Style-Reference), [Moodboards](https://docs.midjourney.com/hc/en-us/articles/39193335040013-Moodboards), [Style Creator](https://docs.midjourney.com/hc/en-us/articles/41308374558221-Style-Creator), [Version](https://docs.midjourney.com/hc/en-us/articles/32199405667853-Version)
- [Midlibrary SREF codes](https://midlibrary.io/sref-codes) and its [deep dive on sref codes](https://www.midlibrary.io/midguide/deep-dive-into-midjourney-sref-codes) (style weight 0 to 1000, weighting syntax, image URLs)
- [V7 sref explainer](https://geekycuriosity.substack.com/p/midjourney-complete-overview-of-the) (`--sv 4` and `--sv 6`)
- Code lists: [Moodboard newsletter 1](https://moodboard.beehiiv.com/p/10-midjourney-style-codes-you-can-copy-paste), [Moodboard newsletter 2](https://moodboard.beehiiv.com/p/10-more-styles-to-steal), [Substack list](https://underwoodxie.substack.com/p/3-must-try-midjourney-sref-codes-223), [Toolify ContourRendering](https://www.toolify.ai/midjourney-library/sref/contourrendering)
- Rafael's Trove (via the x-book tool): the @sergeantsref posts linked above
- Printmaking vocabulary: [Tate on mezzotint](https://www.tate.org.uk/learn/online-resources/glossary/m/mezzotint)
- Prompt vocabulary for other tools, reused as untested Midjourney keywords: [Morphic](https://morphic.com/resources/images/risograph-illustration-image), [Magic Hour](https://magichour.ai/templates/details/cmtadidom0601jl0143bt1xue-riso-print), [effect.app xerox](https://effect.app/effects/xerox), [youmind](https://youmind.com/prompts/monochrome-carbon-dust-particle-art-29656)
