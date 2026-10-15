# 21 · Chrome density: quieter shells (2026-10-15)

Rafael's brief: the shells and most controls are too generous with spacing. The chrome overpowers the prototype. Make it more tactical without losing the modern look, kit-wide if that's the right fix, and check whether a more compact font helps.

Six research passes went out:
- pro canvas tools: Figma, Framer, Paper, Rive, Spline, tldraw, Excalidraw, Blender
- overlay tuning panels: DialKit, Leva, Tweakpane, lil-gui, Theatre, Toolcraft, Agentation, React Scan
- tools outside design: Ableton, Bitwig, TouchDesigner, Houdini, Unity, Zed, VS Code, the TE web tools, and the smallest sizes of Radix, Primer, Fluent and Carbon
- UI fonts, measured
- a live audit of our 17 shells
- Rafael's Trove

Then the two candidate directions were simulated as a CSS override on the real shells. Boards, close-ups and the simulation CSS are in [`21-chrome-density/`](21-chrome-density/).

## What we found

**1. Spacing between rows isn't the main problem.** Rueca's row pitch is 29px. Figma UI3 and Paper are 32, Framer 40, Leva 31, Theatre 30, DialKit 42. Only Tweakpane and lil-gui are tighter (24), and they're the two that look like debug panels. We should still tighten, but height alone won't fix it.

**2. The weight comes from framing, width and ink.**
- *Framing.* Islands sit 12px apart, with a 12px radius and a `0 8px 32px .45` shadow. That's a heavy, opaque slab that darkens the prototype around it. tldraw floats with 8px, a 9–11px radius and shadows under 6px of blur. We float like tldraw but are sized like Figma.
- *Width.* The inspector is 280 wide with an 84px label column. Figma is about 240, and Paper puts labels inside the fields.
- *Headers.* Panel headers are 40 (Paper 32), section headers 32 plus 10 underneath, and the toolbar is 36.
- *Ink.* Labels and values share one grey, so nothing leads. Fields are filled `#2a2a2a` blocks. Every switch and slider fill is signal blue: the dither inspector has four blue elements at rest, competing with a colourful prototype. The lightest panels studied (Theatre, Toolcraft, the Figma plugin kit) draw fields bare until hover, keep labels dim and values bright, and save the accent for state.

**3. Our compact density switch barely does anything.** `data-density="compact"` moves chrome coverage from 37.1% to 36.8%. Only 13 places in the kit read the spacing tokens; 1,141 sizes are written as literals (`h-6`, `px-3`, `text-[11.5px]`…), and the shells add another 2,208.

**4. Chrome coverage today** (share of a 1440×900 window): 37% on average, 44–55% on timeline shells (motion 44, animate 52, photo 52, video 54, synth 55). Motion's and dither's inspectors don't fit and scroll.

**5. The font isn't the lever, but it has two bugs.**
- Inter has the tallest x-height of the 40 setups measured. Narrower fonts only look compact because they set smaller. At the same x-height, Geist and Plex are no narrower, and SF Pro is 4% wider.
- Swapping the font moved the panel height by 2px out of 425. Rows and headers set the height, not glyphs.
- The real narrow options cost legibility at 11px: Inter Tight and Mona Sans let "rn" merge into "m". The only narrow face that held up was IBM Plex Sans with its width axis, and it brings an IBM voice.
- **Bug:** the fontsource build of Inter has no stylistic sets. The `"cv11", "ss01"` in `theme.css` has never rendered.
- **Bug:** `--font-mono` falls back to Menlo in Chrome.
- 11.5px is a half-step nobody else uses. Inter is drawn on an 11px grid, where its x-height lands on exactly 6px.

**6. Rafael's references point the same way.** His density comes from hardware and game HUDs: Elektron, Teenage Engineering, Braun, Peace Walker, WipEout. The common traits are hairline dividers, one accent for state, tabular numbers, and chrome that steps back when nobody is editing (konolee's *Interval*, "three levels of interface presence"). The density comes from dropping padding, cards and radii, not from smaller type.

