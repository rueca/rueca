# 23 · Icons after the density pass (2026-10-15)

Rafael's brief: QA the icon library against today's tactical-density changes, and check whether a different library would look better at small sizes and hold up at large ones.

Boards are in [`23-icons/`](23-icons/). `board.html` opens in a browser: 11 variants × 26 of the kit's most-used glyphs, at 12 / 14 / 16 / 20 and 48px, on the kit's panel colours.

## What we found

**1. The icons are lighter than the text around them.** Lucide is drawn on a 24px grid. The kit shrinks it to 11–14px but keeps a 1.5–2 stroke, so the line that reaches the screen is thinner than the stroke number says. Measured in the motion shell:

| Size × stroke as written | Line on screen | Uses in `src/` |
|---|---|---|
| 14 × 1.5 | 0.88px | most toolbar and row icons |
| 13 × 1.5 | 0.81px | bookmark, gauge, ± steppers |
| 12 × 1.75 | 0.88px | chevrons |
| 12 × 2 | 1.00px | a few |
| 14 × 1.75 | 1.02px | a few |
| 11 × 1.5 | 0.69px | 28 uses |

Today's density pass moved all UI text to 11px Inter at weight 450, with stems a little over 1px wide. Icons at 0.8–0.9px now read a step fainter than the labels beside them, and six different line weights appear in one toolbar.

**2. Odd sizes and text-driven positions put icons between pixels.** 13px and 11px icons centred in even boxes land on half pixels (80 uses of 13px and 28 of 11px). In toolbars, icons that follow text ("Custom ▾") inherit its fractional width and land at x = .48 or .84. On Retina this hardly shows. On an ordinary 1x monitor it turns thin lines into grey smears (`closeup-14px-1x-screen.png`).

**3. No free library is clearly better across the board.** Ten sets compared:

| Set | Grid | Glyphs | At 14px | Covers the kit? |
|---|---|---|---|---|
| **Lucide** (today) | 24 | 1,962 | Soft and light as shipped. Firm once the line is fixed (below). | Yes, all 155 we use |
| Tabler | 24 | 6,286 | Same grid problem as Lucide, a touch lighter | Yes |
| Phosphor | 256 | 9,161 (6 weights) | The softest of the ten at 14px | Mostly |
| Radix Icons | 15 | 342 | Crispest outline set at 14–15px, very TE | No: no undo/redo, pipette, spline, gauge, monitor, repeat… |
| Gravity UI (Yandex) | 16 | 799 | Even, firm weight that matches 11px text | No: same gaps as Radix |
| Octicons (GitHub) | 16 / 24 | ~330 unique | Firm and clean, GitHub voice | No |
| Codicons (VS Code) | 16 | 659 | Sharp but hairline-thin | No |
| Heroicons micro | 16 | ~320 | Solid fills: legible, too heavy for this chrome | No |
| Fluent (Microsoft) | drawn per size | 20,000+ | Good hinting, reads as Windows | Yes, wrong voice |
| Carbon (IBM) | 32 | 2,776 | Light at 14; reads as IBM | Mostly |

The 16-grid sets (Radix, Gravity, Octicons) do look better at 14px on a 1x screen. But each covers under half of what the kit draws: the design-tool glyphs (pipette, spline, keyframe, gauge, repeat, timer, monitor, tablet) are the ones they lack. Switching would mean running two libraries side by side, and that mix looks worse than one consistent set.

Central Icons, the paid set with 1 / 1.5 / 2px line options, would solve the weight problem. It needs a licence key per install, though, so it can't ship in an open-source MIT registry that strangers install.

**4. Lucide carries weight beyond its looks.** It's shadcn's default and the icon set agents write most reliably. People installing Rueca usually have it already. A different chrome set would add a dependency to every install and leave agents guessing names.

**5. Large scale is fine.** At 48px, Lucide, Phosphor, Tabler and Gravity all hold up (`board-ten-sets@2x.png`, bottom). The shells' own artwork (the ui-design phone screens and so on) can keep Lucide at its default 2px line.

## Recommendation: keep Lucide, fix how it's drawn

Same library and glyphs, with three drawing rules:

1. **One line weight: 1.25px on screen, at every size.** Icons are sized at ~440 call sites with no shared wrapper, so do it in `theme.css`: `svg.lucide { stroke-width: 1.25px }` plus `vector-effect: non-scaling-stroke` on its children. Tested on the motion shell, it renders the same as fixing each call site. Scope it to the chrome so the shells' artwork, like the ui-design phone screens, keeps its own stroke. This replaces the 1.5 / 1.75 / 2 mix. `motion-before-after-retina.png` shows the motion shell's toolbar and transport before and after: the icons now match "Custom" and the timecode.
2. **Two chrome sizes: 12 (chevrons, field ×, steppers) and 14 (everything else); 16 in the tool dock.** Retire 11, 13 and 15. Even sizes in even boxes land on whole pixels.
3. **Simpler glyphs where Lucide offers them at 14px**, for example `trash` over `trash-2` and `sparkle` over `sparkles`. Fewer inner strokes stay legible at this size.

Update `visual-rules.md` and `KIT.md` ("14px at 1.5 stroke") to match, so agents building new shells follow the same rule. Add a QA check that flags any `svg.lucide` whose on-screen line isn't 1.25px.

If we ever want the 16-grid crispness, the cleanest route is to draw our own ~40 core chrome glyphs on a 16 grid in the Lucide style and keep Lucide for everything else. That's a brand project, not a library swap.
