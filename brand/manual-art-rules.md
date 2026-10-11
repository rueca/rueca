# Manual-art polish rules (landing "How it works" + kit sheets)

Distilled on 11 Oct 2026 from: assembly-manual practice (IKEA's two principles, *clarity* and *continuity*: one unchanging viewpoint, one new part per step, large spacing, enlarged details); drafting standards (ISO 128 line types and the ~2:1 thick/thin ratio; leader conventions: thin continuous line, never crossing other lines or the object, never parallel to nearby lines, angled, ending in a short horizontal shoulder at the text, terminated by an arrow on an edge or a dot on a face; text never touching its line); illustration composition (no tangents: edges either overlap clearly or keep a real gap; keep the subject off the frame edge); and the anatomy / hairline skills installed in `~/.claude/skills` (lines land on something, one accent, calm thin lines, the rest pose is designed and holds up as a thumbnail, the subject fills ~55–65 % of the card, sizes consistent across a set, "measure, then look", 4× close-ups, abstract floating stacks read as nothing).

They apply to `src/landing/manualArt.tsx`. `brand/manual-preview.html` renders every drawing at its real landing sizes and runs the audit (`?audit`).

## Sizes it is actually seen at (measured 11 Oct)
| Drawing | viewBox | Rendered | Scale |
|---|---|---|---|
| Kit sheet | 300 × 300 (square tile since 11 Oct) | 325–373 px (1024–1440), 366 on a phone | 1.08–1.24 |
| Step sheet, desktop | 360 × 360 (square cell since 11 Oct) | 561–644 px | 1.56–1.79 |
| Step sheet, phone | 360 × 360 in a 351 × 470 card | 351 px wide | 0.98 (sets the type sizes) |

## The rules
1. **One viewpoint.** Everything is a flat orthographic front view. No perspective tricks mid-set.
2. **Composition.** The drawing (without notes) fills 55–65 % of the frame, centred on the optical centre (a touch above the middle). Keep ≥ 6 % of the frame clear at every edge. Notes and tags live in the margins, never inside the subject.
3. **Type in rendered pixels.** Plex labels ≥ 10 px, part-tag numerals ≥ 9 px, Añil dimension text ≥ 9 px, hand notes ≥ 14 px, at the *smallest* size each drawing is shown. Same rendered sizes across all six kit sheets and all three steps.
4. **Three pens, fixed jobs** (RUECA §2): Nogal draws, the measure pen measures (neutral ink, `var(--measure)`, the same as the sheet's dimension line and ticks; Rafael moved it off Añil on 11 Oct), Achiote corrects. Weights 1.4 / 0.8 / 0.5. Hidden or "was here" edges are dashed hairlines.
5. **One bright per drawing**, on the part that's new. Never two.
6. **Lines land.** Every leader, guide and arrow ends on a part's edge (arrowhead or dot) or on another line. No line stops in mid-air.
7. **Leaders**: Achiote hairline, straight, at 30–60°, with a short horizontal shoulder into the note; a dot where it lands on a face. They never cross a part or another leader, never run parallel to a nearby edge, and never touch their text (≥ 2 units).
8. **No tangents.** Separate objects keep a gap of at least 4 units, or overlap clearly. No near-misses, no edges that just kiss.
9. **Part tags** sit at a consistent position relative to their part (outside its bottom-right corner, 4 units off), on shared baselines when several sit in a row, never over a line.
10. **Grid.** Coordinates on a 4-unit grid; repeated things share exact spacing.
11. **Rest is designed.** The state before anything plays (kit P = 0, step idle) is a complete composition, not a half-empty frame.
12. **Explode honestly.** Parts move along one axis, far enough to clear their neighbours, leaving a dashed ghost in the exact slot they came from. Nothing passes through anything mid-move, and nothing leaves the frame.
13. **Real objects, not abstract stacks.** Layers are cards in a holder, not floating plates. Every part rests on, or is held by, something.
14. **Measure, then look.** Run the audit in both states at every size, fix to zero, then read 4× close-ups in both themes.
