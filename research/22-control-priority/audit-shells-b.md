# Control audit, shells B: motion, nodes, photo, present, scene, shader, synth, type, ui-design, video

Read-only audit, 2026-10-15. Sources: each shell's source (`src/shells/<name>/`), the 1440×900 QA shots in `research/qa-shots/<shell>-dark.png` (dated Oct 15 17:59, the newest; `public/thumbs/grid` is older except motion), `.rueca/notes/2026-10-15T21-54-05-84f4.json`, `git log` per shell, and `research/21-chrome-density.md`, `18-candil-feedback.md`, `08-qa-round.md`.

## How the inspector works (what matters for this audit)

- A schema is `folder(label, params, { collapsed? , when? })`. `<Inspector>` renders one collapsible `Section` per folder, schema order. Open/closed state is remembered per user in localStorage, so `collapsed: true` only decides the first visit.
- A row hides when its param's `when(values)` is false (true dependent hiding), or greys out when `disabled(values)` is true. Rows with `type: 'data'` never render. `p.monitor` rows are read-only readouts.
- `published` mode renders only `publish: true` params (the client view).
- Hand-built panels (photo, synth, ui-design, video clips, scene transforms, shader layer header) use `Section`/`Row`/`ParamSlider` directly. `Section` defaults to open, so hand-built panels open every section unless they say otherwise. `ParamSlider` does respect `when`.
- Presets: `createParams({ presets, presetKeys })`. Which keys presets vary is a good proxy for what matters.

## Counting rules

- One widget = one control: a slider row, a toggle, a segmented control, a menu trigger, an icon button, a list/tree/grid/filmstrip (counted once, however many items).
- "Visible at rest" = what the QA shot shows at 1440×900, nothing selected unless the QA shot selects something (video). It includes the shared kit toolbar cluster (`ParamActions`: undo, redo, A/B, presets, send to agent, share, theme; the other agent audits these) and the stage zoom pill (−, %, +).
- Core / occasional / set-once / rare counts cover the shell's own controls (inspector, shell toolbar items, panels, transports), including ones hidden in collapsed sections or below the fold. They exclude the kit `ParamActions` cluster and the zoom pill.
- Evidence tags: **[notes]** = `.rueca/notes`, **[preset]** = values the built-in presets vary, **[git]** = commit history, **[shot]** = seen in the QA screenshot, **[heuristic]** = my judgement.

## Summary

| Shell | Visible at rest | Core | Occ. | Set-once | Rare | Inspector scrolls? | Worst offender |
|---|---|---|---|---|---|---|---|
| motion | 35 | 9 | 10 | 5 | 1 | No at default density (it did at "comfortable", per 21-chrome-density) | A dead "iPhone 15" toolbar button (no `onClick`) and a Replay button that duplicates the transport |
| nodes | 25 | 2 | 6 | 5 | 3 | No | The resting inspector is all set-once preferences (Draft cook, Wires, Minimap, PNG size); PNG size is also in the Export menu |
| photo | 39 (+15 below the fold) | 9 | 32 | 3 | 6 | **Yes**, about two screens: all seven hand-built sections open by default | Basic shows 13 sliders at once, two of them barely used (Texture 0/11 presets, Dehaze 1/11), then curve, mixer, vignette, grain and sharpening all open below |
| present | 19 | 4 | 5 | 1 | 0 | No | A permanent "publish: true" explainer box. The 5 published rows aren't marked in the list |
| scene | 29 | 3 | 12 | 2 | 5 | No (at rest) | Duplicates: colourway ×2, grid/turntable ×2, projection ×2, camera views ×3, "Copy camera JSON" ×4. A Presets menu competes with colourways |
| shader | 22 | 4 | 9 | 4 | 3 | No | Speed, drawing resolution and the fps monitor appear in both the Document inspector and the transport |
| synth | 64 | 11 | 42 | 2 | 12 | **Yes**, both side panels | The left panel is a 12-knob mixer (8 of them per-track sends) under a display-only scope/spectrum. Drums and reverb fall below the fold on the right |
| type | 32 (specimen) | 7 | 11 | 4 | 3 | No in Specimen. Kinetic likely scrolls (estimate, not shot) | Simulated Width and Slant axes shown as if they were real. In Scale mode the Code section duplicates the Export menu |
| ui-design | 27 | 2 | 10 | 11 | 4 | No at rest. Likely with a frame or text selected (not shot) | Export settings live in 3 places. Snapping and Nudge preferences sit open at rest |
| video | 35 (no selection) / 48 (clip selected, as shot) | 13 | 24 | 8 | 3 | **Yes** with a clip selected. The Library panel scrolls too | "Add clip" in 4 places; Aspect and Snap shown twice. Set-once composition settings take the resting inspector |

Totals across the 10 shells: about 60 core, 161 occasional, 45 set-once and 40 rare/debug shell controls. Roughly one in five shell controls is set-once and one in six is rare or a duplicate.

## Patterns across these shells

1. **Duplication is the biggest source of clutter, more than rarely-used params.** Almost every shell shows the same action in 2–4 places: toolbar, inspector, context bar or transport, and the ⌘K palette.
   - scene: colourway, grid, turntable, projection, views, copy camera
   - ui-design: export settings, save/reset, align, zoom, copy CSS
   - video: add clip, aspect, snap
   - shader: speed, resolution, fps, copy code
   - photo: auto tone, clipping, .cube export, crop
   - nodes: PNG size, preview target

   Rule of thumb: one home on screen, plus the palette.
