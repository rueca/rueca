# Six reference tools — control matrix (kit defaults)
Spline · Paper · Figma (+Motion) · Framer · Affinity (Canva) · Rive. Research agent 2026-10-09; ✓ verified in docs, ~ inferred.

| Control | Notable precedent | Kit default |
|---|---|---|
| Number scrub | Figma label-drag, 4 speeds ✓; Affinity drag + wheel, expression validity tint (red/green/orange) ✓ | Label + value scrub; Shift ×10 Alt ×0.1; expressions; validity tint |
| Slider | Paper shader sliders with snap points ✓; Framer number = slider+field ✓ | Slider + field, **detents** at default & round values |
| Angle | Paper Angle param ✓; Affinity shift-snap ✓ | Degree field; dial only for direction params; Shift 15° |
| Vec2 | Affinity X/Y + 9-point anchor ✓; Framer Gap X/Y ✓ | Paired fields, shared scrub label; pad in popover for 0–1 |
| W×H lock | Figma ✓; Affinity link + relational input (w/3*2) ✓ | Chain toggle; w/h in expressions |
| Colour | Paper OKLCH + auto sRGB/P3 ✓; Framer P3 ✓; Affinity HSL wheel/CMYK/LAB/noise ✓ | Square+hue; Hex/RGB/HSL/OKLCH; P3 badge; eyedropper; doc swatches |
| Gradient | Paper on-canvas handles+snap ✓; Affinity Fill Tool on canvas, 7 types ✓; Rive stop bar ✓ | Stop bar in popover + canvas handles; Linear/Radial/Conic; Reverse, Rotate 90° |
| Fill stack | Paper, Figma, Affinity Appearance, Rive "+" ✓; Spline material layers ✓ | Fills list: + header; swatch, value, opacity, blend, eye, remove; drag reorder |
| Opacity+blend | Paper numpad opacity ✓ | Blend dropdown + %; number keys set opacity |
| Easing | Figma Motion 8 presets + cubic ✓; Rive Linear/Cubic/Hold/Elastic ✓; Spline ✓ | Preset list + bezier + pasteable cubic-bezier() |
| Spring | Framer **Time + Bounce** ✓; Figma presets Gentle/Quick/Bouncy/Slow ✓; Spline mass/stiffness/damping/velocity ✓ | **Duration + Bounce default**, physics toggle, live curve |
| Keyframe toggle | Rive grey→blue stroke→blue fill ✓; Figma Motion diamond + red auto-key ✓ | 3-state diamond + red auto-key |
| Segmented | Framer Enum segmented ✓; Rive row/col ✓ | 2–5 options; icons + tooltip; radiogroup |
| Dropdown | Spline lighting type ✓ | >5 options; type-ahead |
| Font picker | Paper variable axes ✓; Rive axes flyout ✓; Framer Font control ✓ | Searchable, live preview, recents, axes flyout |
| Binding | Spline dot ✓; Paper token dropdown ✓; Figma `=` ✓; Framer "+" ✓; Rive Data Bind ✓ | Hover icon + `=` + right-click; chip; Backspace detaches |
| Align/constraints | Rive 3×3 + Fixed/Hug/Fill ✓; Affinity constraint diagram ✓ | 3×3 align grid; constraints box |
| Padding/radius | Rive per-edge, pt/% ✓; Affinity corner types ✓ | One field + "independent" toggle → 4; canvas handles |
| Effects stack | Spline post-fx ✓; Paper Filter/Shadow panels ✓; Figma 7 effect types ✓; Affinity live filters as child layers ✓ | Effects list like Fills; rows expand; + menu by category |
| Switch/checkbox | Framer boolean custom titles ✓ | Checkbox in lists; switch for immediate on/off |
| Image fill | Figma Fill/Fit/Crop/Tile ✓; Affinity frames ✓ | Thumb + Replace; mode; focal point |
| 3D xyz | Spline pos/rot/scale ✓; Framer 3D rotate ✓ | XYZ rows, shared scrub label, uniform lock |
| Material/light | Spline Lambert/Phong/Physical/Toon, lights ✓ | Material as layer stack; light row = type+intensity+colour+shadow |
| Camera | Spline persp/ortho (M), view helper axis dots, ⌥-drag orbit ✓ | Axis gizmo in corner; M projection; Alt-drag orbit |
| State/inputs | Rive Trigger/Boolean/Number ✓; Spline 16 events ✓; Framer variants ✓ | Inputs list (trigger, switch, number) + event→action rows |
| Layer rows | Affinity thumb on checker, Alt-chevron = all ✓; Figma hover eye/lock ✓ | 28px, type icon, Alt-chevron, eye/lock hover, fx children |
| Shader params | Framer property controls ✓; Paper presets+snap ✓ | Schema-generated (Framer ControlType-like) |
| Context toolbar | Affinity floating top-centre, snappable, tool/selection-aware ✓ | Selection-aware floating bar (bottom centre), 3–6 actions |

## Borrow from each
- **Spline:** empty selection → scene settings in inspector; materials/effects as stacks; dot-to-bind; ⌘\ hides UI; Agent tab first.
- **Paper:** OKLCH first-class; slider detents; on-canvas spacing handles; CSS-named sections; ⌘. hides UI.
- **Figma:** default mental model for rows, hover affordances, Motion timeline grammar. Exceed it on colour.
- **Framer:** ControlType schema as the inspector API; Duration+Bounce springs; ⌘± doubles/halves.
- **Affinity:** expression validity colouring, w/h references, selection-aware context bar, **Studios** = mode presets swapping panel sets (Design / Animate / Tune).
- **Rive:** 3-state key button; Trigger/Boolean/Number inputs for exposing prototype state; pt/% unit toggle in fields.

## Changes to kit (from this)
1. OKLCH + P3 indicator. 2. Expression validity tint + w/h refs. 3. Springs default Duration+Bounce. 4. Schema ≈ Framer property controls. 5. Empty selection shows document settings.
