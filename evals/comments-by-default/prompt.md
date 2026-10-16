---
max_turns: 25
timeout_seconds: 600
allowed_tools: [Read, Write, Edit, Glob, Grep, Skill]
tags: [trigger, comments]
---

I've got an animated film-grain texture in `src/grain.ts`: `export function draw(ctx, t, { scale, grain, contrast,
tint })`. Build me a tool to tune it, and to export PNGs for the team. It's a React + Vite + Tailwind v4 project.
Put the tool's main component in `src/GrainTool.tsx`. Write the files; don't run anything.
