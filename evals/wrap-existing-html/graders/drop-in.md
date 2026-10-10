---
type: llm
weight: 2
focus: { source: file, path: src/HeroHarness.tsx }
---
This file is a harness around an existing static page (`/hero.html`). PASS only if it:
- loads the page in an iframe through a bridge (e.g. `FrameSurface` with the studio-bridge postMessage script), rather than copying the page's markup into React;
- drives `--accent` and `--headline-size` as CSS variables and the headline copy as text, from a param schema;
- shows at least two widths side by side (desktop and mobile);
- deals with iframes swallowing pointer / wheel events on the canvas (an interact / hand mode, a shield, or the kit surface's built-in handling).
FAIL if the page is rewritten or ported, or there is only one viewport.
