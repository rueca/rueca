# QA — measure, don't look

Screenshots confirm layout. They do **not** confirm colour, contrast, timing or
geometry. Run these after any restyle and before claiming it works. Then state plainly
what you verified versus what you only looked at.

**Always:** `npm run build` (§4), and when you can open the page, §1–§3 in both themes. Told not to
run anything: § Static checks only, at the end.

## 1. Contrast audit, both themes

Paste in the browser console (adjust token names if hand-built). It catches the whole
class of "the active state looks wrong" bugs before the person sees them.

```js
const root = document.documentElement
const studio = document.querySelector('.studio') ?? root   // the kit's tokens live on its own root
const V = n => getComputedStyle(studio).getPropertyValue(n).trim()
const parse = c => { const d = document.createElement('div'); d.style.color = c
  document.body.appendChild(d)
  const m = getComputedStyle(d).color.match(/[\d.]+/g).map(Number); d.remove(); return m }
const lum = r => { const f = r.slice(0,3).map(v => { v /= 255
  return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4) })
  return 0.2126*f[0] + 0.7152*f[1] + 0.0722*f[2] }
const ratio = (a,b) => +(((Math.max(lum(a),lum(b))+0.05)/(Math.min(lum(a),lum(b))+0.05))).toFixed(2)

const fails = []
for (const theme of ['dark','light']) {
  root.setAttribute('data-studio-theme', theme)   // the kit's theme (a site using .dark/.light classes: toggle those too)
  root.classList.toggle('light', theme === 'light'); root.classList.toggle('dark', theme === 'dark')
  const g = n => parse(V(n)), panel = g('--panel')
  ;[['well/panel',              g('--well'),      panel,                 1.08],
    ['track/panel',             g('--track'),     panel,                 1.15],
    ['ACTIVE PILL raised/well', g('--raised'),    g('--well'),           1.3],
    ['active/panel',            g('--active'),    panel,                 1.12],
    ['button label (WCAG AA)',  g('--signal-fg'), g('--signal-strong'),  4.5],
    ['accent (focus, selection)/panel', g('--signal'), panel,         3],
    ['label fg-faint/panel',    g('--fg-faint'),  panel,                 4.5],
    ['label fg-faint/input',    g('--fg-faint'),  g('--control'),        4.5],
    ['value fg-value/panel',    g('--fg-value'),  panel,                 4.5],
    ['fg-muted/panel',          g('--fg-muted'),  panel,                 4.5],
    ['fg/panel',                g('--fg'),        panel,                 7],
  ].forEach(([n,a,b,min]) => { const r = ratio(a,b); if (r < min) fails.push(`${theme}: ${n} ${r} < ${min}`) })
}
fails.length ? fails : 'ALL PASS (both themes)'
```

Surface-to-surface minima are heuristics (WCAG doesn't govern them); the text ones are
real WCAG AA, and row labels are text, so `fg-faint` needs 4.5:1 too. Enforce both. Also sample *rendered* chrome text against its first opaque
background — a token can pass while a component uses the wrong one.

## 2. Accent clash, both themes

The contrast audit proves the accent is legible on the *chrome*. This proves it is
legible on the *work*, where the selection outline actually sits. The fallbacks are
below; the reasoning is in `visual-rules.md` §3.

`scripts/` sits next to this file's `references/` folder (the skill's own folder):

```bash
npm i -D playwright-core            # once; uses the installed Chrome
node <skill folder>/scripts/accent-check.mjs http://localhost:5173/#/my-tool
node <skill folder>/scripts/accent-check.mjs <url> --artboard "#preview"   # if it picks the wrong element
node <skill folder>/scripts/accent-check.mjs <url> <preset link> <preset link>   # the defaults and each preset
```

**Which versions of the art to check.** The defaults, plus every preset the tool ships. The project
gets one accent, so pass them all in one run and it names the one fallback that clears all of them. A preset's
link is the tool's URL with `p=` and the preset's values as base64url JSON, stamped with the store's
`version`. Add it as `#p=…`, or as `&p=…` after a hash route such as `#/my-tool`:

```bash
node -e 'console.log(Buffer.from(JSON.stringify({ $v: 1, count: 8, ease: "easeInOut" })).toString("base64url"))'
```