2. **"Nothing selected" shows document preferences** in nodes, ui-design, shader, scene and video. This follows Spline. The trouble is that what fills the resting state is set-once (snapping, nudge, wires, draft cook, fps, aspect, loop length, tone map). The resting inspector is the most-seen panel, so it should hold the shell's core controls (shader: the top layer; scene: colourway plus exposure; video: the selected or first clip). Preferences can go behind a "Document settings" disclosure.
3. **Hand-built panels open every section.** `Section` defaults to `defaultOpen = true`. photo, synth and ui-design's DesignPanel have no `collapsed` equivalent in use, so they are the ones that scroll. Schema-driven shells use `{ collapsed: true }` well: shader's Render, type's Artboard/Fluid/Preview, ui-design's Export settings/View.
4. **Dependent hiding is mostly right.** Most dependent rows use `when`: motion's return delay, present's speed, photo's vignette midpoint/feather, grain size and sharpen radius, type's optical size, seed and hold, scene's softness, spin and physical-only material rows, shader's ink and angle. The misses:
   - ui-design: Snap distance shows with object snapping off.
   - scene: each light's "Cast shadow" and the shadow catcher's opacity show with global Shadows off.
   - nodes: Gradient "Center" shows for linear, where it does nothing, and the gradient angle shows for radial/diamond, where it does nothing.
5. **Presets are an underused ranking signal.**
   - Motion's Send-to-agent record [notes] tuned exactly the five Geometry params: rings, centre void, gap, stroke weight, dash. Presets tune timing (stagger, duration, ease) [preset]. Colour was never touched.
   - Photo's 11 looks never touch Texture, Vignette midpoint/feather or Sharpen radius.
   - Synth's 5 sounds never touch Octave, the drums, the effects or the mixer.
   - These are good candidates for "at rest" vs "nested".
6. **The kit's ParamActions cluster costs 6–7 icons in every shell that uses it** (motion, present, scene, shader, synth, type, video). The other agent owns it, but two shell-level notes:
   - video's A/B compares only the composition params (aspect, fps, duration, matte, view flags), never the clips, so it's near-useless there.
   - scene's Presets menu competes with its colourways.

---

## motion (`src/shells/motion/`)

At 1440×900 the inspector fits at the default density [shot]. It scrolled 35px at the old "comfortable" density (21-chrome-density).

| Control | Type | Where | At rest | Class | Evidence / note |
|---|---|---|---|---|---|
| iPhone 15 | ghost Button | toolbar centre | visible | **RARE/dead** | No `onClick`; looks like a device picker but does nothing |
| Replay | icon button (R) | toolbar centre | visible | OCCASIONAL, duplicate | Same as transport Go-to-start + Play, and R |
| Undo, redo, A/B, Presets ("Custom"), Send to agent, Share, Theme | kit ParamActions | toolbar end | visible | (kit) | Send to agent is used: c97615b "via Send to agent" [git] |
| Export | primary menu | toolbar end | visible | OCCASIONAL | Share items repeated inside the menu (also in the Share icon) |
| Rings | slider | Inspector › Geometry | visible | CORE | [notes] tuned 12→22; [preset] Calm, Dense |
| Centre void | slider | Geometry | visible | CORE | [notes] 78→140 |
| Gap | slider | Geometry | visible | CORE | [notes]; [preset] Dense |
| Stroke weight | slider | Geometry | visible | CORE | [notes]; [preset] Punchy, Dense |
| Dash | select | Geometry | visible | CORE | [notes] solid→dotted |
| Duration | slider | Timing | visible | CORE | [preset] Calm, Punchy |
| Stagger | slider | Timing | visible | CORE | [preset] all three; hint calls it "what makes the sweep travel" |
| Ease | curve (popover) | Timing | visible | CORE | [preset] Punchy |
| Return sweep | switch | Timing | visible | OCCASIONAL | |
| Return delay | slider | Timing | visible (hides when Return sweep is off) | OCCASIONAL | correct `when` |
| Background | colour | Colour | visible | SET-ONCE | Folder explicitly `{ collapsed: false }` |
| Ring | colour | Colour | visible | OCCASIONAL | |
| Highlight | colour | Colour | visible | OCCASIONAL | |
| Headline | text | Colour | visible | SET-ONCE | Content, not colour; misfiled in the Colour folder |
| Start, Prev frame, Play, Next frame | icon buttons | timeline transport | visible | Play CORE, rest OCC. | |
| Time readout (s/frames/timecode) | click-to-cycle | transport | visible | SET-ONCE | |
| Loop mode, Speed, Collapse | icon / menu | transport | visible | Speed OCC., others SET-ONCE | |
| 9 lanes (sweep, ring 1/5/9/13/17/21, return, cues) | read-only bars | timeline | visible | (display) | About 240px of read-only lanes for a 4.6s loop |
| Zoom pill | − % + | stage | visible | (kit) | |
| Download values, Reset all values, Preset: … | commands | palette only | — | RARE | Download values duplicates Share › Download all values |

**Working:** the schema is small and well ordered. Geometry, the folder Rafael actually tuned, comes first. Timing's dependent row hides properly, and the inspector fits.

**Not working:**
- The dead device button.
- Replay duplicates the transport.
- Headline sits in Colour.
- The timeline is the biggest chrome block (44% coverage at comfortable density, per 21-chrome-density): 8 transport controls plus 9 lanes nobody edits.
- Colour gets equal billing with Geometry even though nothing shows it being tuned.

**Suggest:**
- *Keep top-level:* Geometry (5) and Timing (duration, stagger, ease, return sweep).
- *Collapse:* Colour by default, renamed "Colour & copy" (or move Headline to its own "Copy" folder).
- *Remove:* the "iPhone 15" button. If a device picker is wanted, make it a real select.
- *Remove or palette-only:* Replay (R stays).
- *Timeline:* collapsed to the transport row by default, or cut the lanes to Sweep, Return and Cues (the per-ring lanes add little).
- *Palette-only:* time-unit cycling and loop mode.

