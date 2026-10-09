# Brand — naming, positioning, voice

Board: http://localhost:5273/brand/ (marks, palettes and the in-product previews live there).
Source data: `brand/data.js` · marks: `brand/marks.js` · checked 9 Oct 2026.

**Status: options. The name and the look are Rafael's call.** The working name is "Prototype Studio".

## Recommendation

**Thumbwheel.** It names the core gesture (scrubbing a value until it feels right), and it's the only
candidate free everywhere: npm, the `@thumbwheel` scope, the GitHub handle, and `.dev` / `.studio` / `.design` / `.tools`.
**Wingspace** is the runner-up if you'd rather lead with the client-facing, "your work centre stage" story.

## Positioning

**Promise:** Put a real design tool around the prototype you already have.

**Pitch.** Designers now build shaders, motion studies, 3D scenes and asset generators with an agent, and they end
up with a canvas and a wall of debug sliders. This gives that work the interface it deserves: an inspector,
timeline, layers, presets, undo and export, in the calm style of Figma or Spline. It wraps what you already have,
whether that's canvas, three.js, React or any page in an iframe. You install it piece by piece, so the code stays
yours and it can still be updated. It also has a present mode clean enough to hand to a client, and it works on
their phone too. It ships as an agent skill, a Claude Code plugin and a shadcn component registry.

**Audiences**
1. **Designers who prototype with agents** (primary): a pro-grade tool around their idea without becoming engineers, ready to show a client.
2. **Design engineers and creative coders**: better controls than Leva or Tweakpane, plus undo, presets and export for shaders, 3D and motion, in any runtime.
3. **Studios and agencies**: instruments for clients (brand generators, multi-size ad export, demos) with a present mode and share links.
4. **Agent and tool builders**: an agent that builds pro tooling by default, from a skill plus a registry.

**How we differ**

| Alternative | What it is | Ours |
|---|---|---|
| Toolcraft | An agent generates a whole new app from a ~1,900-file starter. It's React-only, desktop-only and can't be updated after generation. | Wraps the prototype you have, in any runtime. It installs per component, stays updatable and works on phones. |
| DialKit | A floating panel for tuning springs and values, with "copy prompt for agent". | The panel is one part of the whole tool: stage, timeline, layers, export, presets and a client view. |
| Figma PropsKit | Web components for Figma's agent to build panels inside Figma. | Runs anywhere on the web, outside Figma. |
| Leva · Tweakpane · lil-gui | Debug panels that look like debug panels. | Presentation-grade chrome with undo, A/B, presets, share links and export. |
| Theatre.js | A studio for sequencing animated values over time. | Animation is one shell among many: 3D, photo, flows, journeys, node graphs and batch export. |
| shadcn/designer | A commercial studio template. | MIT, built from parts. Take only what you need. |

## Names (20 of 39 checked)

npm / scope / GitHub: ✓ free · ✗ taken · ~ taken but a variant is free.

| Name | Idea | npm | @scope | GitHub | Free domains | Already out there | Verdict |
|---|---|---|---|---|---|---|---|
| **Thumbwheel** | Ridged wheel you roll to fine-tune a value | ✓ | ✓ | ✓ | .dev .studio .design .tools | Only the generic control name | **Shortlist ★** |
| **Wingspace** | Theatre wings hold the controls; the show owns the stage | ✓ | ✓ | ~ wingspace-dev | .dev .studio .design .tools | Wingspace Theatrical Design owns .com | **Shortlist** |
| **Jigwork** | A jig holds the work and guides the tool | ✓ | ✓ | ~ jigworkhq | .studio .tools .design | JigWorks (special-ed jigsaw app); JigSpace nearby | **Shortlist** |
| **Clampwork** | Clamps free both hands for the work; CSS clamp() | ✓ | ✓ | ✓ | **.com** .dev | Nothing found | **Shortlist** |
| Plinthkit | A plinth shows the work | ✓ | ✓ | ✓ | .dev | Nothing; "kit" suffix weak | Reserve |
| Knobwork | Craft of the controls | ✓ | ✓ | ✓ | .com .dev | "Knob" is British slang | Pass |
| Detent | The click that seats a dial | ✓ | ✗ | ✗ | .design .tools | Detent SEO SaaS; SwiftUI "detents" | Pass |
| Trimpot | Calibration potentiometer | ✓ | ✗ | ✗ | .dev .studio | **Registered trademark (Bourns)** | Pass |
| Truing | Truing stand holds a wheel | ✓ | ✗ | ✗ | .studio | Obscure word | Pass |
| Faderworks | Mixing desk for your prototype | ✓ | ✓ | ✓ | .dev | FaderWorks audio plug-in exists | Pass |
| Flyrail | Theatre fly-system rail | ✓ | ✓ | ✗ (org created 2026) | — | Looks like a launch in progress | Pass |
| Workstand | Bike workstand | ✓ | ✗ | ✓ | .studio | Bike-coop app uses it | Pass |
| Pegrail | Pegboard tool rail | ✓ | ✓ | ✓ | .dev | Meaning doesn't land | Pass |
| Knobhouse | House of controls | ✓ | ✓ | ✓ | .dev | "Knob"; sounds like a pub | Pass |
| Plinth | What sculpture stands on | ✗ | ✗ | ✗ | — | 391 repos | Taken |
| Jig | Holds the work | ✗ | ✗ | ✗ | — | JigSpace, withjig | Taken |
| Maquette | Sculptor's study model | ✗ | ✗ | ✗ | — | maquette JS UI library | Taken |
| Holdfast | Bench holdfast | ✗ | ✗ | ✗ | — | — | Taken |
| Vernier | Fine-reading scale | ✗ | ✗ | ✗ | — | Vernier Ruby profiler, science brand | Taken |
| Gantry | Frame that carries tools/lights | ✗ | ✗ | ✗ | — | Gantry 5 CMS framework | Taken |

