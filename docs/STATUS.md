# Status — where we left off (2026-10-09, afternoon)

Start here when resuming. Also read `docs/SESSION-CONTEXT.md` (who/what/decisions) and
`research/07-kit-gaps.md` (the consolidation backlog).

## How to look at it
```bash
npm run dev            # http://localhost:5273  → landing · #/shells → gallery · #/<id> → a shell
node scripts/qa.mjs    # headless Chrome QA: console errors + contrast, both themes, refreshes thumbnails
npm run sync           # regenerate skill references, registry (public/r), plugin manifests
npm run check          # sync --check + tsc (what CI runs)
```
Brand board: http://localhost:5273/brand/

## Done
- **Research** (`research/01–06`): tech survey, pro-tool patterns, landscape of vibe-coded instruments,
  six-tool control matrix (Spline/Paper/Figma/Framer/Affinity/Rive), Toolcraft evaluation, QA findings.
- **Kit** (`src/kit/`, API in `docs/KIT.md`): schema → params store (undo, presets, A/B, share, agent prompt),
  clock, surfaces (canvas / mount / iframe + `public/studio-bridge.js`), Studio layouts (islands/overlay/docked),
  toolbar, stage camera + artboards, inspector, controls (scrub, slider, colour w/ OKLCH, curve, spring,
  gradient, xy, vec3, size, seed, palette, image, monitor), timeline, layers, ⌘K palette, toasts.
- **19 shells**, all typecheck: motion, dropin, present (mine) · type, synth · batch, marks · animate, video ·
  shader, dither · flows, journey · nodes, generate · scene, photo · ui-design, component-lab. All builders finished.
- **Packaging fork** (separate Desktop session "Packaging agent"): landing page (`src/landing/`), gallery at
  `#/shells`, lean skill rewrite in `skills/trompo/` (SKILL.md + references), `.claude-plugin/`,
  shadcn registry (`registry.json`, `public/r/*.json`, verified installing into a fresh project), README,
  LICENSE (MIT), CONTRIBUTING, `.github/` Pages workflow, `docs/LAUNCH.md` (decisions + commands).
- **Branding fork** (session "Branding agent"): `brand/` board + `brand/BRAND.md`. Recommendation **Thumbwheel**
  (free on npm, GitHub, .dev/.studio/.design/.tools); runner-up Wingspace; also Jigwork, Clampwork.
- **Provenance**: `THIRD_PARTY_NOTICES.md` (webgl-noise, Hoskins hash, OKLab); IQ-derived constants replaced
  in shader + photo; registry re-synced.

## Progress since the break (2026-10-09 evening)
- Tokens namespaced (accent→signal, input→control, muted→fg-muted, faint→fg-faint, font-sans→font-ui) via scripts/codemod-tokens.py.
- Kit core rebuilt: createDocStore/useDoc, createHistory/HistoryList, p.data, persist/share flags, scoped presets,
  params.replace/version/labels, createItemParams/bindItem, hotkey dispatcher with priorities/labels/useHoldKey,
  clock once/loop/pingpong + hidden-tab pause, Stage fit-by-value/fitMaxZoom/touch, ZoomPill props, useSafeArea,
  toast.update/dismiss/promise/progress, WebGLSurface, MountSurface handle, Inspector fixes (folder order, per-instance
  memory, segmented fit, bipolar origin, knob, log, ParamRow/ParamControl), Section uncontrolled, LayerTree props,
  Knob/recordFrames/zip/snapshot promoted. KIT.md updated. Commit a8f56e4.
- Wave 2 running: 4 agents promoting shell components into new kit files and migrating shells
  (motion: animate/video/type/motion/synth · graphics: shader/dither/photo/scene · design: ui-design/component-lab/
  marks/present/dropin · data: batch/flows/journey/nodes/generate). Brief: scratchpad wave2-brief.md. Each reports
  exports to add to src/kit/index.ts and changes needed in existing kit files — apply those, then QA all.

**Name: Trompo** (chosen by Rafael). DONE by branding session: site.config, sync (skills/trompo), landing mark, favicon.
TODO: guard `sync --check` against a pending rename (crashes reading skills/<new-slug>); update SESSION-CONTEXT name.
After wave 2: rename hard-coded "trompo" in shells (marks/actions.ts, motion/meta.ts, synth/index.tsx,
journey/export.ts, batch/exporter.ts, flows/export.ts, photo/develop.ts) + src/kit/index.ts, then `npm run sync`.
Keep `studio:` localStorage keys.

Landing: shells section is a pinned rail (src/landing/ShellRail.tsx) with its own thumbnails —
after shells change visibly run `npm run thumbs:rail [id]` (scripts/thumbs-rail.mjs). TODO: synth's
"Click to start audio" overlay shows in captures — hide it when `?qa` is in the URL.

## Wave 2 + rename: DONE (commits cf4bca5, 8d960cf)
~35 components promoted (see KIT.md §6b), all 19 shells migrated, QA clean, build ok, renamed to Trompo,
skill architecture/gotchas updated, sync check passes.