## nodes (`src/shells/nodes/`)

The inspector doesn't scroll at rest [shot]. When a node is selected it shows that node's schema (Noise: 10 params in 2 open folders).

| Control | Type | Where | At rest | Class | Note |
|---|---|---|---|---|---|
| View (graph / split / preview) | segmented, icons | toolbar | visible | OCCASIONAL | 1/2/3 keys too |
| Add node | icon (Tab) | toolbar | visible | CORE | Library click and Tab also add |
| Frame all | icon (F) | toolbar | visible | OCCASIONAL | |
| Undo, Redo, Theme | kit | toolbar | visible | (kit) | |
| Export | menu | toolbar | visible | OCCASIONAL | Contains a "PNG size" submenu, duplicating Inspector › Export › PNG size |
| Library / Samples | tabs | left | visible | OCCASIONAL | |
| Filter nodes | search | left | visible | OCCASIONAL | |
| Node list (12) | list | left | visible | CORE | |
| Output / Selection | segmented | preview HUD | visible | OCCASIONAL | Duplicated by P and the node "More" menu |
| Zoom pills ×2 | − % + | graph and preview | visible | (kit) | |
| Resolution | segmented | Inspector › Preview | visible | SET-ONCE | |
| Backdrop | segmented | Preview | visible | SET-ONCE | |
| Draft cook | switch | Preview | visible | RARE (perf/dev) | |
| Node previews | switch | Graph | visible | SET-ONCE | Also in palette |
| Wires | select | Graph | visible | RARE | Purely cosmetic |
| Snap to grid | switch | Graph | visible | SET-ONCE | |
| Minimap | switch | Graph | visible | RARE | Default off; M key and palette |
| PNG size | segmented | Export | visible | SET-ONCE, duplicate | Also an Export submenu |
| *Selected node:* rename, bypass, More | header | inspector | on select | OCC. | |
| Inputs (one select per port) | selects | Inputs section | on select | OCCASIONAL | |
| Noise › Type, Scale, Seed | | node schema | on select | CORE | |
| Noise › Octaves, Roughness, Warp, Contrast, Offset, Invert | | node schema | on select | OCCASIONAL | |
| Noise › Lacunarity | slider | node schema | on select | **RARE** | Samples set it to 2, 2.05 and 2.1 only: near-zero spread |
| Blur › Quality | slider 1–4 | node schema | on select | **RARE** | Every sample uses 3 |
| Gradient › Center (linear) / angle (radial, diamond) | | node schema | on select | RARE | Shown where it has no effect; needs `when` |

**Working:**
- Node schemas use `when` well: shape points, inner radius, corner radius and stroke; output background.
- The library-to-graph-to-preview flow is clear.

**Not working:**
- At rest, the right panel shows eight set-once preferences, three of them rare (Draft cook, Wires, Minimap).
- PNG size has two homes.

**Suggest:**
- With nothing selected, show a short document card: node, wire and cook stats, and Preview resolution and Backdrop.
- Put the Graph folder (previews, wires, snap, minimap) and Draft cook in a collapsed "Graph settings" folder.
- Keep PNG size only in the Export submenu.
- Per node: give Noise an "Advanced" folder, collapsed, with Lacunarity, Octaves and Offset, and hide Blur › Quality there too.
- Add `when` for Gradient Center and angle.

## photo (`src/shells/photo/`)

The right panel scrolls about two screens [shot]: the Tone curve is cut at y≈760, and the colour mixer, vignette, grain, sharpening and crop sections all sit below it. Every hand-built `Section` opens by default.

| Control | Type | Where | At rest | Class | Note |
|---|---|---|---|---|---|
| Crop & straighten | icon (C) | toolbar | visible | OCCASIONAL | Also "Edit crop" in the Crop section and the palette |
| Before/after split | icon (Y) | toolbar | visible | OCCASIONAL | |
| Hold for original | icon (\\) | toolbar | visible | CORE | |
| Clipping warnings | icon (J) | toolbar | visible | OCCASIONAL, duplicate | The two histogram triangles toggle the same thing |
| Auto tone | icon (⇧A) | toolbar | visible | OCCASIONAL, duplicate | Also the "Auto" button in the Basic header |
| Undo, Redo, Share (with .cube), Theme | kit | toolbar | visible | (kit) | .cube also in Export popover and palette |
| Export | popover: format, quality, long edge, name, LUT size | toolbar | popover | OCCASIONAL | Good use of a popover |
| Navigator thumbnail + Fit/50/100/200 | segmented | left › Navigator | visible | OCCASIONAL | |
| History list | list | left › History | visible | OCCASIONAL | |
| Image drop, Open…, Sample | drop + buttons | left › Photo | visible | SET-ONCE / Sample RARE | Plus a permanent help paragraph |
| Histogram clip triangles (2) | toggles | right header | visible | OCCASIONAL | |
| Temp | gradient slider | Basic | visible | CORE | [preset] 4/11 |
| Tint | | Basic | visible | OCCASIONAL | 3/11 |
| Exposure | | Basic | visible | CORE | |
| Contrast | | Basic | visible | CORE | 9/11 |
| Highlights, Shadows | | Basic | visible | CORE | 5/11 each |
| Whites, Blacks | | Basic | visible | OCCASIONAL | 2 and 4 of 11 |
| Texture | slider (grey track) | Basic › Presence | visible | **RARE** | 0/11 presets |
| Clarity | | Presence | visible | OCCASIONAL | 5/11 |
| Dehaze | | Presence | visible | **RARE** | 1/11 |
| Vibrance, Saturation | | Presence | visible | CORE | 4 and 6 of 11 |
| Curve channel + curve + 3 contrast presets | segmented, curve, chips | Tone curve | partly | OCCASIONAL | |
| Mixer mode + 8 bands | segmented + 8 sliders | Colour mixer | below the fold | OCCASIONAL | 6/11 presets use some band |
| Vignette amount | | Vignette | below | OCCASIONAL | 5/11 |
| Vignette midpoint, feather | | Vignette | hidden at 0 | RARE | 0/11; `when` correct |
| Grain amount, size | | Grain | below | OCCASIONAL | |
| Sharpen amount | | Sharpening | below | SET-ONCE | default 25; 1/11 |
| Sharpen radius | | Sharpening | below | RARE | 0/11 |
| Crop summary + Edit crop | readouts + button | Crop & straighten | below | OCCASIONAL, duplicate | |
| Filmstrip (11 looks) + Save look | filmstrip | bottom | visible | CORE / OCC. | |

