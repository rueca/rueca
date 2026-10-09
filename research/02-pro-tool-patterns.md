# Pro-tool pattern catalogue — condensed kit defaults
Source: research agent 2026-10-09 (Figma UI3 + Figma Motion, Blender, Rive, AE, Cavalry, Jitter, Lightroom, Resolve, Cables, TouchDesigner, Spectrum 2, APG/WCAG). [V]=verified.

## Inspector
- 28px row / 24px control; compact 24px. 11px text, tabular nums. ~80px label column. Labels visible by default; aria-label kept when hidden (Figma UI3 lesson [V]).
- Scrub: label is a scrub handle AND value is click-to-type. Shift ×10, Alt ×0.1. Pointer lock, 3px dead zone. Esc cancels scrub. One drag = one undo step. Soft range for scrub, hard range for typing (Blender [V]). Figma: vertical distance changes speed [V]. TouchDesigner value ladder [V].
- Keys: ↑↓ step, shift ×10, alt ×0.1, PgUp/PgDn, Home/End, Enter commit, Esc revert. Wheel only when focused.
- Expressions: + - * / ^ ( ), units px % ° ms s; leading operator = relative ("Mixed + 24") [V]. `=` opens variable binding (Figma [V]); `#` = driver (Blender [V]).
- Mixed: "Mixed" placeholder, scrub applies delta.
- Keyframe diamond right of each animatable field: hollow faint (hover) → hollow accent (animated) → solid accent (key at playhead); orange = edited not keyed; purple = bound. Shape + colour (WCAG 1.4.1).
- Section header 32px; alt-click = solo-open; collapse persisted.
- Row context menu: Reset, Copy/Paste value, Add key, Bind, Copy as CSS. Dbl-click label = reset. Dot on changed.

## Timeline
- Seconds default (Figma Motion: ms/s [V]), frames optional. Dual readout `1.250s / f75 @60`.
- Playhead red/orange, NOT accent. Click/drag ruler to scrub; shift snaps to keys.
- Diamonds for keys; segment between keys shows easing; dashed = hold/no change (Cavalry [V]). Click segment → easing popover (Figma Motion / Theatre [V]).
- Loop region: shift-drag ruler; B/N set in/out (AE). Loop / Once / Ping-pong (Rive, Figma Motion [V]).
- Rows 24px, indent 12px. "Animated only" / "Selected only" filters.
- ⌘wheel zoom, shift-wheel pan, F fit. Snap threshold 8px.
- Transport: Space, `,` `.` frame step (shift ×10), J/K prev/next key, ⌘⇧,/. start/end.
- Auto-key: red ring + red playhead (Figma Motion [V]).

## Layers
- 28px rows, 12px indent, eye/lock on hover (kept when active), ⌘⇧H / ⌘⇧L. 2px accent insertion line on drag. Effects as children with own eye, blend, opacity (Photoshop/Unicorn/Paper [V]). Alt-click eye = solo.

## Canvas
- Figma UI3 DROPPED floating side panels for main editor — slower, crowded small screens [V]. → Offer both docked and floating.
- Bottom-centre floating toolbar 40px. Zoom pill bottom-right. Shift+0/1/2 = 100%/fit/selection [V]. Space-drag pan; ⌘wheel/pinch zoom at cursor. Artboard label above top-left. Shift+R rulers. ⌘\ hide UI.

## Node graphs
- Ports 8px coloured by type; header category stripe; Tab/double-click = add-node search (Cables [V]); selection fills inspector.

## Photo / colour
- `\` before/after (hold to peek), Y split (Lightroom [V]). Histogram with clipping triangles. Colour wheels (Lift/Gamma/Gain) with luminance ring + reset (Resolve). Hover preset = preview.

## Palette & shortcuts
- ⌘K palette (cmdk), `?` shortcut sheet. Full map in research agent output.

## Tokens
- Spectrum 2 dark ramp [V]: 25 #111 · 50 #1B1B1B · 75 #222 · 100 #2C2C2C · 200 #323232 · 300 #393939 · 400 #444 · 500 #6D6D6D · 600 #8A8A8A · 700 #AFAFAF · 800 #DBDBDB · 900 #F2F2F2. Focus ring 2px + 2px gap. Accent only for high-attention moments.

## A11y
- spinbutton on the input; aria-valuetext with units. WCAG 2.5.7: every drag needs a non-drag alternative. 2.5.8: 24px targets. Hover-only icons also on :focus-within. prefers-reduced-motion for chrome only, not the artwork.
