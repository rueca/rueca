---
name: trompo
description: Build the design-tool harness around an interactive prototype — inspector, timeline, layers, presets, export — so it can be felt and tuned, not just looked at. Use whenever creating or wrapping a prototype, playground, motion study, shader or 3D toy, generator, photo effect, UX flow, journey map, node graph, parameter explorer or client demo, in any runtime (Canvas, WebGL, three.js, SVG, React, plain HTML, an existing app). Triggers on: prototype, playground, motion study, animation harness, tuning tool, design tool, parameter explorer, instrument, "let me test this", "make me a tool to", "add controls to this".
license: MIT
---

# Trompo

A prototype needs two things: **the artifact** (the screen, animation, shader, flow)
and **the harness** around it — the tool that lets someone feel it and tune it. This
skill builds the harness. Build it every time: a prototype with no controls is a
screenshot.

The harness is a **design tool**, not a web page. It should feel like Figma, Framer,
Spline, Paper, Affinity or Rive — and it stays **neutral**, so whatever is being
designed reads truthfully inside the artboard.

## Workflow

1. **Identify the artifact and its runtime.** What is being designed, what draws it
   (Canvas 2D, WebGL/three.js, SVG, DOM/React, an existing page or app), and who will
   use the tool (the designer tuning it, or a client being shown it).
2. **Pick the route** → `references/install.md`
   - React project, or a new one → install the kit (shadcn registry).
   - An existing prototype you must not rewrite → wrap it with `FrameSurface`. Served by the
     same dev server (same origin)? Drive it with `cssVars` / `apply={(doc, v) => …}` and leave
     the page untouched. Otherwise add the bridge script (`assets/studio-bridge.js`) to it.
   - No build step allowed (one HTML file) → hand-build with `assets/theme.css` and
     the visual rules.
3. **Write the schema first.** Every knob is one line with a `hint`. The schema drives
   the inspector, defaults, reset, the changed-from-default cue, presets, undo, share
   link and "copy as agent prompt" → `references/architecture.md`
4. **Pick the layout archetype** that matches the artifact, and copy the matching
   example shell's structure → `references/layouts.md`
5. **Build the artifact as a pure function of `(values, t)`**, driven by refs, never by
   React re-renders → `references/architecture.md`
6. **QA by measuring, not looking.** Contrast audit in both themes, interaction and
   motion checks, typecheck **and** production build → `references/qa.md`
7. **Hand off.** Say what you verified versus what you only looked at. Show the
   person rendered options when a call is theirs to make (taste, brand, naming).

## Non-negotiables

- **Neutral chrome, brand inside the artboard.** Never hardcode a colour in chrome —
  tokens only. The artboard gets its own font token (`--font-artboard`), separate
  from the chrome's `--font-ui`.
- **Four control surfaces** — well, track, raised, active — never conflated. This is
  the #1 cause of "the active state looks wrong" → `references/visual-rules.md`
- **Radius and shadow, not borders.** Sentence case, never micro-caps. Hierarchy by
  opacity tier at one size. Tabular numbers on anything live.
- **One accent, only on state.** Playhead is red/orange, not the accent.
- **The accent must not clash with the work.** It defaults to system blue (`--signal`),
  never a brand colour, and that includes Trompo's own pink. Selection outlines,
  handles and focus rings sit *on top of* the prototype, so before handoff run
  `scripts/accent-check.mjs <url>`. If the artboard or a semantic colour (`--rec`,
  `--key`, `--ok`) is within 35° of hue, switch to the fallback it names
  → `references/visual-rules.md` §3, `references/qa.md` §2
- **Every number is a scrubber** (drag, type, expressions) and every drag has a
  non-drag alternative.
- **Values that differ from the default render at full contrast**; untouched ones
  faint. It is the most useful cue in the panel.
- **Derive the timeline from the same maths that draws the render**, never from a
  hand-kept list.
- **Light theme must work.** Test both.
- **Never put live values in a rAF effect's dependency array.**

## References — read when

| File | Read when |
|---|---|
| `references/install.md` | Starting. Choosing kit vs bridge vs single file; install commands; updating |
| `references/kit-api.md` | Writing code against the kit — schema, params, clock, surfaces, layout, components |
| `references/visual-rules.md` | Styling anything, or something "looks off" / "looks dated" |
| `references/architecture.md` | Wiring state, time, render loop, export |
| `references/layouts.md` | Choosing the layout; borrowing conventions from pro tools (inspector, timeline, layers, canvas, shortcuts) |
| `references/qa.md` | Before claiming it works |
| `references/gotchas.md` | Something behaves strangely — check here before debugging |
| `references/figma.md` | Content or reference comes from Figma or from the web |

`assets/theme.css` is the complete, contrast-audited token set (dark + light).
`assets/studio-bridge.js` is the 2 KB script that lets the harness drive any page.
`scripts/accent-check.mjs` checks the accent against the rendered artboard (needs
`playwright-core` and an installed Chrome).
