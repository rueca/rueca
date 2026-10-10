---
max_turns: 25
allowed_tools: [Read, Write, Edit, Glob, Grep, Skill]
tags: [kit, state]
---

In my shader playground the layer stack (an array of `{ id, type, visible, opacity, params }`) lives in React state, and
undo only covers the sliders, not adding/removing/reordering layers. Users also lose their stack on reload and a share
link doesn't include it. Fix it with the harness kit. Write the changes; don't run anything.
