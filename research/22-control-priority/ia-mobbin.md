# How creative tools nest secondary controls: Mobbin evidence

**Purpose.** Collect real-product evidence for deciding which Rueca inspector controls are visible at rest and which are nested.
**Method.** 26 `search_screens` calls (19 web, 7 iOS) and 1 `search_flows` call (iOS) on Mobbin. Every observation below comes from looking at the screenshot itself. Each search returned 5–8 screens, and about 75 were usable.
**Images.** The 25 best are saved in `scratchpad/mobbin/` as `app-mechanism.webp`. They are the full-resolution `image_url` files: 1920×1320 for web, 1179×2676 for iOS. Entries without a local file are cited by `mobbin_url` only.
**AI usage notice.** No result in this session included an `ai_usage_notice` field, so there is nothing to copy here.

---

## 1. "+" to add: an empty section shows only its header

Settings the user hasn't turned on take up one line: a header and a "+". Fields appear only after the user adds the effect.

| App | mobbin_url | File | Observation |
|---|---|---|---|
| Figma | https://mobbin.com/screens/51212867-7e4a-4509-90e5-a34232546563 | `figma-plus-to-add-sections.webp` | With a Line selected, **Fill, Effects and Export are single header rows with a "+"**. Only Stroke, which is set, shows fields. Each populated row has an eye (hide) and a minus (remove). Advanced stroke options sit behind a small sliders icon next to Weight. |
| Rive (Design mode) | https://mobbin.com/screens/1a851b75-6c39-46cd-83d9-5199872277f6 | `rive-design-empty-sections-plus.webp` | Strokes, Clip, Constraints and Draw Order are header + "+" only. Fills is populated. Clicking the fill swatch opens a color popover with a "Solid ▾" paint-type menu at the top. A "Selection Colors" section summarises the colours in use. |
| MagicPath | https://mobbin.com/screens/5485ae30-ed88-48a5-be51-718ae263fb0a | (see §4 file) | Under Effects, "Drop shadow" is a single row with a "+". |
| Klaviyo | https://mobbin.com/screens/3849c671-deb7-4c88-a8d0-5172c0899106 | – | Text-area background colour, Border and Block background colour are each a header with a "+". Padding, which nearly always matters, is shown expanded. |
| Readymag | https://mobbin.com/screens/7124dbbc-2929-4f6a-addd-3f4ac1d0529b | – | In the animation step panel, each effect (Move, Rotate) is a block you can remove with "−". A "+" adds another effect type. "Display settings ⇕" expands more options, and "Copy all settings" copies the step. |

## 2. Toggle or checkbox in the header: enabling a section reveals its body

Nearly the same as "+", but the section keeps its place in the panel. Turning it off hides the body without losing its values.

| App | mobbin_url | File | Observation |
|---|---|---|---|
| Jitter | https://mobbin.com/screens/fbe1d53f-f1b0-4211-a397-0c73f9c2a0c1 | `jitter-checkbox-section-headers.webp` | Fill, Stroke and Shadow each have a checkbox in the header. Fill is checked and shows a Color row. Stroke and Shadow are unchecked, so they are header-only. Very compact. |
| Synthesia | https://mobbin.com/screens/2f3a9bd2-81e8-44ca-9f47-2d9164df5e83 | – | Border is switched on and shows colour and width. Shadow is switched off and shows only its header. Layout is collapsed under a ▸ with a lock icon. |
| Higgsfield (Color Grading) | https://mobbin.com/screens/30f0ebff-91a8-4c11-bc28-543927bcf945 | – | Seven effect rows (Color Correct, Soften Details, Bloom, Halation, Lens, Exposure, Film Grain). Each is collapsed, with a chevron, an info "i" and an on/off switch. Above them is a preset thumbnail grid. Reset and Apply sit at the bottom. |
| Spline (scene, nothing selected) | https://mobbin.com/screens/c50f8656-6663-411c-abb6-177942cc8d5c | – | Post-Processing and Fog are header-only with a switch. Environment Settings is expanded, using Yes/No segmented controls rather than checkboxes. |
| Zoho CRM canvas | https://mobbin.com/screens/2dcd27b3-3f8d-4c81-87b3-3b59f4cc8712 | – | Border, Shadow, Radius and Padding are each a row with a checkbox, and checking one expands it. |

