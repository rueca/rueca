# Toolcraft (pixel-point/toolcraft, MIT) — evaluation 2026-10-09
Verdict: **build our own, borrow selectively** (credit MIT notice on any ported code).

## What it is
"Agent builds a bespoke design app from scratch." CLI `create` copies a ~1,900-file starter (~280k lines incl. tests; UI 26k). Empty build = 2.4 MB JS. React-only public API. Desktop-only (modal <1024px / touch). No updates after generation; public repo is a generated mirror of a private monorepo. AGENTS.md + docs ≈ 58k words (~75–80k tokens), legalistic rules (verbatim user quotes to enable export, signed integrity manifest). Pixel Point spends 1–3 days, 30–50 iterations per app.

## Strong
Schema (`defineToolcraft`): sections → keyed controls with `target` path, `applicability`, `keyframeable`, `editableRange` (soft vs hard), `layoutGroups` (inline rows), `description` tooltip, custom control renderers. Store: reducer + commands, transient lanes (playback/viewport out of undo), history merge groups, sliced persistence. Export via mediabunny (MP4/WebM), PNG/JPG 2K/4K/8K, real SVG, settings JSON, **"Save defaults" writes app-defaults.json back to source in dev**. Canvas: artboard vs infinite, render scale, radar recenter, Space pan. Look: Figma-UI3-like, floating translucent 300px inspector (75% + backdrop-blur), snaps L/R, uppercase section labels, sticky export bar, preset thumbnail grids, bottom-centre toolbar pill.

## Weak / gaps (our differentiation)
No scrub number fields · hex-only colour, no OKLCH/P3/eyedropper · curve editor keyboard-dead · layers have no properties · no UI-design, flows, journey maps, node graphs · no batch multi-size · no AI playground primitives · no before/after, masks are soft ellipses · no presentation mode · no touch · can't wrap an existing prototype · heavy process.

## Borrow
editableRange (soft/hard) · layoutGroups · custom control registry · transient lanes · history merge groups · "save defaults to source" (dev) · radar recenter · pause preview during pan/zoom · interaction ownership rule (an operation lives on canvas OR panel, not both) · seamless forward-only loops · motion-reference study from a video · schema-lint as quick check · AnchorGrid, Curves (RGB), ChannelMixer, FontPicker, OrientationGizmo designs.

## Positioning
Ours: "a design-tool harness that drops in around the prototype you already have, in any runtime, installed component-by-component and kept up to date." Must match its visual polish.
