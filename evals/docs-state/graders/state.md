---
type: llm
weight: 2
focus: trace
---
PASS only if the agent moves the stack into undoable, persisted state — either a hidden `p.data<Layer[]>(…, { share: true, validate })`
param or a `createDocStore(…, { validate })` joined to the params with `createHistory([params, doc])` — so that add/remove/reorder
are labelled undo steps alongside the sliders, the stack persists, share links include it (when appropriate), and incoming
stacks are validated (a malformed share link or saved value must not crash the shell). Editing one layer's params should
use per-item params (e.g. `createItemParams` + `bindItem`) or equivalent. FAIL if it keeps the stack in React state, adds a
second ad-hoc undo stack, or loads saved/shared data without validation.
