# Type stacks for Rueca: editorial meets SaaS

16 Oct 2026. Question: which type stack puts Rueca between an editorial publication and a SaaS product, and does Sorts Mill Goudy plus Host Grotesk do that job?

## 1. The short answer

- **Keep Goudy for display, and the pair works.** Seventeen live sites were measured (section 5). Serif display over a plain sans for everything functional is the dominant pattern, and Rueca already follows it. What needs fixing is the *setting*, not the faces: Rueca's hero leading (0.82) is tighter than every peer measured, its body text is small for marketing copy (14.5 to 17px, where most peers run 18 to 22px), and its small Goudy headings (17 to 19px) are below the size where peers still use a serif.
- **Decided (Rafael, 16 Oct): Host Grotesk is for the logo only.** Body and UI stay IBM Plex Sans (`--font-body` in `src/landing/landing.css`). Where section 8's scale says Host Grotesk, read IBM Plex Sans; the sizes hold, as Plex's x-height is about 4% larger.
- **Decision for Rafael: hero leading.** `RUECA.md` says the hero is `clamp(56px, 11.5vw, 136px)` at 0.82. The code says `clamp(43px, 9.8vw, 116px)` at 0.82. The two disagree, so one of them needs updating whichever way this goes.
- **If Goudy feels too vintage**, the most useful fix is a different weight of the same idea, not a different idea. Source Serif 4 at light weights is the calmest swap (section 9). Instrument Serif with Instrument Sans is the sharpest, most current one.

## 2. What Rueca sets today

Read from `brand/RUECA.md` (Type) and `src/landing/landing.css` plus the `.tsx` files.

| Role | Face | Setting in code |
|---|---|---|
| Display | Sorts Mill Goudy, one weight (400) plus italic, `size-adjust: 106%`, `font-synthesis: none` | Hero `clamp(43px, 9.8vw, 116px)`, leading 0.82, tracking -0.025em. Section h2 36px, 48px from `sm`, leading 0.88, tracking -0.02em. Card titles 17 to 24px, leading `tight` to `none`. |
| Body / UI | IBM Plex Sans Variable | Mostly 12.5 to 17px, leading 1.6 to 1.65. |
| Caps strip | Plex, uppercase | 10.5px, +0.09em, tabular figures (`.strip`, `plate.css`) |
| Hand | La Belle Aurore | Margin notes and filled-in values only |
| Code | Geist Mono | Commands, `code`, `kbd`, `pre` |

Facts checked in the font files themselves (parsed from the shipped woff2 and the Host Grotesk TTF):

| | x-height | Cap height | Notes |
|---|---|---|---|
| Sorts Mill Goudy 400 | 0.442 em (0.469 after the 106% adjust) | 0.713 | Has small caps (`smcp`, `c2sc`), lining figures (`lnum`), which suggests its default figures are old-style (check this in the browser before relying on it), capital spacing (`cpsp`), discretionary ligatures (`dlig`) and historical forms (`hist`). One weight, no variable axis. |
| Host Grotesk (wght 300 to 800) | 0.496 em | 0.700 | No `smcp`, `tnum` or `lnum`. Every digit is already 650 units wide in the default instance, so figures are tabular without asking. Italic file exists. OFL, also on Google Fonts. |
| IBM Plex Sans | 0.516 em | 0.698 | For comparison. |
| Geist Mono | 0.530 em | 0.710 | Taller than Host Grotesk, so inline code needs about 0.9em. |

Two consequences. Goudy's x-height is the smallest of the three, which is why it carries the 106% adjust and why it dies below about 19px. And Host Grotesk needs no extra figure features: tables and slider readouts line up as they are, so a mono is only needed for code.

## 3. Method and caveats

