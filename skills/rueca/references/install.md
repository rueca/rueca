# Getting the kit into a project

Three routes. Pick by what already exists, not by preference.

| Situation | Route |
|---|---|
| A React project, or nothing yet | **A. Kit** via the component registry |
| An existing prototype you must not rewrite (plain HTML, Svelte, Vue, Webflow export, p5, a built app) | **B. Drop-in** — a small harness app wraps it through the bridge |
| One self-contained HTML file, no build step | **C. Hand-built** from `assets/theme.css` + the visual rules |

Registry base URL: `https://rueca.dev/r/` (each item is
`<name>.json`). Source and live examples: `https://github.com/rueca/rueca`.

## A. Kit (shadcn registry)

**Requires React 19 and Tailwind v4.** On React 18 or Tailwind v3 do NOT run `shadcn init` — it
rewrites the main CSS for v4 and the user's own app stops building; the kit's types also fail on
`@types/react` 18 and its classes render unstyled under v3. Use route B instead: a small separate
harness app (React 19 + v4) that wraps the existing one.

New project:

```bash
npm create vite@latest studio -- --template react-ts
cd studio && npm i && npm i -D tailwindcss @tailwindcss/vite
printf '@import "tailwindcss";\n' > src/index.css          # shadcn init only finds Tailwind v4 through this import
# add tailwindcss() to vite.config.ts plugins, an "@/*": ["./src/*"] path to BOTH
# tsconfig.json and tsconfig.app.json (one alone makes shadcn write a literal ./@/ folder) — paths
# only, NO baseUrl (deprecated in TypeScript 6, removed in 7: tsc -b fails with TS5101) — and the
# matching alias in vite.config.ts: resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } }
npx shadcn@latest init -y -b base --no-monorepo -p nova   # flags matter: init is interactive and hangs otherwise
npx shadcn@latest add https://rueca.dev/r/studio.json -y
printf '\n@import "./components/studio/theme.css";\nhtml, body, #root { height: 100%%; margin: 0 }\n' >> src/index.css   # leading \n: init's file has no final newline
```

- `studio` installs everything; individual pieces (`inspector`, `timeline`, `stage`,
  `layers`, `scrub`, `color`, …) install alone and pull what they need. List:
  `https://rueca.dev/r/registry.json`. The bridge is its own item
  (`bridge`, lands in `public/`).
- Files land in `<components>/studio/` (usually `src/components/studio/`). The barrel
  `index.ts` ships only with the full `studio` item — after installing single pieces, import
  from the file (`@/components/studio/ui/slider`). The kit docs write `@kit`: alias it to that
  folder in `vite.config.ts` + `tsconfig`, or rewrite the imports.
- **Theme:** `@import "./components/studio/theme.css";` in the main CSS. Its tokens (`--panel`, `--line`,
  `--gutter`…) are declared only on the kit's own roots — `.studio` (the `<Studio>` root), the `.pop`
  popups and `[data-studio]` — so the app's own variables, `dark:` variant and `<body>` are untouched,
  and the utility names (`fg-muted`, `signal`, `control`, `font-ui`, …) don't overlap shadcn's. Using
  kit controls outside `<Studio>`? Put `className="studio"` on their container. Known overlap: the kit's
  utility classes `panel`, `pop`, `cluster`, `tabular`, `checker`, `no-select` share names with any
  app class of the same name — rename the app's if one clashes.
- **Light / dark:** the tool has its own theme on `<html data-studio-theme="light|dark">`, separate from
  the app's (its `.dark` class is never read or set). With no attribute it follows the OS; the kit's
  toggle remembers the choice (`studio:theme`).
- **Give the page a height.** `<Studio>` fills its parent, and Vite's template sets no height, so
  without `html, body, #root { height: 100%; margin: 0 }` the tool renders 0 px tall (a blank page,
  no errors). The kit warns about this in dev.
- **No flash of the wrong theme** (optional): put this in `index.html` `<head>` so a saved choice applies
  before first paint (otherwise it applies on mount):
  ```html
  <script>try{var t=localStorage.getItem('studio:theme');if(t)document.documentElement.setAttribute('data-studio-theme',t)}catch(e){}</script>
  ```
- **Installing from a fork, a staging copy or localhost:** registry items reference each other
  by absolute URL. Rebuild them against your host first:
  `npm run sync -- --registry-url http://localhost:5273` (then serve `public/r/`).
- **Using the kit from source in another project** (monorepo, `npm link`, a path alias outside
  the project root): add `resolve: { dedupe: ['react', 'react-dom'] }` to Vite (or every page
  throws "Invalid hook call"), and `@source "<path to kit>";` in your CSS (or Tailwind never sees
  the kit's classes and it renders unstyled).
- **An existing React app with no `components.json`:** `add … -y` stops at a prompt (or exits
  having installed nothing). Run the `init` line above first.
- **Next.js (App Router):** the tool reads localStorage and the URL on load, so render it
  client-only or every reload after a save is a hydration error: `'use client'` page +
  `const Tool = dynamic(() => import('./Tool'), { ssr: false })`. The theme script goes in
  `app/layout.tsx` `<head>` with `<html suppressHydrationWarning>` (or skip it: the theme then applies on mount). From `src/app/globals.css`
  the import is `@import "../components/studio/theme.css";`.
- **Strict TypeScript / ESLint:** the kit compiles under `strict` and `verbatimModuleSyntax`, but
  not yet under `noUncheckedIndexedAccess` / `exactOptionalPropertyTypes` — if the project uses
  them, say so in the handoff rather than editing kit files. Add `src/components/studio` to the
  linter's ignores (it is vendored source).
- **Build once after installing** (`npm run build`), not just `npm run dev` — the dev server
  doesn't typecheck, so a missing dependency only shows there.
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

What route B gives: inspector, presets, undo, A/B, share links and persistence for the page's
values, and live breakpoints. What it doesn't: a timeline (the page keeps its own time) or
render export (the harness can't draw the page into a canvas) — leave the starter's `Timeline`
and Export button out, or wire Export to something real (copy CSS, JSON).

Several `FrameSurface`s at once give live breakpoints (mobile / tablet / desktop).
Iframes eat pointer events — give the stage a Hand / Interact toggle (`architecture.md`).

## C. Hand-built single file

This is the one place hand-building is right: with no npm the kit can't be installed, so build
the same harness by hand (one param table, undo, presets, share link) rather than skip it.
Inline `assets/theme.css`, dropping its `@import` lines, `@custom-variant` and the `@theme inline`
block — but first copy the block's `--font-ui` / `--font-mono` lines into `:root` (or the chrome
renders in Times), and rewrite each `@utility name { … }` (`panel`, `cluster`, `pop`, `tabular`, …)
as a plain `.name { … }` rule. Use the raw `var(--panel)` etc. directly, and
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
