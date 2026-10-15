# Control audit A: kit nesting primitives + 9 shells

Scope: `src/kit`, `docs/KIT.md`, `skills/rueca/references/*`, and the shells animate, batch, component-lab, dither, dropin, flows, generate, journey, marks. Read-only. 2026-10-15.

Screens used: `research/qa-shots/<shell>-dark.png` (1440×900, Oct 15 17:59). These are the newest captures and already use the new "Tactical" default density. The `public/thumbs` captures are older (Oct 11) and smaller, so I didn't use them.

## Summary

| Shell | Visible at rest | Core | Occasional | Set-once | Rare/debug | Worst offender |
|---|---|---|---|---|---|---|
| animate | 36 | 13 | 17 | 3 | 3 | ~260px timeline plus a 9-control transport. Toolbar A/B, Share and Send act on the 7 artboard/playback prefs, not the animation. |
| batch | 36 | 13 | 17 | 2 | 4 | Three show/hide switches and a seed at rest in Layout/Look. "Add size" appears twice. |
| component-lab | 34 | 11 | 20 | 1 | 2 | Two "Custom" preset menus with the same label. The toolbar one duplicates the token preset grid. |
| dither | 32 | 10 | 14 | 2 | 6 | A 14-tile palette picker fills the right panel. Adjust comes first with 7 rows, and the looks vary only 2 of them. |
| dropin | 20 | 7 | 12 | 1 | 0 | The toolbar has more controls (11) than the inspector (8). |
| flows | 33 | 5 | 15 | 9 | 4 | 8 set-once canvas/connection prefs fill the at-rest inspector. Walkthrough appears 3× and Tidy up 2×. |
| generate | 25 | 8 | 12 | 2 | 3 | The right panel opens on an empty "Select an image" card. The share link is dead because `url: false`. |
| journey | 32 | 4 | 16 | 9 | 3 | The at-rest inspector is mostly view prefs plus 3 duplicates (Scenario, Tags, Lanes), and it scrolls. |
| marks | 18 | 5 | 7 | 6 | 0 | Two family pickers with the same icons but different meanings (view filter vs reroll pool). Brand identity sits on top. |

How I counted: every discrete control a user can operate at rest counts as one: a button, field, slider, switch, select, segmented control, or a tab strip. A homogeneous collection (layer list, preset grid, data table, tile grid, zoom pill) counts once. Hover-only affordances and the brand/home mark are left out. Readouts (stats, contrast tables, status pills) aren't controls.

**What the evidence covers.** `.rueca/notes/` holds one note, for **motion** (rings, voidR, gap, weight, dash). None of the nine shells has Send-to-agent notes or "Rafael's tuning" commits. Every git commit touching them is a sweeping pass (copy, a11y, demos, rebrand). So the classifications below rest on:

1. **What the shell's presets vary.** This is the strongest signal available.
2. **Defaults.** A param whose default is "off/0" and which every preset leaves at "off/0" is a weak signal.
3. **Duplication.** A second copy of a control is by definition not the primary path.
4. **Heuristics:** view/export/identity settings count as set-once.

Treat these labels as judgement, not usage data.

---

## Part 1: Kit mechanisms for hiding, nesting and prioritising

### What exists today