## 3. Collapsible sections (accordion), including "Advanced" disclosures

| App | mobbin_url | File | Observation |
|---|---|---|---|
| Squarespace (generative background) | https://mobbin.com/screens/9cf06d0a-eef3-48df-a4e7-0fd8b98d67ee | `squarespace-generative-accordion-shuffle.webp` | **The closest match to Rueca.** A floating panel over the canvas holds generative-art parameters. "Shape and Size" is open (Complexity 51, Intensity 10, Seed 100). Motion and Texture are collapsed. A "SHUFFLE SETTINGS" randomiser sits at the bottom. The companion screen [f77f0557](https://mobbin.com/screens/f77f0557-6e2b-4a0f-b30d-443ae15a2856) shows Motion open: Speed is a segmented control (.5x / 1x / 2x / •••), with "•••" holding custom values. |
| Gamma (theme fonts) | https://mobbin.com/screens/ad4dc9a0-ad1b-440c-a7ec-2c7a577af805 | `gamma-advanced-disclosure.webp` | Each font group shows only family, weight and colour. An **"Advanced" disclosure per group** holds line height, letter spacing, capitalisation (Aa/A) and a base-size slider. It is open for Heading and closed for Body. **A reset arrow appears next to a changed colour value.** |
| Magnific (image Adjust) | https://mobbin.com/screens/18718d8a-b82a-4774-8ac0-356195b5acdd | – | In the floating Adjust panel, Light is open (Exposure, Brightness, Contrast, Highlights, Shadows, each with a % field). Color and Tint are collapsed, and the Tint header shows a small state icon. |
| Krea (Enhance) | https://mobbin.com/screens/61439f96-5357-4456-a33d-01871540d8c0 | – | The main choice, scale (1x/2x/4x/8x/Max), is a segmented control at the top. A "Settings" collapsible holds resolution, prompt, four sliders and a Match Color switch. A large Enhance button sits at the bottom. |
| PandaDoc (Headings) | https://mobbin.com/screens/17a30f2b-9532-4c05-afba-37e7abf27f7e | – | A General block is always open. Below it are per-heading sections; Heading 1 is collapsed and Heading 2 is expanded. |
| Perplexity (Thumbnail creator) | https://mobbin.com/screens/d365bbd5-acd5-4169-be33-a1d60445142f | – | Topic, platform and visual style are shown. Everything else is under "› Additional settings". |
| Dialpad | https://mobbin.com/screens/6087e60e-1bc3-44dd-9f6b-252fb48706ab | – | A "Hide advanced options" text toggle opens inline. The slider label states the default: "(default 30s)". |
| Vapi | https://mobbin.com/screens/baee58f7-db8d-4c96-8d69-ad8a5f2c6d28 | – | An Advanced tab of collapsible cards. Each row has an icon, a label and a help line. Sliders show min and max plus a numeric box. |
| Shopify image editor | https://mobbin.com/screens/4fe0e77a-a75a-4842-8a99-9d1fad49c360 | – | Strict accordion: Information, Crop, Resize, Draw, Color background, Generate. Only one is open at a time (Draw). |

## 4. Popover from a small icon next to the section (the advanced-settings popover)

The main row stays dense. Rarely used options for that row move to a popover attached to an icon on the row or header.

