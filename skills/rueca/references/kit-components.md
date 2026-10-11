<!-- Copied from docs/KIT.md §6b– by `npm run sync`. Edit the source, not this file. -->

> In a project that installed the kit from the registry, `@kit` means `@/components/studio` (or alias it). Live examples of every shell: https://rueca.dev/ · source: https://github.com/rueca/rueca/tree/main/src/shells

## 6b. Specialist components (promoted from the shells)

All exported from `@kit`. Each file opens with a usage header — read it before using the component.

**Time & motion** — `KeyTimeline` (editable keyframe lanes: drag/snap/marquee, segment → easing popover,
auto-key ring; `KeyLane`, `TimelineKey`) · `TrackTimeline` (multi-track clips: move/trim/snap, track
rename/hide/lock, zoom, follow) · `ruler` helpers (`rulerTicks`, `RulerTicks`, `PlayheadCap/Line`,
`usePlayhead` paints from the clock without React) · `KeyButton` (4-state keyframe diamond ◀ ▶) ·
`EasingEditor` (presets · curve · spring · hold) · `SpringField` (Duration + Bounce, physics toggle) ·
`EnvelopeEditor` (ADSR) · `core/ease`: `cubicBezier`, `EASINGS`, `SPRINGS`, `springAt`,
`springToPhysics`/`physicsToSpring`, `cssEasing`, `cssLinear`.

**Stacks, presets, compare** — `EffectStack` (fills · effects · adjustments: eye, swatch/thumb,
blend chip, opacity scrub, reorder by drag or ⌥↑↓, + menu by category, expandable params; per-action
callbacks or `onChange(next, final)`) · `PresetGrid` + `Filmstrip` (thumbnails, hover/focus preview) ·
`CompareSplit` (wipe · handle · side-by-side, keyboard divider, hold-key peek).

**Photo & 3D** — `Histogram` (+ `histogramBins`) · `ToneCurve` (+ `sampleCurve`) · `GradientSlider` /
`ParamSlider` (painted tracks; or `track: 'linear-gradient(…)'` on any number def) · `CropOverlay`
(+ `fitInsideRotated`, `rectForAspect`) · `Navigator` (mini-map) · `AxisGizmo` (click an axis to snap the
view; takes a matrix, quaternion or yaw/pitch) · `useImageIntake` (window drop / paste / ⌘O; object URLs,
filename kept, never in params) · `useFitFrame` (fixed-aspect frame that avoids overlay panels).

**Canvas editing** — `TransformBox` (8 handles, rotation, W×H badge; `resizeRect`, `rotateDelta`) ·
`snapRect` / `snapEdges` / `measure` + `<Guides>` (smart guides, ⌥ distances) · `ContextBar`
(selection-aware floating actions, Affinity) · `AlignGrid` (3×3) · `QuadField` (padding / per-corner
radius) · `PaintField` (solid / linear / radial / image; `paintCSS`) · `ViewportFrame` (resizable
breakpoints with presets).

**Colour & code** — `OklchField` (L·C·H with sRGB/P3 gamut markers; also the colour panel's "Lch" mode) ·
`readableOn(hex)` (darken until white text clears AA — for `cat-*` avatars, pins, tags) · `CodeBlock`
(copy, language tabs, line numbers).

**Generators & data** — `VariantGrid` (keep / favourite / hover actions, arrow-key cursor) + `SizeLadder`
(real-pixel previews) · `DataGrid` (spreadsheet: inline edit, keyboard nav, paste CSV/TSV; `parseDelimited`,
`toCSV`) · `JobQueue` + `Progress` + `createJobRunner()` (render queues with cancel) · `Masonry` ·
`PromptBox` (⌘↵ submit, chips) · `ChipInput` (tags) · `InlineText` (double-click rename) ·
`smoothPath` / `smoothArea` and rect helpers (`core/geometry`).

**Structure & overlays** — `SplitPane` (resizable, keyboard separator, persisted) · `Dialog` + `confirm()` /
`promptText()` (never `window.prompt`) · `QuickAdd` (search popover at a point — Tab / double-click /
dropped wire to add a node) · `@kit/xyflow.css` (React Flow in kit tokens under `.studio-flow`; keep the
attribution visible).

## 7. Conventions borrowed from Spline · Paper · Figma · Framer · Affinity · Rive

See `research/04-six-tool-matrix.md` (control-by-control defaults) and
`research/02-pro-tool-patterns.md` (inspector, timeline, layers, canvas, shortcuts). Highlights:
Space play · `,` `.` frame step · J/K prev/next key · Shift+0/1 zoom · `\` A/B · ⌘K palette ·
`?` shortcuts · ⌘\ hide UI · keyframe diamond: hollow faint → hollow accent → solid accent ·
springs default Duration + Bounce · fills/effects as stacks with eye + blend + opacity ·
Affinity-style selection-aware context bar · Rive Trigger/Boolean/Number inputs.
