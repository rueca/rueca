---
type: llm
weight: 3
focus: { source: file, path: src/ProductTool.tsx }
---
Judge the sign-off workflow. PASS only if ALL of these are actually implemented in this file, either by hand or through library calls it makes.
If the file uses the Rueca / studio kit (imports from `@/components/studio` or `@kit`), credit what those calls provide:
`createParams(schema, { id })` = undo/redo, persistence across reloads (localStorage) and `#p=` share links; `<ParamActions params={…} />` =
undo/redo buttons, named presets (save under a name, apply, delete), A/B compare (the `\\` key) and "copy link";
`params.onCommit(fn)` or `live: false` = applied on pointer-up only. Hand-written code must actually do the thing.
1. undo AND redo cover every setting change (keyboard shortcuts or buttons);
2. colourways can be saved under a user-given name and re-applied, and there is a way to flip between two of them to compare;
3. settings persist across a page reload (e.g. localStorage);
4. a copyable link reproduces the current settings when opened;
5. mesh detail is applied to the scene only when the user finishes adjusting it (pointer up / commit / debounce), not on every drag frame.
First list items 1–5 with found / not found and where. Then: FAIL if any item is missing or only stubbed, else PASS.