| App | mobbin_url | File | Observation |
|---|---|---|---|
| Figma (Draw) | https://mobbin.com/screens/ce742de1-52b7-4719-9067-39693e92335e | `figma-stroke-settings-popover.webp` | A floating "Stroke settings" popover opens from an icon on the stroke row. A **Basic / Dynamic / Brush segmented control at the top changes what the popover shows**. Opacity and corner radius stay in the panel as sliders. |
| MagicPath | https://mobbin.com/screens/5485ae30-ed88-48a5-be51-718ae263fb0a | `magicpath-typography-icon-popover.webp` | The Typography section keeps family, weight, size, line height and letter spacing in view. **A sliders icon in the section header opens a small popover with only Decoration (none/underline/strike) and Case (—/AG/ag/Ag)**, the rarely used text options. Fill has a Solid/Gradient segmented control. |
| Gamma (card logo) | https://mobbin.com/screens/f3171616-6b05-4772-9b68-0cdf8dfe1088 | – | A sliders icon next to the theme logo opens a tiny popover: an Image size segmented control (S/M/L/XL), tips, and "Reset size". |
| Webflow | https://mobbin.com/screens/69712cc9-c970-449b-8c21-1538de1d4e37 | `webflow-inline-more-options.webp` | Two mechanisms on one screen. (a) **Inline expanders**: "More size options" under Size, and "Float and clear" under Position. (b) A Link Settings popover with type tabs, URL and Preload, plus "Show All Settings →" that leads to the full panel. **Labels of properties that have been set are coloured orange** (Font, Size, Height, Color). |
| Magnific editor | https://mobbin.com/screens/1ffc8fc5-55ed-42a4-aa75-b0b23f9b8ac5 | – | The font picker opens as its own floating popover beside the inspector, with search, project fonts, uploads and recents. The Border section has a gear icon. |
| Descript | https://mobbin.com/screens/902e105e-9af8-4612-b552-a925b693a8cf | – | The Transitions popover shows a thumbnail grid, then Duration and Easing. The Easing menu draws each curve as a glyph. A settings icon sits in the popover header. |
| Spline | https://mobbin.com/screens/71892fad-92f7-4390-851f-23326c8e6436 | – | Clicking an Event row in the inspector opens an "Edit Event" panel docked next to it (Actions, Transitions, "+"). The inspector stays visible. A related screen, [ef93245a](https://mobbin.com/screens/ef93245a-da51-429c-aec3-6bd86152b38e), shows that the Material header's expand icon opens an extra material-layers column beside the panel. |

## 5. Drill-in: a sub-panel replaces the panel, with Back

| App | mobbin_url | File | Observation |
|---|---|---|---|
| Squarespace (Drop shadow) | https://mobbin.com/screens/8856404c-8bcf-4267-95c6-a8bb58a23c24 | `squarespace-shadow-preset-drilldown.webp` | "‹ BACK · Drop shadow". **Presets come first (Soft / Strong / •••)**, then Color and Spread / Distance / Blur sliders with values, then REMOVE. The user picks a preset before fine-tuning. |
| Adobe Express | https://mobbin.com/screens/01ac3574-a26c-414b-bbfc-0de2172a6316 | `adobeexpress-contextual-toolbar-to-panel.webp` | "Apply adjustments" on the contextual toolbar opens a side panel ("‹ Adjustments") grouped into Light, Color and Detail, with "Reset all". **The Saturation and Warmth tracks are gradients that preview their effect.** |
| Canva | https://mobbin.com/screens/49e77586-4ecb-4b2e-9496-7ae7ddcfab72 | – | "‹ Adjust" first offers a scope choice (All / Click / Brush) and one-tap **Auto-adjust**, then the White balance and Light groups. A changed bipolar slider (Brightness −87) fills from the centre. "Reset adjustments" sits at the bottom. |

## 6. Settings behind one icon or chip (prompt-bar pattern)

At rest the generator shows only the prompt and a summary chip. Every parameter sits behind it.

| App | mobbin_url | File | Observation |
|---|---|---|---|
| Midjourney | https://mobbin.com/screens/9a4c6351-867f-4239-8a85-4e50559fa1d6 | `midjourney-settings-behind-icon.webp` | A sliders icon at the end of the prompt bar opens a sheet of four cards. **Image Size** has a live aspect-box preview ("4:3"), a Portrait/Square/Landscape segmented control, a slider and a Reset link. **Aesthetics** has Stylization, Weirdness and Variety sliders with no numbers. **Model** has Standard/Raw and Version. **More Options** has Speed (Fast/Turbo). None of this is visible at rest. |
| Recraft | https://mobbin.com/screens/62f14b3c-a773-4cb7-a8c5-6f75a9dc58e4 | `recraft-settings-chip-popover.webp` | The prompt footer shows a model chip ("V4.1 Vector") and a sliders icon with a dot. That icon opens a Settings popover: Style, **Palette drawn as a colour strip**, Aspect ratio and Count, with a reset icon in the header. Screen [83f3890a](https://mobbin.com/screens/83f3890a-e97e-4b17-b589-0916d7a19510) shows that popovers cascade three levels deep: Settings → Palette grid → colour picker for one swatch. |
| Magnific | https://mobbin.com/screens/db0328a6-e008-4cc3-9203-105307462436 | – | An "Auto ▾" chip in the prompt bar opens a mini popover (Model: Auto; Images − 2 +). Choosing a model opens a list grouped into Featured and Recent, with "All models · 13 available ›" as a drill-in. |
| HubSpot (Generate images) | https://mobbin.com/screens/94af7113-2e05-463a-9604-42d8700f8cf2 | – | The Style and Size rows use the current value as the trigger: "Style decided by AI ▾", "Square 1:1 ▾". |
| ElevenLabs (Voice Design) | https://mobbin.com/screens/bf8e9bf6-6bed-4e9c-a874-aad2296ca29d | – | A prompt with example chips. "Settings" is a secondary button next to the main Generate button. |