| Mechanism | Where | Notes |
|---|---|---|
| **Folders** (`folder(label, params, { collapsed, hint, when })`) | `core/schema.ts` | The top level is always folders, and each folder becomes one Section. `collapsed: true` sets the initial state. Only 6 of 19 shells use it: ui-design, marks, dropin, type, shader, flows. |
| **Conditional rows** (`when: (v) => bool` on any def) | `schema.ts`, `Inspector.tsx` (`LiveRow`) | Hides the row. Dither uses it best: its effect-specific rows swap per effect. |
| **Conditional folders** (`folder(…, { when })`) | `Inspector.tsx` | Hides the whole section. Batch hides its Lock folder this way: `when: () => false`. |
| **Disabled** (`disabled: bool \| (v) => bool`) | `Inspector.tsx` | Greys the row out (40% opacity, no pointer). Batch uses it for brand lock. |
| **Section collapse, persisted** | `Inspector` stores open state in localStorage under `studio:<id>:sections:<folders\|id>`. `Section` takes `persistKey`. | Alt-click a header to solo it. Hand-built shell Sections mostly don't pass `persistKey` (flows uses its own state), so their collapse state is forgotten on reload. |
| **Changed dot on a section header** | `Inspector` computes `changed` for each folder whether it's open or closed. `Section` renders the dot next to the title. | Works for schema folders, so a collapsed section shows its dot. Hand-built Sections only get one if the shell passes `changed` (batch Overrides, component-lab Accent and dither Palette do). |
| **Row changed cue + reset** | `Row` | Shows a dot and full-contrast label. Double-click the label to reset; hover the header to reset the whole section. |
| **Inspector subsets**: `folders={[…]}` (in order) and `keys={[…]}` | `Inspector.tsx` | This is how shells split one schema across tabs and panels: batch's Design/Brand tabs, generate's composer vs Create. `keys` is an author-curated subset, but nobody uses it to promote rows. |
| **`publish: true`** + `<Inspector published>` / `<ClientView>` | `schema.ts`, `ClientView.tsx` | The only "these knobs matter most" flag in the schema, and it's wired to the client view only. Of these nine shells, only present uses it. |
| **Popovers inside a row** | Curve rows (glyph + numbers → editor popover), `ColorField`, gradient stops, `PaletteField` swatches, `EasingEditor` (animate keys), `SpringField` (physics behind a toggle) | Precedent for "summary in the row, detail in a popover", but it exists only per control type, never for a group of params. |
| **`ContextBar`** | `stage/ContextBar.tsx` | 3–8 selection actions only, no fields. Candil asked for a field-carrying HUD (`19-candil-rebuild-gaps.md`). |
| **Command palette** | `system/palette.tsx` | Commands are hand-written `Command[]`. Nothing generates commands from params, there's no param search, and typed values like `contrast 0.2` aren't supported. |
| **QuickAdd** | `system/quick-add.tsx` | A search popover at the cursor for adding items. Not used for params. |
| **Presets**: built-in + user, `mode: merge\|replace`, `presetKeys`, `activePreset()`, `PresetMenu`, `PresetGrid`/`Filmstrip` | `params.ts`, `actions.tsx`, `ui/preset-grid.tsx` | `presetKeys` separates "look" keys from the rest. Only shader and synth set it. The keys outside it are by definition not look settings (canvas size, export), which is a ready-made signal for "collapse by default". |
| **ParamActions cluster** | `system/actions.tsx` | Undo, redo, A/B, presets, Send to agent, share, theme: up to 7 icons on every shell. Each part can be turned off with a prop, but the default is all on. |
| **Panel tabs** (`PanelTabs`) | `layout/Studio.tsx` | The main nesting tool in practice: batch Design/Brand/Export, generate Create/Details, flows Inspect/Comments, component-lab Tokens/Code, animate Animations/State machine. |
| **Selection-driven inspector** | Shell convention, reinforced by visual-rules "Empty selection → document / scene settings" | Selecting something swaps the inspector's contents. With nothing selected, that same rule fills the inspector with doc/view prefs (see below). |
| **EffectStack `renderDetails`** | `ui/stack.tsx` | A disclosure per stack row, so a row can expand to show its params. |
| **Timeline `collapsible` / `defaultOpen`** | `timeline/Timeline.tsx` | The read-only Timeline can collapse. KeyTimeline and TrackTimeline have lane-level collapse only. |
| **Present mode** (⌘\\ hides all chrome) | `Studio.tsx` | Hides everything or nothing. The "presence levels" (⇧\\ minimise, idle fade) are still open in `21-chrome-density.md`. |
| **Density tokens** | `theme.css`, `core/density.ts` | Make each control smaller, but don't reduce how many there are. |

### Missing, compared with common patterns

1. **No per-param priority or "advanced" flag.** Priority exists only per folder (`collapsed`). Lightroom, Blender and Unity can tuck the tail of a section behind "Show more" / ▸ More. Today a shell that wants that has to split the folder in two ("Effect" and "Effect · more"), and nobody does.
2. **No group popover / summary row.** Nothing like `folder(…, { display: 'popover', summary: (v) => '30 steps · CFG 7' })`. Generate hand-builds exactly this as its composer chip. Curve rows, colour fields and animate's easing already prove the pattern one control at a time.
3. **No "show only changed" filter** and no inspector search. The changed dot and `toJSON({ changedOnly })` exist, but nothing in the UI filters on them.
4. **No author-pinned / promoted params.** You can't say "these 5 are the face of this tool" without hand-building a panel. `publish` is close but tied to ClientView, and `keys` is per-call.
5. **The palette can't find params.** There's no `paramCommands(params)` that turns the schema into "Set Contrast…" / "Reset Gamma" / "Effect: Halftone" commands. Candil gap #6 (typed values in ⌘K) asks for the same thing.
6. **No toolbar settings popover for set-once prefs.** The kit has nothing like `<SettingsMenu params folders={['canvas','playback']} />`. That's the natural home for grid/snap/minimap/fps/export-scale/density, which today sit in the inspector.
7. **No usage signal.** Send-to-agent notes are the only record of what gets tuned, and they only exist when someone clicks Send. A dev-only `params.usage()` (commit counts per key in localStorage, plus a "never touched" overlay in the inspector) would turn this audit from heuristics into data.
8. **`ParamActions` has no notion of what the store covers.** In animate and generate the store holds only prefs or sampling settings, while the real work lives in a doc or a gallery. A/B, Share and Send-to-agent still render, and they operate on the wrong thing (see the shells below).
9. **Hand-built Sections lose things.** They lose collapse persistence and the changed dot unless the shell wires them. `21-chrome-density.md` phase 2 already plans to move flows, journey, batch, marks, generate and animate onto kit parts. Worth doing before adding new nesting primitives, so they get them for free.

