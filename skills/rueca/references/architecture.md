# Architecture

The harness is framework-agnostic at its core: a **param store** (what the knobs are
set to) and a **clock** (what time it is). The artifact can be anything; React is only
the harness. The kit implements all of this — `kit-api.md` has the calls. If you are
hand-building, reproduce the same shape.

## One schema drives everything

```ts
export const schema = defineSchema({
  geometry: folder('Geometry', {
    void:  p.number(102, { min: 0, max: 190, unit: 'px', hint: 'Inner radius kept clear for the headline.' }),
    count: p.number(12,  { min: 1, max: 64, step: 1, hint: 'How many rings.' }),
    mode:  p.select('radial', ['grid', 'radial', 'spiral']),
  }),
})
```

Inspector rows, defaults, per-section reset, the changed-from-default cue, presets,
undo, A/B compare, persistence, the share link and the JSON / agent-prompt export all
generate from it. **Adding a knob is one line and nothing else.**

- Give every param a `hint`. Six months later nobody remembers what "Perspective"
  meant; the tooltip *is* the documentation.
- Keys are flat across folders (`v.count`, not `v.geometry.count`).
- Expensive params: mark them `live: false` (a marker for readers and tools) and do the
  expensive work in `params.onCommit((v) => …)`, which fires on pointer-up, not mid-drag.
  Surfaces still redraw on every change; keep `draw` cheap and rebuild heavy things on commit.
- Mark client-facing params `publish: true` — they appear in the present/client view.
- Use `when: (v) => …` for conditional rows instead of hand-hiding controls.
- Soft range for scrubbing, hard range for typing (Blender): `min/max` is what the
  slider shows; typed values may exceed it unless clamped.

## Document state: where non-knob data lives

Tools hold more than knobs: a layer stack, clips, rows of data, a node graph, a flow.
Pick by shape, not habit:

