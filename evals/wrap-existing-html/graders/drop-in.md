---
type: llm
weight: 2
focus: { source: file, path: src/HeroHarness.tsx }
---
This file is a harness around an existing static page (`/hero.html`, served from the same project). PASS only if it:
- loads the page in an iframe (e.g. `FrameSurface`) rather than copying the page's markup into React. Either way of
  reaching the page passes: on the same origin, writing into it directly (`cssVars`, `apply={(doc, v) => …}` or
  `contentDocument`) and leaving the page untouched; or, on another origin, through the studio-bridge postMessage
  script added to the page. Don't require the bridge script when the harness and the page share an origin;
- drives `--accent` and `--headline-size` as CSS variables and the headline copy as text, from a param schema;
- shows at least two widths side by side (desktop and mobile);
- deals with iframes swallowing pointer / wheel events on the canvas (an interact / hand mode, a shield, or the kit surface's built-in handling).
FAIL if the page is rewritten or ported, or there is only one viewport.
