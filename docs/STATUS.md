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
  `#/shells`, lean skill rewrite in `skills/rueca/` (SKILL.md + references), `.claude-plugin/`,
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

**Name: Rueca** (chosen by Rafael). DONE by branding session: site.config, sync (skills/rueca), landing mark, favicon.
TODO: guard `sync --check` against a pending rename (crashes reading skills/<new-slug>); update SESSION-CONTEXT name.
After wave 2: rename hard-coded "rueca" in shells (marks/actions.ts, motion/meta.ts, synth/index.tsx,
journey/export.ts, batch/exporter.ts, flows/export.ts, photo/develop.ts) + src/kit/index.ts, then `npm run sync`.
Keep `studio:` localStorage keys.

Landing: shells section is a pinned rail (src/landing/ShellRail.tsx) with its own thumbnails —
after shells change visibly run `npm run thumbs:rail [id]` (scripts/thumbs-rail.mjs). TODO: synth's
"Click to start audio" overlay shows in captures — hide it when `?qa` is in the URL.

## Wave 2 + rename: DONE (commits cf4bca5, 8d960cf)
~35 components promoted (see KIT.md §6b), all 19 shells migrated, QA clean, build ok, renamed to Rueca,
skill architecture/gotchas updated, sync check passes.

**Note:** ~/.claude/skills/rueca is a symlink to this repo's skills/rueca — edits there are live in Rafael's
personal skill. Old prototype-studio skill archived at ~/.claude/skill-backups/.

Site type (branding session, Rafael's picks): Gabarito display (big stacked hero "Give it / a spin."), Hanken Grotesk body,
Geist Mono code — landing + gallery only; product chrome stays Inter.

## Current state — 2026-10-10 (afternoon)
- Break-it QA round COMPLETE: all six agents reported (interaction re-ran as interaction-2). Every P0/P1 and the P2s
  are fixed and verified headlessly; the log is in research/08-qa-round.md (latest: "interaction-2" sections).
- Kit additions this pass: number-field fixes (Infinity guard, mixed deltas, percent editing, typing starts an edit,
  Esc mid-scrub, wheel), focused fields own their keys, bare-Space shortcuts fire on release (Space+drag pans
  without playing), typed `p.select`/`p.multi` values, grid semantics for EffectStack + DataGrid, KeyTimeline per-lane
  `[ ]`, ViewportFrame `chrome={false}`, preset name clashes + active-preset tracking, OKLCH text entry.
- Eval suite (evals/; run from the ~/skill-eval worktree, since Drive sync breaks runs inside ~/Documents). 3 runs per
  arm, 2026-10-10, $15.81: client-view 1.00 vs 0.00 · docs-state 1.00 vs 0.33 · tuning-tool 0.92 vs 0.00 ·
  wrap-existing-html 1.00 vs 0.83 · vanilla-three 1.00 vs 1.00 · no-trigger 1.00 vs 1.00 (stays out). Mean Δ +0.46.
  Skill trimmed (0b8db76: starter in SKILL.md, refs "read ONLY when", kit-api split): with-skill cost per suite
  $3.90 → $2.17 (−44%; tuning −59%, three.js −51%), all cases still 1.00; agents now read 0–3 refs instead of 5–7.
  vanilla-three hardened (sign-off workflow: two-way selection, undo, named colourways + compare, persistence, share
  link, expensive control on commit): with 0.88 vs without 0.67, and cheaper with ($0.58 vs $0.91 a run). It caught a
  skill bug: told "don't run anything", agents hand-built everything instead of writing against the kit (fixed b394593).
- Branding session is converting shell demo content to the "wire aesthetic v2" (brand/BRAND.md): it owns
  ui-design, dropin, batch, video, animate, motion, component-lab, photo, dither, generate, flows, journey (+ scene
  optional) until it says it's done. Message it before touching those shells.

## Next (in order)
1. Rafael: try a single eval case (see evals/README.md) and decide whether to run the suite.
2. Remaining small items: shell overrides (batch/panels.tsx wrapper, animate KeyButton class) and photo/dither
   intake → kit `onReject` (wait for Branding to finish those shells); PERF-6 landing iframe off-screen pause
   (Packaging owns src/landing); comment-pin initials label (ui-design); video timeline labels.
3. Untested areas worth one more agent later: undo storms in flows/journey/generate, photo HistoryList jump,
   canvas zoom extremes, real pointer lock.
4. Launch: rueca.dev BOUGHT (Vercel, team RC IDP). GitHub org `rueca` created; repo rueca/rueca is PRIVATE, main pushed
   2026-10-10, CI green (build + tests; the Pages deploy skips while private). At launch: make it public, then either
   GitHub Pages + DNS records in Vercel, or host the site on Vercel (the domain is already there). npm scope @rueca is
   free (Rafael creates the npm org when publishing). See docs/LAUNCH.md.
- Machine: ~/Documents is synced by Google Drive (fileproviderd busy) — move the repo out of synced folders; quit
  leftover headless Chrome processes (I'm not permitted to kill them).

## Gotchas while resuming
- Dev server must be restarted after many new files (Tailwind v4 dev may miss classes from new files).
- The home folder `/Users/raf` is itself a git repo; this project has its own repo (local only, nothing pushed).
- Builders used scratch dirs under the session scratchpad; nothing important lives there.
