# QA — measure, don't look

Screenshots confirm layout. They do **not** confirm colour, contrast, timing or
geometry. Run these after any restyle and before claiming it works. Then state plainly
what you verified versus what you only looked at.

## 1. Contrast audit, both themes

Paste in the browser console (adjust token names if hand-built). It catches the whole
class of "the active state looks wrong" bugs before the person sees them.

```js
const root = document.documentElement
const V = n => getComputedStyle(root).getPropertyValue(n).trim()
const parse = c => { const d = document.createElement('div'); d.style.color = c
  document.body.appendChild(d)
  const m = getComputedStyle(d).color.match(/[\d.]+/g).map(Number); d.remove(); return m }
const lum = r => { const f = r.slice(0,3).map(v => { v /= 255
  return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4) })
  return 0.2126*f[0] + 0.7152*f[1] + 0.0722*f[2] }
const ratio = (a,b) => +(((Math.max(lum(a),lum(b))+0.05)/(Math.min(lum(a),lum(b))+0.05))).toFixed(2)

const fails = []
for (const theme of ['dark','light']) {
  root.classList.toggle('light', theme === 'light'); root.classList.toggle('dark', theme === 'dark')
  const g = n => parse(V(n)), panel = g('--panel')
  ;[['well/panel',              g('--well'),      panel,                 1.08],
    ['track/panel',             g('--track'),     panel,                 1.15],
    ['ACTIVE PILL raised/well', g('--raised'),    g('--well'),           1.3],
    ['active/panel',            g('--active'),    panel,                 1.12],
    ['button label (WCAG AA)',  g('--signal-fg'), g('--signal-strong'),  4.5],
    ['accent fill/panel',       g('--signal'),    panel,                 3],
    ['fg-faint/panel',          g('--fg-faint'),  panel,                 3],
    ['fg-faint/input',          g('--fg-faint'),  g('--control'),          3],
    ['fg-muted/panel',          g('--fg-muted'),  panel,                 4.5],
    ['fg/panel',                g('--fg'),        panel,                 7],
  ].forEach(([n,a,b,min]) => { const r = ratio(a,b); if (r < min) fails.push(`${theme}: ${n} ${r} < ${min}`) })
}
fails.length ? fails : 'ALL PASS (both themes)'
```

Surface-to-surface minima are heuristics (WCAG doesn't govern them); the text ones are
real WCAG AA. Enforce both. Also sample *rendered* chrome text against its first opaque
background — a token can pass while a component uses the wrong one.

## 2. Accent clash, both themes

The contrast audit proves the accent is legible on the *chrome*. This proves it is
legible on the *work*, where the selection outline actually sits (rule and fallbacks:
`visual-rules.md` §3).

```bash
npm i -D playwright-core            # once; uses the installed Chrome
node <skill>/scripts/accent-check.mjs http://localhost:5173/#/my-tool
node <skill>/scripts/accent-check.mjs <url> --artboard "#preview"   # if it picks the wrong element
```

It finds the artboard (`--artboard` selector → the kit's `[data-studio-artifact]`
hook → `.font-artboard` on older kits → the largest canvas/iframe/media on hand-built
pages → the whole stage), hides all chrome including floating panels,
and screenshots what's left. Rendered pixels work the same for DOM, SVG, Canvas,
WebGL and iframes. Then it buckets the pixels by OKLCH hue and checks the accent
against them and against `rec`, `key` and `ok`.

```
dark  artboard canvas.block.h-full (largest media) · chromatic hues 240° 21%, 250° 18%, 30° 16% · accent 249°
      CLASH — too close to artboard hue 240° (21%), artboard hue 250° (18%)
      → switch to magenta (clears everything by 53°)
```

Exit code: 0 pass, 1 clash (it prints the override CSS to paste), 2 couldn't run.
If it reports "whole stage" for a single-artboard tool, pass `--artboard`, because the
stage background then dilutes the sample.

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
- **A11y** — count `[role="radio"]`, `[role="slider"]`, `[role="spinbutton"]` to
  confirm real primitives rather than divs; tab through — hover-only affordances must
  appear on focus.
- **Truncation** — labels and segmented options must not ellipsise at the inspector
  width.
- **Phone** — if there is a client view, load it at 375px: no horizontal scroll, icon
  buttons not squeezed.
- **Console** — zero errors and zero React key/act warnings.

## 4. In the shell

```bash
# theme leaks — the theme file and the artifact are the only legal homes for a colour
grep -rnoE "#[0-9a-fA-F]{3,8}\b|rgba?\(" src --include=*.tsx | grep -v -e artifact -e theme.css

# dead modules: files nobody imports
for f in $(find src -name "*.ts" -o -name "*.tsx"); do
  b=$(basename "$f" | sed -E 's/\.tsx?$//'); [ "$b" = main ] || [ "$b" = index ] && continue
  grep -rqE "/$b['\"]" src --include=*.ts --include=*.tsx || echo "DEAD $f"
done

# prove it compiles AND bundles — both, every time
npx tsc --noEmit && npx vite build
```

Unused dependencies: compare `package.json` against `grep -rhoE "from '[^'.][^']*'" src`.

## 5. Headless runs

For repeatable checks across many screens, drive the installed Chrome with
`playwright-core` (`chromium.launch({ channel: 'chrome' })` — no browser download):
console errors, the contrast audit in both themes, rendered-text contrast, and
thumbnails. The kit repo's `scripts/qa.mjs` is a complete example.

## 6. Measure the reference too

When matching an effect from Figma or a screenshot, export the rendered node and sample
it. That is how a "glass" pill got solved: it turned out to *darken* a bright backdrop
(0.61×) but *brighten* a dark one (2.13×) — a pull toward mid grey — with edges 0.63×
the interior, i.e. a **dark** inner rim and no light catch. The guessed-first recipe
(bevel + top highlight + face gradient) is exactly what reads as brushed metal.
