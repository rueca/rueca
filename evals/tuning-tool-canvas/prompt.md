---
max_turns: 25
allowed_tools: [Read, Write, Edit, Glob, Grep, Skill]
tags: [trigger, kit]
---

I have a Canvas 2D ripple animation in `src/ripple.ts` — `export function draw(ctx, t, { rings, stagger, ease })`
renders concentric rings that light up outward. Make me a little tool so I can tune rings, stagger and easing live,
scrub the timing, save a couple of presets and export a PNG for my client. It's a React + Vite + Tailwind v4 project.
Write the files; don't run anything.
