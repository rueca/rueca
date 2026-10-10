---
name: rueca
description: Build the design-tool harness around an interactive prototype — inspector, timeline, layers, presets, export — so it can be felt and tuned, not just looked at. Use whenever creating or wrapping a prototype, playground, motion study, shader or 3D toy, generator, photo effect, UX flow, journey map, node graph, parameter explorer or client demo, in any runtime (Canvas, WebGL, three.js, SVG, React, plain HTML, an existing app). Triggers on: prototype, playground, motion study, animation harness, tuning tool, design tool, parameter explorer, instrument, "let me test this", "make me a tool to", "add controls to this".
license: MIT
---

# Rueca

A prototype needs two things: **the artifact** (the screen, animation, shader, flow)
and **the harness** around it — the tool that lets someone feel it and tune it. This
skill builds the harness. Build it every time: a prototype with no controls is a
screenshot.

The harness is a **design tool**, not a web page. It should feel like Figma, Framer,
Spline, Paper, Affinity or Rive — and it stays **neutral**, so whatever is being
designed reads truthfully inside the artboard.

**Read this file, then build.** It holds everything a typical tool needs. Open a
reference only when its row in the table at the end says so — not up front. Each one
you read rides along in every later turn.

## Workflow

1. **Identify the artifact and its runtime** — Canvas 2D, WebGL/three.js, SVG, DOM/React,
   an existing page or app — and who uses the tool (the designer, or a client).
2. **Pick the route.**
   - React project, or a new one → the kit. Not installed yet? Install it:
     `npx shadcn@latest add https://rueca.github.io/rueca/r/studio.json -y` (lands in
     `src/components/studio/`; import from `@/components/studio`; add
     `@import "./components/studio/theme.css";` to the main CSS). New project or `shadcn init`
     trouble → `references/install.md`. **Can't install right now** (no shell, or told not to run
     anything)? Still write against the kit and put the install command in your handoff — never
     hand-build what the kit already gives you (undo, presets, A/B, share links, persistence, the
     inspector, scrubbers). A hand-rolled harness is the failure this skill exists to prevent.
   - An existing page you must not rewrite → `FrameSurface`. Same dev server (same origin)?
     Drive it with `cssVars` / `apply={(doc, v) => …}` and leave the page untouched.
     Otherwise add `assets/studio-bridge.js` to it.
   - One HTML file, no build step → `references/install.md` §C (theme.css + visual rules).
3. **Write the schema first** — one line per knob, each with a `hint`. It drives the
   inspector, defaults, reset, the changed cue, presets, undo, share link and agent export.
4. **Build the artifact as a pure function of `(values, t)`**, drawn by a surface the clock
   ticks — never by React re-renders or a hand-written rAF loop.
5. **Pick the layout** — `islands` (default: floating panels), `docked` (Figma-like
   editors with layers + properties), `overlay` (full-bleed art, panels on top).
6. **QA by measuring, not looking**: typecheck, production build, both themes, the accent
   check → `references/qa.md` before you claim it works.
7. **Hand off.** Say what you verified versus what you only looked at.

## Starter (Canvas 2D; swap the surface for other runtimes)

```tsx
import {
  Studio, Toolbar, Brand, Panel, PanelHeader, Inspector, ParamActions, Timeline, Stage, Artboard,
  CanvasSurface, Button, createClock, createParams, defineSchema, folder, p, renderCanvasPNG,
  useHotkeys, useValues, toast,
} from '@/components/studio'
import { draw as art } from './art'          // the artifact: draw(ctx, t, values), pure

const schema = defineSchema({
  shape: folder('Shape', {
    count: p.number(12, { min: 1, max: 40, step: 1, hint: 'How many rings.' }),
    ease: p.select('easeOut', ['linear', 'easeOut', 'easeInOut'], { hint: 'How each ring fades in.' }),
    tint: p.color('#7aa2ff', { hint: 'Ring colour.' }),
  }),
  output: folder('Output', { size: p.size({ w: 1080, h: 1080 }, { hint: 'Artboard and export size.' }) }),
})
const params = createParams(schema, {
  id: 'rings', version: 1,                                     // id = storage key; bump version when the shape changes
  presets: [{ name: 'Calm', values: { count: 8, ease: 'easeInOut' } }],
})
const clock = createClock({ duration: 2400, mode: 'loop' })    // ms; 'once' | 'loop' | 'pingpong'
const draw = (ctx: CanvasRenderingContext2D, { t, w, h, v }: { t: number; w: number; h: number; v: ReturnType<typeof params.values> }) =>
  art(ctx, t / 1000, w, h, v)                                  // ctx is already scaled to logical px

export function Tool() {
  const v = useValues(params)
  const exportPNG = () => renderCanvasPNG(draw, { width: v.size.w, height: v.size.h, v: params.values(), t: clock.time(), scale: 2 })
    .then(() => toast('Exported PNG'))
  useHotkeys({ 'mod+e': { run: exportPNG, label: 'Export PNG', group: 'File' } }, [v.size.w, v.size.h])
  return (
    <Studio
      toolbar={<Toolbar start={<Brand name="Rings" />} end={<><ParamActions params={params} /><Button variant="primary" onClick={exportPNG}>Export</Button></>} />}
      right={<Panel header={<PanelHeader title="Rings" />}><Inspector params={params} /></Panel>}
      bottom={<Timeline clock={clock} lanes={[]} />}   // lanes from the same maths as draw: { id, label, start, end } ms
    >
      <Stage contentSize={v.size}>
        <Artboard width={v.size.w} height={v.size.h} label="Rings" background="#0b0b0f">
          <CanvasSurface params={params} clock={clock} draw={draw} />
        </Artboard>
      </Stage>
    </Studio>
  )
}
```

