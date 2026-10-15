# How canvas tools decide what the property panel shows at rest, and what goes into nested UI

Research for Rueca, 15 Oct 2026. Rafael's prompt: "a lot of controls we're showing barely get usage". The question is how the best canvas tools split top-level from nested controls, and which nesting mechanisms they use.

Legend: **[V]** verified against a source (URL given). **[I]** inferred from experience, screenshots I've seen, or indirect evidence. Treat [I] as a hypothesis to check in the app.

Sources read most closely:
- Open-source code: tldraw `StylePanel`, Excalidraw `Actions.tsx` and `shapeActionPredicates.ts`, Penpot `sidebar/options/*`.
- Figma: two UI3 blog posts, help-center articles, and about eight forum threads.
- Sketch: Copenhagen changelog, tour and docs.
- Webflow: style-panel blog post, focus-mode update, help pages.
- Paper: the build log.
- Rive: docs.

Framer and Spline have little indexable documentation about the panel itself, so their sections lean on [I].

---

## 1. Figma (UI3, Design panel)

### What's visible at rest
- **Section order is driven by selection type, and component controls come first.** UI3 moved component controls (variants, instance props) "above attribute controls like color and size" because components take up a growing share of a designer's day. [V] https://www.figma.com/blog/behind-our-redesign-ui3/
- **One merged "Layout" section.** Width, height and auto layout were merged into one section, which breaks with the common x/y/w/h block. X and Y stayed above W and H "to support longtime users": the team tested W/H first and it broke muscle memory. [V] same URL
- **Typical frame selection, top to bottom** [I, from using the app; the ordering is consistent with the posts]:
  1. Selection-actions header row (frame/instance actions)
  2. Position (alignment, X/Y, rotation; constraints via a small button, or inline once toggled)
  3. Layout (W/H, auto layout flow, gap, padding, alignment grid, clip content checkbox)
  4. Appearance (opacity, corner radius, blend)
  5. Fill
  6. Stroke
  7. Effects
  8. Layout guide
  9. Export

  That's roughly 20–30 visible controls, and most of them only appear once a fill or stroke exists.
- **Empty-until-added sections.** Fill, Stroke, Effects, Layout guide and Export are header-only with a "+" until you add one. [V for Layout guide: "a + icon sits beside it", and it was renamed from "Layout grid"] https://forum.figma.com/ask-the-community-7/i-can-t-find-my-layout-grid-in-my-properties-panel-41749 [I for the others, but long-standing Figma behaviour]
- **Selection colors only appears when relevant.** The section shows only when the selection has mixed fills. Each fill is listed once, grouped by variable, style and plain fill. [V] https://figma-signup.helpjuice.com/color-gradients-and-images/view-and-adjust-colors-in-a-mixed-selection
- **Property labels are opt-in.** UI3 has a toggle for an icon-forward view or a labelled view, and the panel is resizable. [V] https://www.figma.com/blog/behind-our-redesign-ui3/

### Nesting mechanisms
| Mechanism | Example in Figma | Source |
|---|---|---|
| "+" add-to-reveal section | Fill / Stroke / Effects / Layout guide / Export | [V] for Layout guide (see above) |
| Popover behind an icon | **Type settings** (opened from Typography) has Basics, Details, and Variable (variable fonts only). Paragraph spacing, decoration and letter case moved here in UI3. OpenType features are under Details; unsupported features are greyed out with hover previews. | [V] https://help.figma.com/hc/en-us/articles/360039956634 · [V] https://forum.figma.com/ask-the-community-7/where-has-the-paragraph-spacing-setting-gone-24602 |
| Popover behind an icon | **Auto layout settings**: strokes in/out of layout, canvas stacking, text-baseline alignment. These are set-once, low-frequency. | [V] that these settings exist ("auto layout settings dropdown") https://help.figma.com/hc/en-us/articles/360040451373 · [I] the exact icon |
| Popover → inline toggle | **Constraints**: hidden behind a small button in UI3 beta, then given a "toggle on so it displays inline" option | [V] https://forum.figma.com/suggest-a-feature-11/launched-toggle-constraints-28001/index2.html |
| Inline min/max via dropdown | W/H dropdown has Hug / Fill / Fixed plus "Add min width / max width". The constraint is hidden until you add it. | [V] https://help.figma.com/hc/en-us/articles/360040451373 |
| Hover-reveal | The "Apply variable" icon appears on hover over a field. Fallbacks: Shift-click into the field, or right-click > Apply variable. | [V] https://figma-signup.helpjuice.com/variables/apply-variables-to-designs (via search summary) |
| Disclosure inside a section | Selection colors: "Show selection colors" → "See all N colors" → "See all library colors" (three clicks) | [V] https://forum.figma.com/suggest-a-feature-11/remove-3-clicks-to-show-selection-colors-31979 |
| Inline dropdown that appears only when non-default | Blend mode: a nonstandard blend shows an inline dropdown | [V] https://www.figma.com/blog/our-approach-to-designing-ui3/ |
| Minimize UI | Panels collapse while tools stay reachable | [V] same URL |
| Actions menu / quick actions | AI and other actions live in an Actions menu, separate from the properties panel | [V] https://www.figma.com/blog/behind-our-redesign-ui3/ |

