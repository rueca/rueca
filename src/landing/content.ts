/* Landing page copy and data. Brand words come from site.config — nothing
   here hardcodes the product name, so a rename is a one-file change. */
import { site, repoURL, registryItem } from '@/site.config'

export const links = {
  repo: repoURL,
  issues: `${repoURL}/issues`,
  contributing: `${repoURL}/blob/main/CONTRIBUTING.md`,
  kitDocs: `${repoURL}/blob/main/docs/KIT.md`,
  skill: `${repoURL}/tree/main/skills/${site.slug}`,
  license: `${repoURL}/blob/main/LICENSE`,
}

/** Install paths, by audience. Mirrored in README.md. */
export const installs = [
  {
    id: 'plugin',
    label: 'Claude Code',
    title: 'Skill, scripts and kit in one',
    lines: [`/plugin marketplace add ${site.repo}`, `/plugin install ${site.slug}@${site.slug}`],
    note: 'Then ask your agent for a prototype or “a tool to tune this”.',
  },
  {
    id: 'skill',
    label: 'Any agent',
    title: 'For Cursor, Codex, Copilot and others',
    lines: [`npx skills add ${site.repo}`],
    note: 'Works with any agent that reads the open Agent Skills format.',
  },
  {
    id: 'kit',
    label: 'Kit only',
    title: 'Just the components',
    lines: [`npx shadcn@latest add ${registryItem('studio')}`],
    note: 'Add everything, or one piece at a time. The files land in your project and you can update them later. Setup notes are in the README.',
  },
  {
    id: 'local',
    label: 'Run locally',
    title: 'Clone the shells',
    lines: [`git clone ${repoURL}`, `cd ${site.repo.split('/')[1]} && npm install && npm run dev`],
    note: 'Each example tool is a folder. Copy one to start your own.',
  },
] as const

/** Shells offered in the hero switcher, in order; missing ones are skipped. */
/** The hero: a short stacked line in the display serif, then the plain promise (display face: see landing.css). Brand line, see brand/BRAND.md. */
export const hero = {
  lines: ['Spin up', 'a real tool.'],
  lede: 'The inspector, timeline, layers and export of a design tool, wrapped around the prototype you already have.',
}

export const HERO_SHELLS = ['animate', 'shader', 'scene']
/** On a phone the hero shows this one instead, in its client view. */
export const HERO_PHONE_SHELL = 'shader' // its ?client view: the gradient full-bleed with looks, Shuffle and Download
/** The shell rail shows these six (the gallery's first six by `order`); the rest sit behind its "see all" card. */
export const RAIL_SHELLS = ['motion', 'dropin', 'ui-design'] // three that aren't in the hero; the index card lists the rest

export const steps = [
  {
    n: 1,
    short: 'Ask',
    title: 'Describe what you need',
    body: 'Tell your agent what you’re making. It sets up a real editor around it: canvas, timeline and controls.',
  },
  {
    n: 2,
    short: 'Bring',
    title: 'Bring your design',
    body: 'Your logo, animation or page comes in as it is. Nothing gets rebuilt.',
  },
  {
    n: 3,
    short: 'Tune',
    title: 'Tune it like a real tool',
    body: 'Scrub the timeline, nudge the curves and export when it looks right.',
  },
]

export const kitGroups = [
  { title: 'Controls', items: ['Scrub fields', 'Sliders', 'Toggles', 'Colour picker', 'Gradients', 'Palettes', 'Curves', 'Springs', 'Angle dial', 'XY pad', 'Image drop', 'Live readouts'], body: 'Drag a number, type it, or do quick maths in the field. Everything works from the keyboard.' },
  { title: 'Layout', items: ['Floating panels', 'Docked panels', 'Full-bleed stage', 'Artboards', 'Pan and zoom', 'Tool dock'], body: 'Floating, docked or full-bleed, with a canvas that pans and zooms like Figma.' },
  { title: 'Time', items: ['Timeline', 'Keyframes', 'Markers', 'Play and scrub', 'Slow motion'], body: 'A timeline that always matches the animation.' },
  { title: 'Structure', items: ['Layers', 'Inspector', 'Show and hide', 'Lock', 'Rename', 'Reorder'], body: 'Layers you can hide, lock and drag, and an inspector that builds itself.' },
  { title: 'Working', items: ['Undo and redo', 'Presets', 'Before and after', 'Share link', 'Command palette', 'Shortcuts'], body: 'Undo anything, save looks, compare versions, and share a link to the exact state.' },
  { title: 'Hand-off', items: ['PNG', 'SVG', 'Video', 'Settings file', 'Copy as agent prompt'], body: 'Export stills and video, or hand the settings to an engineer or another agent.' },
]

export const faq = [
  {
    q: 'How is this different from Toolcraft?',
    a: 'Toolcraft has your agent generate a whole design app from a large starter, for React and desktop only. This wraps the prototype you already have, in any framework, and installs piece by piece so you can update it. Pick Toolcraft for a standalone app. We borrowed three of its ideas: sliders with a soft range you can type past, giving each action one home (the canvas or the panel, not both), and keeping playback out of your undo history.',
  },
  {
    q: 'And DialKit, Leva, Tweakpane?',
    a: 'They’re tuning panels, great for developers, and DialKit’s springs are lovely. This adds the rest of the tool around the panel: canvas, timeline, layers, export and a client view, polished enough to show a client.',
  },
  {
    q: 'Do I need React?',
    a: 'The tool is built in React. Your prototype can be anything: a canvas, a three.js scene, or a page built in another framework.',
  },
  {
    q: 'Does it work on a phone?',
    a: 'The client view does, with big touch targets and only the controls you choose to share. The full design view is for desktop.',
  },
  {
    q: 'Will it make my prototype look generic?',
    a: 'No. The tool stays neutral on purpose, and your artboard keeps its own fonts and colours, so restyling the tool never touches your design.',
  },
  {
    q: 'Is it free?',
    a: `Yes, ${site.license}. Use it for client work. Credit is welcome, not required.`,
  },
]

export const credits = [
  { title: 'Reference tools', items: ['Figma & Figma Motion', 'Framer', 'Spline', 'Paper', 'Rive', 'Affinity'] },
  { title: 'Patterns studied', items: ['Blender', 'After Effects', 'Cavalry', 'Jitter', 'Lightroom', 'DaVinci Resolve', 'TouchDesigner', 'Cables', 'Adobe Spectrum 2'] },
  { title: 'Prior art', items: ['Toolcraft (MIT)', 'DialKit (MIT)', 'Figma PropsKit', 'Leva', 'Tweakpane', 'Theatre.js', 'shadcn/designer'] },
  { title: 'Built on', items: ['Base UI', 'shadcn registry', 'Tailwind CSS v4', 'zustand', 'lucide', 'cmdk', 'xyflow', 'three.js', 'mediabunny', 'culori', 'Inter'] },
]
