# Visual rules

The full token set lives in `assets/theme.css` (also shipped as the kit's
`theme.css`). This file is the reasoning behind it, so you can extend it without
breaking it.

## 1. The chrome is neutral. The artboard carries the brand.

Do not brand the harness. A neutral shell is what lets the thing being designed read
truthfully. If the prototype is for a specific brand, use that brand's skills and
apply them **inside the artboard only**.

> **Trap:** give the artboard its own font token (`--font-artboard`, or
> `--font-brand` / `--font-display`) separate from the chrome's `--font-ui`. If the
> artboard's body text reads `var(--font-ui)` and you later point that at Inter for
> the chrome, the prototype silently loses its brand face and nothing errors.

The only legal homes for a hex value are the artifact (inside the artboard / canvas)
and the theme file.

## 2. Four control surfaces, not one

The single most common source of "the active state looks wrong". A panel has four
distinct control surfaces; conflating any two makes a control vanish.

| Surface | Relationship | Used by |
|---|---|---|
| **well** | recessed *below* the panel | segmented-control background |
| **track** | a groove that must stay visible | slider rails |
| **raised** | clearly *above* the well | the active pill inside a well |
| **active** | above the *panel* | a toggled control sitting directly on a panel |

- **In a dark theme there is no luminance room below the panel.** A slider track at
  `#151515` on a `#1e1e1e` panel is 1.05:1 — invisible. Dark grooves go *lighter*
  than the panel (`#353535`), as Figma's do. Only the segmented well goes darker.
- **In a light theme the active pill is white**, which is also the panel colour. A
  toggled icon button on a white panel needs `--active` (grey), not `--raised`
  (white). Same token, two jobs, one invisible control.
- Text and number fields get their own fill (`--control`), distinct from the well.

## 3. Theming with `@theme inline`

Raw values live as plain CSS vars in `:root` / `:root.light`; `@theme inline` maps
them to Tailwind utilities **by reference**. A plain `@theme` bakes the hex into every
utility and cannot be themed at runtime.

```css
:root       { --panel: #1e1e1e; --fg: #ffffff; }
:root.light { --panel: #ffffff; --fg: #1a1a1a; }
@theme inline { --color-panel: var(--panel); --color-fg: var(--fg); }
```

- **Shadows are tokens too:** a hairline and a tight shadow, because a deep one darkens the
  prototype around every island. Dark `--shadow-panel` is
  `0 0 0 1px rgba(255,255,255,.06), 0 2px 8px rgba(0,0,0,.25)` plus a 1px inset top highlight.
  Light shadows must be far softer or they read as dirt: `0 0 0 1px rgba(0,0,0,.06), 0 2px 8px rgba(0,0,0,.06)`.
- **Theme is a class on `<html>`**, defaults to the OS preference, persists to
  `localStorage`. Resolve it in a tiny inline script in `<head>` before first paint.
  Never hardcode `class="dark"` in `index.html` — the first paint fights the stored
  choice.
- **Two accents.** A bright one (`--signal`, `#0d99ff`) for focus and selection: focus
  rings, selection outlines and handles, drop lines, the changed dot. A **darker** one
  (`--signal-strong`, `#0a72c6`) for accent *surfaces that carry text*, such as the primary
  button. White on `#0d99ff` is 2.99:1 and fails WCAG AA for a button label. Neither
  fills a slider, a switch or a tick: those are neutral ink (§ Density and ink).
- **Semantic colours, sparingly:** `key` (amber — keyframed), `rec` (red — playhead,
  record, error), `ok` (green).

### The accent is checked against the work

The accent (`--signal`) is the one chrome colour drawn **on top of the prototype**: the
selection outline, transform handles, focus ring, the selection wash. If the artboard
is built from the same hue, the person can't see what they've selected. If the
accent sits near a semantic colour, "selected" reads as "recording" or "keyframed".

- **Default: system blue** (OKLCH hue ≈ 249°). It is far from `rec` (25°), `key`
  (≈ 80°) and `ok` (160°), and blue already reads as "the tool is selecting this".