**Note:** ~/.claude/skills/trompo is a symlink to this repo's skills/trompo — edits there are live in Rafael's
personal skill. Old prototype-studio skill archived at ~/.claude/skill-backups/.

## Break-it QA round: 5 of 6 reported (interaction stalled); all P0/P1 FIXED except S2/S4 shell-side validation —
see research/08-qa-round.md "Status after this pass". Next: S2/S4 shell validators, then P2 backlog, re-run interaction
agent on a quiet machine (close orphaned headless Chrome first — load avg hit ~480), apply Geométrica fonts.

## (earlier) dx + a11y reported; P0/P1 from them FIXED (see research/08-qa-round.md "Fix log").
Still running at hand-off: interaction (5311), state (5312), layout (5313), perf (5316). Their reports arrive as
notifications — append to research/08-qa-round.md, fix P0/P1, then P2. Then APPLY the Geométrica site fonts myself (Branding session paused) — exact plan in brand/SESSION-NOTES.md
"In progress / open" item 1; touches only src/landing/*, src/gallery/Gallery.tsx, package.json.

## Break-it QA round (original plan) (6 read-only agents, brief: scratchpad/breakit-brief.md)
interaction (5311) · state/persistence (5312) · layout/responsive/themes (5313) · a11y + axe (5314) ·
developer/agent experience incl. registry + plugin (5315) · performance/leaks/scale (5316).
When they report: triage into research/08-qa-round.md, fix P0/P1 first, re-run QA, commit.
THEN message the Branding session "go fonts" — site typeface Geométrica (Gabarito / Lexend / Geist Mono, landing only)
is approved and waiting on the QA round so npm i doesn't disturb the test servers.

## Next (in order)
1. **Review QA results** in `research/qa-report.json`. Handoff run: tsc clean; 0 console errors across all 19 shells × 2 themes; low-contrast text flags (<3:1) in ui-design (dark 1), video (light 8), flows (4/3), generate (dark 3), journey (8/2), synth (dark 8) — check each; some may be artwork text the audit can't tell from chrome (mark artwork roots with `data-studio-artifact`).
2. **Consolidation pass on the kit** — work through `research/07-kit-gaps.md`. Top items (requested by 4–6 builders):
   - Document store + unified history (`createDocStore`, `createHistory([doc, params])`, history adaptor for
     HistoryButtons; named steps). Builders' versions: batch/local/history.tsx, flows/local/doc-store.ts,
     photo/local/history.tsx.
   - `p.data<T>()` / `p.list` hidden document params; `params.item()` / `<SchemaInspector schema values onChange>`.
   - Scoped / partial presets.
   - Timeline split: transport + optional hotkeys + editable key lanes (promote animate/local/KeyframeTimeline,
     video/local/TrackTimeline); clock loop modes (once / loop / ping-pong); pause when tab hidden.
   - toast update/dismiss/promise; `recordFrames` (mediabunny) + progress toast; zip writer; DOM→PNG snapshot.
   - Hotkey priority/scope + duplicate warnings; Space conflicts (stage pan vs play vs reroll); `compare={false}`.
   - Stage: fit by value not identity, fitMaxZoom, fill mode without pan; ZoomControls with plain props; SafeArea.
   - Token namespacing to avoid shadcn collisions (`muted`/`accent`/`input`) — mechanical rename kit + shells.
   - Promote: Knob, EffectStack, PresetGrid, CompareSplit, SplitPane, QuickAdd, InlineText, DataGrid,
     JobQueue, Modal, Masonry, ToneCurve, Histogram, AxisGizmo, ParamSlider (painted tracks), useHoldKey,
     xyflow token theme.
   - Bugs: segmented truncation, bipolar slider origin, LayerTree toggles/tabindex, Section uncontrolled,
     image params in localStorage (quota fails silently), CanvasSurface forwardRef generic, Artboard font-feature leak.
3. **Refactor shells** onto the promoted kit pieces (delete their `local/` copies), React Flow attribution visible
   in flows + nodes, motion shell's stuck loading toast.
4. **Re-run QA on all shells**, refresh thumbnails, `npm run sync`.
5. **Skill**: reconcile packaging fork's `skills/trompo/` with the consolidated kit; add parallel-agent
   guidance (own ports/profiles for headless Chrome, own scratch dirs, restart dev server after new files).
   Then plan evals (`claude plugin eval`).
6. **Rafael decides**: name (Thumbwheel?), repo owner, domain, npm scope, distribution (registry + plugin ±
   npm), whether to replace his installed `~/.claude/skills/trompo` with the new one. See `docs/LAUNCH.md`.

## Gotchas while resuming
- Dev server must be restarted after many new files (Tailwind v4 dev may miss classes from new files).
- The home folder `/Users/raf` is itself a git repo; this project has its own repo (local only, nothing pushed).
- Builders used scratch dirs under the session scratchpad; nothing important lives there.