**Working:**
- The Lightroom order (Basic, Tone curve, Colour mixer, Effects, Detail) is familiar, and Basic is the right first section.
- Export is a popover, not a panel.
- Looks get a filmstrip.
- Dependent rows hide properly.

**Not working:**
- Every section is open, so the panel is a long scroll.
- Presence shows Texture and Dehaze at full weight though presets never use them.
- Auto tone and clipping each appear twice in the chrome.
- The left Photo section (drop zone, Open, Sample, help text) is set-once but stays at rest.

**Suggest:**
- *Open by default:* Basic and the filmstrip.
- *Collapsed by default:* Tone curve, Colour mixer, Vignette, Grain and Sharpening, using `Section defaultOpen={false}` with the existing `persistKey`, so users who open them keep them open.
- *Basic › Presence:* Texture and Dehaze go behind a "More" disclosure. Clarity, Vibrance and Saturation stay.
- *Merge:* Vignette, Grain and Sharpening into one "Effects" section with three amount sliders. Their sub-params already hide at 0.
- *Remove one copy each:* the toolbar Clipping button (keep the histogram triangles plus J) and the Basic header Auto (keep the toolbar plus ⇧A), or the reverse.
- *Left panel:* collapse Photo to a one-line file row with an "Open…" menu (Sample inside it).

## present (`src/shells/present/`)

The inspector doesn't scroll [shot].

| Control | Type | Where | At rest | Class | Note |
|---|---|---|---|---|---|
| Undo, Redo, A/B, Send, Share, Theme | kit (no presets) | toolbar | visible | (kit) | |
| Client view | primary button | toolbar | visible | CORE | The shell's reason to exist |
| Palette | select | Pattern | visible | CORE | `publish` |
| Tile size | slider | Pattern | visible | CORE | `publish` |
| Arrangement | seed + dice | Pattern | visible | CORE | `publish` |
| Threads, Band width, Dyed bands | sliders | Pattern | visible | OCCASIONAL | designer-only |
| Animate | switch | Motion | visible | OCCASIONAL | `publish` |
| Speed | slider | Motion | visible (hides when Animate is off) | OCCASIONAL | |
| Frame | segmented | Output | visible | SET-ONCE | `publish` |
| "publish: true" explainer | static box | inspector | visible | (static) | Stays forever |
| Shuffle, Download, Copy client link | commands | palette only (+ client view) | — | OCCASIONAL | No Download or Export in designer view except ⌘E |

**Working:** this is the best-prioritised shell in the set. There are 9 params, the published ones come first in their folders, and the dependent row hides.

**Not working:**
- The "5 published" badge doesn't say which five. The rows look identical.
- The explainer box is permanent chrome that's useful once.
- Shuffle and Download live only in the palette and the client view, while the designer would use them too.

**Suggest:**
- Mark published rows (a small dot or icon next to the label, or a "Client sees" group).
- Turn the explainer into the badge's tooltip.
- Add Shuffle and Download (or an Export button) to the toolbar in place of the explainer.
- Nothing needs removing.

## scene (`src/shells/scene/`)

The inspector doesn't scroll at rest [shot]. With a mesh selected: Transform (3 vec3 rows) plus Material (type, colour, roughness, metalness, emission, plus 3 physical-only).

| Control | Type | Where | At rest | Class | Note |
|---|---|---|---|---|---|
| Colourway (5 swatches) | swatch tiles | toolbar | visible | CORE | Duplicated in the inspector and the palette ([ ]) |
| Undo, Redo, A/B, **Presets**, Send, Share, Theme | kit | toolbar | visible | (kit) | Presets ("Custom") is a second preset system beside colourways; scene has no built-in presets |
| Export | menu | toolbar | visible | OCCASIONAL | Contains "Copy camera JSON" |
| Outliner / Views | tabs | left | visible | OCCASIONAL | |
| Outliner tree (11 rows, visibility/lock) | tree | left | visible | CORE | Selection lives here |
| View chip ("Perspective · 30°", views menu) | menu | stage HUD | visible | OCCASIONAL | Views ×3 (tab, chip, camera inspector); Copy camera JSON ×4 |
| Select / Move / Rotate / Scale | tool dock | stage HUD | visible | OCCASIONAL | Product viewer: rotate and scale are rare |
| Projection | icon (M) | dock | visible | RARE, duplicate | Also Camera › Lens |
| Grid floor | icon (G) | dock | visible | RARE, duplicate | Also Inspector › Viewport |
| Turntable | icon (O) | dock | visible | OCCASIONAL, duplicate | Also Inspector › Viewport |
| Frame selection | icon (F) | dock | visible | OCCASIONAL | |
| Axis gizmo | gizmo | stage | visible | OCCASIONAL | |
| Colourway | swatch tiles | Inspector | visible | CORE, duplicate | Plus a help paragraph |
| Background colour | colour | Background | visible | OCCASIONAL | Colourways set it |
| Env intensity | slider | Environment | visible | OCCASIONAL | |
| Env rotation | angle | Environment | visible | RARE | |
| Tone map | select | Rendering | visible | SET-ONCE | |
| Exposure | slider | Rendering | visible | OCCASIONAL | |
| Shadows | switch | Rendering | visible | SET-ONCE | |
| Softness | slider | Rendering | visible (hides when Shadows is off) | OCCASIONAL | |
| Glow | slider | Rendering | visible | **RARE** | Bloom on emissive pixels, but no default material emits, so the effect is near zero |
| Grid floor, Turntable | switches | Viewport | visible | duplicates | |
| Selection help text | static | inspector | visible | (static) | |
| Per light "Cast shadow", Shadow catcher opacity | | selection | on select | OCC. | Shown even with global Shadows off |
| Material › Type, Emission, Clearcoat/Sheen/Transmission | | selection | on select | RARE | Physical rows hidden unless Physical (good) |
| Transform › Rotation, Scale; Visible/Locked | | selection | on select | RARE | Product layout is fixed |

