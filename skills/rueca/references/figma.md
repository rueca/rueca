# Sourcing content and reference

## From Figma

- **`get_design_context` strips the `visible` flag.** Building from it pulls in hidden
  alternates — dead cards, superseded layouts, old placeholders. Use the raw file-nodes
  REST call (`GET /v1/files/:key/nodes`), which keeps `visible`, and prune the tree. In
  one real file 34 of 212 nodes were `visible: false`, including three entire hero cards
  and every tile's info tag.
- **Export composited frames, not individual layers.** Rendering the frame gives
  gradients, masks and baked-in effects exactly, and sidesteps guessing which of six
  stacked images is visible. Exports come back at exact multiples of the frame size, so
  `width: 100%; height: 100%` fits with no cropping maths — and if an effect is baked
  into the export, delete your CSS equivalent or it doubles up.
- Component *instances* often fail to render via the image API; export the inner frame
  instead.
- Pull real numbers — fills, radii, letter-spacing, line-height — rather than
  eyeballing. Then **say where the design diverges from the brand palette** rather than
  silently "fixing" it.

## Visual reference from the web

Scraping mood-board sites (Cosmos, Pinterest clusters) for *tool UI* has a terrible hit
rate — one attempt returned 411 images containing 2 interfaces. Marketing sites mostly
expose only an `og:image`. For tool-chrome reference go straight to product screenshots
or docs of the reference tools (Figma, Framer, Spline, Paper, Affinity, Rive), or work
from `visual-rules.md`. If a harvest fails, say so plainly rather than dressing up a thin
result.

## Brand

When the prototype is for a brand, load that brand's skill or guidelines and apply them
**inside the artboard only**. Flag every taste or brand call as the person's decision,
and show rendered options rather than describing them.