## Proposal: B · Tactical as the default

| Token | Today (→ "comfortable") | **B · Tactical (default)** | C · Instrument (→ "compact") |
|---|---|---|---|
| Inspector row | 28 | **24** | 22 |
| Field control | 24 | **22** | 20 |
| Icon button / small | 28 / 24 | **24 / 20** | 22 / 18 |
| Segmented | 28 (24 + 2 + 2 well) | **24** (22 + 1 + 1) | 22 |
| Switch | 30×18 | **26×16** | 26×16 |
| Section header + gap below | 32 + 10 | **26 + 4** | 24 + 2 |
| Panel header | 40 | **32** | 28 |
| Toolbar clusters | 36 | **32** | 30 |
| Row side padding | 12 | **10** | 8 |
| Label column | 84 | **72** | 72 (68 truncated labels) |
| Inspector / left panel | 280 / 240 | **256 / 224** | 240 / 208 |
| Gutter (edge and between islands) | 12 | **8** | 6 |
| Radius panel / control / cluster | 12 / 5–7 / 10 | **10 / 5 / 8** | 8 / 4 / 8 |
| Type | 10–12.5 in 6+ sizes | **11 for all UI text, 12 for titles; hierarchy by weight (450 labels, 550 section titles, 600 panel titles); 16px line-height** | same |

**Ink, the same in B and C:**
- *Labels dim, values bright.* Labels go from `--fg-muted` to `--fg-faint` (4.8:1, still AA). Untouched values go to about 86% white. Changed values keep full `--fg` and the dot.
- *Accent for state only.* A switch that's on becomes ink (85% white with a dark knob). Slider fills become 55% white on a 2px track. Checkboxes go to ink. Signal blue stays for focus, selection, the changed dot, the primary action and keyed/recording states. Aim for at most one saturated thing per section at rest.
- *Lighter panel material.* Panels at 90% opacity, `blur(24px) saturate(1.4)`, a 1px 6% hairline and a `0 2px 8px .25` shadow in place of the 32px one. Solid under `prefers-reduced-transparency`.
- *Quieter fields.* Fields lose the solid fill: B keeps a faint 4.5% wash, C shows bare values with a hairline underline and a fill on hover. The segmented control drops its well for a hairline outline, with a 9% white pill.

**Font:** stay on Inter, but ship the official Inter 4 build (rsms, `inter-ui`, about 65KB subset) so the features actually render: `cv05` (l with a tail) and `cv08` (I with serifs) separate I from l, and values use `tnum`. Drop `cv11` and `ss01`. Fix the mono stack so it ends on a font that exists. A mono face for values (Geist Mono) was considered: it runs 3–10% wider and edges toward the Leva/Tweakpane look, so it's not recommended.

**What it buys** (simulation, 1440×900, chrome coverage today → B → C):

| Shell | Today | B | C |
|---|---|---|---|
| motion | 44.7% (inspector scrolls 35px) | 41.9% (fits) | 39.5% |
| dither | 35.3% (inspector scrolls 95px) | 31.6% (fits) | 27.6% |
| ui-design | 38.9% | 35.9% | 33.8% |
| animate | 52.5% | 48.0% | 45.4% |
| nodes | 25.9% | 21.9% | 19.0% |

The bigger win is how it looks: compare `closeup-dither.png` and `closeup-ui-design.png`. B keeps every control and reads as a calmer, more exact instrument. The simulation doesn't touch the timelines, which are the largest remaining block on motion, animate, video and synth (264–284px tall). Timeline lanes 24 → 20, ruler 28 → 24 and transport 40 → 32 would give back about 50px more.

