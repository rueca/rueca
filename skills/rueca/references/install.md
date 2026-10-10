# Getting the kit into a project

Three routes. Pick by what already exists, not by preference.

| Situation | Route |
|---|---|
| A React project, or nothing yet | **A. Kit** via the component registry |
| An existing prototype you must not rewrite (plain HTML, Svelte, Vue, Webflow export, p5, a built app) | **B. Drop-in** — a small harness app wraps it through the bridge |
| One self-contained HTML file, no build step | **C. Hand-built** from `assets/theme.css` + the visual rules |

Registry base URL: `https://rueca.github.io/rueca/r/` (each item is
`<name>.json`). Source and live examples: `https://github.com/rueca/rueca`.

## A. Kit (shadcn registry)

New project:

```bash
npm create vite@latest studio -- --template react-ts
cd studio && npm i && npm i -D tailwindcss @tailwindcss/vite
# add tailwindcss() to vite.config.ts plugins, an "@/*": ["./src/*"] path to
# tsconfig.json + tsconfig.app.json and the matching '@' alias in vite.config.ts
npx shadcn@latest init -y -b base --no-monorepo -p nova   # flags matter: init is interactive and hangs otherwise
npx shadcn@latest add https://rueca.github.io/rueca/r/studio.json -y
```

- `studio` installs everything; individual pieces (`inspector`, `timeline`, `stage`,
  `layers`, `scrub`, `color`, …) install alone and pull what they need. List:
  `https://rueca.github.io/rueca/r/registry.json`. The bridge is its own item
  (`bridge`, lands in `public/`).
- Files land in `<components>/studio/` (usually `src/components/studio/`). The barrel
  `index.ts` ships only with the full `studio` item — after installing single pieces, import
  from the file (`@/components/studio/ui/slider`). The kit docs write `@kit`: alias it to that
  folder in `vite.config.ts` + `tsconfig`, or rewrite the imports.
- **Theme:** `@import "./components/studio/theme.css";` in the main CSS. Kit token names are
  namespaced (`fg-muted`, `signal`, `control`, `font-ui`, …) so they coexist with shadcn's
  (`muted`, `accent`, `input`) — order doesn't matter. The kit styles only `.studio` (the
  `<Studio>` root) and `.pop` popups; it never touches your `<body>`. Using kit controls outside
  `<Studio>`? Put `className="studio"` on their container.
- **Theme class before first paint.** Put this in `index.html` `<head>` so the stored
  theme never flashes (the kit's `useTheme` / `ThemeToggle` read the same key). Without a
  `.dark`/`.light` class the tokens follow the OS:
  ```html
  <script>try{var t=localStorage.getItem('studio:theme');document.documentElement.classList.add((t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light')}catch(e){document.documentElement.classList.add('dark')}</script>
  ```
- **Installing from a fork, a staging copy or localhost:** registry items reference each other
  by absolute URL. Rebuild them against your host first:
  `npm run sync -- --registry-url http://localhost:5273` (then serve `public/r/`).
- **Using the kit from source in another project** (monorepo, `npm link`, a path alias outside
  the project root): add `resolve: { dedupe: ['react', 'react-dom'] }` to Vite (or every page
  throws "Invalid hook call"), and `@source "<path to kit>";` in your CSS (or Tailwind never sees
  the kit's classes and it renders unstyled).
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
