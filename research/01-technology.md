# Technology survey (Oct 2026) — condensed

Verified via GitHub API / npm registry / bundlephobia by research agent, 2026-10-09.

## Decision
- **Primitives:** Base UI (`@base-ui/react` 1.9, MIT, 16M/wk). shadcn's default since July 2026. Has NumberField.ScrubArea (pointer lock), menus, toolbar, toast, popover, toggle group.
- **Gaps:** color picker, angle slider, tree, splitter → Zag machines (`@zag-js/*`) headless, or own. React Aria `Tree` if DnD layers need full a11y.
- **Distribution:** shadcn custom registry (`npx shadcn add <url>`), `registry:base` ships theme + components + fonts in one payload. React Flow UI is the precedent.
- **Build ourselves (no good permissive option):** schema inspector, scrub fields, curve/spring editors, timeline, canvas camera.
- **Layouts:** react-resizable-panels v4 (fixed), dockview 8 (docking; MIT core, watch `dockview-enterprise`).
- **Node graphs:** @xyflow/react 12.
- **State/undo:** zustand 5 (+ immer patches for undo if needed).
- **Keys/palette:** tinykeys, cmdk.
- **Export:** mediabunny (WebCodecs, MPL-2.0), canvas-record (MIT) for GIF/frames; snapdom for DOM screenshots.
- **Color maths:** culori (OKLCH/P3).
- **3D:** R3F 9.8 (peer react <19.4!), drei 10.

## Param-panel libraries
| Lib | Status | Note |
|---|---|---|
| DialKit (Josh Puckett) | 2.0.2 Sep 2026, MIT, 190k/wk | Closest competitor. React/Solid/Svelte/Vue/vanilla. Spring+easing editors, presets, "copy for agent". Plain CSS, floating panel product. |
| Leva | 0.10.1 Oct 2025, 1M/wk | Aging deps (stitches, zustand 3). Headless mode unreleased. Debug look. |
| Tweakpane | 4.0.5 Nov 2024 | Vanilla; plugin list is a good checklist. |
| Theatre.js | dormant since Apr 2024 | studio is **AGPL** — avoid. |
| lil-gui / dat.gui | tiny / dead | debug look |

## Licence red flags
Theatre studio (AGPL) · tldraw (production licence key) · Remotion (company licence >3 people) · Twick (SUL) · GSAP (non-OSI, Webflow non-compete) · @ffmpeg/core (GPL) · dockview-enterprise (proprietary).

## Existing design-tool kits
- FigUI (anxndsgn/figui) — Figma UI3 look, React+Tailwind+Base UI, MIT, basic controls only.
- shadcn/designer — commercial ($1,499/yr), closest "studio shell".
- OpenPencil — Vue/Reka, MIT, AI-native Figma alt.
