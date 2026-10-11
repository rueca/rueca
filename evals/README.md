# Evals

Eight cases for the skill. Each is a realistic request plus graders: `tool_used` checks the skill fired (or,
for the negative cases, didn't), and `regex` + `llm` graders read the FILE the prompt names (`src/RippleTool.tsx`
etc.). Graders never read the transcript: an `llm` judge only sees its first and last 12 messages (the code is
written in the middle), and a regex over the trace also matches the skill docs the agent read.

| Case | What it proves |
| --- | --- |
| tuning-tool-canvas | Core use: schema → inspector, clock-driven `draw`, CanvasSurface, presets, PNG export |
| wrap-existing-html | Drop-in: FrameSurface + studio-bridge.js, no rewrite, breakpoints side by side |
| vanilla-three | A sign-off tool around a vanilla three.js scene: mount once, two-way selection, undo/redo, named colourways + compare, persistence + share link, expensive control applied on commit |
| client-view | `publish: true` params + a client sheet, not a hand-built second form |
| docs-state | Layer stack as undoable, validated state (p.data / createDocStore + createHistory) |
| implicit-motion-study | The skill fires UNASKED: "sketch this logo animation so I can react" gets a kit harness (params, clock, timeline), not hand-built sliders and a rAF loop (a peer session missed this, 11 Oct) |
| no-trigger-unrelated | The skill stays out of an unrelated typo fix |
| no-trigger-shipped-animation | …and out of a shipped site animation ("make the hero logo spin") — the counterweight to implicit-motion-study |

Run from the repo root. `--scaffold` seeds each case's starting files (fixture.sh, in this repo); Write/Edit must be
granted or the agent can't produce code. Each run is a full Claude session on your account.

```bash
claude plugin eval . --scaffold --allow-tools Write Edit --runs 1 --case tuning-tool-canvas
```

```bash
claude plugin eval . --scaffold --allow-tools Write Edit --runs 3 -j 3 --max-cost-usd 20
```

By default this also runs a no-plugin baseline, so the report shows what the skill adds.

## Gotchas
- "a file in the plugin has more than one name (a hard link)": the eval refuses to load while any file in the
  repo is hard-linked. Cloud sync (Google Drive / iCloud "Desktop & Documents") makes short-lived hard links
  while uploading, so a repo inside a synced folder fails at random. Run evals from a worktree outside it:

  ```bash
  git worktree add --detach ~/skill-eval HEAD
  ```

  then `cd ~/skill-eval` and run the eval there (`git -C ~/skill-eval checkout --detach <commit>` to update it).
- The CLI needs its own login (`claude auth login`); the desktop app's sign-in doesn't carry over.
- Don't run two evals at once — they share one rate limit and the second one times out.
