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
