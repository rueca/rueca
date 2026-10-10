<!-- Copied from docs/KIT.md by `npm run sync`. Edit the source, not this file. -->

> In a project that installed the kit from the registry, `@kit` means `@/components/studio` (or alias it). Live examples of every shell: https://rueca.dev/ · source: https://github.com/rueca/rueca/tree/main/src/shells

# Rueca kit — guide

The kit is the **harness**: the design-tool chrome around a prototype. The prototype (the
*artifact*) can be anything — Canvas 2D, WebGL, vanilla three.js, SVG, DOM/React, an iframe.
Import everything from `@kit`. Read `src/shells/motion/` for a complete worked example.

## 1. Rules that keep it looking pro

- **Never hardcode a colour in chrome.** Use the tokens (Tailwind utilities below). The only
  legal home for a hex value is the artifact (inside the artboard / canvas) and `theme.css`.
- **Neutral chrome, brand inside the artboard.** Artboard text uses `font-artboard`.
- **Sentence case**, never uppercase micro-caps. Section heads 11.5px medium.
- **Hierarchy by opacity tier** (`text-fg` / `text-fg-muted` / `text-fg-faint`) at ~one size, not by
  mixing sizes and weights. Live numbers always `tabular`.
- **One accent, only on state** (filled slider, selection, focus, primary button). The
  playhead is `bg-rec` (red/orange) — never the accent.
- **Radius + shadow, not borders.** Islands use the `panel` utility; toolbar groups `cluster`;
  popovers `pop`. A boundary inside a panel is `border-line` (6–8%), never a solid grey rule.
- **Icons**: lucide-react. 14px at stroke 1.5 for toolbar and row icons; 12–13px (stroke 1.5–1.75)
  inside dense 24px controls (chevrons, steppers, close ×); 16px in the tool dock. Never larger in chrome.
- **Hover reveals** secondary affordances (reset, eye/lock, thumbs). But everything hover-only
  must also appear on `:focus-visible` / `focus-within`.
- **Every drag has a non-drag alternative** (typed field, stepper, menu item) — WCAG 2.5.7.
- **Interaction ownership:** an operation lives on the canvas *or* the panel, not mirrored
  confusingly on both (exception: a numeric field that shadows a canvas handle).
- Empty selection → the inspector shows document/scene settings (Spline), never a blank panel.
- Light theme must work. Test both (`T` toggles).

### Tokens (Tailwind utilities)
Surfaces: `bg-field` (window) · `bg-panel` (islands) · `bg-overlay` (menus) · `bg-well`
(recessed, segmented background) · `bg-track` (slider groove) · `bg-raised` (pill in a well) ·
`bg-active` (toggled control on a panel) · `bg-control` (field fill) · `bg-hover` · `bg-press`.
Text: `text-fg` · `text-fg-muted` · `text-fg-faint`. Lines: `border-line` · `border-line-strong`.
Accent: `bg-signal` (fills) · `bg-signal-strong` (surfaces carrying text) · `text-signal-fg` ·
`bg-signal-soft` (selection wash). Semantic: `key` (keyframed, amber) · `rec` (playhead/record/
error) · `ok`. Lanes: `bg-lane`. Utilities: `panel` `cluster` `pop` `tabular` `no-select`
`checker`. Categorical (identity, never state): `cat-1`…`cat-8` (ports, lanes, tags). Over
images: `bg-scrim`. CSS vars: `--row` (28px lane), `--gutter`, `--inspector-w`, and in islands and
overlay layouts `--safe-top/right/bottom/left` (what the panels cover).
Token names are namespaced so they never collide with shadcn (`muted`, `accent`, `input` mean
something else there): ours are `fg-muted`, `signal`, `control`; font is `font-ui`.

## 2. State: schema → params store

```ts
import { defineSchema, folder, p, createParams, createClock } from '@kit'

export const schema = defineSchema({
  shape: folder('Shape', {
    count:  p.number(12, { min: 1, max: 64, step: 1, hint: 'One sentence. This IS the docs.' }),
    radius: p.number(80, { min: 0, max: 400, unit: 'px' }),
    mode:   p.select('grid', ['grid', 'radial', 'spiral']),        // ≤4 short → segmented, else dropdown; value typed 'grid' | 'radial' | 'spiral'
    tint:   p.color('#5b8cff'),                                     // alpha default on; { alpha: false }
    seed:   p.seed(7),
    angle:  p.angle(45),
    offset: p.vec2({ x: 0, y: 0 }, { min: -1, max: 1 }),            // display: 'pad' | 'fields'
    pos:    p.vec3({ x: 0, y: 1, z: 0 }, { step: 0.1 }),
    size:   p.size({ w: 1080, h: 1350 }, { lock: true }),
    ease:   p.curve([0.16, 1, 0.3, 1]),
    spring: p.spring({ stiffness: 180, damping: 18, mass: 1 }),
    grad:   p.gradient({ angle: 90, stops: [{ pos: 0, color: '#000' }, { pos: 1, color: '#fff' }] }),
    colors: p.palette(['#111', '#eee']),
    kinds:  p.multi(['a'], [{ value: 'a', icon: Square }, …]),     // icon tiles, multi-select
    on:     p.boolean(true),
    title:  p.text('Hello', { multiline: false }),
    photo:  p.image(null),
    range:  p.range([20, 80], { min: 0, max: 100 }),
    go:     p.action('Randomise', (v) => …),                        // button row, not a value
    fps:    p.monitor(() => stats.fps, { graph: true }),            // live readout, not a value
  }),
  more: folder('Advanced', { … }, { collapsed: true }),
})
```