### What the skill docs tell agents (this shapes every shell)

- **Nothing caps or prioritises the number of controls.** There's no "at rest" budget and no "the controls presets vary go first", and nothing anywhere says what to keep out of the inspector.
- `SKILL.md`: the starter tells the agent to *"Write the schema first — one line per knob"*. It describes `Inspector` as *"every control"*. The starter's own `output: folder('Output', { size })` is not collapsed.
- `kit-api.md`: the single hint is the example line `more: folder('Advanced', { … }, { collapsed: true })`, with no rule for when to use it.
- `architecture.md`: *"Use `when: (v) => …` for conditional rows"*. That's good, but it's the only priority advice.
- `layouts.md` (Inspector):
  - It lists the row context menu, stacks and Rive inputs.
  - It names Affinity **Studios** ("mode presets that swap the panel set (Design / Animate / Tune)"), which the kit doesn't implement.
  - It says nothing about how many rows to show.
- `visual-rules.md`:
  - *"A column of 20 always-on controls reads as noise; with hidden thumbs it reads as data."* This treats a 20-control column as a styling problem (hide the thumbs), not a count problem.
  - *"Empty selection → document / scene settings in the inspector, never a blank panel."* This rule causes the clutter in flows, journey and animate: with nothing selected, the inspector fills up with canvas/view prefs.
  - *"Springs default to Duration + Bounce, physics … as an advanced toggle"* is the only progressive-disclosure rule, and it applies to one control.
- `qa.md` has no "count controls at rest" check.

**Suggested skill additions** (route through copy-editing before they land):

- At rest, show what the presets vary plus what the user tunes every session. Aim for about 8–12 inspector rows.
- Set-once settings go into one of three places:
  - output, canvas size and export → a collapsed "Output" folder or the Export menu
  - view prefs (grid, snap, minimap, density, fps) → a toolbar View/Settings popover
  - identity (brand name, colours) → a collapsed folder or a tab
- Never put the same control in both the toolbar and the inspector.
- "Empty selection → document settings" means document *content* (title, duration, size), not view prefs.
- Add a qa.md step: list every control visible at 1440×900 and mark which ones the presets touch.

---

## Part 2: Shells

Legend: **C** core · **O** occasional · **S** set-once · **R** rare/debug or a duplicate. "At rest" = the QA screenshot state.

### animate (Tween): keyframe animator, islands, KeyTimeline

At rest the wheel is selected and the shell is in Animate mode. Chrome coverage is 50% (`21-chrome-density.md`).

| Control | Type | Where | At rest | Class |
|---|---|---|---|---|
| Design / Animate | segmented | toolbar centre | yes | C |
| Preview (state machine) | button | toolbar centre | yes | O |
| Undo / Redo | icon ×2 | toolbar | yes | O (⌘Z is the real path) |
| A/B compare | icon | toolbar (ParamActions) | yes | **R**: compares only artboard bg/fps/snap/onion |
| Send to agent | icon | toolbar | yes (dev) | **R**: `doc` isn't passed, so it sends the 7 prefs, not the animation |
| Share & copy | menu | toolbar | yes | **R**: the link carries prefs only, not the animation |
| Theme | icon | toolbar | yes | S |
| Export (MP4, PNG, SVG, CSS, JSON) | menu | toolbar | yes | C |
| Layer tree (+ hover eye/lock) | list | left | yes | C |
| Animations / State machine | tabs | left, 2nd panel | yes | O |
| New animation | icon | left | yes | O |
| Animation list (+ hover options menu) | list | left | yes | C |
| Eye, Lock | icon ×2 | inspector, Layer header | yes | O (also in the layer tree) |
| Name | text | inspector, Layer | yes | O |
| Position X/Y, Rotation, Scale, Opacity | scrub ×5 | inspector, Transform | yes | C |
| Width, Height | scrub ×2 | inspector, Shape | yes | O |
| Key buttons (per row) | 4-state diamond | inspector, row trailing | yes (animated rows) | C |
| Fill / Stroke rows | colour/number | inspector | for vector layers | O |
| Text, Font size | text/scrub | inspector | for text layers | O |
| Go to start, Prev frame, Next frame | icon ×3 | transport | yes | O |
| Play/Pause | icon | transport | yes | C |
| Time readout (s ↔ frames) | toggle | transport | yes | S |
| Loop mode | segmented | transport | yes | O (also in the inspector with nothing selected) |
| Add keyframe | icon | transport | yes | C |
| Snap | icon | transport | yes | S (also a Playback switch) |
| Auto-key | toggle | transport | yes | O |
| Lane key buttons | diamonds | timeline labels | yes | O (mirrors the inspector) |
| Key lanes (drag, marquee, easing segments) | canvas | timeline | yes | C |
| Zoom pill | pill | stage | yes | O |
| **Hidden:** easing popover (selected keys), key Time/Value | popover / section | inspector when keys are selected | no | C when used |
| **Hidden:** Animation name/duration/playback + "Select wheel" + "Animate mode" buttons, Artboard (bg ×2, onion, onion span), Playback (fps, snap, export scale) | sections | inspector with nothing selected | no | S/R |
| **Palette only:** ~40 commands (nudge, ±10 frames, copy/paste keys, easings, onion, reset demo) | ⌘K | — | no | O |