**Working:**
- Colourway is the hero and has the most prominent spot (toolbar centre).
- Physical-only and toon-only material rows hide.
- Softness and Speed hide properly.

**Not working:** heavy duplication.
- Colourway: 2 on screen.
- Grid and turntable: 2 each.
- Projection: 2.
- Views: 3.
- Copy camera JSON: 4.

Also, the Presets menu sits beside colourways, and Glow does almost nothing in the default scene.

**Suggest:**
- *Colourway:* keep it in the toolbar and drop the inspector copy.
- *Presets:* pass `presets={false}` to ParamActions.
- *Viewport:* keep Grid and Turntable in the dock only. Drop the inspector's Viewport folder (or the reverse; the dock is the better home).
- *Projection:* Camera › Lens only.
- *Views:* the Views tab and the view chip. Drop the camera-inspector Views section.
- *Copy camera JSON:* the Export menu and the palette only.
- *Resting inspector:* Background, Exposure and Env intensity. Then a collapsed "Rendering" folder for tone map, shadows, softness, glow and env rotation.
- *`when` gaps:* hide each light's "Cast shadow" and the catcher's opacity when global Shadows is off.

## shader (`src/shells/shader/`)

The inspector doesn't scroll [shot]. With a layer selected: a Layer section (blend, opacity) plus that layer's schema (mesh: 5 params), then the Document folders below.

| Control | Type | Where | At rest | Class | Note |
|---|---|---|---|---|---|
| Randomise | button (R) | toolbar | visible | CORE | |
| Copy shader code | icon | toolbar | visible | OCCASIONAL, duplicate | Also in the Export menu (same shortcut) and the palette |
| Undo, Redo, A/B, Send, Share, Theme | kit | toolbar | visible | (kit) | |
| Export | menu (PNG 1×/2×/4K, MP4 1080/4K, code, share) | toolbar | visible | OCCASIONAL | |
| Add effect | + menu | Layers header | visible | CORE | |
| Effect stack | list with inline visibility, opacity and blend | left | visible | CORE | Opacity and blend repeated in the Layer section |
| Looks grid + save | grid | left › Looks | visible | CORE | Built-in presets = looks |
| Aspect | select | Document › Canvas | visible | SET-ONCE | |
| Background | colour | Canvas | visible | OCCASIONAL | Usually hidden under a fill layer |
| Speed | slider | Time | visible | OCCASIONAL, duplicate | The transport speed menu sets the same param |
| Loop length | slider | Time | visible | SET-ONCE | |
| Seed | seed field | Time | visible | OCCASIONAL | Randomise covers most uses |
| Resolution | select | Render (collapsed) | hidden | SET-ONCE, duplicate | The transport resolution menu sets the same param |
| Frame rate, Drawing at | monitors | Render (collapsed) | hidden | RARE, duplicate | The transport shows fps |
| Play, time, loop scrub | transport | bottom | visible | OCCASIONAL | |
| Speed menu, fps monitor, resolution menu | transport | bottom | visible | OCC. / RARE / SET-ONCE | |
| Per layer: mesh colours, softness | | layer schema | on select | CORE | |
| Per layer: scale, drift; cycles | | layer schema | on select | OCC. / SET-ONCE | |

**Working:**
- Looks plus layers on the left is the right hero.
- The Render folder is collapsed.
- Layer schemas use `when` (halftone ink, chromatic angle, warp style).
- The transport is compact.

**Not working:**
- Speed, Resolution and the fps readout each have two homes: Document inspector and transport.
- With nothing selected, the right panel shows set-once document settings (Aspect, Loop length) rather than the layer you'd tune.
- Copy shader code appears three times.

**Suggest:**
- *Delete from the inspector:* `speed` (Time folder) and the whole Render folder (quality and both monitors). The transport owns them.
- *Fold:* Aspect, Background, Loop length and Seed into one "Document" folder, collapsed when a layer is selected.
- *Default selection:* select the top layer on load so the right panel opens on real controls.
- *Copy shader code:* drop the toolbar icon (Export › Code plus ⇧⌘C remain), or keep it and drop the menu item.

## synth (`src/shells/synth/`)

Both side panels scroll [shot]:
- On the right, Effects is cut mid-row; Reverb size, Reverb return and all 6 drum knobs sit below the fold.
- On the left, the Bass row is cut and Master is hidden.