**Why B and not C as the default.**
- C's 20px controls and 6px gutter are where the debug-panel look starts.
- Its 240px inspector wraps the ui-design colour row onto a second line.
- C's caps section titles are the engraved-label styling the Candil decision ruled out ("Rueca's sentence case stands"); the board shows them only to make the option visible.
- C belongs on the existing `data-density="compact"` switch, without the caps.
- Today's values become `data-density="comfortable"`.
- Touch (`.studio-touch`) stays as it is.

**Guard rails** (where the other tools tip into a cheap debug look):
- no controls under 20px, and no row pitch under 24
- no radii of 2px or less
- no all-mono type
- no labels below 4.5:1
- no glass under 85% opacity over busy prototypes
- hit targets stay at least 24px (WCAG 2.5.8): rows are 24, and controls smaller than that keep a 24px hit area, as the switch already does

## Wiring it so it's one place to tune

1. **`theme.css`.** Add raw density variables:
   - sizes: `--d-control`, `--d-control-sm`, `--d-icon`, `--d-icon-sm`, `--d-section`, `--d-header`, `--d-toolbar`
   - spacing: `--d-pad`, `--d-gap`, `--d-label`, `--sidebar-w`
   - timeline: `--d-lane`, `--d-ruler`
   - type: `--ui-text`, `--ui-text-title`, `--ui-text-small`

   B is the default `:root`; `[data-density="comfortable"]` holds today's values and `[data-density="compact"]` holds C. Map them in `@theme inline` to `--spacing-control`, `--text-ui` and so on, so components read `h-control`, `size-icon`, `px-pad` and `text-ui`.
2. **`cn.ts`.** Register the new names with `extendTailwindMerge`, or `cn('text-ui', 'text-fg')` will drop one of them.
3. **`.studio-touch`.** Rewrite it as variable overrides (`--row: 48px; --d-control: 36px; …`) instead of the current class-name selectors (`.h-6`, `.size-6`, `.text-[11px]`). Those would silently stop matching once components move to tokens.
4. **Timeline, KeyTimeline, TrackTimeline and Layers.** Their JS constants (`ROW = 24`, `RULER = 26`, `rowHeight = 28`, `LABEL_W = 148`) read the CSS variables.
5. **Shells.** 14 shells hard-code panel widths (`rightWidth={300}`). Delete them so the tokens apply. The hand-rolled panels (flows, journey, batch, marks, generate, animate) should move onto `PanelHeader`, `Section` and `Row` instead of being retuned.

Size of the change:
- **Phase 1:** about 12 kit files and 90 edits, plus theme, `cn` and `KIT.md`. This gets most of what the simulation shows: Studio, Toolbar, Inspector, button, controls, scrub, slider, Layers, Timeline, KeyTimeline, Stage.
- **Full kit:** about 25 files.
- **Shells:** about 15 files, done by moving them onto kit parts.
- **QA:** re-run the coverage measurement in all three densities, the contrast audit in both themes, and the ClientView touch path.

## Status

**Phase 1 is built (2026-10-15).** Rafael chose B as the default, with today's sizes as `comfortable` and C as `compact` (without the caps).

What changed:
- **Tokens and theme.** The density tokens are in `theme.css` (table in `docs/KIT.md` §1), registered with tailwind-merge in `cn.ts`. `core/density.ts` gives `useDensityPx` for sizes computed in JS.
- **Components on the tokens:**
  - Studio, Toolbar, Stage, ContextBar
  - Inspector, button, controls, scrub, slider, param-slider
  - the field-like controls in color, special, layout-fields, easing, chip-input and key-button
  - Layers, Timeline, KeyTimeline
- **Ink:**
  - labels `fg-faint`, untouched values `fg-value`
  - switches, checkboxes and slider fills in neutral ink
  - the segmented control without a well
  - 90% glass panels with a hairline and a tight shadow, solid under reduced transparency
- **Font.** Official Inter 4 (`inter-ui`) with `cv05`/`cv08` for the chrome. The shells' artwork keeps fontsource's "Inter Variable", now imported by the app. The mono stack is fixed.
- **Touch.** `.studio-touch` is now variable overrides, keeping the class selectors for shells that still use literals.

