---
type: llm
weight: 2
focus: { source: file, path: src/RippleTool.tsx }
---
This file is a tuning tool built around an existing `draw(ctx, t, values)` function. PASS only if:
- the tunable values are declared ONCE in a schema / param table (e.g. `defineSchema` + `p.number` / `p.select`) that drives the inspector, defaults, presets and export;
- `draw` is called from a clock- or ticker-driven surface (e.g. `CanvasSurface` with a clock), NOT from a hand-written requestAnimationFrame effect that lists live values in its dependency array;
- the UI is a design-tool layout (studio shell with an inspector panel, a timeline / transport to scrub time, presets, and a PNG export action), not a generic form;
- chrome colours come from theme tokens or kit components (a hex colour inside the artwork itself is fine).
FAIL if any of these is missing.
