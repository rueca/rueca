<!-- Copied from docs/KIT.md by `npm run sync`. Edit the source, not this file. -->

> In a project that installed the kit from the registry, `@kit` means `@/components/studio` (or alias it). Live examples of every shell: https://rueca.dev/ · source: https://github.com/rueca/rueca/tree/main/src/shells

# Rueca kit — guide

The kit is the **harness**: the design-tool chrome around a prototype. The prototype (the
*artifact*) can be anything — Canvas 2D, WebGL, vanilla three.js, SVG, DOM/React, an iframe.
Import everything from `@kit`. A complete worked example: the Motion study shell
([live](https://rueca.dev/#/motion) · [source](https://github.com/rueca/rueca/tree/main/src/shells/motion)).

## 1. Rules that keep it looking pro

- **Never hardcode a colour in chrome.** Use the tokens (Tailwind utilities below). The only
  legal home for a hex value is the artifact (inside the artboard / canvas) and `theme.css`.
- **Neutral chrome, brand inside the artboard.** Artboard text uses `font-artboard`.
- **Sentence case**, never uppercase micro-caps. Section titles 11px at weight 550 (`text-ui font-[550]`);
  panel titles 12px at 600 (`text-title font-semibold`).
- **One text size, hierarchy by weight and ink.** All UI text is `text-ui` (11px); labels are
  `text-fg-faint` at weight 450, untouched values `text-fg-value`, changed values `text-fg` plus the
  changed dot. Labels stay dimmer than values. Live numbers always `tabular`.
- **Blue (`signal`) only for focus, selection and the primary action.** A switch that's on, a ticked box
  and slider / knob fills are neutral ink (`bg-ink`, `bg-fill`, `var(--fill)`), never blue. Accent-coloured
  text uses `text-signal-text`. The playhead is `bg-rec` (red/orange), never the accent.
- **Radius + shadow, not borders.** Islands use the `panel` utility (94% opaque so the work shows faintly
  through, no backdrop blur, a hairline and a tight shadow; solid under `prefers-reduced-transparency`); toolbar groups `cluster`; popovers `pop`. A
  boundary inside a panel is `border-line` (6–8%), never a solid grey rule.
- **Icons**: lucide-react. 14px at stroke 1.5 for toolbar and row icons; 12–13px (stroke 1.5–1.75)
  inside controls (chevrons, steppers, close ×); 16px in the tool dock. Never larger in chrome.
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
Text: `text-fg` · `text-fg-value` (untouched values) · `text-fg-muted` · `text-fg-faint` (row labels).
Lines: `border-line` · `border-line-strong`. Neutral ink for ON states that aren't selection: `bg-ink` /
`text-ink-fg` (a switch that's on, a ticked box) · `bg-fill` (a slider's fill).
Semantic text on its own wash (badges): `text-key-text` · `text-rec-text` · `text-ok-text` (≥4.5:1 in both themes).
Accent, for focus, selection and the primary action only: `bg-signal` · `bg-signal-strong` (surfaces
carrying text) · `text-signal-fg` · `bg-signal-soft` (selection wash) · `text-signal-text` (accent-coloured
text, ≥4.5:1 on the panel, a field and the selection wash). Semantic: `key` (keyframed, amber) · `rec` (playhead/record/
error) · `ok`. Lanes: `bg-lane`. Utilities: `panel` `cluster` `pop` `tabular` `no-select`
`checker`. Categorical (identity, never state): `cat-1`…`cat-8` (ports, lanes, tags). Over
images: `bg-scrim`. In islands and overlay layouts, `--safe-top/right/bottom/left` (what the panels cover).

### Density (sizes)
Every chrome size is a token, so `data-density` on `<html>` retunes the kit: default (tactical),
`"comfortable"` (the roomier pre-Oct-2026 sizes) and `"compact"`; `.studio-touch` overrides the same
variables for phones. Use the names, never literals, so a part follows the density:

| Utility | Default / comfortable / compact | For |
|---|---|---|
| `h-row` `min-h-row` (`--row`) | 24 / 28 / 22 | inspector rows, layer rows |
| `h-control` · `h-control-sm` | 22 / 24 / 20 · 20 / 20 / 18 | fields, selects, sliders, scrub, segmented |
| `size-icon` `h-icon` · `size-icon-sm` | 24 / 28 / 22 · 20 / 24 / 18 | icon buttons, md buttons, menu items, tabs |
| `h-button-lg` | 28 / 32 / 26 | large buttons, the zoom cluster |
| `h-section` · `h-header` · `h-bar` | 26 · 32 · 32 / 32 · 40 · 36 / 24 · 28 · 30 | section headers · panel headers, transport · toolbar clusters |
| `h-dock` · `size-dock-button` | 36 · 28 / 40 · 32 / 34 · 26 | the bottom tool dock |
| `px-pad` · `w-label` | 10 · 72 / 12 · 84 / 8 · 72 | row side padding · the label column's minimum |
| `h-lane` · `h-ruler` | 20 · 24 / 24 · 28 / 18 · 22 | timeline lanes and ruler |
| `p-gutter` `gap-gutter` (`--gutter`) | 8 / 12 / 6 | window edge and the gap between islands |
| `--inspector-w` · `--sidebar-w` | 256 · 224 / 280 · 240 / 240 · 208 | `<Studio>`'s right and left panels (unless `rightWidth` / `leftWidth` pin one) |
| `text-ui` · `text-ui-sm` · `text-title` | 11 · 10 · 12 px (comfortable 11.5 · 10.5 · 12.5); line height 16 | all UI text · rulers, hints · panel titles, Brand |
| `rounded-panel` `rounded-cluster` `rounded-pop` `rounded-control` | 8 · 6 · 8 · 4 / 12 · 10 · 10 · 6 / 6 · 5 · 6 · 3 | panels · toolbar clusters · menus and popovers · controls |

Hierarchy is weight, not half-pixel sizes: labels 450, section titles 550, panel titles 600. In JS (timelines,
canvas rows) read a token with `useDensityPx('--d-lane', 20)` (the fallback is the default density's value);
it reads from the kit's root, so it works in a registry install too, and re-reads when the density changes.
`densityPx(name, fallback)` is the one-off read.

People choose a density in ⌘K (View → Density: Default / Comfortable / Compact) and in the Density submenu of
`ParamActions`' "…" (More actions) menu, beside the theme item. The ⌘K commands need a `<CommandPalette>` in the tool, which adds the
View commands itself (`<CommandPalette commands={[]} />` is enough). The choice is remembered per browser
(`localStorage` `studio:density`) and `<Studio>` restores it on mount (`restoreDensity()`), unless something
already set the attribute. In code: `setDensity('compact')`, `useDensity()`, `currentDensity()`.

**The label column.** It fits the longest visible label (from 72px up to 42% of the row). Every `<Row>` with a
text label reports to the nearest `<LabelScope>`; `<Panel>` is one, so hand-built rows and any `<Inspector>`s
in a panel share one column, and an `<Inspector>` outside a panel is its own. Hidden rows (a `when` that's
false) don't count. A `labelWidth` opts a `Row` out of the shared column. `w-label` on its own is only the 72px
minimum, so build label + control rows with `<Row>`, not a hand-made `w-label` span. For a custom scope:
`<LabelScope>`, `useLabelScope()`, `useReportLabel(text)`, `measureLabel(text, size)`.

**Keyboard and wheel steps.** `useSettle(value, onChange)` makes a burst of arrow-key or wheel steps one undo
step, like a drag: `settle.step(next)` sends it live and commits 500ms after the burst (or on `settle.flush()`
at blur).

**Font.** Inter 4 (rsms's files, from the `inter-ui` npm package) with `cv05` / `cv08`, so I, l and 1 never
collide; values use `tabular-nums`.

Token names are namespaced so they never collide with shadcn (`muted`, `accent`, `input` mean
something else there): ours are `fg-muted`, `signal`, `control`; font is `font-ui`.
Merge classes in chrome with the kit's `cn` (exported from `@kit`): it knows the density names, where a plain
tailwind-merge `cn` (shadcn's `@/lib/utils`) treats `text-ui` as a colour and drops it next to `text-fg`.

## 2. State: schema → params store

```ts
import { defineSchema, folder, p, createParams, createClock } from '@kit'

// Top level is always folders. Keys are FLAT across folders (values are one object): a duplicate throws at
// load, and a helper that builds several folders must prefix its keys (bandDelay, wheelDelay — not delay twice).
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
  vignette: folder('Vignette', {                                   // an optional feature: its switch sits in the header,
    vignette: p.boolean(false),                                     // and while it's off the section stays one closed line
    amount:   p.number(0.4, { min: 0, max: 1 }),
    feather:  p.number(0.5, { min: 0, max: 1, more: true }),        // a detail: waits under "1 more" until opened or changed
  }, { toggle: 'vignette' }),
  view: folder('View', { grid: p.boolean(true), snap: p.boolean(true) }, { place: 'settings' }),  // → <SettingsMenu>, not the inspector
  output: folder('Output', { … }, { collapsed: true }),
})
```

Folders take `collapsed`, `hint`, `when` (hide the whole section), `toggle: '<boolean key in the folder>'`
(an optional feature's on/off in the header) and `place: 'settings'` (view and document preferences: grid, snap,
fps, units — they render in `<SettingsMenu>` in the toolbar, not in the inspector).

Every def accepts `label`, `hint`, `when: (v) => boolean` (conditional row), `disabled`,
`more: true` (a detail of its section: kept under the section's "N more" row; a changed value always stays in view),
`live: false` (marks it expensive — the kit doesn't hold it back; do the heavy work in `params.onCommit`), `publish: true` (shows in the client view),
`persist: false` (keep out of localStorage), `share: false` (keep out of links/JSON).
Keys are **flat across folders** (`v.count`).

Number `step` defaults from the range when omitted (0–1 → 0.01, 0–10 → 0.1, ≥100 wide → 1).

More defs: `p.data<Layer[]>([], { validate })` — a hidden, typed document value (a layer stack, clips, pattern
steps): undoable and persisted, never rendered as a row. `p.image()` defaults to persist/share
off (a photo would blow the storage quota). Numbers take `scale: 'log'`, `soft: [lo, hi]` (drag
range; typing can exceed it), `parse` (typed text → number, e.g. percent), `display: 'knob'`,
and `detents` (named stops, e.g. an elevation ladder `[{ value: -3, label: 'Inset' }, …,
{ value: 40, label: 'Modal' }]`: drawn as a track with the stops evenly spaced and named, snapping
near each one; `snap: 'only'` allows the stops alone; min / max come from the ends).

```ts
export const params = createParams(schema, {
  id: 'my-tool', version: 2,                          // bump when the schema's shape changes…
  migrate: (old, from) => from === 1 ? { ...old, band: old.weight } : old, // …and keep users' saved values + old links
  presets: [{ name: 'Calm', values: { … } }],          // merge by default: only the listed keys change
  presetKeys: ['palette', 'grain'],                    // what "Save preset" captures (default: all shareable, not data)
  // persist: false — no localStorage for values; historyLimit: 100 — undo depth (oldest steps drop silently)
})
params.values()                       // current values (non-reactive)
params.subscribe((s) => …)            // every change, incl. mid-drag (zustand)
params.onCommit((v, meta) => …)       // pointer-up only; meta = { label, kind: edit|undo|redo|replace }
params.setValue('count', 3, { label: 'Count' })   // commits one labelled undo step; { commit: false } mid-drag
params.patch({ … }); params.reset(['count']); params.undo(); params.redo()
params.replace(values, { history: false })        // load/import without an undo step
params.savePreset(name); params.applyPreset(name); params.activePreset(); params.toggleCompare()
// A/B side by side (motion, looks): the other slot is state.compare — render the artifact twice
//   const b = useParamState(params, (s) => s.compare)
//   b ? <CompareSplit layout="side" before={<Art v={b} />} after={<Art v={v} />} /> : <Art v={v} />
params.toJSON({ changedOnly: true, shareable: true }); params.shareURL()
const v = useValues(params)            // React
```

Persistence (localStorage key `studio:<id>:values:v<version>`, debounced; a quota failure shows a toast once) and
`#p=` URL share (base64 JSON stamped with `$v`) are automatic. Renamed or rescaled a param? Bump `version`; without
`migrate` every visitor starts from the defaults and links made before the bump are ignored with a notice, with
`migrate` both are carried forward. A link's values are saved only after the page has drawn a few healthy frames,
so a hostile link that hangs the artwork can't stick. **Every write is validated against the schema** (setValue, patch, presets, saved
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
when importing into a store you manage. Options also take `migrate(raw, fromVersion)` and `legacyKeys`. Bumping `version` starts every visitor
from the new `initial` (the old doc stays under its old key, untouched); pass `migrate` to carry saved work into the new version.

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
// cssVars={{ keys: ['accent', 'headlineSize'], suffix: { headlineSize: 'px' }, unitless: ['lineHeight'] }} — only those, with units
// start from the page's own values: apply={(doc) => …} runs on load — or once: params.replace(readCssVars(doc, ['accent', 'headlineSize']), { history: false })
// const [interact, setInteract] = useInteractMode()  →  <FrameSurface … shield={!interact} /> + <InteractToggle interact={interact} onChange={setInteract} /> in the toolbar
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
  leftWidth={…} rightWidth={…}>        // optional: default to --sidebar-w / --inspector-w, so leave them unset unless a panel needs more
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
  are created at module load, before `<Studio>` exists.
- Each region (toolbar, panels, timeline, stage) sits in an `ErrorBoundary`: a crash shows "Try
  again / Reset saved settings / Reload" in that region instead of blanking the app.
- Kit base styles (font, size, scrollbars, focus ring, colour-scheme) apply inside `.studio` (the
  Studio root) and `.pop` popups only — the kit never restyles a host app's `<body>`. Using kit
  controls outside `<Studio>`? Put `className="studio"` on their container. With no `.dark`/`.light`
  class on `<html>`, tokens follow the OS theme.
- Overriding a token (the accent, a density size) from the app's own CSS: a registry install declares the tokens
  on the kit's roots, not on `:root`, so target both, after the theme import:
  `:root:root, :root:root :where(.studio, .pop, [data-studio]) { --gutter: 10px; }`.
- Toolbar: `<Brand name doc? mark? href? menu?>`: the mark is a button with the tool name as its tooltip, opening
  a menu ("All tools" → `href`, then `menu` items); pass a plain glyph as `mark`. Pass `doc` only for live state
  (the open file, an editable title, the active look), never a fixed caption.
  A host that runs many tools sets one mark for all of them with `<BrandOverride mark={…} tile?>` (drawn bare,
  in ink, unless `tile`); the menu's first item is the tool name as a `{ type: 'title' }` row.
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
  It renders `more` rows behind a `MoreRow` ("3 more" / "Fewer"), a folder's `toggle` as a header switch, and skips
  `place: 'settings'` folders unless `folders` names them. The header's changed dot counts only rows in effect
  (not ones `when` or an off toggle hides). `layoutFolder(folder, values, defaults)` is the same logic, pure.
- `SettingsMenu params folders? label? icon?` — the toolbar home for `place: 'settings'` folders: one button, a
  popover inspector, and the changed dot on the button when a setting is off its default.
- `ClientView params title? subtitle? actions? onDownload? onExit?` + `useClientMode({ narrow?, hotkey? })` →
  `{ client, forced, setClient }` + `clientLink(params)` — the client's phone view: art full-bleed above (beside, on
  wide/landscape screens) a sheet of `publish: true` knobs at touch size (48px rows, 16px inputs so iOS doesn't zoom,
  thumb-only sliders, 44px reach), undo/redo, Download, "Send to designer" (share sheet on touch, else copy). On a phone
  or from a `&client` link it is forced (no way into the designer view). Marks `<html data-studio-client>` while shown.
- Hand-built panels that must match: `Section title (open+onToggle | defaultOpen persistKey) onReset changed actions collapsible`,
  `Row label hint changed onReset stacked trailing labelWidth param` (`param` = the key it edits, set as `data-param`
  so comments can anchor to it; `labelWidth` opts the row out of the panel's shared label column), `ParamRow k params` (one schema row),
  `ParamControl def value onChange` (just the control).
- Controls: `ScrubValue` (drag/type/expr number) · `Slider` · `DetentSlider` (named magnetic stops) · `Segmented` · `Tiles` · `Switch` ·
  `Checkbox` · `Select` · `TextInput` · `Menu` (items: item/separator/label/submenu) · `ColorField`
  / `ColorPanel` / `Swatch` · `AngleDial` · `XYPad` · `Vec3Fields` (`lockable` = uniform scale lock, `unit`, `defaultValue`) · `SizeFields` · `SeedField` ·
  `CurveEditor` / `CurveGlyph` · `SpringEditor` · `GradientEditor` · `PaletteField` · `ImageDrop` ·
  `Monitor` · `Knob` (rotary, log taper, bipolar) · `Button` (variants ghost/default/primary/outline/danger; sizes sm/md/lg/icon/icon-sm) ·
  `IconButton icon label shortcut active` · `Tip label shortcut` · `Kbd` · `Badge tone` · `Divider`.
- `Timeline clock lanes hotkeys?` — read-only beat view + transport (loop / ping-pong / once). Lanes: `{ id, label, start, end }` bars, `{ kind: 'keys', keys: [{ t, value, selected }] }`,
  `{ kind: 'markers', keys }`; `depth` indents. Derive lanes from the render maths.
- `LayerTree items selected onSelect onToggle onMove onRename toggles defaultCollapsed expanded onHover` +
  `updateTree` / `moveInTree` / `findInTree`. Items: `container` (droppable when empty), `toggles`, `meta`, `thumb`.
- `ParamActions params history? clock? doc? presets compare agent theme share inline?` (each part switchable; `compare={{ hotkey: false }}`).
  At rest: undo, redo, presets, and Send to agent while the notes route is up. A/B shows only while an A is stored;
  compare, theme and the share and copy actions sit in one "…" menu, hotkeys (\, T) still live. `inline` = every
  action as its own icon. `shareMenuItems` drops "Copy link" for a store with `url: false` (`params.linkable`) · `HistoryButtons` · `PresetMenu` ·
  `CompareButton` · `ThemeToggle` · `SendToAgentButton params history? clock? doc?` · `shareMenuItems(params)` (link, JSON, **copy as agent prompt**).
- Notes to the agent: **Send to agent** writes a note to `.rueca/notes/<id>.json` through the dev server, and renders nothing
  until the route answers (so it never shows on a static build). Route: `ruecaNotes()` from `rueca/notes-server/vite` (installed at the project root) in `vite.config.ts`, or
  `createNotesHandler({ dir?, allowedHosts? })` from `rueca/notes-server/handler` for any Node server (before any body parser). Add `.rueca/` to `.gitignore`.
  Core, framework-agnostic: `captureSnapshot({ params, history?, clock?, doc? })` → `{ tool, schema, url, changed: { key: { value, default, label, hint } }, steps, t, doc, view }` ·
  `sendNote({ kind: 'values' | 'comment', text?, anchor?, snapshot, image? })` · `listNotes()` · `deleteNote(id)` ·
  `replyToNote(id, text)` (joins the thread, hands it back to the agent, reopens a done one) · `setNoteStatus(id, 'open' | 'done')` ·
  `noteMessages(note)` (the whole thread, first comment included) · `noteTurn(note)` → `'agent' | 'person' | null` (null once done) · `findNotesEndpoint()` · `formatNotePrompt(note)` (the clipboard version) ·
  `watchNotes(fn)` (one shared poll; returns unsubscribe) · `refreshNotes()` · `captureImage(artboardEl, { anchor? })` (JPEG data URL: DOM plus canvases, anchor ringed) ·
  `restoreSnapshot(snapshot, { params, clock? })` (one undo step, the playhead paused at `t`; refuses another schema version) ·
  `snapshotStatus(snapshot, params)` → `'same' | 'different' | 'other-version'` · `isSnapshotState(snapshot, params)` · `normalizeNote(raw)` (a note file as the tool can safely show it, or null).
- Comments: `<NoteLayer params history? clock? doc? describeAt? />` inside an `<Artboard>` — comment mode (`C`, or `CommentButton`, which `ParamActions`
  includes) pins a comment to an artboard point, to a spot on the stage around it (`on: 'canvas'`, artboard units outside 0–1;
  the Stage carries `data-studio-stage`), or to a knob by clicking its Inspector row (rows carry `data-param`). The clock pauses while you write.
  `CommentsList params` (also in `ParamActions`, beside Comment) lists every comment, yours-to-answer first, with a Done tab, so one on a collapsed knob is never lost.
  A comment is a thread (`replies`, `{ from: 'agent' | 'person', text, at }`): the card has a reply box, and only the person closes it (Done).
  Pins say whose turn it is: hollow while the agent's, blue for an unread reply (read state is per browser), ink once read; done ones leave the board
  unless "Show done on the board" is on. Pins fade when the tool is in another state, and their thread can restore it.
  Replies arrive live (`useNotes()`) with a toast. Pins keep screen size via `useZoom()`.
- `CommandPalette commands extraShortcuts` — ⌘K palette + `?` sheet; commands with `shortcut` are bound. It adds the
  View → Density commands itself, so every tool should render one (`commands={[]}` is fine).
- `toast(title, opts)` works anywhere (it mounts a single toaster if none is rendered) and returns an id · `toast.update(id, title, opts)` · `toast.dismiss(id)` ·
  `toast.promise(p, { loading, success, error })` · `toast.progress(title, { onCancel })` → `{ set(p), done(msg), fail(msg) }`.
- Colour maths: `luminance(hex)`, `contrastRatio(a, b)` (WCAG 2.x), `wcagGrade(ratio)` → 'AAA' | 'AA' | 'AA large' | 'Fail', `readableOn(hex)` (darken until white text passes).
- `revealInScroller(el)` — keep a selection visible by scrolling only its nearest scroll box (never `scrollIntoView`: it scrolls the host page too when the tool is embedded).
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