Measured chrome coverage at 1440×900 (comfortable → default → compact):

| Shell | Comfortable | Default | Compact |
|---|---|---|---|
| motion | 44.7% (inspector scrolls) | 38.5% | 34.2% |
| dither | 35.2% (inspector scrolls) | 33.7% | 30.9% |
| ui-design | 39.1% | 38.3% | 38.4% |
| animate | 52.1% | 50.3% | 49.1% |

Motion gains the most because its timeline is now token-sized. Dither, ui-design and animate gain less, for two reasons:
- they pin their panel widths (`rightWidth={300}`)
- they build their own headers and rows

**Phase 2 is built (2026-10-15).** The tokens now reach every shell.

What changed:
- **Panel widths.** All 16 shells stopped pinning `leftWidth`/`rightWidth`, so they get the density's 224/256 (240/280 comfortable). None needed a pinned width back. Where content broke at the new width, the content changed:
  - flows' Status and Route style rows stack
  - the journey severity segment reads "Med" (with "Medium" as its tip)
  - photo's navigator zoom reads Fit / 1:2 / 1:1 / 2:1, as in Lightroom
  - component-lab's contrast rows put the label inline
  - the envelope's A/D/S/R fields go two by two
  - EffectStack's hover-only trash takes no room at rest, so shader's layer names fit at 224
- **Shell panels on kit parts.** Hand-built headers and groups became `PanelHeader` or `Section`: the synth sequencer header, animate's state-machine groups, component-lab's Props bar, the generate Sessions heading, and ui-design's design and page headers. The rest of the chrome moved from literals to the token names: list rows `h-row`, fields `h-control`, icon buttons `size-icon`, HUD clusters `h-bar`, padding `px-pad`, all UI text `text-ui` / `text-ui-sm` / `text-title`. Artwork keeps its sizes: journey cards, flow nodes, node views, gallery tiles, specimens and sequencer cells.
- **Kit parts on the tokens.**
  - TrackTimeline: tracks are a lane plus 12 (32 default, 36 comfortable), the ruler is `--d-ruler`, the name column is two label columns, and the default height fits six tracks.
  - EffectStack rows are `--row` + 2, the old 30 at comfortable.
  - data-grid, palette, quick-add, dialog, toast, jobs, error-boundary, variant-grid, code-block, preset-grid, special, easing, charts, oklch, key-button, layout-fields, tooltip, the history list and the stage overlays.
- **Touch.** `.studio-touch` is variables only. The `.h-6` / `.size-6` / `.text-[11px]` selectors are gone. The client view (`#/present?client`, 375×812) still measures 36px controls, 44px section headers, 14px labels and 16px inputs, and its portaled select items are 36px.
- **Fix.** The shader shell no longer clears `data-density` when it mounts. Opening the gradient studio used to reset any chosen density to the default.

Chrome coverage at 1440×900. Method: the union of every `.panel` and `.cluster` island, docked panels and the docked toolbar, sampled on a 2px grid. A `.panel` inside `<main>` is skipped, because there it frames the artwork (synth, component-lab). This counts slightly differently from the phase-1 table above: motion, untouched in phase 2, reads 37.9% against phase 1's 38.5%.