**Working**
- The inspector is driven by the selection.
- The easing editor sits in a popover on the key.
- The Design/Animate split keeps keying chrome out of design work.
- Onion span uses `when`.
- The palette carries the long tail.

**Not working**
- The 9-control transport plus ~260px of lanes is the biggest chrome block in the set.
- Snap and Loop each exist twice (transport and inspector).
- The ParamActions trio (A/B, Share, Send) is wired to a store that holds only view/export prefs, so all three do nearly nothing for the real work.
- With nothing selected, the inspector shows demo crutches: "Select wheel" and an "Animate mode" button that duplicates the toolbar.

**Suggestion**
- Pass `doc` to `ParamActions` (Send to agent), or turn off `compare`/`share` here.
- Move Artboard + Playback into a toolbar ⚙ popover, and remove the duplicate Snap/Loop rows.
- Drop "Select wheel".
- Fold Go to start / Prev / Next frame into keyboard + palette and keep Play, the time readout and Add key. That takes the transport from 9 to 5–6.

### batch: one template → N sizes × M data rows

The shell has three right-panel tabs: Design, Brand and Export. At rest it shows the Design tab with the template selected.

| Control | Type | Where | At rest | Class |
|---|---|---|---|---|
| Prev row / Next row | icon ×2 | toolbar centre | yes | O (← → keys) |
| Row picker "1/6 Achiote" | menu | toolbar centre | yes | C |
| Safe areas | toggle | toolbar | yes | O |
| Fits / N issues | button | toolbar | yes | C |
| Undo / Redo | icon ×2 | toolbar | yes | O |
| Presets (Editorial, Loud, Split, Minimal) | menu | toolbar | yes | C |
| Share & copy | menu (ArrowRightLeft icon, unlike the other shells) | toolbar | yes | R |
| Theme | icon | toolbar | yes | S |
| Export 24 | primary | toolbar | yes | C |
| Add size | menu | Sizes header **and** Design tab header | yes ×2 | O + **R (duplicate)** |
| Sizes list (aspect, override dot) | list | left | yes | C |
| Design / Brand / Export | tabs | right header | yes | C |
| Layout (Auto, …) | select | Layout | yes | O (no preset varies it) |
| Align | segmented | Layout | yes | O |
| Headline size | slider | Layout | yes | **C** (presets vary it) |
| Subhead size | slider | Layout | yes | O |
| Product size | slider | Layout | yes | C (preset) |
| Margin | slider | Layout | yes | C (preset) |
| Subhead / Badge / Price | switch ×3 | Layout | yes | O (only "Minimal" turns Subhead off) |
| Background | segmented | Look | yes | C (preset) |
| Button | segmented | Look | yes | C (preset) |
| Wax seals | switch | Look | yes | C (preset) |
| Grain | slider | Look | yes | O (default 0, and every preset sets 0) |
| Seed | seed field | Look | yes | **R** (scatter of decorative seals) |
| Overrides list | list | inspector | yes | O |
| Zoom pill | pill | stage | yes | O |
| Paste CSV, Import CSV, Download CSV | icon ×3 | Data header | yes | O / S / R |
| + Row | button | Data header | yes | O |
| Data grid | grid | bottom panel | yes | C |
| **Hidden:** Brand tab (name, logo style, logo file, paper, ink, display font, weight, tracking, body font, lock, palette in use) | tab | right | no | S |
| **Hidden:** Export tab (rows, format, scale, package, file names, size checklist, progress) | tab | right | no | S (mostly) |
| **Hidden:** Size inspector (name, size, safe area, overrides, checks, remove) | on size select | right | no | O |

**Working**
- Brand and Export as tabs is exactly right: set-once identity and output are out of the way.
- The Layout and Look split mostly matches what presets touch.
- The issues button and per-size override dots surface state without adding controls.

**Not working**
- Add size appears twice.
- Seed and Grain sit at rest even though every preset sets grain to 0.
- The three content switches (Subhead, Badge, Price) are content-visibility toggles that fit "Content", not "Layout".
- Share uses a different icon from every other shell.

**Suggestion**
- Collapse a "More" tail in Look: Grain and Seed.
- Move the three switches into a collapsed "Content" folder, or onto the data-grid column headers (an eye per column).
- Remove the inspector's Add size.
- Batch is otherwise the best-organised document shell in this set.

### component-lab: props on the left, tokens on the right, Preview vs States