Every def accepts `label`, `hint`, `when: (v) => boolean` (conditional row), `disabled`,
`live: false` (marks it expensive — the kit doesn't hold it back; do the heavy work in `params.onCommit`), `publish: true` (shows in the client view),
`persist: false` (keep out of localStorage), `share: false` (keep out of links/JSON).
Keys are **flat across folders** (`v.count`).

Number `step` defaults from the range when omitted (0–1 → 0.01, 0–10 → 0.1, ≥100 wide → 1).

More defs: `p.data<Layer[]>([], { validate })` — a hidden, typed document value (a layer stack, clips, pattern
steps): undoable and persisted, never rendered as a row. `p.image()` defaults to persist/share
off (a photo would blow the storage quota). Numbers take `scale: 'log'`, `soft: [lo, hi]` (drag
range; typing can exceed it), `parse` (typed text → number, e.g. percent), `display: 'knob'`.

```ts
export const params = createParams(schema, {
  id: 'my-tool', version: 2,                          // bump when the schema's shape changes
  presets: [{ name: 'Calm', values: { … } }],          // merge by default: only the listed keys change
  presetKeys: ['palette', 'grain'],                    // what "Save preset" captures (default: all shareable)
})
params.values()                       // current values (non-reactive)
params.subscribe((s) => …)            // every change, incl. mid-drag (zustand)
params.onCommit((v, meta) => …)       // pointer-up only; meta = { label, kind: edit|undo|redo|replace }
params.setValue('count', 3, { label: 'Count' })   // commits one labelled undo step; { commit: false } mid-drag
params.patch({ … }); params.reset(['count']); params.undo(); params.redo()
params.replace(values, { history: false })        // load/import without an undo step
params.savePreset(name); params.applyPreset(name); params.activePreset(); params.toggleCompare()
params.toJSON({ changedOnly: true, shareable: true }); params.shareURL()
const v = useValues(params)            // React
```

Persistence (localStorage, debounced; a quota failure shows a toast once) and `#p=` URL share
are automatic. **Every write is validated against the schema** (setValue, patch, presets, saved
values, share links, the iframe bridge): `"30"` becomes `30`, out-of-range numbers clamp, values that
can't fit (a number for a colour, an unknown option) are rejected and the store keeps its value,
unknown keys are ignored — dev builds log why. A schema whose own defaults don't validate logs an
error at startup.

### Document state + one undo timeline

```ts
export const doc = createDocStore(initialDoc, { id: 'flows', version: 1 })  // graph, rows, layer tree…
doc.set((d) => ({ ...d, nodes }), { commit: false })   // mid-drag
doc.commit('Move 3 nodes')                             // pointer-up = one labelled step
const nodes = useDoc(doc, (d) => d.nodes)
export const history = createHistory([params, doc])    // ⌘Z undoes whichever changed last
<ParamActions params={params} history={history} />     // or <HistoryButtons history={history} />
<HistoryList history={history} />                      // Lightroom-style named steps, click to jump
```
Keep selection and view state OUT of the doc so undo never fights focus.

**Validate documents.** A doc that loads wrong-shaped would crash the shell on every reload. Pass
`validate: (d) => boolean` to `createDocStore`; without one, the kit checks `matchesShape(d, initial)`
(same keys and kinds as the initial doc, list items checked against keys every initial item shares).
A rejected saved doc is kept at `<key>:rejected`, never deleted. `doc.replace()` throws on an invalid
doc, so wrap imports in try/catch and toast the error; call `matchesShape(imported, current)` yourself
when importing into a store you manage. Options also take `migrate(raw, fromVersion)` and `legacyKeys`.

Saves flush on `pagehide`, a share link applies once per tab (reloading keeps later edits), and two tabs
on the same params store adopt each other's saved values.

### One item of a collection in the Inspector

```ts
const warp = createItemParams(warpSchema, 'warp')      // per item TYPE, not per item
useEffect(() => bindItem(warp, {
  read: () => layer(sel)?.params ?? null,
  write: (v) => doc.set((d) => setLayerParams(d, sel, v), { commit: false }),
  commit: (label) => doc.commit(label),
  subscribe: (fn) => doc.subscribe(fn),
}), [sel])
<Inspector params={warp} />
```

## 3. Time: the clock

```ts
export const clock = createClock({ duration: 4000, mode: 'loop' /* | 'once' | 'pingpong' */, fps: 60, idle: true })
clock.onTick((t, dt) => …)  clock.time()  clock.seek(ms)  clock.play()/pause()/toggle()/replay()/step(n)
useClockTime(clock, 15)     // throttled React readout
```
Render as a pure function of `(values, t)` so scrubbing and export work. Keep live values in
refs, never in a rAF effect's dependency array. The clock only runs while something listens (`onTick`, a playing transport) and stops in hidden
tabs; `idle: false`
stops ticks while paused too (default true for artifacts with their own life).

## 4. Surfaces — plugging the artifact in

```tsx
<CanvasSurface ref={h} params={params} clock={clock} draw={(ctx, { t, w, h, v, dt }) => …} deps={[docVersion]} />
<WebGLSurface params={params} clock={clock} setup={(gl) => program} draw={(gl, f, program) => …} />
<MountSurface ref={m} params={params} clock={clock} mount={(el, api) => { const engine = start(el, api.values()); api.params.subscribe((s) => engine.update(s.values)); return { engine, dispose: () => engine.stop() } }} />
<FrameSurface src="/proto.html" params={params} cssVars apply={(doc, v) => …} />  // same-origin: writes into the page, no edits to it
<FrameSurface src="https://other.site/x" params={params} />  // anything else: add public/studio-bridge.js to the page
```
`h.current.canvas` gives the canvas for export; `m.current.handle` the object `mount` returned.
**`api.values` is a function** — call `api.values()` for a snapshot; subscribe for changes.
`v` in `draw` is typed from the schema. Without a clock, `animate` runs its own rAF.

## 5. Layout

```tsx
<Studio layout="islands" | "overlay" | "docked"
  toolbar={<Toolbar start={…} center={…} end={…} />}
  left={<Panel header={<PanelHeader title="Layers" />}>…</Panel>}
  right={<Panel header={<PanelHeader><PanelTabs …/></PanelHeader>}><Inspector params={params} /></Panel>}
  bottom={<Timeline clock={clock} lanes={lanes} />}
  leftWidth={240} rightWidth={280}>
  <Stage>…</Stage>   or   <Stage fill>…</Stage>
</Studio>
```
- `islands`: floating cards with a gutter (artboard work). The panels float OVER the workspace: a camera
  `<Stage>` that fills the main area runs under them (grid and artboard continue), fits and zooms into the
  visible gap, and keeps its HUD (`overlay`, zoom pill) in that gap. Anything else (`<Stage fill>`, galleries,
  React Flow, nested stages) sits in the gap so nothing hides under a panel. `overlay`: the same idea for
  full-bleed art (shaders, 3D, photo), with the bottom strip centred. `docked`: flush panels, Figma UI3 (dense
  editors). The covered edges are exposed as `useSafeArea()` and `--safe-top/right/bottom/left`.
- `⌘\` hides all chrome (present mode).
- The app should also wrap each route/shell in `<ErrorBoundary resetPrefix={\`studio:\${id}\`}>` — stores
  are created at module load, before `<Studio>` exists (see src/gallery/App.tsx).
- Each region (toolbar, panels, timeline, stage) sits in an `ErrorBoundary`: a crash shows "Try
  again / Reset saved settings / Reload" in that region instead of blanking the app.
- Kit base styles (font, size, scrollbars, focus ring, colour-scheme) apply inside `.studio` (the
  Studio root) and `.pop` popups only — the kit never restyles a host app's `<body>`. Using kit
  controls outside `<Studio>`? Put `className="studio"` on their container. With no `.dark`/`.light`
  class on `<html>`, tokens follow the OS theme.
- Toolbar: `<Brand name doc mark>` (the mark links home itself — pass a plain glyph),
  `<Cluster>` groups, `<ToolDock value onChange tools>` (bottom-centre tools, place it yourself
  absolutely inside the Stage overlay), `<Button variant="primary">` for the ONE primary action.
- `<Stage>` = camera (wheel pan, ⌘wheel/pinch zoom, space-drag, Shift+0/1), `contentSize`
  ({ w, h, x?, y? } — compared by value, inline is fine) for fit, `fitMaxZoom` (default 1),
  `grid` dots, `overlay` slot for HUD, `hotkeys={false}`. `<Stage fill>` has no camera or Space.
  `<Artboard width height label x y background selected>` (defaults white; resets font features).
  `useCamera()` gives the store + `fit()` / `zoomTo()` / `touch()` / `untouch()`.
  `<ZoomPill zoom onZoom onFit />` works outside a Stage too (React Flow, custom canvases).
- `useSafeArea()` in islands and overlay layouts (zero in docked) → `{ top, right, bottom, left }` covered by panels.
- `<Panel>` (scrolls) · `<PanelHeader title>` · `<PanelTabs value onChange tabs>` · `<Empty icon title hint action compact>`.

## 6. Components

- `Inspector params folders? keys? published? id?` — schema → sections + rows (folders render in the order given).
- Hand-built panels that must match: `Section title (open+onToggle | defaultOpen persistKey) onReset changed actions collapsible`,
  `Row label hint changed onReset stacked trailing labelWidth`, `ParamRow k params` (one schema row),
  `ParamControl def value onChange` (just the control).
- Controls: `ScrubValue` (drag/type/expr number) · `Slider` · `Segmented` · `Tiles` · `Switch` ·
  `Checkbox` · `Select` · `TextInput` · `Menu` (items: item/separator/label/submenu) · `ColorField`
  / `ColorPanel` / `Swatch` · `AngleDial` · `XYPad` · `Vec3Fields` · `SizeFields` · `SeedField` ·
  `CurveEditor` / `CurveGlyph` · `SpringEditor` · `GradientEditor` · `PaletteField` · `ImageDrop` ·
  `Monitor` · `Knob` (rotary, log taper, bipolar) · `Button` (variants ghost/default/primary/outline/danger; sizes sm/md/lg/icon/icon-sm) ·
  `IconButton icon label shortcut active` · `Tip label shortcut` · `Kbd` · `Badge tone` · `Divider`.
- `Timeline clock lanes hotkeys?` — read-only beat view + transport (loop / ping-pong / once). Lanes: `{ id, label, start, end }` bars, `{ kind: 'keys', keys: [{ t, value, selected }] }`,
  `{ kind: 'markers', keys }`; `depth` indents. Derive lanes from the render maths.
- `LayerTree items selected onSelect onToggle onMove onRename toggles defaultCollapsed expanded onHover` +
  `updateTree` / `moveInTree` / `findInTree`. Items: `container` (droppable when empty), `toggles`, `meta`, `thumb`.
- `ParamActions params history? presets compare theme share` (each part switchable; `compare={{ hotkey: false }}`) · `HistoryButtons` · `PresetMenu` ·
  `CompareButton` · `ThemeToggle` · `shareMenuItems(params)` (link, JSON, **copy as agent prompt**).
- `CommandPalette commands extraShortcuts` — ⌘K palette + `?` sheet; commands with `shortcut` are bound.
- `toast(title, opts)` works anywhere (it mounts a single toaster if none is rendered) and returns an id · `toast.update(id, title, opts)` · `toast.dismiss(id)` ·
  `toast.promise(p, { loading, success, error })` · `toast.progress(title, { onCancel })` → `{ set(p), done(msg), fail(msg) }`.
- IO: `renderCanvasPNG(draw, { width, height, v, t, scale })` (re-renders your CanvasSurface `draw` off-screen at scale — use this for 2× / 4× exports) · `exportCanvasPNG(canvas, name, scale, { smoothing })` (upscales what's on screen — pixel art, WebGL) · `exportSVG(svg | string)` · `exportJSON(data)` ·
  `recordFrames({ canvas, draw(t, i), frames, fps, name, onProgress, signal })` (frame-accurate MP4/WebM, WebCodecs) ·
  `recordCanvas(canvas, ms)` (quick real-time fallback) · `createZip()` (STORE zip: `add(name, bytes)`, `await addBlob(name, blob)`, `toBlob()`) ·
  `snapshotElement(el, { width, height, scale, background, filter, hide })` (DOM → canvas) · `download` · `copyText` · `readFileAsDataURL`.
- Hotkeys: `useHotkeys({ 'mod+e': fn, t: { run, label: 'Text tool', group: 'Tools' } }, deps, { priority })`.
  One dispatcher; shell bindings (priority 10) beat kit defaults (0); labelled bindings appear in the
  `?` sheet automatically; dev warns on duplicates. `useHoldKey('\\', (down) => …)` for hold-to-peek.
  Space/Enter on a focused button go to the button. A bare `space` binding (play / pause) fires on
  release and only if the pointer wasn't pressed meanwhile, so Space+drag pans without toggling playback.
  A focused number field or slider owns digits, Backspace, Delete and arrows; typing a digit into a focused
  ScrubValue starts editing with it (Figma).

Specialist components (knob, layers, key/track timelines, data grid, curves, effect stack, …): `references/kit-components.md`.
