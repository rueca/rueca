# Session context (handoff for agents) — 2026-10-09

> **Name: Trompo** (chosen 2026-10-09; was "Prototype Studio"). Skill at `skills/trompo/`, identity in
> `src/site.config.ts`, brand in `brand/BRAND.md`. Mentions of "Prototype Studio" below are historical.

## Who and what
- **Rafael Cespedes** — designer (not an engineer). Builds "instruments" for clients: prototypes, asset
  generators, demos, each needing design-tool UI (inspector, timeline, layers, export). He originally wrote a
  Claude Code skill, `prototype-studio` (~/.claude/skills/prototype-studio/SKILL.md, 410 lines: neutral chrome,
  four control surfaces, `@theme inline`, scrubbers, param table, pure render + refs, QA audit, gotchas).
  Goal now: bullet-proof it for ANY prototype environment (3D, motion, graphics, photo, UX flows, journey
  mapping…) and **open-source it**.
- Working style: plain language, streamlined replies, show rendered options to pick from, flag taste/brand
  calls as his, state needs up front, prefer the best tool even if paid (only raise cost near $100s).
- Reference tools he named: **Spline, Paper, Figma, Framer, Affinity, Rive**.

## Decisions so far
- Stack: React 19 + TS + Tailwind v4 (`@theme inline` tokens) + **Base UI** (`@base-ui/react` 1.9 — shadcn's
  default since Jul 2026) + lucide + zustand. Own: schema inspector, scrub fields, curve/spring, timeline,
  canvas camera. xyflow for graphs, three for 3D, mediabunny for video, cmdk palette.
- Architecture: **framework-agnostic param store + clock** (vanilla zustand) so the artifact can be anything;
  **surfaces** (`CanvasSurface`, `MountSurface` for vanilla three.js etc., `FrameSurface` + `public/studio-bridge.js`
  postMessage bridge for any existing prototype/iframe). React is only the harness.
- Distribution leaning: agent skill (agentskills.io standard) + Claude Code plugin + **shadcn custom registry**
  for the kit (component-by-component, updatable), maybe npm for CDN/single-file use. Not final — Rafael decides.

## Positioning (from research)
- Prior art: **Toolcraft** (pixel-point, MIT, Sep 2026, ~900★) — "agent builds a bespoke design app from
  scratch"; heavy (280k lines, 58k-word rulebook), React-only, desktop-only, no updates, owns the whole app.
  **DialKit** (Josh Puckett, MIT) — floating tuning panel, springs/easing, "copy prompt for agent", multi-framework.
  **Figma PropsKit** (web components for Figma's agent). **Leva / Tweakpane / lil-gui** — debug-panel look.
  **shadcn/designer** — commercial studio shell.
- Ours: *a design-tool harness that drops in around the prototype you already have, in any runtime, installed
  component by component and kept up to date — with presentation-grade, client-facing chrome.* Differentiators:
  any-environment surfaces + bridge, client/present view (works on phones), schema → inspector/undo/presets/
  A/B/share/"copy as agent prompt", scrub fields, OKLCH colour, shells for 3D/photo/flows/journeys/node graphs/
  batch export/AI playgrounds (gaps in Toolcraft), lean skill with progressive disclosure.

## Files
- `src/kit/` — the kit (API in `docs/KIT.md`). `src/kit/theme.css` tokens.
- `src/shells/<id>/` — test shells (meta.ts + index.tsx), auto-registered by `src/gallery/App.tsx` via import.meta.glob.
  Done: motion, dropin, present. In progress by 8 builder agents: ui-design, component-lab, shader, dither, scene,
  photo, animate, video, flows, journey, nodes, generate, batch, marks, type, synth.
- `src/gallery/` — gallery home (`#/`), shells at `#/<id>`.
- `research/01–06` — technology survey, pro-tool patterns, landscape of vibe-coded instruments, six-tool control
  matrix, Toolcraft evaluation, QA findings/gotchas.
- `scripts/qa.mjs` — headless Chrome (playwright-core, channel 'chrome') QA: console errors, contrast audit both
  themes, writes `public/thumbs/<id>-<theme>.png`.
- `public/studio-bridge.js`, `public/protos/hero.html` — the drop-in bridge demo.
- Dev server: `npm run dev` → http://localhost:5273 (already running; don't restart it, don't use the shared
  browser pane — use playwright-core screenshots into the scratchpad).
- Scratchpad: /private/tmp/claude-501/-Users-raf-Documents-Prototype-UI-Harness/9b1e4263-3b30-4ecf-938b-11a5933ab1aa/scratchpad
