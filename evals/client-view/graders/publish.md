---
type: llm
weight: 2
focus: { source: file, path: src/PatternTool.tsx }
---
The task: let a client on a phone change only palette, tile size and shuffle seed, then download. PASS only if:
- exactly those three params are marked for the client in the schema (e.g. `publish: true` on palette, size and seed), rather than listed again by hand in a second form;
- there is a separate client / present view that renders only the published params (e.g. `<Inspector params={params} published />`, typically in a touch-friendly bottom sheet), chosen by a link or URL flag;
- the client view has a download / export action and a way to share the link.
FAIL if the controls are duplicated by hand, or the other knobs are only hidden with CSS.
