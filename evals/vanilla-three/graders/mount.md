---
type: llm
weight: 2
focus: { source: file, path: src/ProductTool.tsx }
---
This file wraps an existing imperative three.js scene (`start(el, { onPick })` returning setters, `select`, `renderPNG` and `dispose`). PASS only if ALL hold:
- the scene is started ONCE (a mount adapter such as `MountSurface`, or a ref + effect with stable deps) and `dispose` runs on unmount — it is NOT re-created when a setting changes;
- setting changes reach the running scene through its setters;
- outliner and viewport selection are two-way: clicking an outliner row calls `select`, and `onPick` updates the outliner's selection;
- export uses `renderPNG(2)` (or an equivalent 2× render) and downloads the result.
FAIL if any is missing.
