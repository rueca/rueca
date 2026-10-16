---
name: rueca
description: Build the design-tool harness around an interactive visual prototype — inspector of sliders and knobs, timeline, layers, presets, undo, share link, export. Use when someone wants to tweak, tune, scrub, dial in or play with how something looks or moves — a motion study, canvas / WebGL / three.js / p5 sketch, shader, SVG or generative art, photo effect, UI component, UX flow, node graph, playground, client demo — in any runtime, new or existing. Also use unasked when sketching an animation, logo or brand motion, or any visual for someone to react to, and whenever you start hand-adding sliders, a scrubber or a replay button; the piece may ship on a marketing site, but the tool to design it is in scope. Triggers on "add sliders / controls / knobs to this", "make this a little editor", "a leva / tweakpane / dat.gui panel", tuning tool, design tool. Not for building shipped features (settings pages, forms, dashboards, a slider or animation in a live site), tests, CLIs, APIs or backend prototypes.
license: MIT
---

# Rueca

A prototype needs two things: **the artifact** (the screen, animation, shader, flow)
and **the harness** around it — the tool that lets someone feel it and tune it. This
skill builds the harness. When someone wants to feel or tune a visual prototype, build the
harness, not just the artifact: a prototype with no controls is a screenshot.

The harness is a **design tool**, not a web page. It should feel like Figma, Framer,
Spline, Paper, Affinity or Rive — and it stays **neutral**, so whatever is being
designed reads truthfully inside the artboard.

**Read this file, then build.** It holds everything a typical tool needs. Open a
reference when the table at the end says to, not up front. Each one
you read rides along in every later turn.

## Workflow

1. **Identify the artifact and its runtime** — Canvas 2D, WebGL/three.js, SVG, DOM/React,
   an existing page or app — and who uses the tool (the designer, or a client).
2. **Pick the route by the project the tool lives in**, not by what you can run this session.
   - **The kit**: a React 19 + Tailwind v4 project, or a new one (Next.js too: render the tool
     client-only, see install.md). Install it with
     `npx shadcn@latest add https://rueca.dev/r/studio.json -y`. It lands in `src/components/studio/`,
     notes server included; import from `@/components/studio`. A new project: add
     `@import "./components/studio/theme.css";` and `html, body, #root { height: 100% }` to the main CSS.
     An existing app: give the tool its own page and CSS file instead (install.md § A tool entry of its
     own), so the app's styles and build never change. With no `components.json`, never run `shadcn init`
     (it rewrites the app's CSS; install.md has a components.json to write instead). A new project, Next.js,
     strict TypeScript or `shadcn init` trouble → `references/install.md`. After installing, run
     the production build once (`npm run build`), not just the dev server.
   - **The kit, not installed yet** (no shell, told not to run anything, registry unreachable): still
     write against the kit and put the install steps in your handoff. Never hand-build what the kit
     already gives you (undo, presets, A/B, share links, persistence, the inspector, scrubbers). A
     hand-rolled harness is the failure this skill exists to prevent. Keep the user's app building until
     the kit lands. Put the tool in its own entry, keep that entry out of the build and the type-check,
     and write the notes lines commented out. install.md has the steps and the handoff list.
   - **Wrap the page**: an existing page you must not rewrite, or an app on React 18 / Tailwind v3 /
     Vue / Svelte (never run `shadcn init` in those) → a harness with `FrameSurface` around it. When the
     harness and the page share an origin, it drives the page through `cssVars` / `apply` with no edits
     to it. A separate harness app on its own port doesn't share one, so serve the page through the
     harness or add `assets/studio-bridge.js` to it: install.md §B has the three setups.
   - **Hand-build**: only when the tool itself must be one HTML file with no build step (the person
     opens or ships that file as is) → install.md §C, theme.css plus the visual rules. When the only
     problem is that this session can't run npm, use "not installed yet" above.
3. **Write the schema first** — one line per knob, each with a `hint`. It drives the
   inspector, defaults, reset, the changed cue, presets, undo, share link and agent export.
   Then rank it. What the presets vary and what gets tuned every session stays in view, about 8–12
   rows. A section's rarely touched tail gets `more: true`; an optional feature becomes a folder with
   `toggle`; grid, snap, fps and units go in a `place: 'settings'` folder. Rules: `references/layouts.md`
   § What shows at rest. Lists the person edits (layers, nodes, clips, rows) go in the schema as
   `p.data<T>(…, { validate })`, or in `createDocStore` joined by `createHistory([params, doc])`, so they
   undo, persist and share. Never keep them in `useState`. Set `presetKeys` so "Save preset" captures the look,
   not the export size or the document. `label` renames a row (`p.number(4, { label: 'Blur (px)' })`),
   and motion gets `p.spring({ stiffness, damping, mass })` or `p.curve([…])` rather than loose numbers.
4. **Build the artifact as a pure function of `(values, t)`**, drawn by a surface the clock
   ticks — never by a hand-written rAF loop, and never by re-rendering React on every frame.
   - Canvas, WebGL, three.js, p5: the surfaces below.
   - **SVG or DOM that moves**: React renders the structure from `useValues` (it changes only when a
     knob does), and the clock moves it through refs. Subscribe once, read values with
     `params.values()`, and write attributes from a pure `frame(el, v, t)`:
     `useEffect(() => clock.onTick((t) => frame(ref.current, params.values(), t)), [])`. It keeps ticking
     while paused (the default `idle: true`), so knob changes still redraw. `useClockTime` is a
     throttled readout for labels, never for drawing. SVG or DOM that only changes with the knobs needs no clock: render it with `useValues`.
   - A component that times itself and that you mustn't rewrite (motion/react, CSS transitions, a
     Lottie): feed it the values as props, replay it by changing its React `key` (button + `R`, and
     after each commit), and skip the timeline unless it exposes its time.