Or apply the preset in the tool and use Copy link in the "…" menu. Colours the person picks freely (a
`p.color` knob, an image they drop in) can't be checked in advance, and no accent clears every
possible palette. When the palette is open-ended, or nothing clears the defaults and presets together,
keep blue and use the two-tone outline below.

It finds the artboard (`--artboard` selector → the kit's `[data-studio-artifact]`
hook → `.font-artboard` on older kits → the largest canvas/iframe/media on hand-built
pages → the whole stage), hides all chrome including floating panels,
and screenshots what's left. Rendered pixels work the same for DOM, SVG, Canvas,
WebGL and iframes. Then it buckets the pixels by OKLCH hue and checks the accent
against them and against `rec`, `key` and `ok`.

```
dark  artboard canvas.block.h-full (largest media) · chromatic hues 240° 21%, 250° 18%, 30° 16% · accent 249°
      CLASH — too close to artboard hue 240° (21%), artboard hue 250° (18%)
light artboard canvas.block.h-full (largest media) · chromatic hues 240° 22%, 250° 17%, 30° 15% · accent 249°
      CLASH — too close to artboard hue 240° (22%), artboard hue 250° (17%)

→ switch to magenta (clears both themes by 53°)
```

Exit code: 0 pass, 1 clash (it prints the override CSS to paste), 2 couldn't run.
If it reports "whole stage" for a single-artboard tool, pass `--artboard`, because the
stage background then dilutes the sample.

**Fallbacks**, pre-audited (fill ≥ 3:1 on the panel, white label on `strong` ≥ 4.5:1, both themes).
Use the one the check names; it prints the override to paste after the theme import.

| Accent | Hue | Dark: fill / strong | Light: fill / strong |
|---|---|---|---|
| blue (default) | 249° | `#0d99ff` / `#0a72c6` | `#0b84e0` / `#0a6fc0` |
| violet | 293° | `#9c78fd` / `#704ec0` | `#8862e5` / `#6a48b9` |
| magenta | 332° | `#d561c8` / `#9e3a93` | `#be4bb1` / `#97338d` |
| cyan | 222° | `#00a5cb` / `#007590` | `#008eaf` / `#006e89` |

Override in the project's own CSS, never in the kit's theme file. If nothing clears 35° (a
full-spectrum prototype, or colours the person picks), keep blue and make selection shape-led rather
than colour-led, with a two-tone outline that reads on any background:

```css
box-shadow: 0 0 0 1.5px var(--signal), 0 0 0 3px var(--field);
```

## 3. Assert in the browser

- **Interaction** — dragging a slider preserves the artifact's scroll position; the
  scrubber changes the value; undo restores it; the timeline collapses.
- **Geometry invariants**, not appearance. "Is the copy locked to the pattern?" →
  sample the offset at four scroll positions and require it constant.
- **Motion** — `clock.seek()` to several timestamps and sample the same pixel band;
  equal values mean nothing is moving. Don't wait on rAF (see `gotchas.md`).
- **Negative space** — if something must stay clear, count non-background pixels in
  its bounding box and require 0.
- **Gutter** — `aside.top - header.bottom === aside.left - main.right`.
- **Theme completeness** — flip the class and confirm every panel colour changed. Any
  hardcoded `bg-white` or `rgba(0,0,0,.4)` in chrome is a theme leak.
- **A11y** — count `[role="radio"]`, `input[type="range"], [role="slider"]`, `[role="spinbutton"]` to
  confirm real primitives rather than divs (kit sliders are native range inputs); tab through — hover-only affordances must
  appear on focus.
- **Truncation** — labels and segmented options must not ellipsise at the inspector
  width.
- **Phone** — if there is a client view, load it at 375px: no horizontal scroll, icon
  buttons not squeezed.
- **Comments** — on the dev server, `fetch('/__rueca/notes').then(r => r.headers.get('x-rueca-notes'))` is `'1'`,
  the toolbar shows Comment and All comments, and `C` then a click on the artboard opens the composer. Missing
  buttons mean the route (`ruecaNotes()`) or `<NoteLayer>` is missing. Next.js and static builds: absent by design,
  so say so in the handoff.
