# What to show, what to nest: HCI evidence and theory for Rueca's controls

Research for Rafael's question: "there are a lot of controls we're showing that barely get usage." This covers the theory and the evidence. Other agents are surveying specific tools.

Markers: **[V]** means I read it in the primary source, or in the publisher's own abstract or summary. **[V2]** means I verified it only through a reputable secondary source or a search-result abstract (for example NN/g summarising Carroll). **[I]** means my inference or synthesis, or something I could not confirm. Numbers are given as the studies report them.

---

## 0. Summary

1. **Progressive disclosure works when the split between primary and secondary is right, and it fails badly when it is wrong.** Nielsen's two conditions are: get the split right, and make the way to the secondary level obvious, with strong scent. More than two levels usually has low usability [V]. Hidden things get used less. NN/g's hidden-navigation study found that hiding navigation cut its use from 48–50% to 27% on desktop, and that tasks with it were at least 39% slower [V].
2. **Rueca should not auto-reorder by usage.** The evidence against system-driven reordering is consistent. Office 2000's adaptive menus were turned off by default in Office 2007 [V]. Findlater & McGrenere found a static split menu significantly faster than an adaptive one, and 55% of users preferred the user-controlled (adaptable) version [V]. Gajos et al. found that only adaptation that *copies items into a separate, stable area* beat the baseline. Adaptation that *moves* items did not [V]. The best design is **author-decided placement**, plus an optional **user "pin" that copies into a stable pinned strip**. Usage data should inform the *author's* next decision. It should not drive the UI at runtime.
3. **Frequency is not importance.** Two pieces of evidence show this. Paste was the most-clicked toolbar button in Word 2003 even though everyone "knew" people used Ctrl+V [V]. Spolsky's line was that 80% of users use 20% of features, "it's never the same 20%" [V2]. Rank controls on **frequency × impact on the picture**, then apply overrides for "critical but rare" controls and for dependency.
4. **The biggest risk in nesting is a hidden non-default value.** Every hiding mechanism needs a "changed" signal on whatever stays visible. Rueca's sections already do this with a dot, a reset button, and a persisted open state. Popovers need the same thing: the trigger should show a summary of the current value.
5. **Measure "kept non-default", not "touched".** Rueca already writes `changed` diffs (value vs default) into `.rueca/notes/*.json`, and share links encode only non-default values. Aggregating those gives a free, private, per-parameter signal. Section 5 has a lightweight local logger for the rest.

The rubric is at the end (section 7).

---

## 1. Progressive and staged disclosure

### 1.1 Canon

- **Nielsen, "Progressive Disclosure" (NN/g, 3 Dec 2006)** [V], https://www.nngroup.com/articles/progressive-disclosure/
  - The idea: show the few most important options first and defer advanced or rarely used ones to a secondary level. He says it improves three of usability's five components: learnability, efficiency and error rate.
  - **Two requirements.** (a) Split the features correctly: everything users need frequently goes on the initial display. (b) Make progression to the secondary level obvious, with a clear control and strong scent.
  - **What to use to decide the split:** task analysis and field studies for new designs, frequency-of-use data for existing ones. Analytics alone can't tell whether people *wanted* something or just landed on it.
  - **Being on the initial display tells people the feature matters.** That is an important side effect: what you show at rest teaches people what the tool is about.
  - **More than two levels "typically have low usability".** If you need three, simplify first. If you can't, group advanced features so users only have to check one place.
  - **Staged disclosure** (wizards) is linear, and most users *do* see every stage. It fits steps that interact little with each other. It breaks when users must keep going back and forth between interdependent steps, which is exactly what tuning a visual is. So staged disclosure is the wrong model for an inspector [I].
  - Several routes to the same secondary options are "rarely a good idea".
- **Carroll & Carrithers, "Training Wheels in a User Interface" (CACM 1984; Human Factors 1984)** [V2 via NN/g], https://www.nngroup.com/articles/training-wheels-user-interface/
  - A word processor with error-prone advanced functions disabled. Study 1: 26% faster on initial tasks and 69% more facts learned. Study 2: 21% faster and 21% more facts. On later *advanced* tasks, the training-wheels group was 52% faster. The control group spent almost a quarter of its time recovering from error states that training wheels blocked [V2].
  - Lesson for Rueca: a smaller first surface helps people learn the core model, and later work on the full surface gets better too. That is evidence *for* a lean default inspector.
- **Shneiderman, "Promoting Universal Usability with Multi-Layer Interface Design" (CUU 2003)** [V], https://www.cs.umd.edu/~ben/ACM-CUU2003.pdf
  - Users start at layer 1 and can stay there or move up "when needed or when they have time". Examples: a word processor with 8 layers and a map with 3. Critics raise confusion about moving between layers.