5. **Pick the layout** — `islands` (default: panels float over the canvas, which runs underneath), `docked` (Figma-like
   editors with layers + properties), `overlay` (full-bleed art, panels on top).
6. **QA by measuring, not looking**: production build (`npm run build`, which type-checks), both
   themes, the accent check → `references/qa.md` before you claim it works. Told not to run anything?
   qa.md § Static checks only.
7. **Hand off.** Say what you verified versus what you only looked at, and how to leave a comment
   (`C`, then click the art or a knob). Anything you didn't run goes on its own line, with the command
   that runs it: `Not run: npm run build, accent check (told not to run anything)`.

## Starter (Canvas 2D; swap the surface for other runtimes)

```tsx
import {
  Studio, Toolbar, Brand, Panel, PanelHeader, Inspector, ParamActions, Timeline, Stage, Artboard,
  CanvasSurface, Button, CommandPalette, NoteLayer, createClock, createParams, defineSchema, folder, p, renderCanvasPNG,
  useHotkeys, useValues, toast,
} from '@/components/studio'
import { draw as art } from './art'          // the artifact: draw(ctx, t, w, h, values), pure

const schema = defineSchema({                // top level is always folders
  shape: folder('Shape', {
    count: p.number(12, { min: 1, max: 40, step: 1, hint: 'How many rings.' }),
    ease: p.select('easeOut', ['linear', 'easeOut', 'easeInOut'], { hint: 'How each ring fades in.' }),
    tint: p.color('#7aa2ff', { hint: 'Ring colour.' }),
  }),
  output: folder('Output', { size: p.size({ w: 1080, h: 1080 }, { hint: 'Artboard and export size.' }) }),
})
const params = createParams(schema, {
  id: 'rings', version: 1,     // id = storage key; bump version when a param is renamed/rescaled, with migrate(old, from) to keep saved values
  presets: [{ name: 'Calm', values: { count: 8, ease: 'easeInOut' } }],
})
const clock = createClock({ duration: 2400, mode: 'loop' })    // ms; 'once' | 'loop' | 'pingpong'
const draw = (ctx: CanvasRenderingContext2D, { t, w, h, v }: { t: number; w: number; h: number; v: ReturnType<typeof params.values> }) =>
  art(ctx, t / 1000, w, h, v)                                  // ctx is already scaled to logical px

export function Tool() {
  const v = useValues(params)
  const exportPNG = () => renderCanvasPNG(draw, { width: v.size.w, height: v.size.h, v: params.values(), t: clock.time(), scale: 2 })
    .then(() => toast('Exported PNG'), (e) => toast('Export failed', { type: 'error', description: String(e) }))
  useHotkeys({ 'mod+e': { run: exportPNG, label: 'Export PNG', group: 'File' } }, [v.size.w, v.size.h])
  return (
    <Studio
      toolbar={<Toolbar start={<Brand name="Rings" />} end={<><ParamActions params={params} clock={clock} /><Button variant="primary" onClick={exportPNG}>Export</Button></>} />}
      right={<Panel header={<PanelHeader title="Rings" />}><Inspector params={params} /></Panel>}
      bottom={<Timeline clock={clock} lanes={[]} />}   // lanes from the same maths as draw: { id, label, start, end } ms
    >
      <Stage contentSize={v.size}>
        <Artboard width={v.size.w} height={v.size.h} label="Rings" background="#0b0b0f">
          <CanvasSurface params={params} clock={clock} draw={draw} />
          <NoteLayer params={params} clock={clock} />  {/* comments: pins on the art, threads with the agent */}
        </Artboard>
      </Stage>
      <CommandPalette commands={[]} />                 {/* ⌘K and ?; adds View → Density itself */}
    </Studio>
  )
}
```

