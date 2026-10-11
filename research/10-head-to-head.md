# Stress test + head-to-head vs Toolcraft and DialKit (2026-10-11)

Goal: Rueca (skill + kit) must be **equal to or better than** Toolcraft and DialKit on every task, and survive
hostile setups. Bench lives outside the repo in `~/rueca-bench/` (briefs in `shared/`, builds in `h2h/`,
blind copies + verdicts in `judge/`, break-it findings in `break/`).

## Summary
- **Head-to-head (blind, 5 tasks, out of 70): Rueca won all five** — mean 66.4 vs DialKit 59.0 and Toolcraft 47.2 —
  including DialKit's home turf (spring tuner 64 vs 60) and Toolcraft's (poster 67 vs 50). Client view (t5, /10):
  Rueca 8, DialKit 5, Toolcraft 2.
- **Effort to get there:** Rueca builders wrote ~265 lines where DialKit needed ~990 (t2) and hand-built 65–70% of
  each tool; Toolcraft's own delivery gates failed in every task (≈400 KB of process docs, a checker that rejects
  iframes and window listeners, phones blocked under 1024 px).
- **What broke Rueca (all fixed in the repo, not yet pushed):** a missing `mediabunny` dependency that failed every
  fresh build (hit by 6 agents); share links that dropped layer lists, froze on hostile values and overwrote the
  receiver's work; renaming a param wiped saved values; a slow inspector at 150 rows; undo splits; and the client
  view — the differentiator — was a shell pattern, not a kit component. Now: `ClientView` in the kit, touch density,
  full-snapshot undoable links, `migrate`, ~25 skill/install corrections. 76 tests.
