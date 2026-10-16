# Getting the kit into a project

Three routes. Pick by the project the tool lives in, not by preference and not by what you can run
this session (a session that can't run npm still uses A: see § The kit, not installed yet).

| Situation | Route |
|---|---|
| A React 19 + Tailwind v4 project, or nothing yet | **A. Kit** via the component registry |
| React 19 without Tailwind | **A**, with `@tailwindcss/vite` added and the tool in an entry of its own, so Tailwind's reset only reaches the tool |
| An existing prototype you must not rewrite (plain HTML, Svelte, Vue, Webflow export, p5, a built app), or an app on React 18 / Tailwind v3 | **B. Drop-in**: a harness wraps it in an iframe |
| Astro, Remix, Next.js pages router (untested) | **B**: a small Vite harness app beside it, rather than installing into it |
| The tool itself must be one HTML file with no build step | **C. Hand-built** from `assets/theme.css` + the visual rules |

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
- **Theme:** `@import "./components/studio/theme.css";` in the main CSS of a new project, or in the
  tool's own CSS file beside an existing app (§ A tool entry of its own). Its tokens (`--panel`, `--line`,
  `--gutter`…) are declared only on the kit's own roots — `.studio` (the `<Studio>` root), the `.pop`
  popups and `[data-studio]` — so the app's own variables, `dark:` variant and `<body>` are untouched,
  and the utility names (`fg-muted`, `signal`, `control`, `font-ui`, …) don't overlap shadcn's. Using
  kit controls outside `<Studio>`? Put `className="studio"` on their container. Known overlap: the kit's
  utility classes `panel`, `pop`, `cluster`, `tabular`, `checker`, `no-select` share names with app
  classes. An app CSS rule for `.panel` or `.tabular` (etc.) repaints every kit panel or number, and the
  kit's give an app element with that class the kit's look — check the app's CSS for those names and
  rename the app's (e.g. `app-panel`) before installing.
- **Light / dark:** the tool has its own theme on `<html data-studio-theme="light|dark">`, separate from
  the app's (its `.dark` class is never read or set). With no attribute it follows the OS; the kit's
  toggle remembers the choice (`studio:theme`).
- **Overriding a token** (the accent, a density size): the tokens sit on the kit's roots, not `:root`, so
  an app rule on `:root` never reaches them. In the app's CSS, after the theme import, target
  `:root:root, :root:root :where(.studio, .pop, [data-studio]) { --gutter: 10px; }`. The accent needs a
  light-theme block as well: `visual-rules.md` has the recipe, and `scripts/accent-check.mjs` prints it.
