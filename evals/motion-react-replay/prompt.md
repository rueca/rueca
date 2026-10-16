---
max_turns: 25
timeout_seconds: 600
allowed_tools: [Read, Write, Edit, Glob, Grep, Skill]
tags: [trigger, environments]
---

`src/components/Toast.tsx` slides in with a motion/react spring. I want to dial in that entrance (the spring, how
far it travels, the starting scale) and replay it over and over until it feels right. Don't rewrite how it animates;
adding props to it is fine. Put the tool in `src/ToastTuner.tsx`. Write the code; don't run anything.
