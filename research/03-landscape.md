# What designers vibe-code (2025 – Oct 2026) — condensed
Source: research agent 2026-10-09 (HN Algolia, buildertools.sh, vibing.inc, product pages). X/Reddit unreachable.

## Direct prior art (!)
- **Toolcraft** github.com/pixel-point/toolcraft — Show HN Sep 2026, MIT. "AI harness for design apps": canvas pan/zoom, layers, keyframe timeline, sliders, font pickers, palettes, curve editors, image upload, image/video export. React + Tailwind + Base UI.
- **DialKit** (Josh Puckett) — agent-aware tuning panel, presets, timeline, "copy prompt for your agent".
- **Figma PropsKit** (Rogie King) — web components so Figma's agent builds native-looking control panels for generative plugins/shaders.
- **Primitives** (Dusk Research) — calls its tools "instruments".

## Categories by strength
1. Image effects (dither/ASCII/halftone/CRT) — strongest. Efecto, Grainrad, Tooooools, ASCII Studio.
2. Shader/gradient — Paper Shaders, Shader Lab (basement: layers + inspector + timeline), Gradient Lab, Unicorn Studio.
3. Generative/pattern — Oddgrid (space reroll, PNG/SVG/MP4 6000px).
4. Logo/brand — thin publicly; built privately for clients.
5. Motion/easing/spring — DialKit, spring tuners (curve beside animated object), CURVE.
6. 3D — Holocloth, Liquid Orb (state in URL hash), Madera.
7. Photo/LUT — Luttie (curves, wheels, .cube).
8. Type — Space Type Generator (no export!), Font Playground, Pretext wave.
9. UI/token playgrounds — tweakcn, Bencho (exports agent prompts).
10. UX flow mapping — weak; SaaS only.
11. Audio — musician-made.
12. Social/ad batch — real gap solved privately (multi-size batch export).
13. AI playgrounds — prompt + masks + version history.
14. Remotion video — agent-driven, lacks tuning UI (opportunity).

## Recurring components (ranked)
slider+value · export menu · presets · mode/effect picker · palette swatches (OKLCH) · drop zone · randomize/seed · copy code / copy agent prompt · play/pause+speed · canvas size/aspect presets · toggles · folders · timeline · layers/effect stack · curve editor · share URL (hash) · before/after toggle · XY pad, HUD readouts, pre-processing chain.
Export: PNG ~95%, MP4/WebM ~40%, code, SVG, GIF, JSON; Lottie none.

## Layout archetypes
1 full-bleed canvas + inspector (dominant) · 2 floating overlay panel · 3 mini After Effects (layers L, canvas, inspector R, timeline B) · 4 gallery grid → detail · 5 live UI preview + token panel · 6 graph + object preview · 7 mode toggle between views · 8 chat/code + canvas · 9 node graph (AI pipelines).

## Pain points
performance (FPS cap, resolution switching) · missing export · no undo/version history · AI-slop look (Inter + purple + shadcn default) · thin bespoke controls · people replacing Leva with custom panels.

## Differentiation (agent's suggestion)
presentation-grade client-facing chrome · multi-size batch export · undo + version snapshots · motion/Remotion tuning UI.
