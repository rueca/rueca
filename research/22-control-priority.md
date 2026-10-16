# 22 · Control priority: what shows at rest, what nests (2026-10-15)

Rafael's brief: we show a lot of controls that barely get used. Get better at deciding what stays visible and what lives under a nested menu. Research how other tools structure this, find the best ways to nest controls, and audit what we have, where it works and where it doesn't, before proposing changes.

Ten passes went out:
- **canvas tools:** Figma UI3, Framer, Paper, Penpot, Sketch, Webflow, Spline, Rive, tldraw, Excalidraw, Keynote
- **motion, 3D and engines:** Unreal, Unity, Blender, Houdini, After Effects, Cinema 4D, TouchDesigner, Notch, Cavalry
- **audio, photo and video:** FabFilter, Arturia, u-he, iZotope, Ableton, Bitwig, Elektron, OP-1, NKS, Lightroom, Capture One, Apple Photos, Photoshop, Resolve, Final Cut, Premiere
- **tuning panels and dev tools:** Leva, Tweakpane, lil-gui, Theatre, DialKit, Toolcraft, Storybook, VS Code, Chrome DevTools, Zed, Linear, Raycast, the Office ribbon
- **web creative tools:** Paper Shaders, ShaderGradient, Unicorn Studio, cables.gl, Hydra, Haikei, Kittl, Krea, Midjourney, Recraft, Jitter, Josh Comeau's shadow generator, oklch.com
- **HCI evidence:** progressive disclosure, split menus, adaptive vs adaptable menus, hidden-navigation studies
- **Mobbin:** real product screens, grouped by nesting mechanism
- **two code audits** covering all 19 shells and the kit's nesting primitives
- **Rafael's Trove** (thin on UI, as expected)

I also counted the controls visible at rest in 11 shells in the live app. The full reports are in [`22-control-priority/`](22-control-priority/). Each claim is marked [V] verified, with its source, or [I] inferred.

## The short version

1. **We don't have too many params. We have no way to rank them.** The schema can say "this folder starts collapsed" and "this row only shows when…", and that's all. Nothing says "these five are the face of the tool", "this one is a detail", or "this is a view preference, not a look".
2. **Duplication causes more clutter than rarely used params do.** Almost every shell shows the same action in 2–4 places (toolbar, inspector, context bar, transport). Giving each one home on screen, plus the palette, would remove about 25 visible controls across ten shells without hiding a single param.
3. **Every mature tool solves this the same way, and none of them do it by usage.** The author decides what surfaces. Secondary controls sit one step away, next to their group. State decides what's relevant. The user can search and filter. Tools that reorder by usage, like Office 2000's adaptive menus, were withdrawn.
4. **Hiding is safe only when hidden state stays visible.** A collapsed section with a changed value inside needs a mark on its header, and a popover's trigger has to show its value. Figma reverted four UI3 nestings in 2024 after users complained, all of them on values people glance at.
5. **Our presets and the one Send to agent note already tell us what matters.** What presets vary is the surface. What no preset touches is a candidate for "more".

## Audit: what we have

### Visible at rest, 1440×900

Two counts, measured differently. *Live* counts every interactive element on screen in the running app (toolbar, layer rows, preset tiles and timeline included). *Audit* counts the controls a person reads as controls, and classifies each one.

