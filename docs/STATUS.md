# Status — where we left off (updated 2026-10-10, cleanup QA round)

Start here when resuming. Also read `docs/SESSION-CONTEXT.md` (who/what/decisions) and
`research/07-kit-gaps.md` (the consolidation backlog).

## How to look at it
```bash
npm run dev            # http://localhost:5273  → landing · #/shells → gallery · #/<id> → a shell
node scripts/qa.mjs    # headless Chrome QA: console errors + contrast, both themes, refreshes thumbnails
npm run sync           # regenerate skill references, registry (public/r), plugin manifests
npm run check          # sync --check + tsc + unit tests (what CI runs)
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
  LICENSE (MIT), CONTRIBUTING, `.github/` CI workflow (hosting is Vercel), `docs/LAUNCH.md` (decisions + commands).
- **Branding fork** (session "Branding agent"): `brand/` board + `brand/BRAND.md`. Name history: Thumbwheel →
  Trompo → **Rueca** (final).
- **Provenance**: `THIRD_PARTY_NOTICES.md` (webgl-noise, Hoskins hash, OKLab); IQ-derived constants replaced
  in shader + photo; registry re-synced.

## Progress since the break (2026-10-09 evening)
- Tokens namespaced (accent→signal, input→control, muted→fg-muted, faint→fg-faint, font-sans→font-ui) (one-off codemod, since removed).
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

**Name: Rueca.** The name lives only in `src/site.config.ts`; `npm run sync` spreads it. The kit is brand-neutral
(`[studio]` logs, `studio:` storage keys — keep them).

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

## Cleanup QA round — 2026-10-10 (evening)
- Six read-only agents ran on a frozen snapshot; findings + fixes in research/09-cleanup-qa.md. All P0/P1 in the
  kit and shells are FIXED and live (6fd3253): marks lost work on reload (P0), share links (persist, hash-keyed,
  versioned, apply when pasted), version bumps no longer orphan docs/presets, ui-design/synth/generate/nodes load
  guards, keyboard focus on kit buttons, panel tab order + landmarks, click-through under empty panel areas,
  install docs that work end to end, Vercel docs + CI, cache headers, lazy mediabunny, link-preview meta, QA
  screenshots out of public/. 55 unit tests, QA 38/38.
- Handed to the landing owners (ship with the landing push, which waits on Rafael's sign-off): narrow kit
  imports (−117 KB gz eager, done by Packaging), gallery WebP thumbs (done), lazy Landing + NotFound route
  (done), Synth iframe focus steal (`inert`), landing/gallery `<main>`, dimmed rail text, reduced-motion scroll,
  StepDeck regions, ShellRail unused import (breaks tsc).
- Backlog DONE (2026-10-10/11, c75324c → 3ee1d05 + Vec3): --signal-text token, faint-on-tint rule, video field
  names, flows/nodes refit, nodes HUD, batch toolbar + labels, track timeline overflow, statusbar removed, dither on
  kit ZoomPill (gained focus rings/label/steps/keys), generate on kit CompareSplit, scene on kit Vec3Fields (gained
  uniform lock), marks legacyKeys, reserved ids enforced, 13 dead exports, em dashes out of UI labels/notices,
  24px hit areas, comment-pin names. ST9 (nodes 2048 export) didn't reproduce: 1.4 s, 2048×2048.
- Still open — Rafael's calls: shared contrast maths in the kit (M3, grows the API); one util module for slug/uid/
  PRNG (M4: kit or shells-only); type-scale tokens (C15); start shells paused under reduced motion (C10); og.png +
  touch icon (needs design); em dashes in tooltip prose (P3).

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
4. LIVE at https://rueca.dev (Vercel project `rueca`, team RC IDP, Pro; deploys every push to main; www redirects).
   Repo rueca/rueca still PRIVATE. 2026-10-10: wire-style shells, Rueca landing rebrand and brand board committed and
   live (QA 38/38, 0 console errors live). Martina Plantijn (display) is a local() trial — public visitors see
   Alegreya until licensed. npm scope @rueca free (Rafael creates the npm org when publishing). Open: make the repo
   public + announce; license the display face; Vercel connector can't see projects (dashboard for project settings).
- Machine: ~/Documents is synced by Google Drive (fileproviderd busy) — move the repo out of synced folders; quit
  leftover headless Chrome processes (I'm not permitted to kill them).

## Gotchas while resuming
- Dev server must be restarted after many new files (Tailwind v4 dev may miss classes from new files).
- The home folder `/Users/raf` is itself a git repo; this project has its own repo (origin github.com/rueca/rueca, private).
- Builders used scratch dirs under the session scratchpad; nothing important lives there.
