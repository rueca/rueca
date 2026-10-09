# Kit gaps reported by shell builders (consolidation backlog)

## type + synth
Promote:
- synth/local/Knob.tsx — vertical drag, shift fine, dbl-click reset, log taper, bipolar, 3 sizes, role=slider, typed field. Wire `NumberDef.display: 'knob'` in Inspector (schema has it, renderer ignores it).
- type/local/textToSvg.ts — DOM text → SVG with embedded fonts → PNG. io.ts only exports existing <svg>.
- type/local/ease.ts — cubicBezier() maths (motion/artifact.ts duplicates it). Kit should export easing maths next to CurveEditor.
- synth/local/EnvelopeEditor.tsx — ADSR drag editor.
- type/local/contrast.ts (WCAG ratio/grade), synth/local/WaveIcons.tsx.
Fix:
- Inspector `folders` should follow array order.
- schema: `scale: 'log'` for numbers; `p.data<T>()` opaque document param (hidden, undoable).
- presets merge into defaults → applying a "sound" preset resets the pattern. Need preset key scope / merge mode.
- Timeline TrackArea capped 240px, no lane scroll.
- toast: needs `toast.promise` / update helper; motion shell leaves a loading toast forever (timeout 0).
- theme.css font-feature-settings leak into artboard; Artboard should reset.
- Space conflict: Stage space-pan vs Timeline space-play.
- Range value fields 44px truncate "1440px"; 84px label column truncates.
- Menu `hint` typed but not rendered.
- CanvasSurface needs clockless animate mode.
- Hand-built Section lacks open-state persistence; need useTokens() for chrome canvases (Monitor reads computed style every frame).

## from packaging fork
- **Token collision with shadcn** (`muted`, `accent`, `input`, `font-sans` mean different things there). Workaround shipped in registry copy: import kit theme last + `:root:root`. Proper fix: namespace kit tokens (e.g. `text-fg-muted`, `bg-studio-accent`) — mechanical rename across kit + shells; do it in consolidation AFTER builders finish.
- **CanvasSurface forwardRef erases the generic** → `draw`'s `v` untyped. React 19: drop forwardRef, take `ref` as a prop.
- Shell `<Brand name>` and kit comments hardcode "Prototype Studio" — shells can import `site` from '@/site.config' for the rename; kit stays portable.
- Process: after shells land or KIT.md changes, run `npm run sync` (regenerates skill references, registry, plugin manifests); `npm run check` fails CI if stale. qa.mjs now reads ids from `#/shells` `[data-shell-id]`.

## batch + marks
Promote:
- **Unified history / doc store**: batch/local/history.tsx `createDocStore` + `linkHistory`. HistoryButtons/ParamActions only know one params store → add kit doc store + `ParamActions history={…}`. (HIGH — every document-style shell needs it.)
- **Zip writer** batch/local/zip.ts (STORE+CRC32 ~90 lines). Multi-download gets blocked.
- Overrides layer in Inspector (batch/local/OverrideRows.tsx) — per-size/per-variant overrides with revert + push.
- DataGrid (CSV/TSV paste), VariantGrid (keep/fav), JobQueue + Progress, Modal (kit has no dialog), SizeLadder, pack.ts (artboard auto-arrange).
Fix:
- Stage.tsx 64–92 refits when `contentSize` identity changes even after user zoom → compare by value, respect touched.
- Stage `fill` mode still tracks Space + grab cursor (conflicts with Space-reroll).
- Inspector open-state LS key shared across instances → include folders/keys in key.
- Select auto-segmented ignores width → truncation ("Squ…"). Decide by total label length.
- Folder lock: `disabled` UI-only; setValue/applyPreset ignore it; presets need folder scope.
- Layers eye/lock always occupy 48px → overlay on hover, `toggles` prop.
- Artboard selectable only via label; CanvasSurface can't redraw on non-param inputs (add `deps`/`redraw` key); exportSVG accepts string; toast.dismiss; params.replace(values,{history:false}); Tiles square too tall (aspect option); Panel needs h-full option; useHotkeys re-subscribes each render via deps.