## 7. Contextual toolbar on the selection

| App | mobbin_url | File | Observation |
|---|---|---|---|
| Higgsfield canvas | https://mobbin.com/screens/d12cc860-5ec8-45b5-a6ee-4c260e883204 | `higgsfield-contextual-toolbar-value-chips.webp` | A compact dark toolbar above the selection. **Each chip shows its current value and a caret**: yellow swatch ▾, "Aa ▾", "Small ▾", alignment glyph ▾. Then B, link, strike, list, lock and delete. No labels. |
| Zoom whiteboard | https://mobbin.com/screens/4cafcbd6-bab5-4da7-9b3d-1d291734b67e | – | A toolbar above the selected text: font, size stepper, an "Aa" style menu (Bold/Italic/Underline/Strike), colour, alignment, list, fill, border, link, and a "•••" overflow at the end. |
| Magnific canvas | https://mobbin.com/screens/45ab00c2-07bd-4911-b288-33f9d01e4850 | – | A toolbar above the selected image. A caret opens a menu of AI tools, "•••" holds the rest, and a "Replace" chip sits on the image itself. |
| Google AI Studio (visual edit) | https://mobbin.com/screens/40a9950b-c483-4861-b0e5-a4b2188e581c | – | A bottom toolbar with grouped icons, each with a caret. "Aa ▾" opens Font family, Style, Align, Size and Line height. |
| Stitch | https://mobbin.com/screens/e287470a-7c98-4ec3-bab5-7becfc91de73 | – | A top command bar (Generate•, Modify, Preview, More•). Clicking an element opens a tiny "Edit Element" popover (Edit text / Edit with AI). |
| CapCut (iOS) | https://mobbin.com/screens/0dc382cf-c814-48ba-b5e4-808769d92db3 | – | **Selecting a clip replaces the whole bottom toolbar** with clip tools (Remove BG, Effects, Replace, Overlay, Basic, Extract audio…). "«" returns to the main toolbar. [Edits 976e4c4a](https://mobbin.com/screens/976e4c4a-eb08-4750-b6c1-6cd4ee00ac61) does the same for an audio clip (Split, Volume, Fade, Replace, Delete, Slip). |

## 8. One active control: a tool strip or segmented control drives a single slider (iOS)

iOS editors show **one slider at a time**. The control strip both chooses the tool and shows the state of every tool.

