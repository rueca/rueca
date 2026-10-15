# What faces the user, what gets nested: audio, photo and video pro tools

Research for Rueca, 15 Oct 2026. Question: how do pro tools decide which controls are visible at rest and which are nested, and what rules can Rueca adopt? Rafael's observation is that "a lot of controls we're showing barely get usage".

Evidence marks: **[V]** = verified against the linked source in this session; **[I]** = inferred, from product knowledge or reasoning, not checked against a source this session. Where a source is a forum or retailer and not the vendor, I say so.

---

## 0. The short answer

Every tool studied makes the same move. It sets a **face** (a small set that is always visible, usually 4 to 12 controls) and pushes everything else one step away. They differ in **who picks the face** and **what the step looks like**.

Who picks the face:

1. **The hardware count picks.** OP-1 gives each synth engine 4 parameters on 4 coloured encoders. Elektron gives each parameter page 8 knobs, with page 2 one more press away. NKS, Push and Bitwig use 8 per page, and the Resolve Micro panel has 12 primary knobs.
2. **The author picks, per preset.** Ableton Rack macros, Bitwig preset pages, the NKS Performance view, Analog Lab's 4 macros and Zebra 3's A–D controls all work this way.
3. **The vendor picks, per device, using impact plus workflow order.** Examples are Lightroom's Basic panel, Apple Photos' Light/Color/B&W, the Pro-C main panel and Valhalla.
4. **The user picks.** Examples are Lightroom's Customize Develop Panels, Capture One custom tool tabs, the Photos Add menu with "Save As Default", and Bitwig's Add New Page.
5. **The selection picks (contextual).** Examples are the Pro-Q band panel, the Photoshop and Premiere Properties panels, the Resolve Inspector and CapCut's Details panel.

What the step looks like:

- disclosure (collapsed section, ▸ Options, triangle)
- pages (press the page key again, bank arrows)
- modifier layer (FUNC/Shift + same knob, Option for extended range)
- drawer or overlay (Arturia Advanced, Soundtoys Tweak, Pro-C Side Chain, M4L overlay view)
- tab or mode switch (Serum/Vital tabs, Ozone Assistant vs Detail, NKS Performance vs Edit, Resolve Cut vs Edit page)
- direct manipulation (Pro-Q: the graph is the control, and knobs only appear for the selected band)

**The single strongest pattern for Rueca is the master control that drives its components** (Apple Photos Light/Color/B&W, Ozone Assistant macros, Rack macros, Analog Lab macros). One slider sits on the face. It visibly moves a set of sub-sliders, and those sub-sliders sit behind a disclosure. The sub-sliders stay editable as offsets. Section 4.5 documents it in detail.

**The second strongest is "hidden but not forgotten."** When a nested control is off default, its parent shows that. FabFilter Pro-C's Side Chain button glows yellow when hidden advanced settings are in effect. Diva draws a modification indicator next to any control being modulated from another tab. Zebra 3's pips change shape when used. Lightroom has a per-panel eye toggle, and iOS Photos draws arcs on tool icons. Nesting only stays safe when this exists. Without it, a nested control silently changes the output.

---

## 1. Audio plugins

### 1.1 FabFilter Pro-Q 4: the display is the control

