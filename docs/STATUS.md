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
  `#/shells`, lean skill rewrite in `skills/prototype-studio/` (SKILL.md + references), `.claude-plugin/`,
  shadcn registry (`registry.json`, `public/r/*.json`, verified installing into a fresh project), README,
  LICENSE (MIT), CONTRIBUTING, `.github/` Pages workflow, `docs/LAUNCH.md` (decisions + commands).
- **Branding fork** (session "Branding agent"): `brand/` board + `brand/BRAND.md`. Recommendation **Thumbwheel**
  (free on npm, GitHub, .dev/.studio/.design/.tools); runner-up Wingspace; also Jigwork, Clampwork.
- **Provenance**: `THIRD_PARTY_NOTICES.md` (webgl-noise, Hoskins hash, OKLab); IQ-derived constants replaced
  in shader + photo; registry re-synced.

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
5. **Skill**: reconcile packaging fork's `skills/prototype-studio/` with the consolidated kit; add parallel-agent
   guidance (own ports/profiles for headless Chrome, own scratch dirs, restart dev server after new files).
   Then plan evals (`claude plugin eval`).
6. **Rafael decides**: name (Thumbwheel?), repo owner, domain, npm scope, distribution (registry + plugin ±
   npm), whether to replace his installed `~/.claude/skills/prototype-studio` with the new one. See `docs/LAUNCH.md`.

## Gotchas while resuming
- Dev server must be restarted after many new files (Tailwind v4 dev may miss classes from new files).
- The home folder `/Users/raf` is itself a git repo; this project has its own repo (local only, nothing pushed).
- Builders used scratch dirs under the session scratchpad; nothing important lives there.
