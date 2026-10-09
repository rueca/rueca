# Launch checklist

Everything is built and wired. What's left is **your decisions** (part 1), then **one
sitting of commands** (part 2), then **checks** (part 3). The whole thing takes about
half an hour once the decisions are made.

## 1. Decide (all in `src/site.config.ts`)

| Decision | Where | Notes |
|---|---|---|
| **Name** | `name`, `slug` | Display name and the machine name (lowercase-kebab). The slug becomes the skill name, plugin name, package name and repo name, and is what people type: `/plugin install <slug>@<slug>`. Check it's free on GitHub and npm before deciding. Names starting `claude-` or `anthropic-` are reserved by Claude Code. |
| **Repo owner** | `repo` | Your personal account, or an organisation (more neutral if others will maintain it; an org is free). It shows up in every install command: `/plugin marketplace add <owner>/<slug>`. |
| **Domain** | `url` | Free: `https://<owner>.github.io/<slug>`. Custom (e.g. `<name>.design`, about $15–60 a year): shorter install commands, survives a repo rename. **Pick before launch.** Component install URLs contain it, so changing it later breaks updates for anyone who already installed. |
| **npm scope** | — | **Not needed at launch.** The registry serves from your site, and the bridge script can be served by jsDelivr straight from GitHub. Reserve the name anyway (`npm login`, then publish an empty placeholder, or create an org scope `@<name>`). |
| **Tagline / description** | `tagline`, `description` | Show on the landing page, in the plugin listing and in the README. |
| **What goes public** | — | `research/` (useful context, names competitors frankly) and `docs/SESSION-CONTEXT.md` (internal hand-off notes). I'd keep research and delete SESSION-CONTEXT. Your call. |
| **Old skill** | `~/.claude/skills/prototype-studio/` | Once you install the plugin, remove the old copy, or both versions trigger on the same requests. |

Then run:

```bash
npm run sync
```

That rewrites the name, repo and URL across the skill, plugin manifest, registry,
`package.json`, README and docs. The landing page reads the config directly.

## 2. Publish

**Before you start:** your whole home folder is a git repository with no commits.
This project is currently inside it, not a repo of its own. Step 1 gives it its own
repo, so nothing outside the project folder (`.ssh`, `.zshrc`…) can be pushed by
accident. Later, consider whether you meant `~` to be a repo at all.

You need the GitHub CLI signed in (`gh auth status`; `brew install gh` then
`gh auth login` if not).

```bash
cd ~/Documents/"Prototype UI Harness"
git init -b main
git add -A
git status            # read the list: no secrets, no stray files
git commit -m "Initial public release"
```

```bash
gh repo create <owner>/<slug> --public --source . --push --description "<tagline>"
```

Turn on GitHub Pages, deployed by the workflow that's already in the repo:

```bash
gh api -X POST repos/<owner>/<slug>/pages -f build_type=workflow
gh workflow run Site
gh run watch
```

The site goes live at the `url` from your config. Add topics so people can find it:

```bash
gh repo edit <owner>/<slug> --add-topic claude-code-plugin,agent-skills,shadcn-registry,design-tools,prototyping
```

**Custom domain (if you chose one):** point the DNS at GitHub Pages (a `CNAME` record
to `<owner>.github.io` for a subdomain, or GitHub's A records for an apex domain), then:

```bash
echo "<your.domain>" > public/CNAME
git add public/CNAME && git commit -m "Custom domain" && git push
gh api -X PUT repos/<owner>/<slug>/pages -f cname=<your.domain> -F https_enforced=true
```

## 3. Check it works from the outside

Do these on the live site, not on localhost.

- [ ] Landing page loads; every example tool opens; the theme toggle works; it's usable
      on your phone.
- [ ] `https://<url>/r/registry.json` loads.
- [ ] Plugin, from any folder in Claude Code:
      `/plugin marketplace add <owner>/<slug>` → `/plugin install <slug>@<slug>`,
      then ask *"make me a tool to tune a gradient"* and watch it use the skill.
- [ ] Skill for other agents: `npx skills add <owner>/<slug>`.
- [ ] Kit, in a fresh folder (this exact sequence passed against a local registry on
      2026-10-09):
      ```bash
      npm create vite@latest kit-check -- --template react-ts --no-interactive
      cd kit-check && npm i && npm i -D tailwindcss @tailwindcss/vite
      # add tailwindcss() + an '@' alias to vite.config.ts, "@/*" paths to tsconfig.app.json
      npx shadcn@latest init -y -b base --no-monorepo -p nova
      npx shadcn@latest add https://<url>/r/studio.json -y
      echo '@import "./components/studio/theme.css";' >> src/index.css
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
- CI (`.github/workflows/pages.yml`) fails a pull request if someone forgot to run sync.