| Data | Put it in | Why |
|---|---|---|
| A small list the knobs describe (a shader's layer stack, a synth pattern) | `p.data<T>()` in the schema | One store: undo, presets (via `presetKeys`), A/B and share links come free |
| A real document the user edits directly (graph, flow, rows, layer tree, clips) | `createDocStore(initial, { id, version })` | Labelled steps, versioned persistence, kept apart from tuning values |
| Selection, hover, camera, open panels | plain React / a tiny zustand store | Never undoable — undo must not fight focus |

With params **and** a doc, join them: `const history = createHistory([params, doc])`, then
`<ParamActions params={params} history={history} />`. ⌘Z undoes whichever changed last.
Label steps (`doc.commit('Move 3 nodes')`, `params.setValue(k, v, { label })`) so
`<HistoryList>` reads like Lightroom's history.

To edit **one item** of a collection in the Inspector (the selected layer, node or fill),
make one `createItemParams(schema, id)` per item *type* and `bindItem` it to the selection.
Drags write through uncommitted; release is one step on the owner.

Presets **merge** by default — only the keys a preset names change. Set `presetKeys` so
"Save preset" captures the look and not the canvas size or the document. Bump `version`
when a schema's shape changes so stale saved values are ignored. Images never go in
params (`p.image()` is persist/share-off; use `useImageIntake` for files).

## Keep the render pure, drive it with refs

Split into a pure `draw(ctx, values, t) → derived` and a thin shell. Pure means you can
call it at any timestamp and measure the result — that is how you verify motion, and
how scrubbing, slow-mo and frame-accurate export work for free.

**The one that will bite you:** never put live values in the rAF effect's dep array.

```tsx
// WRONG — every slider drag tears down the loop, re-inits the canvas, and
// re-runs scrollTop = 0, snapping the artifact back mid-drag
useEffect(() => { /* rAF loop */ }, [params, mode])

// RIGHT — mount once, read live values from a ref (or params.values())
const live = useRef({ params, mode }); live.current = { params, mode }
useEffect(() => { /* loop reads live.current */ }, [])
```

- Keep the playhead (`{ t, rate, offset, t0 }`) outside React state so ticking never
  re-renders. Throttle any React time readout to ~15fps.
- Do expensive work (re-meshing, re-baking, network) in `onCommit`, not `subscribe`.
- Pause heavy previews during camera pan/zoom; resume on idle.

## Time

- Render as a function of `t`, not of "frames since mount". Then `seek(ms)`, `step(n)`,
  loop, ping-pong, slow-mo (`S`) and export are trivial.
- **Mode switches should replay.** When a control only shows its effect during the
  intro, reset the playhead on change, or the user clicks an option and sees nothing.
- Seamless loops: make the maths periodic in the loop duration, not faded at the seam.

## Surfaces — plugging in any artifact

The contract is three things: a DOM element to own, the params, the clock.

| Artifact | Surface |
|---|---|
| Canvas 2D | `CanvasSurface draw={(ctx, { t, w, h, v }) => …}` — DPR, resize, `deps` for non-param inputs |
| Raw WebGL2 | `WebGLSurface setup={(gl) => state} draw={(gl, f, state) => …}` — `size` for adaptive resolution |
| vanilla three.js / p5 / anything imperative | `MountSurface mount={(el, api) => ({ engine, dispose })}` — the ref exposes `handle` |
| React / DOM / SVG, still | render directly inside `<Artboard>` using `useValues(params)`: it re-renders only when a knob changes |
| React / DOM / SVG, moving | the same structure from `useValues`, moved by the clock through refs: `useEffect(() => clock.onTick((t) => frame(ref.current, params.values(), t)), [])` with a pure `frame(el, v, t)`. Never re-render React per frame; `useClockTime` is for readouts |
| An existing page, another framework, a built app | `FrameSurface src=…`: same origin → `cssVars` / `apply`, no edits to the page; another origin → `studio-bridge.js` in the page (`install.md` §B) |

A separate harness app on its own port is another origin, so `cssVars` and `apply` can't reach the
page. Serve the page through the harness (a proxy, `install.md` §B) to keep the page unedited.

The bridge protocol (postMessage):
`parent → frame { type: 'studio:params', values }` ·
`frame → parent { type: 'studio:ready' } | { type: 'studio:set', key, value }`.
Inside the page: `studio.on(v => …)`, or `studio.cssVars()` to mirror every value to a
CSS custom property (`fontSize` → `--font-size`).

Iframes swallow wheel and pointer events, so a canvas camera can't pan over an iframe
artboard. Pattern: **Hand vs Interact** mode with a transparent shield (Figma's
design vs prototype) — built in: `const [interact, setInteract] = useInteractMode()`,
`<FrameSurface … shield={!interact} />`, `<InteractToggle interact={interact} onChange={setInteract} />`.

## Hand-off features that carry their weight

- **Copy values as JSON** — how a designer hands numbers to an engineer.
- **Copy as agent prompt** — the changed values plus their hints, phrased so another
  agent can apply them.
- **Share link** — state in the URL hash (`#p=`).
- **Send to agent** (dev only) — writes the changed values, the share link and the history
  to `.rueca/notes/`, so the agent makes them the new defaults without anyone retyping them.
  `ruecaNotes()` in `vite.config.ts`; `notes.md` has the setup and how to act on a note.
- **Presets** with A/B compare (`\`).
- **Export** — PNG at 1×/2×/4×, SVG when the artifact is vector, WebM/MP4 for motion
  (mediabunny, `recordFrames`), JSON for settings. Batch multi-size when the tool makes assets.
  For Canvas 2D, re-render instead of upscaling: `renderCanvasPNG(draw, { width, height, v: params.values(),
  t: clock.time(), scale: 2 })` reuses the surface's `draw`, so the 2× file is sharp. Don't hand-roll toBlob.

## Keyboard (defaults)

`Space` play · `⏎` replay · `S` slow-mo · `,` `.` frame step · `J` `K` prev/next key ·
`\` A/B · `T` theme · `⌘K` palette · `?` shortcut sheet · `⌘\` hide UI (present) ·
`Shift+0/1` zoom 100% / fit · `⌘Z` / `⇧⌘Z` undo/redo.

One dispatcher owns every key. Kit defaults register at priority 0, shell code at 10,
so a tool's own `T` (Text) beats the theme toggle with no configuration. Label bindings
(`{ run, label, group }`) and the `?` sheet lists them — it is generated, never typed.
Space and Enter on a focused button go to the button. Hold keys (`\` to peek at the
original) use `useHoldKey`.