- **Default face:** The interactive EQ display fills the plug-in window [V](https://www.fabfilter.com/help/pro-q/using/overview). It has no rows of knobs at rest. You create bands by click-dragging the curve or double-clicking the background, and hovering previews the curve a click would create [V](https://www.fabfilter.com/help/pro-q/using/eqdisplay).
- **Nesting mechanism: selection-contextual floating panel.** The band controls appear only when bands are selected. They float under the selected bands, and they disappear when you click the background to deselect [V](https://www.fabfilter.com/help/pro-q/using/bandcontrols).
- **Nesting inside the nested panel:**
  - Slope is a button that opens a menu.
  - Setting the dynamic range ring to non-zero *reveals more dynamic controls*. This is a progressive reveal triggered by use, not by a toggle.
  - Stereo placement opens a bigger panel on surround channels [V](https://www.fabfilter.com/help/pro-q/using/bandcontrols).
- **Power-user layer:** Modifier gestures on the display duplicate the panel. Wheel changes Q, Alt-wheel changes dynamic range, Cmd-wheel changes gain, Alt-click bypasses, and Ctrl+Alt-click changes shape [V](https://www.fabfilter.com/help/pro-q/using/eqdisplay).
- **Secondary globals:** Processing mode, analyzer settings, character, output and similar settings sit in a bottom bar [V](https://www.fabfilter.com/help/pro-q/using/overview).
- **Implicit rule:** The thing being edited is the interface. Parameters appear only for what you are touching. Globals go to a thin bar at the edge.
- **Finding hidden stuff:** Hover previews, plus the panel appearing on selection.

### 1.2 FabFilter Pro-C 2: a "Side Chain" expert drawer with a glow

- **Default face:** The core compressor controls (threshold, ratio, knee, attack, release and so on) plus the level/knee display [I].
- **Nesting mechanism:** A Side Chain button shows or hides the advanced side-chain controls: in/ext input, stereo link, mid/side and side-chain EQ [V](https://fabfilter.com/help/pro-c/using/sidechainsection).
- **Key detail:** When a hidden advanced feature has a non-default setting that affects the sound, the button gets a yellow glow and yellow text, and a trigger-input icon appears beside it. This tells you that advanced features are in effect while the panel is closed [V](https://fabfilter.com/help/pro-c/using/sidechainsection).
  - A FabFilter forum reply claims that disabling the expert section disables its features. The official help page does not say this, so treat it as unconfirmed [V-forum](https://prod.fabfilter.com/forum/add-comment?id=835).
- **Rule:** Expert features are things most users never need on most tracks: routing, stereo-linking and detection EQ. The core gain-reduction controls are the face.
- **Lesson:** A drawer is acceptable *only* if the drawer handle reports modified state.

### 1.3 Valhalla (VintageVerb and family): few knobs plus a mode menu

- **Default face:** A short row of macro-level parameters (mix, predelay, decay, size, attack, early diffusion, late diffusion, mod rate/depth, and high/low EQ) [I]. Above them sits a **Mode** menu and a **Color** era switch [V](https://valhalladsp.com/2023/02/10/valhallavintageverb-the-modes/).
- **Rule:** Sean Costello calls Mode the highest-level control in Valhalla plug-ins because it switches between whole algorithms [V](https://valhalladsp.com/2023/02/10/valhallavintageverb-the-modes/). Color picks an era (1970s, 1980s, NOW), and switching it also changes the plug-in's colour scheme [V-review](https://www.musicianwave.com/valhalla-dsp-vintageverb-review/).
- **What happens to the complexity:** It is not nested in a drawer. It is **collapsed into a categorical choice.** Dozens of algorithm internals become one menu item. A reviewer praises it for not burying users in barely-used controls [V-review](https://www.musicianwave.com/valhalla-dsp-vintageverb-review/).
- **Lesson for Rueca:** When several parameters only make sense in combination, replace them with a named mode (segmented control) rather than exposing them as continuous controls.

### 1.4 Serum and Vital: tabs by domain, with a matrix for modulation

- **Serum:** It has 4 top-level views: OSC, FX, MATRIX and GLOBAL [V](https://www.edmprod.com/how-to-use-serum-tutorial/).
  - OSC holds most sound design: oscillators, filter, envelopes, LFOs and macros.
  - FX is a 10-slot rack.
  - MATRIX lists every modulation source→destination.
  - GLOBAL holds unison/voicing and quality settings [V](https://www.loopmasters.com/articles/4271-Serum-by-Xfer-Records-Quick-Start-Guide).
- **Vital:** Its 4 views are Voice, Effects, Matrix and Advanced. Oversampling lives in Advanced [V](https://www.edmprod.com/vital-synth/).
  - Every matrix routing has its own amount slider and a remap curve, and users can sort by source or destination [V](https://pluginoise.com/vital-synth-review/).
- **Rule:** **Signal-flow order and frequency of use.** The tab you open on is where 80% of the sound is made. Modulation is listed in a matrix rather than drawn as knobs, because routings are sparse and many-to-many. Quality and voicing settings are set-and-forget, so they go to the last tab.
- **Finding hidden stuff:** Always-visible tab labels. Modulation is also shown *in place* as coloured rings around modulated knobs [I].

### 1.5 Soundtoys (EchoBoy): Style plus a Tweak window

- **Default face:** The main window shows only the most important controls [V-review](https://www.soundonsound.com/reviews/sound-toys-echoboy).
- **Nesting:**
  - A **Tweak** button opens a floating window with mode-dependent controls such as width, balance and L/R offset.
  - **Style Edit** exposes what a Style preset bundles: EQ, dynamic filters, saturation, diffusion and wobble [V](https://www.soundonsound.com/reviews/sound-toys-echoboy), [V](https://barryrudolph.com/mix/soundtoysechoboy.html).
- **Rule:** A **Style** is a named macro-state over many internals, the same idea as Valhalla's modes. The Tweak window holds the parameters that depend on the mode.
- **Cost:** Reviewers note the floating window can cover main-panel controls.

### 1.6 Arturia: the "Advanced" panel, and Analog Lab's 4 standard macros

- **V Collection instruments:** Many show the hardware face only. An **Advanced** button in the top-right toolbar opens extra modulation and effects, and on some instruments a second synth section [V-secondary](https://www.bonedo.de/artikel/sounddesign-mit-arturia-v-collection). Arturia manuals list an "Open and Close Advanced section" toolbar entry [V-TOC](https://manualsnet.com/arturia/sem-v).
  - **Rule:** The *original hardware's panel* is the face, because it is what users already know. Everything that did not exist on the original goes in the Advanced panel [I].
  - **Exceptions:** MiniBrute V has no Advanced panel, only an Effects panel opened from the toolbar [V](https://support.arturia.com/hc/en-us/articles/14090877045660-MiniBrute-V-General-Questions).
- **Analog Lab (Play / Pro) and AstroLab:** These use a **fixed, standard macro vocabulary across every preset: Brightness, Timbre, Time, Movement.** Each one sweeps several parameters with one turn [V](https://www.arturia.com/partners/splice-analog-lab-play), [V](https://www.arturia.com/products/hardware-synths/astrolab/details). Sound designers set what each macro drives and its ranges [V-forum](https://forum.arturia.com/t/analog-lab-pro-macros-performance-macros-controlling-parts-macros/3756).
  - **Why it matters:** The *names* stay the same across thousands of presets, so the face is learnable once. Only the mapping changes.
- **Pigments:** Top tabs are Synth, FX and Seq. A modulation strip of tabs (keyboard, envelopes, LFOs, functions, random, combinators) sits below the engine. Four renameable macros sit bottom-right [V](https://splice.com/blog/arturia-pigments-feature-guide). A later version added a simplified Play mode with macros [V](https://cdm.link/new-in-arturia-pigments-4-soft-synth/).

### 1.7 u-he Diva and Zebra 3: a fixed upper panel, a tabbed lower panel, an Easy Editor and a Main Editor

- **Diva:**
  - The upper area holds the modular sections in the style of the hardware (OSC, HPF, VCF, ENV, LFO, EFX).
  - **Lower panels** are switched by tabs: MAIN (amp/pan, voice mode, clock and arp), MODIFICATIONS (the modulation routings that don't fit on the face) and TRIMMERS [V](https://u-he.com/downloads/manuals/plugins/diva/Diva-user-guide.pdf).
  - Trimmers hold per-voice detune, drift and variance ("slop") for cutoff, envelope times, pulse width and glide [V](https://u-he.com/downloads/manuals/plugins/diva/Diva-user-guide.pdf). In other words, subtle analog imperfection that most people set once or never.
  - **Duplication on purpose:** Voices and Stack appear in both Main and Trimmers so you don't have to switch panels while adjusting Stack Tune [V](https://u-he.com/downloads/manuals/plugins/diva/Diva-user-guide.pdf).
  - **Modification indicator:** A symbol appears next to any face control that is being modulated in the Modifications panel [V](https://u-he.com/downloads/manuals/plugins/diva/Diva-user-guide.pdf). Hidden routing is reported on the visible control.
  - **Parameter lock:** Right-click → Lock keeps a value when switching presets [V](https://u-he.com/downloads/manuals/plugins/diva/Diva-user-guide.pdf).
- **Zebra 3 (2026):**
  - Three views, Synthesis | Pitches | Presets, with *Set as Default View* [V](https://u-he.com/downloads/manuals/plugins/zebra3/Zebra3%20user%20guide.pdf).
  - Clicking a module reveals its **Easy Editor** in the lower panel. The **[Editor]** button opens the full Main Editor in its place [V](https://u-he.com/downloads/manuals/plugins/zebra3/Zebra3%20user%20guide.pdf). That is two depths of the same module.
  - Modulation assigner "pips" look like a 4-spoked wheel when unused and a wave when used [V](https://u-he.com/downloads/manuals/plugins/zebra3/Zebra3%20user%20guide.pdf). The used state is visible at rest.
  - **Controls A–D** are 4 performance macros that also serve as variation snapshots. u-he tells sound designers to leave them at default positions so presets behave consistently [V](https://u-he.com/downloads/manuals/plugins/zebra3/Zebra3%20user%20guide.pdf).

### 1.8 iZotope Ozone: Assistant View (macros) vs Detail View (modules)

- **Default after the assistant runs:** **Assistant View** shows macro controls for EQ, Maximizer, Imager, Clarity and Stabilizer, plus tonal-balance and dynamics meters [V](https://www.izotope.com/en/products/ozone/features/master-assistant-view).
  - iZotope tells users to treat these as macro controls. Tonal Balance moves several EQs behind the scenes, and Loudness affects more than the limiter [V](https://www.izotope.com/en/learn/how-to-use-master-assistant-in-ozone).
- **Nested:** **Detail View** gives every module and parameter [V-retailer](https://thomannmusic.com/izotope_ozone_11_adv_ug_ozone_11_std.htm).
- **Rule:** An assistant proposes a full parameter state. The face is the handful of *intent-level* amounts that scale it ("how much"), not the parameters that produced it.

---

## 2. DAWs, controllers and hardware: where "8 knobs have to pick" is enforced

### 2.1 Ableton Live: device view, fold, expanded views, Racks and Macros

- **Device chain:** The Device View sits at the bottom. A device can be **folded** to its title bar by double-click or the context menu [V](https://www.ableton.com/en/manual/working-with-instruments-and-effects/).
- **Expanded views:**
  - Some devices have an extra view above the Device View, toggled by an arrow next to the Activator. Roar's Gain Stage and Modulation Matrix are examples.
  - Some have in-device views, marked by a **triangle** in the title bar. Phaser-Flanger's LFO is an example [V](https://www.ableton.com/en/manual/working-with-instruments-and-effects/).
- **Plug-ins:** **Configure** mode lets the user choose which plug-in parameters appear on the Live device panel and then *Save as Default Configuration*. Only the chosen parameters are saved, not their values [V](https://www.ableton.com/en/manual/working-with-instruments-and-effects/). Configure is user-curated face selection for a third-party device.
- **Racks and Macros (author-mapped face):**
  - Up to 16 Macro Controls per Rack, with 8 shown by default and show/hide stored in the Set [V](https://www.ableton.com/en/manual/instrument-drum-and-effect-racks/).
  - One macro can address any number of parameters across the rack's devices, with min/max per mapping. Inverting is done by setting min above max.
  - A macro mapped to several parameters gets a generic name until renamed. Macros can be renamed, coloured and given info text [V](https://www.ableton.com/en/manual/instrument-drum-and-effect-racks/).
  - Ableton's framing: use macros to make an important parameter more accessible, or to hide a huge synth behind one custom interface. **Once mapping is done, the rest of the Rack can be hidden** [V](https://www.ableton.com/en/manual/instrument-drum-and-effect-racks/).
  - **Rand** randomizes mapped macros. Individual macros can be excluded, and macros on Volume in Instrument Rack presets are excluded by default [V](https://www.ableton.com/en/manual/instrument-drum-and-effect-racks/).
  - **Macro Variations** store and recall snapshots of macro state, with per-macro "Exclude from Variations" [V](https://www.ableton.com/en/manual/instrument-drum-and-effect-racks/).
- **Info View:** Hover text for every parameter, and custom info text is saved with presets [V](https://www.ableton.com/en/manual/working-with-instruments-and-effects/). It is the discovery layer for anything unlabeled or nested.

**Ableton's published device guidelines** (Max for Live Production Guidelines, Ableton's GitHub) [V](https://github.com/Ableton/maxdevtools/blob/main/m4l-production-guidelines/m4l-production-guidelines.md):

- The Device View has a **fixed height**, so keep devices as **narrow as their function allows**, and compare against similar native devices.
- Three sanctioned ways to reduce width:
  - **Fold-out view:** an arrow shows or hides a section such as I/O config.
  - **Tabbed view:** tabs reuse the same area for parameter categories.
  - **Overlay view:** a button toggles an overlay over the whole device, "useful for advanced parameters".
- If width changes dynamically, the initial width must match the initial state, so the device does not flash at a different size on load.
- Every parameter visible when the device first opens should be MIDI-mappable. Secondary parameters in pop-ups, fold-outs or tabs should also be considered.
- Use Hidden visibility for internally driven parameters so they don't flood undo.
- Info text appears in the Info View on hover.
- Push banks come from `live.banks`, and it may take work to make the Push order match the GUI order.

### 2.2 Push 2 / 3: banks of 8, macros as the face of a rack

- Device mode: the 8 encoders control the selected device. The lower display buttons pick parameter pages, and an arrow appears when a device has more than 8 pages [V](https://www.ableton.com/en/manual/using-push-2/).
- **When a Rack is selected, the 8 encoders control its Macros.** Opening the rack exposes the inner devices [V](https://www.ableton.com/en/manual/using-push-2/). The author's macros are the hardware face.
- Native Live devices have curated bank definitions (bank names plus parameter order) that live in files, not in a UI [V-forum](https://forum.ableton.com/viewtopic.php?p=1560648). The first bank is commonly called the **"best of" bank**, set by Ableton and not user-editable [V-forum](https://forum.ableton.com/viewtopic.php?p=1831030). Third-party tools exist only to edit it [V](https://github.com/wackazong/ubermap). No official Ableton page using the "best of" term was found.
- Plug-ins: the parameters chosen in Configure (up to 128) appear in banks of 8 *in the order they appear on the Live device*. The user reorders them and saves that as the default [V-forum quoting manual](https://forum.ableton.com/viewtopic.php?p=1831030).
- M4L: `live.banks` defines banks of up to 8 named slots. A slot can be deliberately empty ("-") [V](https://docs.cycling74.com/reference/live.banks).

### 2.3 Bitwig: Remote Controls pages

- Pages of **8 controls, always coloured in rainbow order** so hardware and screen line up. A control can be a knob, button or chooser according to the parameter type [V](https://bitwig.com/userguide/latest/midi_controllers).
- Three page types [V](https://bitwig.com/userguide/latest/midi_controllers):
  - **Preset pages**, tied to this instance or preset (author or user).
  - **Device pages**, which apply to every instance of that device across the install (user-wide defaults).
  - **Modulator pages**, auto-generated and not editable.
- **Add New Page defaults the name to "Perform"** [V](https://bitwig.com/userguide/latest/midi_controllers). The first page you make is framed as the performance face.
- Pages can be renamed, reordered, duplicated and tagged. An "Allow 9 Slots" option exists for 9-fader controllers [V](https://bitwig.com/userguide/latest/midi_controllers).
- Bitwig 5 added Remote pages at **track and project level**, so the most important parameters from anywhere in a project can be pulled into top-level controller pages [V](https://musictech.com/reviews/digital-audio-workstations/bitwig-studio-5-continues-to-innovate-with-a-new-tranche-of-creative-tools).

### 2.4 Native Instruments NKS: Performance view vs Edit view

- **Performance view** is the default when a preset loads. It collects the product's main parameters so you can make the most impactful tweaks without deep editing, and NI calls it ideal for playing live [V](https://docs.native-instruments.com/online-guides/kontrol-s-mk3-manual/en/controlling-instruments-and-effects).
  - Knobs 1–8 hold 8 parameters, page buttons step through pages, and section names show above parameter names [V](https://docs.native-instruments.com/online-guides/kontrol-s-mk3-manual/en/controlling-instruments-and-effects).
  - Legacy NKS products do not have it [V](https://www.native-instruments.com/ni-tech-manuals/kontrol-accessibility/en/using-komplete-kontrol).
- **Edit view** holds every NKS parameter, organized into named **groups** (distinct parts or features of the instrument), each with one or more pages. A parameter can appear in more than one group [V](https://docs.native-instruments.com/online-guides/kontrol-s-mk3-manual/en/controlling-instruments-and-effects).
  - Navigation has three levels: group buttons → page buttons → Shift+page to scroll one parameter at a time across group boundaries [V](https://docs.native-instruments.com/online-guides/kontrol-s-mk3-manual/en/controlling-instruments-and-effects).
- NKS 2 parameters can be toggles, lists or continuous, and the display and knobs adapt to the type [V](https://blog.native-instruments.com/what-is-nks/).
- Mappings are designed by each developer [V](https://midi.org/native-instruments-native-control-standard-nks).
- **The guidelines themselves:** NI's NKS SDK and partner guidelines are **not public**. The developer page only offers a Developer Kit on request through 3rd-party-developers@native-instruments.com [V](https://www.native-instruments.com/en/specials/komplete/this-is-nks/developers/). I could not retrieve the literal "first page = most important" rule.
- **Practitioner convention:** Developers order pages by importance, with filter and envelopes early and effects and arp later [V-forum](https://community.native-instruments.com/discussion/comment/233110). The "main panel" should fit within 8 pages [V-forum](https://www.kvraudio.com/forum/viewtopic.php?p=6972449).
- **Rule:** Two tiers. A curated, preset-aware **Performance** face, plus an exhaustive **Edit** tree grouped by instrument part. Duplicating a parameter across groups is allowed.

### 2.5 Elektron (Syntakt / Digitakt / Digitone): 8 knobs × pages × FUNC

Verified against the official Syntakt manual (OS 1.30) [V](https://elektron.se/wp-content/uploads/2024/10/Syntakt-User-Manual_ENG_OS1.30_241016.pdf):

- **Layout:** 8 DATA ENTRY knobs (A–H). Each track has PARAMETER pages TRIG, SYN, FLTR, AMP and LFO, each with its own key, and the key LEDs show whether a page is active.
- **Page 1 vs page 2 is the core-vs-rare split, made explicit:**
  - FLTR page 1 holds the full filter plus its envelope: ATK, DEC, SUS, REL, FREQ, RESO, TYPE and ENV depth. That is exactly 8.
  - FLTR page 2 ("press [FLTR] twice") holds envelope **delay**, envelope **reset** behaviour and the base/width filter.
  - The same split runs through TRIG, AMP and LFO, each with a page 2.
- **Shift reaches page 2 from page 1:** holding [FUNC] and turning knob A on FLTR page 1 edits DEL, the page-2 parameter, directly. One knob carries a primary and a shifted parameter.
- **FUNC elsewhere:**
  - Secondary functions are printed on the panel. A short French manual excerpt calls them "orange" [V](https://www.manualslib.fr/manual/11650/Elektron-Digitakt.html).
  - [FUNC] while editing makes values *jump* to musical steps. TUNE jumps by octave.
  - Holding [FUNC] plus a key for a second opens a sub-menu.
- **Ambient discoverability and reset:**
  - Holding a [PARAMETER] key shows all values on that page.
  - DATA ENTRY knob + [NO] resets that parameter to default.
  - [PARAMETER] + [PLAY] resets the whole page.
  - Press-and-turn gives coarse steps.
- Digitone II's SYN machines have up to 4 pages (4×8) [V-review](https://www.bonedo.de/?p=2799652). The Digitakt manual says pressing [SRC] twice reaches SRC page 2 [V-secondary](https://device.report/manual/7192299).
- **Implicit rule:** A page holds one functional block, and the 8 slots are the parameters you need to *play* that block. Page 2 holds set-and-forget behaviour (reset modes, delays, alternate filter topologies). The primary page wins any contest for a slot.

### 2.6 Teenage Engineering (OP-1 / OP-1 field)

- **Four colour-coded encoders.** On the original they are blue, green, white and orange. On the field they are blue, ochre, grey and orange [V](https://teenage.engineering/guides/op-1/original/layout), [V-secondary](https://www.gearnews.com/teenage-engineering-op-1-field-review/).
- "A green graphical element or text hints that the green encoder will change its value" [V](https://teenage.engineering/guides/op-1/original/layout). Colour is the only label, so screen graphics and knobs share one visual language.
- **Each synth engine exposes just four adjustable parameters** [V-review](https://www.musicradar.com/reviews/tech/teenage-engineering-op-1-504300). The engine designer has to collapse the engine's internals into 4 expressive axes. This is the purest example of "the hardware picks", and it is arguably why the OP-1 engines feel playable.
- Shift + encoder gives a secondary parameter (fine-tune, or per-track pan in the mixer) [V-secondary](https://splendoid.net/?p=9540), [V-manual-excerpt](https://r2.gear4music.com/media/83/831311/download_831311.pdf).
- Envelope, play, LFO and FX live on *their own screens*, each again with 4 colour encoders [I].
- **Rule:** **4 axes per screen, colour-bound.** The screen shows a *picture* of what the 4 knobs do, not a list of labels.

### 2.7 Braun / Rams (context only)

The hardware lineage Rafael likes optimises the same thing. Primary functions get physical, labelled, always-present controls. Secondary functions sit behind a cover, a mode, or on the back panel [I]. No research beyond this was done for the brief.

---

## 3. (Hardware addendum) Resolve control surfaces

Grading hardware shows the same "count picks" rule (video is covered in section 5).

- The DaVinci Resolve Micro and Mini panels give **12 dedicated knobs** to the Primaries: Y Lift/Gamma/Gain, Contrast, Pivot, Midtone Detail, Color Boost, Shadows, Highlights, Saturation, Hue and Lum Mix [V](https://www.blackmagicdesign.com/products/davinciresolve/panels).
- Mini and Advanced add **soft knobs** (8 on the Mini, 30 on the Advanced) and palette buttons for RAW, curves, qualifiers, windows and tracker. Arrow keys page between modes [V](https://www.blackmagicdesign.com/products/davinciresolve/panels).
- **Rule:** The 12 fixed knobs are the parameters colourists touch on every shot. Everything else becomes a soft-knob page.

---

## 4. Photo

### 4.1 Lightroom Classic: Develop module

- **Default face:** A right-side stack of collapsible panels.
  - **Basic** comes first: Treatment, Profile, White Balance, Tone (Exposure, Contrast, Highlights, Shadows, Whites, Blacks) and **Presence** (Texture, Clarity, Dehaze, Vibrance, Saturation) [I for exact current order; Presence group contents V](https://www.teachucomp.com/change-the-color-saturation-in-lightroom-classic-cc-instructions/).
  - Then Tone Curve, HSL/Color, Color Grading, Detail, Lens Corrections, Transform, Effects and Calibration [I].
- **Rule (implicit, partly stated):** **Workflow order from global to specific, top to bottom.**
  - Adobe's tone article says the Basic tone controls are image-adaptive, and adjusting them in random order is "an exercise in frustration". It prescribes a sequence [V-snippet](https://helpx.adobe.com/lightroom-classic/help/tone-control-adjustment.html).
  - Calibration sits at the very bottom [V-snippet](https://helpx.adobe.com/lightroom-classic/help/tone-control-adjustment.html), so set-once settings go last.
- **Nesting mechanisms** [V](https://jkost.com/blog/2024/07/an-overview-of-the-develop-module-in-lightroom-classic.html):
  - Collapsible panels. Cmd-click a header to expand or collapse all.
  - **Solo Mode:** opening one panel closes the others. Option-click the triangle to toggle it, and Shift-click to open a second panel while in Solo.
  - **Customize Develop Panels:** drag to reorder and checkboxes to hide panels. Default Order restores [V](https://lightroomkillertips.com/how-to-organize-lightrooms-develop-panel/).
  - **Group reset:** holding Option turns a group label such as "Tone" into "Reset Tone".
  - **Per-panel eye toggle** shows or hides that panel's changes.
  - Tab / Shift-Tab hide panel groups, and F5–F8 toggle each.
- **Finding hidden stuff:** Panel headers stay visible while collapsed. Window > Panels restores hidden panels [V](https://lightroomkillertips.com/making-the-most-of-lightroom-classics-interface/).

### 4.2 Lightroom (cloud / desktop / mobile): Edit panel

- **Default face:** Auto, B&W and Profile/presets at the top, then panels **Light, Color, Effects, Detail, Optics** (Geometry moved to Crop in newer versions) [V-secondary](https://pafa.org/sites/default/files/2024-08/PAFA%20How%20to%20Edit%20Your%20Photos.pdf), [V](https://www.lightroomqueen.com/lightroom-mobile-editing-global-sliders/).
- **Nesting:** Each panel shows its main sliders. Heavier tools hide behind a **button inside the panel**:
  - Light → Curve
  - Color → Color Mixer and Color Grading
  - Effects → Grain/Vignette options [V-mobile](https://www.lightroomqueen.com/lightroom-mobile-editing-global-sliders/)
  - The desktop button names are [I].
- **Rule:** The order is fixed and prescribed. Users have asked to reorder it [V-forum](https://community.adobe.com/feature-requests-681/p-change-order-of-edit-detail-icons-661292). A desktop tutorial recommends single-panel mode [V](https://lightroomkillertips.com/editing-with-lightroom-desktop-and-a-book-giveaway/).
- **Profiles** are presented as a starting point. **Adaptive** profiles adjust tone, colour and contrast to each raw file, and Adobe says they often beat the Auto button [V](https://helpx.adobe.com/lightroom/desktop/edit-photos/edit-photos.html).
- **Quick Actions (mobile and web):** The app analyses the photo and *suggests* actions: portrait actions for portraits, Sky (with Dehaze) only when sky is detected, and Retouch only when a person is detected. Each action is a preset plus one amount slider [V](https://www.adobe.com/learn/lightroom-cc/web/lightroom-mobile-quick-actions).
  - **Rule:** Content decides the face. Controls that cannot apply to this image are not shown.

### 4.3 Capture One: tool tabs, custom tabs, Speed Edit

- **Default:** Tool Tabs Library, Capture, Lens, Color, Exposure, Details, Adjustments, Metadata, Output and Batch. **Quick**, Black & White and Composition exist but are off by default [V](https://support.captureone.com/hc/en-us/articles/360002477497).
  - The **Quick** tab gathers the most-used tools from other tabs [I].
- **User-built tabs:** Right-click → Add Tool Tab → Custom, then Add Tool, repeated. Cmd-drag reorders tabs [V](https://support.captureone.com/hc/en-us/articles/360002477497). Workspaces save whole layouts [V](https://photofocus.com/software/arranging-tools-your-way-in-capture-one/).
- **Speed Edit:** Hold an assigned key, then scroll, drag anywhere in the viewer or use arrows to adjust that tool without touching its slider. Space resets while the key is held [V](https://support.captureone.com/hc/en-us/articles/360015629178).
  - **Rule:** A frequently used parameter does not have to be on the face if it has a key. The keyboard is a second face.
- **Rule overall:** The vendor ships a reasonable default grouping by task. Pros are expected to build their own face.

### 4.4 Photoshop: Properties panel, Quick Actions, Contextual Task Bar

- The **Properties** panel is contextual. Its contents depend on the selected layer type [V-secondary](https://www.bwillcreative.com/?p=74081).
  - For an image layer it includes a **Quick Actions** section (Remove Background, Select Subject), collapsible by its arrow [V-secondary](https://www.softwarehow.com/?p=35949).
- The **Contextual Task Bar** floats on canvas with the likely next steps for the current selection or state. Adobe's Remove Background page points to either Quick Actions or the Contextual Task Bar [V](https://www.adobe.com/products/photoshop/remove-background.html). The Elements version is documented with default items Select Subject, Remove Background and Quick Actions, and it can be hidden via the Window menu [V](https://helpx.adobe.com/photoshop-elements/using/contextual-task-bar.html).
- **Rule:** **Selection plus the likely next step.** Show the 2–3 actions that most commonly follow the current state, next to the object.

### 4.5 Apple Photos: the master slider with expansion (documented in detail)

This is the most important pattern in the brief.

**Structure (macOS Photos, Adjust tab)** [V](https://support.apple.com/guide/photos/pht806aea6a6/mac):

- Three always-present **master sliders**: **Light**, **Color**, **Black & White**. Each has:
  - an **Auto** button next to it ("Photos automatically correct[s] the item")
  - a blue **checkmark** that appears once the adjustment is changed; clicking it turns the adjustment off and on temporarily, a live A/B per section
  - an **Options** disclosure below the master that reveals the component sliders
- Components behind **Options**:
  - **Light:** Brilliance, Exposure, Highlights, Shadows, Brightness, Contrast, Black Point.
  - **Color:** Saturation, Vibrance, Cast.
  - **B&W:** Intensity, Neutrals, Tone, Grain.
- Further adjustments (Levels, Curves, Definition, Selective Color, Noise Reduction, Sharpen, Vignette, White Balance, Retouch, Red-eye and so on) are **not visible by default**. They come from an **Add** menu, and **Save As Default** makes the chosen set appear every time [V](https://www.macworld.com/article/226081/the-hidden-editing-power-of-photos-for-os-x.html).
  - Light/Color/B&W are presented as the most common adjustments; the rest are in Add [V](https://www.macworld.com/article/226081/the-hidden-editing-power-of-photos-for-os-x.html).
  - The exact current Add list is [I].

**How the master relates to its components:**

- The master is a "smart slider". Apple's early Photos help said Photos analyses the image and applies the correct mix of adjustments [V-snippet](https://help.apple.com/photos/mac/1.0/en.lproj/phtc9d389ecc.html).
- Moving Light **drives the component sliders automatically, and you can watch them move**, some up and some down, when Options is open [V](https://photojoseph.com/node/13824). The master is not a separate effect stacked on top. It is a **one-dimensional path through the N-dimensional component space**, chosen per image.
- In the original design, the Light master *was a filmstrip of image versions* with a grabber. The control itself previewed its outcomes [V](https://photojoseph.com/node/13824). The current UI is a plain slider [I].
- You can use the master alone or go straight to the components [V](https://photojoseph.com/node/13824).
- Interaction between a hand-tuned component and a later master move is not documented. In practice the master re-solves the components [I]. **Rueca must pick a rule** (see section 7).

**Range and reset details** [V](https://support.apple.com/guide/photos/pht806aea6a6/mac), [V](https://kirkville.com/apples-photos-app-has-a-hidden-feature-for-tweaking-adjustments-even-more/):

- Holding **Option** over a slider extends its range from ±1.00 to ±2.00. Safe range is the default and extreme range is behind a modifier, the same idea as Elektron's FUNC.
- Double-click a slider to reset that adjustment.

**iOS / iPadOS Photos (since iOS 13), the same idea on a phone** [V](https://www.macworld.com/article/233390/how-to-take-advantage-of-the-photo-editing-tools-in-ios-13-and-ipados-13.html):

- One tool at a time. A horizontal carousel of round icons runs Auto, Exposure, Brilliance, Highlights and so on, and an all-caps label names the selected tool.
- A single slider below the carousel has haptic detents and gives a dial feel at zero.
- **Arc indicators:** each tool's ring fills yellow for positive values and white for negative. The modified state of every tool is visible at rest without opening it.
- Tapping a tool icon toggles it between neutral and the previous value, a per-tool A/B.
- **Auto comes first** and is a "make better" button whose slider scales its overall effect. When Auto is on, the rings of the tools it drives show their values [I].

**The pattern, abstracted:**

| Element | Apple Photos | Rueca analogue |
|---|---|---|
| Master | Light (1 slider) | one `p.macro()` row on the face |
| Auto | per-section Auto button | "Auto" = an assistant/analysis that sets master and components |
| Components | Options ▸ 7 sliders | collapsed child rows under the master |
| Coupling | master drives components visibly | components animate while the master moves; edits become offsets |
| A/B | blue checkmark per section | section-level enable toggle that keeps values |
| Range | Option = ±2 | Alt/Option = extended range; default range is the "safe" range |
| More | Add menu + Save As Default | "+ Add control" picker; user-saved default face |

### 4.6 VSCO

- The entry point is **presets**. Tap a preset to apply it, and tap again for **one strength slider** [V](https://support.vsco.co/en/articles/12698476-using-and-managing-presets). VSCO's guidance is that presets are built for full strength, but a subtler look is often better [V](https://vsco.co/blog/vsco-cam-tutorial-adjusting-preset-strength).
- Most tools are **one slider each**. Exceptions add a few sub-options [V-secondary](https://cdn.iphonephotographyschool.com/vsco/). Film X presets have 2 extra controls inside their options [V](https://vsco.co/vsco-education/journal/creating-with-vsco-x-for-android).
- **Rule:** A preset plus an amount is the face, and tools are opt-in. A "For This Photo" recommendation narrows the choice further [V](https://www.vsco.co/learn/getting-started-vsco).

### 4.7 Darkroom and Halide (minimal editors)

- **Darkroom:** Early versions were deliberately sparse: crop/straighten, brightness, saturation, temperature, vignette and sharpness. **Curves** was the signature tool, split into five draggable tonal regions instead of free points, and sold as an add-on [V-review, 2015](https://photojoseph.com/node/14305). Current versions are richer [I].
  - **Rule:** Replace a dense control (a free curve) with a constrained one (5 region handles) that covers 90% of the use.
- **Halide:** I did not find a usable source on its editing UI this session, so nothing here is claimed.

---

## 5. Video

### 5.1 DaVinci Resolve

- **Pages as modes:** The Cut page is a streamlined fast-turnaround editor where every action has a visible result. The Edit page is the full, traditional editor [V](https://www.blackmagicdesign.com/products/davinciresolve/cut), [V](https://www.blackmagicdesign.com/products/davinciresolve/edit). The same timeline gets two depths of tool.
- **Inspector:** Context-driven by selection. Its tabs are Video, Audio, Effects, Transition, Image and File, and **tabs that don't apply to the selection are greyed** [V-secondary](https://davinciresolveclub.com/davinci-resolve-inspector/). Sections inside tabs collapse [I].
- **Color page:** Palettes sit along the bottom, and only one palette is shown at a time [I].
  - **Primaries** has modes **Wheels / Bars / Log**. They are three representations of the same tonal-balance idea for different jobs: Log wheels target a narrower slice of the tonal range [V](https://www.lynda.com/Premiere-Pro-tutorials/overview-adjusting-color-exposure-Resolve/520237/637548-4.html), [V-secondary](https://jayaretv.com/color/davinci-resolve-primaries-color-wheels-explained/).
  - The numeric controls (Temp, Tint, Contrast, Pivot, Mid Detail, Color Boost, Shadows, Highlights, Sat, Hue, Lum Mix) sit in rows around the wheels [V-secondary](https://jayaretv.com/color/davinci-resolve-primaries-color-wheels-explained/). Whether they page (1/2) on narrow layouts is unverified [I].
  - **The hardware panel defines the priority:** those numeric controls are exactly the Micro panel's 12 dedicated knobs (section 3).
- **Rule:** **Mode = representation.** The same domain (primaries) is offered as wheels, bars or log. Users switch representation rather than reveal more sliders.

### 5.2 Final Cut Pro

- **Inspector:** Contextual tabs (Video, Color, Audio, Info and others). Each section **header shows a Show/Hide control when you hover over it**. Community answers describe this, along with cases where it fails to appear [V-community](https://origin-discussions2-us-dr-prz.apple.com/thread/252242540). Automation tooling sees a Show/Hide toggle per section [V](https://commandpost.fcp.cafe/api-references/commandpost/cp.apple.finalcutpro.inspector.inspector/).
- Double-clicking the Inspector's top bar toggles half-height and full-height [V](https://support.apple.com/en-kg/guide/final-cut-pro/verbd553847/10.5.1/mac).
- **Color:** Corrections are *added as effects* (Color Board, Color Wheels, Curves, Hue/Sat Curves) and then edited in the Color inspector. Nothing appears until you add it [V](https://support.apple.com/guide/final-cut-pro/verd5e1fdffd/mac). Color Wheels shows Global, Shadows, Midtones and Highlights, with brightness and saturation sliders on the wheel edges [V](https://support.apple.com/guide/final-cut-pro/verd5e1fdffd/mac).
- **Rule:** Hover-revealed chrome keeps the inspector quiet. Corrections are **additive** (start empty, add what you need), not pre-populated.
- **Cost:** Hover-only affordances are undiscoverable, and they don't exist on touch.

### 5.3 Premiere Pro

- **Lumetri Color:** Collapsible sections in order **Basic Correction → Creative → Curves → Color Wheels & Match → HSL Secondary → Vignette** [V-secondary](https://helpwiki.evergreen.edu/wiki/index.php/Lumetri_Color_-_Premiere_Pro). The order follows the technical-fix → look → targeted → finishing workflow, like Lightroom. Double-click resets a slider [V-secondary](https://nofilmschool.com/2018/04/all-you-need-know-about-lumetri-color-premiere-pro).
- **Properties panel (25.0, Oct 2024):** One contextual panel. A video clip shows Transform, Crop and Audio, with a **More** menu for the rest. Graphics and captions controls *moved entirely into it*, replacing Essential Graphics' editing role. Multi-clip editing is supported [V](https://www.adobe.com/learn/premiere-pro/web/properties-panel-streamline-workflow), [V-community](https://community.adobe.com/t5/premiere-pro-discussions/new-properties-panel-in-premiere-pro-25-0/m-p/15255020/highlight/true).
  - Larry Jordan's review says it adds little capability but gives faster access to what you need when you need it [V](https://larryjordan.com/articles/the-new-properties-panel-in-adobe-premiere-pro-25-0/). The deep Effect Controls panel still exists [I].
- **Rule:** A contextual *summary* panel shows the 3–4 most common property groups for the selection and links out to the full panel.

### 5.4 CapCut and Descript (minimal editors)

- **CapCut desktop:** Selecting a clip opens a right-hand **Details** panel with tabs Basic (scale, position, rotation, blend), Animation, Speed, Adjustment and Audio. A keyframe diamond sits next to keyable properties [V-forum/secondary](https://www.capeditcut.com/community/capcut/problems-with-capcut-interface/), [V](https://www.capcut.com/resource/how-to-add-keyframes-in-capcut).
  - **Rule:** Tabs named by *intent* (Animate, Speed), not by subsystem.
- **Descript:** No usable source found this session. From memory, it shows a compact per-layer properties panel with collapsible groups [I, low confidence].

---

## 6. Published guidelines found (and gaps)

| Guideline | What it says that matters here | Status |
|---|---|---|
| **Ableton M4L Production Guidelines** | Fixed device height and minimal width. Fold-out, tab or overlay for advanced params. Initial width matches initial state. Visible-on-open params are MIDI-mappable. Info text on hover. Push order matches GUI order. | [V](https://github.com/Ableton/maxdevtools/blob/main/m4l-production-guidelines/m4l-production-guidelines.md) |
| **Ableton Live manual: Racks** | Macros make important parameters accessible and hide the rest. Rename, colour and info text. Variations. Randomize with exclusions. | [V](https://www.ableton.com/en/manual/instrument-drum-and-effect-racks/) |
| **NKS (Kontrol S MK3 manual)** | Performance view = default, main parameters, most impactful tweaks. Edit view = everything, in named groups → pages. | [V](https://docs.native-instruments.com/online-guides/kontrol-s-mk3-manual/en/controlling-instruments-and-effects) |
| **NKS SDK partner guidelines** | Not public. Request a Developer Kit from NI. | gap |
| **Bitwig user guide** | 8 per page, rainbow-coloured. Preset vs device vs modulator pages. First new page named "Perform". | [V](https://bitwig.com/userguide/latest/midi_controllers) |
| **Elektron manuals** | Page per functional block. Page 2 via second key press. FUNC+knob for page-2 params. Hold page key to see all values. Page reset. | [V](https://elektron.se/wp-content/uploads/2024/10/Syntakt-User-Manual_ENG_OS1.30_241016.pdf) |
| **Apple HIG: Photo editing** | Edits are non-destructive. Confirm before discarding edits. Extensions open modally. The HIG page itself didn't load this session; points come from search summaries and the archived App Extension guide, which also recommends letting users preview edits. | partial [V-snippet](https://developer.apple.com/library/content/documentation/General/Conceptual/ExtensibilityPG/Photos.html) |
| **Apple Photos user guide** | Master slider + Auto + Options + checkmark A/B + Option-extended range + double-click reset. | [V](https://support.apple.com/guide/photos/pht806aea6a6/mac) |
| **Adobe Lightroom tone article** | Basic tone controls are image-adaptive, so follow the prescribed order. | [V-snippet](https://helpx.adobe.com/lightroom-classic/help/tone-control-adjustment.html) |

---

## 7. Cross-tool patterns

### 7.1 The selection criteria, in priority order

These are the rules the tools actually use to decide what faces the user. They are distilled, and the order is my synthesis [I]:

1. **Impact per touch.** The control that moves the output most, perceptually, goes first: Light before Black Point, Exposure before Calibration, cutoff before envelope-reset. Lightroom, Photos, Elektron page 1, the Resolve Micro panel and NKS Performance all follow this.
2. **Frequency per session, not per lifetime.** Controls touched on every image, shot or patch are face. Set-once controls (quality, oversampling, voice count, calibration, envelope reset, I/O) go last or behind a gear. Examples: Vital Advanced, Diva Trimmers, Lightroom Calibration, Elektron page 2.
3. **Workflow order.** Within the face, order is global → specific and technical fix → look → detail. Examples: Lightroom, Lumetri, the Ozone chain, Elektron's TRIG→SYN→FLTR→AMP→LFO.
4. **Combinatorial parameters collapse to a mode.** If several parameters only make sense together, ship named modes. Examples: Valhalla Mode/Color, Soundtoys Style, Resolve Wheels/Bars/Log.
5. **Correlated parameters collapse to a master.** If several parameters usually move together in one perceptual direction, ship a master that drives them. Examples: Photos Light, Ozone Tonal Balance, Analog Lab Brightness, Rack macros.
6. **Context removes the inapplicable.** Hide (or grey) what cannot apply to the current selection or content. Examples: the Pro-Q band panel, Resolve greyed tabs, Lightroom Quick Actions Sky/Retouch, Photoshop Properties.
7. **A fixed count forces the trade.** 4 (OP-1), 8 (Elektron, Push, Bitwig, NKS) or 12 (Resolve Micro). A count turns "what's important" from an opinion into a forced ranking.
8. **Names stay stable across content.** Analog Lab uses the same 4 macro names on every preset. Bitwig and NKS give pages names and sections. The face is learnable once.

### 7.2 Mechanisms table

| Mechanism | Examples | When it fits | Cost |
|---|---|---|---|
| **Fixed-count face (N knobs)** | OP-1 (4), Elektron, Push, Bitwig, NKS (8), Resolve Micro (12) | Any parameter set over about 10. Forces ranking, and pairs well with hardware/MIDI. | Someone must rank. Some parameter always loses its slot. The count can feel arbitrary on screen without hardware. |
| **Pages of N (bank 2, 3…)** | Elektron "press twice", Push banks, NKS Edit pages, Bitwig pages | One functional block exceeds N. Page 2 = set-and-forget. | Page state is invisible ("which page am I on?"). Needs a page indicator plus hold-to-preview. |
| **Modifier layer (FUNC/Shift/Option)** | Elektron FUNC+knob A = page-2 DEL; Photos Option = ±2 range; Pro-Q Alt/Cmd-wheel; Capture One Speed Edit keys | Extreme ranges, fine/coarse, and the rarely used twin of a face parameter | Zero discoverability without printed or hinted labels. Not touch-friendly. |
| **Disclosure ▸ (collapsed section / Options)** | Photos Options, Lightroom panels, Lumetri sections, Live triangle | Components of a master, and secondary sections | The scroll grows when opened. Hidden edits are invisible unless the header reports them. |
| **Solo / accordion** | Lightroom Solo Mode; LR desktop single-panel | Many sections and a small screen | Comparing two sections means Shift-click. Context gets lost. |
| **Master slider that drives components** | Apple Photos Light/Color/B&W; Ozone Assistant; Arturia Analog Lab macros; Live Rack macros | Correlated parameters in one perceptual direction | Needs a coupling model (offsets vs re-solve). Users may not trust "magic". Must animate the components to stay honest. |
| **Author-mapped macros (per preset)** | Live Rack macros (8–16, Variations, Rand with exclusions), Bitwig preset pages, NKS Performance, Zebra A–D | Presets differ in what matters. Shells where the prototype author knows best. | The authoring burden is on every preset. Inconsistent names unless a vocabulary is imposed. |
| **Standard macro vocabulary** | Analog Lab Brightness/Timbre/Time/Movement | A family of shells or presets that should feel the same | Some content doesn't fit the 4 axes, so mappings get forced. |
| **Named mode / style (categorical)** | Valhalla Mode + Color; Soundtoys Style; Resolve Wheels/Bars/Log | Parameters that are only good in combinations, or alternate representations | Loses continuous control. You need an "edit style" escape (Soundtoys Style Edit). |
| **Drawer / overlay "Advanced"** | Arturia Advanced; Pro-C Side Chain; Soundtoys Tweak; M4L overlay view | Expert features that most uses never need | Out of sight, out of mind. **Must glow when non-default** (Pro-C). An overlay can cover the face. |
| **Tabs by domain** | Serum / Vital / Pigments; Diva lower panels; CapCut Details | Big instruments with clear subsystems | Cross-tab relationships disappear (hence Diva's duplicated Voices/Stack and modification indicators). |
| **Two views: Perform vs Edit** | NKS Performance/Edit; Ozone Assistant/Detail; Zebra Easy/Main Editor; Resolve Cut/Edit page | Two audiences (players vs designers, or quick vs deep) | Two layouts to maintain. Values must stay consistent across views. |
| **Selection-contextual panel** | Pro-Q band panel; Photoshop Properties; Premiere Properties; Resolve Inspector | Multi-object documents (layers, bands, clips) | Empty selection must show something useful. Controls jump around. |
| **Content-aware suggestions** | Lightroom Quick Actions; Photoshop Contextual Task Bar; VSCO "For This Photo" | Consumer or quick paths. The image itself implies the relevant tools. | Needs analysis. Unpredictable chrome. |
| **Additive (start empty, + Add)** | Photos Add menu + Save As Default; FCP color effects; Live Configure for plug-ins | Long tail of tools that most documents never use | An empty start feels bare. The user has to know a tool exists. |
| **User-built face** | Lightroom Customize Develop Panels; Capture One custom tool tabs; Bitwig device pages; Live Configure | Pros with stable personal workflows | The vendor default still matters most. Customisation is a power-user escape, not the design. |
| **Direct manipulation as primary** | Pro-Q display; Darkroom 5-region curve; OP-1 graphics | One visual model covers most parameters | Needs a good picture of the parameter space. Precise values go to a secondary field. |
| **Hidden-but-modified indicators** | Pro-C yellow glow; Diva modification symbol; Zebra pip shape; iOS Photos arcs; Photos/LR per-section checkmark/eye | **Required companion to any nesting** | Small visual cost. Without it, nesting causes "why does it sound/look like this?" bugs. |

---

## 8. What this suggests for Rueca (proposals, not yet decided)

Rueca already has `folder(..., { collapsed: true })`, conditional rows (`when`), `publish: true` (client view), section reset on hover and "a dot marks changed values". Section 7.1 implies the following deltas [I]:

1. **Ship a tiered face: `face` / `more` / `deep`, with a hard cap on the face.**
   - Cap the at-rest face at **8 rows per shell**, the Elektron/Push/NKS number, or 4 if a shell wants OP-1 strictness.
   - Everything else goes in `more` (disclosure inside its folder, i.e. "Options") or `deep` (an Advanced folder or overlay).
   - Make the cap a lint in `scripts/qa.mjs` so the trade is forced, not optional.
2. **Add a first-class master control: `p.macro(label, { drives: { key: curve } })`.**
   - It renders one slider. Its components sit behind an inline "Options ▸" disclosure, and **the components animate while the master moves** (Photos).
   - Pick and document one coupling rule. **Recommended:** components store user *offsets*, and the master writes the base value. A master move never discards a hand edit, and Reset on a component clears only its offset.
   - Give the section a **checkmark A/B** that bypasses the whole group without losing values.
3. **Make "hidden but modified" mandatory.**
   - A collapsed folder, Options disclosure or Advanced drawer with any non-default child gets an accent dot or glow on its header (Pro-C), plus a count ("Advanced · 2").
   - This extends the existing "dot marks changed values" rule from rows to containers.
4. **Use page 2, not a scroll.**
   - Clicking a folder's header *again* (or a small "2" pip) flips the same rows to that folder's set-and-forget parameters (Elektron "press twice").
   - Holding the header shows every value on all pages (Elektron hold-to-see).
5. **Add a modifier layer: Alt/Option while dragging.**
   - **Extended range** beyond the safe default (Photos ±1 → ±2).
   - Alt-hover on a face row can also reveal its paired page-2 twin (Elektron FUNC + knob A).
   - Always mirror it in the row context menu for discoverability (WCAG: no modifier-only paths).
6. **Use modes before sliders.** When 3+ parameters are only good in combination, author a segmented `p.mode` (Valhalla/Soundtoys). Keep the internals reachable through an "Edit mode ▸" disclosure.
7. **Give shells a standard macro vocabulary.**
   - Analog Lab proves that stable names across content make the face learnable.
   - Candidate shared axes for Rueca's shells (photo effects, video, synth, dither, shaders): **Amount · Scale · Speed · Character** [I].
   - Each shell maps them to its own internals and can still add 4 shell-specific face slots.
8. **Let the content prune the face.** Shells that analyse their input (photo effects) can hide controls that can't apply, like Lightroom's Quick Actions do. Shells without analysis use `when`.
9. **Let the user build the face, as an escape hatch.**
   - A row context-menu item "Pin to face" / "Move to Options".
   - Persist it per shell, like Photos' Save As Default, Bitwig device pages and Live Configure.
   - The *author's* default face is still the design. This is not a substitute for ranking.
10. **Map the face to the client view and to hardware.**
    - The `publish: true` set *is* Rueca's "Performance view". Consider making the face and the published set the same thing by default, with an Edit view as the full tree (NKS / Ozone / Zebra).
    - If Rueca ever exposes MIDI or WebMIDI, the 8-slot face maps 1:1 to 8 encoders, with folders → pages. Push and Bitwig show this is the natural shape.

---

### Source quality notes

- **Strongest primary sources:** FabFilter help, Ableton manual and M4L guidelines, Bitwig user guide, NI Kontrol manual, Elektron Syntakt manual, u-he Diva and Zebra 3 manuals, Apple Photos guide, Blackmagic panel page, Capture One support.
- **Forums or secondary only:** Push "best of" bank (forum), Final Cut Pro hover Show/Hide (community), Lumetri order (tutorials), CapCut (forum), Arturia Advanced panel (Bonedo + manual TOC).
- **Not verified or not found:** NKS literal page rules (SDK private), the Resolve Primaries 1/2 paging, Halide and Descript UIs, and the Apple HIG photo-editing page body.