| Control | Type | Where | At rest | Class | Note |
|---|---|---|---|---|---|
| Play/Stop | icon | toolbar | visible | CORE | |
| Tempo | scrub field | toolbar | visible | CORE | Its param folder ("Transport") is hand-placed here: good |
| Swing | scrub field | toolbar | visible | OCCASIONAL | |
| Bar position, loop length | readouts | toolbar | visible | (display) | |
| Undo, Redo, A/B, Send, Share, Theme | kit | toolbar | visible | (kit) | |
| Export | menu | toolbar | visible | OCCASIONAL | |
| Oscilloscope, spectrum, level meter | canvases | left › Monitor | visible | (display) | About 260px of display-only chrome; the stage is already a visual |
| Mixer: level ×4 | knobs | left › Mixer | visible | OCCASIONAL | |
| Mixer: delay send ×4, reverb send ×4 | knobs | left › Mixer | visible | **RARE** | 8 knobs; no preset touches them |
| Master | knob | left › Mixer | below fold | SET-ONCE | |
| Plate / Pendulum | segmented | stage HUD | visible | OCCASIONAL | |
| Sound preset | menu | right header | visible | CORE | 5 sounds vary 14 keys [preset] |
| Wave | segmented (icons) | Oscillator | visible | CORE | [preset] |
| Octave | knob | Oscillator | visible | OCCASIONAL | Not in any sound |
| Detune, Sub, Glide, Gate | knobs | Oscillator | visible | OCCASIONAL | [preset] all |
| Envelope graph | editor | Envelope | visible | CORE | [preset] ADSR |
| A / D / S / R fields | scrub fields | Envelope | visible | OCCASIONAL, duplicate | Same values as the graph handles |
| Filter type | segmented | Filter | visible | OCCASIONAL | |
| Cutoff, Reso, Env amt | knobs | Filter | visible | CORE | [preset] |
| Drive | knob | Filter | visible | OCCASIONAL | |
| Delay time | segmented | Effects | visible | OCCASIONAL | |
| Feedback, Return | knobs | Effects | visible | OCCASIONAL | |
| Delay tone | knob | Effects | visible | **RARE** | Subtle low-pass in the feedback loop |
| Reverb size, Reverb return | knobs | Effects | below fold | SET-ONCE / OCC. | |
| Kick tune, kick decay, snare tone, snare decay, hat decay, hat tone | knobs | Drums | below fold | OCCASIONAL | |
| Pattern menu ("Four on the floor") | menu | sequencer header | visible | CORE | |
| Shift left / right | icons | sequencer header | visible | **RARE** | |
| New hat groove | icon (H) | sequencer header | visible | OCCASIONAL | |
| Humanise | icon | sequencer header | visible | RARE | |
| Clear | icon | sequencer header | visible | OCCASIONAL | |
| Per track: audition, M, S (×4) | buttons | sequencer | visible | OCCASIONAL | |
| Step grid (64) + bass notes (16) | grids | sequencer | visible | CORE | |

**Working:**
- Tempo and Swing moved to the toolbar.
- Sound presets are scoped and sit in the panel header.
- The sequencer is first-class at the bottom.
- Knobs suit the domain.

**Not working:** at 64 visible widgets, this is the densest shell.
- The left panel gives its prime space to a display-only monitor and a 12-knob mixer, 8 of them sends no preset touches.
- The voice controls that sounds vary are split across a panel that scrolls, while the rarer Drums sit at the bottom where they're cut off.
- The ADSR fields repeat the envelope graph.

**Suggest:**
- *Left panel:*
  - Shrink the Monitor to a one-line level meter, or put the scope and spectrum behind a "Monitor" toggle (the stage already visualises the sound).
  - Mixer at rest: 4 level knobs plus Master.
  - Sends go in a collapsed "Sends" sub-section, or a per-track popover from the track name.
- *Right panel:*
  - Open by default: Oscillator, Envelope, Filter.
  - Collapsed: Effects and Drums.
  - Delay tone goes behind "More".
- *Envelope:* drop the four ADSR fields, or show them only on hover or focus of the graph. Typed entry is the 2.5.7 alternative, so keep them accessible, just smaller: one line of compact values.
- *Sequencer header:* move Shift left/right and Humanise into a "⋯" menu. Keep New hats and Clear.

## type (`src/shells/type/`)

In Specimen mode the inspector fits at about y≈815 [shot]. Kinetic mode adds the 260px timeline; with 3 folders (about 15 rows, an effect tile grid and colour pairs) it most likely scrolls. That's an estimate; there's no QA shot of it.

| Control | Type | Where | At rest | Class | Note |
|---|---|---|---|---|---|
| Mode: Specimen / Kinetic / Scale | segmented | toolbar | visible | CORE | |
| Undo, Redo, A/B, Presets, Send, Share, Theme | kit | toolbar | visible | (kit) | |
| Export | menu, mode-aware | toolbar | visible | OCCASIONAL | |
| Glyphs / Waterfall | tabs | left | visible | OCCASIONAL | |
| Glyph set (A–Z, a–z, 0–9, ?!, Àé) | segmented | left | visible | OCCASIONAL | |
| Glyph grid | grid | left | visible | OCCASIONAL | |
| Family | select | Font | visible | CORE | [preset] all four |
| Text | multiline text | Font | visible | OCCASIONAL, duplicate | Hint: "Also editable directly on the artboard" |
| Weight | slider | Axes | visible | CORE | [preset] |
| Auto optical | switch | Axes | visible | SET-ONCE | |
| Optical size | slider | Axes | visible (hides with Auto optical) | OCCASIONAL | [preset] Editorial |
| Width | slider | Axes | visible | **RARE** | Simulated by horizontal scaling; no face has a wdth axis |
| Slant | slider | Axes | visible | **RARE** | Simulated skew; Italic exists |
| Italic | switch | Axes | visible | OCCASIONAL | [preset] Editorial |
| Size, Leading, Tracking | sliders | Typesetting | visible | CORE | [preset] all |
| Case | segmented | Typesetting | visible | OCCASIONAL | [preset] Terminal |
| Align | segmented | Typesetting | visible | OCCASIONAL | |
| Text, Paper | colours | Colour | visible | OCCASIONAL | Duplicated by Colour pairs |
| Contrast | monitor | Colour | visible | RARE (readout) | Useful, but a readout |
| Format, Margin, Captions | | Artboard (collapsed) | hidden | SET-ONCE | Good |
| Colour pairs (6) | swatch grid | inspector | visible | CORE | |
| Kinetic: text, effect tiles, size, weight, tracking; order, stagger, duration, amplitude, curve, hold, play out | | Kinetic | mode | CORE / OCC. | `when` for hold, play out and seed is correct |
| Scale: base, ratio, steps up/down, names, rounding, units; rhythm (3); Fluid (collapsed); Preview (collapsed) | | Scale | mode | CORE: base, ratio; SET-ONCE: names, rounding, units | |
| Code section (pre + Tailwind v4/v3 + copy) | buttons | Scale | mode | duplicate | Same items as the Export menu |

