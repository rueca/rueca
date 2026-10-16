# Bento

Rafael's brand bento (his grid, 16 Oct 2026), animated as one seamless loop of about 14 s in Mora, built as a Rueca tool: inspector, timeline, presets, comments, export.

- **Open it:** run the `brand-board` dev server (`.claude/launch.json`), then go to `/brand/bento/`.
- **Render the video:** `node brand/bento/render.mjs --size 1080`. This needs the dev server running, plus `--fps 60` and `--size 2160` as you like. It writes `renders/rueca-bento-<size>x<size>-<fps>.mp4` and a poster PNG.

## What moves

The grid holds still and one thing moves at a time. Everything keeps a 2.4 s beat, six beats to a loop.

| Tile | Motion |
|---|---|
| Logo | Plays the approved logo animation (E2) at lockup size, then clears before the loop restarts. |
| Close-up wheel | Colour fans keep setting off round it, each at its own speed. Set Close-up to Race for the logo race instead. |
| Palette | Each swatch is its fill over a sliver of its text shade. On each beat the sliver rises and the next comes up from the bottom. The splits step irregularly. |
| Poster | The card stays still. The ruled page beside it swipes to the next kit drawing's note and colour. The pen circles "prototype", underlines "tool", and points "open source" at the logo. |
| fig | The pen deletes and rewrites fig.1 … fig.6 with the kit drawings, with redline specs measured from the fig. |
| Kit drawings | Each one slides in on a sheet of a colour paired with its accent, settles, and its parts lift apart and come back. |

## Files

- `artifact.ts`: the drawing and timing, pure functions of values and time.
- `assets.ts`: fonts, the lockup, the kit drawings rasterised from `src/landing/art` (light theme, notes hidden, 41 steps of their parts' travel) and the pen strokes.
- `art/handoff.build.mjs` → `art/handoff.ts`: a portrait Hand-off drawing for the bento only. The landing keeps its own.
- `lockups.ts`: the Host Grotesk wordmark and Rafael's outlined "fig.1", copied from the shipped lockup and his file.