### The rule they seem to follow
- **Frequency and job centrality decide order.** Components first, because that's where designers' time goes. [V]
- **Muscle memory beats tidiness for anchors.** X/Y stayed on top. The auto layout alignment grid was condensed in one iteration, then reverted "for power users". [V] https://www.figma.com/blog/behind-our-redesign-ui3/
- **"Speed is a feature."** A control that saves space but adds a click or a wait loses. [V] https://www.figma.com/blog/our-approach-to-designing-ui3/
- **Set-once and rare goes into a popover:** type details, OpenType, auto-layout edge cases. [V] for what's in those popovers; [I] that the motive is frequency.

### Redesign lessons and backlash (UI3, 2024–25)
- **Floating panels reverted.** Beta testers said floating panels slowed daily work, so panels are docked again (resizable). Floating survives only in Minimize UI, Slides grid view and FigJam. [V] https://www.figma.com/blog/figma-2024-we-shipped-it-you-shaped-it/ and https://www.figma.com/blog/our-approach-to-designing-ui3/
- **Blend mode behind an icon was reverted.** The icon changed with the current mode, so you had to wait for a tooltip to read the state. "The nail in the coffin was learning that they slowed people down." It's now an inline dropdown when non-default. [V] https://www.figma.com/blog/our-approach-to-designing-ui3/
- **Clip content went from dropdown back to checkbox.** Users called it "an unnecessary extra click that is hidden in a dropdown" and asked "Why send a choice of two options to a dropdown?" On 6 Aug 2024 staff confirmed it was "officially updated… from a dropdown back to a checkbox". A side complaint: renaming it to "Show content" broke scanning for "clip". [V] https://forum.figma.com/t/launched-ui3-make-clip-content-a-checkbox-again/76947 and https://forum.figma.com/suggest-a-feature-11/launched-ui3-make-clip-content-a-checkbox-again-30952/index2.html
- **Constraints were hidden behind "a tiny button", then made inline-togglable.** Users said a "quick glance at Constraints won't work". On 7 Aug 2024 staff said "Soon, you'll be able to toggle on the control so that it displays inline." One user proposed a global "advanced properties: inline vs popup" setting. [V] https://forum.figma.com/t/ui3-feedback-constraints-settings-are-hidden/77418 and index2 above
- **Constraints expanded by default after launch.** [V, per a mirror of the UI3 post; the WebFetch summary of the figma.com original lists it] https://www.figma.com/blog/our-approach-to-designing-ui3/
- **Selection-driven ordering breaks spatial memory.** Users report that Position and Layout "appear at different positions depending on what type of element I've selected". Big instances push them off-screen. Staff said "passed to the team" and nothing changed. [V] https://forum.figma.com/t/ui3-right-sidebar-in-design-mode-harder-to-navigate-with-component-section-at-top/89868
- **Collapsed sections don't remember state.** Users want stroke and selection-colors sections to stay expanded across selections ("I wish Figma would remember…"). No change. [V] https://forum.figma.com/suggest-a-feature-11/keep-collapsible-properties-expanded-or-collapsed-14282
- **Hug/Fill/Fixed became less visible**, because sometimes the field shows the measurement only. [V] same thread as the ordering complaint (89868)
- **The minimal-label exploration was dropped:** dropping labels was "a deal breaker" for accessibility. [V] https://www.figma.com/blog/our-approach-to-designing-ui3/
- **General sentiment:** "the new UI hides stuff and makes a lot of things less reachable." [V] https://forum.figma.com/share-your-feedback-26/ui3-feedback-3058/index5.html

