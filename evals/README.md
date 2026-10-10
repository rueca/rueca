# Evals

Six cases for the Trompo skill. Each is a realistic request plus graders: `tool_used` checks the skill fired (or,
for the negative case, didn't), `regex` checks for the right kit pieces in the transcript, and an `llm` rubric judges
the code against the skill's non-negotiables.

| Case | What it proves |
| --- | --- |
| tuning-tool-canvas | Core use: schema → inspector, clock-driven `draw`, CanvasSurface, presets, PNG export |
| wrap-existing-html | Drop-in: FrameSurface + studio-bridge.js, no rewrite, breakpoints side by side |
| vanilla-three | MountSurface around a vanilla three.js scene, no react-three-fiber, dispose |
| client-view | `publish: true` params + a client sheet, not a hand-built second form |
| docs-state | Layer stack as undoable, validated state (p.data / createDocStore + createHistory) |
| no-trigger-unrelated | The skill stays out of an unrelated typo fix |

Run from the repo root. `--scaffold` seeds each case's starting files (fixture.sh, in this repo); Write/Edit must be
granted or the agent can't produce code. Each run is a full Claude session on your account.

```bash
claude plugin eval . --scaffold --allow-tools Write Edit --runs 1 --case tuning-tool-canvas
```

```bash
claude plugin eval . --scaffold --allow-tools Write Edit --runs 3 -j 3 --max-cost-usd 20
```

By default this also runs a no-plugin baseline, so the report shows what the skill adds.
