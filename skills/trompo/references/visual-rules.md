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

- **Shadows are tokens too.** Light-theme shadows must be far softer or they read as
  dirt. Dark `0 8px 32px rgba(0,0,0,.45)`; light
  `0 1px 2px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.07)`.
- **Theme is a class on `<html>`**, defaults to the OS preference, persists to
  `localStorage`. Resolve it in a tiny inline script in `<head>` before first paint.
  Never hardcode `class="dark"` in `index.html` — the first paint fights the stored
  choice.
- **Two accents.** A bright one (`#0d99ff`) for fills, tracks and indicators; a
  **darker** one (`#0a72c6`) for accent *surfaces that carry text*. White on
  `#0d99ff` is 2.99:1 and fails WCAG AA for a button label.
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
  Trompo's own pink either: at hue 353–360° it sits 25–32° from `rec`, so the
  selection would look like an error or a recording. It also stamps someone else's
  tool with our brand.
- **The rule:** keep the accent at least **35° of OKLCH hue** from any chromatic
  colour covering ≥ 4% of the rendered artboard, and from `rec`, `key` and `ok`.
  Greys can't clash (OKLCH chroma < 0.06 is ignored), so a monochrome prototype
  always keeps blue. That leaves accents between roughly 195° and 350°.
- **Measure it, don't eyeball it:** `scripts/accent-check.mjs <url>` screenshots the
  artboard alone, buckets its pixels by hue and names the fallback → `qa.md` §2.
- **Fallbacks, pre-audited** (fill ≥ 3:1 on the panel, white label on `strong`
  ≥ 4.5:1, both themes). Pick the one the check names:

  | Accent | Hue | Dark: fill / strong | Light: fill / strong |
  |---|---|---|---|
  | blue (default) | 249° | `#0d99ff` / `#0a72c6` | `#0b84e0` / `#0a6fc0` |
  | violet | 293° | `#9c78fd` / `#704ec0` | `#8862e5` / `#6a48b9` |
  | magenta | 332° | `#d561c8` / `#9e3a93` | `#be4bb1` / `#97338d` |
  | cyan | 222° | `#00a5cb` / `#007590` | `#008eaf` / `#006e89` |

  Override in the project's own CSS, after the theme import. Never edit the kit's
  theme file. `:root:root` outranks the theme's own `:root` rules, and the media block
  covers pages that follow the OS theme:
  ```css
  :root:root       { --signal: #d561c8; --signal-strong: #9e3a93; --signal-soft: rgb(213 97 200 / .16); }
  :root:root.light { --signal: #be4bb1; --signal-strong: #97338d; --signal-soft: rgb(190 75 177 / .12); }
  @media (prefers-color-scheme: light) {
    :root:root:not(.dark) { --signal: #be4bb1; --signal-strong: #97338d; --signal-soft: rgb(190 75 177 / .12); }
  }
  ```
- **One accent per project, not per theme.** If dark and light disagree, pick one
  fallback for both.
- **If nothing clears 35°** (a full-spectrum prototype), keep blue and make selection
  shape-led rather than colour-led: a two-tone outline that reads on any background.
  ```css
  box-shadow: 0 0 0 1.5px var(--signal), 0 0 0 3px var(--field);
  ```
- Re-run the check when the prototype's palette changes. A rebrand inside the artboard
  can create a clash that wasn't there yesterday.
- **Density is one knob:** `--row` (28px default; 24 compact, 32 comfortable),
  `--gutter`, `--inspector-w`.

## 4. Modern tool vs Photoshop 2010

The dated version: flat grey panels, a hard 1px border on every edge, uppercase
micro-caps with wide tracking, uniform always-on rows, zero radius, no depth.

- **Radius and shadow replace borders.** Panels 12px radius + soft shadow. Where a
  boundary is genuinely needed inside a panel: 1px at 6–8% — never a solid grey
  rule, never on all four edges.
- **Separate surfaces with a luminance step** (~5% field → panel), not a line. A 1px
  top inner highlight reads as raised without a bevel.
- **Panels float as islands** with a gutter when the work is an artboard; dense
  editors may dock flush (Figma UI3 dropped floating panels for its main editor —
  offer both, see `layouts.md`). The canvas is allowed to be mostly nothing.
- **Sentence case, never micro-caps.** The single biggest fix.
- **Hierarchy via opacity tiers at one type size** (~100% / 63% / 45%), not by mixing
  weights and sizes.
- **One accent, only on state** — filled slider, selection, focus, primary button.
  Nothing decorative is accented. The playhead is `rec`, never the accent.
- **Toolbar as 2–3 detached pill clusters.** Secondary actions are bare low-opacity
  glyphs; only the ONE primary action gets a filled container.
- **Hover reveals** reset icons, slider thumbs, eye/lock, value-chip backgrounds. A
  column of 20 always-on controls reads as noise; with hidden thumbs it reads as
  data. **Everything hover-only must also show on `:focus-visible` / `focus-within`.**
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
<div className="flex h-full flex-col gap-3 p-3">   {/* the only gutter */}
  <Toolbar />                                      {/* h-9, no padding */}
  <div className="flex min-h-0 flex-1 gap-3"><main className="flex-1" /><Inspector /></div>
  <Timeline />
</div>
```

Verify: `aside.top - header.bottom` must equal `aside.left - main.right`.

### Type scale — smaller than product UI

```
section heads   11–11.5px / medium / sentence case / no tracking
labels          11.5px / muted tier
numeric values  11px / tabular-nums
buttons         12px / medium
title           13–16px
```

Always `font-variant-numeric: tabular-nums` on live numbers, or the inspector jitters
while dragging. Keep labels short enough not to truncate at the label column width
(~80px), and check truncation explicitly.

## 5. Controls

- **Number = scrubber.** Label *and* value are drag handles; click the value to type.
  Shift ×10, Alt ×0.1, Esc cancels, double-click resets, expressions (`*2`, `+24`,
  `w/3`) allowed. One drag = one undo step. It beats aiming at a slider thumb.
- **Modes get segmented controls** (2–4 short options), not dropdowns. Long labels
  or 5+ options → dropdown, or icon-only segments with tooltips.
- **Display option strings capitalised** (`'solid'` → "Solid"), keep raw values.
- **Every drag has a non-drag alternative** (typed field, stepper, menu item) —
  WCAG 2.5.7. Targets ≥ 24px (2.5.8).
- **Interaction ownership:** an operation lives on the canvas *or* the panel, not
  mirrored confusingly on both (exception: a numeric field shadowing a canvas handle).
- **Empty selection → document / scene settings** in the inspector, never a blank
  panel.
- **Colour:** OKLCH first-class with a P3 badge; hex/RGB/HSL alternatives; eyedropper.
- **Springs default to Duration + Bounce**, physics (stiffness/damping/mass) as an
  advanced toggle.
- **Keyframe button:** hollow faint → hollow accent (animated) → solid accent (key at
  playhead). Shape + colour, never colour alone.
- `prefers-reduced-motion` applies to the chrome, never to the artwork.