**Working:**
- Modes split one schema three ways, so each mode shows only its folders.
- Artboard, Fluid and Preview are collapsed.
- Dependents hide.
- The presets vary exactly the top Font, Axes and Typesetting rows.

**Not working:**
- Width and Slant are fakes shown at full weight next to real axes.
- The Text field duplicates on-canvas editing.
- Colour pairs and Text/Paper are two homes for the same choice.
- Scale mode's Code section duplicates the Export menu.

**Suggest:**
- *Axes:* keep Weight, Optical size and Italic. Move Width and Slant into a collapsed "Simulated" folder, or remove them.
- *Text:* make the field palette-only (E edits on the artboard), or collapse it.
- *Colour:* put Colour pairs first, with Text and Paper in a collapsed "Custom colours" folder. Show the contrast as a badge on the pairs.
- *Scale mode:* keep the Code preview but drop its buttons (Export has them), or drop the preview.
- *Kinetic:* collapse Colour by default to avoid the scroll.

## ui-design (`src/shells/ui-design/`)

At rest (nothing selected) the panel fits [shot]. The selection panel is hand-built with every section open (Position, Layout, Appearance, Fill, Stroke, Effects, Typography or Icon, Export). For a text node or an auto-layout frame it very likely scrolls; I didn't shoot that state.

| Control | Type | Where | At rest | Class | Note |
|---|---|---|---|---|---|
| File | menu (new page, save .json, export, reset) | toolbar | visible | OCCASIONAL | |
| Undo, Redo, Theme | kit | toolbar | visible | (kit) | |
| Present | icon | toolbar | visible | OCCASIONAL | Also in the Prototype panel |
| Export | menu | toolbar | visible | OCCASIONAL | |
| Pages (+ add, ⋯) | list | left | visible | OCCASIONAL | |
| Layers | tree | left | visible | CORE | |
| Tool dock (7 tools) | dock | canvas | visible | CORE | |
| Zoom | % menu | right panel header | visible | OCCASIONAL, duplicate | Also the canvas zoom pill (69% twice in the shot) |
| Design / Prototype | tabs | right header | visible | OCCASIONAL | |
| Page background | colour | Page | visible | OCCASIONAL | |
| Page colours | swatch list | Page | visible | OCCASIONAL | Select-by-colour, a nice touch |
| Export presets (1× PNG … 2× WebP) | chips | Export | visible | SET-ONCE, duplicate | Export settings, place 1 |
| Export N frames | button | Export | visible | OCCASIONAL | Also File and Export menus |
| Save .json, Open… | buttons | Document | visible | RARE, duplicate | Also the File menu (Save) |
| Reset to demo file | button | Document | visible | RARE, duplicate | Also the File menu and palette |
| Snapping: Objects, Pixels | switches | prefs › Snapping | visible | SET-ONCE | |
| Snapping: Distance | slider | prefs › Snapping | visible | RARE | Shown even when Objects is off (no `when`) |
| Nudge: Small, Big | fields | prefs › Nudge | visible | SET-ONCE | |
| Export settings: Scale, Format, Suffix | | prefs (collapsed) | hidden | SET-ONCE, duplicate | Export settings, place 2 |
| View: Dot grid, Comments, Prototype links | | prefs (collapsed) | hidden | SET-ONCE | |
| *Selected:* Alignment (6 icons) | icons | Position | on select | OCCASIONAL, duplicate | The context bar shows the same aligns |
| X, Y; Rotation (+ rotate 90°, reset) | fields | Position | on select | CORE / OCC. | |
| W, H, auto layout, clip | | Layout | on select | CORE / OCC. | |
| Opacity, blend, radius | | Appearance | on select | OCC. | |
| Fill, Stroke, Effects | | sections | on select | CORE / OCC. | |
| Export settings + Export + Copy CSS | selects + buttons | Export section | on select | duplicate | Export settings, place 3; Copy CSS also in the context bar, Export menu and palette |
| Context bar (align, distribute, boolean, export, copy CSS, more) | toolbar | canvas | on select | OCCASIONAL | |

**Working:**
- The Figma-shaped layout is familiar.
- The tool dock and layers are the clear core.
- The context bar keeps arrange actions near the selection.
- The Export settings and View preference folders are collapsed.

**Not working:**
- Export settings live in three places (chips, the prefs folder, and the selection Export section) on top of two menus.
- Snapping and Nudge are set-once but sit open at rest.
- Save, Open and Reset to demo repeat the File menu.
- Zoom shows twice.
- Alignment shows in the inspector and the context bar.

