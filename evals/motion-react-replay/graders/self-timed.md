---
type: llm
weight: 2
focus: { source: file, path: src/ToastTuner.tsx }
---
This file is a tuning tool around `Toast`, a motion/react component that times its own entrance. The rule for a
self-timed component: feed it the values as props and replay it by changing its React `key`; don't rebuild its
motion on a clock. PASS only if:
- the spring (stiffness / damping / mass, or a `p.spring`), the travel distance and the starting scale are params in
  one kit schema (`defineSchema` / `p.*`) shown in the kit `Inspector`;
- those values reach `Toast` as props, and motion/react still runs the animation;
- replay works by changing the `key` on `Toast`, from a button AND a hotkey (`R`), and it also replays after a value
  is committed so each change can be seen;
- there is no hand-built timeline or scrubber pretending to scrub the motion (no `Timeline` wired to a clock that
  Toast ignores), and no hand-written requestAnimationFrame loop or re-implemented spring.
FAIL if the animation is rebuilt by hand, if replay needs a page reload, or if the inputs are hand-built.
