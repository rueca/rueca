# How motion, 3D, VFX and game-engine tools handle huge parameter sets

Research for Rueca: which controls show at rest and which sit nested. Date: 2026-10-15.

Legend: **[V]** means verified against the cited URL (a primary doc where one existed, otherwise named). **[I]** means inferred, or from memory of the product, and not confirmed in a doc this session. Where only forum or third-party sources exist, that is said.

---

## 0. TL;DR for Rueca

Every mature tool combines the same four layers, though none names them as one model:

1. **The author decides what faces out.** The person who builds the rig (or wrote the code) chooses a small public surface, and everything else stays internal. Examples: Houdini HDA promoted parameters, AE Essential Graphics / Master Properties, Blender node-group interface sockets with *Hide in Modifier*, Ableton Rack macros, Cavalry Control Centre, Notch exposed properties, Unreal Blueprint *Instance Editable*.
2. **The author ranks what's inside.** Within the public surface, the author tags some controls as secondary: Unreal `AdvancedDisplay`, Unity/URP "Additional Properties", Blender `DEFAULT_CLOSED` sub-panels, Houdini collapsible folders with a default-closed tag.
3. **State decides what's live.** A child control is greyed out or hidden while its parent toggle is off: Unreal `EditCondition` / `EditConditionHides` / `InlineEditConditionToggle`, Houdini *Disable When* / *Hide When*, the Blender panel toggle, TouchDesigner `enableExpr`, Unity Volume per-property override checkboxes.
4. **The user overrides the view.** Escape hatches change what the user sees without changing the rig: search, "show only modified" (Unreal, AE `UU`, Houdini *Non-default parameters*, TouchDesigner *Hide/Show Default Parameters*), favourites or pins (Unreal star, Cavalry pin, Blender pin), "show all advanced" globally (Unity Preferences, Unreal filter menu).

Usage frequency never decides the default layout in any of these tools. In every tool examined, the author decides it statically. Recency and frequency only show up as user-driven favourites. Modified state is the one dynamic signal that is widely used, and it serves as a filter or an indicator, never as the default layout.

---

## 1. Unreal Engine: Details panel

**Visible by default**
- Every `UPROPERTY` marked `EditAnywhere` / `EditInstanceOnly` / `EditDefaultsOnly` (or the Visible* read-only variants) shows up, grouped by `Category`. [V] https://dev.epicgames.com/documentation/en-us/unreal-engine/unreal-engine-uproperties
- Categories expand and collapse; nested categories use `|` in the Category string (e.g. `Category="Rendering|Lighting"`). [V] same URL
- Properties tagged `AdvancedDisplay` are hidden by default. The docs say the property "will be placed in the advanced (dropdown) section of any panel where it appears". [V] same URL. In the UI this is the small ▼ disclosure strip at the bottom of each category; clicking it reveals that category's advanced rows. [I: UI appearance from product knowledge]
- `SimpleDisplay` does the opposite: it forces a property into the always-visible part. [V] same URL

**Ordering inside a category:** `DisplayPriority` (1 is highest) and `DisplayAfter="OtherProp"`. [V] same URL

**State-driven disclosure**
- `EditCondition="bFoo"` disables the row while the condition is false. It supports expressions: `!`, `==`, `!=`, `<`, `>`, `&&`, `||`, but not function calls. [V] https://dev.epicgames.com/documentation/unreal-engine/edit-conditions-for-properties-in-the-details-panel-in-unreal-engine
- `EditConditionHides` hides the row instead of disabling it. [V] same URL
- `InlineEditConditionToggle` on the bool collapses it into a checkbox on the controlled property's own row, so the toggle and its value share one line and the bool gets no separate row. [V] same URL and https://docs.unrealengine.com/4.27/API/Runtime/CoreUObject/UObject/UM_3/index.html. This is the closest prior art to "a toggle that owns its slider".

**Author promotion**
- In Blueprints, only variables with the eye icon open (**Instance Editable**) show up on placed instances. The default is closed, i.e. private. [V] https://dev.epicgames.com/documentation/unreal-engine/blueprint-variables-in-unreal-engine
- Material instances only show parameters that the parent material's author created as parameter nodes. Each has a `Group` and a `Sort Priority`, and each needs an override checkbox ticked before it can be edited. [V] https://dev.epicgames.com/documentation/en-us/unreal-engine/creating-and-using-material-instances-in-unreal-engine and the Python API `MaterialExpressionParameter`

