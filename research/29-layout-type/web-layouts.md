# Web layouts between editorial and SaaS

Collected 16 Oct 2026 for the landing page and docs. The question: what grids and page shapes do sites use when they want magazine craft and product clarity at once, and what can Rueca take from them?

## How this was gathered

- **Measured, not guessed.** I opened each page in the built-in browser at 1440 by 900 and read the computed styles: grid tracks, column gaps, container widths, margins, and the font size and line height of the headline, lede, body and caption text. Column spans (for example "cols 4 to 9") are my arithmetic from those track sizes, and I checked that they land on the pixel. Nothing was signed into. The one cookie banner I met (Pentagram) was left alone.
- **Snapshot, not spec.** These are live sites on one day, and several are fluid (Anthropic's margins are percentages, for example). Treat every number as "about this", and as a position in a range, not a target to copy.
- **Galleries.** Godly (which now redirects to recent.design), Siteinspire, Minimal Gallery and Typewolf were fetched as text, so they could give me lists but not layouts. They were useful for finding sites. Typewolf's recent picks led me to Speakeasy, and Typewolf also lists Every (Signifier plus Switzer). None of the galleries' own layouts is worth borrowing: each is a plain vertical feed of thumbnail cards.
- **Sibling note.** `trove-layouts.md` in this folder covers Rafael's saved references (mostly print). This file covers real, live web pages, so the two should be read together.
- **Not usable or not reached.** Rauno Freiberg's site is a spatial canvas with no grid to measure. Cosmos, Fey (now a "joined Wealthsimple" notice), Spek, Vercel, Readwise Reader, Family and The Browser Company were looked at, and each has a line in the "Also checked" table near the end. Figma Config was not reached.
- **Where Rueca stands today** (read from `src/landing/`): one 1128px sheet with hairline rails and crosshairs, a centred 820px hero with the Goudy headline at `clamp(43px, 9.8vw, 116px)` and leading 0.82, a 5/7 split for the FAQ, install and credits sections, a 3-up kit grid, and reading text at 12.5 to 13.5px in the cards, FAQ and credits, with the hero lede at 17 to 19px.

## Reading the entries

Each entry lists: the URL, **Grid** (columns, gutter, margin, max width at 1440), **Hero**, **Type** (sizes in px, size/leading), **Margin column** (any sidenote or rail), **Images** (how product shots and illustrations sit) and **Steal** (one move for Rueca). Rules from `brand/RUECA.md` that bear on the steals: accents never fill a background, at most two bright blocks per layout, no gradients or shadows, Goudy never bold, and body copy is Plex Sans.

---

## 1. Stripe Press

https://press.stripe.com and a book page, https://press.stripe.com/poor-charlies-almanack

- **Grid.** The home page has no column grid at all: a single 3D stack of book spines is centred on a dark field. A book page uses a 3-column grid, 364.8px columns with a 57.6px gap (4 rem), a 1210px grid inside a 1280px maximum, so margins are about 115px at 1440. Running text is capped at 380px, with 480px for wider blocks.
- **Hero.** There is no headline. A two-line masthead sits top left (the name at 17.6px, the tagline at 16px, both Ivar Headline 600), and the object is the hero. On a book page the whole page background becomes the book's own colour (an olive for this one).
- **Type.** Ivar Text for nearly everything: 17/25.5 at weight 500 for body, 25/37.5 for pull quotes and the big statement, 30 and 48 for display, 13 to 15 for small print. A short ladder, with a big jump from 17 to 30.
- **Margin column.** None. The two empty thirds are the margin.
- **Images.** On the home page the books are 3D objects in one stack. A book page is very long (about 64,000px) and is built from repeated 3-column rows.
- **Steal.** Let the object own the page and cap the lede at about 380px (roughly 45 characters). Rueca's wheel plate could do what Stripe's book does: sit alone with a two-line masthead. The page-takes-the-product's-colour move clashes with Rueca's "accents are never backgrounds" rule, so adapt it: each shell's page gets a flat block of its one bright behind the plate, not a coloured page.

## 2. Stripe Sessions

https://stripesessions.com (linked from stripe.com/sessions)

- **Grid.** 24 columns, each 58.66px, with no gutters at all, and 16px margins. Content spans are chosen in whole columns: the lede is 12 columns wide (704px) starting at column 9, the "about" heading is 7 columns (411px) starting at column 1.
- **Hero.** A left-aligned headline over two lines (cols 1 to 15) with the date and venue as 14px meta text in the right-hand columns of the same band, then a full-width rounded image slot (still grey placeholder when I looked). Page ground is near-neutral paper, `#F9F7F7`, with one deep purple ink, which is close in spirit to Lana and Nogal.
- **Type.** Söhne variable at light weights: headline 100/85 at weight 250 with tracking -0.04em, section titles 60/51 (-0.03em), the lede 32/33.6 at weight 300, sub-heads 24/25.2, body 16, meta 14. Leading is 0.85 to 1.05 on everything large.
- **Margin column.** The empty left columns work as one: section titles hang in cols 1 to 7 and text starts at col 9, so every section has a built-in indented margin.
- **Images.** Full-width slots with rounded corners sit between the text bands.
- **Steal.** The meta strip beside the headline: three or four small facts (version, licence, shells, "free, open source") in 14px on the right of the hero, aligned to columns. It is a title block in Rueca's language, and it fills the space beside a two-line headline without adding another hero element.

## 3. Linear (home, changelog, Method)

https://linear.app, https://linear.app/changelog, https://linear.app/method

- **Grid.** Home: 12 columns with no gutter, 48px margins, 1344px wide, cells separated by 1px rules. Changelog: 12 columns, 77.3px, 32px gutters, 80px margins. Method: a 736px reading column and a 6-column index of 224px cells below.
- **Hero.** Home: centred, 64/64 Inter at weight 510 with -0.022em tracking, lede 15/24. **Method is the one to study: a 128/128 serif headline (Tiempos Headline 400), centred, under a small-caps kicker ("THE LINEAR METHOD"), then a 410px lede and a line drawing.** The page is dark, and a serif leads a developer tool.
- **Type.** Home ladder: 72 / 64 / 48 / 32 / 24 / 20 / 15 (body 24 leading) / 13 / 12 / 10, with 15 as the working size. Changelog: 48 for the page title, 32/36 for entry titles, 24 for sub-heads, 17/27.2 for body. Method labels are 13/19.5 at weight 510.
- **Margin column.** The changelog is the cleanest rail on the web: a date rail in the left 3 columns (with a dot on a vertical line) and the entry in columns 4 to 9 (624px at x=408), leaving columns 10 to 12 empty.
- **Images.** The home page holds its product UI in a 5-track app grid about 1070px wide. I did not see it render (the dark hero was still loading), so I have no view on the framing.
- **Steal.** Two. The Method hero is the shape of Rueca's own hero (serif at 116 to 128, small-caps kicker, short lede), so the Goudy sizing is on solid ground. And the changelog rail, which Rueca can use for the docs: step numerals or version dates in cols 1 to 3, text in cols 4 to 9.

## 4. Every

https://every.to

- **Grid.** 4 columns of 288px with 32px gutters inside a 1280px wrapper, margins about 96px. Articles come as a 4-up card row.
- **Hero.** A black masthead, then a full-bleed blue engraving (a fine hatched landscape on light paper) with a white framed card pinned in its centre, 392px wide: window chrome with three dots, a 64/64 serif headline, a 20/30 lede and a black button. The engraving is the hero image, and the text card sits on top of it.
- **Type.** Signifier (serif) for display: 64/64 with tracking about -0.04em, 44/38 for section titles (-0.045em, leading 0.86), 24 for card titles. Switzer for the text: 20/30 lede, 15/22.5 for meta, 14, 13 and 12 for small print.
- **Margin column.** None on the home page.
- **Images.** Card art sits above or under the card titles in the 4-up rows. I did not inspect it closely.
- **Steal.** An engraving that runs full-bleed with a small framed card on top, instead of an engraving boxed inside a frame. For Rueca: the Saxony wheel plate full-width behind the hero, a hairline-framed card (title-strip chrome, not window dots) carrying the headline and install command. It is the same plate-and-flat-block idea in one gesture, and the nearest peer to what Rueca is already doing.

## 5. Raycast

https://www.raycast.com

- **Grid.** A 1204px container for text and a 1392px, 5-column bento with 1px gaps (161.5 / 355 / 355 / 355 / 161.5), so the outer columns are narrow margins inside the grid. Two-column text sections use 440 and 679px with an 85px gap. Another section is 483 / 98 / 483.
- **Hero.** Centred 64/70.4 Inter at weight 600, an 18px lede, the Download button and a mono line below ("Install via Homebrew"). 
- **Type.** 64 / 56 / 32 / 24 / 20 / 18 / 16 / 14 / 13 / 12 and **a 10px Geist Mono label with 0.5px tracking.**
- **Margin column.** The narrow outer columns of the bento hold nothing but lines.
- **Images.** The bento is made of hairline cells, and I found mono labels of the form "FIG_0" at the top of it, so cells appear to be numbered like figures. The product art sits in the cells.
- **Steal.** The mono "FIG_n" label on each cell. Rueca already has plates and "Fig." captions in Plex italic, so this is an almost free tie between the kit's cells and the plates: a 10px mono tag in each corner, set in measure-pen grey.

## 6. Are.na

https://www.are.na

- **Grid.** 12 columns of 95.4px with 15px gutters and 65px margins (1310px wide). Hero text sits in columns 4 to 9 (648px at x=396); a tabbed feature block sits at the right, around 230px wide.
- **Hero.** Text only, on black. A sentence starting "Are.na is", then **a lettered list (a., b., c.)** in the same size as everything else, then two buttons. No illustration above the fold.
- **Type.** One size does nearly everything: 19.2/27.84 (about 2,500 characters), then 13 for small text and 14 or 16 for a few labels. Even the section heading is only 19.2 at weight 700.
- **Margin column.** None, but the empty four columns on each side act as one.
- **Images.** A framed screenshot of the app below the fold, with a tab list beside it that swaps the view.
- **Steal.** The lettered hero list. Rueca's callouts A to D (skill, prompt, kit, shells) can become the hero's own copy structure: the four lettered lines that say what it is, in Plex at 19px, with the Achiote circles from the plate matched to the letters. It makes the hero read as the plate's key.

## 7. Stack Overflow design site (Koto's rebrand)

https://stackoverflow.design/brand

- **Grid.** A documentation shell: a 288px sidebar and a content area up to 1280px (1152px wide with 32px padding at 1440). No column grid inside the content, just stacked rows.
- **Hero.** A 72px page title ("Brand") and a one-line lede, then an index of rows. Each row is a flat colour tile (logo, colour, typography, motion, each a bright block with its artwork cropped) about a third of the content width, with the section name beside it in about 22px.
- **Type.** A single family, Stack Sans Headline, with Stack Sans Text for small print: 72 / 28 / 22 / 18 / 14 / 12. Navigation is 14px with 300 weight.
- **Margin column.** The sidebar is the margin.
- **Images.** Tiles are cropped brand artwork on flat colour, cut by hairlines, each the same shape.
- **Steal.** The index row: a colour tile on the left, a name and a one-line description on the right, divided by hairlines. It is the right shape for Rueca's docs overview and for the shells gallery, and it carries the Mora palette without any gradients. The 288px sidebar is a sensible docs-nav width.

## 8. Teenage Engineering

https://teenage.engineering

- **Grid.** 12 columns with 66px margins and a 14.7px row gap (1308px wide at 1440), used for a footer index. The header is the real structure: six equal groups, each an icon, a label and a micro-list of links at about 9px.
- **Hero.** A full-bleed monochrome photograph (the New York store at night) under the six-group header. No headline.
- **Type.** A single custom face (te-20, weight 100 on the sample I measured): 26 / 20 / 19 / 16 / 9. The 9px micro-list is the signature.
- **Margin column.** None.
- **Images.** Photographs or product renders at full bleed, black and white, often with a thin outlined icon.
- **Steal.** A navigation that doubles as a catalogue: groups of icon, label and a tiny list of what is inside. For Rueca, the header could name the kit groups (Controls, Layout, Time) with their part counts in 9 to 10px mono. A weaker steal than the others, and the least relevant to a light paper page.

## 9. Klim Type Foundry

https://klim.co.nz

- **Grid.** 12 columns with 10px gutters and 20px margins (1400px grid, 104px columns). The tightest gutters in this study.
- **Hero.** A full-viewport flat colour field (a burnt orange) with nothing on it but a 16px caption bottom-left, "Die Grotesk", and a 16px black bar on top with the foundry name and "Fonts". The page is long (about 15,000px) and I only looked closely at the first field, so I can't say how colour changes below it.
- **Type.** **Everything is 16/19 (Söhne). The specimens, not the interface, do the stepping**, so there is effectively no UI type scale.
- **Margin column.** None, and no need for one: a caption and a name per tile.
- **Images.** Specimen images run edge to edge on a flat colour per release, with the caption under or over them in 16px.
- **Steal.** One UI size and a flat colour field as the opening. For Rueca: all running text on one size (15 or 16px Plex), with Goudy's size as the only variable. It is the opposite of a SaaS ladder, and it suits a brand that wants to feel printed. A colour field as a hero fits the "flat bright block" rule if the field is one of the four allowed grounds (Lana, Platino, Mora, Achiote).

## 10. Commercial Type

https://commercialtype.com

- **Grid.** 3 equal columns of 480px with no gutters, 21px outer margin on the lower rows. The top of the page is a stack of full-bleed colour bands, each about 360px tall (read from a screenshot), one per type family.
- **Hero.** The first screen is bands of flat colour (sky blue, aubergine, mint), each with a centred specimen word in the typeface it sells at 116 to 199px, and a 13px caption ("4 Families, 48 Styles"). A boxed white wordmark top left and a black nav bar top centre.
- **Type.** Specimens at 116, 182 and 199px; labels at 15, 13 and 21px. Two worlds: huge display and tiny captions, with nothing in between.
- **Margin column.** None.
- **Images.** The type is the image. Each band is one object on one flat colour.
- **Steal.** The band-per-product rhythm, with a centred specimen and a 13px count. For Rueca: the twelve shells as a stack of bands (or a 3-up of cells), each with a Goudy word as the specimen and "12 parts" beneath. To stay inside the "two brights per layout" rule, alternate Lana, Platino and one Achiote or Mora band instead of using six hues.

## 11. Pentagram (work index)

https://www.pentagram.com/work

- **Grid.** 3 columns of 456px with 12px gutters and 24px margins (1392px wide). A feature item takes 2 columns, 924px.
- **Hero.** A plain page title ("Work" at about 52px) and "Showing the latest 40 projects" at 13px. The grid is the hero.
- **Type.** Plain at 16 and 13. Item captions run 13/16 and sit under each image, quoted title first.
- **Margin column.** None.
- **Images.** Every image is cropped to the column, with the caption directly beneath and no frame. The 2-column feature breaks the rhythm once.
- **Steal.** The caption under every image, 13px, with the title in quotes and one line of description. Rueca's "Fig. n" captions could take this shape: a title, a half-line of what it shows, and no box. A 2-column feature every ninth cell keeps a plate grid from feeling like a spreadsheet.

## 12. Paco Coursey

https://paco.me

- **Grid.** The cleanest sidenote layout in this study: 3 columns of 192 / 640 / 192px with 24px gaps, 1072px in total, centred. The article sits in the middle column starting at x=400.
- **Hero.** A name and a one-line description, then lists. No image.
- **Type.** 16/28 body (a leading of 1.75), 14/20 for labels. Two sizes and almost nothing else.
- **Margin column.** The two 192px side columns were empty on the home page, so the page is centred by them. Inside the article, section headings sit in a 192px sub-column at the left of the 640px text. I did not confirm that other pages put notes in the side columns.
- **Images.** None above the fold.
- **Steal.** The 192 / 640 / 192 proportion itself (and the heading-left, text-right rhythm inside the text): a 640px text measure (about 75 characters at 16px) with margin columns about 30 percent of its width. This is the model for Rueca's docs ("Notebook with margin" below), with the pen notes in the right column.

## 13. Emil Kowalski

https://emilkowal.ski

- **Grid.** One 692px column (24px padding, so about 644px of text, with paragraphs held to 512px), centred. No grid.
- **Hero.** A name and a role in two small lines, a "Today" paragraph, then a "Projects" list of title plus one-line description pairs.
- **Type.** 14/23 for body and 16 for titles. That is all.
- **Margin column.** None. White space and small headings do the separating.
- **Images.** None.
- **Steal.** The title-plus-one-line-description pair for index lists, and the confidence of 14px text with 23px leading. It is the lower bound: Rueca's FAQ and credits already sit near it (12.5 to 13.5px), and Emil's page works because it has so little else on it.

## 14. Anthropic

https://www.anthropic.com

- **Grid.** 12 columns of 78.2px with 31.5px gutters and 78px margins (1285px, about 89 percent of the window), all fluid.
- **Hero.** A staggered split: the headline sits in columns 1 to 7 (736px) at the top, and a lede in a serif (24/33.6) sits lower in columns 8 to 12 (517px), so the two do not share a baseline. Below it, a huge rounded plate holds a pale illustration. Ground is warm paper, `#FAF9F5`.
- **Type.** An in-house sans for headings (61/67 at weight 700) and **an in-house serif for display and ledes**: 80/92 with -0.015em for large statements, 24/33.6 for the lede. Then 24 sans for card titles at weight 600, 18, 16, 15 and 12.
- **Margin column.** The empty columns 1 to 7 beside the lede.
- **Images.** A large rounded plate holding a light illustration, followed by a 3 or 4-up card row.
- **Steal.** The offset hero: headline in the left 7 columns, the lede and the install command in the right 5, starting a third of the way down. It breaks the centred axis without making the page busier, and it gives the pen annotation (the loop round the word) somewhere to travel.

## 15. Ramp

https://ramp.com

- **Grid.** 12 columns inside 1312px (64px margins, 24px gutters, columns of 87.3px). Its splits are 5 and 7 columns (533px and 755px), which is exactly Rueca's 5fr/7fr. Other sections use 3 columns of 421px and an 8-column grid with 1px gaps (162.9px cells) for logos and facts.
- **Hero.** Left-aligned: a 64/64 Lausanne headline over about 1050px, a small lede, an email field with a lime button, then a dotted-grid stage holding product cards at an angle. A promo strip runs along the very top.
- **Type.** 64 / 48 / 40 / 28 / 24 / 18 / 16 / 14 / 13 / 10, with 14/20 as the working size. A conventional SaaS ladder.
- **Margin column.** None.
- **Images.** The product sits on a dotted-grid stage, cards at a slight angle, as if laid on a desk.
- **Steal.** A dotted stage under the product, not a gradient or a glow. Rueca's equivalent is the plate's own grid of crosshairs and ruler ticks, so the stage already exists: the live tool could rest on a ruled area of the sheet, not on bare paper.

## 16. Mercury

https://mercury.com

- **Grid.** 16 columns of 56px with 32px gutters and 32px margins (1376px). Hero text spans columns 5 to 12 (672px); body blocks span 6 columns (496px).
- **Hero.** Centred headline (49/54 at weight 480, arcadiaDisplay) and a small lede over a full-bleed painted landscape (a desk and chair on a misty hill). The product is not in the hero at all, only mood.
- **Type.** 65 (display) / 49 / 42 / 32 / 28 / 24 / 21 / 18 / 16 / 12, with 12/16.8 and +0.02em tracking for legal and small print. Display leading is about 1.1.
- **Margin column.** None.
- **Images.** An illustration is the hero, and product screens arrive further down.
- **Steal.** A scene in place of a screenshot for the first screen: a place the product could live (a workshop with the wheel) with the copy centred over the quiet part. It supports Rueca's engraving-led brand, and the hill-and-desk image is a useful warning: a painted scene works best when the product's one object is small and placed.

## 17. Speakeasy

https://www.speakeasy.com

- **Grid.** 3-column sections with 1px hairline gaps at 1248px (96px margins), a wider 1344px 3-column at 48px margins, and a 4-column nested grid at 1102px. A 12-column footer with 8px gutters.
- **Hero.** Left-aligned, on black: a boxed notice in mono, a two-line headline at 79/79 in a **thin serif (Tobias at weight 100, tracking -0.035em)**, a 16 to 18px lede, a filled "Deploy for free" button and a ghost "Talk to us" button. A dotted halftone image of a hand fills the right half.
- **Type.** Tobias for display (86/88, 79/79, 35/35), ABC Diatype for text (16/24, 18, 20), ABC Diatype Mono in caps for labels and buttons.
- **Margin column.** None.
- **Images.** Halftone and dot-matrix art, rather than screenshots, in the hero and in cell backgrounds.
- **Steal.** Mono capitals for buttons and micro-labels beside a very light serif. For Rueca: set the install-line label and the title-strip fields in Geist Mono caps at 10 to 11px, so the Goudy headline is not the only thing speaking in a "printed" voice. The halftone hand is a close cousin of engraved hatching.

## 18. Craft

https://www.craft.do

- **Grid.** A 1080px container with 48px padding (so about 984px of content), a 4-column grid of 240px cells with 8px gaps for feature cards, and a 6-column footer of 160px columns with 40px gaps.
- **Hero.** Centred in a large rounded frame: a 66/66 serif headline (Untitled Serif, tracking -0.03em), a small button, and the app window rising from the bottom over a **paper-cut collage** (torn edges, ruled paper, scissor-cut shapes in pale colours).
- **Type.** Untitled Serif for display (66 / 54 / 46 with leading near 1.1) and Untitled Sans for text (16/22.4, weight 500, tracking -0.02em for nav and labels).
- **Margin column.** None.
- **Images.** The collage plate sits under the product.
- **Steal.** A hand-made plate under the product window: a physical collage, not a gradient, behind a real UI. Rueca's equivalent is the engraved wheel with the live shell in front of it. Craft shows how far the window can overlap the art (about a third of its height) before it starts to cover the art's point.

## 19. tldraw

https://tldraw.dev

- **Grid.** A 1024px column, 208px margins, with 2 columns (496px, 32px gap) or 3 columns (320px) for feature rows, and 4px gaps for tile grids. Hero copy sits in a 672px column.
- **Hero.** Left-aligned: a 48/45 headline (Archivo 600, tracking -0.02em), a 14/21 lede at 600px, a mono install chip ("npm create tldraw") and a text link, then a code block and a live canvas side by side.
- **Type.** 48 / 32 / 16 / 14 / 12 with 14 as the body. A very small ladder.
- **Margin column.** None.
- **Images.** The live thing is the image: a real, interactive canvas next to the code that makes it.
- **Steal.** Code and result side by side in one row, equal width. For Rueca this is the "prompt in, tool out" pair, and the page already has the pieces (the prompt, the skill, the live shell). It also confirms 14px as a body size for a tool whose readers are developers and designers.

---

## Also checked (not featured)

| Site | What I measured | Why it is not in the list |
|---|---|---|
| Vercel (vercel.com) | 12 columns, 97.7px, 20px gutters, 24px margins; headline 64/64 Geist at weight 400 and -0.06em, left-aligned, with a link list at the right; body 14 | A clean grid, but a standard dark SaaS page with no editorial layer |
| Readwise Reader (readwise.io/read) | 3-up of 414px with 34px gaps, 64px margins; 58/68 Inter at weight 600 centred; 1200px and 800px containers | A generic SaaS hero over a gradient; no serif display; the only serif I found is a Charter reference in the reader |
| Cosmos (cosmos.so) | Centred 2-line headline over a search bar on `lab(100 0 0)`; no grid measured (it is a masonry app) | Nothing to measure beyond "centred hero over a search field" |
| Fey (fey.com) | A single 21px notice; the product has joined Wealthsimple | Not a live product page |
| Spek (spek.app) | 1100px container, 5-col logos and a 4-col with 1px gaps, 38px headline | Standard SaaS (it surfaced through Minimal Gallery) |
| The Browser Company (thebrowser.company) | One 376px column holding a single 28px EB Garamond paragraph | A letter, not a layout; shows how little text a serif page can carry |
| Family (family.co) | 1072px container, 3-up of 320px with 32px gaps, centred 68/75 headline at weight 500 | A nice product page, but no editorial layer |
| Rauno Freiberg (rauno.me) | A zoomable spatial canvas with oversized type | No grid to measure |

## What the measurements say, across sites

- **Grids.** The common frame is 12 columns, gutters of 24 to 32px and margins of 48 to 96px, with a 1280 to 1344px wrapper (Linear, Ramp, Anthropic, Every). Tighter gutters (10 to 15px: Klim, Are.na, Pentagram) read as print, and **zero gutters with 1px rules between cells (Linear home, Raycast, Ramp, Speakeasy, Stripe Sessions)** read as engineered. Rueca's rails and crosshairs are already in that second family.
- **Measure.** Body text sits at 14 to 17px with leading of 1.5 to 1.75, in a column of 380 to 650px. Rueca's reading text (12.5 to 13.5px, with a 640px cap) is smaller than anything I measured; the nearest are Emil Kowalski (14/23) and tldraw (14/21). Moving the long-form text to 15 to 16px would put it level with Linear's changelog (17/27), Stripe Press (17/25.5) and Anthropic (16 to 18).
- **Type ladders.** A display size of 64 to 128px is followed by a run of text sizes at 13 to 24px, with little in between. The display-to-body ratio is about 4:1 on Linear and Raycast (64 over 15 or 16), 6:1 on Stripe Sessions (100 over 16) and 7.5:1 on Linear Method (128 over 17). Rueca's hero (116 over 17 to 19, so about 6:1) is in the dramatic range. Display tracking runs from -0.02em (Linear) to -0.06em (Vercel), with -0.04em at Every and Stripe Sessions, and display leading from 0.82 to 1.1.
- **Serif display is mainstream.** Every, Craft, Stripe Press, Linear Method, Anthropic, Speakeasy and The Browser Company all lead with a serif or a light-weight display face, with a grotesque for the text. Rueca's Goudy and Plex pairing is in good company.
- **Margin columns are rare and always quiet.** Only Paco (192px sidenote columns) and Linear's changelog (a date rail in 3 of 12 columns) give the margin a job. Everyone else leaves it empty, which in a 12-column grid still works as a margin.
- **Art sits in three ways.** Under a card (Every, Craft, Linear), behind the copy as a full-bleed scene (Every, Mercury), or as the whole page (Stripe Press, Commercial Type, Klim). Flat colour fields appear as the product's identity (Commercial Type, Klim, Stripe Press) and almost never as a section background behind body text.
- **Mono micro-labels.** Raycast ("FIG_0"), Speakeasy (mono caps) and Linear's 10px labels all use a mono or small caps layer for metadata, which maps directly onto the title strip.

---

## Synthesis: three directions for Rueca

All three keep the 1128px sheet, Lana paper and the rails with crosshairs. They differ in what the grid is for. Measurements below assume the 1128px sheet at a 1440px window, using a 12-column grid with 24px gutters (so a column is 72px, three columns are 264px, four are 360px, six are 552px and eight are 744px). Type is Goudy for headlines, Plex Sans for text, Geist Mono for labels, the pen for notes. Each uses at most two bright blocks.

### A. Broadsheet

A front page: one lead, a side column and a quiet middle. **Columns:** 12, with the headline across 8 (744px) and a 4-column side rail (360px) on the right, divided by a vertical hairline in the gutter. Below the hero the page runs as 4-column units, three across, each its own story with a plate, a caption and 40 to 44 characters of text. **Measure:** 16/26 Plex in 360px units (about 45 characters, a newspaper measure); the lead paragraph is 19/29 across 6 columns (552px, about 62 characters). Hero Goudy at 116 over two lines, then 40, 24 and a 10px mono "Fig." tag; the display-to-body ratio drops to about 7:1. **Notes, plates and blocks:** the lead plate (the wheel) spans the side rail, captioned in 13px as Pentagram does. The Achiote block is the lead story's cell (columns 9 to 12, the install command on it, ink text), and one Cielo or Malva cell is the "In this issue" index of the shells. The pen writes in the gutters between units (a loop round a word, a leader to the next section), because the gutter rules are already there to carry it. **Pulls from:** Anthropic's offset hero, Pentagram's caption grid, Stripe Sessions' meta strip. **Risk:** the most work to keep tidy, and it needs real copy for 12 or so cells, so there is a danger of filler.

### B. Specimen catalogue

A type-foundry page for tools: every part is a specimen. **Columns:** 3 equal cells of 376px with no gutters, divided by 1px rules with a crosshair where four cells meet (the existing `Cross` device), repeating down the page; on narrower windows 2, then 1. Full-bleed bands behind some rows carry the sections. **Measure:** one text size, 15/22 Plex, set at about 328px inside a 24px padded cell (roughly 40 to 45 characters), like Klim's single size; the only scale lives in the specimens, which are Goudy words at 116 to 200px set at -0.04em with leading 0.85 and cropped by the cell edge. Labels are 10px Geist Mono caps ("FIG_3", "101 to 106"). **Notes, plates and blocks:** each cell holds a specimen (a control, a shell), a part tag, a mono label and a 13px count ("12 parts"). Plates are the big cells: one cell spans 2 columns (752px) every ninth place, like Pentagram's feature. Colour blocks are whole bands, alternating Lana, Platino, an Achiote band for the install and a Mora band for the credits, all of them grounds the palette rules already allow. The pen sits in the cell corners (one note per cell at most). **Pulls from:** Klim, Commercial Type, Raycast, Stack Overflow's index rows. **Risk:** a catalogue flattens the story; the "how it works" sequence needs its own treatment (three cells with the build steps) or it will read as just another row.

### C. Notebook with margin

A long, calm page where the margin is the character. **Columns:** 12, grouped 3 / 6 / 3: a 264px left rail (dates, step numerals, part tags), a 552px text column and a 264px right margin for notes, with 24px between them (264 + 24 + 552 + 24 + 264 = 1128). Hero copy runs in the middle column, with Goudy at 96 to 116 spilling across the rails. On the docs, the same proportions scale down to a 240px nav, 640px text and a 192px notes column (Paco's measure, Stack Overflow's sidebar). **Measure:** 17/27 Plex across 552px (about 62 to 65 characters), with 14/22 for the rail and the margin. **Notes, plates and blocks:** the right margin is where the La Belle Aurore notes live, tied to a line of text by an Achiote leader, so the pen does what a reader's pencil does. Plates break out of the text column over both rails (full 1128px, captioned in the left rail like Linear's date), and each section opens with the title strip in the rail. Colour blocks sit in the left rail only, as 264px flat squares behind step numerals or part tags (one Achiote, one other), and never behind body text. **Pulls from:** Paco Coursey, Linear's changelog and Method, Every's framed card and Are.na's lettered list. **Risk:** the right margin must always have something to say. An empty right margin on a long page looks like an error, so notes need to be written, not decorative. It is also the least friendly to phones, which collapse to one column, so the rail contents (dates, part tags) must read fine inline.

### Which to try first

If the aim is "clearly better than now, with the least rebuild", **C** moves the least: it keeps the single sheet and the 5/7 habit, fixes the small reading size, and gives the pen a job. If the aim is to look unlike any dev tool, **B** is the boldest and shares the most with the brand's catalogue idea. **A** is the most editorial and the most expensive to keep good. A sensible test is to build the hero and one section of each in the browser at 1440 and 390px before choosing.
