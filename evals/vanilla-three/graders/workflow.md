---
type: llm
weight: 3
focus: { source: file, path: src/ProductTool.tsx }
---
Judge the sign-off workflow. PASS only if ALL of these are actually implemented in this file (or in kit/library calls it makes — e.g. a param store that provides undo, presets, persistence and share links counts):
1. undo AND redo cover every setting change (keyboard shortcuts or buttons);
2. colourways can be saved under a user-given name and re-applied, and there is a way to flip between two of them to compare;
3. settings persist across a page reload (e.g. localStorage);
4. a copyable link reproduces the current settings when opened;
5. mesh detail is applied to the scene only when the user finishes adjusting it (pointer up / commit / debounce), not on every drag frame.
Name each item you could not find. FAIL if any item is missing or only stubbed.