**Suggest:**
- *Resting inspector:* Page (background, colours) and "Export N frames". Collapse the rest of the prefs (Snapping, Nudge, Export settings, View) into a "Preferences" folder.
- *Remove the Document section:* the File menu has these.
- *One home for export settings:* the selection Export section. Drop the chips (or the prefs folder).
- *Hide* Snap distance when object snapping is off.
- *Drop* the panel-header zoom menu (keep the pill).
- *Drop* the inspector Alignment row when the context bar shows aligns.
- *Selection panel:* collapse Effects and Export by default.

## video (`src/shells/video/`)

The QA shot has a text clip selected. Its inspector scrolls: Layout is cut at Opacity, and Animation (In/Out preset, duration and ease ×2) sits below the fold. The Library panel also scrolls; "Overlays" is cut off.

| Control | Type | Where | At rest | Class | Note |
|---|---|---|---|---|---|
| Aspect (9:16 / 4:5 / 1:1 / 16:9) | segmented | toolbar | visible | CORE | Also Inspector › Composition and the 1–4 keys |
| Undo, Redo, A/B, Send, Share, Theme | kit (no presets) | toolbar | visible | (kit) | A/B compares only composition params, never clips, so it's near-useless here |
| Export | menu | toolbar | visible | OCCASIONAL | |
| Library: Text (4), Shapes (4), Images (4), Overlays (2) | tile grids | left | visible except Overlays | CORE | Add clip, place 1 |
| Transport: start, prev, play, next, end | icons | timeline | visible | Play CORE, rest OCC. | |
| Split | icon (⌘B) | timeline | visible | OCCASIONAL | |
| Add clip | + menu | timeline | visible | OCCASIONAL, duplicate | Add clip, place 2 |
| Snap | icon | timeline | visible | SET-ONCE, duplicate | Also Inspector › View |
| Timeline zoom −, slider, +, fit | | timeline | visible | SET-ONCE | |
| Tracks + clips | timeline | bottom | visible | CORE | |
| *No selection:* Aspect | segmented | Composition | rest | RARE, duplicate | |
| Frame rate, Duration, Matte | | Composition | rest | SET-ONCE | |
| Safe areas, Snapping, Preview quality | | View | rest | SET-ONCE | Snapping is a duplicate |
| Re-layout ("Design for X from here") | button | Re-layout | rest (only when the aspect differs) | RARE | |
| Add clip (Text, Shape, Image, Progress) | buttons | inspector | rest | RARE, duplicate | Add clip, place 3 (plus ⇧T and the palette) |
| *Text clip:* type badge, duplicate, delete | | Clip header | on select | OCC. | |
| Name, Start, Duration, Track | | Clip | on select | Start/Dur CORE; name, track OCC. | |
| Text, Font, Size, Colour | | Text | on select | CORE | |
| Weight, Align, Spacing ×2, Max width, Highlight | | Text | on select | OCCASIONAL | |
| Position, Size, Rotation (+2 icons), Opacity | | Layout | on select | Position CORE; rest OCC. | |
| In/Out preset | selects | Animation | below fold | CORE | Arguably the most video-specific control, and it's the one hidden |
| In/Out duration, ease | fields + curve popover | Animation | below fold | OCCASIONAL | |

**Working:**
- Aspect is in the toolbar centre: re-framing is the hero, and it's prominent.
- Clip-type sections switch with the clip kind.
- Curves use a popover.
- The timeline transport is complete.

**Not working:**
- "Add clip" lives in 4 places.
- Aspect and Snap are each shown twice.
- The resting inspector is set-once composition settings.
- On a selected clip the most video-specific controls (In/Out animation) are below the fold, while Name, Track, Max width and Highlight sit above them.

**Suggest:**
- *Resting inspector:*
  - Drop Aspect (toolbar owns it) and the Add clip section (the Library owns it).
  - Keep Duration and Matte.
  - Put Frame rate, Safe areas and Preview quality in a collapsed "Settings" folder.
  - Snapping: transport only.
- *Clip inspector order:* Clip timing (start, duration), Text (content, font, size, colour), **Animation**, then Layout.
  - Collapse "Text › More": weight, spacing, max width, highlight.
  - Move Name into the header (InlineText) and Track into the clip's context menu.
- *ParamActions:* drop A/B here (`compare={false}`).

---

## Cross-shell checklist (cheap, high-yield)

1. **Delete or merge duplicates.** Where a control has two homes on screen, keep one plus the palette:
   - scene: colourway, grid, turntable, projection, views, copy camera
   - shader: speed, resolution, fps
   - ui-design: export settings, document buttons, zoom, alignment
   - video: add clip, aspect, snap
   - photo: auto, clipping
   - nodes: PNG size
   - motion: Replay
2. **Collapse by default in hand-built panels:**
   - photo: everything but Basic
   - synth: Effects, Drums, sends
   - ui-design: Effects, Export
   - video: Text › More
3. **Make the resting inspector useful:**
   - shader: select the top layer
   - nodes, ui-design: collapse prefs into one "Preferences" or "Graph settings" folder
   - video: collapse the set-once composition fields
4. **Add `when` where a row has no effect:**
   - ui-design: snap distance
   - scene: per-light shadow and catcher opacity
   - nodes: gradient center and angle
5. **Remove or hide rare and fake controls:**
   - motion: the "iPhone 15" button
   - type: Width and Slant
   - nodes: Lacunarity, Blur quality
   - scene: Glow
   - photo: Texture, Dehaze (or behind "More")
   - synth: delay tone, sends, shift and humanise
6. **Turn ranking evidence into a rule:** what Send to agent and the presets touch stays top-level; what neither touches goes one level down. This could be a dev-only report: list params never changed by any preset or note.
