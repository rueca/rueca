---
type: llm
weight: 2
focus: trace
---
PASS only if the agent keeps hero.html as-is (apart from adding a small bridge script include / hook-up) and drives it
from the harness through an iframe + postMessage bridge (e.g. `FrameSurface` + `studio-bridge.js`, `studio.cssVars()`),
shows at least two breakpoints side by side, and addresses iframes swallowing pointer/wheel events (a hand/interact
mode or shield). FAIL if it rewrites the page in React, copies its markup into a component, or edits the page's styles.
