---
max_turns: 25
timeout_seconds: 600
allowed_tools: [Read, Write, Edit, Glob, Grep, Skill]
tags: [kit, state]
---

In my shader playground (`src/ShaderPlayground.tsx`, built with the Rueca kit) the layer stack lives in React state,
and undo only covers the sliders, not adding / removing / reordering layers. Users also lose their stack on reload and
a share link doesn't include it. Fix it with the kit. Keep your changes in `src/ShaderPlayground.tsx`.
Write the changes; don't run anything.