- **Trove first.** Searched Rafael's library through the x-book MCP and browsed the `typography`, `type-specimen`, `editorial-design` and `lettering` tags (never the database).
- **Live sites.** For each site I opened the homepage in the built-in browser at a 1440 px wide viewport and read computed styles: family, size, line height, tracking, weight, italic and caps for the largest text and the first paragraphs. These are measurements from one page on one day, not brand guidelines. Sizes move with breakpoints and `clamp()`, so treat them as "what a desktop visitor gets".
- **Foundries and lists.** Typewolf's Google Fonts list loaded, but it names no pairings. Fonts In Use, Typewolf's trending page and Grilli's pairing page returned nothing usable (errors or off-topic results), so no pairing here rests on them. I looked at five foundry sites directly (section 7).
- **Not verified.** Foundry credits for custom faces I could not identify are left out. "Open" means a licence like the SIL OFL that Rueca can ship.

## 4. What Rafael already saved in Trove

Nothing in the library names a specific pairing, but the specimen notes agree on a few moves worth copying:

- **Small sans or mono metadata against a large serif.** Catalogue title spread, serif italic title against tiny sans metadata blocks ([Catherine Willis](https://uk.pinterest.com/pin/633387443417607/)). Bilingual contents page in small monospace, offset against a cyanotype image ([Atelier Dyakova, Sarah Sze](https://www.instagram.com/p/CM2gCC_huVf/?img_index=1)). Conference programme in monospace on thin stock ([Studio Lin](https://www.are.na/block/42378165)).
- **Roman and italic alternation as the whole hierarchy**, with superscript codes for secondary facts ([exhibition poster built from an artist list](http://davidbenski.com/)).
- **Weight and scale collision** between a delicate serif and a heavy grotesk ([Pine pitch deck](https://images.squarespace-cdn.com/content/v1/6435e515f2053a1aa71379e5/fc5bbd2b-486d-4ee5-8e61-47d36a8359ec/104_pine-albinholmqvist-4-jpg.jpg), and a magazine contents spread saved 6 Sept 2026 that sets each name in a light serif and a heavy grotesque). This is the loud end of editorial. Rueca bans bold display type, so take the idea (contrast of voice) without the heavy weight.
- **Old-style serif shown as a single-weight sheet**, with `ct` ligatures worth copying for layout ([aboutcontact.com/typography](https://www.aboutcontact.com/typography)). Closest to what Goudy is.
- **Rafael's own shortlist**: a saved twelve-font list includes Instrument Serif, Bricolage Grotesque, Inter and DM Mono ([post](https://x.com/yahyavision/status/2079598274038886853)). That is why Instrument Serif is one of the two alternatives in section 9.
- **Departure Mono**, a free pixel-grid mono, is saved as a tool. It is more novelty than Rueca needs, so it is not in the proposal.

## 5. Seventeen pairings, measured

Measured 16 Oct 2026 at 1440 px. Size / leading / tracking are for the largest serif headline. "Open" = ships under an open licence. The two Anthropic rows share one system.

| # | Site | Serif | Sans | Mono | Serif is used for | Display (px / leading / tracking) | Body |
|---|---|---|---|---|---|---|---|
| 1 | [anthropic.com](https://www.anthropic.com) | Anthropic Serif | Anthropic Sans | Anthropic Mono | Reading text (24px lede, 18 to 22px paragraphs) and hero card titles | 68 / 1.10 / 0, serif. The page headline is Sans 700 at 61 / 1.10. | Serif 24/1.4 lede, 18/1.4. UI Sans 16 |
| 2 | [claude.com](https://claude.com) (read on the claude.ai sign-in page it redirects to) | Anthropic Serif | Anthropic Sans | none seen | Headline and plan names | 56 / 1.15 / 0, weight 300 | Sans 15 to 20, 12 for legal |
| 3 | [readwise.io](https://readwise.io) | Source Serif 4 (open) | Albert Sans (open) | none | All large headings, 64 / 54 / 40, weight 600 | 64 / 1.10 / -0.02em | Sans 22/1.27 lede, 20/1.4 |
| 4 | [every.to](https://every.to) | Signifier (paid) | Switzer, plus Founders Grotesk for buttons | none | Page and article headlines at 64 / 48 / 42 / 32 / 24 | 64 / 1.00 / -0.04em | Sans 20/1.5, 24/1.5 lede |
| 5 | [resend.com](https://resend.com) | Domaine (paid) | ABC Favorit for headings, Inter for body | none | Hero and one section only | 96 / 1.00 / -0.01em | Inter 18/1.5 |
| 6 | [harvey.ai](https://www.harvey.ai) | Harvey Serif (custom) | Harvey Sans (custom) | none | Headlines (72 / 48 / 32) and large quotes at weight 500 | 72 / 1.05 / -0.0125em | Sans 20/1.3 |
| 7 | [attio.com](https://www.attio.com) | Tiempos Text (paid) | Inter Display, Inter | none | Customer pull quotes only, 48px | 48 / 1.08 / -0.015em (quote). Sans headline 96 / 1.00 / -0.024em | Inter 18/1.3, weight 500 |
| 8 | [wealthsimple.com](https://www.wealthsimple.com) | Tiempos (paid) | The Future (licensed) | none | Hero and section titles at 128px | 128 / 1.16 / -0.01em | Sans 18/1.4, 20/1.4 at +0.005em |
| 9 | [notion.com](https://www.notion.com) | Lyon Text (paid) | Notion Inter | none | Testimonial blockquotes, 18/1.55 | Serif 18 only. Sans headline 96 / 1.04 / -0.048em, weight 600 | Sans 20/1.4 |
| 10 | [cursor.com](https://cursor.com) | EB Garamond (open) | Cursor Gothic | Berkeley Mono | Long-form prose (17/1.35) and italic testimonial names (19/1.5, weight 500) | Sans 72 / 1.10 / -0.03em | Serif 17/1.35 prose, sans 15 to 22 |
| 11 | [thebrowser.company](https://www.thebrowser.company) | EB Garamond italic (open), plus Ivar Text (paid) for small print | none seen | ABC Diatype Mono | The single mission statement, italic, 28/1.2 | 28 / 1.20 / 0 | Footnotes 8 to 10 |
| 12 | [granola.ai](https://www.granola.ai) | "quadrant" (custom or licensed) | "melange" | none | Every heading (160 / 108 / 86 / 60 / 48 / 32 / 24) and quotes (36) | 86 / 0.93 / -0.02em | Sans 16/1.25, 24/1.33 |
| 13 | [press.stripe.com](https://press.stripe.com) | Ivar Headline and Ivar Text (paid) | none, serif throughout | none | Everything, including nav and buttons | Small: 16 to 21 / 1.0 to 1.3 / +0.02em | Ivar Text 18/1.5, intro 25/1.5 |
| 14 | [linear.app/method](https://linear.app/method) | Tiempos Headline (paid) | Inter | Berkeley Mono (product site) | One page title at 128px. The product homepage has no serif at all. | 128 / 1.00 / 0 | Inter 17/1.6 |
| 15 | [thinkingmachines.ai](https://thinkingmachines.ai) | Iowan Old Style BT (paid) | GT America | none (Chakra Petch caps for the wordmark) | Body prose with italic, 17/1.6 | Sans heading 23 / 1.40 / -0.02em | Serif 17/1.6, UI Sans 15/1.6 |
| 16 | [elicit.com](https://elicit.com) | Martina Plantijn (paid) | Special Gothic | none | Headlines (64 / 48 / 32), plus Crimson Pro for stat numerals | 64 / 1.20 / -0.02em | Sans 20.8/1.5 at +0.005em |
| 17 | [mymind.com](https://mymind.com) | Louize (paid) | Inter, Nunito for UI | none | Display lines at 140 / 96 / 80 / 54, roman and italic | 140 / 0.85 / -0.06em | Inter 18/1.1 UI, 40/1.35 feature lines |

Notes on how each one sets the details Rafael asked about (italics, caps, numerals, serif in UI):

1. **Anthropic.** No italics seen. Caps labels are in the mono at 16/1.4, uppercase, for the date column. The serif is the reading face, which is the reverse of Rueca (serif for headlines, sans for reading).
2. **Claude.** Light weight (300 to 330) on the serif headline is the closest peer to Rueca's light-display rule. Labels in Sans at 12px with +0.01em.
3. **Readwise.** Italic is used on one word inside the h1 ("most"). The heaviest serif display measured (600), so it is the one peer that breaks Rueca's no-bold rule. Sans subheads at 22 to 24px, weight 600.
4. **Every.** An italic phrase inside a 44px h2 at -0.045em. Large caps labels (24px, weight 500) in the sans. Three families, so it is the busiest stack here.
5. **Resend.** The serif is a hero-only flourish. Section titles switch to ABC Favorit at 56px with -0.05em, so the "SaaS" look is carried by a tight sans.
6. **Harvey.** Serif for emotional beats (headline, quotes), sans at 500 for product claims and sub-headings. A clean rule to copy.
7. **Attio.** The serif appears only in customer quotes. Everything else is Inter Display.
8. **Wealthsimple.** Serif at 128px with only -0.01em, leading 1.16. The sans runs slightly open (+0.005em), the opposite of Linear's tightened Inter.
9. **Notion.** Lyon Text shows up only in testimonials. All headlines are one tightened sans at -0.035 to -0.048em. Notion's SaaS side is far louder than its editorial side.
10. **Cursor.** The only peer that puts a serif into running prose inside a product page. Mono at 11px for code.
11. **The Browser Company.** Italic set as the whole statement. Nav labels are mono caps at 14px with +0.15em tracking (the widest tracking measured). Small legal text is set in Ivar Text, a serif, at 8 to 10px, so this page has no sans at all.
12. **Granola.** Serif at weight 400 with leading 0.93, the tightest leading after mymind. Labels at 13px with +0.01em.
13. **Stripe Press.** Pure editorial: one serif family, italic nav, wide small-size tracking (+0.02em).
14. **Linear Method.** The "serif moment" is real but isolated to the Method page. On the product pages Linear stays on Inter with Berkeley Mono caps labels (12px, uppercase).
15. **Thinking Machines.** Roles reversed: serif for the paragraphs, sans for headings and UI. The italic is used for emphasis inside body text.
16. **Elicit.** Stat numerals in a separate serif (Crimson Pro, 48px, leading 0.7, -0.02em). Numbers are treated as display.
17. **mymind.** The extreme: 140px at leading 0.85 and -0.06em, the only peer close to Rueca's 0.82.

Checked and found with no serif: Linear's homepage, Ghost (Inter), Framer (GT Walsheim, Inter), Lovable (Camera Plain), OpenAI (OpenAI Sans), Mercury (Arcadia, a sans), Oxide (Suisse), Tailscale (Inter, mono caps), Superhuman (Super Sans). Not every SaaS brand goes serif.

## 6. What the pairings agree on, and where Rueca sits

| Trait | Peers (serif display sites) | Rueca today | Reading |
|---|---|---|---|
| Display size at 1440 | 56 to 140, median about 72 to 86 | 116 (cap reached at 1290px) | Big, on the editorial side. Fine for a short hero. |
| Display leading | 0.85 to 1.20, median about 1.05 | 0.82 hero, 0.88 section titles | Tightest in the set (mymind is next at 0.85). Safe on one line, risky when a heading wraps to two or three on a phone. |
| Display tracking | 0 to -0.06em, median about -0.015em | -0.025em hero, -0.02em h2 | Normal. |
| Serif weight | 300 to 500, with Readwise at 600 | 400 only | In range. |
| Marketing body size | Mostly 18 to 22px, leading 1.4 to 1.6. The dense product sites (Linear, Cursor) run 15 to 17px. | 14.5 to 17px, leading 1.6 | Low for a landing page. This is the biggest gap. |
| Small serif | Smallest serif headings are 18 to 24px (Stripe Press is the exception, setting a serif at 16px as UI) | 17 to 19px card titles | Below the floor. Goudy's x-height is 0.469 em, so at 17px it is an 8px x-height. |
| Serif in UI (nav, buttons, labels) | Rare: only Stripe Press and the Browser Company | Not used | Keep it that way. |
| Italic | Used as one emphasised phrase inside a headline (Readwise, Every, mymind, Arc) or as a whole statement (Browser Company) | Available, used in places | Keep it to one phrase per heading. |
| Caps labels | Sans or mono, 11 to 14px, +0.05 to +0.15em, never in the serif | Plex, 10.5px, +0.09em | Slightly small. 11px is the practical floor. |
| Small caps | None of the 17 use true small caps | Goudy has them, unused | An option for the title strip only (section 8). |
| Numerals | Big stat numerals set as display (Elicit), small ones in a mono or tabular sans | Not defined | Section 8 sets the rule. |
| Mono | Present at 4 of 17, always for code and caps labels | Geist Mono for code | Fine. |

The editorial-to-SaaS dial is mostly in two places. **Editorial** comes from serif display, one italic phrase, big size jumps and small caps or mono metadata. **SaaS** comes from a tightened sans with 500 weight, tabular numbers, buttons and density. Rueca can sit in the middle by keeping the display serif big and the body sans slightly bigger and plainer than it is now.

## 7. Foundry check

I opened the home pages of Klim, Commercial Type, Grilli Type, Production Type and Pangram Pangram and read their computed styles.

- Klim sets its own site in Söhne, Commercial Type in Styrene, Production Type in its own "enduro", and Pangram in Neue Montreal. Grilli's home page is a list of its typefaces, each name set in its own face. **The foundries that set a UI run one grotesque for it and show serifs only as specimens.** That is the same split the 17 sites make.
- Dinamo and Displaay were not checked live. Velvetyne was not checked either. Nothing here depends on them.
- For open licences the useful catalogue is Google Fonts. Everything recommended below is OFL and is listed there with its designer: [Host Grotesk](https://github.com/google/fonts/tree/main/ofl/hostgrotesk) (Element Type, added Oct 2024), [Sorts Mill Goudy](https://github.com/google/fonts/tree/main/ofl/sortsmillgoudy) (Barry Schwartz), [Source Serif 4](https://github.com/google/fonts/tree/main/ofl/sourceserif4) (Frank Grießhammer), [Instrument Serif](https://github.com/google/fonts/tree/main/ofl/instrumentserif) and [Instrument Sans](https://github.com/google/fonts/tree/main/ofl/instrumentsans) (Rodrigo Fuenzalida, Jordan Egstad), [Geist Mono](https://github.com/google/fonts/tree/main/ofl/geistmono).

## 8. Type scale proposal: Goudy plus Host Grotesk

### 8.1 Faces and where each is allowed

| Face | Allowed | Not allowed |
|---|---|---|
| **Sorts Mill Goudy** 400, roman and italic | Display, h1, h2, h3, and h4 at 20px or larger. Pull quotes. Big step numerals and stat numerals (with lining figures). One italic phrase per heading. Optional true small caps for the title strip's field names. | Anything under 19px. Buttons, nav, form labels, tooltips, tables. Body paragraphs over two lines. Caps (use the sans, or Goudy's real small caps). Bold, ever. Discretionary or historical ligatures. |
| **Host Grotesk** 400 to 600 | Body, lede, UI text, nav, buttons, forms, captions, caps labels, small headings under 20px, numbers in stats and tables, the wordmark. | Display sizes above about 32px (the serif owns those). Weights above 600. Italic (use the serif's italic for emphasis, though Google Fonts does ship a Host Grotesk italic). |
| **Geist Mono** 400 | Commands, code blocks, inline code, `kbd`, file paths, hex values. | Headings, labels, body, numbers in tables (Host Grotesk's digits are already tabular). |
| **La Belle Aurore** | Unchanged: margin notes and filled-in values. | Body, buttons. |

A mono is "warranted" only for code. Rueca shows install commands and code on the landing page, so Geist Mono stays, but it should not spread into labels, where it would pull the look toward a dev-tool and away from the middle.

### 8.2 The scale

Line heights for text sizes (lede and below) land on the 4px grid. Sizes are CSS `font-size` values (before Goudy's 106% `size-adjust`). Tablet interpolates with `clamp()`. Breakpoints: desktop 1024px and up, mobile 640px and down.

| Role | Face | Desktop size / line / tracking | Mobile size / line / tracking |
|---|---|---|---|
| **Display** (hero only) | Goudy 400 | `clamp(44px, 9vw, 116px)`, reaches 116 at 1290px. Leading 0.92. -0.025em. | 44 / 0.96 / -0.02em |
| **H1** (inner page title) | Goudy 400 | 72 / 1.00 / -0.022em | 40 / 1.05 / -0.018em |
| **H2** (section title) | Goudy 400 | 52 / 1.04 / -0.02em | 34 / 1.08 / -0.015em |
| **H3** (plate, step, card title) | Goudy 400 | 32 / 1.12 / -0.015em | 26 / 1.15 / -0.01em |
| **H4** (small heading) | Goudy 400 | 22 / 1.20 / -0.01em | 20 / 1.20 / -0.005em |
| **H4, sans variant** (below the serif floor) | Host Grotesk 500 | 17 / 1.30 / -0.005em | 16 / 1.30 / 0 |
| **Pull quote** | Goudy italic | 36 / 1.20 / -0.01em | 26 / 1.25 / -0.005em |
| **Lede** | Host Grotesk 400 | 22 / 32 / -0.005em | 19 / 28 / 0 |
| **Body** (reading) | Host Grotesk 400 | 18 / 28 / 0 | 17 / 28 / 0 |
| **UI text** (cards, spec lines, nav) | Host Grotesk 400, 500 for emphasis | 15 / 24 / 0 | 15 / 24 / 0 |
| **Small** | Host Grotesk 400 | 13.5 / 20 / +0.005em | 13 / 20 / +0.005em |
| **Caption and meta** | Host Grotesk 400 | 12.5 / 20 / +0.01em | 12.5 / 20 / +0.01em |
| **Caps label** | Host Grotesk 500, uppercase | 11 / 16 / +0.09em | 11 / 16 / +0.08em |
| **Small-caps label** (title strip, optional) | Goudy 400, `font-variant-caps: all-small-caps` | 16 / 20 / +0.08em | 15 / 20 / +0.08em |
| **Big numerals** (step numbers, stats) | Goudy 400, `font-variant-numeric: lining-nums` | 48 to 72 / 1.0 / -0.02em | 40 / 1.0 / -0.02em |
| **Code** | Geist Mono 400 | 13 / 20 / 0. Inline code at 0.9em. | 12.5 / 20 / 0 |

How these were chosen:

- **Leading 0.92 for the hero, not 0.82.** Peers sit between 0.93 (Granola) and 1.2. Only mymind goes lower (0.85), at 140px. At 0.82 an ascender in one line can touch the descender above it as soon as the hero wraps on a phone. If one-line impact matters more, keep 0.84 and set `text-wrap: balance`.
- **H2 at 52 with leading 1.04.** Peers run 48 to 64. Today's 48 at 0.88 is fine for one line and tight for two.
- **Serif floor at 20px.** The smallest serif headings measured are 18 to 24px (Claude 18, Harvey 24, Granola 24). Below 20px, Goudy's small x-height reads thin, so those headings switch to Host Grotesk 500.
- **Body 18 instead of 17.** Peers set marketing paragraphs at 18 to 22px. Host Grotesk's x-height is 0.496 against Plex's 0.516, so the same size looks about 4% smaller. 18px puts the apparent size where 17px Plex was, plus a little.
- **Line length.** Body 62 to 66 characters (about 560px at 18px). Lede 52 to 56 characters. Use `text-wrap: balance` on headings and `text-wrap: pretty` on paragraphs.
- **Caps label at 11px.** The strip is 10.5px today. 11px is the practical floor on a 1x screen, and tracking stays in the +0.05 to +0.15em band the peers use.

### 8.3 Goudy settings that reduce the vintage feel

Goudy's old-style look comes from its figures, its ligatures and its single weight, not only from its letter shapes. All of these are CSS only:

- `font-variant-numeric: lining-nums` on any number set in Goudy (default figures are old-style, which reads antique).
- `font-variant-ligatures: common-ligatures` only. Leave `dlig` and `hist` off.
- Tighten tracking at display sizes (as above) and keep Goudy at 28px or larger so the thin parts hold.
- Let the sans do the work around it: weight 500, plain, tabular, and slightly larger than before. That contrast is what makes a Goudy headline read as a choice, not an affectation.
- Use Goudy small caps (`all-small-caps`) for the title-strip fields only. They tie to the drawing-sheet idea and they are the one editorial detail the 17 peers do not use, so it would be distinctive. At 15 to 16px the specimen render looked small, so it is set at 16.

### 8.4 Tokens, ready to paste (proposal only, nothing in the repo was changed)

```css
:root {
  --font-display: "Rueca Display", Georgia, ui-serif, serif;           /* Sorts Mill Goudy */
  --font-body: "Host Grotesk", ui-sans-serif, system-ui, sans-serif;   /* was IBM Plex Sans Variable */
  --font-code: "Geist Mono Variable", ui-monospace, monospace;

  --t-display: clamp(44px, 9vw, 116px);
  --t-h1: clamp(40px, 5vw, 72px);
  --t-h2: clamp(34px, 4vw, 52px);
  --t-h3: clamp(26px, 2.5vw, 32px);
  --t-h4: clamp(20px, 1.8vw, 22px);
  --t-lede: clamp(19px, 1.6vw, 22px);
  --t-body: clamp(17px, 1.3vw, 18px);
  --t-ui: 15px;
  --t-small: 13.5px;
  --t-label: 11px;
}
.t-display { font: 400 var(--t-display)/0.92 var(--font-display); letter-spacing: -0.025em; font-synthesis: none; }
.t-h2      { font: 400 var(--t-h2)/1.04 var(--font-display);      letter-spacing: -0.02em; text-wrap: balance; font-synthesis: none; }
.t-body    { font: 400 var(--t-body)/1.56 var(--font-body);       text-wrap: pretty; }
.t-label   { font: 500 var(--t-label)/1.45 var(--font-body);      letter-spacing: 0.09em; text-transform: uppercase; }
.t-sc      { font: 400 16px/1.25 var(--font-display);             font-variant-caps: all-small-caps; letter-spacing: 0.08em; }
.t-num     { font-family: var(--font-display); font-variant-numeric: lining-nums; }
```

Host Grotesk would need loading: it is in `brand/fonts/host-grotesk/` (variable TTF, OFL) and on Google Fonts. Convert to woff2 and subset to Latin for the landing page. This note did not do that.

## 9. Two alternative stacks, if Goudy feels too vintage

I rendered all three stacks side by side at the proposed scale (hero, h2, h3, lede, body, caps label, small caps, numerals, code, button) to compare them by eye.

### Stack B: Source Serif 4 + Host Grotesk + Geist Mono (the calm swap)

- **Why.** Source Serif 4 is OFL, designed by Frank Grießhammer at Adobe, with an optical size axis (8 to 60) and weights 200 to 900, so a light display is free without faking it. Readwise runs Source Serif 4 with Albert Sans, a close cousin of this pairing, in the same editorial-SaaS register.
- **Fit.** Its x-height (0.475) and cap height (0.670) have the same ratio as Host Grotesk's (0.496 / 0.700), 0.71 for both, so the two share proportions and need at most a 4% size nudge. Goudy's ratio is 0.62, which is why Goudy needs the 106% boost.
- **Features.** Real small caps, old-style and lining figures, and tabular figures are all in the file. It is the only candidate here that gives Rueca a proper figures toolbox.
- **Setting.** Display at opsz 60, weight 300 to 350, tracking -0.02em. At weight 350 it rendered visibly lighter and cleaner than Goudy at 400. Body scale unchanged.
- **Trade.** Loses Goudy's warmth and the old-style cut that ties to craft and textiles. It reads closer to a magazine and further from a workshop. Of the three it is the closest to a standard "serif plus grotesk SaaS" look, so it carries the least brand risk and the least personality.

### Stack C: Instrument Serif + Instrument Sans + Geist Mono (the sharp, current swap)

- **Why.** Both faces are OFL, by the same designers, built to be used together. Instrument Sans was already Rueca's body runner-up in `RUECA.md`, and Instrument Serif is on Rafael's saved shortlist (Trove, 7 Aug 2026).
- **Fit.** x-heights match exactly (0.51 for both). Instrument Sans has tabular figures and a width axis (75 to 100) for tight UI.
- **Setting.** Display only, 400 and italic, tracking -0.02em. Its italic looked the liveliest of the three in the render.
- **Trade.** Instrument Serif is a single, condensed weight with no text cut, so everything under about 28px (h3, h4, quotes) has to move to the sans. That makes the sans carry more of the page. It is also a very familiar face right now, and the brand audit warns that tool brands are converging on serifs. Test whether it still looks like Rueca beside Pulido.

### Also considered, not recommended

- **Fraunces, Newsreader, Literata, Young Serif, Besley, Lora, Gelasio, Fontshare's Recia, Erode, Gambetta, Sentient.** Already compared in `brand/references/fonts/friendly-*.html`. Newsreader stays the documented fallback.
- **Martina Plantijn, Signifier, GT Alpina.** Paid and already weighed. Signifier read too sharp and GT Alpina was a stopgap.
- **Bodoni Moda, Playfair Display.** High-contrast didones read as fashion, not tools.
- **Dropping the serif** (Linear, Framer, Ghost all do). It would remove the thing Rueca has that its peers in the dev-tool space do not.

## 10. Next steps and open questions

1. **Rafael: Plex or Host Grotesk for body?** Everything in section 8 follows from this one choice.
2. **Rafael: hero leading, 0.92 or keep 0.82?** I would change it. Check it on a phone at 375px with the real hero line, because that is where it collides.
3. **Update `RUECA.md`** (hero `clamp` is out of date against the code) once the scale is agreed.
4. **Build a specimen page** for Goudy plus Host Grotesk at the proposed scale inside `brand/specimen/`, using the real hero and card copy. The throwaway render used for section 9 lives outside the repo, in this session's scratchpad, and is not reusable as is.
5. **Check Goudy at 17 to 19px** in the existing card titles and switch them to Host Grotesk 500 (the H4 sans variant) or raise them to 20px.
6. **Layout.** This note covers type only. The grid, measure and spacing side is with the layout sessions (`trove-layouts.md`, `web-layouts.md` in this folder). The two things type asks of them: a 62 to 66 character reading column, and spacing that lands on the same 4px grid as the line heights above.

## Sources

Live sites (computed styles read 16 Oct 2026 at 1440px): [anthropic.com](https://www.anthropic.com), [claude.com](https://claude.com), [readwise.io](https://readwise.io), [every.to](https://every.to), [resend.com](https://resend.com), [harvey.ai](https://www.harvey.ai), [attio.com](https://www.attio.com), [wealthsimple.com](https://www.wealthsimple.com), [notion.com](https://www.notion.com), [cursor.com](https://cursor.com), [thebrowser.company](https://www.thebrowser.company), [granola.ai](https://www.granola.ai), [press.stripe.com](https://press.stripe.com), [linear.app](https://linear.app) and [linear.app/method](https://linear.app/method), [thinkingmachines.ai](https://thinkingmachines.ai), [elicit.com](https://elicit.com), [mymind.com](https://mymind.com). Checked for a serif and not found: Ghost, Framer, Lovable, OpenAI, Mercury, Oxide, Tailscale, Superhuman. Foundry sites: [klim.co.nz](https://klim.co.nz), [commercialtype.com](https://commercialtype.com), [grillitype.com](https://www.grillitype.com), [productiontype.com](https://www.productiontype.com), [pangrampangram.com](https://pangrampangram.com).

Font metrics and licences: Google Fonts repository metadata and font files for the families linked in section 7, plus `src/landing/fonts/*.woff2`, `brand/fonts/host-grotesk/`, and the installed `@fontsource-variable` Plex and Geist Mono files, read table by table (OS/2, GSUB, GPOS, hmtx).

Rueca files: `brand/RUECA.md` (Type), `src/landing/landing.css`, `src/landing/plate.css`, `src/landing/Landing.tsx`, `src/landing/parts.tsx`, `src/landing/ShellRail.tsx`, `research/28-brand-soul-audit.md`, `brand/references/fonts/`.
