# What shows at rest vs nested: tuning panels, dev tools, dense apps

Research for Rueca. The question: Rafael feels "a lot of controls we're showing barely get usage". Which rules do the
mature tools use to decide what is visible at rest and what sits one level down, and which **schema-level** hooks do
they offer? (Rueca's inspector is generated from `defineSchema`, so the schema is where the lever is.)

Legend: **[V]** verified against source code or official docs (URL given). **[I]** inferred, from memory, or not
confirmed in a primary source.

Rueca today (read from `skills/rueca/references/kit-api.md` and `src/kit/inspector/Inspector.tsx`): folder
`{ collapsed }`, folder-level and row-level `when: (v) => boolean`, `disabled` (bool or fn, renders at 40% opacity
and inert), `publish`, `hint`. Open/closed state is remembered in localStorage per inspector. There is **no**
param-level "advanced" tier, no `order`, no search filter, and no signal on a collapsed folder that something inside
it has changed.

---

## 0. The short version (rules that keep coming back)

1. **Usage data decides the top tier, and the curve is steep.** In Word 2003 the top 5 commands were about 32% of all
   command use, and Paste alone was more than 11%. Past the top ~10 the curve "flattens out considerably". [V]
   ([Harris, No Distaste for Paste](https://learn.microsoft.com/en-us/archive/blogs/jensenh/no-distaste-for-paste-why-the-ui-part-7))
   So a small, curated head belongs at rest, and a long, flat tail goes in one predictable place.
2. **The tail goes next to its head, never somewhere generic.** Office's dialog launcher sits in the corner of each
   group and opens the full version of *that group*. The rule was to use it "only when the dialog box cleanly supersets a
   chunk or gallery on the Ribbon". [V] ([Dialog Launchers](https://learn.microsoft.com/en-us/archive/blogs/jensenh/dialog-launchers))
   Apple puts it the same way: put "controls that people are most likely to use at the top of the disclosure
   hierarchy... with more advanced functionality hidden by default". [V] ([HIG Disclosure controls](https://developer.apple.com/design/human-interface-guidelines/disclosure-controls))
3. **Static tiers, never adaptive ones.** Office 2000's Personalized/Adaptive Menus hid little-used items automatically.
   They felt random, Harris called them a mistake ("if you went on vacation, things would disappear"), and Office 2007
   turned them off by default even in apps that kept menus. Lab studies found adaptive menus no faster and less preferred
   than static or customizable ones. [V] ([Harris, Why the UI pt 3](https://learn.microsoft.com/en-us/archive/blogs/jensenh/combating-the-perception-of-bloat-why-the-ui-part-3);
   [Computerworld](https://www.computerworld.com/article/1707017/gui-gaffes.html); [Findlater & McGrenere 2004](https://www.cs.ubc.ca/labs/edapt/papers/findlater2004.pdf))
   You can use telemetry to *author* the tiers. Don't use it to *reshuffle* them per user at runtime.
4. **Branches that don't apply are hidden, not disabled.** Storybook (`if`), Leva (`render`) and Toolcraft
   (`visibleWhen`) all *remove* rows that don't apply. Toolcraft's agent contract says it outright: "Do not use
   `disabled`, `disabledWhen`, or inert visible controls for generated product branches." [V] (Toolcraft
   `schema-reference.md`, below)
5. **One door per surface for view-level settings.** Linear has "Display options" (Shift+V), Zed has "Editor Controls"
   (one icon holding about 20 toggles), Notion has `•••` → "Appearance & layout", Agentation has a gear popover
   with a drill-in page, and Apple has a "More" menu. All of them hold *view* settings, the things you set once and
   forget. They hold no content parameters.
6. **Search beats hierarchy once the list is long.** VS Code Settings, Leva's title-bar filter and Chrome's Computed
   filter all do this. Search, a tag and an exact ID are also how VS Code brings back hidden "advanced" settings.
7. **A collapsed thing should say what's inside it when that matters.** Agentation's "Manage MCP & Webhooks" link
   shows a status dot. Storybook's collapsed subsections show "N items". VS Code has an `@modified` filter, and
   Linear has "Reset to default". Rueca's collapsed folders say nothing today.

---

## 1. Tuning panels

### Leva (pmndrs) — source read: `packages/leva/src/types/public.ts`, `store.ts`, `LevaRoot.tsx`, `Folder.tsx`
- **At rest:** every input, with folders **open** (`useState(!collapsed)`, so the default is expanded). [V]
- **Schema hooks** [V] ([public.ts](https://github.com/pmndrs/leva/blob/main/packages/leva/src/types/public.ts)):
  ```ts
  export type RenderFn = (get: (key: string) => any) => boolean
  export type FolderSettings = { collapsed?: boolean; render?: RenderFn; color?: string; order?: number /* like css order */ }
  type GenericSchemaItemOptions = { render?: RenderFn; label?; hint?: string; order?: number }
  export type InputOptions = GenericSchemaItemOptions & { optional?: boolean; disabled?: boolean; onChange?, transient? ... }
  ```
  Usage from Leva's own demo: `fillColor: { value: '#f00', render: (get) => get('fillMode') === 'color' }`. [V]
- **Mechanism:** `store.getVisiblePaths()` filters *rendering* only. A folder whose `render(get)` is false adds its
  prefix to `hiddenFolders` and its children are skipped. [V] ([store.ts](https://github.com/pmndrs/leva/blob/main/packages/leva/src/store.ts))
  The value stays in the store, so a hidden input still returns its value. [I, high confidence: the filter is view-side only]
- `optional: true` puts a checkbox in front of the input. When it's unchecked, the value's type becomes `T | undefined`
  (`Leaf extends { optional: true } | { disabled: true }` in the typings). This is "this parameter is off unless
  you opt in", which is a different thing from hiding it. [V]
- **Panel-level:** `hidden`, `collapsed` (bool or controlled `{collapsed, onChange}`), `flat`, `oneLineLabels`,
  `titleBar: { filter: true }`, which gives a search box in the title bar and is **on by default**, plus `hideCopyButton`. [V]
  ([LevaRoot.tsx](https://github.com/pmndrs/leva/blob/main/packages/leva/src/components/Leva/LevaRoot.tsx))
- **Rule:** everything is visible, and the author narrows it with predicates and order. There's no tier concept.
- **Aged:** `render(get)` is the most-copied conditional idiom in React tuning panels. Its weakness is the string-path
  `get('folder.key')`, which isn't type-checked.

### Tweakpane (cocopon) — source read: `packages/core/src/common/params.ts`, `blade/folder/*`
- **At rest:** everything is visible, and folders are **expanded** (`Foldable.create(config.expanded ?? true)`). [V]
  ([folder.ts](https://github.com/cocopon/tweakpane/blob/main/packages/core/src/blade/folder/controller/folder.ts))
- **Schema hooks:** every blade shares `BaseParams { disabled?, hidden?, index? }`. Folders take `{ title, expanded? }`.
  Tabs take `addTab({ pages: [{title}] })`. [V] ([params.ts](https://github.com/cocopon/tweakpane/blob/main/packages/core/src/common/params.ts))
  ```ts
  export interface BaseParams { disabled?: boolean; hidden?: boolean; index?: number }
  ```
- **Per-control disclosure:** color and point2d take `expanded?: boolean` and `picker?: 'inline' | 'popup'`. The heavy
  editor (picker or pad) sits behind the swatch by default, and you can pin it inline. [V] ([api/params.ts](https://github.com/cocopon/tweakpane/blob/main/packages/core/src/blade/common/api/params.ts))
  This is the strongest **row-level** disclosure idea in the field: the row shows the value, and the editor is one click away.
- **Conditionals:** there's no declarative predicate. You toggle it imperatively: `b.hidden = !x` inside `pane.on('change')`. [I]
- **State:** folder `expanded` is part of `exportState()`/`importState()`, so fold state is serialized with values. [V]
  (folder.ts lines 83–96)
- **Rule:** structure is explicit (folders, tabs) and the author toggles visibility by hand.

### lil-gui — source read: `src/Controller.js`, `src/GUI.js`
- **At rest:** everything, with folders open, unless the root sets `new GUI({ closeFolders: true })`, which closes every
  folder as it is added (`if (this.root._closeFolders) folder.close()`). [V] ([GUI.js](https://github.com/georgealways/lil-gui/blob/master/src/GUI.js))
- **Hooks:** imperative only, through `controller.show(bool)` / `.hide()` / `.disable()` and `folder.open(bool)` / `.close()`.
  `show(false)` just sets `display:none`. [V] ([Controller.js](https://github.com/georgealways/lil-gui/blob/master/src/Controller.js))
- **Rule:** no schema. You get one global switch, "close all folders", which is a useful affordance in its own right.

### dat.gui — source read: `src/dat/gui/GUI.js`
- **At rest:** the root is open, and **sub-folders default to closed**: `if (params.closed === undefined) params.closed = true;`
  in the nested-GUI branch. [V] ([GUI.js](https://github.com/dataarts/dat.gui/blob/master/src/dat/gui/GUI.js))
- `hideable` (default on for auto-placed GUIs) lets you hide the whole panel with **H**, through `GUI.toggleHide()`. [V]
- **Note:** dat.gui (closed folders) and lil-gui, its successor (open folders), chose opposite defaults. lil-gui added
  `closeFolders` to win back the old behaviour, and that tells you "closed by default" was a real use case.

### Theatre.js — source read: `studio/src/panels/DetailPanel/DeterminePropEditorForDetail/*`, `core/src/propTypes/index.ts`
- **At rest:** the Details panel shows only the **selected object's** props. Compound props show as nested,
  collapsible groups. **Vector compounds** (≤3 number props named x/y/z) start **collapsed into a single inline
  row**, and other compounds start expanded:
  ```ts
  const isVectorProp = (c) => Object.entries(c.props).length <= 3 &&
    Object.entries(c.props).every(([n, conf]) => conf.type === 'number' && ['x','y','z'].includes(n))
  collapsedMap.set(pointerToProp, new Atom(isVector))   // default collapsed iff vector
  ```
  [V] ([DetailCompoundPropEditor.tsx](https://github.com/theatre-js/theatre/blob/main/packages/studio/src/panels/DetailPanel/DeterminePropEditorForDetail/DetailCompoundPropEditor.tsx))
  Collapse state is a `WeakMap<Pointer, Atom>`. It's ephemeral and isn't persisted. [V]
- **Prop types have no visibility, disabled or tier options.** Theatre has only `label`, `range`, `nudgeMultiplier`,
  `interpolate`, and `as: 'menu' | 'switch'`. [V] ([propTypes/index.ts](https://github.com/theatre-js/theatre/blob/main/packages/core/src/propTypes/index.ts))
- **The timeline is opt-in per prop.** A prop enters the Sequence Editor only after you right-click it and choose
  "Sequence" (or "Sequence all" on a compound). "Make static" removes it again. [V] ([Theatre docs: sequences](https://www.theatrejs.com/docs/latest/manual/sequences))
- **Rule:** disclosure comes from *selection* and *what the user has touched*, never from author flags. That's very
  relevant to Rueca's timeline: show tracks only for params that have keys.

### DialKit (Josh Puckett) — README + `docs/reference.md`
- **At rest:** the panel collapses to an icon, and clicking opens a 280px popover. Folders are open. [V] ([README](https://github.com/joshpuckett/dialkit))
- **Schema hook:** a single one. `_collapsed: true` inside a folder object starts it closed, "UI metadata... omitted
  from resolved values". Panel-level `defaultCollapsed` and root `defaultOpen` exist too. [V]
  ```ts
  useDialKit('card', { radius: [12, 0, 40], shadow: { _collapsed: true, blur: [12, 0, 40] } })
  ```
- No conditionals, no hidden, no tiers. [V, by absence in reference.md]
- **Rule:** keep the schema tiny and rely on per-key **shortcuts** (`shortcuts: { radius: { key: 'r' } }`, then hold R
  and scroll). Power users get at a parameter without it ever being on screen, which is another form of disclosure.

### Toolcraft (pixel-point) — `examples/ascii/docs/toolcraft/schema-reference.md`, `core/layout.md`
The most prescriptive of the lot, because it's written as an agent contract. [V] ([repo](https://github.com/pixel-point/toolcraft))
- `visibleWhen` takes declarative conditions: `equals`, `notEquals`, `oneOf`, `notOneOf`, `greaterThan`, `≥`, `lessThan`, `≤`.
  "Hidden values are preserved."
- "Use `visibleWhen` for inactive product branches so the panel shows only usable controls." "Do not use
  `disabled: true` or `disabledWhen` for generated product controls." "A section with no visible controls is
  hidden automatically."
- Sections: "Two to seven product controls is the normal size. Split sections that grow past seven." Titles name the
  edited thing (`Background`, `Motion`), never `Controls` / `Settings` / `Colors`.
- Every titled section gets a collapsible 36px header with a **per-section reset**. "Collapsed/expanded state persists
  as per-app runtime UI preference" and is **not** undo state, export state or Reset state.
- `description` shows a help icon "only when `description` adds meaning beyond the label".
- Toggle-plus-parameter rows: "set the non-toggle parameter `label: false`." The mode selector stays in the section it gates.
- **Rule:** conditional visibility is the main tool and section size is capped. There's no "advanced" tier.

### Storybook Controls — source read: `code/core/src/csf/includeConditionalArg.ts`, `prepareStory.ts`, `ArgsTable.tsx`, `SectionRow.tsx`, `controls/Text.tsx`
- **Conditional args** [V] ([includeConditionalArg.ts](https://github.com/storybookjs/storybook/blob/next/code/core/src/csf/includeConditionalArg.ts)):
  ```ts
  argTypes: {
    advanced: { control: 'boolean' },
    margin:   { control: 'number', if: { arg: 'advanced' } },           // default op = { truthy: true }
    padding:  { if: { arg: 'advanced', truthy: false } },
    cornerRadius: { if: { global: 'theme', eq: 'light' } },
  }
  ```
  Exactly one of `arg` / `global`, and at most one of `truthy` / `exists` / `eq` / `neq`. Storybook's own docs example
  is literally "Only enabled if advanced is true". [V] ([docs](https://storybook.js.org/docs/essentials/controls))
- **Semantics worth copying:** in `prepareStory` a falsy condition **drops the arg from the args passed to the
  story**, so a hidden arg is not applied at all. [V] ([prepareStory.ts](https://github.com/storybookjs/storybook/blob/next/code/core/src/preview-api/modules/store/csf/prepareStory.ts))
  Compare Leva and Toolcraft, where hidden values are preserved *and still applied*. Neither answer is wrong, but a
  schema has to pick one and say so.
- `table: { disable: true }` removes the row entirely. `control: false` keeps the docs row with no control.
  `parameters.controls.include/exclude` takes arrays or a regex. `sort: 'none' | 'alpha' | 'requiredFirst'`. `expanded: true`
  shows descriptions and defaults. [V]
- `table.category` / `table.subcategory` group rows into collapsible `SectionRow`s (`initialExpanded = true`). A
  collapsed subsection shows "N items". [V] ([SectionRow.tsx](https://github.com/storybookjs/storybook/blob/next/code/addons/docs/src/blocks/components/ArgsTable/SectionRow.tsx))
- **Unset args show a button, not an editor.** When `value === undefined`, the Text/Object controls render a
  "Set string" / "Set object" button, and clicking it reveals the field with `autoFocus`. [V]
  ([Text.tsx](https://github.com/storybookjs/storybook/blob/next/code/addons/docs/src/blocks/controls/Text.tsx))
  This is a cheap row-level disclosure for optional params.

### React Cosmos
- Fixture inputs (`useFixtureInput('count', 0)`, `useFixtureSelect`) render as an expandable **value tree**
  (`ValueInputTree` → `TreeView` with persisted `TreeExpansion`). Objects nest and collapse like a JSON tree. [V]
  ([ValueInputTree.tsx](https://github.com/react-cosmos/react-cosmos/blob/main/packages/react-cosmos-ui/src/components/ValueInputTree/ValueInputTree.tsx))
- There are no hidden, conditional or tier hooks. Disclosure follows the data's shape. [I, by absence]

### Agentation (Benji Taylor) — source read: `package/src/components/page-toolbar-css/settings-panel/index.tsx`
- **At rest:** a single collapsed toolbar button. Expanded, it shows the action row. **Every** preference sits behind a
  settings popover. [V] ([repo](https://github.com/benjitaylor/agentation))
- The popover has **two pages**. "main" holds Output Detail (a *cycle button* that steps through 4 values in place, which is
  compact), React Components, Hide Until Restart, marker colour, Clear on copy/send and Block page interactions.
  An **"automations"** drill-in holds MCP and webhooks. The link to the drill-in, "Manage MCP & Webhooks ›",
  **shows a connection-status dot** when an endpoint is live. [V]
- **Rule:** day-to-day settings sit one click deep, integration plumbing sits two clicks deep, and the closed door shows
  status. It's the cleanest small-scale example of a third tier.

---

## 2. Dev tools

### Chrome DevTools
- **Styles vs Computed:** Styles shows the cascade (authored rules). Computed shows the resolved values, by default only
  for properties that are applied. "Check the **Show All** checkbox to see all properties", and **Group** puts results
  into collapsible categories. [V] ([CSS reference](https://developer.chrome.com/docs/devtools/css/reference))
  The rule: the default view is *what's set*, and *everything else* is one checkbox away. That maps straight onto a
  "show only modified" filter in an inspector.
- Inherited rules collapse into "Inherited from <el>" sections further down. [V] Non-inheritable properties in those
  sections are de-emphasised or omitted. [I]
- `:hov` and `.cls` are toolbar toggles that reveal a small inline drawer under the toolbar (force state, add class). [V, partial]
- **Panels vs drawer:** the main panels sit at the top. The Drawer "contains many hidden features", and ⋮ → "More
  tools" opens the rest as Drawer tabs. Users can move tabs between top and bottom, and the "custom tab order
  persists". [V] ([Customize DevTools](https://developer.chrome.com/docs/devtools/customize))
  The rule is ~7 primary panels at rest, about 30 more in a single "More tools" list, and user-movable placement.

### VS Code Settings UI — source read: `settingsLayout.ts`, `settingsEditor2.ts`, `configurationRegistry.ts`
- **"Commonly Used"** is a **hand-curated list of 13 settings** (`editor.fontSize`, `editor.formatOnSave`,
  `files.autoSave`, `editor.defaultFormatter`, `editor.fontFamily`, `editor.wordWrap`, `files.exclude`,
  `workbench.colorTheme`, `editor.tabSize`, ...) out of thousands. [V]
  ([settingsLayout.ts](https://github.com/microsoft/vscode/blob/main/src/vs/workbench/contrib/preferences/browser/settingsLayout.ts))
- **Schema hooks on a setting** [V] ([configurationRegistry.ts](https://github.com/microsoft/vscode/blob/main/src/vs/platform/configuration/common/configurationRegistry.ts)):
  `order?: number` ("Otherwise, the setting is placed at the end"), `tags?: string[]` (`experimental`, `preview`,
  `advanced`, ...), `keywords?` (search only), `included?: false` (excluded from the registry),
  `editPresentation`, `enumItemLabels`. The TOC entry also has `hide?: boolean` and `order`.
- **`tags: ['advanced']` hides a setting from the Settings editor by default.** It comes back when (a) the query has
  `@tag:advanced`, (b) the user searches the exact setting ID (`@id:` or the key in the query), (c) the user turns on
  `workbench.settings.alwaysShowAdvancedSettings`, or (d) another surface deep-links to it, in which case the editor
  rewrites the query to `@id:<key>` "so it becomes visible, even if it's an advanced setting that would be hidden".
  [V] ([settingsEditor2.ts](https://github.com/microsoft/vscode/blob/main/src/vs/workbench/contrib/preferences/browser/settingsEditor2.ts) `canShowAdvancedSettings`, `shouldShowSetting`)
  ```ts
  const filter = this.canShowAdvancedSettings() ? undefined : { exclude: { tags: [ADVANCED_SETTING_TAG] } };
  ```
  This is the clearest production example of a schema-level `advanced` flag. Such a setting still *works*, and it's
  still reachable by search, by ID, by deep link and by a global "show all" switch.
- **Filters:** `@modified` (`MODIFIED_SETTING_TAG`), `@tag:`, `@ext:`, `@feature:`, `@id:` and `@lang:`. The search
  box is the primary navigation, and the TOC comes second. [V] (same file)

### VS Code toolbars and menus
- Menu contributions take `group` and `when`. "The `navigation` group is special as it will always be sorted to the
  top/beginning of a menu." In the editor title bar, `navigation` (and `1_run`) render **inline**, and "The other groups
  are shown in the secondary area - under the `...` menu." `group@order` sorts within a group. [V]
  ([Contribution points](https://code.visualstudio.com/api/references/contribution-points))
  ```json
  "menus": { "editor/title": [
    { "command": "x.preview", "group": "navigation@1", "when": "resourceLangId == markdown" },
    { "command": "x.export",  "group": "2_export@1" } ] }   // lands in "..."
  ```
  This is a **declarative priority tier on every action** (`navigation` = inline, anything else = overflow) plus a
  `when` predicate.
- Since 1.72, users can right-click a toolbar action and hide it. "Hidden actions move to the ... More Actions menu",
  and "Reset Menu" / "Reset All Menus" restore them. [V] ([v1.72 notes](https://code.visualstudio.com/updates/v1_72))
  The author sets the default tier and the user can demote further. Nothing is ever lost, because overflow is the floor.

### Zed — source read: `crates/zed/src/zed/quick_action_bar.rs`, `assets/settings/default.json`
- The editor toolbar ("quick action bar") shows a few icon buttons (Buffer Search, Inline Assist, Code Actions) and
  two popover menus:
  - **"Selection Controls"**, about 15 commands (select all, add cursor, go to symbol, next problem, move line...).
  - **"Editor Controls"**: one filter-icon button holding about 20 view toggles (Inlay Hints, Inline Values,
    Semantic Highlights, Code Lens, Minimap, Edit Predictions, Diagnostics, Line Numbers, **Selection Menu** (the
    toggle that hides the other menu), Git Blame, Vim Mode, Helix Mode...). [V]
    ([quick_action_bar.rs](https://github.com/zed-industries/zed/blob/main/crates/zed/src/zed/quick_action_bar.rs))
- `toolbar: { breadcrumbs, quick_actions, selections_menu, agent_review, code_actions: false }` lets users remove
  whole toolbar clusters. [V] ([default.json](https://github.com/zed-industries/zed/blob/main/assets/settings/default.json))
- **Rule:** view toggles all go into one popover, and the popover is the only always-visible entry. It's the editor
  equivalent of Linear's Display options.

---

## 3. Dense productivity and creative apps

### Linear — "Display options"
- One button at the top right (also Shift+V, or "Show display options" in the command menu). It holds Layout
  (list/board/timeline), Grouping, Ordering (with reverse), **Show sub-issues**, Show completed, **Show empty groups**,
  **Display properties** (which fields show on rows and cards), and Show triage issues. [V]
  ([Linear docs](https://linear.app/docs/display-options))
- Changes are personal and persist. "Set as default" writes the workspace default, and "Reset to default" reverts. [V]
- **Rule:** everything about *how you look at the content* hides behind one door. Filters (what you look at) get their
  own separate button. Content edits are never in there.

### Notion
- Page `•••` → **"Appearance & layout"** submenu: font (Default/Serif/Mono), small text, full width, table of contents,
  page discussions, inline comments, layout. [V] ([Notion help](https://www.notion.com/help/customize-and-style-your-content))
  Notice that page styling is **two levels deep**: a menu, then a submenu.
- Block `⋮⋮` handle → block menu (turn into, colour, ...). The slash menu is for *insertion*, which is search-first. [I]
- **Rule:** the canvas shows content only. Formatting lives on the object's handle, page-level styling lives in `•••`,
  and creation goes through search.

### Raycast — ActionPanel API
- "The first and second action become the primary and secondary action", with automatic shortcuts (↵ and ⌘↵). The
  rest sit in the ⌘K panel. `ActionPanel.Section` groups them, and `ActionPanel.Submenu` replaces the panel with its
  children. [V] ([Raycast API](https://developers.raycast.com/api-reference/user-interface/action-panel))
- **Rule:** **order is the tier.** Position 1 is the keystroke, position 2 is the modified keystroke, and everything
  else is searchable in one panel. It's the purest schema-level priority API in this survey.

### Arc and Things
- Arc hides the URL bar and toolbar chrome, and the address appears on ⌘L or in the command bar. Settings and view
  toggles live in the command bar, so it's search-first. [I]
- Things 3: a to-do opens to title + notes. Tags, checklist and deadline are small affordances that turn into inline
  fields once they're used. The detail view is "adaptive to their content". [I, partial] ([design study](https://blakecrosley.com/blog/design-study-things))
  **Rule:** an empty optional field shows as an icon, and a filled one shows inline. (Storybook's "Set string" button is
  the same idea.)

### Apple (HIG and first-party apps)
- Toolbars: "Choose items deliberately to avoid overcrowding." "Add a More menu to contain additional actions.
  Prioritize less important actions for inclusion in the More menu. Try to include all actions in the toolbar if
  possible, and only add this menu if you really need it." The system adds its *own* overflow menu when things
  don't fit, and you're told "Don't add an overflow menu manually". Customization is "especially useful in apps that
  provide a lot of items — or that include advanced functionality that not everyone needs". [V]
  ([HIG Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars))
- A More button "can also hinder discoverability... the ellipsis icon doesn't necessarily help them predict its
  contents". [V] ([HIG Pull-down buttons](https://developer.apple.com/design/human-interface-guidelines/pull-down-buttons))
- Disclosure triangles need a descriptive label "like 'Advanced Options'". "Use no more than one disclosure button
  in a single view." [V] ([HIG Disclosure controls](https://developer.apple.com/design/human-interface-guidelines/disclosure-controls))
- Finder ⌘J "Show View Options" and Mail's view menu are single view-settings doors. [I]

### Blender (included because its panel API is the closest analogue to a schema-driven inspector)
- `bl_options = {'DEFAULT_CLOSED'}`, `bl_parent_id` (sub-panel), `bl_order` ("Panels with lower numbers are default
  ordered before panels with higher numbers"), `poll(context)` ("If this method returns a non-null output, then the
  panel can be drawn"), `draw_header` (put the enable checkbox *in the header*, as in Motion Blur or Bloom) and
  `draw_header_preset` (a presets menu in the header). [V] ([bpy.types.Panel](https://docs.blender.org/api/current/bpy.types.Panel.html))
- **Rule:** a sub-panel is the "advanced" tier, and it's closed by default. An effect's on/off switch lives in its
  header, so a disabled effect's body can stay collapsed and still say whether it's on.

### Microsoft Office Ribbon
- **Contextual tabs** (Picture Tools, Table Tools) appear only while that object is selected. [I: well known, but I
  could not retrieve Harris's "The Long Road to Contextual Tabs" post; see the [UI Bible index](https://learn.microsoft.com/en-us/archive/blogs/jensenh/the-office-2007-ui-bible)]
- **Dialog box launcher:** a small ↘ in the corner of a group that opens the full dialog for that group (Font group →
  Format Font dialog). In galleries it's a labelled bottom item ("More Columns...", "Advanced"). Harris's reasoning:
  in 2003, Bold was on the toolbar but Strikethrough was only in Format → Font, so "your knowledge of the location of
  the Bold button doesn't help you find the related advanced functionality". The launcher fixes that because "If you
  know where the simple version is, you know where to look for the advanced version." The rule is to use it "only when
  the dialog box cleanly supersets a chunk", and otherwise to leave the feature as a normal labelled command, so
  people don't feel "they have to check every dialog box". [V]
  ([Dialog Launchers](https://learn.microsoft.com/en-us/archive/blogs/jensenh/dialog-launchers);
  RibbonX `<dialogBoxLauncher>`: [VSTO how-to](https://learn.microsoft.com/en-us/previous-versions/visualstudio/visual-studio-2017/vsto/how-to-add-a-dialog-box-launcher-to-a-ribbon-group?view=vs-2017))
- **Telemetry** (CEIP, opted-in Word 2003 users, every command by any route): the top 5 are Paste, Save, Copy, Undo
  and Bold, about 32% of use, with Paste above 11% (15% in Excel, 12% in PowerPoint). The difference between #100 and #400
  is about the same as between #1 and #11. The data stopped a mistake: the team assumed everyone used Ctrl+V or the
  context menu, but "the toolbar button for Paste still gets clicked more than any other button", so Paste became
  the first big button on the first tab. [V] ([No Distaste for Paste](https://learn.microsoft.com/en-us/archive/blogs/jensenh/no-distaste-for-paste-why-the-ui-part-7))
  *Lesson for Rueca:* expert intuition about what goes unused is unreliable in both directions. Measure it, even
  if only locally.
- **Ribbon scaling (Windows Ribbon Framework):** each group declares `IdealSizes` and an ordered list of `Scale` steps
  (`Large → Medium → Small → Popup`). As the window narrows, groups shrink in the declared order, and at `Popup` a whole
  group collapses into one button that opens it. `ApplicationModes` on a group gates it by mode. [V]
  ([ScalingPolicy](https://learn.microsoft.com/en-us/windows/win32/windowsribbon/windowsribbon-element-scalingpolicy))
  ```xml
  <ScalingPolicy.IdealSizes><Scale Group="GroupFont" Size="Large"/></ScalingPolicy.IdealSizes>
  <Scale Group="GroupClipboard" Size="Small"/><Scale Group="GroupClipboard" Size="Popup"/>
  ```
  This is a declarative collapse priority for chrome, and it fits Rueca's floating islands at narrow widths.

---

## 4. Schema-level APIs for priority and disclosure

### 4.1 Comparison

| Concern | Leva | Tweakpane | lil/dat.gui | Theatre | DialKit | Toolcraft | Storybook | VS Code | Blender | Raycast |
|---|---|---|---|---|---|---|---|---|---|---|
| Folder starts closed | `collapsed` | `expanded:false` | `.close()` / `closeFolders` / dat default closed | vector auto | `_collapsed` | user pref | `SectionRow` (open) | TOC tree | `DEFAULT_CLOSED` | — |
| Row hidden (static) | — | `hidden` | `.hide()` | — | — | — | `table.disable` / `include/exclude` | `included:false` | — | — |
| Row conditional | `render(get)` | imperative | imperative | — | — | `visibleWhen` (declarative ops) | `if:{arg,eq…}` | menu `when` | `poll(ctx)` | — |
| Hidden value applied? | yes [I] | yes | yes | n/a | n/a | preserved | **no, dropped** | yes | n/a | n/a |
| "Advanced" tier | — | — | — | — | — | — | (by convention via `if`) | `tags:['advanced']` | sub-panel | position ≥3 |
| Order | `order` (CSS-like) | `index` | insertion | insertion | insertion | `orderRole` | `sort` | `order` | `bl_order` | array order |
| Optional/opt-in value | `optional` | — | — | right-click Sequence | — | — | "Set …" button | — | header checkbox | — |
| Inline vs popup editor | — | `picker:'inline'\|'popup'`, `expanded` | — | vector collapse | — | — | — | `editPresentation` | — | `Submenu` |
| Search | title-bar filter | — | — | — | — | — | — | primary nav | F3 search | primary nav |

### 4.2 Which designs aged well

- **Aged well**
  - **Declarative conditions over imperative toggles.** Storybook `if` and Toolcraft `visibleWhen` are serializable,
    so docs, agents, URL state and tests can reason about them. Leva's `render(get)` is flexible but opaque (a function,
    with string paths). Tweakpane, lil-gui and dat.gui need you to wire `on('change')` by hand, and that drifts.
    *Rueca's `when: (v) => boolean` is typed (good), but as a function it isn't introspectable. If agents author
    schemas, a declarative form is worth adding as an alternative.*
  - **A tag-based advanced tier with escape hatches** (VS Code `tags:['advanced']`). It hides by default, but search,
    ID, deep link and a global "always show" switch all bring it back. Nothing is ever unreachable.
  - **Group-scoped "everything else"** (Office dialog launcher, Blender sub-panels, Agentation drill-in). The tail
    lives next to its head.
  - **Order as priority** (Raycast first/second action, VS Code `navigation` group, Blender `bl_order`, Leva `order`).
    It costs almost nothing and composes with everything else.
  - **Per-control inline/popup** (Tweakpane `picker`, Theatre vector collapse). It shrinks rows without hiding parameters.
  - **Fold state as a user preference, kept out of document state** (Toolcraft is explicit, and Rueca's localStorage
    already does this). Tweakpane puts fold state in `exportState`. That's handy for presets but mixes view with
    document. [I]
- **Aged badly**
  - **Adaptive/personalized hiding** (Office 2000 menus). Retired.
  - **Disabled-but-visible branches.** Toolcraft bans them, Storybook and Leva hide instead, and Apple and Office keep
    disabled states for *temporarily* unavailable commands (like Paste with an empty clipboard), not for *structurally
    irrelevant* ones. [I for Apple/Office nuance]
  - **A generic "Advanced" bucket** that mixes unrelated params. Toolcraft bans titles like `Settings`/`Options`. Harris
    worried about people having to "check every dialog box". Apple asks for descriptive labels. "Advanced" works only
    when it's *scoped to a group* ("Shape › more"), not as a global junk folder.
  - **Multiple disclosure buttons in one view** (Apple: "no more than one").
  - **Too-thin schemas** (DialKit, Theatre). They're fine for small panels, but once you pass ~20 params the user does
    the curating by collapsing folders, and that work is lost when state isn't persisted (Theatre's WeakMap).

---

## 5. Implications for Rueca: concrete proposals

These are ordered from cheapest to most opinionated. Each one cites the precedent it borrows from.

1. **Add a param-level tier: `tier: 'more'` (or `advanced: true`).** Rows with it render inside their own folder
   behind a single, quiet **"N more" row at the bottom of the folder**. That's the dialog-launcher rule: the tail sits
   next to its head, scoped to that folder, and there's at most one per folder.
   ```ts
   shape: folder('Shape', {
     count:  p.number(12, { min: 1, max: 64 }),
     radius: p.number(80, { min: 0, max: 400 }),
     jitter: p.number(0, { min: 0, max: 1, tier: 'more' }),
     seed:   p.seed(7, { tier: 'more' }),
   })
   // renders: Count, Radius, ─ "2 more" ─
   ```
   Escape hatches, copied from VS Code: a "more" row whose value is **not default** is always shown (so a modified
   hidden param is never invisible), search or filter matches reveal it, and there's one global "Show all" toggle in
   the inspector header.
   Prefer this to whole `folder('Advanced', …, {collapsed:true})` buckets. Keep the bucket only for genuinely separate
   entities.
2. **Collapsed folders and "N more" rows show a modified dot** (Agentation's status dot, VS Code `@modified`). It
   answers "did I change something in there?" without opening it. Pair it with a per-folder reset in the folder header
   (Toolcraft).
3. **Pick and document `when` semantics.** Today a hidden row keeps its value, like Leva and Toolcraft. Storybook
   instead *drops* hidden args. For a tuning tool, preserving and applying is right, because switching mode A → B → A
   should restore A's tuning. But export and share should probably *omit* values whose `when` is false, so a shared
   link doesn't carry dead parameters. [I: recommendation]
   Also lint against `disabled` used as a branch, following Toolcraft. Keep `disabled` for transiently unavailable rows.
4. **Optional or opt-in params.** Add `p.number(…, { optional: true })` (Leva `optional`, Blender header checkbox,
   Storybook "Set" button). At rest the row is just a toggle, and once enabled the slider appears. It fits effects like
   blur or grain whose off state is the common case.
5. **Per-row inline/popup editors.** Heavy editors (gradient, curve, spring, palette, vec2 pad) default to a compact
   summary row with a popover, as Tweakpane's `picker: 'popup'` does, with `expanded: true` to pin them open.
   Several of Rueca's defs already lean this way (`display: 'pad' | 'fields'`). Make it a uniform option.
6. **Folder size heuristic in the skill or linter:** 2–7 visible rows per folder (Toolcraft), with titles naming the
   edited thing. More than 7 means split the folder or tier the tail.
7. **Timeline shows only keyed params** (Theatre "Sequence"). If it doesn't already, the timeline should list tracks
   only for params that have keyframes, with "+ track" as the way in.
8. **Chrome: one "View" door per island.** Move view toggles (grid, rulers, safe area, background, density, theme,
   show layers, show timeline) into a single Display-options popover with a shortcut (Linear Shift+V, Zed "Editor
   Controls"). Keep only **content actions** and the 1–2 most-used actions (undo, play) inline. Let the author declare
   chrome-action priority VS Code-style (`group: 'navigation'` = inline, anything else = overflow), and at narrow
   widths collapse islands in a declared order (Ribbon `ScalingPolicy`).
9. **Measure locally before cutting.** Count per-param edits in the session (no network, since Rueca is open source and
   local). Show it to the developer, not the end user, maybe as a dev-only "unused params" readout or something the
   agent can read in `.rueca/notes/`. Use it to *author* `tier` (the Paste lesson) and never to auto-hide (the
   Personalized Menus lesson).
10. **Shortcuts as invisible tier-0** (DialKit: hold R and scroll; Raycast ↵ / ⌘↵). The most-tuned param or two in a
    tool could get a hold-key scrub, so they can live inside a collapsed folder and still be fast to reach.

---

## Sources (primary)
- Leva: https://github.com/pmndrs/leva (`types/public.ts`, `store.ts`, `components/Leva/LevaRoot.tsx`, `components/Folder/Folder.tsx`)
- Tweakpane: https://github.com/cocopon/tweakpane (`common/params.ts`, `blade/common/api/params.ts`, `blade/folder/*`)
- lil-gui: https://github.com/georgealways/lil-gui (`src/GUI.js`, `src/Controller.js`)
- dat.gui: https://github.com/dataarts/dat.gui (`src/dat/gui/GUI.js`)
- Theatre.js: https://github.com/theatre-js/theatre (`DetailCompoundPropEditor.tsx`, `collapsedMap.tsx`, `propTypes/index.ts`); https://www.theatrejs.com/docs/latest/manual/sequences
- DialKit: https://github.com/joshpuckett/dialkit (README, `docs/reference.md`)
- Toolcraft: https://github.com/pixel-point/toolcraft (`examples/ascii/docs/toolcraft/schema-reference.md`, `core/layout.md`)
- Storybook: https://github.com/storybookjs/storybook (`csf/includeConditionalArg.ts`, `preview-api/.../prepareStory.ts`, `ArgsTable/ArgsTable.tsx`, `SectionRow.tsx`, `controls/Text.tsx`); https://storybook.js.org/docs/essentials/controls
- React Cosmos: https://github.com/react-cosmos/react-cosmos (`ValueInputTree.tsx`)
- Agentation: https://github.com/benjitaylor/agentation (`settings-panel/index.tsx`)
- Chrome DevTools: https://developer.chrome.com/docs/devtools/css/reference ; https://developer.chrome.com/docs/devtools/customize
- VS Code: https://github.com/microsoft/vscode (`settingsLayout.ts`, `settingsEditor2.ts`, `configurationRegistry.ts`); https://code.visualstudio.com/api/references/contribution-points ; https://code.visualstudio.com/updates/v1_72
- Zed: https://github.com/zed-industries/zed (`crates/zed/src/zed/quick_action_bar.rs`, `assets/settings/default.json`)
- Linear: https://linear.app/docs/display-options
- Notion: https://www.notion.com/help/customize-and-style-your-content
- Raycast: https://developers.raycast.com/api-reference/user-interface/action-panel
- Apple HIG: https://developer.apple.com/design/human-interface-guidelines/toolbars ; .../pull-down-buttons ; .../disclosure-controls
- Blender: https://docs.blender.org/api/current/bpy.types.Panel.html
- Office: https://learn.microsoft.com/en-us/archive/blogs/jensenh/dialog-launchers ; https://learn.microsoft.com/en-us/archive/blogs/jensenh/no-distaste-for-paste-why-the-ui-part-7 ; https://learn.microsoft.com/en-us/archive/blogs/jensenh/combating-the-perception-of-bloat-why-the-ui-part-3 ; https://learn.microsoft.com/en-us/windows/win32/windowsribbon/windowsribbon-element-scalingpolicy
- Adaptive menus research: https://www.cs.ubc.ca/labs/edapt/papers/findlater2004.pdf ; https://www.computerworld.com/article/1707017/gui-gaffes.html