| App | mobbin_url | File | Observation |
|---|---|---|---|
| Apple Photos | https://mobbin.com/screens/0dc105f4-8259-4396-bb88-979b3c4d9a66 | `applephotos-tool-carousel-single-slider.webp` | Adjust / Filters / Crop tabs. A carousel of round tool icons with Auto (wand) first. **Only one tick-ruler slider is ever visible**, labelled above ("AUTO"). In the [Editing a photo flow](https://mobbin.com/flows/da47b2da-f094-46b9-9760-90bc109d948e), Filters works the same way: a thumbnail strip plus one intensity ruler. The [colour flow](https://mobbin.com/flows/f10ba1c1-7d8a-429b-906b-14b539788e26) opens a Colors sheet with Grid / Spectrum / Sliders mode tabs, and its trigger is a ring that shows the current colour. |
| Azar (Beauty) | https://mobbin.com/screens/47ec2e21-dd91-4046-b091-dd9a99baf491 | `azar-ring-progress-tool-icons.webp` | **Each round tool icon has a progress ring showing that tool's amount**, plus a red dot. You can see every tool's state without opening any of them. One slider above, with reset on the left and compare (before/after) on the right. |
| Google Photos | https://mobbin.com/screens/a89340a9-e931-4ec4-a623-e327dff9168a | `googlephotos-chip-expands-to-slider.webp` | **The selected tool's chip widens in place into a slider pill** (value "100" plus a tick track). Its neighbours (Contrast, Highlights) stay as text labels. An earlier state, [f1d8e9d6](https://mobbin.com/screens/f1d8e9d6-b472-40a2-856a-d80de1db0572), shows the plain icon row. |
| Depop | https://mobbin.com/screens/6ddbe876-edc9-4d7b-ba12-90646da8aa7f | – | A Brightness / Contrast / Saturation segmented control swaps the single slider below it. "AI relight" is a one-tap card. |
| Telegram | https://mobbin.com/screens/dc3a6820-6750-4363-9f63-be2ad3b6e17b | – | A list of sliders. **Changed values are shown in yellow with a sign** (+0.72, −0.59, +0.54). Bipolar sliders fill from a centre tick. Bottom icon tabs switch to tint, blur or curves. |
| Halide | https://mobbin.com/screens/68bc4ec3-182e-4873-9557-222a490170c6 | – | Quick Edit / Exposure / Film tabs. Exposure ties a histogram to tick-dial sliders, with yellow ticks marking the active range. |
| VSCO | https://mobbin.com/screens/aebf07e1-b952-41b8-86e2-81828e228728 | – | Category chips (ALL TOOLS / ESSENTIAL / LIGHT / COLOR / EFFECTS) filter a single row of tool icons. They filter the row; they are not sections. |
| Instagram | https://mobbin.com/screens/58fd64c2-9d7d-41e0-9b90-e302b79f5c4f | – | Large icon tiles (Structure, Warmth, Saturation, Color). Tapping one opens its single slider. |
| [untitled] audio | https://mobbin.com/screens/21f7cf8d-9db4-4513-a2ef-819baf617e8b | – | VARISPEED / GAIN mode chips swap the control set. Speed and Pitch use tick sliders with the value on the right. |
| Insight Timer | https://mobbin.com/screens/2920ba6d-a48b-4d58-9ad5-512a1f813595 | – | **A master control and its sub-controls.** A large "50%" device-volume slider. Each sub-slider is described as "a percentage of your device volume", and each has a preview play button. |

## 9. Change signals: show what differs from the default

| App | mobbin_url | File | Observation |
|---|---|---|---|
| Visual Electric | https://mobbin.com/screens/b4020498-30e7-400d-b0ab-ea4051dbb9c0 | `visualelectric-changed-slider-color.webp` | In the Basic section, **only changed sliders get an orange fill from zero** (Exposure 87%, Highlights −100%, Shadows 93%). Untouched ones stay grey at 0%. A reset icon sits in the section header. White Balance is collapsed below. |
| Krea (3D Object) | https://mobbin.com/screens/2b2e6816-0fa7-4b40-a15c-a450552a5053 | `krea-reset-appears-when-changed.webp` | **"Reset" appears next to Light Intensity only when it is changed** (2x). Rim Light Intensity is at its default (1x) and shows no Reset. Compare the all-defaults state, [a0e90f29](https://mobbin.com/screens/a0e90f29-0210-4411-bea8-bbd04fc3251f). |
| Arcade | https://mobbin.com/screens/0c91a608-f417-49f0-85d1-23bfb7617db9 | `arcade-changed-dot-collapsed-row.webp` | The collapsed "Player ›" row and the "Metadata" section header each have a **blue dot**, flagging something inside without opening it. Cursor and Wrapper are visual swatch pickers, not dropdowns. |
| Higgsfield (preset applied) | https://mobbin.com/screens/974ef91a-b28e-47fa-b8a3-e9a4f1f0f2f5 | `higgsfield-preset-drives-effect-toggles.webp` | With the B&W Film preset selected, **Color Correct, Bloom, Exposure and Film Grain switch on**, so the preset visibly sets the nested effects. Compare the "None" state, [30f0ebff](https://mobbin.com/screens/30f0ebff-91a8-4c11-bc28-543927bcf945), where all are off. |
| Pinterest (Notifications) | https://mobbin.com/screens/ab0d2b06-e640-42f0-a68f-c1a638ce50cd | `pinterest-collapsed-row-summary.webp` | **Each collapsed row prints a summary of its nested switches under its title** ("Push on, in-app on", "Push on"). One row is expanded. Reset and Save sit at the bottom. |
| Shopify (permissions) | https://mobbin.com/screens/5d81a2ca-b286-4e00-bb45-e8f5c73bcda3 | – | Collapsed groups show counts of enabled children: "1/1", "17/20". |
| Workable | https://mobbin.com/screens/2e0de63f-d64f-4080-9ea7-fdb3fbb02fc8 | – | Collapsed subsections carry an eye-off icon and "(All nested fields hidden)". |
| Felt (map layer style) | https://mobbin.com/screens/b49b6663-8e56-473e-8830-0501ff711c97 | – | Tabs show counts ("Filter (3)"). Compact rows show summary values ("Auto / 0.8px", "Medium") that open on click. |

