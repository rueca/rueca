---
type: llm
weight: 2
focus: trace
---
PASS only if the agent mounts the existing vanilla scene through an imperative adapter (e.g. `MountSurface` calling
`start(el)` and returning `dispose`), subscribes the scene to param changes (e.g. `params.subscribe` / `onCommit` for
expensive work) instead of re-creating it, disposes on unmount, and does not convert to react-three-fiber. FAIL if it
rewrites the scene, re-mounts it on every change, or leaks it (no dispose).