| Control | Type | Where | At rest | Class |
|---|---|---|---|---|
| Preview / States | segmented | toolbar centre | yes | C |
| Undo / Redo | icon ×2 | toolbar | yes | O |
| A/B (tokens) | icon | toolbar | yes | R |
| Presets "Custom" (tokens) | menu | toolbar | yes | **R**: duplicates the preset grid in the right panel |
| Share tokens | menu | toolbar | yes | O |
| Theme | icon | toolbar | yes | S |
| Export | menu | toolbar | yes | C |
| Component list (Button, Text field, Card) | list | left | yes | C |
| Props presets "Custom" | menu | left, Props header | yes | O (same label as the toolbar menu) |
| Reset props | icon | left | only when changed | O |
| Variant | select | Appearance | yes | C |
| Layout | segmented | Appearance | yes | C |
| State | segmented | Appearance | yes | O (the States view covers it) |
| Media / New badge | switch ×2 | Content | yes | O |
| Eyebrow, Title, Body | text ×3 | Content | yes | C (title/body) / O |
| Actions | segmented | Content | yes | O |
| Mobile / Tablet / Desktop | segmented | stage | yes | O |
| Width | field | stage | yes | O |
| Preview theme | segmented | stage | yes | O |
| Tokens / Code | tabs | right | yes | O |
| Preset grid (6 looks) | grid | right top | yes | C |
| Accent (OKLCH L/C/H + swatch) | custom field | Accent | yes | C (every preset changes it) |
| Neutral tint | slider (hand-built row) | Accent | yes | O |
| Radius | slider | Shape | yes | C (preset) |
| Border | slider | Shape | yes | O |
| Shadow | segmented | Shape | yes | O |
| Family | select | Type | yes | C (preset) |
| Base size, Scale, Label weight | slider/select ×3 | Type | yes | O (presets) |
| Density | select | its own one-row "Density" section | yes | O |
| Contrast table (4 rows) | readout | right bottom | yes | (not a control) |
| **Hidden:** Code tab (CSS/JSON/Tailwind), States matrix, Button/Text field props, Behaviour folder (button) | tab/view | — | no | O |

**Working**
- The preset grid at the top of Tokens is the right priority. The looks people pick by eye come first.
- The props panel comes straight from the schema (`when` on error text).
- The States view pulls state out of the props.

**Not working**
- There are two preset menus labelled "Custom" (toolbar = tokens, left = props). The toolbar one also duplicates the grid.
- A/B on tokens is rarely needed when the preset grid already offers six one-click looks.
- Density is a one-row section.
- The contrast table spends 5 rows on a readout and pushes the panel to its bottom edge.

**Suggestion**
- Remove the toolbar `PresetMenu` and `CompareButton`.
- Merge Density into Type (or Shape).
- Collapse the contrast table to a section-header badge ("4/4 AA"), opening on click.
- Put Border/Shadow and Base size/Scale/Weight behind a "More" in their sections. Radius and Family stay visible.

### dither: photo → dither looks

| Control | Type | Where | At rest | Class |
|---|---|---|---|---|
| Open image | button | toolbar centre | yes | C |
| Use the sample image | icon | toolbar centre | yes | R |
| Undo / Redo | icon ×2 | toolbar | yes | O |
| Send to agent | icon | toolbar | yes (dev) | O |
| Share | menu | toolbar | yes | O (also in Export ▸ Share settings) |
| Theme | icon | toolbar | yes | S |
| Export | menu | toolbar | yes | C |
| Image card | thumb | left | yes | O |
| Looks (9 thumbnails, hover preview) | PresetGrid | left | yes | **C** |
| Save current as look… | button | left | yes | O |
| Auto levels | switch | Adjust | yes | O (no look changes it) |
| Brightness | slider | Adjust | yes | O (no look changes it) |
| Contrast | slider | Adjust | yes | **C** (every look sets it) |
| Gamma | slider | Adjust | yes | C (2 looks) |
| Blur, Sharpen | slider ×2 | Adjust | yes | **R** (no look, default 0) |
| Invert | switch | Adjust | yes | **R** |
| Effect | select | Effect | yes | C |
| Pixel size | slider | Effect (`when` raster) | yes | C |
| Diffusion | slider | Effect (`when` diffusion) | yes | O (1 look) |
| Serpentine | switch | Effect (`when` diffusion) | yes | **R** |
| Match by | segmented | Effect | yes | O (2 looks) |
| Extract palette | icon | Palette header | yes | O |
| Palette picker (14 named palettes) | tile grid | Palette | yes | C, but huge |
| Colours | palette field | Palette | yes | C |
| Before/after handle | drag | stage | yes | C |
| Split, Hold to peek | icon ×2 | view dock | yes | O |
| Pixel grid | icon | view dock | yes | S |
| Copy ASCII | icon | view dock | yes (disabled) | R |
| Zoom pill (pixel steps) | pill | stage | yes | O |
| **Hidden via `when`:** Bayer spread, Snap to palette, Cell size, Screen angle, Dot gain, Dot colour, Characters, Font size, ASCII colour, Swap ink & paper | rows | Effect | per effect | C for their effect |

**Working**
- `when`-driven effect rows are the kit's best example of conditional params.
- Looks as a visual grid with hover preview put the main choice first.
- The status pill shows the result without adding a control.