- **Never a brand colour.** Not the client's (that lives in the artboard), and not
  Rueca's own either. Brand reds and pinks sit within a few degrees of `rec`, so
  the selection would look like an error or a recording, and a brand accent stamps
  someone else's tool with our brand.
- **The rule:** keep the accent at least **35° of OKLCH hue** from any chromatic
  colour covering ≥ 4% of the rendered artboard, and from `rec`, `key` and `ok`.
  Greys can't clash (OKLCH chroma < 0.06 is ignored), so a monochrome prototype
  always keeps blue. That leaves accents between roughly 195° and 350°.
- **Measure it, don't eyeball it:** `scripts/accent-check.mjs <url>` screenshots the
  artboard alone, buckets its pixels by hue and names the fallback. `qa.md` §2 says what to
  check (the defaults and every preset) and lists the four pre-audited fallbacks.
- **Overriding it:** in the project's own CSS, after the theme import. Never edit the kit's
  theme file. A registry install declares the tokens on the kit's own roots
  (`.studio`, `.pop`, `[data-studio]`) and themes from `<html data-studio-theme>`, while this repo keeps
  them on `:root` with `.light` / `.dark` classes, so each rule names both. `:root:root` outranks the
  theme's own rules, and the media block covers pages that follow the OS theme
  (`scripts/accent-check.mjs` prints an equivalent block for the fallback it picks):
  ```css
  :root:root, :root:root :where(.studio, .pop, [data-studio]) {
    --signal: #d561c8; --signal-strong: #9e3a93; --signal-soft: rgb(213 97 200 / .16); }
  :root:root:is(.light, [data-studio-theme="light"]),
  :root:root:is(.light, [data-studio-theme="light"]) :where(.studio, .pop, [data-studio]) {
    --signal: #be4bb1; --signal-strong: #97338d; --signal-soft: rgb(190 75 177 / .12); }
  @media (prefers-color-scheme: light) {
    :root:root:not(.dark, [data-studio-theme="dark"]),
    :root:root:not(.dark, [data-studio-theme="dark"]) :where(.studio, .pop, [data-studio]) {
      --signal: #be4bb1; --signal-strong: #97338d; --signal-soft: rgb(190 75 177 / .12); }
  }
  ```
  The same selector overrides a density token (`--gutter`, `--row`…) when a project needs one.
- **One accent per project, not per theme.** If dark and light disagree, pick one
  fallback for both.
- **If nothing clears 35°** (a full-spectrum prototype, or colours the person picks), keep
  blue and make selection shape-led rather than colour-led: the two-tone outline in `qa.md` §2.
- Re-run the check when the prototype's palette changes. A rebrand inside the artboard
  can create a clash that wasn't there yesterday.

### Density and ink

- **Density is one knob:** `data-density` on `<html>` (default, `comfortable`, `compact`) retunes
  every size. Build with the size names (`h-row`, `h-control`, `size-icon`, `h-section`, `h-bar`,
  `px-pad`, `p-gutter`, `text-ui`, `rounded-control`…) and never literals (`h-6`, `px-3`,
  `text-[11px]`), or a part ignores the knob. The table is in kit-api.md. Merge classes with the kit's
  `cn`: shadcn's drops `text-ui` next to a colour.
- **The chrome stays quieter than the prototype:** labels dimmer than values, one text size (11px)
  with weight for hierarchy, and signal blue only for focus, selection and the primary action. A
  switch that's on, a ticked box and a slider's or knob's fill are neutral ink (`bg-ink`, `bg-fill`,
  `var(--fill)`), never blue. Accent-coloured text uses `text-signal-text`; semantic text on its own
  wash uses `text-ok-text`, `text-key-text` or `text-rec-text`.
- **Panels are a touch translucent:** 94% of the panel colour, with a hairline and a tight shadow, so
  they sit in the work rather than on top of it. Below 94% a bright or saturated prototype pulls labels
  under 4.5:1. No backdrop blur: at 94% it barely shows, and over a live stage (WebGL, video) it doubles
  the GPU's work. Solid under `prefers-reduced-transparency`.