### Anti-patterns Figma ended up avoiding
- A binary choice in a dropdown.
- A state-carrying icon that needs a tooltip to read.
- Hiding a control people glance at to check state (constraints), not only to set it.
- Floating chrome for an all-day tool.
- Reflowing anchor positions (they kept X/Y; they didn't fix the per-type reorder).

---

## 2. tldraw (style panel), read from source

Source: `packages/tldraw/src/lib/ui/components/StylePanel/DefaultStylePanelContent.tsx`, `useRelevantStyles.ts`, `MobileStylePanel.tsx`, `styles.tsx` (main branch, Oct 2026).

### What's visible at rest
- **The panel only exists when there's something to style.** `useRelevantStyles()` returns `null`, so no panel, unless shapes are selected, a shape-specific tool is active, or shared styles exist. With the select tool and nothing selected, it shows the **next-shape** styles for color, dash, fill and size: what you'll draw next. [V] https://github.com/tldraw/tldraw/blob/main/packages/tldraw/src/lib/ui/hooks/useRelevantStyles.ts
- **Fixed order in four groups:**
  1. color, opacity
  2. fill, dash, size
  3. font, text-align, label-align
  4. geo, arrow kind, arrowheads, spline

  Each picker returns `null` when its style isn't in the selection's shared styles. For a typical rectangle that's about 7 rows: color swatches (~13), opacity steps (5), fill (3 inline + overflow), dash (4), size (4), font (4), align (3 + vertical-align), plus the geo dropdown. [V] DefaultStylePanelContent.tsx
- **Opacity is a 5-step slider** (0.1, 0.25, 0.5, 0.75, 1), not continuous, and it shows "mixed" when values differ. [V] same file

### Nesting mechanisms
- **Inline row plus an overflow dropdown.** Fill shows `none / semi / solid` inline. `pattern / lined-fill / fill` sit in a `fill-extra` dropdown (`isOverflow`). PR #7885 (Feb 2026) replaced the 4th fill button with the dropdown "following the same pattern used by the vertical alignment dropdown". Its test plan requires that "the dropdown icon shows the correct fill style when a dropdown fill is active", so **the overflow trigger reflects the hidden value**. [V] https://github.com/tldraw/tldraw/pull/7885 and release notes v4.4.0
- **Dropdowns for long enumerations** (geo shape type, arrow kind, arrowheads, spline). Short enumerations are always inline button pickers. [V]
- **"Mixed" state** on every picker and on the opacity slider. [V]
- **Mobile collapses the whole panel behind one button.** Its icon is filled with the current color, or a "mixed" icon. The button is disabled for hand/zoom/eraser/laser. [V] MobileStylePanel.tsx
- **Enhanced a11y mode** adds subheadings that are otherwise hidden: labels on demand. [V]

### The rule
- **Show what applies to the selection, and nothing else.** Style relevance is computed from shared styles.
- **Common options inline; rarer variants of the same property go behind an overflow on the same row**, so the row width stays constant.
- **Discrete presets instead of continuous values** (5 opacity steps, 4 sizes): fewer, coarser controls that are always visible. [I that this is deliberate minimalism; [V] that it's the design]

### Anti-patterns avoided
- A blank panel when nothing is selected (it shows next-shape styles instead).
- An overflow that hides state (its icon swaps to the active hidden value).
- Free numeric fields on a whiteboard.

---

## 3. Excalidraw, read from source

Source: `packages/excalidraw/components/Actions.tsx`, `shapeActionPredicates.ts`, `packages/element/src/showSelectedShapeActions.ts`, `packages/common/src/editorInterface.ts`.

### What's visible at rest
- **No panel without a selection or a drawing tool.** `showSelectedShapeActions` is true only with a selection, while editing text, or when a drawing tool is active (not selection/lasso/eraser/hand/laser). [V] https://github.com/excalidraw/excalidraw/blob/master/packages/element/src/showSelectedShapeActions.ts
- **One file of predicates decides every row.** `getShapeActionPredicates()` is documented as the "Single source of truth for 'which shape-action controls are relevant right now'… All three styles-panel layouts (full / compact / mobile)… consume these flags so that visibility logic lives in one place and layout stays pure." A property is relevant if it applies to the active tool (so you can pre-set it) or to any selected element. [V] shapeActionPredicates.ts
- **Typical rectangle in "full" mode:** stroke color, background, fill style, stroke width, stroke style, sloppiness, edges (roundness), opacity, layers (4 buttons), and actions (duplicate, delete, group, ungroup, link). That's about 10 sections and ~40 hit targets. Align appears only with 2+ elements; distribute only with 3+. [V for the structure; I for the counts]

### Nesting mechanisms
- **Dependency gating.** The **fill style row is hidden while the background is transparent**: `hasFillStyle(type) && !isTransparent(backgroundColor)`. A child control appears only once its parent has a value. [V]
- **Three density modes over the same predicates.** `StylesPanelMode = "compact" | "full" | "mobile"`. On desktop the user chooses compact or full (`desktopUIMode`, persisted). Tablets get compact; phones get mobile. [V] editorInterface.ts
  - *Compact* keeps both colours as top-level swatches. It groups fill, stroke width, stroke style, sloppiness, roundness and opacity into one **"adjustments" popover**, arrows into an arrow popover, and font size and alignment into a text popover. Duplicate and delete stay as dedicated buttons; everything else goes into an "extra actions" popover. [V] Actions.tsx `CompactShapeActions`
  - *Mobile* is a horizontal bar that measures its own width. Delete and Duplicate are **promoted out of the overflow only when there's room** (priority+ pattern: `showDeleteOutside = ACTIONS_WIDTH >= MIN_WIDTH + ADDITIONAL_WIDTH`). [V] Actions.tsx `MobileShapeActions`
- **Command palette.** Flip, copy/paste styles, align, z-order, wrap in frame, font size and more are reachable from the palette. Flip has **no** panel control at all. [V] https://github.com/excalidraw/excalidraw/blob/master/packages/excalidraw/components/CommandPalette/CommandPalette.tsx
- **Bucket-fill tool** shows only the three controls it uses: colour, fill style, opacity. This is tool-scoped configuration. [V]

### The rule
- **Relevance first (tool or selection), then dependency, then density mode.**
- **Colour is the one thing never nested**, even in compact and mobile. [V]
- **Destructive and very common actions (delete, duplicate) get promoted when space allows.** [V]

### Anti-patterns avoided
- Layout-specific visibility rules. One predicate source means compact and full never disagree.
- Showing a fill pattern for a transparent fill.

---

## 4. Penpot, read from source

Source: `frontend/src/app/main/ui/workspace/sidebar/options/shapes/*.cljs`, `menus/*.cljs`.

### What's visible at rest (rectangle)
`layer` (opacity, blend, visibility) → `measures` (size, position, rotation, radius) → `layout-container` → *[grid-cell, if a grid child]* → *[layout-item, if a flex/grid child]* → *[constraints, only if NOT a layout child, or if absolutely positioned]* → `fill` → `stroke` → `shadow` → `blur` → `svg-attrs` → `exports`. [V] https://github.com/penpot/penpot/blob/develop/frontend/src/app/main/ui/workspace/sidebar/options/shapes/rect.cljs

### Nesting mechanisms
- **"+" add-to-reveal, and a section is collapsible only once it has content.** For shadow, stroke and blur, `title-bar* {:collapsable has-shadows?}`: an empty section is just a title and "+". A section with items gets a collapse chevron, default open (`show-content true`). [V] menus/shadow.cljs, stroke.cljs, blur.cljs
- **Per-item "more options" toggle** (e.g. blur: `show-more-options`, default false) expands inline under the row instead of opening a popover. [V] menus/blur.cljs
- **Context gating by parent layout.** Constraints are shown only when the shape is not in a flex/grid layout, or is absolutely positioned. Layout-item controls show only for layout children. Penpot's 2.0 redesign post: the sidebar "dynamically adjusts to show relevant editing options" (e.g. grid editing). [V] rect.cljs; https://community.penpot.app/t/heres-a-sneak-peek-of-penpots-ui-redesign/4749
- **Text "options" menu button.** The main text section shows font/typography plus align and grow. An `i/menu` button toggles `more-options` (vertical align, decoration, direction) inline. [V] menus/text.cljs
- **Hidden controls auto-expand when a value lands.** When a text decoration is applied interactively (e.g. via a token), Penpot emits `:expand-text-more-options` and the "more" section opens, so **a hidden control reveals itself when it stops being default**. [V] https://github.com/penpot/penpot/blob/develop/frontend/src/app/main/data/workspace/tokens/application.cljs (`update-text-decoration-interactive`)
- **"Mixed" states** are explicit and specific: "mixed typography", "mixed tokens", "mixed tokens and assets", each with a detach action. [V] menus/text.cljs
- **Constraints** are a collapsible section, default open. [V] menus/constraints.cljs

### The rule
- **Context** (parent layout type, selection type) decides presence.
- **Existence** decides collapsibility.
- **Frequency** decides the "more" split.
- Auto-reveal guarantees that hidden-but-set values are never invisible.

---

## 5. Sketch (Copenhagen, 2025 rewrite)

- **Style sections are empty until you click to add.** Fills, Borders, Shadows, Inner Shadows and Effects. Rows stack; each has an enable toggle, can be dragged to reorder, and can be removed by dragging out or with Control-click > Remove. Right-clicking a section header gives paste actions. [V] https://www.sketch.com/docs/symbols-and-styles/styling/managing-style-properties.md, https://www.sketch.com/docs/designing/styling/fills/
- **Advanced options sit behind a section-level settings icon.** Ends, joins, dashes and arrowheads live in a **Border settings panel** opened from "the settings icon next to the Borders section title". Border *position* (inside/center/outside) stays inline per row. [V] https://www.sketch.com/docs/symbols-and-styles/styling/borders.md
- **Popovers became movable panels that persist across selections.** "Most former popovers are now separate panels" that "stay open when the selection changes, if the controls still apply". Prototyping moved from an Inspector tab to its own panel. [V] https://www.sketch.com/blog/a-tour-of-copenhagen/
- **Rarely used controls left the Inspector for menus and the Command Bar.** Fill Rule (Even-Odd/Non-Zero) went to Layer > Style and the Command Bar. "Replace Image with Fill" went to Layer > Image and the Command Bar. [V] https://www.sketch.com/changelog/copenhagen/
- **Modifier-key alternates double a control without adding one.** Holding ⌥ turns flip H/V into rotate 90° left/right, and makes the fill/border visibility toggle remove the item instead. [V] same changelog/tour
- **Control micro-rules.** Drag a numeric field's icon to scrub without focusing. Double-click a slider to reset it to its "natural" value. Clicking a toggle's label toggles it. [V] tour
- **Overrides are chunked when there are many:** more than 15 symbol overrides are grouped by component type. [V] tour
- **Inspector with nothing selected** shows page/document controls, e.g. colour profile (moved there from Document Settings) and a page copy-link button. [V] changelog

**Rule:**
- Keep the inline row to one line of essentials (colour, opacity, position).
- Per-property extras go to a section-level settings panel.
- Properties you set once a year go to the menu bar and the command bar.

---

## 6. Framer (properties panel)

Framer's help centre and updates pages render client-side and gave thin content. Much here is [I].

- **"+" add-to-reveal sections** for Effects (Appear, Hover, Press, Loop, Drag, Scroll…) and style properties. "Click the little plus button next to 'Effects'". [V via third-party Framer University, cited in search] [I that Styles uses the same pattern for Fill, Border, Shadow, Radius, Overflow, Cursor, Blur, and so on]
- **Perspective became a separate property under Styles.** Adding any 3D property now auto-adds perspective: a dependency handled by auto-adding the parent. [V] https://www.framer.com/updates/3d-transforms (via search summary)
- **Right-click a style row** to copy and paste a single style. [V] https://www.framer.com/updates/january-update-2023
- **Layer-panel indicator** for layers that have Effects, so state is visible without opening the panel. [V via search summary] https://www.framer.com/updates/all-new-effects
- **Code-component Property Controls API.** This is effectively Framer's IA vocabulary for plugin authors:
  - `hidden(props) => boolean`: dependency gating ("hides a text field when a toggle is off")
  - `optional: true`: the object or colour becomes removable, i.e. add-to-reveal
  - `ControlType.Object` with `buttonTitle` / `icon`: grouped sub-controls under one row
  - `description`: Markdown hint above the control
  - Arrays render "as an additional section"

  [V] https://www.framer.com/developers/property-controls [I] that Object controls open as a popover from that button row.
- **Text panel.** "Default state was made denser" (Jan 2024, per search summary; unverified on the page). Variable-font axes sit "right next to the OpenType options". [V for variable fonts] https://framer.com/updates/variable-fonts
- **June 2026 "new interface" (v3).** Users note tutorials don't match it any more. No primary description found. [V that it exists] https://www.framer.com/community/posts/72CGs9qekSzmEizcLety3q/

---

## 7. Paper.design (build log)

Paper ships panel-by-panel and logs each move. That makes it a good record of what got promoted or demoted. [V] https://paper.design/build-log
- **Demotion:** "Moved margins into a dedicated collapsible Margin panel" (Nov 2025).
- **One panel per concern**, added only when needed: Fill (Sep 2025), Radius with individual corners (Sep 2025), Grain, Shape, Video export, Selection colors (Nov 2025), text formatting for casing/wrapping/truncation (Dec 2025), Filters (Jan 2026), Constraints (Mar 2026), text Stroke (Apr 2026).
- **"Text details panel"** for OpenType features (Mar 2026), the same split Figma makes.
- **Slider snap points for common shader parameter values** (Oct 2025). Parameters were renamed to perceptual units ("Replaced Count with a percentage-based Size parameter", "Effect scale → Size"). Better defaults and units mean fewer controls are needed.
- **"Other styles" panel** to show agent-added CSS "that aren't editable properties yet" (May 2026). It's a read-only catch-all, so nothing set is invisible.
- **"Hide UI button with minimal UI mode"** (May 2026). "Fixed an issue where an empty Selection colors panel was sometimes shown" (Dec 2025): empty sections are treated as a bug.

---

## 8. Webflow (Style panel)

- **The 2019 rebuild split one "Layout" section into Spacing, Size and Position.** Text-shadow moved into Typography ("clearer organization"). The panel relies "less on icons" and has bigger click targets "per Fitt's law". Margin/padding got a context menu of preset spacing values. [V] https://webflow.com/blog/meet-the-new-style-panel
- **Backlash on the 2019 beta:** "Frequently used tasks have been put behind nested UI." Users asked for the old display icon buttons back and complained the new icons were less descriptive. Others praised the full-height dropdowns. A beta-thread proposal: toggle between icon-only and labelled layouts. [V via search summary of] https://discourse.webflow.com/t/new-style-panel-feedback/76418 and https://discourse.webflow.com/t/style-panel-beta-feedback/77313 (now redirect; quotes from search index)
- **"More type options" toggle** inside Typography hides advanced type such as text columns. [V] forum https://discourse.webflow.com/t/columnar-text-vs-columns/134852 and https://webflow.com/updates/text-columns (via search summary) [I that it also holds italic/decoration/indent/capitalize/direction/breaking]
- **Collapsible sections with state indicators.** A **collapsed section shows coloured dots** if any property inside has local (blue) or inherited (amber) styles. Expanded, the property labels themselves are coloured, and clicking an amber label shows where the style is inherited from. [V] https://help.webflow.com/hc/en-us/articles/33961362040723 (via search summary), https://help.webflow.com/lesson/style-labels-in-the-designer
- **Focus mode (Apr 2021)** collapses every section except the one you're working in. Toggle with ⌥⇧S; ⌥S expands or collapses all. It lives in the panel's context menu. [V] https://webflow.com/updates/focus-mode-in-style-panel
- **Rule:** group by CSS concern. Advanced CSS sits behind a per-section "more". Collapsed sections must still tell you whether something is set inside.

---

## 9. Spline, Rive, Keynote/Freeform

**Spline**
- The right sidebar holds "Property Panels", each scoped to the scene or the selected objects. [V] https://docs.spline.design/basics/understanding-splines-ui
- **Material is a layer stack with "+".** Every object starts with two layers (Color, Lighting). All layers share Opacity and Blending; per-layer parameters differ. [V] https://docs.spline.design/creating-material-layers (via search summary)
- [I] Events and States sections are add-to-reveal.

**Rive**
- The Inspector shows "only the options that element supports". With nothing selected it shows **file-level settings** (stage background per mode, tags, default interpolation, scripting/shader targets). [V] https://rive.app/docs/editor/interface-overview/inspector.md
- **Fill and Stroke use "+"**; you can add as many as you like. **Fill rule and blend** sit behind the fill option button. **Cap, join, blend and stroke type** (solid/trim/dashed) sit behind the stroke option button. [V] https://rive.app/docs/editor/fundamentals/fill-and-stroke.md
- **Mode-dependent decoration.** In Animate mode every animatable property gets a key button with three states: grey stroke (unkeyed), blue stroke (animated), blue fill (key at playhead). There's a known trap: editing with a timeline selected auto-keys. [V] https://rive.app/docs/editor/animate-mode (via search summary)
- *Directly relevant to Rueca's KeyButton and timeline.*

**Keynote (Mac)**
- **Tabs chosen by selection type:** Style / Text / Arrange for a shape. The tab set changes for tables, images and charts. [V for Style/Text/Arrange] https://support.apple.com/guide/keynote/tand8467b98e/mac [I for the other tab sets]
- Inside Text there's a **Style/Layout segmented control**. Inside the Font section there's an **Advanced options** button (popover) holding ligatures, baseline shift (super/subscript), character fill/outline, and so on. [V] https://support.apple.com/guide/keynote/tand7ac3366f/mac
- [I] Fill, Border, Shadow and Reflection are checkbox- or popup-gated: their child controls appear only when enabled. This is classic dependency disclosure.

**Freeform**
- No sidebar inspector at all. A **format bar of per-property inspector buttons** (Fill, Stroke, Text, Line Ends, Arrange), each opening a popover. More goes under Format > Shapes and Lines. [V] https://support.apple.com/guide/freeform/frfm8479c716/mac

---

## 10. Cross-tool patterns and rules

### 10.1 What decides "top level"? (in order of how consistently it's applied)
1. **Relevance to the selection or tool. All ten tools do this.** Controls that don't apply aren't rendered: they aren't disabled, and they aren't "mixed". tldraw, Excalidraw and Penpot compute it from one predicate source. Excalidraw's comment is the best articulation: one source of truth, layouts stay pure. [V]
2. **Existence.** Repeatable or optional properties (fills, strokes, shadows, effects, layout guides, exports, material layers) are **empty until added**. Penpot even makes a section collapsible only once it has content. [V]
3. **Dependency.** A child control appears only when its parent is on or non-default:
   - Excalidraw: fill style hidden while background is transparent
   - Figma: inline blend dropdown appears only when non-normal
   - Framer: `hidden(props)`
   - Framer: adding 3D auto-adds perspective
   - Keynote: shadow and border checkboxes

   [V]
4. **Frequency × glance-value.** Things people *read* constantly to check state (constraints, clip, blend, X/Y, sizing mode) must stay visible even if they're rarely *changed*. Figma learned this the hard way three times in one beta. [V]
5. **Set-once vs tuned.** Settings fixed once per document or object go into popovers, menus or the command bar:
   - Figma: type settings, auto-layout edge cases
   - Sketch: fill rule, image-replace
   - Excalidraw: flip

   Continuously tuned values stay inline. [V for placement; I for the motive]
6. **Muscle memory beats logic for anchors.** Figma kept X/Y on top and reverted the condensed alignment grid. Per-selection reordering is the most persistent unresolved UI3 complaint. [V]
7. **Coarse presets reduce control count.** tldraw's 5 opacity steps and 4 sizes; Paper's slider snap points and perceptual units ("Size %" instead of "Count"). Better defaults remove the need for extra rows. [V]

### 10.2 Mechanisms: when to use each, examples, cost

| Mechanism | Use when | Examples | Cost / failure mode |
|---|---|---|---|
| **Contextual rendering** (only what applies) | Always; it's the baseline | tldraw `styles.get(X) === undefined → null`; Excalidraw predicates; Penpot layout-child gating; Rive per-object Inspector | Sections move between selection types, which breaks spatial memory (Figma #89868). Mitigate with a fixed global order where sections are only omitted, never reordered. |
| **"+" add-to-reveal** (empty header) | Optional or repeatable properties whose default is "none" | Figma Fill/Stroke/Effects/Layout guide/Export; Sketch style sections; Penpot shadow/stroke/blur; Rive fill/stroke; Spline material layers; Framer Effects; Framer `optional: true` | Discoverability is OK because the header is visible. It costs one click to start, but it's free at rest and it reads as "nothing set". |
| **Dependency gating** (child shows when parent on) | A control is meaningless unless another has a value | Excalidraw fill style vs transparent bg; Figma blend dropdown when non-normal; Framer `hidden(props)`; Keynote shadow checkbox | Users can't find the child until they guess the parent. Use the parent's own row as the trigger. |
| **Inline row + overflow dropdown on the same row** | A short list of common values plus rare variants of the same property | tldraw fill: 3 inline + `fill-extra`; tldraw label vertical-align | The trigger **must show the active hidden value** (tldraw PR #7885) or state is invisible. |
| **Popover behind an icon / "…" / settings** | A cluster of set-once, low-frequency, related options | Figma Type settings (Basics/Details/Variable); Figma auto-layout settings; Sketch Border settings panel; Rive fill/stroke option button; Keynote Advanced options; Excalidraw compact "adjustments" | Figma's blend icon failed because state was invisible and needed a tooltip. Paragraph spacing moving into Type settings produced "where has it gone?" threads. Never hide a binary (clip content) or a glance-value (constraints). |
| **Popover → persistent movable panel** | Users edit across many selections with the same advanced options | Sketch Copenhagen: panels stay open while controls still apply | More window management. Worth it for colour and advanced editors. |
| **Inline "more" disclosure** (expands in place) | Medium-frequency extras of one section | Penpot text `more-options`, blur per-item more; Webflow "More type options"; Rueca's `folder(..., {collapsed: true})` | Hidden values are invisible unless there's an indicator or auto-reveal. **Penpot auto-expands** when a hidden value gets set. |
| **Collapsible section** | Long panels; sections used in bursts | Webflow (with **coloured dots when collapsed and set**); Penpot (collapsible only when non-empty); Figma Selection colors | If state isn't remembered across selections, users re-open the section every time (Figma #14282). Persist per section, not per object. |
| **Focus mode / collapse-all** | Very tall panels (CSS-scale property sets) | Webflow focus mode ⌥⇧S, ⌥S | Power-user feature. Needs a shortcut to be worth it. |
| **Inline-vs-popover user preference** | A contested control whose split depends on the user | Figma constraints "toggle on to display inline"; Figma property labels on/off; Excalidraw compact vs full | Adds a settings matrix. Use it sparingly, for 1–3 contested items. |
| **Density modes over one predicate source** | Same tool across desktop, tablet, phone, or user-chosen density | Excalidraw full/compact/mobile; tldraw desktop panel vs mobile single button | Low, if visibility logic is shared (Excalidraw's explicit design). |
| **Priority+ promotion** (measure width, promote to bar) | Toolbars that shrink | Excalidraw mobile: Delete/Duplicate move out of overflow when width allows | Positions shift with width, but that's acceptable for actions. |
| **Tabs by selection type** | Very different property sets per object kind | Keynote Style/Text/Arrange (and table/chart sets); Figma Design/Prototype; Sketch moved Prototype from a tab to a panel | Tabs hide whole sets. Sketch moved *away* from a Prototype tab so people can design while prototyping. |
| **Menu bar / command palette / command bar** | Rare, set-once, or action-like (not values) | Sketch fill rule and replace-image to menus plus Command Bar; Excalidraw flip only in the palette; Figma Actions menu | Zero panel cost. It needs search or menu discoverability, and it's only fine for actions, not for state you need to read. |
| **Hover-reveal** | Secondary affordances on an existing field (bind variable, reset, key) | Figma "Apply variable" on hover, with Shift-click and right-click fallbacks | Not touch-friendly; there were reports of the icon going missing. Always pair it with a non-hover route. |
| **Modifier-key alternates** | Doubling an existing button's function | Sketch ⌥: flip → rotate 90°, visibility toggle → remove | Invisible. Only for experts; show it in the tooltip. |
| **Right-click on row or header** | Copy/paste/reset/remove of a single property | Sketch header paste; Framer copy-a-style; Figma right-click > Apply variable | Hidden but conventional. Good for non-essential row actions. |
| **"Mixed" state** | Multi-selection with differing values | tldraw mixed icons and opacity; Penpot "mixed typography / tokens"; Figma Selection colors | Render the control with a "Mixed" placeholder, not empty. Offer detach or unify. |
| **State indicators outside the panel** | Hidden or collapsed state must stay legible | Webflow dots on collapsed headers; Framer layer-panel effect indicator; Rive key-button three states | Cheap. This is the counterweight that makes hiding safe. |
| **Read-only catch-all** | Values exist that the UI can't edit yet | Paper "Other styles" panel | Prevents "invisible state" bugs. |

### 10.3 Anti-patterns these tools avoid (or reverted)
1. **A binary in a dropdown.** Figma clip content was reverted to a checkbox. [V]
2. **An icon whose meaning is the current state, readable only by tooltip.** Figma's blend icon was reverted. [V]
3. **Hiding glance-values.** Figma constraints went from a hidden button to an inline toggle and "expanded by default". [V]
4. **Overflow that hides the active value.** tldraw's overflow trigger shows the active fill. [V]
5. **Collapsed sections that hide set state.** Webflow adds dots; Penpot auto-expands on set. [V]
6. **Forgetting disclosure state per selection.** This is still a Figma complaint. [V]
7. **Reordering sections per selection type.** Still a Figma complaint. Tools that only *omit* sections (tldraw, Excalidraw, Penpot) don't get this complaint. [V for the complaint; I for the contrast]
8. **Three-level disclosure.** Figma Selection colors needs three clicks to see all colours and draws complaints. NN/g: more than two levels "usually have low usability". [V] https://www.nngroup.com/articles/progressive-disclosure/
9. **Disabled-but-visible irrelevant controls.** All three open-source tools render `null` instead. [V]
10. **Separate visibility rules per layout.** Excalidraw centralised them. [V]
11. **Floating chrome for an all-day tool.** Figma re-docked its panels. [V] Rueca's floating-island default deserves a note here: Figma kept floating UI only for Minimize-UI and presentation-like contexts.

### 10.4 Implications for Rueca (my synthesis, [I])
Rueca already has `when` (dependency gating), `folder(…, { collapsed: true })` (inline "more"), `Section persistKey` (remembered collapse state) and a `changed` marker. The gaps against the patterns above:
- **A "changed inside" dot on collapsed folder headers** (Webflow), and **auto-expand a collapsed folder when a value inside becomes non-default** through preset, undo, share-link or agent (Penpot). This makes "hide the rarely-used" safe.
- **An `optional` or "+ add" def** for params whose default is "off" (grain, shadow, outline, extra layers). Today they render as a row with a 0 or false value. Framer's `optional: true` and Figma/Sketch/Penpot's empty-header "+" are the precedent.
- **Inline row + overflow** for segmented/tiles params with more than ~4 options. Show the first N inline and the rest in a dropdown whose trigger shows the active value (tldraw).
- **Coarse-first numbers:** snap points or `soft` ranges and perceptual units (Paper, tldraw), so one slider replaces "slider + fine-tune field".
- **Move actions out of the panel.** Randomise, reset-section and copy-values should live in a header "…" or the command/hotkey layer (Sketch, Excalidraw). `p.action` rows are the first candidates to leave the panel.
- **Never nest:** colour, the 1–3 parameters the piece is *about*, binaries (use Switch/Checkbox, never Select for 2 options), and anything people glance at to read state.
- **Keep folder order fixed.** Omit folders via `when`; never reorder them by mode or selection.
- **Instrument before cutting.** NN/g: split on "frequency-of-use data for existing systems". Rueca could log per-param touch counts locally (dev-only, like Send-to-agent notes) to drive the at-rest/nested split per tool.