- **Use the kit's `cn` in tool chrome**, `import { cn } from '@/components/studio'` (or `…/studio/core/cn`
  after a partial install), not shadcn's `cn` from `@/lib/utils`. Shadcn's doesn't know the density names
  and drops `text-ui` when a colour class sits next to it.
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
- **An existing app with no `components.json`:** `add … -y` stops at a prompt (or exits having
  installed nothing) — but do NOT run `shadcn init` there: it rewrites the app's main CSS (in a
  Next.js test it deleted the dark-mode query and broke the site's fonts). Write this file instead
  (point `css` at the app's main stylesheet; `rsc: true` for Next.js), then `add`:
  ```json
  { "$schema": "https://ui.shadcn.com/schema.json", "style": "new-york", "rsc": false, "tsx": true,
    "tailwind": { "config": "", "css": "src/index.css", "baseColor": "neutral", "cssVariables": true },
    "iconLibrary": "lucide",
    "aliases": { "components": "@/components", "utils": "@/lib/utils", "ui": "@/components/ui", "lib": "@/lib", "hooks": "@/hooks" } }
  ```
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
  doesn't typecheck, so a missing dependency only shows there. A tool in its own `tool.html` is built
  only once that page is in the build input (§ A tool entry of its own).
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

## A tool entry of its own

Beside an existing app, give the tool its own page, so nothing in the app imports it and the app's
CSS is never edited:

- `tool.html` at the project root: a copy of `index.html` whose script is `/src/tool/main.tsx`. The tool
  lives in `src/tool/`, and opens at `/tool.html` on the app's dev server.
- **Its own CSS file**, `src/tool/tool.css`, imported only by `src/tool/main.tsx`. Point
  `components.json`'s `tailwind.css` at it.
  ```css
  @import "tailwindcss";
  @import "../components/studio/theme.css";
  html, body, #root { height: 100%; margin: 0 }
  ```
- **In the build input**, so `npm run build` bundles and checks the tool too (Vite builds only
  `index.html` unless told otherwise). In `vite.config.ts` (on Vite 8, `rolldownOptions` is the new name):
  ```ts
  build: { rollupOptions: { input: { main: 'index.html', tool: 'tool.html' } } },
  ```

### The kit, not installed yet

When you can't install (no shell, told not to run anything, registry unreachable), write the tool
against the kit anyway, and keep the app building until someone runs the install:

1. The tool entry above, but **leave `tool.html` out of the build input** and add `"src/tool"` to
   `exclude` in `tsconfig.app.json`. Its imports don't resolve yet, and `tsc -b` checks everything
   under `src`.
2. **Write the notes lines commented out** in `vite.config.ts`, because an import of a missing file
   stops the dev server and the build:
   ```ts
   // import { ruecaNotes } from './rueca/notes-server/vite.ts'   // after the kit install
   export default defineConfig({ plugins: [react() /* , ruecaNotes() */] })
   ```
3. Touch nothing else in the app: not its main CSS, not `index.html`.
4. Hand off the install as a list, in this order:
   1. `npx shadcn@latest add https://rueca.dev/r/studio.json -y` (an app without Tailwind v4, the `@`
      alias or a `components.json` gets those first, as in route A)
   2. Remove `"src/tool"` from `exclude` in `tsconfig.app.json`
   3. Add `tool.html` to the build input
   4. Uncomment the two `ruecaNotes` lines
   5. `npm run build`, then open `/tool.html` on the dev server

   Then a `Not run:` line for every check you skipped (qa.md § Static checks only).

## B. Drop-in (wrap an existing prototype)

The harness renders the page with `<FrameSurface src="…" params={params} />` and pushes every value
change into it. How it reaches the page depends on whether the two share an origin (scheme, host and
port). A separate harness app on its own port does not.

**1. The harness in the page's own project.** Same dev server, same origin, no edits to the page.
Works when that project can take the kit (React 19 + Tailwind v4): add the tool as an entry of its own
(§ A tool entry of its own) and point `src` at the page's own path.

**2. The page served through the harness.** Same origin, no edits to the page. Use this when the
page's project can't take the kit (React 18, Tailwind v3, Vue, Svelte) or the person said not to
touch it.
- A static page or folder (HTML, a Webflow export, a built `dist/`): serve it from the harness app's
  `public/` (a copy, or a symlink to keep it live).
- A running app on another dev server: the harness takes a base path and proxies everything else to
  the app, so the app keeps its own absolute paths (`/src/…`, `/assets/…`). Then open the harness at
  `http://localhost:5273/__tool/`, and the app is at `/` on the same origin:
  ```ts
  // the harness app's vite.config.ts; the app runs on :3000
  export default defineConfig({
    base: '/__tool/',
    server: { port: 5273, strictPort: true,
      proxy: { '^/(?!__tool/)': { target: 'http://localhost:3000', changeOrigin: true, ws: true } } },
  })
  ```
  `<FrameSurface src="/" …>`. The app's dev server must be running.

**3. The bridge script, when an edit is allowed.** Copy `assets/studio-bridge.js` next to the page (or
install the `bridge` item, which lands in `public/`) and add it. Values arrive by `postMessage`, across
origins too, and the page can push values back with `studio.set(key, value)` (text edited in place):
```html
<script src="studio-bridge.js"></script>
<script>
  studio.cssVars()                          // every value → a CSS custom property
  studio.on((v) => { /* or apply by hand */ })
</script>
```

**Driving a same-origin page** (setups 1 and 2): `cssVars` writes every scalar as a custom property
on the page's `:root` (`headlineSize` → `--headline-size`), which reaches only CSS that reads those
variables. A component styled inline (`style={{ padding: 24 }}`) or with literal values ignores them.
Write an override stylesheet into the page from `apply` instead. A stylesheet `!important` beats an
inline style without one, and the page re-rendering doesn't wipe it:
```tsx
<FrameSurface src="/" params={params} apply={(doc, v) => {
  const s = doc.getElementById('rueca-tune') ?? doc.head.appendChild(Object.assign(doc.createElement('style'), { id: 'rueca-tune' }))
  s.textContent = `.pricing-card { padding: ${v.pad}px !important; border-radius: ${v.radius}px !important }`
}} />
```
To start from the page's own values, read them once on load:
`params.replace(readCssVars(doc, ['accent', 'headlineSize']), { history: false })`.

What route B gives: inspector, presets, undo, A/B, share links and persistence for the page's
values, and live breakpoints. What it doesn't: a timeline (the page keeps its own time) or
render export (the harness can't draw the page into a canvas) — leave the starter's `Timeline`
and Export button out, or wire Export to something real (copy CSS, JSON).

Several `FrameSurface`s at once give live breakpoints (mobile / tablet / desktop); `ViewportFrame`
(`kit-components.md`) gives each one a resizable frame.
Iframes eat pointer events — give the stage a Hand / Interact toggle (`architecture.md`).

## C. Hand-built single file

This is the one place hand-building is right: the tool must stay one HTML file that opens with no
build step, so the kit has nowhere to go. A session that can't run npm is not this case (§ The kit,
not installed yet). Build the same harness by hand (one param table, undo, presets, share link) rather than skip it.
Inline `assets/theme.css`, dropping its `@import` lines, `@custom-variant` and the `@theme inline`
block — but first copy the block's `--font-ui` / `--font-mono` lines into `:root` (or the chrome
renders in Times), and rewrite each `@utility name { … }` (`panel`, `cluster`, `pop`, `tabular`, …)
as a plain `.name { … }` rule. Use the raw `var(--panel)` etc. directly, and
follow `visual-rules.md` to the letter. Keep the same architecture — one param table,
pure render, refs — so it can be upgraded to the kit later.

Fonts: copy the `.woff2` into the project and `@font-face` it; serve over HTTP.
Chrome blocks `@font-face` over `file://` and silently falls back.

Comments and Send to agent still belong here. Run `scripts/notes-server.mjs` beside the page and add
`assets/rueca-notes.js` to it. The page draws its own Comment button, pins and thread card, hidden while
`ruecaNotes.endpoint()` resolves to null. The API and the format are in `notes.md`, under a page with no build.

## Ship it runnable

Add a launch config so the person (and the preview pane) can start it:

```json
// .claude/launch.json
{ "version": "0.0.1", "configurations": [
  { "name": "studio", "runtimeExecutable": "npm", "runtimeArgs": ["run", "dev"], "port": 5273 }]}
```

Pin the port (`vite --port 5273 --strictPort`) so links don't drift between runs.