- **Findlater & McGrenere, "Evaluating Reduced-Functionality Interfaces According to Feature Findability and Awareness" (INTERACT 2007)** [V2, abstract], https://link.springer.com/chapter/10.1007/978-3-540-74796-3_59
  - A minimal layered interface made features *easier to find*. Users who started on the *full* interface were *more aware* of advanced features. This is the main tradeoff in disclosure: **findability goes up and awareness goes down.** Hiding a control raises its later "I didn't know you could do that" cost.
- **"Designing for the 80/20" and its myth.** Spolsky, "Strategy Letter IV: Bloatware and the 80/20 Myth" (2001) [V2], https://www.joelonsoftware.com/2001/03/23/strategy-letter-iv-bloatware-and-the-8020-myth/. The 80% of users who use 20% of features each use a *different* 20%. Jensen Harris says the same with Office data (section 2.4): beyond the top ~10 commands, usage is long and flat.
  - For Rueca: the *core* few per prototype are usually shared, and the tail is not. That argues for showing the shared head and keeping the tail findable through a section, a "more" control or the palette. It argues against deleting the tail outright [I].

### 1.2 When disclosure hurts, with numbers

- **Out of sight, out of mind. NN/g, "Hamburger Menus and Hidden Navigation Hurt UX Metrics" (2016; 179 users, 6 sites)** [V], https://www.nngroup.com/articles/hamburger-menus/
  - Desktop navigation use: hidden **27%**, visible **48%**, combo **50%**. Mobile: hidden **57%**, combo **86%**.
  - Content discoverability dropped by more than 20% with hidden navigation. Perceived difficulty was 2.6 hidden vs 2.1 visible on a 7-point scale (21% harder). On desktop, hidden navigation was at least 39% slower; on mobile, 15% slower.
  - The desktop follow-up found that salience, placement and labelling strongly changed how often hidden navigation got used. Usage ranged from 17% (Slate) to over 43% [V]. https://www.nngroup.com/articles/find-navigation-desktop-not-hamburger/