**Not working**
- The section order is upside down. Adjust comes first with 7 rows, but looks touch only Contrast and Gamma, and Blur, Sharpen and Invert are never set. Effect, the actual choice, comes second.
- The 14-tile palette picker takes about 350px, more than Adjust and Effect together, and pushes the real Colours field to the bottom. `21-chrome-density.md` measured the inspector scrolling 95px at the old density, and it only just fits now.
- "Use the sample image" is a demo affordance in the main toolbar.
- The disabled "Copy ASCII" sits in the dock for 7 of 8 effects.

**Suggestion**
- Order the sections Effect → Palette → Adjust.
- In Adjust, keep Contrast and Gamma and put Auto levels, Brightness, Blur, Sharpen and Invert behind "More".
- Turn the palette picker into a popover off the Colours row: a swatch strip plus a "Library ▾" button.
- Show Copy ASCII only when the effect is ASCII (`when`), or move it into Export.

### dropin: harness around a foreign iframe page

| Control | Type | Where | At rest | Class |
|---|---|---|---|---|
| All / Desktop / Tablet / Mobile | segmented (icons) | toolbar centre | yes | C |
| Interact / Hand | toggle | toolbar centre | yes | O |
| Reload prototype | icon | toolbar centre | yes | O |
| Undo / Redo, A/B, Presets, Send, Share, Theme | 7 icons/menus | toolbar | yes | O ×6, S ×1 |
| Hand off (snippet, open, share) | primary menu | toolbar | yes | C |
| Headline, Lede | multiline text ×2 | Copy | yes | C |
| Headline size | slider | Type & layout | yes | C (preset) |
| Gap, Corner radius | slider ×2 | Type & layout | yes | O (preset) |
| Background, Ink, Accent | colour ×3 | Colour | yes | C/O/C (presets) |
| Zoom pill | pill | stage | yes | O |
| **Hidden:** Art (Float, Tilt) | collapsed folder | inspector | no | R |

**Working**
- This is the model shell for "small inspector". It has 8 knobs, and the decorative Art folder is collapsed by default.

**Not working**
- The toolbar carries 11 controls for an 8-knob panel.
- A/B, Share and Send are all at full prominence.
- Share also appears inside Hand off, which already includes `shareMenuItems`, so it's duplicated.

**Suggestion**
- Drop the standalone Share icon, since Hand off has it.
- Put A/B and Send behind a "…" overflow.
- This is the reference to cite in the skill.

### flows: user-flow mapper (React Flow)

| Control | Type | Where | At rest | Class |
|---|---|---|---|---|
| Tidy up | button | toolbar centre | yes | O |
| Walkthrough | button | toolbar centre | yes | O |
| Undo / Redo | icon ×2 | toolbar | yes | O |
| Presets (Presentation, Dense map) | menu | toolbar | yes | O: the presets vary only canvas/view prefs |
| Theme | icon | toolbar | yes | S |
| Export | menu | toolbar | yes | C |
| New flow | icon | left | yes | O |
| Flows list | list | left | yes | C |
| Shapes (5 tiles: decision, start, end, rectangle, section) | tile row | left | yes | C |
| Search screens | field | left | yes | O |
| Screen library (thumbnails) | grid | left | yes | C |
| Inspect / Comments | tabs | right | yes | O |
| Name, Owner, About | text/select/textarea | Flow | yes | O |
| Overview stats + "Walkthrough" button | readout + button | Overview | yes | **R** (3rd Walkthrough) |
| Background, Snap to grid, Grid size, Wireframes, Minimap | segmented/switch/slider ×5 | Canvas | yes | **S** |
| Style, Labels, Smart sides | select/switch ×3 | Connections | yes | **S** |
| Move / Hand / Comment | ToolDock | stage bottom | yes | C / O / O |
| Screen / Decision / Sticky note | icon ×3 | ToolDock | yes | R (also in Shapes, on S/D/N and in QuickAdd) |
| Zoom pill, minimap | pill/map | stage | yes | O |
| **Hidden:** Auto layout (direction, column gap, row gap, Tidy up = 2nd Tidy), Walkthrough (follow, dim, autoplay) | collapsed folders | inspector | no | S |
| **Hidden:** node / edge / multi inspectors, comments | on selection / tab | right | no | C when selected |
| **Palette / QuickAdd:** add any template, zoom, comment mode, minimap | ⌘K / drag-off | — | no | O |

**Working**
- Selection-driven node and edge inspectors.
- Auto layout and Walkthrough start collapsed.
- QuickAdd at the cursor for adding nodes.
- Comments in a tab.

**Not working**
- With nothing selected, 8 of the 13 inspector controls are set-once view prefs. This is the "empty selection → document settings" rule turning into "empty selection → every preference".
- The built-in presets ("Presentation", "Dense map") vary exactly these prefs, which shows they're view modes rather than design values.
- Walkthrough appears 3 times (toolbar, Overview, folder) and Tidy up twice (toolbar, Auto layout action).
- Add screen/decision/note appears in four places: Shapes, ToolDock, keys and QuickAdd.