## 10. Mode switches that change the whole inspector

| App | mobbin_url | File | Observation |
|---|---|---|---|
| Rive (Animate mode) | https://mobbin.com/screens/58bcd487-751f-44f0-88b9-9829bcc4cd41 | `rive-animate-mode-keyframes.webp` | A **Design / Animate switch** at the top right of the inspector. In Animate, every property gets a keyframe diamond, and the keyed one (Y) is filled blue. The panel layout stays the same and only the affordances change. The Interpolation pane shows "Select a key" when no key is selected. |
| Jitter (Animate) | https://mobbin.com/screens/a8c50206-2137-42a9-9ae3-f6b0fc9bf184 | – | Design / Animate tabs. The selected animation ("Opacity •••") shows From/To, Duration and Easing, then "Add animation". Timeline rows are named "Rectangle · Scale/Rotate/Move/Opacity". |
| Riveo (iOS) | https://mobbin.com/screens/929b17ce-a309-498f-9edf-d4b2614f3e1a | `riveo-keyframe-button-per-row.webp` | Each parameter row has an icon and label on the left and its control on the right. A **horizontal scroll-wheel picker** handles enums (Blend Mode: Screen / Color Dodge / Overlay), and a tick ruler with a value handles numbers. **A "+◇" add-keyframe button sits on every row.** The timeline track is above. |
| Higgsfield (video settings) | https://mobbin.com/screens/8e6b81ce-2c86-467b-876f-a1fe259906ee | – | Visuals / Sound tabs. Style, Craziness and Montage are named-value dropdowns (Realistic, Medium, Slow paced) with one-line descriptions. Reset and Save. |
| Linktree | https://mobbin.com/screens/528da77e-5230-4d6f-88c0-ccfb97186d9a | – | Visual segmented controls replace numbers: Solid / Glass / Outline, and Shadows None / Subtle / Strong / Hard. Corners is a slider from Square to Round. |

## 11. Users choose what stays visible: promote, demote, show when changed

| App | mobbin_url | File | Observation |
|---|---|---|---|
| Linear (Customize sidebar) | https://mobbin.com/screens/5f8b47b2-cf1a-431b-aa95-dfce8c7f5810 | `linear-show-when-badged-tristate.webp` | Each item has three states: **Always show / Show when badged / Don't show**, plus a drag handle. "Show when badged" means the item appears only when it has something to report. |
| Todoist (Quick Add) | https://mobbin.com/screens/7fb2c8c1-71b9-45bd-ba1d-d398d0619c90 | `todoist-promote-demote-overflow.webp` | Two lists: "Show task actions" (red minus to demote) and "More actions" (green plus to promote). **A live "Example" preview renders the resulting toolbar, ending in "•••".** |
| Jira | https://mobbin.com/screens/3975cfce-4e70-4122-809c-0d2af54fa8e5 | – | Checked items always appear. Unchecked items are still reachable from the "More" menu, so nothing is lost. |
| Typeform (Table settings) | https://mobbin.com/screens/a6fb2d90-7068-4620-b0c1-170ab67d08a6 | – | A switch and drag handle per field, plus "Reset to default view". |
| Wrike | https://mobbin.com/screens/e8129372-d461-4a1f-bcd6-b0620802a945 | – | A "Select items to show in this menu" popover with search and switches. |
| GitBook | https://mobbin.com/screens/b7d4b726-678e-4b02-b5da-60f0adb1d2a9 | – | **Hidden parts of the page appear as faint chips in place** ("Page title hidden", "Page description hidden", "Add cover"), so turning one back on is one click. A "⋮" menu holds grouped page actions with submenus. |

