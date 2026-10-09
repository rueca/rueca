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
- Mark expensive params `live: false` — they apply on commit (pointer-up), not
  mid-drag.
- Mark client-facing params `publish: true` — they appear in the present/client view.
- Use `when: (v) => …` for conditional rows instead of hand-hiding controls.
- Soft range for scrubbing, hard range for typing (Blender): `min/max` is what the
  slider shows; typed values may exceed it unless clamped.

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
| Canvas 2D | `CanvasSurface draw={(ctx, { t, w, h, v }) => …}` — handles DPR and resize |
| WebGL / vanilla three.js / p5 / anything imperative | `MountSurface mount={(el, api) => { …; return cleanup }}` |
| React / DOM / SVG | render directly inside `<Artboard>` using `useValues(params)` |
| An existing page, another framework, a built app | `FrameSurface src=…` + `studio-bridge.js` inside the page |

The bridge protocol (postMessage):
`parent → frame { type: 'studio:params', values }` ·
`frame → parent { type: 'studio:ready' } | { type: 'studio:set', key, value }`.
Inside the page: `studio.on(v => …)`, or `studio.cssVars()` to mirror every value to a
CSS custom property (`fontSize` → `--font-size`).

Iframes swallow wheel and pointer events, so a canvas camera can't pan over an iframe
artboard. Pattern: **Hand vs Interact** mode with a transparent shield (Figma's
design vs prototype).

## Hand-off features that carry their weight

- **Copy values as JSON** — how a designer hands numbers to an engineer.
- **Copy as agent prompt** — the changed values plus their hints, phrased so another
  agent can apply them.
- **Share link** — state in the URL hash (`#p=`).
- **Save defaults to source** (dev only) — write the current values back as the new
  defaults.
- **Presets** with A/B compare (`\`).
- **Export** — PNG at 1×/2×/4×, SVG when the artifact is vector, WebM/MP4 for motion
  (mediabunny), JSON for settings. Batch multi-size when the tool makes assets.

## Keyboard (defaults)

`Space` play · `⏎` replay · `S` slow-mo · `,` `.` frame step · `J` `K` prev/next key ·
`\` A/B · `T` theme · `⌘K` palette · `?` shortcut sheet · `⌘\` hide UI (present) ·
`Shift+0/1` zoom 100% / fit · `⌘Z` / `⇧⌘Z` undo/redo.