**Suggestion**
- Move Canvas + Connections + Auto layout + Walkthrough into a toolbar "View ▾" popover, where the two presets can sit as view modes.
- Keep Flow (name, owner, about) and Overview at rest.
- Remove the Overview Walkthrough button and the Tidy action row.
- Drop either the dock's add buttons or the left Shapes row.

### generate: text-to-image gallery

| Control | Type | Where | At rest | Class |
|---|---|---|---|---|
| Queue status "Idle" | status button | toolbar centre | yes | O |
| Undo / Redo | icon ×2 | toolbar | yes | O |
| A/B | icon | toolbar | yes | R (compares sampling settings; image Compare is a separate feature) |
| Presets "Balanced" (Draft, Balanced, Final photo, Print run) | menu | toolbar | yes | C |
| Send to agent | icon | toolbar | yes (dev) | R |
| Share | menu | toolbar | yes | **R/broken**: `createParams(…, { url: false })`, so a copied link never applies on open |
| Theme | icon | toolbar | yes | S |
| Export | menu | toolbar | yes | C |
| Library options, New session | icon ×2 | left | yes | O |
| All / Favourites / boards | nav list | left | yes | C |
| Sessions | list | left | yes | C |
| Favourites only | toggle | gallery header | yes | O |
| Group by prompt / none | segmented | gallery header | yes | O |
| Thumbnail size S/M/L | segmented | gallery header | yes | S |
| Create / Details | tabs | right | yes | O |
| Details empty state "Select an image" | empty card | right | yes | — (wasted at rest) |
| Prompt | textarea | composer | yes | C |
| Model | select | composer | yes | C (every preset sets it) |
| Aspect | menu | composer | yes | C |
| Images per run 1–4 | segmented | composer | yes | O |
| Negative prompt | toggle → field | composer | yes | O |
| Enhance prompt | icon | composer | yes | O |
| "30 steps · CFG 7 ⤨" | summary chip → Create tab | composer | yes | O |
| Generate ⌘↵ | primary | composer | yes | C |
| **Hidden:** Create tab (Steps, Guidance, Lock seed, Seed `when` locked, Variation, Upscale) | tab | right | no | O (steps/guidance vary per preset) |
| **Hidden:** tile hover actions, image details/reuse, multi-select bar | hover / select | — | no | C when used |

**Working**
- This is the best progressive disclosure in the set:
  - the composer holds the 4 things every run needs
  - the sampling settings collapse to a summary chip ("30 steps · CFG 7")
  - the seed hides behind Lock seed (`when`)
- It's the pattern the kit should generalise as a summary popover (see Part 1, missing item 2).

**Not working**
- The right panel defaults to the Details tab, which shows an empty-state card (about 220px) until something is selected.
- The ParamActions trio (A/B, Send, Share) operates on sampling prefs. Share is dead because of `url: false`.
- S/M/L thumbnail size is a set-once pref at the same prominence as the filters.

**Suggestion**
- Open on Create when nothing is selected and switch to Details on selection, or have the summary chip open a popover and hide the right panel at rest.
- Set `ParamActions compare={false} share={false}`, or let generate share prompt + settings.
- Move S/M/L into a View menu with Group by.

### journey: journey map, docked

| Control | Type | Where | At rest | Class |
|---|---|---|---|---|
| Highlight (tag) | menu | toolbar centre | yes | O |
| Lanes 7/7 | menu | toolbar centre | yes | O |
| + Card | button | toolbar centre | yes | C |
| Undo / Redo | icon ×2 | toolbar | yes | O |
| Presets (Workshop, Executive summary, Service blueprint) | menu | toolbar | yes | O (they vary only view/lanes) |
| Theme | icon | toolbar | yes | S |
| Export | menu | toolbar | yes | C |
| New persona | icon | left | yes | O |
| Personas list | list | left | yes | C |
| Name / role (inline), Age, Quote | inline/scrub | Profile | yes | O |
| Goals + add, Frustrations + add | list + icon ×2 | left | yes | O |
| Scenario | inline text | left | yes | O |
| Title | text | Journey | yes | O |
| Scenario | textarea | Journey | yes | **R (duplicate of the left panel)** |
| Insights (stages, pains, answered, low/high) | readout | Insights | yes | — |
| Tag chips (click to highlight) | chips | Tags | yes | **R (duplicate of toolbar Highlight)** |
| Column width | slider | View | yes | S |
| Density | segmented | View | yes | S |
| Tags, Links | switch ×2 | View | yes | S |
| Visible lanes (7 tiles, 2 rows × 64px) | multi tiles | Lanes | yes | **R (duplicate of toolbar Lanes)** |
| Smoothing, Height, Fill | slider ×2, switch | Emotion curve | yes | S |
| Emoji | switch | Emotion curve | **below the fold** | S |
| Map cards / curve (drag) | canvas | stage | yes | C |
| Zoom pill | pill | stage | yes | O |
| **Hidden:** card inspector (team/text/channel/level/tags/links/position/move), stage inspector (name/when/goal/emotion/feeling/cards) | on selection | right | no | C when selected |