## 12. Overflow, context menus and command palettes for rare actions

| App | mobbin_url | File | Observation |
|---|---|---|---|
| Slite (Excalidraw canvas) | https://mobbin.com/screens/fa6af8a3-302b-4153-a31c-4f7c9e8abd27 | – | Right-click menu: Copy as PNG/SVG, **Copy styles / Paste styles**, Send backward / Bring forward, Flip, Link, Duplicate, Lock, Delete. The property panel stays visual (swatches and icon buttons). |
| Jitter | https://mobbin.com/screens/fbe1d53f-f1b0-4211-a397-0c73f9c2a0c1 | (see §2) | Layer context menu: Copy, Paste, Paste and replace, Duplicate, Group, Rename, Delete. |
| MagicPath | https://mobbin.com/screens/0ceb8153-c384-4504-9710-d19e3becb76a | – | A "⋮" in the frame header opens a menu with shortcuts (Refresh, Rename, Copy, Duplicate, Export as image, Extract theme) and an "Add to library ›" submenu. |
| Superhuman | https://mobbin.com/screens/85dc5994-9360-428d-9092-7425e070ed7f | – | The command palette **shows each action's shortcut**, and onboarding says it is how you "learn its shortcut". |
| Magnific | https://mobbin.com/screens/14ceb943-f04a-460f-b4f5-2ebd78d74aff | – | The palette lists Recents, then Quick actions with shortcuts. A footer legend explains the keys (navigate, select, Esc). |
| Replit | https://mobbin.com/screens/9bfad190-392c-4ad0-ba1b-6475cd1bd0d8 | – | The palette is grouped, and Settings is a "›" drill-in submenu. |
| Chronicle | https://mobbin.com/screens/1f8f9666-9d94-4716-b861-88b3e436007b | – | A floating bottom bar (Insert, Remix, …, •••). Insert opens a menu with submenus (Heading › Small / Medium / Large). |

---

## What the best ones do

1. **A control that isn't in use costs one line, or nothing.** Figma, Rive, Jitter, Synthesia, Spline and Klaviyo all show an unused effect as a header with "+" or a switch. Fields appear only once the effect is on. *For Rueca:* a param group whose `enabled`/`amount` is at its default should collapse to its header row. The header's switch is the control.

2. **Everything nested shows a state summary on its trigger.** The trigger stands in for the hidden controls by summarising them:
   - Pinterest prints "Push on, in-app on" under a collapsed row.
   - Shopify shows "17/20".
   - Arcade puts a blue dot on a collapsed row.
   - Azar draws a progress ring around each tool icon.
   - HubSpot and Higgsfield use the current value as the trigger ("Square 1:1 ▾", "Small ▾", a swatch).
   - Recraft draws the palette as a colour strip.
   - Midjourney draws the aspect box.

   The user can read the whole state without opening anything.