Also checked and taken: Easel, Trellis, Caliper, Gimbal, Bezel, Lathe, Patchbay, Armature, Vitrine, Pegboard,
Knurl, Benchtop, Surround, Sightline, Scrim, Tenon, Fixture.

**Method.** npm package and `@scope` via the registry, GitHub handle via the users API, a repo search by name,
live registrar availability for domains (taken ones opened to see what's there), and a web search for existing
software. Trademarks were only spot-checked, so run a USPTO/EUIPO search (classes 9 and 42) before launch.

## Shortlist

| | Mark | Wordmark | Palette |
|---|---|---|---|
| **Thumbwheel** | A thumbwheel edge-on in its slot: ridges bunch towards the edges like a rolling cylinder, and an orange line marks the value | Geist SemiBold, lowercase | Graphite `#18181B` · Paper `#F4F2ED` · Signal `#FF5B1F` · Steel `#8B9099` · Fog `#D9D6CF` |
| **Wingspace** | Two wing flats in perspective, with the work lit between them | Instrument Serif | Stage `#141210` · Footlight `#FFF1CC` · Velvet `#8E1B2E` · Boards `#6B5B4E` · House `#F3EFE7` |
| **Jigwork** | An L-shaped fence holding the workpiece; the hole is the drill bushing | Archivo Expanded Bold, lowercase | Ink `#16181D` · Birch `#EAD9B5` · Layout blue `#2346D8` · Steel `#9AA1AB` · Shop white `#F6F4EF` |
| **Clampwork** | A C-clamp closing on the work; it reads as a C at 16px | Bricolage Grotesque Bold, lowercase | Cast iron `#1E2120` · Machine green `#3D6B52` · Chartreuse `#D6F25B` · Rust `#B4532A` · Mint paper `#EEF2EC` |

Marks are drawn on a 32-unit grid and tested from 96px down to 16px. Brand colour lives on the site and the mark
only. The product chrome stays neutral (Inter, kit tokens), per the kit rules.

## Voice

A good studio tech: calm, exact, a little warm. We talk about the work and the person making it, never about ourselves.

1. **Name the thing.** Say "inspector, timeline, layers", not "powerful controls".
2. **Short, plain sentences.** One idea each.
3. **Sentence case, always.** Headings, buttons and menus too.
4. **Show, don't adjective.** A screenshot or a number beats "beautiful", "seamless" or "intuitive".
5. **Calm confidence.** No exclamation marks, and none of "supercharge", "unleash", "magic", "game-changer" or "AI-powered".
6. **Craft words are welcome.** Scrub, artboard, detent and jig are fine, as long as you explain each once.
7. **Credit the shoulders.** Toolcraft, Base UI and shadcn get named, generously.

| Say | Not |
|---|---|
| Drop it around a three.js scene and you get an inspector, a timeline and export. | Supercharge your creative workflow with AI-powered controls! |
| Undo works on every control, mid-drag included. | A seamless, intuitive editing experience. |
| Send the link. Your client changes the colours on their phone. | Delight stakeholders with immersive presentations. |

**Taglines**
- Thumbwheel: *Fine-tune anything.* · *Roll it till it's right.* · *Every prototype deserves proper controls.*
- Wingspace: *Your work, centre stage.* · *Everything around the work. Nothing in front of it.* · *The crew stays in the wings.*
- Jigwork: *Build the tool that builds the work.* · *Hold it steady. Make it repeatable.* · *Jigs for the things you make.*
- Clampwork: *Clamp a studio onto anything.* · *Both hands free for the work.* · *Grips any prototype.*

## Once a name is picked

1. Claim the GitHub org, the npm `@scope` and the domain on the same day.
2. Edit `src/site.config.ts` (name, slug, tagline, repo, url), then run `npm run sync`.
3. Replace the placeholder `Mark` in `src/landing/parts.tsx` with the chosen SVG from `brand/marks.js`.
4. Run a trademark search before the public launch.