| Shell | Live | Audit | Core / occasional / set-once / rare | Scrolls? | Worst offender |
|---|---|---|---|---|---|
| synth | 203 | 64 | 11 / 42 / 2 / 12 | both panels | 12-knob mixer whose 8 sends no sound touches |
| video | 107 | 35 (48 with a clip) | 13 / 24 / 8 / 3 | with a clip | "Add clip" in 4 places; In/Out animation below the fold |
| animate | 99 | 36 | 13 / 17 / 3 / 3 | — | A/B, Share and Send act on 7 preferences, not the animation |
| type | 89 | 32 | 7 / 11 / 4 / 3 | Kinetic, likely | Width and Slant are faked but look like real axes |
| ui-design | 76 | 27 | 2 / 10 / 11 / 4 | — | Export settings in 3 places; snap and nudge prefs open at rest |
| photo | 74 | 39 (+15 below) | 9 / 32 / 3 / 6 | ~2 screens | Every section open; Texture and Dehaze used by none of 11 looks |
| dither | 72 | 32 | 10 / 14 / 2 / 6 | just fits | 14-tile palette picker; Adjust first, though looks touch 2 of its 7 rows |
| scene | 61 | 29 | 3 / 12 / 2 / 5 | — | Colourway twice, views 3×, "Copy camera JSON" 4× |
| nodes | 53 | 25 | 2 / 6 / 5 / 3 | — | Resting inspector is all set-once prefs |
| shader | 51 | 22 | 4 / 9 / 4 / 3 | — | Speed, resolution and fps in both inspector and transport |
| motion | 47 | 35 | 9 / 10 / 5 / 1 | — | "iPhone 15" button does nothing; Replay repeats the transport |
| batch | — | 36 | 13 / 17 / 2 / 4 | — | Seed, Grain and three show/hide switches at rest; Add size twice |
| component-lab | — | 34 | 11 / 20 / 1 / 2 | — | Two preset menus, both labelled "Custom" |
| flows | — | 33 | 5 / 15 / 9 / 4 | — | 8 set-once canvas prefs at rest; Walkthrough 3× |
| journey | — | 32 | 4 / 16 / 9 / 3 | yes | Inspector is mostly view prefs plus 3 duplicates |
| generate | — | 25 | 8 / 12 / 2 / 3 | — | Opens on an empty Details card; share link can't apply |
| dropin | — | 20 | 7 / 12 / 1 / 0 | — | **The model shell**: toolbar outweighs the inspector |
| present | — | 19 | 4 / 5 / 1 / 0 | — | Best prioritised; published rows aren't marked |
| marks | — | 18 | 5 / 7 / 6 / 0 | — | Two family pickers, same icons, different meanings |

Core counts run from 2 to 13 per shell, while visible counts run from 18 to 64. Most of what we show is occasional or set-once.

### What the kit offers today

| Mechanism | State |
|---|---|
| `folder(…, { collapsed })` | Works. Only 6 of 19 shells use it. |
| `when` on rows and folders | Works, and dither's per-effect rows are the best example in the kit. Three misses: ui-design snap distance with snapping off, scene's per-light shadows with shadows off, nodes' gradient centre and angle on types they don't affect. |
| `disabled` | Works. Rarely used. |
| Changed dot on a section header, section reset | Works for schema folders. **Bug [V]:** the dot counts rows hidden by `when` (`Inspector.tsx:65`), so it can light up with nothing visible to explain it. Hand-built sections only get the dot if the shell passes `changed`. |
| Remembered open state, alt-click to solo | Works for schema folders. Hand-built sections forget their state on reload. |
| Summary-plus-popover | Exists per control (curve, colour, easing, spring), never for a group. Generate hand-builds its "30 steps · CFG 7" chip. |
| `publish: true` | The only "this matters most" flag, and it only feeds ClientView. Present is the only shell that uses it. |
| `presetKeys` | Separates look keys from the rest. Only shader and synth set it, though it's a free "collapse the rest" signal. |
| `ParamActions` | Undo, redo, A/B, presets, Send, share and theme are all on by default: 4–7 icons in every toolbar. In animate, generate and video they act on the wrong thing (prefs, a store with `url: false`, composition settings only). |
| ⌘K palette | Hand-written commands only. Params can't be searched or set from it. |
| Usage record | None, apart from `.rueca/notes`. |

### What the skill tells agents

This matters more than any one shell, because every shell an agent builds follows it.
- Nothing caps or ranks controls. `SKILL.md` calls the inspector "every control" and says to write "one line per knob".
- The only disclosure hint is the example `folder('Advanced', …, { collapsed: true })`, with no rule for when to use it.
- `visual-rules.md` treats a 20-control column as a styling problem ("with hidden thumbs it reads as data").
- "Empty selection → document / scene settings, never a blank panel" fills flows, journey, animate, nodes, ui-design, shader, scene and video with view preferences. That's the most-seen state of the inspector.
- `qa.md` has no step that counts controls at rest.

