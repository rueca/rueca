---
type: llm
weight: 2
focus: { source: file, path: src/GrainTool.tsx }
---
The user asked for a tuning tool and never mentioned comments. Comments and "Send to agent" should still be on by
default. PASS only if:
- a kit `<NoteLayer params={params} clock={clock} />` sits inside the `<Artboard>`, next to the surface;
- `ParamActions` (which shows Send to agent, Comment and the comments list once the notes route answers) is in the
  toolbar and gets `clock={clock}` so notes carry the playhead; a custom toolbar without it uses the kit's
  `CommentButton` and `SendToAgentButton` instead;
- nothing about comments is hand-built (no home-made pins, composer, note list or fetch to a notes endpoint).
FAIL if comments or Send to agent are missing, or hand-built.
