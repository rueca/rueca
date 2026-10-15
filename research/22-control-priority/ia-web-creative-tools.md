# What faces the user, what nests: web creative tools (Rueca's closest peers)

Research for Rueca's inspector IA. Question: in the newer web-based creative and generative tools, which controls are visible at rest, which are nested, and how? Researched 15 Oct 2026.

Evidence key: **[V]** verified against the cited URL or the tool's source code. **[I]** inferred from secondhand material, partial evidence, or general knowledge of the product, so verify before relying on it. Control counts appear only where I could count them from source or docs.

Coverage was uneven. Paper Shaders, ShaderGradient and cables.gl were read in source code, so they are the strongest evidence. Midjourney, Runway and parts of Recraft come from search snippets of official docs that blocked fetching (403 or Cloudflare). I found nothing usable for Cosmos, Fontra's hidden axes, "Grainrad" or ditherit.com. Those entries are marked as gaps rather than filled in.

---

## Part 1: By tool

### Shader and effect playgrounds

#### Paper Shaders (shaders.paper.design)
- **Panel tech:** the docs site is Next.js with **Leva** as the control panel. [V] [docs/package.json](https://github.com/paper-design/shaders/blob/main/docs/package.json)
- **At rest (Mesh Gradient):** [V] [mesh-gradient/page.tsx](https://github.com/paper-design/shaders/blob/main/docs/src/app/(shaders)/mesh-gradient/page.tsx)
  - **Presets come first.** A `Presets` folder uses `order: -1`, so it sits above every slider. Mesh Gradient has 4 presets: Default, Ink, Purple, Beach.
  - Next is a colour list capped by `meshGradientMeta.maxColorCount` (the docs say "up to 10 color spots").
  - Then 4 shader-specific sliders (`distortion`, `swirl`, `grainMixer`, `grainOverlay`, order 200–203).
  - Then 5 shared sliders (`speed`, `scale`, `rotation`, `offsetX`, `offsetY`, order 300–304).
  - That makes **9 sliders plus colours** at rest.
- **Left out of the panel:** about 8 of the 15 "Common Props" in the API docs never appear in the panel. These include `frame`, `fit`, `worldWidth/Height`, `originX/Y`, `minPixelRatio` and `maxPixelCount`. They are reachable only in code. [V] [shaders.paper.design/mesh-gradient](https://shaders.paper.design/mesh-gradient)
- **Preset highlight:** a `usePresetHighlight` hook compares the current params with every preset and highlights the matching preset button. Once you drift off a preset, nothing is lit. [V] [use-preset-highlight.ts](https://github.com/paper-design/shaders/blob/main/docs/src/helpers/use-preset-highlight.ts)
- **URL state:** state syncs to the URL (`useUrlParams`). [V]
- **Rule they follow:** section order is presets, then "what makes this shader this shader", then generic transform and time. The panel shows only params that change the look. Layout and plumbing params stay in code.

#### ShaderGradient (shadergradient.co + Framer/Figma plugins)
Evidence is the Framer property-control definition in the repo. [V] [FramerControls.ts](https://github.com/ruucm/shadergradient/blob/main/packages/shadergradient/src/FramerControls.ts)
- **Top-level mode switch:** `control: Props | Query`. In Query mode **every** control is hidden and replaced by a single URL string. The whole look is one pasteable token.
- **Tab picker:** `activeTab` offers Shape, Colors, Effects and View. Each control has `hidden: props.activeTab !== 'X'`, so you see only one group at a time.
- **Conditional swaps inside a tab:**
  - **Animation:** `animate on` shows Speed. `animate off` swaps it for a "Movements" (time) stepper.
  - **Lighting:** `lightType: env` shows envPreset (City, Dawn, Lobby) and Reflection. `lightType: 3d` shows Brightness instead.
  - **Shape:** `type: sphere` shows Spiral and cameraZoom. Plane and Water show Distance instead.
- **Things that were cut:** some controls are commented out (`shader` Type A/B/C, `uFrequency`). Somebody built those knobs and then removed them from the surface.
- **Presets:** 10 named presets (Halo, Pensive, Mint, Interstella and others). [V] [presets.ts](https://github.com/ruucm/shadergradient/blob/main/packages/shadergradient/src/presets.ts)
- **Embed-only settings:** these sit at the bottom: lazyLoad (with "↳ Threshold" and "↳ Root Margin" as indented children), canvas Keep Buffer and Power Pref. [V]
- **Rule they follow:** show one group at a time, and show only the params that the current mode makes meaningful. Mode-dependent controls are removed, not greyed out.

#### Unicorn Studio
- **Library size:** 75+ effects in 7 categories. Effects are added from a "burst" icon in the top toolbar. [V] [docs/getting-started](https://www.unicorn.studio/docs/getting-started/)
- **Panel layout:** I couldn't verify the effect panel layout or count its params. Third parties say "begin with a preset close to your target and adjust parameters". [V] [uithings](https://uithings.com/what-is-unicorn-studio)
- **Changelog moves on the surface:** [V] [changelog](https://www.unicorn.studio/docs/changelog/)
  - **14 Apr 2026:** "The effect panel has been reorganized and simplified." No details given.
  - **23 Mar 2026:** a "little plus button next to any event enabled property" opens the Property Event Menu. Interactivity is nested **per property** behind a "+", not in a separate always-on section.
  - **18 Mar 2026:** the old Fog effect was "moved to legacy". It is still findable by search but no longer browsable. This is retirement by search-only access.
  - **Right-click a layer:** copy and paste its visual properties onto another layer of the same type.
  - **Effect library:** right-click to save a custom effect into it.
- **Variables and presets:** [V] [docs/variables](https://www.unicorn.studio/docs/variables/), [llms.txt](https://www.unicorn.studio/unicornstudio-llms.txt)
  - The designer clicks a "+" next to a property to promote it to a public **variable**. "Not everything can be a variable."
  - **Presets** are named snapshots of variable values, for example "Brand Dark" and "Brand Light".
  - The runtime controls panel (`data-us-controls`) is **built only from published variables** and shows a preset dropdown automatically.
  - The authoring surface has every property. The consumer surface has only the curated variables plus presets.
- **Rule they follow:** a full panel for the author, and a curated subset chosen by the author for everyone downstream. Interactivity and animation sit behind a per-property "+".

#### Shadertoy
- **No uniforms UI:** there is no panel for custom uniforms. The only "parameters" are time (play, pause, rewind), the mouse (`iMouse`), and the four iChannel input slots under the editor. [I]
- **Extension workaround:** an unofficial extension adds an iTime slider and "FOUR sliders simulating mouse position", which people misuse as generic tweak knobs. [V] [Chrome Web Store](https://chrome.google.com/webstore/detail/ohicbclhdmkhoabobgppffepcopomhgl)
- **Rule they follow:** the code is the inspector. Direct manipulation (the mouse) is the one live parameter. Shadertoy shows how far you can go with almost no chrome, and how users still reach for sliders.

#### Hydra (hydra.ojack.xyz)
- **No sliders:** parameters are numbers typed into code (`osc(10)`). [V] [docs getting-started](https://hydra.ojack.xyz/docs/docs/learning/getting-started/)
- **Toolbar has 6 buttons:** Run all, Upload to gallery, Clear all, **Show random sketch**, **Make random change** ("automatically alters a single value in the sketch"), and Info. [V]
- **Keyboard:** Ctrl+Shift+Enter runs, Ctrl+Shift+F formats. [V] There is also a shortcut that hides the code entirely so only the stage shows. [I]
- **Rule they follow:** randomness is a button, and it **mutates one value**, not all of them. It is a nudge, not a reroll.

#### cables.gl
- **Op parameter panel:** shows every port of the selected op, grouped with `setPortGroup`. On the LFO op the groups are Timer, Waveform and Range. [V] [Ops.Anim.LFO_v4.js](https://github.com/cables-gl/cables/blob/develop/src/ops/base/Ops.Anim.LFO_v4/Ops.Anim.LFO_v4.js)
- **Greyed, not hidden:** params that don't apply to the current mode are greyed out (`setUiAttribs({greyout: …})`). Pulse Width greys out unless waveform = square. Seed greys out unless waveform is random. Time greys out unless timer mode = Time Input. About 312 greyout uses across the cables org. [V]
- **Separate end-user panel:** authors build a user-facing panel out of **Sidebar ops** (slider, toggle, button, number). A Group op has "Default Minimized" and "Visible" flags. [V] [Ops.Sidebar.Group](https://cables.gl/op/Ops.Sidebar.Group), [sidebar example](https://cables.gl/p/aDgYX5)
- **Rule they follow:** show everything to the patcher, but dim what the current mode ignores. The audience panel is a separate, hand-built subset.

### Generators, palettes, small single-purpose tools

#### Haikei
- **Dice is the main control:** the dice button is the core interaction: "Use the dice button to generate a new visual with every click." The sidebar sliders are **bounds on the randomiser**: "Every visual will still be limited by the settings displayed in the right-hand sidebar." [V] [Welcome to Haikei](https://haikei.app/blog/welcome-to-haikei/)
- **Per-generator params:** each generator has a short list, such as complexity and contrast for blobs and waves, or number, size and contrast for blob scatter. [V] [haikei.app/generators](https://www.haikei.app/generators/) I couldn't verify exact counts per generator.
- **Rule they follow:** randomise first. Sliders constrain the space you roll in rather than set the output directly.

#### Josh Comeau: Shadow Palette Generator
- **6 controls:** Oomph (slider), Crispy (slider), Light Position (likely a 2D pad [I]), Background Color, Tint Shadow, Resolution (slider). [V] [shadow-palette](https://www.joshwcomeau.com/shadow-palette/)
- **Why so few:** box-shadow is "a very low-level API". He doesn't "think in terms of these values" but in terms of the *feel*. "Oomph" "controls how emphasized the shadow should be" by changing many underlying values at once. The output is 3 elevations, not one shadow. [V] [introducing-shadow-palette-generator](https://www.joshwcomeau.com/css/introducing-shadow-palette-generator/)
- **Rule they follow:** expose intent-level **macro** controls that each drive many low-level values, and generate a set rather than one value.

#### Josh Comeau: Gradient Generator
- **Controls:** Colors (stops), Color Mode (LRGB, HSL, HSV, HCL, LAB), Precision, Angle, Easing Curve. Output via Copy URL and Copy CSS. [V] [gradient-generator](https://www.joshwcomeau.com/gradient-generator/)

#### Realtime Colors
- **Colours panel:** 5 colour inputs (Text, Background, Primary, Secondary, Accent), each with a contrast indicator. [V] [realtimecolors.com](https://www.realtimecolors.com/)
  - Dark/light toggle (Alt+T).
  - **Randomize (Spacebar)**, constrained by a **scheme picker**: All, Mono, Analogous, Complementary, Split, Triadic, Tetradic.
  - Undo/Redo (←/→), Share link (Ctrl+S), Export (Ctrl+E).
- **Fonts panel:** heading and body fonts, a type-scale menu with 8 ratios, Randomize Fonts, and a font category filter.
- **Nested:** everything about output (8 export targets, 5 colour formats, about 10 framework presets, QR).
- **Rule they follow:** the 5 semantic inputs are always visible. Randomise is a key, not a button you hunt for. A **mode picker shapes the randomiser** instead of adding sliders. Export complexity sits behind one menu.

#### Coolors (generator)
- **Generate:** "Press the spacebar to generate color palettes!" [V] [coolors.co/generate](https://coolors.co/generate)
- **Toolbar:** View, Export, Save. "Adjust palette" opens a modal with Cancel and Apply. Generate Method, Settings, Isolate, Zen mode and Visualize are listed, and more than 5 colours or theory-rule generation is Pro. [V]
- **Per swatch:** lock, alternative shades and drag-to-reorder sit on each swatch, and locked colours survive the next spacebar. Per-swatch tools reportedly appear on hover. [V via third-party guides: [Wooster](https://inside.wooster.edu/technology/?p=4063), [tickledchilli](https://tickledchilli.co.uk/the-best-colour-generator-on-the-web/)] [I for the hover reveal]
- **Rule they follow:** **lock and reroll.** The user curates by protecting values, not by setting them. Per-item tools live on the item.

#### OKLCH picker (oklch.com, Evil Martians)
- **At rest:** 4 sliders (L, C, H, A), one smart text input (auto-detects HEX, RGB or HSL), and an OKLCH/LCH tab. [V] [oklch.com](https://oklch.com/)
- **Behind settings:** 4 **"Show" toggles**: Show 3D, Show graphs, Show P3, Show Rec2020. Heavy visualisations are opt-in views, not parameters. [V]

#### Huetone
- Builds palettes in OKLCH/CIELCH as hue columns × tone rows, with export to CSS, tokens, JSON or URL. [V] [deepwiki](https://deepwiki.com/ardov/huetone)
- FlowingData called it "not the most usable of tools", more a visualisation than a polished tool. [V] [FlowingData](https://flowingdata.com/2024/09/03/huetone-for-accessible-color-systems) I didn't find enough about its IA to draw a rule.

#### Easing playgrounds
- **cubic-bezier.com (Lea Verou):**
  - Curve with draggable handles [I, the fetched text omits the canvas], formula with Copy, Duration, "Go!" to preview and compare, Save to Library.
  - **Library = presets plus your saved curves**. Click one to compare it against the current curve.
  - Import/Export lives in a secondary panel. [V] [cubic-bezier.com](https://cubic-bezier.com/)
- **easings.co:**
  - Presets first. The selected preset (e.g. easeInOutCubic) has a 3-way **In/Out/InOut switch**.
  - Each curve previews **inside sample interfaces** (carousel, menu, list, form) instead of as an abstract dot.
  - Duration, Offset, Play, Share.
  - **Custom** bezier is a separate section. [V] [easings.co](https://easings.co/)
- **Rule they follow:** pick a named curve, flip direction with a segmented control, and keep the raw bezier editor one step away.

#### Motion (motion.dev) visual editors
- **VS Code:** highlight a Motion or CSS transition with the Motion panel open and edit panels appear for **duration, delay and easing only** ("spring support coming soon"). The bezier editor appears contextually "when editing a… bezier easing curve", and edits write straight back to code. [V] [tools-vs-code-extension](https://motion.dev/docs/tools-vs-code-extension), [studio-visual-controls](https://motion.dev/docs/studio-visual-controls)
- **Keyboard on control points:** arrows move by 0.1, Shift+arrows by 0.01. [V] [motion.dev/docs/studio](https://motion.dev/docs/studio)
- **Rule they follow:** the editor appears **only for the value under the cursor**. The code stays the inspector.

### Motion and 3D editors (web)

#### Jitter
- **Design/Animate mode toggle (2020):** in Design mode the inspector shows object properties. In Animate mode it shows animation settings. The same changelog "Removed the Scale property from the design inspector" and gives no reason. [V] [changelog 2020-11-13](https://jitter.video/changelog/2020-11-13-animate--design-modes)
- **Presets first, then Custom:** Animate → New animation → Custom → pick a type → parameters appear in the Property panel. Custom animations "form the underlying layer behind most presets". A preset can be **"Convert to actions"** (right-click in the timeline), which breaks it into editable primitives. [V] [help: create custom animations](https://help.jitter.video/en/articles/14136797-create-custom-animations)
- **Easing (2023):** presets (Smooth is the default, plus Natural, Slow down, Accelerate, Elastic), "and they all come with their intensity sliders". Intensity is "a simple yet efficient way" to control the feel. [V] [changelog 2023-11-08](https://jitter.video/changelog/2023-11-08-easings-intensity/)
- **Custom bezier (2025):** "Click on the value next to Easing… select Custom". The full curve editor sits **behind the value chip**. [V] [changelog 2025-02-18](https://jitter.video/changelog/2025-02-18-custom-easings)
- **Rule they follow:** preset plus **one** intensity slider at rest, with the raw curve behind a click on the summary value. Presets can be decomposed rather than being black boxes.

#### Rive editor
- **Contextual inspector:** it shows "the available properties and options for the current selection". **With nothing selected** it shows file-level settings: stage backgrounds for Design and Animate modes, tags, default interpolation and others. [V] [inspector docs](https://rive.app/docs/editor/interface-overview/inspector.md)
- **The inspector itself can't be collapsed.** Flyouts such as the colour panel can be closed. [V] [Rive forum](https://rive.app/community/forums/support/fsnLLkXUaA62/panel-collapse/ftbRaJjrnBpc)
- **Data binding as a contract:** designers decide where data appears, and developers feed values through view-model properties, which replace state-machine inputs. [V] [blog](https://rive.app/blog/data-binding-in-rive-a-shared-language-for-designers-and-developers), [docs](https://rive.app/docs/editor/data-binding)
- **Rule they follow:** the selection defines the panel. Empty selection gives document settings. Like Jitter, it splits design and animate modes. The public surface is an explicit, named contract.

#### Spline (web editor)
- **Same pattern as Rive:** with nothing selected the panels show **scene** settings (background, lights, simulation, effects, fog, sky, ambient shadows, colour). Selecting an object replaces them with that object's properties. [V] [understanding Spline's UI](https://docs.spline.design/basics/understanding-splines-ui)
- **Materials are a layer stack:** each object starts with only **Color + Lighting**. Further layers are added with "+", and all layers share Opacity and Blending. [V via docs snippet] [creating material layers](https://docs.spline.design/creating-material-layers)
- **Rule they follow:** additive disclosure. The default state is minimal, and capability is added as layers or sections on demand.

### Generative AI tools

#### Midjourney (web)
- **Prompt bar plus one settings icon:** the settings icon "lets you set defaults that apply to all your prompts". Groups are **Aspect Ratio/Image Size, Model, Aesthetics, More Options**. [V via official docs snippet] [Creating on Web](https://docs.midjourney.com/hc/en-us/articles/33390732264589-Creating-on-Web). The page itself blocked fetching.
- **Aesthetics:** 3 sliders, Stylization, Weirdness and Variety (the old `--chaos`). [V] [Ben's Bites](https://catalog.bensbites.com/tutorial/midjourney-parameters-and-settings)
- **Aspect ratio:** Portrait, Square and Landscape preset buttons **plus** a slider. [V]
- **Stylize:** default "med", set as a persistent default through the settings button. [V via official docs snippet] [docs: stylize](https://docs.midjourney.com/docs/stylize)
- **Remix:** hidden until you "click 'More options' and add a checkmark next to Remix". [V via official docs snippet] [Remix](https://docs.midjourney.com/hc/en-us/articles/32799074515213-Remix)
- **Typed escape hatch:** every slider has a text twin (`--s`, `--weird`, `--c`, `--ar`), so power users never open the popover. [V]
- **Rule they follow:** **settings are sticky defaults, not per-run controls**. They live behind one icon because you set them rarely. A "More options" tier hides even feature toggles. The prompt string can override everything.

#### Krea (Realtime)
- **At rest:** prompt, Image/Video toggle, aspect ratio (only 1:1, 3:2, 2:3), a **Seed button** ("a new variation of the current output"), Model button, and a Preview toggle that hides the canvas. [V] [Krea docs: realtime](https://www.krea.ai/docs/realtime.md)
- **Input mode picker:** Draw, Webcam, Screen or Text-only. It swaps the meaning of **AI Strength**, the one continuous control: in webcam mode, lower strength keeps more of the camera feed. [V] [Krea docs](https://docs.krea.ai/features/realtime)
- **Built-in Examples** load a canvas and prompt together. Single-key tool shortcuts (V, B, X, C, R, T, I, G). [V]
- **Rule they follow:** one blend slider, one variation button, and a mode picker that changes what that slider means.

#### Runway (Gen-4 era)
- **Settings:** duration (5 or 10 s), 6 aspect ratios, and a "Fixed seed" toggle that is **off by default**. [V via official help snippet] [Creating with Gen-4](https://help.runwayml.com/hc/en-us/articles/37327109429011-Creating-with-Gen-4)
- Adobe Firefly's embedding of Runway puts the seed under **Advanced settings**. [V] [helpx.adobe.com](https://helpx.adobe.com/firefly/web/firefly-video-editor/generate-videos/generate-videos-using-runway-video-models.html)
- **Rule they follow:** reproducibility controls are advanced and off by default.

#### Recraft
- **Prompt panel contents:** prompt, generation type, model, style, references, aspect ratio (presets only, no custom dimensions), colours, and generation count. Settings don't carry over between generation types. [V] [prompt panel docs](https://cf-test.recraft.ai/docs/recraft-studio/image-generation/prompt-panel)
- **Artistic level:** one slider with **6 named stops** (Simple, Clear, Artistic, Expressive, Rich, Eccentric). One docs version says it is found "by clicking on the settings icon in the prompt panel". [V] [artistic-levels](https://www.recraft.ai/docs/recraft-studio/image-generation/artistic-levels.md)
  - A newer docs version reportedly puts it **below the prompt**, which would mean it was promoted out of the popover. [I, from a search snippet only]
- **Style editing:** combine up to 5 styles with a weighting slider. Clicking any image shows the settings that made it, with Reuse and Copy. [V] [blog](https://www.recraft.ai/blog/new-tools-for-brand-style-consistency-and-control), [prompt panel](https://cf-test.recraft.ai/docs/recraft-studio/image-generation/prompt-panel)
- **Rule they follow:** a discrete named scale instead of a raw number. Provenance (the settings of *this* output) is recoverable from the output itself.

#### Kittl
- **Effect sections added with "+":** text **Transformation** and **Text Shadow** both start as a "+" row. "+" adds the section, and "−" "removes the effect… and collapses the section back to a plus". [V] [text transformation](https://help.kittl.com/editing-and-design/text-transformation), [text shadow](https://help.kittl.com/editing-and-design/text-shadow-effects)
- **Transformation:** 8 style icons. Most show **one Curve slider**. Circle swaps it for a Direction Inverted toggle. On-canvas handles give finer control, though they are "easy to miss at lower zoom levels". [V]
- **Shadow:** 4 styles, and each style shows a **different slider set**:
  - Drop Shadow: Offset, Angle, Blur.
  - Line Shadow and 3D Shadow: Outline Width instead of Blur.
  - Block Shadow: Offset and Angle only, with Blur and Outline Width **greyed**. [V]
- **Rule they follow:** an effect is off until you "+" it. A style picker selects the slider set, usually one or two sliders, and canvas handles carry the fine work.

#### Vercel v0 Design Mode
- **Panel sections:** Typography (7 props), Color, Background, Layout (margin and padding), Border, Appearance (opacity, radius), Shadow, Content. There is also an instruction box, undo/redo, Reset, a before/after toggle, and Inspect (Cmd/Ctrl+I). [V] [v0 docs: design mode](https://v0.app/docs/design-mode)
- **Panel vs prompt:** the panel is for "precise visual fine-tuning". **Instructions** are for structural or hard-to-express changes. v0 attaches a screenshot of the element to each instruction. [V]
- **Possible trimming:** third-party mirrors of older and newer docs disagree on whether Border and Appearance are present. That may be trimming over time, but I couldn't confirm it. [I]
- **Rule they follow:** sliders and fields for the common, precise style props. Natural language is the escape hatch for everything structural.

#### Lovable Visual Edits
- **Workflow:** click "Edit", select an element, then adjust "sizing, color, or text on the spot", with **custom Tailwind classes** as the escape hatch. The pitch is no chat round-trip "for every small edit", "no guesswork, no waiting". [V] [Introducing Visual Edits](https://lovable.dev/blog/introducing-visual-edits)
- **Rule they follow:** direct controls for frequent micro-edits, a class string for the long tail, and the prompt for structure.

### Type tools
- **Google Fonts (redesign):**
  - Search, filter and editing share **one panel** that can be dismissed for full-screen browsing.
  - **Each family's toolbar appears on hover.**
  - "Apply to all" pushes text edits across all families.
  - The specimen offers scale, editable text, colour and pairings. [V] [Reimagining Google Fonts](https://design.google/library/reimagining-google-fonts)
  - I couldn't verify the axis-slider specifics.
- **Axis-Praxis (Laurence Penney):** "move sliders" and use **buttons for named instances**, plus per-axis animation and drag-in fonts. [V] [launch post](https://axis-praxis.org/blog/2016-10-28/0/axis-praxis-is-launched) Named instances are the variable-font equivalent of presets sitting next to raw axes.
- **Font-format precedent, hidden axis flag:** the font format itself has a "hidden axis" flag. Glyphs: "Check the Hidden checkbox to hide an axis in user interfaces… Hide axes if they are applicable only in specialized software." Apps may ignore it. [V] [Glyphs handbook](https://handbook.glyphsapp.com/interpolation/axes/) The *author of the parameter space* marks which dimensions ordinary UIs shouldn't show. This is the closest real-world analogue to a `hidden`/`advanced` flag in a Rueca param schema.
- **Wakamai Fondue:** reports a font's axes and OpenType features. Generated-CSS options are toggles (unicode-range, instance classes, @supports). [V] [pixelambacht](https://pixelambacht.nl/2021/wakamai-fondue-command-line)
- **Fontra:** I found no evidence on its axis IA. Gap.

### Dither tools
- **Dither Boy (desktop, but a close peer):** [V] [Digital Production, 6.0](https://digitalproduction.com/2026/03/18/dither-boy-6-0-brings-animation-and-video-polish/), [80.lv 4.0](https://80.lv/articles/dither-boy-4-0-brings-full-color-dithering-to-over-50-effects)
  - 63 algorithms. You **step through them with arrow controls** on the viewport, which browses a long enum without a dropdown.
  - **Swatches and adjustments each have a lock**, so locked values survive a shuffle.
  - Effects are added one at a time with "+" from a categorised menu and can be reordered.
  - In animation mode, an animated property's panel control **locks** to avoid conflicts.
  - A Full/Live/Still update mode, including one that waits until you stop dragging.
  - A preset system (since 4.0).
- **Ditho:** save and load JSON presets. [V] [itch.io](https://loveforretro.itch.io/ditho)
- **"Grainrad" and ditherit.com:** nothing found. Gap.

### Craft writing on hiding controls
- **Rauno Freiberg, "Invisible Details of Interaction Design":** [V] [rauno.me/craft/interaction-design](https://rauno.me/craft/interaction-design)
  - Not about inspectors, but three relevant principles:
  - **Frequency sets ceremony.** Things opened hundreds of times a day should be instant and plain.
  - **Implicit context can replace explicit controls.**
  - **Direct manipulation** (scroll moves the slider, pinch, drag) beats indirection.
- **Emil Kowalski, "Building a toast component":** [V] [emilkowal.ski](https://emilkowal.ski/ui/building-a-toast-component)
  - He credits Sonner's success to sensible defaults plus minimal setup.
  - Stacked toasts are **collapsed until hover**. The always-expanded layout is an opt-in prop.
  - "The less details users notice, the better."
- **Josh Comeau:** the "feel over values" argument above. [V]
- **Adjacent (Grasshopper forum, not web creative):** "Using more than 10 sliders may already indicate a problem". The commenter recommends a separate settings file for calibration. [V] [McNeel forum](https://discourse.mcneel.com/t/the-future-of-grasshopper-user-interfaces/204466?page=2) Useful as a heuristic, not as evidence.
- **Adjacent (TouchDesigner MCP):** randomise with an **amount** ("0.2 is a gentle nudge from the current value"), which pairs with Hydra's "one random change". [V] [glama.ai](https://glama.ai/mcp/servers/lucasmaher-hash/touch-designer-mcp/tools/randomize_controls)

---

## Part 2: Cross-tool patterns

### The rules these tools actually follow

1. **Look params at rest. Plumbing params go to code or settings.** Paper Shaders shows 9 sliders plus colours but leaves about 8 documented props (fit, world size, origin, pixel caps) out of the panel. ShaderGradient puts embed and canvas settings at the bottom with ↳ children. The test is whether the control changes how the piece *looks*. If not, it isn't an at-rest control.
2. **Presets sit above sliders, and the panel shows which preset you're on.** This holds for Paper (presets folder at order −1, with a match highlight), Jitter easing, Unicorn, ShaderGradient (10), easings.co, Axis-Praxis named instances and cubic-bezier's library. Paper's highlight turns presets into a *state readout*, not just a launcher.
3. **Mode and style pickers decide which sliders exist.** Examples: Kittl shadow styles, Kittl transformation (Circle swaps its slider for a toggle), ShaderGradient (animate on/off, env/3d light, sphere/plane), Krea input mode, Realtime Colors' scheme picker for randomise, and Jitter's Design/Animate modes. A segmented control at the top of a section is the cheapest way to cut a slider list in half.
4. **Irrelevant controls are hidden or greyed, and tools split by audience.** ShaderGradient *hides*. Kittl and cables *grey*. Authoring tools for experts (cables) prefer grey, so the full model stays visible. Consumer tools (ShaderGradient, Kittl transformation) prefer hide.
5. **One intent-level slider plus a curve or details behind a click.** Jitter pairs an easing preset with **intensity**, and the raw bezier opens from the value chip. Comeau has "Oomph" and "Crispy". Recraft has an artistic level with 6 named stops. Krea has AI Strength. The visible control is a macro, and the low-level controls are one click away or nowhere.
6. **Effects are off until added, with "+" to add and "−" to collapse back.** Kittl, Spline material layers, Unicorn's per-property "+" for events and variables, and Dither Boy's effect stack all work this way. An inspector at rest lists *what's on*, not *everything that could be on*.
7. **Randomise as the main control, with constraints and locks.** Haikei's dice with sidebar bounds, Coolors' spacebar plus lock, Realtime Colors' spacebar plus scheme, Dither Boy's shuffle with locks, Krea's seed button, Hydra's "make random change" (one value), and TouchDesigner's amount. Locks and constraint pickers are what make a randomiser usable for directed work.
8. **Settings that are really defaults go behind one icon.** Midjourney's settings popover holds *sticky defaults* (aspect, model, aesthetics), with a further "More options" tier where Remix lives, and every value has a typed `--param` twin. Runway's seed is off and advanced. If a value is set once per session, it doesn't belong at rest.
9. **The selection defines the panel, and empty selection shows document settings.** Rive and Spline both do this. Unicorn's Variables panel appears when nothing is selected.
10. **The author curates a public subset for downstream users.** Unicorn variables (each promoted with a "+") feed a runtime panel built only from them. Others: cables Sidebar ops, Rive view-model contracts, ShaderGradient's Query mode (one URL string), and the font format's hidden-axis flag. The *person who built the param space* marks what ordinary users see.
11. **Text is the escape hatch for the long tail.** Midjourney has `--params`, v0 has instructions ("structural or hard-to-express"), Lovable has Tailwind classes, Motion keeps the code, and Hydra and Shadertoy are all code. The more open-ended the tool, the more it relies on typed input instead of a nested panel.
12. **On-canvas handles take the fine work.** Kittl transformation handles, cubic-bezier and Motion bezier points (arrow keys 0.1, Shift 0.01), and OKLCH's 3D view. Note Kittl's own warning that handles are "easy to miss at lower zoom levels". Handles need a visible cue.

### Mechanisms table

| Mechanism | Examples (evidence) | When it fits | Cost |
|---|---|---|---|
| **Presets folder above sliders, highlighted when matched** | Paper Shaders [V], ShaderGradient 10 presets [V], Jitter easings [V], Unicorn presets [V], Axis-Praxis instances [V] | Every shell. Most users start from a look, not a number | Presets need curation and naming. If there's no "Custom" readout when off-preset, users lose their place |
| **Mode/style picker swaps the slider set** | Kittl shadow and transform [V], ShaderGradient light/shape/animate [V], Krea input mode [V], Jitter Design/Animate [V] | Params whose meaning depends on an enum (algorithm, waveform, light type, shape) | Switching modes hides tuned values (keep them in state). Readers can't see everything at once |
| **Grey out instead of hide** | cables.gl `greyout` [V], Kittl Block Shadow [V] | Expert or authoring surfaces where seeing the whole model matters | Visual noise stays. Disabled controls invite "why can't I?" |
| **Additive sections ("+" to add, "−" to remove and collapse)** | Kittl [V], Spline material layers [V], Unicorn per-property "+" [V], Dither Boy effect stack [V] | Effects, post-processing, optional layers, interactivity, keyframing | Discoverability: the user must know a capability exists. Needs a browsable "+" menu |
| **Macro / intent slider (one control drives many)** | Comeau Oomph/Crispy [V], Jitter intensity [V], Recraft Artistic level [V], Krea AI Strength [V] | When raw params are low-level and correlated (shadow layers, easing curves, grain stacks) | Needs a hand-built mapping. Experts may want the underlying values (give a details reveal) |
| **Summary value chip that opens the editor** | Jitter Easing value → Custom curve [V], Midjourney settings icon [V] | Composite values (curve, gradient, spring, palette) that read fine as one label | One more click. The chip must show enough to make opening it unnecessary most of the time |
| **Randomise with locks and constraints** | Haikei dice + bounds [V], Coolors spacebar + lock [V], Realtime Colors spacebar + scheme [V], Dither Boy shuffle + locks [V], Krea seed [V] | Generative shells (dither, gradient, palette, shader, synth patterns) where exploring beats specifying | Needs good bounds or it produces junk. Locks add per-control UI. Must be undoable |
| **Nudge (mutate one or a few values)** | Hydra "make random change" [V], TouchDesigner amount [V adjacent] | When the user is close and wants variations, not a reroll | Less dramatic, so it can feel ineffective. The user needs to see *what* changed |
| **Sticky defaults behind one icon** | Midjourney settings [V], Runway fixed seed [V] | Values set once per session (aspect, export size, model, seed) | Users forget the state. Show the current values as a summary next to the icon |
| **Selection-scoped panel, empty selection = document** | Rive [V], Spline [V], Unicorn Variables panel [V] | Shells with layers or nodes (UI design, 3D, node graph, video titles) | Users hunt for document settings unless they know to deselect |
| **Author-curated public subset** | Unicorn variables [V], cables Sidebar ops [V], Rive view models [V], ShaderGradient Query/URL [V], font hidden-axis flag [V] | Anything shared or embedded: the share link, client demos, "viewer" mode | The author must decide what to expose. Needs an "expose this" affordance in authoring mode |
| **Hidden from panel, available in code or schema** | Paper's common props (fit, world size, pixel caps) [V], ShaderGradient's commented-out knobs [V] | Plumbing: resolution caps, origin, fit, buffers, perf | Invisible to non-coders. Make sure export or settings cover anything users really need |
| **Retire to search-only** | Unicorn's Fog moved to legacy, search-only [V] | Old or rarely used items you can't delete | Muscle memory breaks for the few who used it |
| **On-canvas handles plus keyboard nudge** | Kittl handles [V], Motion bezier arrows 0.1 / Shift 0.01 [V], oklch 3D [V] | Spatial params: position, offset, light direction, curve points, crop | Hard to discover ("easy to miss at lower zoom levels"). Needs hover cues |
| **Typed escape hatch** | Midjourney `--params` [V], v0 instructions [V], Lovable Tailwind classes [V], Hydra code [V] | The long tail you'll never build UI for | Two sources of truth. You must reconcile typed and panel state |
| **Views as toggles, not params** | oklch.com Show 3D / graphs / P3 / Rec2020 [V], Krea Preview toggle [V], Google Fonts dismissable panel [V] | Heavy visualisations, overlays, guides | Little cost. Keep the toggles in a view menu, not the inspector |
| **Per-item tools on the item (hover)** | Coolors swatches [I/V], Google Fonts hover toolbar [V], Sonner expand-on-hover [V] | Lists of similar items (swatches, layers, keyframes, presets) | No hover on touch, so you need a tap or long-press equivalent |
| **Preset decomposition** | Jitter "Convert to actions" [V] | Composite presets (an animation preset made of several tracks) | Converting can be one-way. Say so |

### What this suggests for Rueca (inferences, for discussion)

1. **Add `tier` (or `advanced`/`hidden`) to the param schema.** The font format's hidden-axis flag and Paper's panel/props split both say the *author of the param space* should mark this, not the shell.
   - Suggested tiers:
     - **rest:** what makes this piece *this* piece.
     - **details:** behind a per-section disclosure.
     - **settings:** sticky defaults behind one icon (export size, seed, fps, quality).
     - **code:** omitted from the panel and kept in the schema for export and share.
   - Rule of thumb from the evidence: if a param doesn't change the look, it isn't rest tier.
2. **Presets block at the top of every inspector, with a match highlight.** Copy Paper's `usePresetHighlight` idea: show "Ink" when you're on it and "Custom" when you've drifted.
3. **`visibleWhen` / `enabledWhen` on params, keyed off an enum.** ShaderGradient's `hidden: (props) => …` and cables' `greyout` are the same idea. Use hide in consumer shells and grey in authoring shells, or make it a schema option. Candidate shells:
   - dither: algorithm picks the param set
   - synth: waveform picks the params
   - 3D: light type picks the params
   - type: axis set depends on the font
4. **Additive effect sections.** Photo effects, shader post-processing, video titles and motion study should list *active* effects only, with "+" to add and "−" to collapse (Kittl, Spline, Unicorn, Dither Boy).
5. **One macro slider per composite.** Easing is preset plus intensity, with the curve editor behind the value chip (Jitter). Grain and shadow stacks get an "amount" macro (Comeau). This fits motion study, video titles and UI design.
6. **Randomise with locks and constraints, plus a nudge.** Give each param or section a lock. Spacebar rerolls unlocked params within schema bounds, and Shift+Space (or similar) mutates one value (Hydra). This fits shader, dither, gradient, synth sequencer and variable type. All of it goes through undo.
7. **Settings popover for sticky defaults,** with a summary chip that shows the current values (e.g. "1080p · 60fps · seed 42"), as Midjourney's icon does but with the state visible.
8. **"Expose" for share and view mode.** In authoring mode a "+"/pin next to a param promotes it to the share link's viewer panel, as Unicorn variables do. The share link then opens with presets plus the exposed params only. That answers "controls that barely get usage" for *viewers* without taking power away from authors.
9. **Selection-scoped panels with document settings on empty selection** for the layer-based shells (UI design, 3D scene, node graph, video titles), as in Rive and Spline.
10. **Usage instrumentation decides promotion.** Recraft may have moved Artistic level out of the settings popover to below the prompt [I], and Unicorn moved Fog to search-only [V]. Both suggest tiers should move over time. Rueca's existing "Send to agent" notes channel could log which params get touched, so authors can see which ones never leave the details tier.

### Gaps and caveats
- **Unverified at rest:** I couldn't see the live at-rest state of Unicorn Studio's effect panel, Spline's per-object panels or Rive's sections. Their docs don't describe layout.
- **Blocked pages:** Midjourney and Runway help pages returned 403 or Cloudflare challenges. Claims about them rely on search-engine snippets of the official pages plus third-party guides.
- **Nothing found:** Cosmos, Fontra hidden axes, "Grainrad", ditherit.com, and Devouring Details content (paywalled or not indexed).
- **Unverified changes:** v0 Design Mode's control list differs between doc mirrors, and Recraft's Artistic level location differs between doc versions. I couldn't date either change, so treat both as [I].
