# Launch checklist

Status 2026-10-10: everything is built, decided and hosted. The name is **Rueca**
(`src/site.config.ts`), the site is live at **https://rueca.dev** on Vercel (team RC IDP,
project `rueca`, deploys every push to `main`, `www` → apex), and the code is in
**github.com/rueca/rueca — still private**. What's left is part 2 (going public), then the
checks in part 3.

## 1. Decisions (done — all in `src/site.config.ts`)

| Decision | Value | Notes |
|---|---|---|
| Name / slug | Rueca / `rueca` | Changing it later: edit `site.config.ts`, `npm run sync` (rewrites skill, plugin, registry, package.json, README, docs). The kit itself never contains the name. |
| Repo | `rueca/rueca` (org `rueca`) | In every install command: `/plugin marketplace add rueca/rueca`. |
| Domain | `https://rueca.dev` | Component install URLs contain it — don't change it after launch. |
| Hosting | Vercel | Settings live in `vercel.json` (Vite, `npm run build` → `dist`, Node ≥24). The Vercel connector can't see projects; use the dashboard for project/domain settings. |
| npm scope | `@rueca` (free, not reserved) | Not needed at launch: the registry serves from the site. Reserve it by creating the npm org. |
| What goes public | — | `research/` and `docs/SESSION-CONTEXT.md` are internal notes. Rafael's call before step 2. |
| Old skill | `~/.claude/skills/rueca` is a symlink to the repo | After installing the plugin, remove the symlink or both copies trigger. |

## 2. Go public

Before this step, two things from the readiness gate (oss-launch, 2026-10-10) must be done:

- [x] **Logo licence.** Resolved 11 Oct: the wordmark and the display face are now Sorts Mill
      Goudy (SIL OFL), so nothing needs buying. If the face changes back to a paid one
      (`SHIP` in `brand/tools/outline_rueca.py`), this item reopens.
- [ ] **Name.** A knockout trademark search for RUECA in classes 9 and 42 on
      [USPTO](https://tmsearch.uspto.gov), [EUIPO](https://euipo.europa.eu/eSearch) and
      [WIPO](https://branddb.wipo.int). Reserve the `@rueca` npm scope and an X handle.

Then, in this order:

1. **Take the site gate down.** rueca.dev and every `/r/*.json` answer 401 until
   `middleware.ts` (the password gate) is gone, so the kit install fails for everyone.
   Delete the file, commit and push; Vercel redeploys. Check
   `curl -s -o /dev/null -w "%{http_code}" https://rueca.dev/r/studio.json` prints `200`.
2. **Open the repo and turn on private vulnerability reporting** (`SECURITY.md` points at it):
   ```bash
   gh repo edit rueca/rueca --visibility public --accept-visibility-change-consequences
   gh api -X PUT repos/rueca/rueca/private-vulnerability-reporting
   ```
3. **Fix the repo's front page.** The description is still the old tagline and the homepage
   is `rueca.vercel.app`:
   ```bash
   gh repo edit rueca/rueca --description "Spin your prototype into a tool." --homepage https://rueca.dev
   gh repo edit rueca/rueca --add-topic claude-code-plugin,agent-skills,shadcn-registry,design-tools,prototyping
   ```
4. **Tag the release.** There's no tag yet; plugin users and the launch posts point at it:
   ```bash
   gh release create v0.1.0 --generate-notes --title "Rueca 0.1.0"
   ```

CI (`.github/workflows/ci.yml`) checks every push and pull request (generated files up to
date, unit tests, production build).

## 3. Check it works from the outside

Do these on the live site, not on localhost.

- [ ] Landing page loads; every example tool opens; the theme toggle works; it's usable
      on your phone.
- [ ] `https://<url>/r/registry.json` loads.
- [ ] Plugin, from any folder in Claude Code:
      `/plugin marketplace add <owner>/<slug>` → `/plugin install <slug>@<slug>`,
      then ask *"make me a tool to tune a gradient"* and watch it use the skill.
- [ ] Skill for other agents: `npx skills add <owner>/<slug>`.
- [ ] Kit, in a fresh folder (this exact sequence was re-checked against rueca.dev by the
      2026-10-10 cleanup QA, before the password gate; re-run it once the gate is down. The
      README's kit section now says it needs a project already set up for shadcn):
      ```bash
      npm create vite@latest kit-check -- --template react-ts --no-interactive
      cd kit-check && npm i && npm i -D tailwindcss @tailwindcss/vite
      printf '@import "tailwindcss";\n' > src/index.css
      # add tailwindcss() + an '@' alias to vite.config.ts, "@/*" paths to tsconfig.json AND tsconfig.app.json
      npx shadcn@latest init -y -b base --no-monorepo -p nova
      npx shadcn@latest add https://<url>/r/studio.json -y
      printf '@import "./components/studio/theme.css";\nhtml, body, #root { height: 100%%; margin: 0 }\n' >> src/index.css
      ```
- [ ] `claude plugin validate .` passes in the repo (it does today).

## 4. Before you announce

- [ ] The example tools still being built pass `npm run build` (the build typechecks
      everything, so one broken shell stops the deploy).
- [ ] `npm run qa` is clean, and the gallery thumbnails are fresh (`qa` regenerates them).
- [ ] Toolcraft and DialKit credits in the README are as you want them.
- [ ] A short screen recording of one shell for the README and the announcement. A
      designer audience decides from the first ten seconds of video.

Where to announce, roughly in order of fit: your own network and client channels, the
Claude Code community (Discord, r/ClaudeAI), Show HN, designer communities (Figma,
Framer, Rive forums), and skills.sh once people install it.

## Keeping it up to date

- Change the kit → `npm run sync` → commit → push. The site redeploys and people
  update with `npx shadcn@latest add <url>/r/<item>.json --overwrite`.
- Bump `version` in `site.config.ts` for skill or plugin changes, then `npm run sync`.
  Plugin users get it with `/plugin marketplace update`.
- CI (`.github/workflows/ci.yml`) fails a pull request if someone forgot to run sync, broke a test or broke the build.