3. **Changed values stand out, and reset sits where the change is.** Visual Electric colours a track only once it moves off zero. Telegram shows changed values in yellow with a sign. Webflow turns set labels orange. Krea and Gamma show a reset control only on the changed value. Canva and Telegram fill bipolar sliders from the centre. Section-level reset (Visual Electric, Recraft, Midjourney's per-card Reset) complements the per-control resets. *For Rueca:* this is the cheapest way to make a large inspector feel quiet, because only changed values draw attention.

4. **Presets come before parameters, and visibly set them.** Squarespace's shadow drill-in leads with Soft / Strong / •••. Higgsfield's preset grid sits above the effect rows, and choosing B&W Film switches on four of them. Deezer puts a "‹ Flat ›" preset stepper under the EQ. Apple Photos and Canva start with Auto. The common order is preset, then a few macro controls, then the detail behind a disclosure.

5. **One active control at a time beats a wall of sliders, especially on narrow surfaces.** Apple Photos, Google Photos, Depop and Azar each show a single slider driven by a tool strip. Google Photos widens the active chip into the slider in place, so neither the selector nor the control has to sit elsewhere. A compact floating Rueca panel could do the same: list params as chips with summaries and expand only the focused one.

6. **Rare options go in a popover on the row they belong to, not a separate "Advanced" page.** MagicPath puts only Decoration and Case behind the Typography sliders icon. Figma does the same with Stroke settings. Gamma uses one popover for image size. The disclosure sits beside the setting it extends, and the popover is small and single-purpose. When it has variants, a segmented control at the top switches them (Figma's Basic / Dynamic / Brush, Apple Photos' Grid / Spectrum / Sliders).

7. **Mode switches keep the layout and change the affordances.** Rive's Design / Animate switch keeps every row in place and only adds keyframe diamonds. Riveo puts a "+◇" button on each param row. That model fits Rueca's timeline: an Animate mode adds a keyframe button to each existing control rather than opening a separate panel.

8. **The selection decides which controls show.** CapCut and Edits replace the bottom toolbar when a clip is selected and offer a "«" back. Higgsfield's canvas toolbar and Adobe Express's "Apply adjustments" chip appear only on selection. With nothing selected, Spline shows scene settings instead. A Rueca inspector can rest on global or scene params and switch to layer params when a layer is selected.

9. **Users can promote and demote.** Linear's "Always show / Show when badged / Don't show" is the most useful model for Rueca: a param marked *show when changed* appears only once it moves off its default. Todoist's two lists with a live toolbar preview, and Jira's "unchecked items go to More", show that demoting must never mean losing access. GitBook's faint "title hidden" chips are the inline way back.

10. **Rare actions live in menus, and the palette teaches shortcuts.** Copy and paste styles, flip, arrange and export sit in context menus (Slite, Jitter) or a "⋮" (MagicPath, GitBook). The panel holds only things you tune. Superhuman and Magnific's command palettes show the shortcut beside each action, which helps when controls are tucked away.

11. **Generative-art panels look like Squarespace's.** A floating panel over the stage, one group open, the rest as an accordion, and a "Shuffle settings" button. With Midjourney's unnumbered Stylization, Weirdness and Variety sliders, this is the clearest real-product precedent for Rueca: few visible knobs, and randomise as the main way to explore.

### Downloaded files (25)
`adobeexpress-contextual-toolbar-to-panel`, `applephotos-tool-carousel-single-slider`, `arcade-changed-dot-collapsed-row`, `azar-ring-progress-tool-icons`, `figma-plus-to-add-sections`, `figma-stroke-settings-popover`, `gamma-advanced-disclosure`, `googlephotos-chip-expands-to-slider`, `higgsfield-contextual-toolbar-value-chips`, `higgsfield-preset-drives-effect-toggles`, `jitter-checkbox-section-headers`, `krea-reset-appears-when-changed`, `linear-show-when-badged-tristate`, `magicpath-typography-icon-popover`, `midjourney-settings-behind-icon`, `pinterest-collapsed-row-summary`, `recraft-settings-chip-popover`, `rive-animate-mode-keyframes`, `rive-design-empty-sections-plus`, `riveo-keyframe-button-per-row`, `squarespace-generative-accordion-shuffle`, `squarespace-shadow-preset-drilldown`, `todoist-promote-demote-overflow`, `visualelectric-changed-slider-color`, `webflow-inline-more-options` (all `.webp`)

### Gaps
- Mobbin has no Linear "Display options" popover. The Linear "Customize sidebar" screen stands in for it.
- Searches for audio macro knobs and 3D material editors found little. The 3D evidence comes from Spline and Krea; there is no Blender-style node or material panel.
- "Segmented mode picker" searches mostly returned settings pages. The strong examples of that mechanism come from Figma's stroke popover, Depop and the Apple Photos colour sheet.