### Where it works
- **dropin and present:** few controls, the core ones first, actions on the toolbar.
- **dither's `when` rows:** the effect picker decides which sliders exist, as in ShaderGradient and Kittl.
- **Looks as a visual grid or filmstrip** (dither, photo): presets first, as in Paper Shaders and Lightroom.
- **Schema-driven shells collapse well:** shader's Render, type's Artboard, Fluid and Preview, ui-design's Export settings.
- **Dependent rows mostly hide correctly:** motion's return delay, photo's vignette midpoint and feather, scene's physical-only material rows.

### Where it doesn't
- **Hand-built panels open everything.** `Section` defaults to open, so photo, synth and ui-design are the shells that scroll.
- **Duplicates in 14 of 19 shells.**
- **The resting inspector shows set-once prefs** (snap, nudge, fps, aspect, wires, tone map) instead of the shell's core.
- **The toolbar action cluster** costs 4–7 icons everywhere and is wrong in three shells.
- **Section order fights the evidence.** In dither, Adjust (7 rows, 2 touched by looks) comes before Effect. In motion, Colour gets the same billing as Geometry, though Rafael's Send to agent note tuned exactly the five Geometry params and never Colour.
- **Fake or dead controls:** motion's "iPhone 15" button has no handler [V, `motion/index.tsx:77`], and type's Width and Slant are faked. Scene's Glow does almost nothing, because no default material emits light.

## Research: what others do

### Four layers, everywhere

Every mature tool stacks the same four layers. What changes is how far each one is taken.

1. **The author promotes a few controls to the surface.** Houdini promotes parameters out of a digital asset, After Effects has Essential Properties, Ableton has 8–16 macros, Cavalry has Control Centre (with a blue dot back in the full editor), Unicorn Studio has variables, and Rive has View Models. Hardware forces the number: the OP-1 gives each engine 4 parameters; Elektron, Push, Bitwig and NI's NKS have 8 per page; Resolve's Micro panel has 12.
2. **The author marks the rest as secondary, next to its group.** Unreal's ▼ Advanced at the bottom of each category, Unity URP's per-component "Show additional properties", Blender sub-panels closed by default, VS Code's `tags: ['advanced']`, Office's dialog launcher in the corner of each ribbon group. Every source warns against a generic "Advanced" folder far from the group.
3. **State decides what's relevant.** Unreal's `EditCondition`, Houdini's Hide When, Storybook `if`, Leva `render(get)`, Excalidraw keeping all its "show this row?" rules in one file. Optional features start as an empty header with "+" (Figma, Kittl, Spline, Unicorn) or with a checkbox in the header (Blender).
4. **The user overrides the view.** Search (VS Code, Leva, Unreal), show-only-modified (After Effects `UU`, Unreal, Houdini, VS Code `@modified`), favourites and pins.

