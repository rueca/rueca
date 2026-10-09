# Gotchas — all encountered for real

Check here before debugging.

## Environment

| Symptom | Cause / fix |
|---|---|
| `rafCallsIn600ms: 0`, nothing animates | `document.hidden` — browsers suspend rAF in background tabs. Environment artifact, not a bug. Don't chase it. |
| rAF crawls (2 frames / 1.5s) in an embedded preview pane even though `document.hidden` is false | Preview panes throttle. Verify motion by `clock.seek()` + sampling, never by waiting. |
| New component's classes don't apply (padding / size silently 0) | Tailwind v4 + Vite dev: classes used only in files created after the server started may not reach the served CSS. Restart the dev server (or touch the CSS entry) after creating new files. |
| `npx shadcn init` hangs | It's interactive. Pass `-y`, or write the files directly — they're just source. |
| Fonts silently fall back | Chrome blocks `@font-face` over `file://`. Serve over HTTP. |
| TS error about `baseUrl` | TypeScript 7 removed it. `paths` must be relative (`"./src/*"`). |

## Layout

| Symptom | Cause / fix |
|---|---|
| Artifact starts mid-scroll on reload | Browsers restore a scroller's offset *asynchronously* after load. `history.scrollRestoration = 'manual'` and pin `scrollTop = 0`. |
| A thin bar renders at 0px | Column-flex child; content overflowed and `flex-shrink` ate it. Use `flex: 0 0 <h>`. |
| Icon buttons squeezed on phones | Fixed-size items in a flex row need `shrink-0`. |
| Segmented labels truncate | 3+ options in a 280px inspector. Auto-switch to a dropdown when total label length is long, or go icon-only with tooltips. |
| Vertical gutter bigger than horizontal | Two owners both adding margin. One gutter on the shell, flush islands. |
| Canvas camera won't pan over an iframe artboard | Iframes swallow wheel / pointer. Hand vs Interact mode with a transparent shield. |
| Page scrolls sideways at 375px | A grid with `minmax(340px, 1fr)` plus padding. Use `minmax(min(340px, 100%), 1fr)`. |

## Colour and theme

| Symptom | Cause / fix |
|---|---|
| Active pill invisible | Its background equals its own well. Four surfaces — see `visual-rules.md` §2. |
| Toggled icon button invisible in light theme | `--raised` (white) on a white panel; use `--active`. |
| Slider track invisible in dark | Track darker than the panel. Dark grooves go lighter. |
| Light theme looks grubby | Dark-theme shadow opacities carried over. Halve them or more. |
| Theme flashes on load | `class="dark"` hardcoded in HTML, or theme resolved after first paint. Resolve in an inline `<head>` script. |
| Brand font vanished from the artboard | Artboard text reads `--font-sans`; chrome font change propagated. Give the artboard its own token. |
| Faint text fails contrast on fields | Checked against the panel only. Also check against `--input`. |

## Rendering and effects

| Symptom | Cause / fix |
|---|---|
| Slider drag snaps the artifact back / restarts the animation | Live values in the rAF effect's dep array. Mount once, read from refs. |
| Clicking an option shows nothing | The effect only plays in the intro. Replay on mode change. |
| `backdrop-filter: blur()` does nothing | Blurring a flat colour returns the same colour. Use `contrast()` / `brightness()` on flat ground. |
| A "flash" is invisible on white text | White can't get whiter; `brightness(1.2)` on `#fff` is a no-op. Use a `text-shadow` bloom. |
| Element reads as metal, not glass | Face gradient + top-light / bottom-dark bevel is the brushed-metal recipe. Glass is an even face plus edge optics. Measure the reference (`qa.md` §5). |
| Sliders sticky, text selects while dragging | `user-select: none` on the shell (`no-select`). |
| Whole script dies on init | Duplicate `id` between a control and a DOM node — `getElementById` returns the wrong one. Scope lookups or use refs. |

## Types and state

| Symptom | Cause / fix |
|---|---|
| `ParamStore<Specific>` not assignable to `ParamStore<any>` | Declare store APIs with method syntax (bivariant), not arrow-property syntax. |
| Option shows as `solid` in the UI | Capitalise for display, keep the raw value. |
| Timeline disagrees with the render | Lanes hand-maintained. Derive them from the render maths. |
