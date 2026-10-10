---
type: llm
weight: 2
focus: { source: file, path: src/ProductTool.tsx }
---
This file wraps an existing imperative three.js scene (`start(el)` returning setters and `dispose`). PASS only if it:
- mounts the scene once through an imperative adapter (e.g. `MountSurface`, or a ref + effect that calls `start(el)` and returns `dispose`);
- pushes param changes into the running scene through its setters (subscribe / onCommit / effect on values), WITHOUT re-creating the scene on every change;
- disposes the scene on unmount;
- offers an inspector for colourway, roughness and light, an outliner of scene objects, and a 2× PNG export;
- does not use react-three-fiber.
FAIL otherwise.