**Working**
- The card and stage inspectors are content-first and well scoped.
- The toolbar Highlight and Lanes menus are good compact homes for view filters.
- The insights readout is useful at a glance.

**Not working**
- At rest the inspector is Journey (with a duplicate Scenario), Tags (a duplicate of Highlight), 4 View prefs, the Lanes tiles (a duplicate of the Lanes menu, about 140px of tiles) and 4 curve prefs.
- That's 9 set-once controls plus 3 duplicates. Only Title is real content, and the panel scrolls (Emoji is cut off at 1440×900).
- The presets confirm it: all three vary only view prefs.

**Suggestion**
- Drop the Lanes folder and the Tags chips from the inspector (the toolbar has both), and the Scenario duplicate.
- Move View + Emotion curve into a toolbar "View ▾" popover next to Lanes, with the presets as named view modes.
- At rest, the Map inspector becomes Title + Insights.

### marks: logo-mark variant explorer

At rest the shell shows the grid view with nothing focused.

| Control | Type | Where | At rest | Class |
|---|---|---|---|---|
| Family filter (all + 5 families) | icon segmented | toolbar centre | yes | C |
| Reroll (Space) | button | toolbar centre | yes | C |
| Undo / Redo | icon ×2 | toolbar | yes | O |
| Presets (Agalla, Night, Gabinete, Campana) | menu | toolbar | yes | O (brand swaps) |
| Theme | icon | toolbar | yes | S |
| Export | menu | toolbar | yes | C |
| Favourites (+ hover compare/unfavourite) | grid | left | yes | C |
| Variant grid (+ hover More like this) | grid | stage | yes | C |
| Wordmark, Initials | text ×2 | Brand | yes | S |
| Ink, Paper | colour ×2 | Brand | yes | S |
| Accent | colour | Brand | yes | O |
| Families (reroll pool) | multi tiles | Explore | yes | O; **looks like the toolbar filter** |
| Variants 12/16/20/24 | segmented | Explore | yes | S |
| Reroll params | switch | Explore | yes | O (label truncated to "Reroll para…") |
| Variation | slider | Explore | yes | O |
| **Hidden:** Lockup (layout, weight, tracking, word size), Icon export (background, padding) | collapsed folders | inspector | no | S |
| **Hidden (focus view):** prev/next, compare, more like this, favourite, lock, family params (Inspector), compare/"Use B", **Export section with 6 buttons**, size ladder / More like this tabs | on focus | toolbar / right / bottom | no | C when focused |

**Working**
- The lowest count in the set (18).
- Lockup and Icon export start collapsed.
- The focused mark's own params appear only on focus.
- Reroll is one big obvious verb.

**Not working**
- Two family pickers with identical icons: the toolbar filter (which families you *see*) and the Explore → Families tiles (which families a reroll *draws from*). That's the most confusing duplicate in this audit.
- Brand identity sits at the top of the inspector: 4 set-once controls ahead of Explore, which you use every session.
- In focus view, the inspector's Export section repeats the toolbar Export menu as 6 buttons.

**Suggestion**
- Order Explore → Brand, and collapse Brand once it's set (presets swap it whole).
- Merge the two family pickers: the reroll pool follows the filter, or the Explore tiles become a "Draw from: filter / all" switch.
- In focus view, replace the Export button block with the toolbar menu.

---

## Patterns across the nine shells

1. **The ParamActions default costs 4–7 icons on every toolbar.** Three of them (A/B, Share, Send) often act on the wrong store:
   - animate: prefs only, no doc
   - generate: share is dead with `url: false`
   - flows/journey/marks: presets that are really view modes

   Suggested kit default: undo/redo + presets visible, with A/B, Share, Send and Theme in a "…" overflow. Better still, have ParamActions refuse share/compare when the store has no `share`-able look values.
2. **"Empty selection → document settings" fills inspectors with view prefs** (flows, journey, animate). A kit `SettingsMenu`/View popover and a rewording of the rule would fix all three.
3. **The same control in two places.** It happens in 7 of 9 shells:

   | Shell | Duplicated control |
   |---|---|
   | animate | Snap, Loop, mode |
   | batch | Add size |
   | component-lab | presets |
   | flows | Walkthrough ×3, Tidy, add-shape ×4 |
   | journey | Lanes, Tags, Scenario |
   | marks | families, Export |
   | dropin | Share |
4. **Presets are the best evidence available, and they already separate look from view.** Where presets vary only view prefs (flows, journey), those prefs are view modes. Where presets never touch a param (dither Blur/Sharpen/Invert, batch Seed), it's a "More" candidate. A kit helper could compute this: params that no built-in preset touches and that sit at their default → collapse by default (dev hint).
5. **Real usage data exists for one shell only (motion).** Adding a dev-only per-key commit counter would let the next pass rank controls by use instead of by inference.
