<!-- Copied from docs/KIT.md by `npm run sync`. Edit the source, not this file. -->

> In a project that installed the kit from the registry, `@kit` means `@/components/studio` (or alias it). Live examples of every shell: https://OWNER.github.io/prototype-studio/ · source: https://github.com/OWNER/prototype-studio/tree/main/src/shells

# Prototype Studio kit — guide

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
- **Icons**: lucide-react, 14px, strokeWidth 1.5 in chrome (16 in the tool dock).
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
`checker`. CSS vars: `--row` (28px lane), `--gutter`, `--inspector-w`.

## 2. State: schema → params store

```ts
import { defineSchema, folder, p, createParams, createClock } from '@kit'

export const schema = defineSchema({
  shape: folder('Shape', {
    count:  p.number(12, { min: 1, max: 64, step: 1, hint: 'One sentence. This IS the docs.' }),
    radius: p.number(80, { min: 0, max: 400, unit: 'px' }),
    mode:   p.select('grid', ['grid', 'radial', 'spiral']),        // ≤4 short → segmented, else dropdown
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
`live: false` (expensive — apply on commit). Keys are **flat across folders** (`v.count`).

```ts
export const params = createParams(schema, { id: 'my-tool', presets: [{ name: 'Calm', values: { … } }] })
params.values()                       // current values (non-reactive)
params.subscribe(() => …)             // every change, incl. mid-drag (zustand)
params.onCommit((v) => …)             // pointer-up only — do expensive work here
params.setValue('count', 3)           // commits (undo step); { commit: false } while dragging
params.patch({ … }); params.reset(['count']); params.undo(); params.redo()
params.savePreset(name); params.applyPreset(name); params.toggleCompare()   // A/B
params.toJSON({ changedOnly: true }); params.shareURL()
const v = useValues(params)            // React
```

Persistence (localStorage) and `#p=` URL share are automatic.

## 3. Time: the clock

```ts
export const clock = createClock({ duration: 4000, loop: true, fps: 60 })
clock.onTick((t, dt) => …)  clock.time()  clock.seek(ms)  clock.play()/pause()/toggle()/replay()/step(n)
useClockTime(clock, 15)     // throttled React readout
```
Render as a pure function of `(values, t)` so scrubbing and export work. Keep live values in
refs, never in a rAF effect's dependency array.

## 4. Surfaces — plugging the artifact in

```tsx
<CanvasSurface ref={h} params={params} clock={clock} draw={(ctx, { t, w, h, v, dt }) => …} />
<MountSurface params={params} clock={clock} mount={(el, { values, params, clock }) => { /* vanilla three.js etc */ return cleanup }} />
<FrameSurface src="/proto.html" params={params} />   // postMessage bridge { type: 'studio:params', values }
```
`h.current.canvas` gives the canvas for export.

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
- `islands`: floating cards with gutter (artboard work). `overlay`: stage full-bleed under
  floating panels (shaders, 3D, photo). `docked`: flush panels, Figma UI3 (dense editors).
- `⌘\` hides all chrome (present mode).
- Toolbar: `<Brand name doc mark>` (make `mark` an `<a href="#/">` back to the gallery),
  `<Cluster>` groups, `<ToolDock value onChange tools>` (bottom-centre tools, place it yourself
  absolutely inside the Stage overlay), `<Button variant="primary">` for the ONE primary action.
- `<Stage>` = camera (wheel pan, ⌘wheel/pinch zoom, space-drag, Shift+0/1), `contentSize`
  for fit, `grid` dots, `overlay` slot for HUD. `<Artboard width height label x y background selected>`.
  `useCamera()` inside the stage gives `{ x, y, zoom }` store + `fit()` / `zoomTo()`.
- `<Panel>` (scrolls) · `<PanelHeader title>` · `<PanelTabs value onChange tabs>` · `<Empty icon title hint action>`.

## 6. Components

- `Inspector params folders?` — whole schema → sections + rows.
- `Section title open onToggle onReset changed actions` and `Row label hint changed onReset stacked trailing`
  — for hand-built panels that must match schema rows.
- Controls: `ScrubValue` (drag/type/expr number) · `Slider` · `Segmented` · `Tiles` · `Switch` ·
  `Checkbox` · `Select` · `TextInput` · `Menu` (items: item/separator/label/submenu) · `ColorField`
  / `ColorPanel` / `Swatch` · `AngleDial` · `XYPad` · `Vec3Fields` · `SizeFields` · `SeedField` ·
  `CurveEditor` / `CurveGlyph` · `SpringEditor` · `GradientEditor` · `PaletteField` · `ImageDrop` ·
  `Monitor` · `Button` (variants ghost/default/primary/outline/danger; sizes sm/md/lg/icon/icon-sm) ·
  `IconButton icon label shortcut active` · `Tip label shortcut` · `Kbd` · `Badge tone` · `Divider`.
- `Timeline clock lanes` — lanes: `{ id, label, start, end }` bars, `{ kind: 'keys', keys: [{ t, value, selected }] }`,
  `{ kind: 'markers', keys }`; `depth` indents. Derive lanes from the render maths.
- `LayerTree items selected onSelect onToggle onMove onRename` + `updateTree` / `moveInTree` / `findInTree`.
- `ParamActions params` (undo/redo, A/B, presets, share, theme) · `HistoryButtons` · `PresetMenu` ·
  `CompareButton` · `ThemeToggle` · `shareMenuItems(params)` (link, JSON, **copy as agent prompt**).
- `CommandPalette commands extraShortcuts` — ⌘K palette + `?` sheet; commands with `shortcut` are bound.
- `toast(title, { type: 'success'|'error'|'loading', description, action })`.
- IO: `exportCanvasPNG(canvas, name, scale)` · `exportSVG(svg)` · `exportJSON(data)` ·
  `recordCanvas(canvas, ms, fps)` · `download(blob, name)` · `copyText` · `readFileAsDataURL`.
- Hotkeys: `useHotkeys({ 'mod+e': fn, 'shift+/': fn })`, `prettyCombo`.

## 7. Conventions borrowed from Spline · Paper · Figma · Framer · Affinity · Rive

See `research/04-six-tool-matrix.md` (control-by-control defaults) and
`research/02-pro-tool-patterns.md` (inspector, timeline, layers, canvas, shortcuts). Highlights:
Space play · `,` `.` frame step · J/K prev/next key · Shift+0/1 zoom · `\` A/B · ⌘K palette ·
`?` shortcuts · ⌘\ hide UI · keyframe diamond: hollow faint → hollow accent → solid accent ·
springs default Duration + Bounce · fills/effects as stacks with eye + blend + opacity ·
Affinity-style selection-aware context bar · Rive Trigger/Boolean/Number inputs.
