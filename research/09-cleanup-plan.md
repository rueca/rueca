# Cleanup QA round — plan (2026-10-10)

Since the last QA round (research/08) a lot moved: the Trompo → Rueca rename, wire-style demos in 12 shells,
the landing rebrand (fonts, nav, engraving hero, live frames), the islands layout refactor (canvas under
floating panels, safe-area fit), FrameSurface same-origin drive, renderCanvasPNG, typed selects, number-field
and hotkey fixes, presets, the skill trim, Vercel hosting on rueca.dev. This round finds what that left behind.
It is a **cleanup** round: dead weight, drift and regressions — not new features.

## When to start (preconditions)
1. Every session idle, and the landing rebrand signed off by Rafael and committed — QA a moving target and the
   findings are stale before they land. (`git status` clean except brand/ WIP.)
2. Freeze a snapshot: a worktree at that commit **outside ~/Documents** (Drive sync makes hard links and slows
   everything): `git worktree add --detach ~/rueca-qa <sha>`, `npm ci`, own dev server port per agent group.
3. Quiet machine: quit leftover headless Chrome; one Chrome profile dir per agent under the agent's scratch dir.
4. Agents are **read-only** on the repo; they write findings to their own scratch file. I triage and fix.

## Baseline (measured before the round)
- 76 uncommitted files (landing WIP). Tests 45/45, QA 38/38, live site 0 console errors.
- Unused deps: `@fontsource-variable/{alegreya,gabarito,hanken-grotesk,libre-franklin}`, `@fontsource/caveat`.
- "trompo" left in tracked files: `src/shells/dropin/index.tsx`, `src/shells/ui-design/model/seed.ts`
  (art labels — check with Branding), `docs/SESSION-CONTEXT.md` (history, fine).
- Biggest weight on the site: `public/thumbs` = **24 MB** of PNG (≈2 MB each). JS: kit chunk 812 KB, scene
  712 KB, index 392 KB, video 216 KB, xyflow 176 KB (minified, before gzip).
- 7 shells still have `local/` folders (leftovers from promoting pieces into the kit).

## Known issues to fold in (found since)
- **Kit — share links carry no version.** `createParams({ version })` only changes the localStorage key; a `#p=`
  link from before a schema change still applies old values under new meanings (present's `weight` had to be
  renamed to `band` to dodge it). Fix: write `v` into the link, and on load ignore (or `migrate`) a link whose
  version differs, with a toast. Test it.
- **QA script — partial runs clobber the report.** `node scripts/qa.mjs <shell>` rewrites
  `research/qa-report.json` with only that shell. Fix: merge results by shell id.
- **QA script — base URL.** The dev server may listen on IPv6 only (`[::1]`); make `qa.mjs` default to the URL
  Vite prints, or try `localhost`, `127.0.0.1` and `[::1]` in turn.
- Pending sign-off (commit before the round): landing rebrand, Client demo (present) restyle, animate art swap.

## Agents (6, read-only, ~30–45 min, run in parallel)

| # | Focus | What it checks | Output |
|---|---|---|---|
| 1 | **Dead weight** | unused files / exports / deps (knip-style pass), `local/` copies that duplicate kit pieces, duplicate helpers (`src/demo/*` vs `brand/wire.js`, the three ex-`top.ts` copies), orphaned assets in `public/`, stale storage-version code paths, leftover brand strings | list with file:line and "safe to delete?" |
| 2 | **Docs & skill drift** | KIT.md and `skills/rueca/*` vs the real API (every signature it names exists and matches); the SKILL.md starter compiles; README / CONTRIBUTING / LAUNCH / STATUS are true; **end-to-end install**: fresh Vite app → `npx shadcn add https://rueca.dev/r/studio.json` → the starter runs; `claude plugin validate`; registry items list the files they need | mismatches + a pass/fail install log |
| 3 | **Layout regressions** | the islands refactor across all 19 shells at 1024 / 1280 / 1440 / 1920 and present mode: nothing under a panel that shouldn't be, fit centred, HUDs in the gap, panel collapse, both themes; overlay + docked unchanged; landing at 375 / 768 / 1440 | screenshots + findings |
| 4 | **Interaction & state** | after the version bumps: old saved docs/params (simulate v1–v3 in localStorage) load or reset cleanly, share links, presets (save/apply/compare), undo across stores, every export (PNG 1×/2×, SVG, MP4, zip, JSON, LUT) in the wire-style shells; Space / hotkeys / focus | repro steps per bug |
| 5 | **Live site & performance** | rueca.dev: per-route payload (eager vs lazy), font loading (only fonts used, `font-display`, fallbacks), image weight (thumbs → WebP/AVIF at display size), cache headers, meta / OG / favicon / title, 404 and deep links (`#/x` unknown), console errors, Lighthouse-style metrics on landing + gallery + 3 shells, mobile landing | numbers before/after + top 5 wins |
| 6 | **Code & a11y consistency** | tokens-only chrome (hex audit outside artwork/demo palettes), sentence case, focus rings and target sizes in new UI (nav, frames, Animate), axe on landing + gallery + 6 shells, reduced motion on the landing animations, console warnings in dev | findings by severity |

Severity: **P0** broken / data loss / crash · **P1** clearly wrong, visible to users · **P2** polish / debt · **P3** nit.
Every finding needs repro steps and evidence (screenshot, measurement or file:line), and is reproduced twice.

## After the round
1. Triage into `research/09-cleanup-qa.md` (same format as 08).
2. Fix P0/P1 first, then a cleanup batch: delete dead code and unused deps, convert thumbnails, close doc
   drift. One commit per theme so each deploy is reviewable (every push to main goes live).
3. Verify: `npm run check`, full `qa.mjs` 38/38, live-site check, and the eval suite once (~$5 single run,
   ~$16 for 3 runs) to confirm the skill still beats no-skill after the cleanup.
4. Update STATUS, KIT.md, the skill (sync), memory.

## Decisions for Rafael before launch of the round
- Start after the landing sign-off (recommended), or now on a snapshot accepting that landing findings may be stale.
- Include the eval re-run at the end (~$5, or ~$16 for 3 runs)?
- Thumbnails: convert to WebP at display size (≈90% smaller, no visible change) — default yes.