What the starter already gives you, so don't rebuild it: `createParams` = undo/redo (⌘Z / ⇧⌘Z),
persistence across reloads and `#p=` share links; `ParamActions` = undo buttons, named presets
(save / apply / delete), **Send to agent** plus **Comment** and the comments list once the notes route
answers (below), with A/B compare (`\`),
copy link and the theme toggle in its "…" menu; `Inspector` = the schema's rows, scrubbable, with reset, the
changed cue and "N more" for `more` rows; `SettingsMenu` = the toolbar button for `place: 'settings'` folders;
`CommandPalette` = ⌘K and the `?` shortcut sheet, with View → Density (default / comfortable / compact,
remembered per browser) added for you. Put your own commands in `commands`.
**Comments and Send to agent are on by default.** They're how the person tells you what to change,
pinned to the spot or the knob, without retyping it in chat, and they reply to your answers in a thread.
Set them up in every tool that runs on a dev server you control:

| Route | Set up |
|---|---|
| Kit on Vite (the starter) | `import { ruecaNotes } from './rueca/notes-server/vite.ts'` (keep the `.ts`) and `ruecaNotes()` in `vite.config.ts`, `.rueca/` in `.gitignore`, and the `<NoteLayer>` above. `studio.json` installs the server; after a partial install, add `notes-server.json` |
| Harness app around an existing page | The same, in the harness app |
| Another Node server | `createNotesHandler()`, mounted before your routes |
| One HTML file, no build | `scripts/notes-server.mjs` beside the page and `assets/rueca-notes.js` in it; the page draws its own pins |
| Next.js | No route yet. "Copy as agent prompt" in the share menu covers it; say so in the handoff |

Details for each are in `references/notes.md`. Kit not installed yet? Write those two lines commented
out, because importing a missing file stops the dev server and the build. A static build hides the buttons by itself, so there's
nothing to strip before shipping. Leave them out only when the person asks.

Expensive params: `p.number(…, { live: false })` and apply them
in `params.onCommit((v, meta) => …)` — that fires on pointer-up, not every drag frame.

Other surfaces, same contract: `WebGLSurface` (`setup(gl)` → `draw(gl, frame, state)`),
`MountSurface` (`mount={(el, api) => { const s = start(el); return () => s.dispose() }}` for
vanilla three.js / any imperative lib; push changes via `params.subscribe` / `params.onCommit`,
never re-mount), `FrameSurface` (an existing page).

**Client view** (showing the result to a client on their phone): mark the few knobs they may touch
`publish: true`, then `const { client, forced, setClient } = useClientMode()` and, when `client`,
return `<ClientView params={params} onDownload={…} onExit={forced ? undefined : () => setClient(false)}>`
with the art inside — never hand-build the sheet. It gives touch-size controls, undo, Download,
"Send to designer" (share sheet on phones) and locks a client link (`&client`) out of the designer view;
the share menu gains "Copy client link". Frame the art as it will export —
`<Stage contentSize={size} padding={16} hud={false}><Artboard …>` (not `<Stage fill>`, which crops a 1080px
artboard on a phone) — and draw in output units so the download looks like what the client tuned.
`onDownload` takes a bare render (ClientView shows its own toast).

## Non-negotiables

- **Neutral chrome, brand inside the artboard.** Tokens only in chrome (`bg-panel`, `text-fg`,
  `text-fg-muted`, `bg-control`, `ring-signal`…); a hex colour belongs inside the artwork only.
- **Four control surfaces** — well, track, raised, active — never conflated.
- **Radius and shadow, not borders.** Sentence case, never micro-caps. Tabular numbers on
  anything live.
- **Sizes from the density names** (`h-row`, `h-control`, `size-icon`, `px-pad`, `text-ui`,
  `rounded-control`…), never `h-6` / `px-3` / `text-[11px]`, or the part ignores the density setting.
- **Blue only for focus, selection and the primary action; fills are neutral ink; labels dimmer than
  values.** A switch that's on or a slider's fill is `bg-ink` / `bg-fill`, never blue. Labels are
  `text-fg-faint`, untouched values `text-fg-value`, changed values `text-fg`. The playhead is
  red/orange, not the accent. The accent defaults to system blue (`--signal`) and must not clash with
  the work: run `scripts/accent-check.mjs <url>` before handoff.
- **Every number is a scrubber** (drag, type, expressions) and every drag has a non-drag
  alternative — kit controls already do this; don't hand-build inputs.
- **Derive the timeline from the same maths that draws the render**, never a hand-kept list.
- **Exports are the artwork only**: hide selection outlines, guides and handles while rendering a PNG/video.
- **Light theme must work.** Test both.
- **Never put live values in a rAF effect's dependency array.**

## References

Nearly every build reads these three, each at its step:

| File | Read it |
|---|---|
| `references/install.md` | Step 2, unless the kit is already in the project: a new project, a tool entry beside an existing app, the kit not installed yet, wrapping a page, the no-build route, forks, updating |
| `references/notes.md` | When you set up comments and Send to agent (every new tool); when the person says "check the notes"; when `.rueca/notes/` has notes waiting |
| `references/qa.md` | Step 6, before you claim it works |

Read the rest only when:

| File | Read when |
|---|---|
| `references/kit-api.md` | You need a kit API the starter doesn't show (doc store, item params, palette ⌘K, toasts, hotkey details, layout props) |
| `references/kit-components.md` | You need a specialist control: knob, layers tree, key/track timelines, data grid, curves, gradient, effect stack, node canvas theme, side-by-side breakpoints (`ViewportFrame`) |
| `references/architecture.md` | Wiring something non-trivial: multi-store undo, expensive renders, video/frame export, batch output |
| `references/layouts.md` | Choosing between layouts, or copying an example shell's structure (table of 19 with live links) |
| `references/visual-rules.md` | Hand-styling anything the kit doesn't cover, or something "looks off" |
| `references/gotchas.md` | Something behaves strangely — not before |
| `references/figma.md` | Content comes from Figma or the web |

`assets/theme.css` is the token set (only for the no-build route — the kit ships it).
`assets/studio-bridge.js` lets the harness drive a page on another origin.
`scripts/accent-check.mjs` checks the accent against the rendered artboard.
`scripts/open-notes.mjs` is the hook that tells you about open notes from the tool (`references/notes.md`).
`scripts/notes-server.mjs` + `assets/rueca-notes.js` bring notes to a page with no dev server (`references/notes.md`).
