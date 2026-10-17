# Giving Rueca a soul: brand audit and what to build next

16 Oct 2026. Sources:
- Rafael's Trove (x-book, about 45 searches and 7 tags)
- A web audit of Stack Overflow's Koto redesign and twelve peers
- An inventory of everything in `brand/`, `src/landing` and `research/`

All links are at the end.

## 1. Where Rueca stands

The system is strong and consistent: the Lámina técnica plate, Goudy with Host Grotesk, the Pulido mark and its race, Mora's colour rules (taken from the Stack Overflow audit), the isometric kit drawings, the handwriting that writes itself, and now the bento.

**The risk is genericness, not inconsistency.** Rafael's own Trove note on the specificity-ladder essay says AI and tool brands have converged on serifs, warm neutrals and nature. Goudy on paper sits right in that zone. The soul has to come from things **only Rueca owns**:
- the spinning wheel and its parts
- the colour names, which are real dye sources
- the Spanish craft vocabulary
- the kit's own parts
- the hand in the margin

What we have that peers don't:
- **A name with a working metaphor:** fibre in, thread out; prototype in, tool out.
- **A palette that is literally a dye workshop.** Most of the names are real natural dyes:
  - Achiote: annatto seed
  - Gualda: weld, the dyer's yellow
  - Nogal: walnut-hull ink
  - Mora: blackberry
  - Malva: mallow
  - Lana: wool
  - Hoja: leaf
- **A hand that already annotates everything** (La Belle Aurore notes and redlines). This is Rueca's Figma Hand or Excalifont moment, waiting to be named.
- **A product that makes tools,** so the brand can ship its own tools, as Stack Overflow's Stack Trace does.

What's stale or missing (from the inventory):
- **`public/og-v1.jpg`** still shows the walnut ground and the serif wordmark. **Fix first.**
- **No app icon:** no apple-touch-icon and no manifest or theme colour.
- **Icons are Lucide**, with no brand pictograms.
- **Motion rules** (RUECA §7) are all still *proposed*.
- **No sound at all.**
- **"Trama"** (weft) breaks our own "no weaving or looms" rule (§8).
- **The Campana demo artboard is off-brand:** Newsreader type and off-palette colours.

## 2. The soul: a dye-and-spindle workshop, drawn as a technical plate

**One phrase to test every new piece against:** *the spinning workshop where a hand and an agent turn raw prototypes into thread, recorded as an encyclopaedia plate.* If a piece couldn't live on that bench, it's not Rueca. This is PostHog's "would it still be ours without the logo?" test, applied to us.

Seven devices give it a soul. Each comes from Trove saves and the peer audit.

1. **The wheel is the character, not a mascot.**
   - Rafael saves anti-cute, geometric characters: the TARS ring, Phantom's two slots. Rueca already has one: the wheel and its race.
   - Give it range, the way Duo and Max have range:
     - spinning while it works
     - a slow idle turn
     - a snag (error)
     - a full race (done)
     - wound up (loading)
   - The agent's spark is its partner.
   - No face, no figure.

