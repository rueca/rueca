---
max_turns: 30
timeout_seconds: 900
allowed_tools: [Read, Write, Edit, Glob, Grep, Skill]
tags: [trigger, environments]
---

`src/scene.js` is our vanilla three.js product configurator. `start(el, { onPick })` returns
`{ objects, setColor, setRoughness, setLight, setDetail, select, renderPNG, dispose }` — the comments in the file
explain each one. Keep the three.js code vanilla (no react-three-fiber) and don't change `scene.js`.

Build the tool my team will use to sign off colourways, in React + Vite, in `src/ProductTool.tsx`:
- controls for colour, roughness, light intensity and mesh detail;
- an outliner: clicking an object there selects it in the viewport, and clicking it in the viewport selects it in the outliner;
- undo and redo for every change;
- save colourways under a name, and flip between two of them to compare;
- settings survive a reload, and I can copy a link that opens the tool with the same settings;
- mesh detail is expensive (it rebuilds the geometry), so don't rebuild while someone is still dragging the control;
- export a 2× PNG.

Write the files; don't run anything.
