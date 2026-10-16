---
max_turns: 12
timeout_seconds: 600
allowed_tools: [Read, Write, Edit, Glob, Grep, Skill]
tags: [trigger, negative, neighbour]
---

Add a chart of weekly signups to our admin dashboard. The data is in `src/data/signups.ts`. Put the chart in
`src/components/SignupsChart.tsx` and render it in `src/pages/Dashboard.tsx` under the KPI cards.