- **Console** — zero errors and zero React key/act warnings.

## 4. In the shell

Written for zsh and bash alike (zsh is the macOS default): patterns are quoted, and `${b}` is braced
because zsh reads `$b[` as an array subscript.

```bash
# prove it compiles AND bundles: the project's own build script, which type-checks first.
# Not `npx tsc --noEmit`: on the Vite template the root tsconfig lists no files, only references, so
# it checks nothing and passes. `tsc -b` (inside `npm run build`) follows the references.
npm run build

# theme leaks: a colour belongs in the artwork or the theme file, never in chrome.
# Skipped: the kit, art modules (files or folders named art, artwork, artifact, shader, shaders),
# schema colour defaults and an Artboard background (those are the artwork's colours).
grep -rnE '#[0-9a-fA-F]{3,8}\b|rgba?\(' src --include='*.ts' --include='*.tsx' --include='*.css' \
  | grep -vE '^src/components/studio/|theme\.css:|/(art|artwork|artifact|shaders?)(/|\.)' \
  | grep -vE 'p\.(color|palette|gradient)\(|<Artboard[^>]*background='

# dead modules: files nobody imports (entry files, index files, .d.ts and the kit skipped)
find src \( -name '*.ts' -o -name '*.tsx' \) ! -name '*.d.ts' ! -path 'src/components/studio/*' | while read -r f; do
  b=$(basename "$f" | sed -E 's/\.tsx?$//')
  case "$b" in main|index) continue ;; esac
  grep -rqE "/${b}(\.tsx?)?['\"]" src --include='*.ts' --include='*.tsx' || echo "DEAD $f"
done
```

The tool in its own `tool.html`? Then the build checks it only once that page is in the build input
(`install.md` § A tool entry of its own). Every line the colour grep prints is a colour in chrome:
move it to a token. Unused dependencies: compare `package.json` against
`grep -rhoE "from '[^'.][^']*'" src`.

## 5. Headless runs

For repeatable checks across many screens, drive the installed Chrome with
`playwright-core` (`chromium.launch({ channel: 'chrome' })` — no browser download):
console errors, the contrast audit in both themes, rendered-text contrast, and
thumbnails. A complete example: [scripts/qa.mjs](https://github.com/rueca/rueca/blob/main/scripts/qa.mjs).

## 6. Measure the reference too

When matching an effect from Figma or a screenshot, export the rendered node and sample
it. That is how a "glass" pill got solved: it turned out to *darken* a bright backdrop
(0.61×) but *brighten* a dark one (2.13×) — a pull toward mid grey — with edges 0.63×
the interior, i.e. a **dark** inner rim and no light catch. The guessed-first recipe
(bevel + top highlight + face gradient) is exactly what reads as brushed metal.

## 7. Count what shows at rest

At 1440×900, with nothing selected and only the default-open sections, list every control in view. For each,
note whether a preset changes it.
- The inspector fits without scrolling. Over about 12 rows, move the rows no preset touches to `more: true`.
- No control appears twice on screen (toolbar, inspector, context bar, transport).
- View preferences sit in `<SettingsMenu>`, not in the resting inspector.
- Every `more` row, off toggle and settings button shows the changed dot when something inside is off its default.

## Static checks only

When the person said not to run anything, or nothing can run (no shell, no browser), check what
reading can prove and name the rest:

- **Imports**: every import in the tool resolves to a file that exists, or that the kit install
  will create (`@/components/studio`, `rueca/notes-server/`). List those in the handoff.
- **The app is untouched**: `git diff --stat` (or your own list of edits) shows only the tool's
  files, plus the steps in `install.md` § The kit, not installed yet.
- **Read the source for the rules**: every param has a `hint`; colours only in the artwork (read the
  §4 grep's pattern and apply it by eye); no live values in an effect's dependency array; no edited
  lists in `useState`; `presetKeys` set when the schema holds an export size or a document.
- **Then the handoff's `Not run:` line**, one per skipped check, each with the command that runs it:
  ```
  Not run (told not to run anything): npm run build · contrast audit (qa.md §1, both themes) ·
  node <skill>/scripts/accent-check.mjs http://localhost:5273/tool.html · the comments check (§3)
  ```