- **Still open:** kit isolation (generic token/class names and `.dark` clash with host apps — a ~60-file change);
  strict-TS compliance (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`); timeline spans you can drag
  (DialKit had it); page → PNG export for wrapped pages (Toolcraft had it); slider keyboard steps; client-view re-test.

## Method
- **Head-to-head:** 5 tasks × 3 arms (Rueca / Toolcraft / DialKit), one builder agent each, same brief
  (`~/rueca-bench/shared/brief.md`), same fixture, ~40 min budget. Rueca arm used the skill as written with a
  local copy of the registry (rueca.dev is password-gated).
  - t1-motion — spring tuner for a motion/react card stack (DialKit's home turf)
  - t2-poster — generative poster: artboard, layers, inspector, undo, PNG 1×/2× (Toolcraft's turf)
  - t3-timeline — canvas animation with timeline, scrub, Space, export
  - t4-wrap — wrap an existing plain-HTML page without rewriting it
  - t5-configurator — three.js configurator: outliner, picking, expensive param on release, undo, share link, client view
- **Judging:** one judge per task, blind (apps relabelled A/B/C at random; key kept outside the bench), 8 weighted
  criteria out of 70 (`~/rueca-bench/shared/judge-brief.md`).
- **Break-it:** 5 agents follow the skill in hostile setups — other frameworks, broken/clashing environments,
  scale, a long 12-change session, trigger precision + adversarial input (`~/rueca-bench/shared/break-brief.md`).

## Results

### Blind verdicts (out of 70; letters unblinded here)
| Task | Rueca | Toolcraft | DialKit | Winner | Judge's one-liner |
|---|---|---|---|---|---|
| t2 poster | **67** (B) | 50 (C)* | 64 (A) | **Rueca** | Rueca: whole brief + both bonuses, share link + reload restore everything, most professional inspector, fewest axe issues, declarative code; flaws: Ctrl-wheel zooms 12× per event, no selection outline on canvas. DialKit: best canvas interaction (click-pick, hover/selection outlines) but "Version 1" clutter, 9 contrast failures, work only in the URL. Toolcraft: 2K/4K/8K not 1×/2×, link drops layer order/visibility, no own presets, ~650 KB gz runtime for a 2D poster |
| t1 motion (DialKit's turf) | **64** (B) | 40 (C) | 60 (A) | **Rueca** | Rueca: replays on release, timeline scrub shows the true mid-motion position (−11.25 px at 300 ms), undo after 45 edits, link restores; weakest: compare is a swap, not side by side. DialKit: honest labelled side-by-side compare, best readouts (damping ratio ζ, settle times), lightest bundle; no undo, stiffness snaps to a grid. Toolcraft: forced 2 s loop (no replay on demand, long springs cut off), no named save, 2.4 MB chunk, focus visible on 12/50 tab stops, 38k console warnings |
| t3 timeline | **66** (A) | 53 (B) | 51 (C) | **Rueca** | Rueca: bars sit exactly on each ring's real span, scrub ±5 ms, undo/link/reload, axe clean, every export frame-exact. DialKit: can drag a ring's bar to change stagger/duration (Rueca can't) but no undo, no link, real-time video ~20 ms late, 15+ axe issues |
| t4 wrap a page | **67** (C) | 49 (A) | 60 (B) | **Rueca** | All three pass the hard checks (hero.html byte-identical, live page edited, its own 600 px media query fires, copied CSS renders the same). Rueca: Figma-like stage with desktop + mobile side by side, full undo (11/11), texts editable on the page, proper phone layout; worst: defaults hard-coded (not read from the page), 9 contrast failures. DialKit: 158 kB gz, reads defaults from hero.html itself; no undo for style edits. Toolcraft: solid undo + PNG export, but 2.4 MB, irrelevant panel sections, blocks windows under 1024 px |
| t5 configurator | **68** (B) | 44 (C) | 60 (A) | **Rueca** | Client view /10: **Rueca 8**, DialKit 5, Toolcraft 2. Rueca: most professional, 0 axe violations; the only client view usable on a phone (swatches, finish/lighting choices, finger-draggable sliders without page scroll, Share sends the client's version back); weak: each arrow-key press on Detail is its own undo step, knot cropped at the sides on a 390 px portrait phone (fixture camera). DialKit: ~810 clear lines, exact undo per gesture; "Version 1"/copy clutter, 2 critical axe issues, client view read-only. Toolcraft: leftover template settings, selection changes in undo, 2.5 MB chunk, client.html "Not Found" in the production build. All three: 0 rebuilds during a Detail drag, 1 on release; picking ↔ outliner in sync; link restores in a fresh profile; 16.7 ms frames; every PNG export includes the blue selection box |
| **Total** | **332** | 236 | 295 | **Rueca 5 / 5** | Mean of 70: Rueca 66.4 · DialKit 59.0 · Toolcraft 47.2 |

\* the blind copy script dropped 3 Toolcraft source files (an over-broad `profile*` exclude); t2's judge scored
Toolcraft from the builder's own production build instead and didn't penalise it; t3's Toolcraft app is being re-judged.
Fixed and restored for every task. Toolcraft t3 (re-judged): exact scrub and 4K PNG/MP4 and undo, but spans are a small chart in the side panel, an 8 px scrub strip, a loop fixed at 3 s that cuts off longer reveals, 647 kB gz on ~158k lines of framework.

**Rueca gaps the judges named:** keyboard nudges (arrow keys) are one undo step each — coalesce like a drag; exports shouldn't include selection overlays (skill: hide selection when exporting); fixture camera crops on a portrait phone (frame the art as it exports — now in the skill); wrapping a page, read its current values as the defaults (DialKit did; a recipe or `readCssVars`); side-by-side compare (A/B is a swap); spring readouts (ζ, settle time) like DialKit's; Ctrl-wheel zoom step too large (one wheel event = 12×); no selection outline on the
artboard for the selected layer; no direct manipulation of timeline spans (DialKit had it).

## Builder friction log (as reported, then verified)
| # | Arm/task | Friction | Verified? | Fix |
|---|---|---|---|---|
| F1 | rueca/t2 | `core` item ships `video.ts` but not its `mediabunny` dependency → first `tsc -b` fails TS2307 | **yes**: sync's dependency regex misses dynamic `import('mediabunny')` (added in PERF-06) | sync: match `import(` too |
| F2 | rueca/t2 | `install.md` alias step: `baseUrl` + `paths` fails on TypeScript 6 (TS5101, deprecated) | to check | doc: `paths` only, no `baseUrl` |
| F3 | rueca/t2 | SKILL.md says `p.data` lists "undo, persist and share", but `p.data` defaults to `share: false` → layer stack silently missing from links | to check | doc (or default) |
| F4 | rueca/t2 | no recipe for a layer stack in params; `LayerTree` has no opacity; `EffectStack` has it but is pitched for fills | — | recipe in skill, or opacity on LayerTree |
| F5 | rueca/t2 | `bindItem` has no display scale (0–1 stored, 0–100 % shown) | — | `display`/scale option, or doc the read/write pattern |
| F6 | rueca/t2 | `Artboard` label already prints the size (undocumented); `Layers.tsx` lacks the usage header the docs promise | — | doc + header |
| F7 | rueca/t2 | stray `"cn"` npm dependency added on install | not from our registry JSON (likely shadcn CLI) | investigate |
| F8 | dialkit/t1 | no rename for saved versions, no side-by-side compare, saved versions come back flat (`"entrance.fromY"`), Copy gives agent-prompt JSON not pasteable code, edits silently overwrite the selected version | DialKit's own | — (where Rueca must stay ahead) |
| F9 | rueca/t1 | "pure function of (values, t)" rule has no answer for a self-timed component the agent can't rewrite (motion/react); the example it would copy (`src/shells/motion`) isn't shipped, only linked to a private repo | yes (links in layouts.md; repo private until launch) | recipe: live component + replay key, scrub optional |
| F10 | rueca/t1 | clock has no replay/seek event; had to infer from `onTick` jumps | to check | `onSeek` / restart event |
| F11 | rueca/t1 | qa.md counts `[role="slider"]` but the kit uses native range inputs → 0 found | yes (qa.md:88) | count `input[type=range]` too |
| F12 | dialkit/t2 | DialKit has no undo, no change/drag-end event, no canvas/layers/export; inline panel forces a "DialKit" title row; per-panel show needs undocumented `DialStore.setPanelOpen`; hidden in prod builds unless `productionEnabled`; fetches Geist Mono from Google | DialKit's own | ~70% hand-built (990 lines) vs Rueca's 15% (265 lines) on the same brief |
| F13 | toolcraft/t2 | Layers only come from uploaded media (seeding fixed layers needs a hand-generated `app-defaults.json`); `selectedLayer.opacity` reserved; conditions can't read the selection; export only 2K/4K/8K (1×/2× by sizing the canvas); AGENTS.md 252 lines → ~25 docs, no worked example; its own gates (`npm run test`, `ai:check`) fail on the scaffold's symlinks and on the unedited fixture | Toolcraft's own | ~380 lines, ~45 min, 9/9 |
| F14 | dialkit/t3 | DialKit's timeline expects clips that own their timing; derived timing (stagger × duration) needs hidden store paths read from the bundled source + a feedback-loop guard; no export, no keyboard transport (all hand-built); dock is a fixed overlay; roots render nothing in production without `productionEnabled`; `docs/` not in the npm package | DialKit's own | 7/7 |
| F15 | dialkit/t4 | defaults fixed at panel creation (must wait for the page before mounting); controls can't be hidden/disabled (undocumented config swap + cast); Copy emits DialKit setup code, not CSS (hand-built CSS export); unlabelled copy icon; 505 kB bundle | DialKit's own | 7/7, ~65% hand-built |
| F16 | toolcraft/t1 | integrity checker's opaque "lib.dom capability cannot be erased…" (bisected to slider-helper call count; inlined every slider); documented image-export controls crash as "reserved"; ~400 KB of docs to read; a browser proof row per control; own gates fail (26 acceptance items, 9 vitest failures) | Toolcraft's own | 4.5/5 |
| F17 | rueca/t3 | mediabunny again (video export fails at runtime without it); `baseUrl` on TS6 again; starter's `art(ctx, t/1000, w, h, v)` copied onto a fixture with `draw(ctx, w, h, t, v)` compiles and silently draws wrong; accent check can't seek to a representative frame, so a "greyscale PASS" on a blank frame means nothing | fixed / fixed / comment fixed / to do: `--seek` for accent-check | 6/6 + 3 exports |
| F18 | rueca/t4 | mediabunny again; `cssVars` too blunt (mirrors every scalar incl. texts onto the client page, no key filter, px only) → wrote 4 vars by hand; no Hand/Interact iframe shield component though architecture.md describes it; no phone layout (at 390 px the panel covered the stage) | fixed / to do: `cssVars: { keys, units }` / to do: ship the shield / client-view recipe | 6/6 |
| F19 | toolcraft/t3 | ~400 KB required docs (48 KB AGENTS.md, 40 KB acceptance doc, signed-file rules); Space-tap play not allowed (runtime owns Space-hold pan, no shortcut hook, `window.addEventListener` rejected by the code-health check); built-in timeline is play + scrubber only, a per-ring view needed a custom control the checker rejects with the opaque "lib.dom capability…" error; own gates fail | Toolcraft's own | 6/6 |
| F20 | dialkit/t5 | no commit/change-end event (apply-on-release and one-step-per-drag inferred from global pointerup + debounce); no undo, no link sharing; Copy is for developers, not clients; hard-coded "DialKit" title; version menu on every section; hidden in prod without `productionEnabled`. Client view hand-built (swatch, plain-word finish/light/detail, Save image / Share). Note: the fixture's camera crops on tall screens — affects every arm | DialKit's own | 8/8 |
| F21 | toolcraft/t4 | its code checker forbids iframe/object/embed in product code with no replacement (wrapping a page "impossible to do cleanly"; the website-bridge packages AGENTS.md names 404 on npm); 17 acceptance entries for an 8-control app; image export forced on (removing it needs a verbatim user quote); ~2,300 lines of rules; official `hero` example uses an API AGENTS.md now forbids; below 1024 px the app is replaced by "desktop only". **Gives that Rueca lacks:** PNG export of the wrapped page | Toolcraft's own; Rueca gap: page → PNG | 7/7 |
| F22 | rueca/t5 | **the kit has no client-view component** — the phone view was entirely hand-built; the skill's "`<Inspector published />` in a bottom sheet" gives 24 px rows and hex fields, wrong for a client's finger (kept only behind "Fine-tune"); mediabunny again; install.md `printf … >> index.css` lands after shadcn's final `}` with no newline → invalid `}@import`; `MountSurface` gives no help with retina sharpness | to do: ship a ClientView; fixed (leading \n); fixed; to do: DPR note | 9/9 |
| F23 | toolcraft/t5 | **Toolcraft blocks phones**: protected `main.tsx` shows "designed for desktop use" under 1024 px or on any mobile browser; client view had to be a separate `client.html` the production build doesn't output (needs the protected Vite config); ~450 KB process docs; scaffold fails its own integrity check (symlinks; then "Maximum call stack size exceeded"); no drag-end signal; panel feedback only as a red error box | Toolcraft's own | 8/8 (client view dev-only) |

Builder self-scores: dialkit/t1 5/5 · toolcraft/t1 4.5/5 · toolcraft/t3 6/6 (gates failing) · toolcraft/t4 7/7 (gates failing, desktop only) · toolcraft/t5 8/8 (client view not in the build) · rueca/t1 5/5 · rueca/t3 6/6 · rueca/t4 6/6 · rueca/t5 9/9 · dialkit/t2 10/10 (~990 lines) · rueca/t2 11/11 (~265 lines) · toolcraft/t2 9/9 (~380 lines, gates failing) · dialkit/t3 7/7 · dialkit/t4 7/7 · dialkit/t5 8/8.

## Break-it findings
Full reports: `~/rueca-bench/break/<id>/findings.md`.

### b5 — triggers, instruction quality, hostile input
| ID | Sev | Finding | Fix |
|---|---|---|---|
| B5-01 | P0 | Install + starter as written → Vite overlay; `tsc` and `vite build` fail: `core` ships `video.ts` (dynamic `import('mediabunny')`) without the dependency (= F1, three agents hit it) | sync regex matches `import(` |
| B5-02 | P1 | SKILL.md / architecture.md say `p.data` lists "share"; default is `share: false` → links and presets drop layers (= F3) | decide default; fix docs |
| B5-03 | P1 | A share link with `count: 3e9` on a number without `max` freezes the tool; values persist on load, so even a clean URL stays frozen until site data is cleared | clamp/sanity on link apply; don't persist a link until the first frame survives; artwork error path |
| B5-04 | P2 | `size`, `vec2`, `palette`, `multi` bounds not enforced on write (docs say every write is validated); 200000 px artboard via link | validate those kinds |
| B5-05 | P2 | saved values / preset with key `constructor`, `toString`, `__proto__` → blank page on every load (throws at module load, before any ErrorBoundary) | own-property checks in load/merge |
| B5-06 | P2 | "link from another version" toast fires before a toaster mounts → never seen; wording wrong for newer-version links | queue toasts until mount; reword |
| B5-07 | P2 | docs point to `src/shells/motion/`, `src/gallery/App.tsx`, `research/*.md`, repo `scripts/qa.mjs`, undefined `<skill>/` — none exist in an installed project (= F9) | ship or remove the pointers |
| B5-08 | P2 | "Build it every time" + trigger word "prototype" over-applies the harness | narrow wording |
| B5-09 | P3 | starter comment says `art` takes 3 args; call passes 5 | fix comment |
| B5-10 | P3 | top-level folders in `defineSchema` are required but undocumented | doc |
| B5-11 | P3 | FrameSurface posts values to any origin (`'*'`) — read in source, not exercised | target the frame's origin |
| B5-T | — | Triggers (judged from the description; `claude -p` was logged out): ~4 likely misses (tweak, sliders, knobs, editor, scrub, dial in, leva/tweakpane/dat.gui, p5, GUI), ~9 likely false fires ("let me test this", "make me a tool to", "instrument", "generator", "prototype", "journey map", "add controls to this"). Rewritten ~85-word description with a "Not for…" clause in the findings file | adopt after review |
| B5-C | — | Reading cost: SKILL.md + qa.md ≈ 4k tokens; + install.md ≈ 5.6k; layers + doc store ≈ 13k; everything ≈ 20k | — |

Held up: all 396 documented API names match installed exports (a ~120-call probe typechecks); install.md §A worked first try;
25 hostile share-link payloads (malformed/deep JSON, wrong types, script strings, CSS injection, `__proto__`/`constructor`)
caused no pollution, no script execution, no crash; the artwork error panel offers "Reset saved settings".

### b2 — hostile environments (existing shadcn app, monorepo, strict TS, registry down)
| ID | Sev | Finding | Fix |
|---|---|---|---|
| B2-01 | P0 | = F1/B5-01 mediabunny; dev server runs so it hides until `npm run build` (seen in 4 projects) | **fixed in repo** (sync detects `import(`) |
| B2-02 | P1 | `theme.css` defines generic names on `:root:root` (`--gutter --row --panel --line --grid --field …`) and redefines `--font-mono` → host app's own vars overwritten (its padding 24→12 px, colours changed). install.md claims the names are "namespaced … coexist" — false | prefix kit tokens, or scope them; fix the claim |
| B2-03 | P1 | class collisions both ways: host `.panel` gets the kit's shadow; host's `.panel` rule gives kit panels a 1px border + 4px radius. Same with `.pop` | prefix the kit's global classes |
| B2-04 | P1 | an existing component inside `<Artboard>` inherits the tool's text colour (#fff), Inter and dark `color-scheme` → white on white, brand font lost | Artboard resets inherited text styles |
| B2-05 | P1 | kit theme toggle and the app's dark mode both use `.dark` on `<html>` → toggling the tool re-themes the prototype; the app's ThemeProvider overrides the kit's saved choice on reload | kit theme on its own attribute/scope |
| B2-06 | P2 | theme toggle's first click does nothing when `<html>` has no theme class; choice lost on reload unless the install.md head script is added (SKILL.md never mentions it) | toggle reads computed state; no head script needed |
| B2-07 | P1 | in a React app with no `components.json`, the SKILL.md install line (`add … -y`) prompts, exits 0 and installs nothing (hangs in a terminal) | document `init` first / full flags |
| B2-08 | P1 | kit's `@custom-variant dark` turns the host's OS-following dark mode into class-based → page went white with OS dark | scope the variant |
| B2-09 | P1 | strict TS (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) → 345 errors in kit files, build fails | make the kit compile under both, or document a tsconfig exclude/override |
| B2-10 | P2 | ESLint: 154 errors (classic Vite config), 977 (`strictTypeChecked`); oxlint 103 warnings, passes | add an eslint-ignore line for `components/studio` to install.md |
| B2-11 | P1 | registry unreachable: the skill's can't-install path leaves the prototype unable to typecheck/build; the clause doesn't name "registry down" | can't-install path: keep the tool in a separate entry until installed, or say so |
| B2-12 | P3 | shadcn suggests an older shadcn version when the registry is down (misleading, shadcn's message) | note in gotchas |

Held up: no host files overwritten in an existing shadcn app (`components/ui`, `lib/utils`, `components.json`, `index.css`,
alias untouched) and its shadcn colours/controls render the same; `@import` after shadcn works; `verbatimModuleSyntax` +
`strict` compile clean; pnpm monorepo install from `apps/web` correct, root gives a clear `-c apps/web` error; dead
registry / dead npm fail cleanly; starter compiles and runs unchanged in both themes. Not tested: bun.

### b1 — hostile stacks (Next.js, Vue, React 18 + Tailwind v3, no build)
| ID | Sev | Finding | Fix |
|---|---|---|---|
| B1-01 | P1 | Next.js App Router: hydration error (#418) on every reload once values are saved or a link is used | skill: load the tool client-only (`dynamic(…, { ssr: false })`) |
| B1-02 | P1 | Next: theme lost on reload — the flash-fix script lives in an `index.html` Next doesn't have | skill: script in `layout.tsx` + `suppressHydrationWarning` |
| B1-03 | P0 | = mediabunny (4th agent) | fixed in repo |
| B1-04 | P2 | `shadcn add -y` with no `components.json` prompts / exits doing nothing (= B2-07) | SKILL.md now routes to install.md |
| B1-05 | P2 | Next: theme.css import path wrong from `src/app/globals.css` (needs `../`) | Next bullet |
| B1-06 | P0 | React 18 + Tailwind v3: the skill's `shadcn init -p nova` rewrites the user's `index.css` with v4-only CSS → their own app stops building | requirement line: React 19 + Tailwind v4 or route B; never init in a v3 project |
| B1-07 | P1 | Tailwind v3: builds green, renders unstyled, no warning | same |
| B1-08 | P1 | React 18 types: ~35 TS errors in kit files (lucide icon types vs `@types/react` 18); runtime fine | same |
| B1-09 | P2 | Vue via route B works well (~3 lines in the Vue app; values, undo, reload carry) but route B has no timeline/export and the skill doesn't say so → copying the starter ships a dead timeline + Export | say what route B gives up |
| B1-10 | P3 | bridge accepts messages from any origin | check origin |
| B1-11 | P1 | no-build §C: inlining theme.css minus `@theme inline` deletes `--font-ui` / `--font-mono` → chrome in Times | fonts on `:root`, or ship a plain-CSS theme for §C |
| B1-12 | P2 | §C: `.panel`, `.tabular` etc. left in v4-only syntax, silently absent | same |
| B1-13 | P1 | "no npm": SKILL.md says both "never hand-build" and "go to §C (hand-built)" with no rule for which wins | clarify |
| B1-14 | P3 | skill's `assets/theme.css` drifted from the kit's copy | sync it |

Held up: React 18 runtime itself was clean; the Vue route is a good answer.
Honesty: the skill never says React 19 + Tailwind v4 are hard requirements, never mentions Next/SSR, and doesn't say
what route B or §C give up.

### b3 — scale and unusual subjects (150 params, WebAudio synth, 10k points at 4K, drag during 60 fps)
| ID | Sev | Finding | Number | Fix |
|---|---|---|---|---|
| B3-S1 | P0 | = mediabunny (5th agent) | — | fixed |
| B3-S2 | P1 | every Inspector row re-renders on each change | 4.7 ms/move at ~55 rows, 15 ms at 150 rows; task 20.9 ms > 16.7 budget | per-row subscriptions (selector per key) |
| B3-S3 | P1 | a focused text field + slider drag = 2 undo steps (blur-commit records the slider's mid-drag value) | 12/12 | text field commits its own key only / commit before the drag starts |
| B3-S7 | P1 | `CanvasSurface` backing = artboard × DPR regardless of zoom; past ~8k px the preview goes blank and export fails | 10000² at DPR 2 → 20000² canvas, blank; "Could not encode PNG" | cap backing at the visible size × DPR; export in tiles or clamp with a message |
| B3-S8 | P1 | `useHoldKey` bypasses the hotkey dispatcher → a tool's T also flips the theme (docs say the tool's T wins) | 2/2 | route hold keys through the dispatcher |
| B3-S4 | P2 | undo silently capped at 100; `historyLimit` undocumented | heap +0.6 MB / 500 edits | document |
| B3-S6 | P2 | folders can't nest (type error); long values truncate in the 56 px value column ("-0.02...") | — | doc; wider/auto value column |
| B3-S9 | P2 | audio fits but no guidance; "pure function of (values, t)" doesn't apply; log knob shows "1800.00Hz" | — | an audio line in the skill; smarter number format |
| B3-S5 | P3 | share link is uncompressed base64 JSON | 3,028 chars (150 changed), 6,319 with 3 kB text; round-trips | compress (deflate) when long |

Held up: typing ~0.1 ms/key and one undo step per word; first load 432–484 ms; localStorage 5.6 KB (170 KB with 30 presets);
synth needed no canvas; 10k points pan/zoom at 16.7 ms with no redraw during camera moves; 2× export of 7680×4320 in
223 ms; dragging during a 60 fps animation held 16.7 ms frames and one undo step per drag.

### b4 — a long session: 12 change requests + contradictory rules
| ID | Sev | Finding | Fix |
|---|---|---|---|
| B4-F1 | P1 | = mediabunny (6th agent) | fixed |
| B4-F2 | P1 data loss | renaming a param + bumping the version (as the skill says) silently wipes all saved values; params have no `migrate`; storage key format undocumented | `createParams({ migrate })` for old values and old links |
| B4-F7 | P1 | any version bump drops old share links entirely; upgrading needed the undocumented `#p=`/`$v` format + a hand-written `migrateLink` | same `migrate` |
| B4-F6 | P1 | = B5-06 version toast lost | fixed |
| B4-F5 | P1 | = p.data share default | fixed |
| B4-F3 | P2 | Inspector moved left defaults to 240 px (not 280) → size fields cut off ("W 1…") | same width both sides |
| B4-F4 | P2 | no keyframe recipe; `KeyTimeline` lacks its promised usage header, has no play/pause, no helper to sample keys | recipe + `sampleKeys` helper |
| B4-F8 | P2 | client view gets one sentence of guidance; bottom panel 236 px wide on a 390 px phone; client has no undo; example links 401/404 (site gated, repo private) | client-view recipe; full-width sheet; links live at launch |
| B4-F9 | P2 | accent check's answer depends on the current palette on a generator (defaults "keep blue", user's look "magenta"); correctly rejected brand pink near the record red | run across presets |
| B4-F10 | P2 | "no localStorage": store-wide `persist: false` is only in the types, not the docs; doesn't cover presets, theme or section state (tool still works with storage blocked) | doc + one switch |
| B4-F11 | P3 | "I want my own sliders": the skill only says never; the supported middle path (native sliders bound to the store keep undo/presets/links) isn't mentioned | mention it |

Held up: undo exact after all 12 steps; typecheck + build after every step; bad/renamed/removed keys dropped one by one,
never a crash; presets across versions; video export (two MP4s, 240 frames, progress + Cancel); two artboards; layers;
theme toggle; accent check; touch dragging on a phone.

### b6 — the client view on phones (Chrome emulation + real Mobile Safari, iPhone 17e simulator)
Interrupted by the crash after 14 findings; the comparison table and perf/a11y passes were not finished.
| ID | Sev | Finding | Status |
|---|---|---|---|
| C1 | P1 | the phone opens on the gallery's "Best on a desktop" alert, over the client view | **fixed**: `<ClientView>` marks `<html data-studio-client>`, the notice stands down |
| C2 | P1 | a phone sideways or an iPad gets the full designer view (every unpublished knob) | **fixed**: phone query covers landscape (`max-height: 500px and pointer: coarse`); share menu adds "Copy client link" so a client's link carries the view |
| C3 | P1 | from a client link on a tablet, one tap ("Back to designer view") opens the designer tool | **fixed**: a `&client` link forces the client view; no exit offered |
| C4 | P1 | links carry only changed values, merged over the receiver's saved ones → the designer sees values the client never chose | **fixed**: a link is the whole shared design (omitted shareable keys = defaults). Test |
| C5 | P1 | opening the client's link on the designer's machine overwrites their saved work, not undoable | **fixed**: the link applies as an "Open link" undo step on load. Test |
| C6 | P1 | real Safari: focusing a 12 px field zooms the page and leaves it zoomed; QWERTY keyboard | **fixed**: 16 px inputs in the client view; number pad on touch (when values can't go negative) |
| C7 | P1 | the download isn't what the client tuned (drawn in CSS px, 2.8× wider export; frame not previewed) | **fixed**: Client demo shows the chosen frame on an artboard at export size, fitted; skill says "frame as it will export, draw in output units" |
| C8 | P2 | the sheet covers 48–65 % of the art | **improved**: art keeps the space above (beside, in landscape); inspector capped at 32 dvh; collapsible |
| C9 | P2 | 15 controls under 44 px in the "big touch targets" view | **fixed**: `.studio-touch` — 48 px rows, 36 px controls and icon buttons, 44 px reach on switches and thumbs |
| C10 | P2 | a vertical swipe on a slider changes the value; rotation mid-drag slams it to min | **fixed (swipe)**: thumb-only sliders on touch, tracks `touch-pan-y`; rotation not handled |
| C11 | P2 | pinch on the art zooms the whole page; the page rubber-bands | **fixed**: art `touch-action: none`, `overscroll-behavior: none` while the client view is up |
| C12 | P2 | "Send to designer" only copies; no share sheet; "Saved" toast before Safari's prompt | **fixed (send)**: `navigator.share` on touch, copy elsewhere; Download toast timing unchanged |
| C13 | P2 | an older-version link shows the client the wrong artwork with a 6 s toast | improved: `migrate` carries old links; toast now actually shows (queued) |
| C14 | P3 | seed field announced "Seed" under the "Arrangement" row; sheet not a landmark | **fixed**: SeedField takes the row label; sheet is `<section aria-label="Controls">` |

**Kit addition: `ClientView` + `useClientMode` + `clientLink`** (src/kit/layout/ClientView.tsx), and the Client demo
shell now uses it. Before this the "client view" was a shell-only pattern: the t5 Rueca builder had to hand-build its
phone view (F22) because the skill pointed at `<Inspector published />` in a bottom sheet (24 px rows, hex fields).
For comparison: Toolcraft blocks phones outright (F23: "designed for desktop use" under 1024 px, client page left out of
the build); DialKit has no client view (F20 hand-built one).

### Trigger gap (reported by the "Logo fanning animation" session)
An agent sketching a logo animation decided on its own that it needed controls and hand-built sliders, a scrubber and
replay — the skill never fired, because the description only matched a user ASKING for controls. Fixed: the description
now also fires "unasked when sketching an animation, logo or brand motion, or any visual for someone to react to, and
whenever you start hand-adding sliders, a scrubber or a replay button", and the exclusion reads "a slider or animation in
a live site" (1,005 chars). New evals, 1 run each:
| Case | With skill | Without | Δ |
|---|---|---|---|
| implicit-motion-study (should fire unasked) | 1.00 — fired; kit params + clock + timeline, judges PASS ×3 | 0.25 | **+0.75** |
| no-trigger-shipped-animation ("make the hero logo spin") | 1.00 — did not fire | 1.00 | 0 |
| no-trigger-unrelated (typo fix) | 1.00 — did not fire | 1.00 | 0 |
Kit note from the same session: keys are flat across folders — now documented in KIT.md.

## Fixes so far (in the repo, not yet pushed; the bench keeps testing the frozen 50a299e copy)
- **mediabunny** (F1/B5-01/B2-01/B1-03): `sync.mjs` now also reads dynamic `import('…')`; `core` lists `mediabunny`.
- **`p.data` shares by default** (F3/B5-02): all three shells that use it already opted in; docs and kit-api updated
  ("presets skip data values unless listed in `presetKeys`"). Test added.
- **Hostile link can't brick the tool** (B5-03): a link's values are saved (and the link marked seen) only after the
  page paints 4 healthy frames. Test added.
- **Bounds** (B5-04): vec2/vec3/size clamp to min/max, palette trims to `max`, multi dedupes and honours `min`. Test added.
- **Object-method keys** (B5-05): the def index has no prototype, so `constructor` / `toString` keys are ignored. Test
  added (fails without the fix).
- **Version toast** (B5-06): queued until a toaster mounts; separate wording for newer-version links.
- **FrameSurface** (B5-11): values posted only to the `src` origin.
- **Skill text**: new description with "Not for…" (B5-T), "build the harness when someone wants to feel or tune",
  starter comment fixed (`art(ctx, t, w, h, v)`), "top level is always folders", self-timed components recipe (F9),
  can't-install path names "registry unreachable" and keeps the app building via a separate entry (B2-11), build once
  after installing, stack routing (React 19 + v4 → kit; React 18 / v3 / Vue / Svelte / don't-rewrite → harness app
  with FrameSurface; no npm → §C is the one hand-built case) (B1-06/13).
- **install.md**: requirements line, no `baseUrl` (F2), no-`components.json` case (B2-07), Next.js bullet
  (B1-01/02/05), strict TS + lint honesty (B2-09/10), what route B gives up (B1-09), §C keeps fonts and rewrites
  `@utility` as plain classes (B1-11/12).
- **Dangling pointers** (B5-07/F9): KIT.md links the Motion shell live + source; gallery/research pointers removed;
  qa.md defines the skill folder, links qa.mjs, counts `input[type=range]` (F11).
- **Hold keys** (B3-S8): `useHoldKey` goes through the one dispatcher, so priority holds (a tool's held T beats the
  kit's theme T; photo/dither's held `\` no longer also toggles A/B). Test added.
- **Text field undo** (B3-S3): commits only a real edit, and commits it on the next pointerdown anywhere (capture) —
  before the slider underneath starts its drag. Rows that merely had focus no longer split a drag into two steps.
- **Inspector speed** (B3-S2): each row subscribes to its own value (+ booleans for `when` / `disabled`), memoised,
  so a drag re-renders one row instead of all. QA 38 routes: 0 console errors (component-lab's 3 low-contrast "Aa"
  are its contrast-demo swatch from the Lámina redo, not this change).
- **`migrate`** on createParams (B4-F2/F7): carries values saved under an older version (incl. the unversioned key)
  and links made before a bump; without it a bump still starts fresh. Tests added. Storage key, link format,
  `persist: false` and `historyLimit` documented (B4-F10, B3-S4).
- **`cssVars`** (F18): `keys` filter and per-key units.
- Left-side inspector width documented (B4-F3).
- **Spring readouts** (t1 judge): `SpringEditor` shows feel + damping ratio ζ, overshoot and settle time, and plots the
  whole motion (no 2 s cut-off); `springStats()` exported. Test.
- **Side-by-side A/B recipe** documented (`state.compare` + `CompareSplit layout="side"`).
- **Client view**: `ClientView` / `useClientMode` / `clientLink`, touch density, share-menu "Copy client link", links as
  full snapshots + undoable on load, desktop notice stands down — see b6 above.
- **`readCssVars(doc, keys)`** (t4 judge): a wrapped page's current custom properties become the tool's starting values. Test.
- **Wheel zoom** (t2 judge): one Ctrl/⌘+wheel event is capped at ~1.35× (was 2.7× a notch, 12× for a big delta); pinches unchanged.
- **Arrow-key nudges** (t5 judge): a run of presses is one undo step (live while repeating, committed 500 ms after the last or on blur).
- Skill: "exports are the artwork only" (t5: every PNG included the selection box).
- `npm run check` green: 76 tests.

## Planned: kit isolation (one change, after the bench)
B2-02/03/05/08 share a cause — the kit assumes it owns the page. Raw tokens on `:root` with generic names (`--panel`,
`--line`, `--gutter`, `--row`…), global utility classes (`panel`, `pop`, `cluster`), the theme on `.dark` / `.light`
on `<html>`, and a global `@custom-variant dark`. Plan: raw tokens → `--studio-*`, utilities → `studio-*`, theme on
its own attribute (`data-studio-theme`), no `@custom-variant` in the registry copy, Artboard resets inherited text
styles (B2-04). Touches ~60 files in kit + shells; landing has its own tokens and is left alone.