## 4. Modern tool vs Photoshop 2010

The dated version: flat grey panels, a hard 1px border on every edge, uppercase
micro-caps with wide tracking, uniform always-on rows, zero radius, no depth.

- **Radius and shadow replace borders.** Panels `rounded-panel` (8px at the default density)
  with a hairline and a tight shadow. Where a
  boundary is genuinely needed inside a panel: 1px at 6–8% — never a solid grey
  rule, never on all four edges.
- **Separate surfaces with a luminance step** (~5% field → panel), not a line. A 1px
  top inner highlight reads as raised without a bevel.
- **Panels float as islands** with a gutter when the work is an artboard; dense
  editors may dock flush (Figma UI3 dropped floating panels for its main editor —
  offer both, see `layouts.md`). The canvas is allowed to be mostly nothing.
- **Sentence case, never micro-caps.** The single biggest fix.
- **Hierarchy at one type size, by weight and ink tier.** Weights 450 (labels), 550 (section
  titles), 600 (panel titles); ink tiers `fg-faint` (labels), `fg-value` (untouched values), `fg`
  (changed values, titles). Never by mixing sizes.
- **Blue only for focus, selection and the primary action.** Fills (switches, ticks, sliders,
  knobs) are neutral ink. Nothing decorative is accented. The playhead is `rec`, never the accent.
- **Toolbar as 2–3 detached pill clusters.** Secondary actions are bare low-opacity
  glyphs; only the ONE primary action gets a filled container.
- **Hover reveals** reset icons, slider thumbs, eye/lock, value-chip backgrounds. A
  column of always-on thumbs reads as noise; with hidden thumbs it reads as data.
  Hiding thumbs doesn't fix a long column: 20 rows at rest is too many (`layouts.md`
  § What shows at rest). **Everything hover-only must also show on `:focus-visible` / `focus-within`.**
- **Style the native scrollbar.** Browsers paint it light on dark UI — a bright slab
  against the canvas. Thin, translucent, inset with
  `border: 3px solid transparent; background-clip: content-box`.
- **Icons**: lucide, 14px at 1.5 stroke in chrome (16 in a tool dock). Never larger.
- **Avoid the AI-slop look**: default shadcn + Inter + purple gradient. The tool
  should look like a tool.

### Give the gutter a single owner

If the toolbar centres content in a tall bar *and* the inspector adds its own top
padding, the vertical gap ends up larger than the horizontal one and reads as a
mistake. Put the gutter on the shell; every island is flush.

```tsx
<div className="flex h-full flex-col gap-gutter p-gutter">   {/* the only gutter */}
  <Toolbar />                                                {/* h-bar, no padding */}
  <div className="flex min-h-0 flex-1 gap-gutter"><main className="flex-1" /><Inspector /></div>
  <Timeline />
</div>
```

Verify: `aside.top - header.bottom` must equal `aside.left - main.right`.

### Type scale — smaller than product UI

One size for the working text, hierarchy by weight and ink (default density; comfortable
adds half a pixel). Line height 16px.

```
section titles  11px / 550 / sentence case / no tracking     text-ui font-[550]
labels          11px / 450 / fg-faint                         (Row does this)
values          11px / tabular-nums / fg-value, fg + dot once changed
buttons         11px / medium (lg buttons 12px)               text-ui
panel titles    12px / 600                                     text-title font-semibold
small text      10px: rulers, hints, badges                    text-ui-sm
```