## animate + video
Promote:
- **Editable KeyframeTimeline** (animate/local/KeyframeTimeline.tsx) — kit Timeline is read-only and binds Space/J/K/S globally (Timeline.tsx:77) → can't coexist. Split: Transport + hotkeys optional, editable key lanes.
- **TrackTimeline** multi-track clips (video/local/TrackTimeline.tsx).
- **Frame-accurate export** video/local/encodeVideo.ts (mediabunny). io.ts:48 references nonexistent recordFrames.
- **Progress toast** video/local/progressToast.tsx (update in place, cancel).
- KeyButton (4-state diamond), EasingEditor (presets+curve+spring+hold), SpringField (Duration+Bounce default — kit SpringEditor lacks it), StateMachinePanel.
Fix:
- `p.data()` hidden document def (2nd request). commit uses JSON.stringify compare on whole doc (params.ts:124) — perf for big docs.
- ScrubValue `fmt` display-only → need `parse` / percent mode (typed 150 → 150×).
- Tip can't wrap ScrubValue (no forwardRef/props spread).
- Clock: ping-pong / once / loop mode.
- Hotkey collisions silent (theme `t` steals) → dev warning on duplicate bindings; registry.
- Palette ranking: exact keyword/label match should win.
- Popover anchored to point/rect helper; design-frame relayout helper.

