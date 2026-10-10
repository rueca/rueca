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
| Brand font vanished from the artboard | Artboard text reads `--font-ui`; chrome font change propagated. Give the artboard its own token. |
| Faint text fails contrast on fields | Checked against the panel only. Also check against `--control`. |

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
| A preset reset values it shouldn't (the pattern, the canvas size) | Presets used to replace everything. Kit presets merge by default; set `presetKeys` so "Save preset" only captures the look. |
| Settings silently stopped saving | An image (data URL) in params blew the localStorage quota. `p.image()` is persist/share-off by default; keep photos out of params. The kit toasts once on a storage failure. |
| Saved values from an old version break the shell | Bump `version` in `createParams` / `createDocStore` when the schema's shape changes. |

## Keyboard

| Symptom | Cause / fix |
|---|---|
| A shell's T (Text tool) does nothing | The theme toggle took it. Shell bindings default to priority 10 and kit defaults to 0, so this resolves itself — if it doesn't, pass `{ priority }`. Dev builds warn on duplicate bindings. |
| Space plays the timeline AND pans the canvas | Two owners. `<Stage fill>` no longer listens for Space; `<Timeline hotkeys={false}>` when the shell drives its own transport. |
| Space "clicks" the focused button instead of playing | Intended: Space/Enter on a focused button belong to the button. |
| `?` sheet never opens | `shift+/` never matched — the produced key is `?`. Bind `'?'`. |
| ⌘↵ does nothing in a text field | The field swallowed every key. Kit fields don't; global single-key shortcuts already ignore typing targets. |

## Environment and tooling

| Symptom | Cause / fix |
|---|---|
| A new component renders with no padding / zero size | Tailwind v4 dev server missed classes from files created after it started. Restart the dev server after adding files. |
| Animation frozen in the preview pane | rAF throttled in a hidden or background pane. Verify by stepping the clock (`clock.seek`) and sampling, or in headless Chrome. |
| Canvas won't pan over an iframe artboard | Iframes swallow wheel and pointer events. Use a Hand vs Interact mode with a transparent shield over the frame (see the Drop-in shell). |
| `<a> cannot contain a nested <a>` | `Brand` links the mark home itself — pass a plain glyph. |
| Parallel agents' tests interfere | Each agent needs its own dev-server port, its own headless-Chrome debugging port and profile, and its own scratch folder. Shared `cdp.mjs` / port 9333 collisions happened. |
| `tsc` complains about `baseUrl` | TypeScript 7 removed it; `paths` must be relative (`"./src/*"`). |

## Learned from the break-it QA round

| Symptom | Cause / fix |
|---|---|
| Shell white-screens on every load after a bad import / old version | A wrong-shaped saved doc. Give `createDocStore` a `validate` (the kit falls back to a shape check), guard hand-rolled `localStorage` loaders (`Array.isArray`, key checks), and wrap each route in an `ErrorBoundary` with `resetPrefix`. |
| A framed prototype sending `"30"` blanked the harness | Values weren't validated. The kit now coerces/rejects every write — don't bypass it with `store.setState({ values })`. |
| Esc doesn't leave present mode | A shell bound Esc at a higher priority. Kit present-Esc now runs at priority 100 with `when: present`. |
| Tab key dead in a shell | A bare `tab` hotkey. The kit drops Tab bindings without a `when` guard. |
| Leaving a three.js shell leaks a WebGL context | Disposing after React removed the DOM: OrbitControls unbinds from a detached root. `MountSurface` now disposes in a layout effect; also call `renderer.forceContextLoss()`. |
| Gallery burns CPU after visiting animated shells | Module-level clocks ran rAF forever. Clocks now start on the first `onTick` and stop with none. |
| Untouched values / captions fail contrast | Faint is for non-essential text only; values use muted. QA asks 4.5:1 of faint text. |
| Editing `theme.css` broke every page silently | One stray `}`. After editing CSS, `curl` it from the dev server or run `qa.mjs` on one shell before moving on — a spot check can pass on cached CSS. |
| Parallel test agents bring the machine to a crawl | Close the browser in `finally`, one Chrome per agent, and keep heavy repos out of synced folders (Google Drive / iCloud Documents re-sync every `node_modules` change). |