Font: Inter 4 (rsms's files, the `inter-ui` npm package) with `cv05` / `cv08`, so I, l and 1
never collide. Set those two codes only when Inter is loaded. Without it, SF Pro reads them as a slashed
zero and a serifed I (`install.md` § C). Always `font-variant-numeric: tabular-nums` on live numbers, or the inspector
jitters while dragging. The label column fits the longest visible label in its panel (72px up to
42% of the row), so long labels only truncate past that cap; check truncation explicitly.

## 5. Controls

- **Number = scrubber.** Label *and* value are drag handles; click the value to type.
  Shift ×10, Alt ×0.1, Esc cancels, double-click resets, expressions (`*2`, `+24`,
  `w/3`) allowed. One drag = one undo step. It beats aiming at a slider thumb.
- **Modes get segmented controls** (2–4 short options), not dropdowns. Long labels
  or 5+ options → dropdown, or icon-only segments with tooltips.
- **Display option strings capitalised** (`'solid'` → "Solid"), keep raw values.
- **Every drag has a non-drag alternative** (typed field, stepper, menu item) —
  WCAG 2.5.7. Targets ≥ 24px (2.5.8): controls are 22px, but keep a 24px row pitch or hit area.
- **Interaction ownership:** an operation lives on the canvas *or* the panel, not
  mirrored confusingly on both (exception: a numeric field shadowing a canvas handle).
- **One home per control.** An action sits in the toolbar, the inspector, the context bar or
  the transport, in one of them, and in ⌘K. Three "Add clip" buttons cost three times the attention.
- **Empty selection → the document's content** in the inspector: its look, size, duration or
  title, never a blank panel. View preferences (grid, snap, nudge, fps) go in `<SettingsMenu>`.
- **Colour:** OKLCH first-class with a P3 badge; hex/RGB/HSL alternatives; eyedropper.
- **Springs default to Duration + Bounce**, physics (stiffness/damping/mass) as an
  advanced toggle.
- **Keyframe button:** hollow faint → hollow accent (animated) → solid accent (key at
  playhead). Shape + colour, never colour alone.
- `prefers-reduced-motion` applies to the chrome, never to the artwork.

### Control geometry

These are the kit's control sizes at the default density. Use them for anything built by hand (the
no-build route, a control the kit lacks), and write the variable rather than the pixel value so View →
Density (comfortable, compact) still resizes it.

| Part | Default density | Variable |
|---|---|---|
| Inspector row | 24px tall, 10px side padding, label column 72px (up to 42% of the row) | `--row`, `--d-pad`, `--d-label` |
| Field, select, number scrubber | 22px tall, 4px radius, 11px text on `--control`, 8px side padding (6px on a number) | `--d-control`, `--radius-control`, `--ui-text` |
| Slider | 22px hit row; 2px rail on `--track` with a 0.5px `--line-strong` ring; `--fill` fill; 12px white thumb | `--d-control` |
| Segmented control | 22px; 1px inner padding, 2px between options, 5px radius, inset 1px `--line` ring; the selected option on `--active` with an inset 1px `--line-strong` ring; 13px icons | `--d-control` |
| Switch | 26 × 16px (small 22 × 14), 2px padding; off `--track` with an inset 1px `--line-strong` ring, on `--ink`; 12px thumb (small 10px) | none |
| Checkbox | 14px, 4px radius, inset 1px `--line-strong` ring; ticked `--ink` with a 10px check; 24px hit area | none |
| Field inside a toolbar cluster | 24px, the icon buttons' height, so each bar has one height (the cluster sets `--d-control` to `--d-icon`) | `--d-control` |
| Icon button, button, menu item, tab | 24px | `--d-icon` |
| Button beside a field (stepper −/+) | 22px square, the field's height | `--d-control` |
| Small icon button | 20px drawn, 24px hit area | `--d-icon-sm` |
| Large button | 28px, 12px text | `--d-button-lg` |
| Section header · panel header · toolbar cluster | 26px · 32px · 32px | `--d-section`, `--d-header`, `--d-bar` |
| Timeline lane · ruler | 20px · 24px | `--d-lane`, `--d-ruler` |
| Inspector · sidebar width | 256px · 224px | `--inspector-w`, `--sidebar-w` |
| Gutter (window edge, between islands) | 8px | `--gutter` |
| Radius: panel · popover · cluster · control | 8 · 8 · 6 · 4px | `--radius-panel`, `--radius-pop`, `--radius-cluster`, `--radius-control` |
| Icons | 14px at 1.5 stroke (16px in a tool dock) | none |
