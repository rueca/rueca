---
type: llm
weight: 2
focus: trace
---
PASS only if the agent's written code:
- declares the tunable values ONCE in a schema (e.g. `defineSchema` / `p.number` / `p.curve` or an equivalent single param table) that drives the inspector, defaults, presets and export;
- keeps `draw` a pure function of (values, t) and drives it from a clock / ticker, NOT by putting live values in a requestAnimationFrame effect's dependency array;
- wires the artwork through a surface/adapter (e.g. `CanvasSurface`) inside a studio shell with an inspector, a timeline or transport, presets, and a PNG export;
- uses theme tokens for chrome colours (no hardcoded hex in the tool UI; hex is fine inside the artwork).
FAIL if any of these are missing, or if it hand-builds a generic form instead of a design-tool inspector.