**Escape hatches**
- **Search Details** box filters as you type. Epic warns that a leftover filter can hide the property you want. [V] https://dev.epicgames.com/documentation/en-us/unreal-engine/level-editor-details-panel-in-unreal-engine
- The filter dropdown offers "Show Only Modified Properties", "Show Only Keyable Properties" and "Show Only Animated Properties"; each option is enabled through a flag in `DetailsView`. [V] https://dev.epicgames.com/documentation/en-us/unreal-engine/python-api/class/DetailsView. The Blueprint editor docs describe the same visibility filter as letting you "show or hide modified or advanced properties, as well as collapse or expand all categories". [V] https://dev.epicgames.com/documentation/unreal-engine/details-panel-in-the-blueprints-visual-scriting-editor-for-unreal-engine. A "Show All Advanced" item exists in that menu. [I: exact label not confirmed in docs]
- **Favourites**: clicking the star next to a property pins it to a Favorites section at the top. This is still marked experimental (Editor Preferences > Experimental > Enable Details Panel Favorites). [V] level-editor-details-panel URL
- A **modified indicator**: a reset-to-default arrow appears on any row that differs from its default. [V] same URL
- **Section filter chips** at the top of the panel (General / Actor / LOD / Misc / Physics / Rendering / Streaming / All) let you jump to a slice. [I: not confirmed in docs this session]
- **Property Matrix** opens a selection in a spreadsheet for bulk editing. [V: existence only, `bShowPropertyMatrixButton` in FDetailsViewArgs]

**Rule for what surfaces:** the code author decides statically (`AdvancedDisplay`, `Category`, `DisplayPriority`), and state hides or disables rows (`EditCondition*`). The user's escape hatches are search, show-modified and favourites.

---

## 2. Unity: Inspector

