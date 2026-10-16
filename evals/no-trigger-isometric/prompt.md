---
max_turns: 15
timeout_seconds: 600
allowed_tools: [Read, Write, Edit, Glob, Grep, Skill]
tags: [trigger, negative, neighbour]
---

For our docs page `docs/queue.md`, make an isometric explainer figure of the job queue: the queue drawn as a physical
object, jobs sliding out to three workers, failed ones going back, and a hover readout that says what each part
does. Make it one self-contained file, `docs/queue-figure.html`, that we can embed in the page.
