# Break-it QA round (2026-10-09 evening) — triage
Evidence lives in scratchpad/breakit-<agent>/. Fix order: P0 → P1 → P2, kit before shells.

## dx (developer + agent experience)
| ID | Sev | Where | Problem | Fix |
|---|---|---|---|---|
| DX1 | P0 | params.ts setValue/sanitize; Surface.tsx FrameSurface studio:set | Wrong-typed value (bridge `studio.set('pad','30')`, share link `{"count":"x"}`) crashes the harness → blank; persisted, survives reload | Coerce/reject by def type in setValue + sanitize + bridge; ignore unknown keys; ErrorBoundary around Inspector & surfaces |
| DX2 | P1 | public/r/*.json registryDependencies | Hardcoded Pages URLs (404 today) — can't install from localhost/fork | Relative/namespaced deps or base URL from env in sync.mjs |
| DX3 | P1 | theme.css @layer base body + dark :root | In a shadcn app with no theme class the kit forces dark body/12px/cursor default onto the host app | Scope base rules to `.studio`; default light w/o class; document |
| DX4 | P1 | KIT.md §4 MountSurface | Docs destructure `values` like an object; it's a function → mount crash, blank page | Docs: `values()`; consider `getValues` |
| DX5 | P2 | Inspector number step | step defaults to 1 regardless of range: 0..1 param jumps 0↔1 | Infer step = niceStep(range/100); document |
| DX6 | P2 | FrameSurface setValue | Each bridge keystroke = undo step | commit:false + debounce commit |
| DX7 | P2 | history 200 vs params 100 limits | Dead undo steps after >100 edits | Share limit / drop orphaned steps |
| DX8 | P2 | history.undo with uncommitted store | commit during own undo emits edit → stale overwrite, lost doc step | Ignore commits during replay; re-read state |
| DX9 | P2 | bindItem when item deleted | Inspector shows stale values, edits create empty undo steps | null read → clear/disable item store, skip writes |
| DX10 | P2 | accent-check.mjs, visual-rules.md | Printed override uses `:root`; registry theme uses `:root:root` → no effect | Print `:root:root` (branding-owned files) |
| DX11 | P2 | Inspector folders/keys typed string[] | Bad folder id renders empty panel silently | `keyof S` + dev warning |
| DX12 | P2 | params.setValue | Unknown keys accepted → URL/LS pollution | Ignore + dev warn |
| DX13 | P2 | install.md | `@/components/studio` import only exists with full `studio` item | Document per-file imports or ship index in core |
| DX14 | P3 | Surface.tsx comment | "omit clock for static" wrong — animate defaults true (62 draws/s) | animate default = !!clock |
| DX15 | P3 | install.md | stale "loosely typed values; cast once" | delete |
| DX16 | P3 | misc | createParams no dup check; same-id stores fight; p.select not union; auto labels Title Case (should be sentence case); Brand → `#/`; KIT.md cites src/shells + research (not shipped); ParamControl def typing | fix each |
| DX17 | P3 | install.md | Kit-from-source needs resolve.dedupe react + Tailwind `@source` | document |
Held up: docs signatures typecheck; registry items install/compile/render (once URLs rewritten); plugin validate --strict passes; defineSchema/hotkey dup errors good. 84 undocumented exports (exports.tsv) — notable Toaster (toast() no-op outside Studio), TipProvider, useTheme, useStudio, useCanUndo, useParamState, useClock, fmtTime, statusbar.

## a11y (axe ×42 runs + keyboard walks; WCAG 2.2 AA)
| ID | Sev | Where | Problem | Fix |
|---|---|---|---|---|
| A1 | P1 | nodes Canvas.tsx:62 + hotkeys dispatcher | Bare `tab` binding + always-preventDefault → Tab dead in whole shell | `when` guard in shell; kit refuses/never preventDefaults bare tab/shift+tab |
| A2 | P1 | nodes, flows | No keyboard way to create a wire | Inspector "Source" select per input / keyboard connect mode |
| A3 | P1 | kit PaletteField special.tsx:314 | Remove colour = hover-only span in a button; not focusable, 14px | Real button / Remove in popover / Delete key |
| A4 | P2 | palette.tsx | ⌘K close → focus to BODY | capture activeElement, finalFocus |
| A5 | P2 | scrub.tsx | After edit Enter/Esc → focus BODY; edit input unnamed | refocus spinbutton; aria-label |
| A6 | P2 | Layers.tsx | no aria-level/setsize/posinset; rename drops focus; ⌥↑ un-nests silently, no keyboard nest; 2.5.7 needs pointer alt | aria-level etc; refocus; row menu Move up/down/into |
| A7 | P2 | theme --fg-faint | faint used for real text: 4.05 on white, 3.62 control, 3.43 field (light); 3.88 control (dark) — fails 4.5 | faint ≈ #6b6b6b light / #949494 dark; unchanged scrub values not faint (use muted); qa.mjs 4.5 for faint text |
| A8 | P2 | Switch, Slider | off-switch track 1.41:1, slider track ~1.4:1, thumb hidden at min (1.4.11) | 3:1 track border/edge; keep thumb visible |
| A9 | P2 | flows edges | focused edge indistinguishable; 22 edge tab stops first | :focus-visible edge style |
| A10 | P2 | color.tsx | SV area no role/keys; hex input unnamed; hue valuetext 0–100 | area role=slider 2D keys + valuetext; label; hue degrees |
| A11 | P2 | SizeFields link toggle; Tip | unnamed toggle; Tip doesn't name trigger | aria-label; Tip sets aria-label when child unnamed |
| A12 | P2 | Segmented/Tiles, PanelTabs | single-select as aria-pressed toggles not radiogroup; PanelTabs no roving/arrows/aria-controls | radio semantics; tabs pattern |
| A13 | P2 | slider.tsx | no aria-valuetext (reads 1450 vs "1.45s"); 2 unnamed video fields | getAriaValueText from fmt |
| A14 | P2 | KeyTimeline diamonds, KeyButton key vs edited, Inspector changed cue, flows status dots | state by colour only | shape/outline cues; role=img on dots |
| A15 | P2 | animate prev-key 14×24, scene view-cube 20px, generate add-to-selection 20px, journey 16px swatches/12px rows/14px add stage, batch 14px colour btn | target size 2.5.8 | ≥24px or spacing |
| A16 | P2 | CropOverlay | no single-pointer arbitrary crop size | W/H fields |
| A17 | P3 | KeyTimeline `]` | selects all keys at next time; no-op silently at end | per-lane key nav |
| A18 | P3 | journey link handles | 6px tab stops that do nothing | tabindex -1 (checkboxes cover it) |
| A19 | P3 | chrome motion | no motion-reduce in kit chrome | global reduced-motion rule for chrome transitions |
| A20 | P3 | misc axe | synth gridcell+aria-pressed; batch grid rows/photo listbox contain buttons; nested-interactive (animate, shader, journey); light focus ring on well 2.9:1; ImageDrop Space; batch grid swallows Enter on Pick colour | fix individually |
Held up: kit Dialog, Base UI Menu/Select, toasts live region, named controls in tab walks, focus ring on all kit controls, landing focus/reduced motion, 2.5.7 alternatives in envelope/tone curve/key time/clip fields/journey links.

## Fix log (2026-10-09 ~18:20)
DONE, verified:
- DX1 P0 — `coerce()` in schema.ts; every write path (setValue/patch/replace/presets/localStorage/share link/bridge) coerces or rejects; unknown keys ignored (DX12); dev logs reasons; schema defaults validated at startup. Repro replayed: bridge `'30'`/`12`/`'abc'`/bogus + poisoned link → UI alive, nothing bad persisted.
- ErrorBoundary per Studio region (kit/system/error-boundary.tsx): Try again / Reset saved settings / Reload.
- DX6 — bridge writes coalesce into one undo step (400ms).
- A1 P1 — nodes Tab guarded; kit drops unguarded bare Tab/Shift+Tab bindings (dev warning).
- A2 P1 — nodes inspector "Source" picker per input (connect/disconnect); flows inspector "Connect to" picker.
- A3 P1 — PaletteField: Remove in popover, Delete on swatch, 16px hover badge (no nested interactive).
- DX3 P1 — kit base styles scoped to `.studio`/`.pop`; page base moved to src/app.css; color-scheme off :root; no-class → follow OS.
- DX4 P1 — KIT.md MountSurface: `api.values()` is a function.
- DX2 — reclassified P2: `npm run sync -- --registry-url <host>` already exists; documented in install.md (404 only because Pages isn't deployed).
- install.md rewritten for namespaced tokens (no "import last"), per-file imports (DX13), fork/localhost (DX2), kit-from-source dedupe + @source (DX17); stale cast note removed (DX15).
INCIDENT: my theme.css edit left a stray `}` → CSS 500 from ~18:09–18:16; running QA agents warned to re-verify that window. Lesson for the skill: after editing theme.css, `curl` it from the dev server (or run qa.mjs on one shell) before moving on — an earlier spot QA passed on cached CSS.
NOT YET: flows "Connect to" picker not exercised in a browser test (typechecks; my test script clicked the wrong node). Remaining P1s from the 4 agents still running; all P2/P3 above.

## layout (viewports, themes, present mode)
| ID | Sev | Where | Problem | Fix |
|---|---|---|---|---|
| F1 | P1 | Studio.tsx present Esc (prio 0) vs shell `esc` (prio 10) | Esc doesn't leave present mode in 10/19 shells; "Show interface" button is opacity-0 | Present-mode Esc at high priority with `when: () => present`; make the exit button visible on hover/focus |
| F2 | P2 | present shell client branch | No `<Toaster/>` outside Studio → "Saved"/"Link copied" never show on phone | Mount Toaster + TipProvider in client branch (or make Toaster self-mount like DialogHost) |
| F3 | P2 | Stage HUD/overlays | ⌘\ leaves zoom pill, tool dock, minimap, gizmo, readouts on screen | Stage hud/overlay read `useStudio().present` and hide |
| F4 | P2 | flows @1024 | zoom pill overlaps ToolDock | dock respects pill / safe bottom-right |
| F5 | P2 | scene ≤1280 | stats readout under tool dock | move stats left / hide narrow |
| F6 | P2 | generate prompt bar 1024/1280 | Generate button overflows, summary truncates | min-w-0 / wrap / drop summary narrow |
| F7 | P2 | landing hero LiveShell phone | coach pill covers Shuffle/Download | re-check after landing rewrite |
| F8 | P2 (code-read) | z-index: popups z-[100] < Dialog z-[151] | Select/Menu/Tooltip inside a kit Dialog render behind backdrop | raise popup positioners (z-[160]) |
| F9 | P3 | Brand | long doc name truncates app name to "M…" | name span flex-none |
| F10 | P3 | dither HUD, component-lab ViewportFrame @1024 | clipped without ellipsis | truncate / icon-only |
| F11 | P3 | present ClientSheet | chevron direction inverted | swap |
| F12 | P3 | audit | hex in scene/local/Vec3Input.tsx; icon sizes/strokes vary widely (kit itself breaks the 14/1.5 rule); 8.5–9px text in ui-design/flows; ColorField unchanged hex in fg-faint; generate tile hover = base; radii 3–14px mix | update KIT §1 rule to reality or align |
Held up: theme flip mid-session; safe-area vars; no horizontal scroll; long/Arabic/CJK/emoji text; present + gallery on phone.
Desktop shells at 390px just squeeze (batch, journey, scene, video clip mid-control) — consider a "best on a larger screen" notice. 768 mostly usable.

## perf (production builds)
| ID | Sev | Where | Problem | Fix |
|---|---|---|---|---|
| PERF-1 | P1 | scene viewport dispose via MountSurface useEffect cleanup | Each scene visit leaks the scene + a WebGL context (OrbitControls removes keydown from detached root); after 16 visits Chrome drops contexts | MountSurface mount/dispose in useLayoutEffect; scene: orbit.disconnect() while attached + renderer.forceContextLoss() |
| PERF-2 | P2 | kit clock: rAF starts on import, never stops | 7 module clocks keep 421 rAF/s running on every page after visiting them | lazy start on first subscriber/play, stop with none |
| PERF-3 | P2 | clock idle ticks + useClockTime setT while paused; animate SceneView force() per tick | paused animate: 60 React commits/s (thousands of Tip renders) | no idle emits unless opted in; useClockTime skip unchanged t; SceneView bail on dt=0 |
| PERF-4 | P2 | landing eager kit chunk 812 KB raw / 259 KB gz (+193 KB index incl. framer-motion) | landing loads whole kit | narrow imports / manualChunks |
| PERF-5 | P2 | ui-design render/paint.ts imports react-dom/server (190 KB) | heavy chunk | createRoot+flushSync or serialise SVG |
| PERF-6 | P3 | landing hero iframe runs off-screen | | IntersectionObserver pause |
| PERF-7 | P3 | flows/nodes +2 ResizeObservers per visit | likely GC'd | low |
| PERF-8 | P3 | scene chunk 726 KB (three) | | accept / trim addons |
Held up: no other shell leaks DOM/listeners/GL/workers/AudioContexts; idle shells at 0 rAF/s; undo limits exist.
Not tested: hidden-tab path, scrub cost, scale (1000 layers etc.), undo memory.

## interaction agent
Stalled twice (watchdog) during heavy machine load (load avg ~480, >100 orphaned headless Chrome/Vite processes) — no report. Re-run later on a quiet machine.

## Machine note (2026-10-09 ~19:50)
Load average ~480. Many headless Chrome processes (playwright) left by QA agents. Killing them was not permitted by the auto-mode classifier — Rafael should close them (Activity Monitor → search "Google Chrome for Testing"/headless, or reboot) before the next QA round. Future QA briefs: each agent must close its browser in a `finally` and run at most one Chrome at a time.

## state (persistence, links, imports, exports) — reported 2026-10-09 ~20:00
| ID | Sev | Problem | Status |
|---|---|---|---|
| S1 | P0 | corrupt saved doc/ui keys white-screen shells on every load (module-level loaders, above Studio) | FIXED: route-level ErrorBoundary in gallery/App.tsx with "Reset saved settings" scoped to `studio:<shell>`; createDocStore `validate` hook + default `matchesShape(initial)` check; rejected docs parked at `<key>:rejected` (never destroyed); photo looks + scene ui loaders guarded. Repros (flows {}, motion presets {}, animate null, photo looks {}, scene ui null) all load. |
| S2 | P0 | imports that pass a shallow check get saved and kill the shell after reload | PARTLY: doc.replace() now refuses docs that fail validate/shape and throws (nothing persisted). TODO per shell: catch + toast on import; add real `validate` to each createDocStore (ui-design, video, journey, flows, generate). |
| S3 | P1 | non-array presets key crashes params shells | FIXED (Array.isArray + name guard) |
| S4 | P1 | p.data from share links white-screens shader/synth/photo | FIXED in kit: DataDef `validate` hook; share:false keys dropped from links. TODO: shader/synth/photo add `validate` to their p.data defs (they set share:true). |
| S5 | P1 | share link overrides later edits on every reload | FIXED: a link applies once per tab session (sessionStorage marker) |
| S6 | P2 | edit + immediate reload lost (debounce) | FIXED: flush on pagehide / visibilitychange (params + doc) |
| S7 | P2 | two tabs clobber each other | FIXED for params (storage event adopt when not mid-edit). Doc stores: TODO |
| S8 | P2 | shells' own LS writes swallow quota silently | TODO shells: route through kit (window event 'studio:storage-error') |
| S9 | P2 | batch CSV import has no type/size guard | TODO |
| S10 | P2 | photo/dither intake: no toast on reject, silent downscale | TODO |
| S11 | P3 | legacyKeys never removed; scan stops at first | FIXED |
| S12 | P3 | double quota toasts / silent forever after | FIXED: shared module flag, re-armed on success |
| S13 | P3 | present: `&client` appended repeatedly | TODO |
Held up: 40+ exports valid (zip CRC, WAV, PNG/SVG/JSON/CSV); garbage imports toast; version migrate works.
Not tested: MP4/WebM/GLB/.cube capture (machine overloaded).

## Also fixed this pass
- DX7/DX8 history: flush pending edits before undo, skip steps a store can't undo, ignore commits during replay.
- DX9 bindItem: orphaned item stops writing through.
