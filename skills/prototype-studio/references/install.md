# Getting the kit into a project

Three routes. Pick by what already exists, not by preference.

| Situation | Route |
|---|---|
| A React project, or nothing yet | **A. Kit** via the component registry |
| An existing prototype you must not rewrite (plain HTML, Svelte, Vue, Webflow export, p5, a built app) | **B. Drop-in** — a small harness app wraps it through the bridge |
| One self-contained HTML file, no build step | **C. Hand-built** from `assets/theme.css` + the visual rules |

Registry base URL: `https://OWNER.github.io/prototype-studio/r/` (each item is
`<name>.json`). Source and live examples: `https://github.com/OWNER/prototype-studio`.

## A. Kit (shadcn registry)

New project:

```bash
npm create vite@latest studio -- --template react-ts
cd studio && npm i && npm i -D tailwindcss @tailwindcss/vite
# add tailwindcss() to vite.config.ts plugins, an "@/*": ["./src/*"] path to
# tsconfig.json + tsconfig.app.json and the matching '@' alias in vite.config.ts
npx shadcn@latest init -y -b base --no-monorepo -p nova   # flags matter: init is interactive and hangs otherwise
npx shadcn@latest add https://OWNER.github.io/prototype-studio/r/studio.json -y
```

- `studio` installs everything; individual pieces (`inspector`, `timeline`, `stage`,
  `layers`, `scrub`, `color`, …) install alone and pull what they need. List:
  `https://OWNER.github.io/prototype-studio/r/registry.json`. The bridge is its own item
  (`bridge`, lands in `public/`).
- Files land in `<components>/studio/` (usually `src/components/studio/`). Import
  from `@/components/studio`. The kit docs write `@kit` — either alias it in
  `vite.config.ts` + `tsconfig`, or rewrite the import.
- **Theme: add it as the LAST line of the main CSS** (e.g. `src/index.css`):
  ```css
  @import "./components/studio/theme.css";
  ```
  Last, not first: shadcn's own theme also defines `muted`, `accent`, `input` and
  `font-ui`. Imported first, the kit loses — labels vanish in dark, the accent turns
  white, the font becomes Geist. Tailwind v4 accepts an `@import` at the end.
  For a dedicated harness project you can delete shadcn's tokens from the file
  entirely and keep just `@import "tailwindcss";` plus this line.
- **Theme class before first paint.** Put this in `index.html` `<head>` so the stored
  theme never flashes (the kit's `useTheme` / `ThemeToggle` read the same key):
  ```html
  <script>try{var t=localStorage.getItem('studio:theme');document.documentElement.classList.add((t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light')}catch(e){document.documentElement.classList.add('dark')}</script>
  ```
- `CanvasSurface`'s `draw` callback receives loosely typed values; cast once:
  `const v = f.v as ReturnType<typeof params.values>`.
- If `shadcn init` refuses (no Tailwind detected, odd setup), write the files
  directly — they are just source. Fetch the item JSON and write each
  `files[].content` to its target.
- **Update** a piece: re-run `add <url> --overwrite`. Preview first with
  `--diff`. Local edits to kit files are overwritten — keep project-specific
  components outside `studio/`.

The kit stack: React 19 + TypeScript + Tailwind v4 (`@theme inline`) + Base UI
(`@base-ui/react`, shadcn's default primitives) + lucide + zustand + cmdk. Prefer the
real Base UI primitive over hand-rolling: a hand-rolled segmented control loses
keyboard navigation and `role="radio"` for nothing. If you hand-roll anyway, audit for
dead files and unused deps afterwards (`qa.md`).

Adjacent libraries when the artifact needs them: `@xyflow/react` (node graphs, flows),
`three` (3D — R3F if the project is React, but check its React peer range),
`mediabunny` (video export), `culori` (OKLCH / P3). Licence traps to avoid: Theatre.js
studio (AGPL), tldraw (licence key), Remotion (company licence), GSAP (non-OSI),
`@ffmpeg/core` (GPL).

## B. Drop-in (wrap an existing prototype)

1. Copy `assets/studio-bridge.js` next to the prototype and add to its page:
   ```html
   <script src="studio-bridge.js"></script>
   <script>
     studio.cssVars()                          // every value → a CSS custom property
     studio.on((v) => { /* or apply by hand */ })
   </script>
   ```
2. Build the harness as route A in a separate small app, and render the prototype
   with `<FrameSurface src="…" params={params} />`.
3. Values flow down on every change; the page can push values back with
   `studio.set(key, value)` (e.g. text edited in place).

Several `FrameSurface`s at once give live breakpoints (mobile / tablet / desktop).
Iframes eat pointer events — give the stage a Hand / Interact toggle (`architecture.md`).

## C. Hand-built single file

When no build step is allowed: inline `assets/theme.css` (drop its two `@import`
lines and the `@theme inline` block; use the raw `var(--panel)` etc. directly), and
follow `visual-rules.md` to the letter. Keep the same architecture — one param table,
pure render, refs — so it can be upgraded to the kit later.

Fonts: copy the `.woff2` into the project and `@font-face` it; serve over HTTP.
Chrome blocks `@font-face` over `file://` and silently falls back.

## Ship it runnable

Add a launch config so the person (and the preview pane) can start it:

```json
// .claude/launch.json
{ "version": "0.0.1", "configurations": [
  { "name": "studio", "runtimeExecutable": "npm", "runtimeArgs": ["run", "dev"], "port": 5273 }]}
```

Pin the port (`vite --port 5273 --strictPort`) so links don't drift between runs.