**Visible by default**
- Every serialized field on every component, with components stacked as foldouts. A private serialized field shows unless it is marked `[HideInInspector]` ("Flags a variable to not appear in the Inspector… can be serialized and not display"). [V] https://docs.unity3d.com/ScriptReference/HideInInspector.html
- Layout decorators include `[Header("…")]`, `[Space]`, `[Tooltip]` and `[Range]` (which turns a field into a slider). [V third-party: https://github.com/teebarjunk/Unity-Built-In-Attributes; official ScriptReference pages exist per attribute]
- **Custom Editors** (`[CustomEditor]`, `Editor.OnInspectorGUI`, `EditorGUILayout.Foldout` / `BeginFoldoutHeaderGroup`) are the escape hatch for authors who want full control. [I: well known, not re-fetched]

**Normal vs Debug mode**
- Debug mode shows private properties and hides custom inspector code. You leave it with **Exit Debug**. [V] https://docs.unity3d.com/Manual/InspectorOptions.html. It is a developer view, not a power-user view, and comparable to Blender's Developer Extras.

**URP/HDRP "Additional Properties"** (this is the important one)
- Render-pipeline components flag some properties as *additional*. By default "Unity does not show certain advanced properties". To show them for one section, open the **More (⋮)** menu on that section and choose **Advanced Properties**. To show them everywhere, set **Edit > Preferences > Graphics > Advanced Properties** to **All Visible**. [V] https://docs.unity3d.com/Manual/urp/urp-asset-additional-settings.html
- The older HDRP docs describe the same thing as a contextual menu on each section header with **Show Additional Properties**. Volume overrides have the same toggle in their existing menu. The global preference used to live at *Preferences > Core Render Pipeline > Additional Properties = All Visible*: it flips every component at once, but each component can still be set individually afterwards, and the component menu has a *Show All Additional Properties…* shortcut to the preference. [V] https://docs.unity3d.com/Packages/com.unity.render-pipelines.high-definition@14.0/manual/More-Options.html
- When revealed, additional properties briefly animate in with a highlight tint so you can see what just appeared. [I: product memory, not in docs]

**State-driven: Volume overrides**
- Each property in a Volume override has a checkbox on its left; ticking it makes the property editable and active, so an unticked property inherits. [V third-party summary of HDRP Volume docs]
- Core RP added "Show Only Overridden Parameters" to the Volume component menu. [V source PR: https://github.com/Unity-Technologies/Graphics/pull/5745/files; the shipped label may differ]

**Modified indicator:** prefab overrides show a blue bar in the left margin and a bold property name. [V] https://docs.unity3d.com/Manual/PrefabInstanceOverrides.html

**Rule for what surfaces:** the code author decides statically (serialized vs `[HideInInspector]`, additional vs not, custom editor). The user can set a per-section or global "show additional" toggle that persists as a preference. Modified (override) state is an indicator and, for Volumes, a filter.

---

## 3. Blender: Properties editor, Sidebar, modifiers, node groups

**Visible by default**
- The **Properties editor** has vertical tabs (Tool, Render, Output, View Layer, Scene, World, Object, Modifiers, Particles, Physics, Constraints, Data, Material, Texture). Which tabs exist depends on the active object's type. Each panel's `poll(context)` decides whether it is drawn at all: "If this method returns a non-null output, then the panel can be drawn". [V] https://docs.blender.org/api/current/bpy.types.Panel.html
- Panels and sub-panels: `bl_parent_id` makes a panel a sub-panel, `bl_order` sets the default order, and `bl_options={'DEFAULT_CLOSED'}` "Defines if the panel has to be open or collapsed at the time of its creation". `HIDE_HEADER` removes the header, `INSTANCED` lets multiple panels be "used as part of a list depending on data external to the UI" (this is how the modifier stack works), and `HEADER_LAYOUT_EXPAND` exists too. `draw_header` puts widgets into the header row, typically an enable checkbox. [V] same URL
- In practice the main panel is open and its secondary sub-panels (e.g. Cycles' Light Paths > Caustics, Fast GI) are `DEFAULT_CLOSED`. [I: specific panels from product knowledge]

**Header owns the enable toggle:** many panels (Motion Blur, Depth of Field, Bloom-era EEVEE, Freestyle) draw a checkbox in the header via `draw_header`, and the body greys out when it is off. [I: panel examples; mechanism V]

**Interaction**
- Clicking a header expands or collapses it; **A** over a panel toggles it. **Ctrl-click** on a collapsed header opens it and closes all others; Ctrl-click on an expanded header expands or collapses all of its sub-panels. Dragging over several headers toggles them all. Dragging the grip on a header reorders panels, and the order persists. **Pin** keeps a Sidebar panel visible across tabs (not available in the Properties editor). **Ctrl-Wheel** switches vertical tabs. Presets menus sit in panel headers. [V] https://docs.blender.org/manual/en/latest/interface/window_system/tabs_panels.html; the Ctrl-click change is in commit "UI: Ctrl-click on panel header expands & collapses subpanels" https://lists.blender.org/pipermail/bf-blender-cvs/2020-June/141577.html
- **Sidebar (N panel)** sits on the right of each editor, holds panels for the editor and selection in vertical tabs, and is toggled with N. [V] https://docs.blender.org/manual/en/latest/interface/window_system/regions.html
- **Modifier stack**: each modifier is an instanced panel with its header (name, viewport/render/edit-mode toggles) always visible and a collapsible body. Ctrl-click collapses the others. The Modifier Tools add-on adds *Toggle Stack* to collapse or expand all. [V add-on] https://docs.blender.org/manual/en/2.81/addons/interface/modifier_tools.html
- **Properties editor search** (Ctrl-F) filters panels and highlights which tabs contain matches. [I: since 2.91, not re-fetched]

**Developer Extras** (Preferences > Interface) exposes developer-only UI such as icon names in tooltips and right-click *Copy Python Command* / *Edit Source*. *Python Tooltips* is a separate option. [V] https://docs.blender.org/manual/en/5.0/editors/preferences/interface.html. This is a global "expert mode" for the app as a whole, not per object.

**Author promotion: node-group interface** (the clearest author-facing model)
- The group's **interface** (Sidebar > Group) lists the sockets that face outward. Everything else inside the group stays internal. Sockets can be grouped into **Panels**, which can nest; panels can be **Closed by Default**; and a panel can carry a **Panel Toggle**, a boolean drawn as the panel header's checkbox. The toggle does not disable the panel's sockets automatically; the author has to wire a Switch node. [V] https://docs.blender.org/manual/en/4.5/interface/controls/nodes/groups.html
- Per socket: **Default**, **Min/Max** (the UI range only, "the minimum and maximum value for the UI button"), **Hide Value**, and **Hide in Modifier** (for Geometry Nodes inputs: the input works inside the group but is not shown on the modifier). [V] same URL
- So one node group has two outward surfaces: the node face (in other node trees) and the modifier face (in the Properties editor). Hide in Modifier lets the author keep a param wireable but out of the artist's panel. This two-audience split is directly relevant to Rueca's agent vs designer surfaces.

**Rule for what surfaces:** the add-on or core author decides with `poll`, `DEFAULT_CLOSED` and header toggles. Node-group authors declare the outward interface explicitly. The user reorders, pins and collapses, and Blender remembers the layout.

---

## 4. Houdini: parameter interface, HDAs, spare parameters

**Visible by default:** the node's parameter interface, laid out in **folders**. Folder types [V] https://www.sidefx.com/docs/houdini/ref/windows/optype.html:
- **Tabs**: adjacent tab folders join into a tab set; *End tab group* starts a new set.
- **Collapsible**: a twirl-down heading. It supports an *in-header checkbox*, a *header parameter* (a param drawn in the header, e.g. a menu), and a default open or closed tag.
- **Simple**: a labelled box.
- **Radio buttons**: tabs where the chosen tab changes how the node operates (mode switch).
- **Import Block**: contents shown inline with no visible enclosure.
- **Multiparm Block** (List / Scrolling / Tabs): a user-addable list of repeating groups.
- Horizontal join ("Horizontally join to next parameter") puts small controls on one line. A parameter with the icon-look tag "only appears in the header when it's collapsed", so collapsed folders can show a summary. [V] https://www.sidefx.com/docs/houdini/ref/windows/edit_parameter_interface.html

**State-driven disclosure: Disable When / Hide When** [V] optype.html#conditions
- Syntax: `{ parm op value … } { … }`. Comparisons inside one pair of braces are ANDed and separate brace groups are ORed. Operators are `== != < > <= >= =~ !~`, and spaces around them are mandatory.
- Special left-hand functions: `hasinput(n)`, `ninputs()`, `isparm(name)`. Expression functions are not allowed; the workaround is an invisible helper param that computes the value.
- *Disable* greys out; *Hide* removes. Both can be applied to a whole tab/folder.
- **Invisible** flag: the param exists and can be scripted but is never shown. *Show invisible parameters* reveals such params in the Type Properties editor.

**Author promotion: HDAs**
- An HDA (Houdini Digital Asset) wraps a subnetwork. The author opens **Type Properties > Parameters** and drags a param from any inner node's parameter editor into the asset's interface, or right-clicks it and chooses **Export Parameter to Type Properties**. The *From Nodes* subtab shows "a tree view of every parameter on every node in the entire scene". [V] https://www.sidefx.com/docs/houdini/assets/asset_ui.html
- On promotion, "Houdini automatically edits the source parameter to be a parameter reference expression"; from then on you edit only the promoted copy. [V] edit_parameter_interface.html. The inner param keeps existing and is driven by a channel reference to the outer one.
- Parameters must be promoted before they can bind to a viewport handle. [V] asset_ui.html
- Houdini habit: an HDA's surface usually has a main tab with 5–15 params plus "Advanced" or "Settings" tabs. [I: convention, from SideFX shelf assets]

**Spare parameters** add extra params to one node instance only (not the node type). They can be keyframed and referenced, and serve as per-instance rig knobs. [V] edit_parameter_interface.html

**Escape hatches: the parameter editor filter** [V] https://www.sidefx.com/docs/houdini/network/parms.html and `hou.parmFilterMode`
- Search toolbar (magnifier, top right). Filter modes: `NonDefaultParms` ("show only the parameters that are not at their default values"), `TimeDependentParms` (animated), `ScopedParms`, `AutoScopedParms`, `GraphSelectedParms`, `ParmsWithExpressions`, `ParmsWithOverrides`, `InvisibleParms`, `VisibleAndInvisibleParms`, `AllParmsAndHeadings`. Search can match name/label, raw value or evaluated value.
- When filtering, "Houdini preserves the tab structures around the matching parameters", so matches stay in context.
- Indicators: values different from the factory default are **bold**. Background tints show animation state: green means keyed on this frame, yellow means pending, blue means between keys. A channel-colour dot marks scoped params, and locked params get a grey field.

**Rule for what surfaces:** the asset author decides by promotion plus folder type and default-open tags. State (Hide/Disable When) hides or greys. The user filters by modified, animated or expression state, and those filters keep the folder context.

---

## 5. After Effects

**Effect Controls panel**: each applied effect is a twirl-down. Its parameters are flat or in nested twirl-down groups (e.g. Glow's colours, Fractal Noise's Transform / Sub Settings / Evolution Options). Nested groups start closed. [I: product knowledge; helpx pages returned 403]

**Timeline property reveal: the keyboard is the disclosure mechanism**
- `U` reveals animated properties (keyframes or expressions). `UU` reveals **modified** properties, i.e. "show only modified properties, even if they're not animated". `E` reveals effects and `EE` reveals expressions. With no layers selected these apply to all layers; with a selection, only to the selected layers. An untouched effect does not show under `UU`. [V community expert answers] https://community.adobe.com/t5/after-effects-discussions/shortcut-uu-is-revealing-too-much-after-22-6/m-p/13285201 and https://community.adobe.com/t5/after-effects-discussions/keyboard-shortcut-for-keyframes-only-not-expressions/m-p/1817705/highlight/true
- Ctrl/Cmd-click on a twirl expands that group and all its children. Ctrl+` toggles expand or collapse of everything. [I]
- Users don't scroll AE's full timeline property tree. They summon slices of it: U, UU, P/S/R/T/A for single transform props, and Shift to add more slices.

**Author promotion: Essential Graphics / Master Properties / Essential Properties**
- In the **Essential Graphics** panel the comp author drags chosen properties (from any layer or effect in the comp) into a list, and can rename them, group them and add comments. *Solo Supported Properties* shows which properties can be promoted. [V third-party] https://www.schoolofmotion.com/blog/master-properties-after-effects, https://blog.motionarray.com/learn/after-effects/master-properties-after-effects/; Adobe localized helpx https://helpx.adobe.com/bg/after-effects/how-to/intro-master-properties.html
- When the comp is nested, those properties show up under the layer as **Master Properties**, keyframeable per instance without touching the source. **Push** writes an instance value back as the master default; **Pull** resets the instance to the master. [V same]
- Since AE 23.6 (Aug 2023) the contextual **Properties panel** shows a layer's **Essential Properties** when you select it, so the promoted knobs appear in the everyday panel and not only in a special one. [V] https://www.toolfarm.com/?p=107400; Adobe community "Essential Properties now in the Properties panel" https://community.adobe.com/t5/after-effects-beta-discussions/essential-properties-now-in-the-properties-panel/m-p/14000353
- The Properties panel itself is a curated, selection-dependent surface: Layer Transform always on top, plus Text / Paragraph / Text Animation for text layers and shape sections for shape layers. Adobe's pitch is "shows you what's important, when it's important". [V] https://pages.adobe.com/aftereffects/en/beta-request/ and the localized helpx Properties-panel page (via search snippet)

**Rule for what surfaces:** the template or comp author promotes. The AE team curated the Properties panel by layer type. The user summons slices by keyboard (U/UU/E/EE).

### Cinema 4D: Attribute Manager
- Object attributes are split into tab pages, usually **Basic** (name, layer, visibility, enabled, X-Ray), **Coord.** (P/S/R) and **Object** (the type-specific params), plus Phong, user data and others depending on type. [V] https://help.maxon.net/c4d/s22/us/html/5177.html. The default tab is the type-specific one. [I]
- With a mixed selection, "the Attribute Manager will only display the tabs that are present for all selected objects". [V] https://help.maxon.net/c4d/s22/us/html/5823.html
- Shift-click or Ctrl-click on tabs shows several tab pages stacked at once. [I]
- **User Data**: the author adds custom params (any type, in groups/subtabs that open or close, reorderable by drag) to an object or tag and wires them via XPresso to deep params elsewhere. The docs pitch it for scenes handed to other users; a common pattern is a Null holding a control panel. [V] https://help.maxon.net/c4d/r21/us/html/5742.html (search snippet). This is C4D's version of HDA promotion.

---

## 6. TouchDesigner
- Every operator's parameters are split into **pages** (tabs). Some pages are type-specific; others are shared across types (e.g. Common). [V] https://derivative.ca/UserGuide/Parameter_Dialog
- **Custom parameters** can only be added to COMPs (via *Customize Component…*) and are organised on custom pages that "appear under the second row of pages", separate from built-ins. They are distinguished by a capitalised name. Pages can be sorted, and order propagates to clones. [V] https://derivative.ca/UserGuide/Custom_Parameters, https://learn.derivative.ca/courses/100-fundamentals/lessons/106-comps-interface-building-and-controls/topic/working-with-custom-parameters/
- The typical TD rig puts a COMP around a network and uses custom pars as the outward surface, with internal pars referencing them (`parent().par.X`). This is promotion by reference, like HDAs. [I: convention]
- State: `Par.enable`, and `Par.enableExpr` ("an expression that controls the enable state"), plus `readOnly`, `startSection` (separator) and `help` (shown with Alt-hover). [V] https://docs.derivative.ca/Par_Class
- `Par.isDefault` is "True when the parameter value, expression and mode are in their default settings". The Parameter Dialog header has a **Hide/Show Default Parameters** button, which is TD's "show only modified". [V] Par_Class and Parameter_Dialog
- Clicking a parameter's name expands it to show its mode (Constant / Expression / Export / Bind). This is per-row progressive disclosure: the advanced *mode* of one param is hidden until asked for. [V] Parameter_Dialog / https://derivative.ca/UserGuide/Parameter

## 7. Notch
- The property editor shows the selected node's properties, with a top bar holding **Search** ("filter the property list"), **Lock Properties**, Undock and Presets. Each property has **Reset**, **Lock** and **Keyframe** icons, plus a chevron that gives "access to exposing and some unique property options". [V] https://manual.notch.one/2026.1/en/docs/reference/user-interface/properties/
- **Exposed properties** (RFX licence): the author marks properties *Expose to Block/Standalone*. They are managed in the **Exposed Node** / Exposed tab, with Exposed Name, Group and Unique ID; same Group means grouped, and same Unique ID means merged into one control. Authors are told to set sensible Min/Max because some media servers require it. [V] https://manual.notch.one/1.0/en/docs/reference/nodes/exposed-nodes/expose-to-block, https://manual.notch.one/0.9.23/en/docs/blocks/exposing-values/
- So the block author hands the media-server operator a small named and ranged surface, while the full node graph stays behind. Same pattern as an HDA.

## 8. Cavalry
- **Attribute Editor**: each layer's UI is a stack of **Control Rows**. Several layer UIs can be loaded at once (up to a preference-set max; the oldest drops off). *Live Mode* replaces the UI on selection; **Pin** keeps a layer's UI loaded; and search filters by attribute name across all loaded layers, so scrubbing one "position" can set all four selected shapes. [V] https://cavalry.studio/docs/user-interface/menus/window-menu/attribute-editor/
- Only animated attributes appear in the Scene Window tree, so the outliner shows what has changed and not every param. [V] same URL
- **Control Centre**: "a place to promote the most important attributes in a Scene for quick and easy access", "especially useful for rigging or sharing Scenes". You right-click any attribute and choose *Add to Control Centre*; a small blue dot then marks the promoted row back in the Attribute Editor. Groups are one level deep, rows can be reordered and renamed, and an options menu can auto-group by source layer and expand or collapse all. Search, plus a filter by composition. [V] https://cavalry.studio/docs/user-interface/menus/window-menu/control-centre. This is the closest analogue to what Rueca could ship: a scene-level promoted surface, with the origin marked by a dot.
- **Pre-Comp Overrides** (Pro): override attributes inside compositions to build templates. [V marketing] https://cavalry.scenegroup.co/pricing

## 9. Rive
- The inspector is contextual to the selection (artboard / shape / bone / state). [I]
- Author promotion through **data binding**: the author defines a **View Model** (typed properties: number, string, bool, enum, colour, list, nested, image, artboard), binds properties to scene properties, and runtimes and hosts talk only to that view model. The older state-machine **Inputs** (bool/number/trigger) are now legacy and live in the Animations panel. [V] https://rive.app/docs/editor/data-binding/overview, https://rive.app/docs/editor/state-machine/inputs.md
- The pattern: the file's public API is a small, typed, author-declared schema, separate from the hundreds of internal keyable properties.

## 10. Spline
- The right sidebar shows object properties for the selection, with separate **States** and **Events** panels added via "+". Public docs do not describe collapse defaults. [V partial] https://docs.spline.design/doc/events--interactivity/docE7Z7AJ48H. Sections (Transform, Shape, Material layers, etc.) are collapsible and material layers stack like Blender modifiers. [I]

## 11. Jitter
- The Property panel has two **modes**, *Design* (static: position, size, fill, stroke, text) and *Animate* (presets plus custom animations), toggled with **M**. Selecting an animation block on the timeline shows that animation's parameters in the panel. [V] https://help.jitter.video/en/articles/16414495-design-and-animate-modes, https://help.jitter.video/en/articles/14136797-create-custom-animations
- Disclosure is by mode and by selection, not by an advanced section. Animation params only appear when you select the animation. Presets come first and custom comes second (In/Out presets, then *custom*). [V same]

## 12. Figma Motion (announced at Config, June 2026)
- Secondary reports describe a timeline with keyframes and presets inside Figma Design, 3D transforms, and agent-generated starting points. [V secondary only] https://designcompass.org/en/2026/06/26/figma-motion-config-2026/. No official doc on property-panel IA was found. Early forum feedback complains about missing alignment and clipping controls in Motion. [V] https://forum.figma.com/suggest-a-feature-11/figma-motion-usability-feedback-and-feature-requests-55314. Figma's general pattern applies: a contextual right panel whose sections appear only when relevant (Auto layout only on frames, and so on), with "+" buttons to add optional sections like Effects or Export. [I]

## 13. Ableton Live Racks (author-promoted macros)
- A Rack can expose up to **16 Macro Controls**, with **8 visible by default**. The +/- view selectors set how many are shown, and the show/hide state is saved in the set. [V] https://www.ableton.com/en/manual/instrument-drum-and-effect-racks/
- In **Map mode** you click any parameter from any device in the rack, then a macro's Map button. A mapped parameter "will appear disabled, since it hands over all control to the Macro Control". One macro can drive many params, each with its own **Min/Max** range, and Min > Max inverts. [V same]
- Macros get custom names, colours and info text. The **Rand** button randomises all mapped macros, with a per-macro *Exclude Macro from Randomization*. **Macro Variations** store and recall snapshots of the macro values, with *Exclude Macro From Variations*. [V same]
- So: one knob to many params with ranges, a tiny promoted surface, randomise and snapshots on that surface only, and the inner param visibly handed over (disabled). The best model for "the five knobs that matter".

---

## 14. Cross-tool mechanisms

| Mechanism | Who uses it | When it fits | Cost / risk |
|---|---|---|---|
| **Author promotion** (pick N inner params, expose as the public surface, inner param becomes a reference) | Houdini HDA *Export Parameter to Type Properties*; AE Essential Graphics → Master / Essential Properties; Blender node-group interface + *Hide in Modifier*; Ableton macros; Cavalry Control Centre; Notch Exposed; C4D User Data + XPresso; TD custom pars; Rive View Models; UE Blueprint *Instance Editable* / material parameters | When one person builds the rig and another (or the same person later) tunes it; when the surface is shared or embedded | Needs an authoring step. A param left unpromoted is hard to reach (Houdini's *From Nodes* tree and Cavalry's search are the escape hatches). Duplicate state if not a true reference |
| **Macro with mapping range** (1 knob → many params, each with min/max) | Ableton macros; Notch Unique ID merge; TD expressions; C4D XPresso | Perceptual controls ("energy", "grain") that move several low-level params together | Hides the real values; needs a way to see what a macro drives (Ableton disables the mapped params so the link is visible) |
| **Static advanced flag** (secondary rows behind a ▼ per section) | UE `AdvancedDisplay`; URP/HDRP Additional Properties; Blender `DEFAULT_CLOSED` sub-panels; Houdini collapsible folders with a default-closed tag | Large components where the code author knows which 20% get touched | Author guesses wrong, and users don't know a ▼ hides something. Mitigated by a global "show all advanced" preference (Unity) |
| **Global "expert mode" preference** | Unity *Advanced Properties: All Visible*; Blender *Developer Extras*; Unity Debug inspector | Experts who would otherwise click every ▼ | One more setting; screenshots and support differ by user |
| **Enable toggle owns its children** (checkbox in the header or inline; children greyed or hidden while off) | UE `EditCondition` / `InlineEditConditionToggle`; Blender `draw_header` checkbox and node-group *Panel Toggle*; Houdini collapsible folder with in-header checkbox; HDRP Volume per-property override checkbox | Any feature block that is off by default (bloom, motion blur, noise, stroke) | Disable vs hide is a real choice: disabled rows teach that a feature exists, hidden rows cut noise. UE and Houdini offer both |
| **Conditional visibility on a value** (Hide When / Disable When with AND/OR) | Houdini `{ type == 1 }`; UE `EditCondition` expressions + `EditConditionHides`; TD `enableExpr` | Mode switches (shape = circle → show radius) | Rows jump around as values change; conditions belong to the author and are invisible to the user. Houdini needs a helper invisible param for anything complex |
| **Mode tabs / radio folders** (one param picks which tab of params applies) | Houdini Radio-button folders; Jitter Design/Animate; C4D tab pages; TD pages | Mutually exclusive sets; very different tasks on the same object | Tabs hide content completely; search must cross tabs (Houdini keeps tab structure in results) |
| **Show only modified** | UE *Show Only Modified Properties*; AE `UU`; Houdini `NonDefaultParms`; TD *Hide/Show Default Parameters*; Unity *Show Only Overridden* (Volumes) | Reviewing what changed, diffing presets, handing off | Needs a reliable "default" (Houdini uses factory defaults even if session defaults change). Empty state needed (UE bug: filter on a component with nothing modified hid the menu) |
| **Modified indicator** (bold, coloured bar, reset arrow, dot) | Houdini bold; Unity blue margin bar + bold; UE reset arrow; Cavalry blue dot on promoted rows | Always. It's cheap and drives reset | Visual noise if too loud |
| **Show only animated / keyable** | UE filter; AE `U`; Houdini `TimeDependentParms`; Cavalry Scene Window shows only animated attrs | Any tool with a timeline | Only meaningful with keyframes |
| **Favourites / pin** | UE star (experimental); Cavalry pin layer UI; Blender pin panel | Per-user frequent controls | Per-user state; UE still marks it experimental after years, a sign it's hard to get right |
| **Search / filter-as-you-type** | All of them (UE, Houdini, Cavalry, Notch, Blender Ctrl-F) | Anything over ~30 params | A leftover filter hides things (Epic warns about this). Matches should keep their group context (Houdini) |
| **Summon by key** (reveal a slice of properties by shortcut) | AE U/UU/E/EE/P/S/R/T | Keyboard-heavy experts | Undiscoverable without a cheat sheet |
| **Curated contextual panel** (a small, hand-designed panel per selection type) | AE Properties panel; Figma right panel; Jitter Property panel | Novice-to-mid users; mixed selection types | Someone has to curate per type; power users still need the full tree |
| **Collapse-all-others / remembered layout** | Blender Ctrl-click, drag over headers, drag to reorder (persisted); Cavalry expand/collapse all | Long stacks (modifiers, effects) | Mostly a power-user affordance |
| **Visible count selector** | Ableton macros +/- (8 of 16) | Fixed-size promoted banks | Small, but a good pattern for "show 4, more on demand" |

### What nobody does
- **Usage-frequency ranking** (reordering or hiding by how often a control is touched): none of the tools surveyed do this. The layout stays stable and author-decided. Frequency only appears through user favourites (UE star) or user-built panels (Cavalry Control Centre). [I: absence across all sources]
- **Auto-hiding something because it was never touched.** "Untouched" drives *filters* (UU, NonDefaultParms) but never the default layout.

---

## 15. Implications for Rueca (draft rules)

1. **Make promotion a first-class authoring primitive.** A shell author (or the agent, or Rafael via "Send to agent") marks 3–8 controls as *surface*; the rest are *inner*. The surface shows at rest in the island. Inner is reachable via a per-section ▼ "More" (UE / URP style), via search, and via "show modified". Model it after the Blender node-group interface and Cavalry Control Centre: promoted rows keep a small dot in the full inspector so you can tell where they came from.
2. **The enable toggle owns its section.** Any optional feature (grain, bloom, stroke, motion blur) gets its on/off toggle in the section header (Blender `draw_header`, UE `InlineEditConditionToggle`, Houdini in-header checkbox). While it is off, the section body collapses or hides. Use *hide* for the at-rest island and *disable* only inside the expanded/full view, where showing that a feature exists is useful.
3. **Mode params gate their dependants.** If a select or segmented control picks a mode, only that mode's params show (Houdini Hide When, UE `EditConditionHides`). Declare this as a condition on the control (`showWhen: { shape: 'circle' }`), not as ad-hoc JSX.
4. **Ship "Show modified" and a modified dot.** Bold label or dot plus reset on each row (Houdini, Unity, UE). Add a "Modified" filter and an AE-style shortcut (e.g. `U` twice). This also gives an agent-friendly diff for "Send to agent" and share links.
5. **Give per-section ▼ More plus a global "Show all" preference** (Unity's per-section ⋮ + Preferences *All Visible*), stored per user. Experts flip it once and every inner control is visible.
6. **Macros for perceptual knobs.** Allow one surface knob to map to several inner params with ranges (Ableton). While mapped, show inner params as driven (disabled, with a link indicator) so there's no hidden fight. Randomise and variations act on the surface only, with per-knob exclude.
7. **Don't rank by usage.** Keep the layout author-defined and stable. Let the *user* pin (Cavalry pin, UE star) if they want a personal surface.
8. **Search must keep context.** Matches show inside their section header (Houdini preserves tab structure). Warn when a filter is active, since Epic's own docs flag stale filters as a trap.
9. **Count budget.** Ableton's default of 8 visible from 16, the 5–15 params on an HDA's main tab, and AE's curated Properties panel all point to roughly 6–10 controls at rest per object as the norm. [I: synthesis]
