---
max_turns: 25
allowed_tools: [Read, Write, Edit, Glob, Grep, Skill]
tags: [trigger, environments]
---

`src/scene.js` builds a vanilla three.js product scene: `export function start(el) { …; return { setColor, setRoughness, dispose } }`.
Give it a proper inspector (colourways, material roughness, light intensity), an outliner and a 2× PNG export. Keep the
three.js code vanilla — no react-three-fiber. React + Vite project. Write the files; don't run anything.