2. **The hand in the margin is a voice with rules.** Notion has one hand over years; tldraw and Figma have a hand font. Name the annotator and write its rules:
   - it writes *why*, not *what* (the Oakley sheet)
   - always in the Achiote pen
   - slightly crooked
   - it signs off with an initial (the Rockwell Ink approval sheet)
   - it never shouts

   Redlines can become **stitched**: running-stitch dashes with loose thread ends (Sorentang's red thread). That's craft without weaving.

3. **The palette is a nomenclature.** Following Werner's *Nomenclature of Colours*, every colour gets its source, a Latin name and a use. For example, "Achiote, seed of *Bixa orellana*, the lead colour; the red pen." This turns the colour tokens into a story people can quote, and only Rueca can tell it.

4. **A spinning vocabulary names everything.** Stack Overflow names its motion Click, Follow and Snapback; Teenage Engineering names products. Rueca should name its motion, its releases and its parts with real spinning words. These are proposals, to run through the copywriting skill before adopting:
   - **Motion:**
     - *Hilar* (to spin): the race
     - *Torcer* (to twist): a snap with overshoot
     - *Devanar* (to wind): a swipe or page change
     - *Cardar* (to card): wiping colour clean
   - **Versions** (one spinning word each, collectable like Ubuntu's): 0.1 Huso (spindle), 0.2 Malacate (whorl), 0.3 Rueca, and so on.
   - **Parts:** kit drawings get part codes, e.g. "RC-02 Timeline", as Koto's server labels do.

5. **Refusals: a written list of what Rueca never does.** PostHog and Stack Overflow sharpen their identities with bans. Ours:
   - no looms or woven cloth (already in §8)
   - no generic blobby isometric; ours is always a plate with part names
   - no gradients or drop shadows in brand art
   - no fades in brand motion; lines draw, colour steps
   - no AI-generated people or hands
   - no mascot face
   - no more than two accents per piece

6. **Rituals.** Supabase has Launch Week, Figma has Config, Are.na has its Annual.
   - **A plate per release.** Each version gets a numbered *Lámina*, its own plate, as version art.
   - **A yearly *Muestrario*** (sample book) of tools the community made with Rueca.
   - **Launch "madejas" (skeins):** a generated card per person, in the spirit of Supabase's tickets.

7. **The brand ships its own tools.** Like Stack Trace and Rafael's saved in-house poster generator, Rueca's brand assets should be **Rueca tools**: the bento, the logo race, an OG and social card maker, a pattern maker. The brand then demonstrates the product, and every piece is editable by design. We already started with the bento and the fan.

## 3. Graphic types: catalogue against what Rueca has

| Type | Rueca today | Next step | Exemplar |
|---|---|---|---|
| Logo, lockups, clear space | Pulido + Host (shipped) | Page-format and partner lockups | Stack Overflow |
| Logo animation | E2 race (shipped) | Range: idle, snag, wound up | Mozilla (the story resolves) |
| App icon / favicon | Favicon only | App icon, apple-touch-icon, manifest | Raycast |
| Type | Goudy, Host, Hand, Plex, Geist Mono | A specimen plate; name the hand | Vercel Geist, Figma Hand |
| Colour | Mora + rules (shipped) | **Dye nomenclature**; bright and deep pairs | Stack Overflow, Werner |
| Illustration | Anatomy isometric (shipped), engraving trials | Approve one; add herbarium and specimen plates | Notion (one hand) |
| Pictograms | None (Lucide) | **A kit pictogram set** derived from the wheel geometry | Ron Cobb's semiotic standard, Mozilla |
| Pattern / texture | None | Whorl endpaper; scattered Host glyphs; ikat smear as transition | Norrin, Koto stacks |
| Motion principles | §7 proposed | **Named spinning behaviours**, frame-counted | Stack Overflow |
| Sound | None | **Sonic logo:** the wheel's click and whir; speed follows audio | SF Symphony, Teenage Engineering |
| OG / social | Stale | **OG and card maker (a Rueca tool)**; per-release plates | Supabase tickets |
| Launch ritual | Trailer, film | Release *Lámina* + madeja cards | Supabase, Config |
| Changelog art | None | One plate per release | Linear |
| Docs / README art | Plates on the landing | Hand notes and part codes in docs | PostHog |
| Merch | None | Catalogue-numbered merch; one sticker per dye (PLU style); blind deboss on linen | Trove: SBMR, Crane, PLU |
| Error / empty / 404 | Not designed | The wheel's snag; "loose thread" 404 | GitHub 404 |
| Brand site | RUECA.md (internal) | **rueca.dev/brand** as a public plate book | stackoverflow.design |
| Community artefact | None | *Muestrario*: an annual of community tools | Are.na Annual |

## 4. Expanding the bento

**The bento becomes a family, not one grid.** It keeps the 6-tile master and adds tiles that rotate in by surface: 1:1 for X, 4:5 for LinkedIn, 16:9 for the site and slides. Every new tile follows the existing rules: one move at a time, the 2.4 s beat, loops that close.

New tiles, roughly in order of soul per effort:

1. **Dye specimen.** One colour at a time, as a Werner entry: the swatch, its Spanish and Latin names, the source drawn in line (seed, leaf, walnut), and its use in hand. On each beat it turns to the next dye.
2. **Herbarium control.** A real Rueca control (a slider, the knob) "pressed" like a plant on a sheet, with margin labels and a colour scale. Its label writes in on each beat.
3. **The wheel's moods.** The close-up wheel's range: spin, idle, snag, wound. A character tile.
4. **Pictograms.** The kit pictogram set cycling, one part code at a time (RC-01 Controls…).
5. **Whorl family plate.** A Haeckel or floral-diagram plate of whorl variations. A botanist's "whorl" is our "whorl"; that pun is a gift.
6. **Stitched redline.** The fig specs as running stitch, the thread pulling through.
7. **Release plate.** "Lámina 0.2 · Malacate": the version as a numbered plate with its spinning word.
8. **Type specimen.** Goudy, Host and the hand side by side, the hand correcting the other two.
9. **Live maker.** A tile that is itself a small Rueca tool, shuffling poster layouts. The brand demonstrating the product.
10. **Sound.** A waveform drawn as thread, driving the wheel's speed. It only works in video, but it's the cut that gets noticed.

## 5. What to build first

Three pieces that move the soul furthest for the effort:

1. **The dye nomenclature.** Write the eight entries (source, Latin name, use, a one-line story), put them in RUECA.md, and build the dye specimen tile. It's cheap and fully specific. It reframes the palette people already see.
2. **The OG and social card maker, as a Rueca tool.** It fixes the stale OG image and starts the "brand ships its own tools" device. The release *Lámina* plates come out of the same tool later.
3. **Named motion and the wheel's range.** Finalise §7 with the spinning names, then give the close-up wheel its moods. It's the character, and it makes the motion rules something people can talk about.

Next tier: the pictogram set, the sonic logo, the public brand plate book, merch as a catalogue, and renaming Trama.

## Links

**From Trove** (✎ = Rafael's note)
- Specificity ladder ✎ *"The specificity ladder is the argument here, not the anti-AI take. Keep for the brand identity talk."*: https://x.com/YifeiChen1121/status/2084728233250185578
- Humanised AI design tool ✎ *"…a lot of imperfect strokes, soft palette. it feels human switch contrast its AI nature"*: https://x.com/ayushsoni_io/status/2064345643036954707
- Dessn ✎ *"textures, design tooling"*: https://x.com/ayushsoni_io/status/2104196865701155176
- Runline, "Nobody builds them a world": https://x.com/designbyaron/status/2084343196994224458
- Brand angle over moodboards: https://x.com/hellohex/status/2108182404972347727
- TARS-ring AI avatar: https://x.com/arjmahesh/status/2104590858989552088
- Weaver, a shelved design-tool brand: https://x.com/thenickpattison/status/2090078556269289742
- Grafana by HEX: https://www.hex.inc/work/grafana
- Norrin by Bond: https://x.com/brandarchivexyz/status/2104497627924455929
- Stack Overflow by Koto: https://x.com/brrranding/status/2110646253616840794
- Rockwell Ink construction sheet: https://specialforc.es/rockwell-ink-visual-identity/#2
- Werner's Nomenclature of Colours: https://www.c82.net/werner/#colors
- Solid, x-ray and exploded states: https://www.are.na/block/40377287
- mannay's JS sketchbook: https://x.com/mannay/status/2090443791228428330
- In-house poster generator: https://x.com/newincreative/status/2080291592431378463
- Red-thread embroidery: https://www.are.na/block/29038294
- Pancilla writing-master plate: https://www.are.na/block/49071924
- Ron Cobb Semiotic Standard: https://www.are.na/block/37848418
- Oakley frog concept sheet: https://www.are.na/block/38343494
- SF Symphony (Collins): https://wearecollins.com/case-studies/san-francisco-symphony
- Crane Paper deboss: https://www.are.na/block/9803031
- Fake PLU stickers: https://www.are.na/block/47822633

**From the web audit**
- Stack Overflow brand guidelines: https://stackoverflow.design/brand/
  - Colour: https://stackoverflow.design/brand/color/
  - Motion: https://stackoverflow.design/brand/motion/
  - Stack system: https://stackoverflow.design/brand/stack-system/
  - Type: https://stackoverflow.design/brand/typography/
- Stack Overflow, the community vote: https://stackoverflow.blog/2025/07/10/vote-on-our-new-identity/
- Koto's framing: https://www.creativeboom.com/branding/koto-reframes-stack-overflow-around-the-one-thing-ai-cant-replace-its-community/
- Figma's visual language: https://www.figma.com/blog/figma-on-figma-evolving-our-visual-language/
- PostHog's brand handbook: https://posthog.com/handbook/brand/visual-identity
- Mozilla (JKR): https://itsnicethat.com/articles/jkr-mozilla-rebrand-graphic-design-project-240924
- Notion's campaign: https://www.notion.com/blog/the-thinking-behind-our-latest-brand-campaign
- Mailchimp's style guide: https://styleguide.mailchimp.com/
- Vercel Geist Pixel: https://vercel.com/blog/introducing-geist-pixel
- Supabase Launch Week: https://supabase.com/launch-week/7
- Shantell Sans: https://shantellsans.com/process
- Are.na Annual: https://store.are.na/products/are-na-annual-vol-7-pool
- Linear Method: https://linear.app/method