| Shell | Default, after phase 1 | **Default, after phase 2** | Comfortable | Compact |
|---|---|---|---|---|
| dither | 32.9% | **30.9%** | 34.3% | 27.7% |
| ui-design | 39.6% | **37.3%** | 40.4% | 34.9% |
| animate | 47.0% | **44.5%** | 49.5% | 41.7% |
| video | 54.0% | **51.1%** | 54.8% | 48.4% |
| synth | 56.3% | **52.2%** | 54.0% | 50.8% |
| photo | 52.0% | **46.9%** | 49.5% | 44.9% |
| journey | 41.7% | **36.7%** | 39.6% | 34.4% |
| component-lab | 33.6% | **27.7%** | 31.6% | 24.5% |
| shader | 22.4% | **16.9%** | 20.3% | 14.9% |
| flows | 34.5% | **30.6%** | 35.0% | 28.1% |
| batch | 44.6% | **42.4%** | 44.0% | 40.5% |
| nodes | 23.5% | **20.3%** | 24.6% | 18.0% |
| scene | 24.6% | **22.2%** | 26.9% | 19.6% |
| type | 26.7% | **24.7%** | 28.7% | 22.1% |
| marks | 17.3% | **15.2%** | 18.6% | 13.4% |
| generate | 14.0% | **12.2%** | 14.2% | 11.1% |

What's left on the timeline shells is mostly the bottom band: video's 248px timeline, synth's sequencer, and photo's 135px looks strip, whose tiles are fixed-size previews. Labels longer than the 72px label column still truncate in schema rows ("Column wi…", "Node previ…", "Headline …" with its changed dot). That's the phase-1 column width, not something a shell can fix.

## Follow-ups done (2026-10-15)

- **Density setting.** ⌘K → View → Density: Default / Comfortable / Compact. Remembered per browser (`studio:density`) and restored by `<Studio>`.
- **Labels fit.** The inspector's label column widens to its longest label, from 72px up to 42% of the row. "Stroke weight", "Column width" and "Reroll parameters" no longer truncate in schema inspectors. Hand-built `Row`s outside an `<Inspector>` keep the 72px column.
- **Badge contrast.** Badges use `text-ok-text`, `text-key-text` and `text-rec-text`, at least 4.5:1 on their wash in both themes. That fixes oklch's "sRGB", component-lab's AA/AAA grades and journey's high and low points. Component-lab's variant tiles pick ink or paper by real contrast.
- **Glass over WebGL.** Measured in the app's browser on Apple silicon at 120Hz, on the scene shell with the canvas forced to redraw every frame (a worst case): 111–117fps with the blur, 120 without, and the same slowest-5% frame time (9ms). The blur stays. `prefers-reduced-transparency` makes islands solid. Weaker GPUs haven't been measured.

## Still open

1. **Fields.** B's faint wash is built. Bare values until hover (C) is still an option.
2. **Presence levels:**
   - ⌘\ hides all chrome (Figma).
   - ⇧\ minimises: panels collapse to pills, and the inspector shows only while something is selected.
   - Idle islands fade to about 35% while you drag or scrub on the canvas.

## Sources

The agents' full reports are in the session scratchpad, not the repo. Third-party screenshots stay local.
- **Measured live:** tldraw, Excalidraw, Paper's and Linear's homepage editors, Leva, Tweakpane, lil-gui, DialKit, Theatre.js, Toolcraft, Agentation, React Scan, TE EP sample tool.
- **Read from source:**
  - figma-kit and figma-plugin-ds (Figma UI3 and UI2 replicas), the framer-plugin CSS
  - Blender `UI_interface_c.hh`, Unity `EditorGUI.cs`, Zed `spacing.rs`, VS Code `treeView.ts`
  - Radix Themes 3.1.6, Primer primitives 10, Fluent UI
- **Docs and posts:**
  - Figma's UI3 posts ("our approach to designing UI3"), and the forum feedback on the floating panels
  - Linear's 2026 UI refresh
  - Carbon data table, Material density, Matthew Ström's "UI Density"
- **Fonts:** measured with fontTools and Chrome against @fontsource 5.3, `inter-ui` 4.1.1 and `geist` 1.7.2. Inter's dynamic metrics, Apple's 11pt tracking and the Figma plugin kit all add tracking at 11px, never tighten it.
- **Trove:** Elektron Digitone, TE TP-7 and ZM-1, Peace Walker menus, WipEout (The Designers Republic), konolee's *supercommon systems* and *Interval*, Departure Mono.
