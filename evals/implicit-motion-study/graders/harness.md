---
type: llm
weight: 2
focus: { source: file, path: src/MarkFan.tsx }
---
The user asked for a sketch of a logo "fanning" animation to react to — they did NOT ask for controls. PASS only if the
sketch comes with a tuning harness built from the kit rather than by hand: the animation's timing values (stagger,
duration, easing, spread angle or similar) are params in a schema (`createParams` / `defineSchema`), playback is driven
by the kit clock (`createClock`) with a way to replay and scrub (a `Timeline` or the clock's controls), and the mark is
drawn as a function of (values, t). FAIL if there is a hand-written requestAnimationFrame loop, hand-built inputs or
scrubber, or a bare animation with no way to tune or replay it.
