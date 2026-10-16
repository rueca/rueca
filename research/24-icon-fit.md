# 24 · Does each icon mean what it does? (2026-10-15)

Rafael's brief: check that every icon fits its action. His example was Grain wearing the Sparkles icon, which reads as "AI". Be critical, and research the unclear ones.

Method: listed all ~1,200 icon uses across the kit and 19 shells with the line each sits on, and judged each against its label. For the unclear ones, rendered candidates side by side at 14px and 28px (`24-icon-fit/candidates.png`) and checked conventions in Photoshop, Figma, Houdini, DAWs and Midjourney. Mobbin wasn't connected, so it wasn't used.

## What was wrong

**Sparkles was doing six jobs.** It now means AI, so it stays only where the action really is generative AI (Generate in the image shell). Everywhere else it was misleading:

| Where | Action | Was | Now |
|---|---|---|---|
| Shader | Grain layer | Sparkles | **Grain** (new, scattered dots) |
| Dither | Use the sample image | Sparkles | Images (matches photo) |
| Synth | Humanise velocities | Sparkles | Fingerprint |
| Type | Kinetic mode | Sparkles | Play |
| Marks | More like this | Sparkles | Grid2x2Plus |
| Generate | Variations | Sparkles (same as Generate) | Grid2x2Plus |

**Icons that said something else:**

| Where | Action | Was | Now | Why |
|---|---|---|---|---|
| Timeline (kit) | Play once | Repeat1 | ArrowRightToLine | Repeat1 means "repeat one track" |
| Nodes | Bypass node | Eye / EyeOff | Power / PowerOff | Bypassed nodes still pass their input through; they aren't hidden. Audio tools draw bypass as a power button. |
| Nodes, Shader | Gradient | SwatchBook / Sunset | **Gradient** (new) | A swatch book is a palette; the sunset was a pun |
| Nodes | Transform (2D) | Move3d | Move | The node is 2D |
| Nodes | Colour ramp | Palette | Rainbow | Same as the shader's gradient map |
| Nodes, Type | Blur | Droplets | Droplet | Photoshop's blur tool is a single drop |
| Generate | Upscale 2× | Maximize2 | ImageUpscale | Maximize reads as "full screen" |
| Generate | Enhance prompt | Wand2 (same as Remix) | PencilSparkles | AI editing text; Remix keeps the wand |
| Flows, Journey, Nodes, UI design, Timeline | Zoom to fit / frame all | Maximize, Maximize2 | Fullscreen | Frame selection keeps Focus |
| Flows | Mermaid (.mmd) | Share2 | FileCode | Share2 is "share to network"; Mermaid is a text file |
| Batch | Share & copy | ArrowRightLeft | Link | Arrows meant "swap"; the kit uses Link |
| Batch | Empty "Every size is hidden" | Eye | EyeOff | |
| Photo | Hold to see original | Contrast | Eye | In a photo editor, Contrast reads as the contrast slider |
| Photo | Engine couldn't start | X | TriangleAlert | It's an error, not a close |
| Scene | Speaker mesh | Package | Speaker | |
| Animate | Group layer | Boxes | Group | |
| Marks | Clear favourites | Eraser | StarOff | |
| Marks | Export SVG | Download | PenTool | Same as animate's SVG export |
| Synth | Mute track | Volume2 | VolumeX | |
| Notes (kit) | Show the state it was made in | RotateCcw | History | RotateCcw is "reset" everywhere else |
| UI design | Reset rotation | ArrowDownToLine | RotateCcw | |
| UI design | Rotate 90° left | RotateCcw | RotateCcwSquare | |
| UI design | Fixed / Hug / Fill | Scan / SquareDashed / Maximize2 | RulerDimensionLine / Fold / Unfold (per axis) | Arrows pointing in and out, as in Figma |
| UI design | Gap field | PanelLeft rotated / PanelTop | AlignHorizontalSpaceBetween / AlignVerticalSpaceBetween | |
| UI design | Opacity field | Sun | Blend | Sun reads as brightness. The effect-settings sun stays (Figma convention). |
| Present | Copy client link | Send | Smartphone | Send already means "Send to agent"; the kit uses Smartphone |
| Video | Progress clip | CircleDashed (the Ring icon) | Minus | Matches the clip list |

**One action, one icon:**
- *Duplicate* is now CopyPlus everywhere, 20 places. Copy stays for copying to the clipboard. Flows, ui-design and nodes had both in the same menu with the same icon.
- *Copy* to the clipboard is Copy. Clipboard and ClipboardCopy are retired.
- *Share & copy* triggers use the kit's Link. Braces had crept into component-lab, dither, photo and shader.
- *Reset to demo* is RotateCcw, like every other reset. RefreshCw and Rows3 are retired.
- *Ping-pong* is ArrowLeftRight in both timelines. *Comment* is MessageCirclePlus, the same bubble as the flows and ui-design comment tools.
- *Copy ASCII* in dither is ClipboardType in the toolbar and the menus. It used to be Type in one and Copy in the other.

## New icons

`src/shells/icons.ts` adds two icons Lucide lacks: **Grain** (after Tabler's `grain`) and **Gradient** (rules that break up as they fall). Both are built with `createLucideIcon`, so they take the same props, type and stroke rules as any Lucide icon.

## Looked at and kept

- **Frame tool = Hash**: Figma's frame tool is literally `#`.
- **Independent values = Scan**: Figma's independent-corners toggle uses corner brackets.
- **Effect settings = Sun**: Figma's effect row uses a sun.
- **Vignette = Focus**: tried Tabler's vignette, but at 14px it reads as a dotted disc.
- **Tidy up = Network**: it lays the graph out as a tree, which is what the icon shows.
- **Clipping warnings = Triangle**: Lightroom's histogram triangles.
- **Tailwind = Wind, onion skin = Layers, Noise = Waves, Posterize = Contrast**: weak, but nothing in Lucide is clearly better.

## Verified

Typecheck, 106 tests and the sync check pass. Checked on screen in the shader, nodes, synth and marks shells (`24-icon-fit/*-after.png`).
