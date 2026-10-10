---
type: llm
weight: 2
focus: { source: file, path: src/ShaderPlayground.tsx }
---
The task: move a layer stack out of React state so add / remove / reorder are undoable, persisted, and in share links. PASS only if:
- the stack is no longer `useState`; it lives in kit state: a hidden `p.data<Layer[]>(…)` param (with `share: true` so links carry it) or a `createDocStore(…)` joined to the params with `createHistory([params, doc])`;
- add / remove / reorder go through that state as undoable steps (ideally labelled) alongside the sliders, and the undo buttons use the combined history;
- incoming stacks (saved or from a link) are validated (a `validate` function or shape check), so a malformed link can't crash the tool.
FAIL if the stack stays in React state, a second ad-hoc undo stack is added, or loaded data is used without validation.
