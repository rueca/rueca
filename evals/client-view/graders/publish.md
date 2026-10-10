---
type: llm
weight: 2
focus: trace
---
PASS only if the agent exposes the three client knobs by marking them in the schema (e.g. `publish: true`) and renders
a separate touch-friendly client view that shows only published params (e.g. `<Inspector published />` in a bottom
sheet), with a download action and a shareable link, rather than hand-building a second form. FAIL if it duplicates the
controls by hand or hides the other knobs with CSS only.