What the starter already gives you, so don't rebuild it: `createParams` = undo/redo (⌘Z / ⇧⌘Z),
persistence across reloads and `#p=` share links; `ParamActions` = undo buttons, named presets
(save / apply / delete), A/B compare (`\`), copy link, theme toggle; `Inspector` = every control,
scrubbable, with reset and the changed cue. Expensive params: `p.number(…, { live: false })` and apply them
in `params.onCommit((v, meta) => …)` — that fires on pointer-up, not every drag frame.

Other surfaces, same contract: `WebGLSurface` (`setup(gl)` → `draw(gl, frame, state)`),
`MountSurface` (`mount={(el, api) => { const s = start(el); return () => s.dispose() }}` for
vanilla three.js / any imperative lib; push changes via `params.subscribe` / `params.onCommit`,
never re-mount), `FrameSurface` (an existing page). Client view: mark knobs `publish: true` and
render `<Inspector params={params} published />` in a bottom sheet. Lists the user edits (layers,
nodes, clips) live in `p.data<T>(…, { validate })` or `createDocStore` + `createHistory([params, doc])`
so they undo, persist and share — never in `useState`.

## Non-negotiables

- **Neutral chrome, brand inside the artboard.** Tokens only in chrome (`bg-panel`, `text-fg`,
  `text-fg-muted`, `bg-control`, `ring-signal`…); a hex colour belongs inside the artwork only.
- **Four control surfaces** — well, track, raised, active — never conflated.
- **Radius and shadow, not borders.** Sentence case, never micro-caps. Tabular numbers on
  anything live.
- **One accent, only on state.** Playhead is red/orange, not the accent. The accent defaults to
  system blue (`--signal`) and must not clash with the work: run `scripts/accent-check.mjs <url>`
  before handoff.
- **Every number is a scrubber** (drag, type, expressions) and every drag has a non-drag
  alternative — kit controls already do this; don't hand-build inputs.
- **Derive the timeline from the same maths that draws the render**, never a hand-kept list.
- **Light theme must work.** Test both.
- **Never put live values in a rAF effect's dependency array.**

## References — read ONLY when

| File | Read when |
|---|---|
| `references/kit-api.md` | You need a kit API the starter doesn't show (doc store, item params, palette ⌘K, toasts, hotkey details, layout props) |
| `references/kit-components.md` | You need a specialist control: knob, layers tree, key/track timelines, data grid, curves, gradient, effect stack, node canvas theme |
| `references/architecture.md` | Wiring something non-trivial: multi-store undo, expensive renders, video/frame export, batch output |
| `references/layouts.md` | Choosing between layouts, or copying an example shell's structure (table of 19 with live links) |
| `references/install.md` | Installing into a new or unusual project; forks; updating; the no-build route |
| `references/visual-rules.md` | Hand-styling anything the kit doesn't cover, or something "looks off" |
| `references/qa.md` | Before claiming it works |
| `references/gotchas.md` | Something behaves strangely — not before |
| `references/figma.md` | Content comes from Figma or the web |

`assets/theme.css` is the token set (only for the no-build route — the kit ships it).
`assets/studio-bridge.js` lets the harness drive a page on another origin.
`scripts/accent-check.mjs` checks the accent against the rendered artboard.