- **Overflow ("kebab") menus.** NN/g: the icons are widely recognised, but hiding *key* actions in them hurts usability, so use them for secondary actions [V2, NN/g video summary], https://www.nngroup.com/videos/overflow-menu-icons/. NN/g's contextual-menu guidelines say they reduce clutter and interaction cost but have **low information scent** [V2]. PatternFly: don't use an overflow menu for two or fewer actions, and don't hide content that should be visible by default [V2], https://www.patternfly.org/components/overflow-menu/design-guidelines
- **Accordions.** NN/g: they reduce scrolling but *reduce content visibility and add interaction cost*. On desktop, use them only when users won't need content under *several* accordions. Avoid them when users need most of the content or when content has several levels [V2, NN/g video summaries], https://www.nngroup.com/videos/tabs-vs-accordions/ and https://www.nngroup.com/videos/avoid-accordions/. Ubuntu Vanilla: don't nest accordions in accordions, because it "hinders discoverability enormously" [V2].
- **Microsoft Windows UX guide, "Progressive Disclosure Controls"** [V], https://learn.microsoft.com/en-us/windows/win32/uxguide/ctrl-progressive-disclosure-controls
  - Named risks: **lack of discoverability** ("Users may assume that if they can't see something, it doesn't exist") and **lack of stability**, where controls that appear and disappear make the UI feel unstable.
  - Don't use disclosure if users are unlikely ever to *want* to hide the content.
  - **Persist the expanded or collapsed state**, per window and per user. Make the inverse operation obvious by keeping the control in a fixed place.
  - Remove (don't disable) disclosure controls that have nothing to reveal.
  - Ways to declutter *without* explicit disclosure: show contextual detail only in context, as selection-driven UI; give secondary UI lighter affordances that strengthen on hover; show follow-up controls only after their prerequisite is set.
- **Experts and extra clicks.** Hiding things costs experts on every use. The theory is that experts select by recalling location (log time, Hick-Hyman), while novices search visually (linear time). Cockburn, Gutwin & Greenberg, "A Predictive Model of Menu Performance" (CHI 2007) [V2, abstract], https://doi.org/10.1145/1240624.1240723. A fixed location lets users move from search to recall. Disclosure that changes positions, or needs an extra click every time, keeps experts paying the novice cost [I].

---

## 2. Frequency-based and adaptive interfaces

### 2.1 Split menus: frequency helps when it is stable

- **Sears & Shneiderman, "Split Menus: Effectively Using Selection Frequency to Organize Menus" (TOCHI 1994)** [V2, abstract], https://www.cs.umd.edu/~ben/papers/Sears1994Split.pdf
  - Up to ~4 high-frequency items placed in a top partition. In field studies, selection times fell by **17%–58%**. In a controlled study, split menus beat alphabetic menus and were preferred.
  - The split was set **once**, from measured frequencies, and was not continuously adapted. That stability is the reason it worked (see Gajos below).

### 2.2 Adaptive vs adaptable

- **Findlater & McGrenere, "A Comparison of Static, Adaptive, and Adaptable Menus" (CHI 2004; N=27)** [V, read the paper], https://www.cs.ubc.ca/labs/edapt/papers/findlater2004.pdf
  - The top 4 of a split menu were either fixed at optimal frequencies (static), user-chosen (adaptable), or system-adapted by recency and frequency (adaptive).
  - The **static split menu was significantly faster than adaptive.** Adaptable was faster than adaptive in 2 of 3 orders, and not significantly different from the optimal static menu. The optimal static split menu was **20% faster** than the non-customised MS Word layout.
  - Preference: **adaptable 55%, adaptive 30%, static 15%.** Ranked "most frustrating": adaptive 15, static 10, adaptable 1.
  - They cite McGrenere et al.'s field study: 65% preferred adaptable, 15% adaptive, 20% static. Their conclusion leans toward **mixed-initiative** design, where the system *suggests* changes to the top partition and the user decides.
- **Bunt, Conati & McGrenere, "Supporting Interface Customization using a Mixed-Initiative Approach" (IUI 2007, best paper)** [V2, abstract], https://www.cs.ubc.ca/~joanna/papers/IUI2007_Bunt.pdf
  - MICA *suggests* customisations without interrupting. It was preferred to purely adaptable customisation and improved performance. A follow-up found that showing the rationale increased trust and predictability for many users, but not all.
- **Mackay, "Triggers and Barriers to Customizing Software" (CHI 1991; 51 users, 4 months)** [V2, abstract], https://www.lri.fr/~mackay/pdffiles/CHI91.Triggers.pdf
  - Most people don't systematically customise. The main barriers are lack of time and the system seeming too hard to modify. The most common trigger is noticing their own repeated patterns. So "let users pin" works only if pinning is a single gesture at the moment of use [I].

### 2.3 Accuracy, predictability, stability: Gajos et al.

- **Gajos, Czerwinski, Tan & Weld, "Exploring the Design Space for Adaptive Graphical User Interfaces" (AVI 2006)** [V, read the paper], https://kgajos.seas.harvard.edu/papers/kgajos-avi06.pdf
  - Three adaptive toolbars were tested. The **Split Interface** *copies* predicted buttons into a separate adaptive toolbar and leaves the originals in place. **Moving** relocates them. **Visual Popout** highlights in place.
  - Only Split significantly improved performance (p=.003) and satisfaction. Popout was "strongly rejected". Moving, although it saved the most theoretical clicks, did not significantly help.
  - The authors attribute Split's low cost to **spatial stability**: it "did not alter the familiar parts of the interface", and adapted only "a clearly designated separate adaptive area".
  - **Frequency of adaptation** matters a lot. Split menus adapted once per session were strongly positive. Adapted up to once per interaction, the same design was *worse* than no adaptation.
  - The "theoretical benefit... was a poor predictor" of success. Perceived cost against benefit was the better predictor.
- **Gajos, Everitt, Tan, Czerwinski & Weld, "Predictability and Accuracy in Adaptive User Interfaces" (CHI 2008)** [V], https://kgajos.seas.harvard.edu/papers/kgajos-chi08-predictability.pdf
  - Accuracy 50% vs 70%, crossed with predictable vs opaque behaviour. Both raised satisfaction. Accuracy had the larger effect on performance and on how much people used the adaptive part.

### 2.4 Ephemeral adaptation: emphasis without moving things

- **Findlater, Moffatt, McGrenere & Dawson, "Ephemeral Adaptation: The Use of Gradual Onset to Improve Menu Selection Performance" (CHI 2009; 48 users)** [V, read the paper], https://www.cs.ubc.ca/labs/edapt/papers/findlater2009.pdf
  - Predicted items appear instantly. The others fade in over **500 ms**, and **nothing moves**.
  - At **79%** prediction accuracy it was faster than a static menu. At **50%** it was not significantly slower, so it degrades gracefully, unlike adaptive split menus. Colour highlighting of predictions did *not* beat static, even at high accuracy.
  - Relevance to Rueca: if you ever want usage to affect the UI, *emphasise in place* (for example, raise contrast on recently touched rows) rather than reordering [I].

### 2.5 Office: personalized menus and the Ribbon (Jensen Harris)

- **"Combating the Perception of Bloat (Why the UI, Part 3)"** (2006) [V], https://learn.microsoft.com/en-us/archive/blogs/jensenh/combating-the-perception-of-bloat-why-the-ui-part-3
  - Office 2000's Adaptive/Personalized Menus showed a short menu of popular items. A chevron, or a few seconds' wait, expanded it. Items were promoted and demoted with use.
  - Why they failed:
    1. No default short menu could be right, because people use a wide range of features.
    2. Scanning took **two passes**: short menu, then chevron, then the long menu reset your scan, so "scanning menus took twice as long".
    3. "Auto-customization, unless it does a perfect job, is usually worse than no customization at all." Users felt "randomness and unpredictability".
  - Rafted toolbars, which pushed adaptive overflow to the end, failed for the same reasons. "Most customers... turn both of these features off."
  - Harris's description of the mistake: hiding things "under the bed" instead of restructuring.
- **"The End of Personalized Menus"** (Jan 2006) [V]: off by default from Office 12 on. The Ribbon never had them. https://learn.microsoft.com/en-us/archive/blogs/jensenh/the-end-of-personalized-menus
- **"Inside Deep Thought (Part 6)"** [V]: before 2003, design was "mostly supported by guesswork". The opt-in CEIP/SQM telemetry gathered about **1.3 billion sessions** and over **352 million Word command-bar clicks in 90 days**. It recorded command frequency, sequences, keyboard vs mouse use, screen sizes and more. https://learn.microsoft.com/en-us/archive/blogs/jensenh/inside-deep-thought-why-the-ui-part-6
- **"No Distaste for Paste (Part 7)"** [V], https://learn.microsoft.com/en-us/archive/blogs/jensenh/no-distaste-for-paste-why-the-ui-part-7
  - The top 5 Word commands were Paste, Save, Copy, Undo and Bold, together about **32%** of use. Paste alone was over 11%, and 15% in Excel. Beyond the top ~10 the curve "flattens out considerably".
  - The team almost dropped clipboard buttons because experts use shortcuts. The data showed the Paste *button* was the most-clicked button anyway, so it became the first big button. Harris notes that beta users' expertise would have hidden this. That is a direct warning for Rueca, whose main user today is its expert author.

**Conclusion for Rueca (auto-reorder vs pin vs author)** [I, synthesised from 2.1–2.5]
1. **The author decides placement** in the schema at design time. This is the static, optimal split. It is stable and predictable, and the author knows which three knobs define the piece.
2. **No runtime reordering, promotion or hiding based on usage.** Office 2000, Findlater 2004 and Gajos 2006 all point against it, and inspectors depend on spatial memory.
3. **Optional user pinning** (adaptable, which users preferred): a one-gesture "Pin" on any row *copies* it into a stable "Pinned" strip at the top, or onto the stage chrome. The original stays where it was. This is Gajos's Split Interface and Sears' split menu, with the user as the oracle.
4. **Mixed initiative, offline:** the kit can *suggest* to the author or agent, for example "`grain` is kept non-default in 0 of 40 notes; consider moving it to a collapsed section". The author accepts or rejects. This is MICA's model applied at authoring time, not runtime.

---

## 3. Criteria for prioritising controls

### 3.1 Dimensions that matter (and the evidence)

| Dimension | Why | Source |
|---|---|---|
| **Frequency of use** | Primary criterion for the first-level split | Nielsen 2006 [V]; Sears & Shneiderman [V2]; Blender HIG: "the most important and most commonly used widgets should be exposed more accessibly" [V], https://developer.blender.org/docs/features/interface/human_interface_guidelines/layouts/ |
| **Importance / criticality ≠ frequency** | Rare-but-critical actions must stay findable in a predictable place | Paste anecdote [V]; Nielsen: analytics can't separate wanted from accidental [V] |
| **Impact on the output** ("changes the picture most") | In a tuning tool, the controls that change the character of the piece are what the inspector is for. Small-effect controls cost attention and give little back | [I]. This is the visual-tool version of "importance". Also matches Nielsen's point that the initial display signals what matters |
| **Rhythm: tune-continuously vs set-and-forget** | Continuous controls need zero-click access and stable position, because they are revisited in a loop. Set-once controls (canvas size, seed policy, export format) tolerate one extra click | [I], built on Cockburn et al.'s novice→expert location recall [V2] |
| **Dependency** | Children only matter when the parent is on. Showing them otherwise is noise. Put the enabling toggle in the header and reveal children only when it's on | Blender HIG: enabling property in the panel header because "every setting in the panel depends on" it [V]; Windows UX guide: "showing follow-up steps only after prerequisites are done" [V] |
| **Novice vs expert** | Reduced first surfaces speed learning, as training wheels showed, but reduce awareness of advanced features | Carroll [V2]; Findlater & McGrenere 2007 [V2] |
| **Risk if hidden while non-default** | Hidden state that changes output leads to "why does it look like that?" | Windows UX guide (users must be able to tell the current state) [V]; Lightroom users asking Adobe for markers on collapsed or disabled panels with edits [V2, forum], https://community.adobe.com/t5/lightroom-classic-ideas/p-visual-indicators-for-adjustment-tools/m-p/12258701 |

**Frequency × importance matrix.** This is the standard 2×2 used across UX practice [I; widely taught, no single canonical source verified]:
- high/high → always visible, prominent
- high frequency, low importance → visible but quiet
- low frequency, high importance → one predictable click away, labelled, never palette-only
- low/low → nested, palette, or remove

### 3.2 Platform guidance

- **Apple HIG, Disclosure controls** [V via HIG text mirror], https://developer.apple.com/design/human-interface-guidelines/disclosure-controls
  - Disclosure triangle: "Provide a descriptive label", for example "Advanced Options".
  - Disclosure button: place it "near the content that it shows and hides", and use "no more than one disclosure button in a single view".
  - Apple's general pattern: keep frequently used controls visible and put advanced ones behind disclosure.
  - Apple's checkbox and toggle guidance also has a **mixed state** for multi-selection [I, not re-verified this session].
- **Microsoft**: the Windows UX guide above [V] is Microsoft's most explicit progressive-disclosure guidance. It covers label pairs ("More/Fewer options", "Show/Hide details"), persisted state, removing empty disclosure controls, and contextual-only UI. I did not find a dedicated Fluent 2 progressive-disclosure page [I].
- **Material**: expansion panels show a **summary of their content in the collapsed header** [V2, Material 1 spec via mdui mirror], https://www.mdui.org/en/design/1/components/expansion-panels.html. That is the right pattern for hidden-state visibility. I did not verify an official Material 3 "progressive disclosure" page [I].

### 3.3 Hick's law and the "rule of 7"

- **Hick-Hyman** (RT = a + b·log₂ n) describes *choice reaction time among equally likely, known alternatives*.
  - In menus it applies to **experts who know where an item is**. Novices scanning an unfamiliar list search **linearly**, which is what Cockburn et al.'s model formalises [V2].
  - Wikipedia's own summary warns that the law doesn't apply to scanning randomly ordered items [V2], https://en.wikipedia.org/wiki/Hick%27s_law
  - Correct use: for a stable, learned inspector, adding rows costs experts only log time, and novices pay linear scanning. **Grouping and stable order** are the tools, not cutting to an arbitrary count [I].
- **Miller's 7±2** concerns short-term memory and absolute judgement. It is *not* about how many visible items people can handle. Visible items don't need to be held in memory [V2], https://uxmyths.com/post/931925744/myth-23-choices-should-always-be-limited-to-seven
- **Breadth vs depth:** studies generally favour broad, shallow structures over deep ones. Larson & Czerwinski (CHI 1998) found that added depth hurt web search, with a medium structure (16×32 / 32×16) beating 8×8×8 [V2], https://www.microsoft.com/en-us/research/publication/web-page-design-implications-memory-structure-scent-information-retrieval/
- **Implication:** don't impose "max 7 controls". Impose a **depth limit** (≤2 disclosure levels, per Nielsen), **grouping with distinct labels**, and **stable order**. Set the visible budget from screen geometry: the open inspector should fit without scrolling on a typical laptop viewport [I].

---

## 4. Mechanisms: costs and state visibility

Columns:
- **Discover**: likelihood that a first-time user finds the control.
- **Cost**: interaction cost for repeat use.
- **State**: whether a non-default value can be seen while the control is hidden.

Ratings are [I], synthesised from the sources above unless a source is cited.

| Mechanism | Discover | Cost (repeat) | State visible when hidden? | Best for | Evidence / notes |
|---|---|---|---|---|---|
| **Inline, always visible** | High | 0 clicks; position stable → recall | n/a (always visible) | High-impact, tune-continuously controls | Visible nav 48% vs hidden 27% [V] |
| **Collapsible section, default open** | High | 0 (1 to collapse) | Yes when open; needs header dot or summary when the user collapses it | Secondary groups the author expects to be used | Persist open state per user [V, Windows]; Rueca already persists to LS |
| **Collapsible section, default closed** | Medium; label scent matters | 1 click, then remembered | **Only if the header shows a changed dot or summary** | Set-and-forget groups, advanced groups | Accordion cost [V2]; Material header summary [V2]; Rueca already has a dot and reset |
| **"Show more" inside a section** | Medium | 1 click | Must auto-expand, or mark the toggle, if a hidden row is non-default | The tail of an otherwise-core group (e.g. 3 core easing params + 4 advanced) | Windows label pairs "More/Fewer options" [V]; Office's two-pass scan problem if more rows are *interleaved*, so append them at the end [V] |
| **Popover behind a summary control** (trigger shows the value: swatch, curve glyph, "3 stops") | High (the trigger is visible) | 1 click to edit; 0 to read | **Yes, by design:** the trigger *is* the summary | Compound values: curve, gradient, spring, palette, shadow, vec | Rueca's curve row already does this. Apple: put it near the content [V] |
| **Tabs** | Medium-high (labels visible) | 1 click per switch; hides siblings | Needs a badge on the tab | Independent sub-tasks (e.g. Design / Animate / Export) | Windows: tabs for related-but-independent info; collapsible lists often better [V]. Tabs suit few, long sections [V2] |
| **Modal dialog** | Medium | High: blocks the stage, so no live preview | Usually not | Rare, complex, independent sub-tasks (export settings) | Windows: put advanced or complex material in a separate window [V]. Wrong for anything tuned while watching |
| **Contextual / selection-driven panel** | High *when relevant*; invisible otherwise | 0 once the object is selected | Per-object; needs a layer badge | Per-layer, per-key or per-node properties | Windows: "showing contextual detail only in context" [V]. Office Ribbon contextual tabs [I] |
| **Hover reveal** | Low (no affordance at rest; none on touch) | 0–1 | No | Secondary row actions (reset, pin, keyframe) | Windows: lighter affordances that strengthen on hover are OK for *secondary* UI [V]. Never the only route [I] |
| **Right-click / context menu** | Low (low scent) | 1–2 | No | Expert shortcuts duplicating visible actions | NN/g: low information scent [V2] |
| **Overflow (⋯)** | Medium-low | 2 clicks | No | Secondary actions; never key actions; not for ≤2 items | NN/g, PatternFly [V2] |
| **Command palette (⌘K)** | Low until known, then universal | Typing; scales with feature count | No (it is a launcher) | Universal fallback: every control and action reachable by name; teaches the shortcut | Superhuman: "do any action — and also learn the shortcut for next time" [V2], https://blog.superhuman.com/how-to-build-a-remarkable-command-palette/. Vohra: "if you don't know a feature exists, how do you find it?" [V2] |
| **Modifier reveal (Alt shows hidden options)** | Very low | Low for those who know | No | Expert variants (Alt-click section = solo; Alt-drag = fine scrub) | Rueca already uses Alt-click to solo sections; Lightroom hides its panel switch behind Alt [V2]. Keep it to accelerators only |
| **Mixed summary (multi-selection)** | n/a | n/a | Shows "Mixed" instead of a misleading single value | Multi-layer editing | Apple mixed state [I] |
| **Remove** (bake into code) | n/a | n/a | n/a | Controls whose kept-non-default rate is ~0 and impact is low | Training wheels: less surface, better learning [V2] |

### 4.1 Hidden state

Every source that addresses state agrees on one point: when something is hidden, the visible container has to say "something in here is not default". Users must be able to "determine if the current state is expanded or collapsed" and how to restore it [V, Windows]. Users want markers on collapsed or disabled Lightroom panels that carry edits [V2]. Filter UIs that collapse active filters cause "why are results missing?" confusion, so the standard fix is persistent chips [V2]. VS Code marks modified settings with a blue bar and offers a "@modified" filter [V2], https://code.visualstudio.com/updates/v1_27

**Rules for Rueca** [I]:
1. **Collapsed section with a non-default child → dot on the header**, plus a hover-reveal reset. *Rueca already does this* (`Inspector.tsx`, `changed` → `bg-signal` dot and Reset section).
2. **Popover triggers always render a value summary**, never just an icon. Rueca's curve row already does this; extend it to gradient, spring, shadow and palette.
3. **"Show more" auto-opens, or carries a dot, if any hidden row is non-default.**
4. **Children hidden by `when` keep their values but should not light the parent's dot unless they affect the output.** Today `changed` is computed over all value keys in a folder, so a `when`-hidden child with a non-default value would light the header dot with nothing visible to explain it. Either exclude inactive children or show them dimmed [I, from reading `Inspector.tsx`].
5. **A global "N changed" readout** (like VS Code's @modified) that filters the inspector to non-default rows. It doubles as the diff view for presets and notes.
6. **Disabled vs hidden for dependents:** if seeing the child teaches the user that the parent unlocks it, show it *disabled* (Appian: "Fields not yet available should be disabled and not hidden" for sequential flows [V2]). If it's noise, hide it with `when`. Default to *hide* when the parent is an obvious on/off toggle in the header, and *disable* when the dependency is non-obvious, e.g. "only applies in dotted mode" [I].

---

## 5. Measuring usage

### 5.1 How large teams do it
- **Office SQM/CEIP** [V]: opt-in, anonymous, designer-defined data points such as command frequency, invocation route (menu, toolbar, key), command sequences and screen size. Teams used it alongside expert judgement, not instead of it.
- **Autodesk CommunityCommands** (Matejka et al., UIST 2009) mined command logs to *recommend* unfamiliar commands. Grossman et al.'s learnability survey (CHI 2009) treats **awareness** as a separate class of learnability problem [V2], https://research.autodesk.com/publications/a-survey-of-software-learnability-metrics-methodologies-and-guidelines/. Usage logs should therefore lead to *awareness* fixes as well as demotions [I].
- **OSS practice** [V2, project docs]: local log first, nothing leaves the machine without explicit opt-in, allowlisted fields only, and fail closed if consent is unclear. Opt-out telemetry has caused community backlash, for example in Airflow's proposal discussion.

### 5.2 Signals Rueca already has, at zero cost
- **`.rueca/notes/*.json`** snapshots include `changed: { key: { value, default, label, hint } }` [V, read a notes file in the repo].
- **Share links** encode only non-default values. The sample payload decodes to `{"$v":4,"rings":22,"voidR":140,"gap":13.5,"weight":2.7,"dash":"dotted"}` [I, inferred from one link].
- **Presets** are named value sets, so diff them against defaults.

Aggregating these across tools and sessions gives **kept-non-default rate** per param: the share of saved outcomes in which the param ended away from its default. This is the best single "does this control matter" signal. It separates *fiddled with* from *mattered* [I].

### 5.3 A lightweight local logger (dev-only, opt-in, no network)

Events, kept in a localStorage ring buffer and optionally flushed through the existing `notes-server` to `.rueca/usage/*.jsonl` (gitignored):

```
{ t, tool, schema, ev: 'change'|'commit'|'reset'|'open'|'close'|'popover'|'palette'|'pin', key|folder, nonDefault: bool, via: 'row'|'stage'|'palette'|'key'|'preset' }
```

Per-param metrics:
- **Reach**: share of sessions in which the param was touched at least once.
- **Depth**: commits per session. A high number means the param is tuned continuously.
- **Kept**: share of exported, shared or noted outcomes in which it ends non-default.
- **Route**: how it was reached (row, palette, keyboard, preset). If it is reached mostly through the palette, the user wanted it but couldn't see it, so consider promoting it.
- **Open rate** for collapsed sections, and for popovers.

Caveats [I, grounded in sources]:
- **Visibility confounds usage.** A collapsed control will show low reach partly *because* it's collapsed (NN/g 27% vs 48%). Before deleting, check reach while it is visible, or A/B its placement.
- **n=1 expert bias.** Rafael's sessions are the "beta users" Harris warns about. Weight data from people who aren't the author, such as share-link recipients and the Candil and mini-tool series testers.
- **Low use is not low importance.** Export, reset and share are rare but critical; exempt them.

---

## 6. Rueca's existing primitives and how they line up

[V, read `src/kit/core/schema.ts` and `src/kit/inspector/Inspector.tsx`]

- `folder.collapsed`: default-closed section, with LS-persisted per-user open state. Matches the Windows guidance.
- Section header `changed` dot and "Reset section": the hidden-state signal is already in place.
- Alt-click on a header solos that section, which is a modifier-reveal accelerator.
- Param `when` (hide) and `disabled` (dim): the dependency mechanism.
- Folder `when`: a contextual section.
- Curve row: a popover behind a summary trigger, which is the model for other compound types.
- `published` / `publish`: a second, smaller surface for the client view. This is in effect Shneiderman's layer 1 for viewers.
- The share/notes "changed" diff: the usage signal (section 5.2).

What's missing [I]:
- A per-param **tier** field (e.g. `tier: 'core' | 'more' | 'advanced'`, or `rank`) so authors can declare the split in the schema.
- An in-section "More" disclosure.
- Pinning.
- A command palette over all params.
- The "N changed" filter.
- A usage logger.

---

## 7. Proposed decision rubric

Apply it per control, per shell. It takes about a minute per control.

### Step 1: Score three numbers
- **F, Frequency/rhythm (0–3).**
  - 0 = set once per project or never.
  - 1 = occasionally (a few sessions in ten).
  - 2 = most sessions.
  - 3 = tuned continuously in the loop.
  - With data, use Reach and Depth from 5.3. Without data, use the author's judgement and say so.
- **I, Impact on the picture (0–2).**
  - 0 = subtle, or only visible on close inspection.
  - 1 = clearly visible change.
  - 2 = changes the character or identity of the piece (the "these three knobs ARE the sketch" controls).
- **K, Kept-non-default rate (0–2), once data exists.**
  - 0 = under 5% of saved outcomes.
  - 1 = 5–40%.
  - 2 = over 40%.
  - Without data, set K = I.

**Exposure score E = 2F + I + K** (range 0–10).

### Step 2: Place by score
| E | Placement |
|---|---|
| **8–10** | **Top-level, always visible**, near the top of the first section. Candidate for on-stage direct manipulation |
| **5–7** | **Visible in a default-open section.** Collapsible, but the author opens it |
| **3–4** | **Default-collapsed section** *or* **"More" inside its section**, appended after the core rows. Header or toggle must show a changed dot |
| **1–2** | **Behind a popover or "more"** (if it belongs to a visible compound control) *or* in an "Advanced" collapsed section. Always reachable from the palette |
| **0** | **Palette-only**, or **remove**: bake the value into code. Remove when K has been 0 across 20 or more saved outcomes from people other than the author *and* the control was visible during that period |

### Step 3: Apply the overrides (these beat the score)
1. **Critical but rare** (export, share, reset-all, canvas size, seed lock): never palette-only. Give it a fixed, labelled place in the toolbar or a menu.
2. **Dependency**: a child of a toggle goes *under* its parent and appears only when the parent is on (`when`). It doesn't count against the visible budget. Score it within its parent's context. If the dependency is non-obvious, use `disabled` with a hint instead of hiding it.
3. **Compound value** (curve, gradient, spring, shadow, palette, vec): always a **summary trigger + popover**, whatever its score. The trigger must show the current value.
4. **Hidden-state guard**: if hiding a control that can be non-default would leave its effect on the picture unexplained (I ≥ 1), its container must show a changed dot or summary. If the container can't show that, promote it one tier.
5. **Depth cap**: at most two disclosure levels from the inspector's resting state (section → popover). Never put a popover inside a "More" inside a collapsed section.
6. **Stability**: placement is set by the author in the schema. **No runtime reordering by usage.** Users may **pin** (copy) any row into a fixed Pinned strip. Usage data only produces *suggestions* to the author or agent ("consider demoting `grain`").
7. **Budget check**: the resting inspector, with default-open sections only, should fit a 13-inch laptop viewport without scrolling. If it doesn't, demote the lowest-E rows in the default-open sections first. No magic number 7.
8. **Novice surface**: the `published` / client view shows only E ≥ 8 rows plus anything the author marks `publish` (Shneiderman layer 1, training wheels).

### Worked example (Motion tool, illustrative scores) [I]
| Param | F | I | K | E | Placement |
|---|---|---|---|---|---|
| Rings | 3 | 2 | 2 | 10 | Top-level |
| Centre void | 2 | 2 | 2 | 8 | Top-level |
| Dash style | 2 | 2 | 1 | 7 | Default-open section |
| Gap / Weight | 2 | 1 | 2 | 7 | Default-open section |
| Easing curve | 1 | 1 | 1 | 4 | Summary + popover (compound override) in a default-collapsed "Motion" section |
| Seed | 0 | 1 | 0 | 1 | Advanced; also "Randomize" action on the toolbar |
| Debug overlays | 0 | 0 | 0 | 0 | Palette-only, dev-only |

---

### Sources (all cited inline above)
Nielsen 2006; NN/g training wheels; NN/g hidden navigation (3 articles); NN/g accordions/overflow/contextual menus (video summaries); Carroll & Carrithers 1984; Shneiderman 2003; Findlater & McGrenere 2004, 2007; Findlater et al. 2009; Gajos et al. 2006, 2008; Sears & Shneiderman 1994; Bunt et al. 2007; Mackay 1991; Cockburn et al. 2007; Larson & Czerwinski 1998; Jensen Harris posts (Parts 3, 6, 7; End of Personalized Menus); Spolsky 2001; Windows UX Guide (Progressive Disclosure Controls); Apple HIG (Disclosure controls); Blender HIG (Layouts); Material expansion panels (via mdui mirror); VS Code 1.27 release notes; Superhuman command palette post; Grossman et al. 2009; PatternFly overflow menu; Adobe community feature requests.