## shader + dither
Promote:
- **Collection param** `p.list`/`p.data` (3rd request — layer stack as cast text param in shader/state.ts).
- **Item params**: Inspector pointed at one item in a collection — shader/local/itemParams.ts proxy store per layer type; drags uncommitted, one commit = one parent undo step. Suggest `params.item(schema, read, write)`.
- **EffectStack** (eye, blend chip, opacity scrub, delete, reorder, + menu by category) shader/local/EffectStack.tsx.
- **PresetGrid** visual thumbnails w/ hover preview (dither imports it cross-folder).
- **recordFrames** (mediabunny) shader/local/recordFrames.ts — bitrate ~0.15 bpp/frame cap 40 Mbps.
- **useHoldKey** (hold-to-peek), **ZoomSteps** (integer zoom to 3200%), **useFitFrame** (fixed-aspect frame avoiding overlay panels), **useImageIntake** (window drop/paste, keeps filename), PalettePicker.
Fix:
- `\` hardwired to A/B in ParamActions — add `compare={false}` / configurable key.
- Scoped presets (4th request).
- Stage contentSize identity refit (2nd report).
- Overlay `bottom` slot is full-width and captures clicks (Studio.tsx:51) → pointer-events-none wrapper, auto on child.
- **p.image data URLs persisted to localStorage + share URL** → can silently break persistence. Store blobs in IndexedDB/object URLs; exclude from URL.
- exportCanvasPNG smoothing on for pixel art → option.
- Export renderControl + menu item classes.
- Monitor restarts on `get` identity change.
- Clock emits while paused; no visibility handling (pause when hidden).
- Persisted values keep stale structure after defaults change → schema version / migration.
- ZoomPill fixed steps.

## flows + journey
Promote:
- **Doc store + unified history** flows/local/doc-store.ts (`createDocStore`, `createHistory([doc, params])`) + HistoryControls.tsx — 3rd independent implementation (batch, flows, animate/video via p.text). TOP PRIORITY.
- **DOM → PNG snapshot** flows/local/snapshot.ts (traps: preflight `border:0 solid` → explicit widths; need `hide` option not just `filter`).
- InlineText (double-click rename; LayerTree has private copy), ZoomControls (ZoomPill tied to private CamCtx → props `{zoom,onZoom,onFit}`), ChipInput (tags), smoothPath (Catmull-Rom clamped).
Fix:
- Stage fit() needs `fitMaxZoom` default 1 (small boards zoom to 156%).
- Hotkeys: precedence = registration order; need priority/scope (Stage Shift+1 beats palette; Studio Esc beats shell).
- Segmented fit heuristic wrong ("Shipped" truncates at 280px) — measure, or char budget per width.
- Tiles columns: balance rows, not min(n,6).
- Studio statusbar outside layout flow.
- toast update/dismiss/promise (4th report).
Decision: React Flow attribution hidden via proOptions in flows — recommend SHOW it (open source, courtesy; they ask for Pro sub to hide).
Coupling: journey imports from flows/local/ → resolve by promoting.

## nodes + generate
Promote:
- **SchemaInspector** `<SchemaInspector schema values onChange>` (or non-persisted params factory) — Inspector requires a params store; per-node schemas needed throwaway stores (nodes/graph/nodeParams.ts). Export renderControl. (Same need as shader itemParams.)
- **History adaptor** `{undo, redo, canUndo, canRedo}` for HistoryButtons/hotkeys + combined history (5th report).
- Scoped presets (5th report: settings preset wiped the prompt).
- Masonry, QuickAdd (search popover at cursor; flows/nodes both), **SplitPane** (resizable — consider react-resizable-panels), CompareSlider (dither has one too), PromptBox, DenoisePreview, InlineEdit (now in 3+ shells), graph-theme.css (React Flow styled with tokens — flows has one too → kit `xyflow.css`).
Fix:
- Tokens: categorical colour set (port types, categories, lanes) + image scrim token (`bg-black/50` used).
- TextInput stops every key (controls.tsx:192) → ⌘↵ submit impossible; only stop single-key shortcuts.
- Stage hotkeys/space global; ZoomPill Stage-only (3rd report); Artboard `background` overrides checker class.
- GradientEditor always shows angle → `angle={false}` for 1D ramps.
- Section shows chevron without onToggle; Empty py-10 too tall in side panels; global hotkeys fire while a button has focus (Space).
- React Flow attribution: nodes kept it (faint) — make consistent with flows (show it).

## provenance (done 2026-10-09)
THIRD_PARTY_NOTICES.md created; shader snoise/hash12/OKLab annotated; fbm + domain-warp constants replaced. TODO after photo builder finishes: photo/landscape.ts fbm lacunarity 2.02 → own constant (generic, low priority).

## scene + photo
Promote:
- **Named history** `patch(v, { label })` + history accessor (photo/local/history.tsx).
- **Partial presets** `partial: true` + PresetMenu matching subset (6th report).
- **SafeArea** for overlay layout: `--safe-*` vars / `useSafeArea()` so HUD + camera centre avoid panels.
- **ParamSlider / GradientSlider** (painted tracks — Temp/Tint/Hue); export ParamRow.
- Bipolar: default slider `origin` 0 when min<0<max (Inspector.tsx ~197).
- `p.custom`/`p.data` (4th request).
- useHoldKey (2nd), ToneCurve+sampleCurve, Histogram, CropOverlay (fitInsideRotated), CompareSplit (3rd compare impl), Filmstrip, Navigator (any Stage camera), AxisGizmo, Vec3Input w/ uniform lock, SwatchTiles.
Fix:
- Section controlled-only → uncontrolled default + persistence.
- ParamActions `compare={false}` (3rd).
- toast dismiss (6th).
- MountSurface handle (expose engine/el); WebGL canvas surface (CanvasSurface 2D only).
- LayerTree per-item toggles opt-out; roving tabindex when nothing selected.
- ScrubValue prefix fixed w-3; Segmented truncation (again).
- Stage fill grab cursor on Space (3rd). Brand pill in docked layout inconsistent with Cluster.
- LS.set fails silently on quota → surface a toast/warning; never persist images in params.
Provenance: photo/landscape.ts hashes + fbm constants replaced with own; scene/photo use only standard algorithms. ✓

## ui-design + component-lab
Promote: TransformBox, snap.ts (smart guides + ⌥ measure), SelectionBar (context bar), StackList (fills/effects — compare shader EffectStack), PaintField (solid/linear/radial/image), QuadField (padding/radius), AlignGrid (3×3), ViewportFrame (resizable breakpoints), OklchField (gamut markers), CodeBlock, linkedHistory.ts (4th history impl).
Fix:
- Stage fit identity bug (4th report) + fit assumes origin 0,0; external `touched`; world needs pointer-events-none for background clicks.
- Hotkeys: ThemeToggle `t` collides with Text tool; `?` sheet hardcodes entries; no scoping (child shadows parent).
- LayerTree: default-collapsed/controlled expansion, scroll-to-selected, onHover, drop inside empty frame, keys leak to global hotkeys.
- Inspector 84px label column vs 4-option segmented.
- ScrubValue `mixed` should scrub as delta.
- Artboard default background #000; style spread drops ring.
