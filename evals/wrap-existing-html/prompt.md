---
max_turns: 25
timeout_seconds: 600
allowed_tools: [Read, Write, Edit, Glob, Grep, Skill]
tags: [trigger, environments]
---

`public/hero.html` is a client's existing landing-page hero — plain HTML/CSS/JS, no framework, and the client's
team will keep editing it. Its colours and headline size are CSS custom properties (`--accent`, `--headline-size`).
I want a tuning harness around it so I can adjust accent, headline size and copy and see it at desktop and mobile
widths side by side. Don't rewrite or port the page. Put the harness component in `src/HeroHarness.tsx`.
Write the files; don't run anything.
