# Cleanup QA round — findings and fixes (2026-10-10)

Plan: `research/09-cleanup-plan.md`. Snapshot tested: 25c8d4a (worktree `~/rueca-qa`, dev server :5400).
Six read-only agents: dead weight, docs/skill drift, layout, state/exports, live site/perf, consistency/a11y.
Fixed before the reports: share links carry their schema version (3af0fa2); qa.mjs merges partial runs and
finds the dev server on any loopback address (3af0fa2).

## 1. Dead weight (agent "dead") — knip + grep, raw output in scratchpad/cleanup/dead/
| ID | Sev | Finding | Action |
|---|---|---|---|
| D1 | P2 | 38 QA screenshots (`public/thumbs/*.png`, 12 MB) ship to the site and are rewritten every QA run (~91 MB of git history); the site only uses `thumbs/rail/*.jpg` | qa.mjs → ignored `research/qa-shots/`; `git rm public/thumbs/*.png` |
| D2 | P2 | Unused fonts: gabarito, hanken-grotesk (now); alegreya, libre-franklin, caveat (once the landing WIP lands). Keep inter, geist-mono | `npm rm` with the landing commit |
| D3 | P3 | ~25 dead shell exports + 8 needlessly exported types (list in the agent report) | delete |
| D4 | P3 | Landing `Mark` (no caller), unreachable `LOGO_IN_COLOUR` branch; in WIP: `brandArt.tsx`, `Section`, `DotGrid` orphaned | delete with the landing commit (dyes flag: Rafael) |
| D5 | P3 | `scripts/codemod-tokens.py` one-off, already applied | delete, reword STATUS |
| D6 | P3 | `RESERVED_ROUTES` documented but not enforced | dev assert |
| D7 | P3 | marks hand-rolled legacy-key migration duplicates createDocStore `legacyKeys` | use kit option |
| M1 | P2 | generate `local/CompareSlider` duplicates kit `CompareSplit` | swap, delete local |
| M2 | P2 | dither `local/ZoomSteps` duplicates kit `ZoomPill steps`; kit pill lacks focus ring + trigger aria-label | port a11y to kit, swap |
| M3 | P2 | 4 implementations of WCAG contrast maths | `luminance` / `contrastRatio` in kit color.tsx (grows API) |
| M4 | P3 | slug ×8, mulberry32 ×10, uid ×10, svgToPNG ×2 across shells | shared util (kit or shells: Rafael) |
| M5–M7 | P3 | scene Vec3Input ⊃ kit Vec3Fields; top geometry ×2; unused `StackList` alias | merge / optional |
Held up: no unused files; all 68 kit files in barrel + registry; no TODO/FIXME or commented-out code.

## 2. Docs and skill drift (agent "docs") — incl. a real install from rueca.dev in a fresh Vite app
| ID | Sev | Finding | Action |
|---|---|---|---|
| D1 | P1 | install.md / LAUNCH.md never add `@import "tailwindcss"` → `shadcn init` fails ("No Tailwind CSS configuration found") | add the step |
| D2 | P1 | starter renders blank: `.studio` is `h-full`, nothing gives `#root` a height (Studio 1280×0) | docs: `html, body, #root { height: 100% }`; kit: dev warning when Studio has no height |
| D3 | P1 | LAUNCH.md puts the `@` path only in tsconfig.app.json → shadcn writes a literal `./@/` folder | both tsconfigs |
| D4 | P1 | repo private → README install commands + 19 source links 404 | launch blocker (Rafael) |
| D5 | P2 | docs + pages.yml still say GitHub Pages; hosting is Vercel; pages.yml would try to deploy once public | CI-only workflow, LAUNCH §1–2 for Vercel |
| D6 | P2 | `live: false` documented as apply-on-commit; the kit doesn't read it | say "marker; use params.onCommit" |
| D7 | P2 | safe area documented as overlay-only (islands has it too) | fix text |
| D8 | P2 | gotchas: `init -y` alone still prompts | full flags |
| D9 | P2 | README vs install.md disagree on theme import order (order doesn't matter: no shared vars) | align |
| D10–16 | P2/P3 | stale STATUS / SESSION-CONTEXT lines, duplicate gotcha rows, undocumented savePreset return + `--artboard-font`, `w/3` promised but rejected, starter has no `.catch` | fix |
Held up: every documented API exists (393 exports, ~2,100 doc tokens) and a file calling every documented API/prop typechecks; the starter typechecks and builds in the fresh install; registry 40 items all resolve; plugin validate passes.

## 3. Live site and performance (agent "perf") — medians of 3 runs, fast and Slow-4G + 4× CPU
| ID | Sev | Finding | Action |
|---|---|---|---|
| PERF-01 | P1 | hashed assets served `max-age=0, must-revalidate`: every visit revalidates (19 of 38 requests on the landing) | **fixed**: vercel.json headers (assets immutable 1 y; thumbs/demo 1 d + swr) |
| PERF-02 | P1 | gallery loads 1440px JPEGs into 341px cards: 2.6 MB, Slow-4G LCP 13.8 s | 720w WebP/AVIF + srcset (gallery owner) |
| PERF-03 | P1 | `thumbs/rail/present-*.jpg` are 2160px, 1.05 MB each | re-capture at 1440 |
| PERF-04 | P1 | `@kit` barrel imported by LiveFrame / LiveShell / ShellRail makes all 266 KB gz of kit eager; narrow imports −117 KB gz (verified) | landing owner |
| PERF-05 | P2 | landing + `motion` in the entry chunk → every shell route pays ~60 KB br | lazy Landing in App.tsx; LazyMotion |
| PERF-06 | P2 | mediabunny (57 KB br) loads when 5 shells open | **fixed**: dynamic import on first export |
| PERF-07 | P2 | hero thumbnail is LCP, found late, no priority | `fetchpriority="high"`, WebP/AVIF |
| PERF-08 | P2 | no description / OG / Twitter / canonical / theme-color; bots see "Rueca" | **fixed**: meta from site.config in vite.config (og.png + touch icon still to design) |
| PERF-09 | P2 | no font preload; 192 KB fonts; owner sees local trial display font, visitors see the fallback | preload 2 faces, subset hand font; QA with the trial font disabled |
| PERF-10 | P2 | animate art 711 KB (now ~346 KB after the v2 swap); AVIF −62% | check engraving at 1:1 first |
| PERF-11 | P3 | 12.9 MB QA PNGs deployed | **fixed** (D1) |
| PERF-12 | P3 | `/nope` plain-text 404; `#/nope` silently shows the landing | gallery owner |
Held up: brotli everywhere, HTTPS/www redirects 308 + HSTS, `/r/*.json` CORS + 404s, font-display swap + latin subsets, CLS ≈ 0, no failed requests.