None of the 60-odd tools surveyed decides placement by usage at runtime. Usage data shows up only in the authoring (Office ribbon telemetry, VS Code's 13 "Commonly used" settings) or in user pins.

### The evidence on adaptive layouts

- **Fixed beats adaptive.** Office 2000's personalised menus were off by default from 2007; people found them random and scanned menus twice. In Findlater & McGrenere (CHI 2004) a fixed split menu was significantly faster than an adaptive one, and 55% of users preferred a menu they arranged themselves [V].
- **Copying helps; moving doesn't.** In Gajos et al. (AVI 2006), adaptation helped only when it *copied* items into a separate stable strip and left the originals in place. Moving items in place didn't help [V].
- **Progressive disclosure has two conditions** (Nielsen, 2006). Split the features correctly, and make the way to the second level obvious. More than two levels "typically have low usability" [V].
- **Hidden things get used less.** In NN/g's hidden-navigation study, use on desktop was 27% hidden vs 48–50% visible, and tasks took at least 39% longer [V]. Findlater & McGrenere (2007) show the trade: a lean surface makes features easier to find but lowers awareness that they exist [V].
- **Usage is long and flat past the top ten.** Word 2003's top 5 commands were about 32% of use, but everyone uses a different 20% of the rest [V]. So keep the tail findable (section, "more", palette) and don't delete it.

### Lessons from the redesigns

**Figma UI3 (2024).** Four nestings were reverted after users complained [V]:
- blend mode behind an icon you could only read by tooltip;
- clip content as a two-option dropdown (a checkbox again);
- constraints behind a tiny button (inline and expanded again);
- floating panels (docked again).

The common thread: **don't nest values people glance at, two-option choices, or colour.**

**tldraw** shows the active hidden value on its overflow trigger (PR #7885). **Webflow** dots collapsed sections that hold set styles. **Penpot** auto-opens a hidden section when a value inside gets set [V].

### Mechanisms, and when each fits

| Mechanism | Examples | Fits | Cost |
|---|---|---|---|
| **Presets first, highlighted when matched** | Paper Shaders, Lightroom, ShaderGradient | Every shell | None. It's also the best map of what matters. |
| **Mode picker swaps the slider set** | dither, ShaderGradient, Kittl, Krea | Params whose meaning depends on an enum | Some people miss the other modes' controls exist. |
| **"N more" row at the end of a section** | Unreal Advanced, Lightroom, VS Code advanced | The tail of a group: same topic, lower priority | One click. Hidden values must stay marked. |
| **Collapsed section, dot when changed** | Blender, Webflow, our folders | A whole topic that's occasional | Low findability for what's inside |
| **Header toggle; section opens when on** | Blender, Unreal inline toggle, Figma "+" | Optional features: vignette, grain, shadow, delay | Little. Turning on also reveals its params. |
| **Summary chip → popover** | Midjourney settings, our curve row, generate chip | Compound values, and a group read as one line | The trigger must render the value, never an icon alone. |
| **Display options / settings popover** | Linear (⇧V), Zed, Notion | View prefs: grid, snap, minimap, fps, units | They're out of sight, which is fine for view prefs. |
| **Contextual (selection-driven)** | tldraw, Excalidraw, Photoshop Properties | Shells with objects | The empty state must still be useful. |
| **Master control that drives its parts** | Apple Photos Light → Exposure…, Ableton macros, Comeau's "Oomph" | Correlated low-level params | Needs a clear model of offsets. |
| **Second page on the same key** | Elektron (press again for page 2), Push banks | Set-and-forget params of a group | Hard to discover without a hint. |
| **Overflow "…"** | VS Code `navigation` vs overflow, Raycast ⌘K | Secondary *actions* | Low information scent. Never for key actions. |
| **Palette / search** | VS Code, Leva filter, Unicorn's search-only Fog | The long tail, and retired controls | Invisible, so it's never the only home for something important. |
| **Randomise with locks** | Haikei, Coolors, Dither Boy, Hydra's one-value nudge | Generative shells | Needs sensible bounds. |

### What Mobbin added

About 75 real product screens, grouped by mechanism, are in [`22-control-priority/ia-mobbin.md`](22-control-priority/ia-mobbin.md), with Mobbin links. The screenshots stay local, as third-party screenshots did in note 21. What they add:
- **An unused group costs one line.** Figma, Rive, Jitter, Synthesia and Spline show an unused effect as a header with "+" or a switch. Its fields appear only when it's on.
- **The trigger summarises what it hides.** Pinterest prints "Push on, in-app on" under a collapsed row, and Shopify shows "17/20". Arcade puts a dot on a collapsed row, and Azar rings each tool icon with its amount. Recraft draws a palette as a colour strip.
- **Only changed values draw ink.** Visual Electric fills a slider track only once it leaves zero, and Webflow turns set labels orange. Krea and Gamma show Reset only on a changed value. This matches the ink rules in note 21.
- **Presets visibly set the controls.** Squarespace's shadow panel leads with Soft, Strong and •••. Picking Higgsfield's B&W Film preset switches on four nested effects you can see.
- **Rare options sit in a small popover on their own row.** MagicPath hides only Decoration and Case behind its Typography icon, and Figma does the same for stroke options.
- **A user-set visibility rule per item.** Linear's "Always show / Show when badged / Don't show" is "show when changed" as a user setting.
- **The closest precedent** is Squarespace's generative-background panel. It floats over the canvas with one group open and the rest collapsed, plus a "Shuffle settings" button.

## Proposal

The work falls into three parts. The kit changes are small and schema-level, so every shell, and every shell an agent builds later, gets them for free.

### A · The rule: five homes for a control

Each control gets exactly one home on screen, plus the palette.

| Home | What goes there | Mechanism |
|---|---|---|
| **Surface** | What the presets vary, and what's tuned every session. Aim for 8–12 inspector rows, and the resting inspector must fit a 13-inch laptop without scrolling. | Open sections, core rows first |
| **More** | The tail of a group: same topic, rarely touched | `more: true` → an "N more" row at the end of its section |
| **Off until wanted** | Optional features | Header toggle; the section shows its params only when on |
| **Settings** | View and document prefs: grid, snap, nudge, fps, units, export scale | A toolbar Display popover |
| **Palette** | Everything, by name; retired controls | ⌘K, generated from the schema |

The author places each control. Usage data produces suggestions, never runtime moves. Nothing goes more than two levels deep (section → popover). Never nest values people glance at, two-option choices or colour.

To score a control, use E = 2F + I + K:
- **F, frequency (0–3):** how often it's touched.
- **I, impact on the picture (0–2).**
- **K, kept non-default (0–2):** how often a non-default value is kept. Use I until there's data.

8–10 is surface, 5–7 an open section, 3–4 "more" or a collapsed section, 1–2 a popover, 0 palette-only or removed. Overrides beat the score: export, share and reset keep a fixed place; dependants live under their parent; compound values always get a summary plus popover.

### B · Kit changes

In order of value for effort:

1. **`more: true` on a param.** The Inspector puts the param under a quiet "3 more" row at the end of its folder. A changed param stays visible above the row. If a preset, undo or share link sets a hidden value, the row opens. This is the biggest gap in the kit.
2. **Fix the changed dot.** Leave rows hidden by `when` out of the count (`Inspector.tsx:65`), and default hand-built `Section`s to remembering their state.
3. **`folder(…, { toggle: 'vignette' })`.** The boolean renders in the section header. While it's off, the section stays closed and its params hide. This covers photo's effects, synth's delay and reverb, and scene's shadows.
4. **`folder(…, { place: 'settings' })` and `<SettingsMenu>`.** View-pref folders move out of the inspector into one toolbar popover, like Linear's Display options. Then the "empty selection" rule shows document *content*, not prefs.
5. **A leaner `ParamActions`.** Undo, redo and presets stay visible. A/B, Share, Send and Theme go into a "…" menu. Share and A/B don't render when the store has no look values to share.
6. **`paramCommands(params)`.** Every param becomes findable and settable from ⌘K (`contrast 0.2`, `effect halftone`, `reset gamma`). This makes "palette only" a real home, and closes Candil gap 6.
7. **Folder as popover.** `folder(…, { display: 'popover', summary: (v) => '30 steps · CFG 7' })` turns a group into one summary row. Generate gets it for free.
8. **Dev-only usage counter.** `params.usage()` counts commits per key in localStorage, and a QA report lists params that no preset, note or session has ever changed. This turns the next audit from inference into data.

Later, if the above lands well:
- a pinned strip that *copies* a row to the top, never moves it (the Gajos result);
- a "show changed" filter, which doubles as the Send to agent diff;
- macro controls that drive several params;
- press-again-for-page-2 on a section header.

### C · Skill and shell changes

**Skill** (`SKILL.md`, `references/layouts.md`, `visual-rules.md`, `qa.md`; route through copy-editing before it lands):
- Teach the five homes and the rest budget.
- Rank surface rows by what presets vary.
- Ban duplicates across toolbar and inspector.
- Reword "empty selection" to mean document content.
- Add a QA step that lists every control visible at rest and marks the ones presets touch.

**Shells.** This is the cheap, high-yield pass, done once the kit pieces exist:
- **Remove duplicates:**
  - scene: colourway, views, grid, copy camera
  - ui-design: export settings, zoom, align
  - video: add clip, aspect, snap
  - shader: speed, resolution, fps
  - photo: auto, clipping
  - flows: Walkthrough
  - motion: Replay
- **Reorder:**
  - dither: Effect → Palette → Adjust, with the palette library as a popover off the Colours row
  - motion: Geometry and Timing open; Colour collapsed
  - photo: Basic open, the rest collapsed, and Texture and Dehaze in "more"
  - synth: Oscillator, Envelope and Filter open; mixer sends, Effects and Drums nested
- **Move prefs to Settings:** nodes, ui-design, shader, scene, video, flows, journey.
- **Add `when` where a row has no effect:** ui-design snap distance, scene per-light shadows, nodes gradient centre and angle.
- **Remove or hide:**
  - motion: the dead "iPhone 15" button
  - type: faked Width and Slant
  - scene: Glow
  - nodes: Lacunarity and Blur quality
  - dither: "Copy ASCII" outside the ASCII effect
- **Fix:** generate's share link (`url: false`), and video's A/B, which only covers composition settings.

Note 21's phase 2 (moving hand-built panels onto `PanelHeader`, `Section` and `Row`) should come first or alongside, so those panels inherit all of this.

## What we're not doing

- **Reordering or hiding controls by usage at runtime.** The evidence is consistent that it fails.
- **A generic "Advanced" folder.** Secondary controls stay next to their group.
- **Nesting values people glance at, two-option choices or colour.** Figma reverted all of these.
- **Greying out irrelevant rows by default.** Hide them with `when`. Grey out only when the dependency isn't obvious and seeing it teaches something.
- **Deleting the long tail.** It moves to "more" or the palette. A control goes only when it's fake, dead or has no visible effect.

## Open questions for Rafael

1. **Budget.** Aim for 8–12 rows at rest, with "fits a 13-inch laptop without scrolling" as the hard rule? The hardware references argue for 8.
2. **Where view prefs go.** A toolbar Display popover (Linear), or a collapsed "Document" section at the bottom of the inspector (Spline)?
3. **Order of work.** Kit first (B1–B6), then the skill, then the shell pass? Or start with the shell duplicates, which need no kit change?

## Sources

The full reports, with every claim marked and linked, are in [`22-control-priority/`](22-control-priority/):
- `audit-kit-and-shells-a.md`, `audit-shells-b.md`
- `ia-canvas-tools.md`, `ia-motion-3d-engines.md`, `ia-audio-photo-video.md`, `ia-tuning-devtools.md`, `ia-web-creative-tools.md`
- `ia-theory.md`, `ia-mobbin.md` (the Trove pass stays local: it quotes a private library)

Verified in this session: the live counts (11 shells, 1440×900, default density), the changed-dot bug, the dead "iPhone 15" button and generate's `url: false`. Other per-shell claims come from the audits, and the report marks which ones rest on judgement.

## Status

**Kit, skill and the schema half of the shell pass: merged (#8, 2026-10-15). The `index.tsx` half: built 2026-10-15, below.** Rafael chose: kit first, then the skill, then the shell pass.

- **Kit:**
  - `more: true` and `MoreRow` ("3 more" / "Fewer", remembered per section). A changed `more` param stays in view.
  - The changed-dot fix: rows hidden by `when` or by an off toggle no longer light the header.
  - `folder(…, { toggle })` renders as a header switch (`Section enabled / onEnabledChange`).
  - `folder(…, { place: 'settings' })` with `<SettingsMenu>` (dot on the button when a setting is changed).
  - A leaner `ParamActions`: undo, redo, presets and Send to agent at rest; A/B only while an A is stored; compare, theme and share in "…"; `inline` keeps the old row.
  - `params.linkable`, so "Copy link" disappears on `url: false` stores.
  - The logic is the pure `layoutFolder()`, with 10 tests in `tests/layout.test.ts`.
- **Docs and skill:** `KIT.md` and `kit-api.md`. `SKILL.md` step 3 ranks the schema. `layouts.md` § What shows at rest. `visual-rules.md` adds one home per control and empty selection = document content. `qa.md` §7 counts what's at rest.
- **Shell pass, schema level:**
  - dither: the Adjust tail and Serpentine go under "more"
  - type: Fluid's header switch; Width and Slant under "more"
  - scene: Viewport moves to `SettingsMenu`; shadow rows hide while shadows are off; Glow under "more"
  - motion: Colour collapsed
  - nodes: gradient centre hidden on linear; Lacunarity and Blur quality under "more"
  - ui-design: snap distance hidden with object snapping off
  - batch: Grain under "more"; Seed under "more" and only with seals on

- **Shell pass, `index.tsx` and panels** (after density phase 2, #7):
  - Duplicates, down to one home on screen plus ⌘K:
    - scene: colourway lives in the toolbar only. Views live in the viewport's camera menu and the Views tab, so the camera inspector's list is gone. "Copy camera JSON" stays in Export and ⌘K. Grid sits in the dock, with its pref in Settings.
    - ui-design: zoom lives in the canvas pill (the panel-header zoom menu is gone). Align lives in the Design panel's Position row; the context bar keeps only distribute. Export settings: the page panel's presets at rest, the Design panel's Export section with a selection, and the full set in Settings.
    - video: clips are added from the library. The inspector's "Add clip" section is gone, and the transport's "+" became a Tracks menu. Aspect lives in the toolbar only (its own folder, left out of Settings). Snap lives in the transport.
    - shader: speed, resolution and fps live in the transport only (their folders are kept out of the inspector and Settings).
    - photo: Auto lives in the Basic header, and clipping in the histogram corners. Both are gone from the toolbar.
    - flows: Walkthrough lives in the toolbar; the Overview keeps the step count.
    - motion: Replay lives in the transport and ⌘K.
  - Settings menus (`place: 'settings'` plus `<SettingsMenu>` in the toolbar): nodes (preview, graph, export), ui-design (snapping, nudge, view, export defaults), shader (aspect, loop length), video (composition, view), flows (canvas, connections, auto layout, walkthrough), journey (view, emotion curve; lanes keep their toolbar menu). The empty-selection inspector now shows document content only.
  - Hand-built panels:
    - photo: Basic and the filmstrip open; Tone curve, Colour mixer, Effects and Crop collapsed. Texture and Dehaze sit under "2 more" (a changed one stays in view). Vignette, Grain and Sharpening merged into one Effects section.
    - synth: Oscillator, Envelope and Filter open; Effects and Drums collapsed. The mixer shows the four levels plus master, with the 8 sends under "8 more" (shown while any send is changed). Scope and spectrum shrink from 84 to 48 px.
    - ui-design DesignPanel: Effects and Export start collapsed and remember what you open. Effects shows the changed dot when the selection carries effects, and adding one opens the section.
  - dither: Effect → Palette → Adjust. "Copy ASCII" (dock and Export menu) shows only for the ASCII effect.
  - Fixes: motion's dead "iPhone 15" button is gone. generate hides Share. video has `compare={false}`. animate passes `doc` (Send to agent captures the document) and turns off compare and share, which acted on view prefs.

**`qa.md` §7 re-run (2026-10-15, 1440×900, default density, dark, fresh storage, nothing selected beyond each shell's default).** *Before* is main at `4a3fde1` (density phase 2 and the kit already in), and *after* is this pass. Both count every interactive element in view, by the same method as *Live* above.

| Shell | Before | After | Inspector scrolls at rest? | Note |
|---|---|---|---|---|
| synth | 180 | 161 | no | sends nested, Effects and Drums collapsed |
| video | 92 | 93 | yes, +135 px | opens with a clip selected, so the clip inspector shows; the removed duplicates appear with nothing selected. +1 is the Settings button |
| animate | 87 | 87 | no | compare and share moved out of the "…" menu, not off the surface |
| ui-design | 79 | 69 | no | |
| photo | 69 | 64 | no (was ~2 screens) | *before* counted only what fit; the panel now fits whole |
| journey | 64 | 43 | no | |
| flows | 63 | 48 | no | |
| dither | 62 | 61 | no | reorder only; ASCII button hidden |
| scene | 53 | 47 | no | |
| nodes | 51 | 36 | no | |
| shader | 45 | 39 | no | |
| motion | 41 | 39 | no | |
| generate | 41 | 41 | no | Share sat in the "…" menu |
| **13 shells** | **927** | **828** | | **−99 (−11%)** |

Checked in both themes in the browser. tsc and the 118 tests pass (after merging #10).

**Still open:**
- video's clip inspector scrolls by 135 px with the default clip selected; outside this pass.
- dither's palette library as a popover off the Colours row (Proposal §C, Reorder) was not part of this brief.
- **Not started:** `paramCommands` (⌘K), folder-as-popover, and the dev usage counter (B6–B8).
