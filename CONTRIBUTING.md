# Contributing to Trompo

Thanks for helping. This project is three things that share one source of truth: the
**kit** (`src/kit/`), the **example tools** ("shells", `src/shells/`) that prove the kit
holds up, and the **skill** (`skills/trompo/`) that teaches agents to use it.

## Setup

```bash
npm install
npm run dev     # http://localhost:5273 — #/ landing, #/shells every shell, #/<id> one shell
```

Node 24 or newer (the sync script imports TypeScript directly).

> Tailwind v4 in dev: classes used only in files created after the server started may
> not reach the CSS until you restart it. If a new component looks unstyled, restart
> before debugging.

## Before you open a pull request

```bash
npm run sync    # regenerate derived files (registry, plugin manifest, skill copies)
npm run check   # fails if generated files are stale; typechecks; runs the unit tests
npm run qa      # console errors + contrast audit in both themes + thumbnails
npm run build
```

Kit logic (`src/kit/core`, maths in controls) has fast unit tests in `tests/` (`npm test`, under a
second). A bug fix in the kit should come with a test that fails without it.

Check your change in **both themes** (`T` toggles inside a shell) and, if it touches
the client view or the landing page, at **375px wide**.

## Adding a shell

1. Create `src/shells/<id>/meta.ts` (exports `meta: ShellMeta`) and
   `src/shells/<id>/index.tsx` (default-exports the component). It registers itself —
   nothing else to edit.
2. Build it from the kit (`@kit`). Start from the closest existing shell.
3. Follow the rules in `docs/KIT.md` §1: tokens only, no hex in chrome, sentence case,
   one accent on state, every drag has a typed alternative.
4. `npm run qa <id>` writes its gallery thumbnails and audits it. `npm run sync` adds it
   to the skill's shell table.

A shell should stand in for a *kind* of tool nobody has covered yet (see the archetype
table in `skills/trompo/references/layouts.md`). Open a "New shell" issue
first if you're unsure.

## Changing the kit

- Keep the public surface in `src/kit/index.ts`, and update `docs/KIT.md` in the same
  change — it is copied into the skill as `references/kit-api.md`.
- Kit files import each other with **relative paths** only (never `@kit` or `@/`
  inside `src/kit/`), so they still work after the registry copies them into someone
  else's project.
- The registry is **derived** from the kit's imports: `ui/` and `system/` ship file by
  file, every other folder as one item. A new file needs no registration — run
  `npm run sync` and check `registry.json`. The script fails on dependency cycles.
- A breaking change to an installed component's props is a breaking change for
  everyone who ran `shadcn add`. Note it in the PR description.

## Improving the skill

- `SKILL.md` stays lean — the workflow, the non-negotiables and an index of
  references. Detail goes in `references/`. Keep `SKILL.md` well under 500 lines.
- Every rule should come from something that actually went wrong or a convention
  verified in a reference tool. Add new gotchas to `references/gotchas.md` with the
  symptom first.
- **Don't edit generated files**: `references/kit-api.md`, `assets/theme.css`,
  `assets/studio-bridge.js` and the shell table in `references/layouts.md` are
  overwritten by `npm run sync`. Edit their sources.
- Frontmatter follows the [Agent Skills spec](https://agentskills.io/specification):
  `name` matches the folder, `description` ≤ 1024 characters.

## Design calls

Taste, naming and brand decisions belong to the maintainer. For those, open an issue
with rendered options (screenshots of each) rather than a PR that picks one.

## Licence

By contributing you agree that your contribution is licensed under the MIT licence.
If you port code from another project, keep its licence notice and say so in the PR.
