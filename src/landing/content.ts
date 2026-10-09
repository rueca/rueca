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
    title: 'Plugin — skill, scripts and kit in one',
    lines: [`/plugin marketplace add ${site.repo}`, `/plugin install ${site.slug}@${site.slug}`],
    note: 'Then ask for a prototype, a playground or “a tool to tune this”. The skill decides the surface, picks a shell archetype, scaffolds the kit and runs QA in both themes.',
  },
  {
    id: 'skill',
    label: 'Any agent',
    title: 'Agent skill — the open standard',
    lines: [`npx skills add ${site.repo}`],
    note: 'Installs skills/' + site.slug + ' for Cursor, Codex, Copilot, Gemini and other agents that read the Agent Skills format (agentskills.io).',
  },
  {
    id: 'kit',
    label: 'Kit only',
    title: 'Components — via the shadcn CLI',
    lines: [`npx shadcn@latest add ${registryItem('studio')}`],
    note: 'Or one piece at a time — theme, core, inspector, timeline, stage, layers, scrub, color and more; each pulls what it needs. Source lands in your repo; import components/studio/theme.css as the last line of your CSS. Re-run add with --overwrite to update (--diff previews).',
  },
  {
    id: 'local',
    label: 'Run locally',
    title: 'Clone the shells',
    lines: [`git clone ${repoURL}`, `cd ${site.repo.split('/')[1]} && npm install && npm run dev`],
    note: 'Every shell in the gallery is a folder in src/shells. Copy one as the start of your own instrument.',
  },
] as const

/** Shells offered in the hero switcher, in order; missing ones are skipped. */
export const HERO_SHELLS = ['shader', 'motion', 'scene', 'dropin', 'present', 'animate', 'nodes', 'type']

export const chrome = [
  'Inspector', 'Scrub fields', 'Timeline', 'Layers', 'Presets', 'Undo / redo', 'A/B compare',
  'Share link', 'Export PNG · SVG · video', 'Command palette', 'Dark + light', 'Client view',
]

export const steps = [
  {
    n: 1,
    title: 'Describe the knobs',
    body: 'One schema is the inspector, the defaults, undo, presets, A/B, the share link and the JSON an engineer receives. Every hint is a tooltip — the schema is the documentation.',
    file: 'artifact.ts',
    code: `export const params = createParams(defineSchema({
  shape: folder('Shape', {
    count:  p.number(24, { min: 3, max: 96, step: 1 }),
    radius: p.number(72, { min: 10, max: 140, unit: 'px' }),
    mode:   p.select('radial', ['radial', 'grid', 'spiral']),
    tint:   p.color('#5b8cff'),
    spin:   p.boolean(true, { hint: 'Rotate over time.' }),
  }),
}), { id: 'dots' })`,
  },
  {
    n: 2,
    title: 'Plug in the artifact',
    body: 'Draw as a pure function of values and time, so scrubbing, slow-mo and frame-accurate export work for free. Or hand a DOM node to three.js, or an iframe to the bridge.',
    file: 'surface.tsx',
    code: `<CanvasSurface params={params} clock={clock}
  draw={(ctx, { v, t, w, h }) => {
    for (let i = 0; i < v.count; i++) {
      const [x, y] = place(v.mode, i, v, t)
      dot(ctx, x, y, v.tint)
    }
  }} />`,
  },
  {
    n: 3,
    title: 'Wrap it in a shell',
    body: 'Islands, overlay or docked. The toolbar, inspector, timeline, palette and shortcuts are the kit’s; the artboard is yours, and so is the brand inside it.',
    file: 'index.tsx',
    code: `<Studio
  toolbar={<Toolbar start={<Brand name="Dots" />}
    end={<ParamActions params={params} />} />}
  right={<Panel><Inspector params={params} /></Panel>}
  bottom={<Timeline clock={clock} lanes={lanes} />}>
  <Stage><Artboard width={390} height={844}>…</Artboard></Stage>
</Studio>`,
  },
]

export const environments = [
  {
    id: 'canvas',
    title: 'Canvas & WebGL',
    body: 'Canvas 2D, raw WebGL2, shaders. DPR, resize and redraw-on-change handled; the draw stays pure.',
    api: 'CanvasSurface',
    code: `<CanvasSurface params={params} clock={clock}
  draw={(ctx, { v, t }) => render(ctx, v, t)} />`,
    shells: ['motion', 'shader'],
  },
  {
    id: 'three',
    title: 'Vanilla three.js',
    body: 'Any renderer that wants a DOM node. Mount once, read live values from the store — no React in the render loop.',
    api: 'MountSurface',
    code: `<MountSurface params={params} mount={(el, api) => {
  const scene = createScene(el)
  return api.params.subscribe(() => scene.update(api.values()))
}} />`,
    shells: ['scene'],
  },
  {
    id: 'bridge',
    title: 'Any existing prototype',
    body: 'Plain HTML, Svelte, a Webflow export, a p5 sketch. Add a 2 KB script; values arrive as callbacks or CSS variables. No rewrite.',
    api: 'FrameSurface + studio-bridge.js',
    code: `<script src="studio-bridge.js"></script>
<script>
  studio.cssVars()          // --headline-size: 76px …
  studio.on((v) => apply(v))
</script>`,
    shells: ['dropin'],
  },
  {
    id: 'client',
    title: 'Client view, on a phone',
    body: 'Mark the params a client may touch with publish: true. They get full-bleed art, a touch sheet and Download — you keep the inspector.',
    api: 'Inspector published',
    code: `p.select('Harbour', PALETTES, { publish: true })

<Inspector params={params} published />`,
    shells: ['present'],
  },
]

export const kitGroups = [
  { title: 'State & time', items: ['defineSchema', 'createParams', 'createClock', 'useValues', 'presets', 'undo / redo', 'A/B', 'share URL'], body: 'A framework-agnostic store and clock, so the artifact can be anything.' },
  { title: 'Fields', items: ['ScrubValue', 'Slider', 'Segmented', 'ColorField · OKLCH', 'CurveEditor', 'SpringEditor', 'GradientEditor', 'PaletteField', 'XYPad', 'AngleDial', 'Vec3Fields', 'SizeFields', 'SeedField', 'ImageDrop', 'Monitor'], body: 'Drag, type or write an expression. Shift ×10, Alt ×0.1, every drag has a typed alternative.' },
  { title: 'Layout', items: ['Studio', 'Toolbar', 'Cluster', 'Panel', 'Stage', 'Artboard', 'ToolDock', 'ZoomPill'], body: 'Islands, overlay or docked. Wheel pan, pinch zoom, Shift+1 fit, ⌘\\ hides the chrome.' },
  { title: 'Time & structure', items: ['Timeline', 'keys & markers', 'LayerTree', 'Inspector'], body: 'Lanes derived from the same maths that renders. Layers with eye, lock, rename and drag.' },
  { title: 'System', items: ['CommandPalette', 'shortcut sheet', 'toast', 'ParamActions', 'ThemeToggle', 'copy as agent prompt'], body: '⌘K for everything, ? for every shortcut, and a hand-off an agent can act on.' },
  { title: 'Export', items: ['PNG @2×', 'SVG', 'WebM / MP4', 'JSON', 'copy link'], body: 'Frame-accurate, because the render is a pure function of values and time.' },
]

/** The four control surfaces — rendered as live swatches that flip with the theme. */
export const surfaces = [
  { token: 'well', note: 'recessed — segmented background' },
  { token: 'track', note: 'a groove; lighter than the panel in dark' },
  { token: 'raised', note: 'the active pill inside a well' },
  { token: 'active', note: 'a toggled control on a panel' },
]

export const faq = [
  {
    q: 'How is this different from Toolcraft?',
    a: 'Toolcraft (Pixel Point, MIT) has an agent generate a whole bespoke design app from a large starter, React-only and desktop-only. Here the harness drops in around a prototype you already have — canvas, three.js or an iframe of anything — and the kit installs component by component, so it can be updated later. Toolcraft is the better fit when you want a full standalone app; several of its ideas (soft vs hard ranges, interaction ownership, transient history lanes) are credited below.',
  },
  {
    q: 'And DialKit, Leva, Tweakpane?',
    a: 'They are tuning panels: excellent for developers, and DialKit’s springs and agent hand-off are lovely. This is the rest of the tool around the panel — stage and camera, timeline, layers, export, command palette, a client view — styled to be shown to a client rather than to a console.',
  },
  {
    q: 'Do I need React?',
    a: 'The harness is React; the artifact does not have to be. The store and clock are vanilla, MountSurface hands a node to any renderer, and the bridge drives a prototype in any framework through postMessage.',
  },
  {
    q: 'Does it work on a phone?',
    a: 'The client view does — big touch targets, a bottom sheet, only the params you publish. The full designer view is built for a desktop.',
  },
  {
    q: 'Will it make my prototype look generic?',
    a: 'The chrome is neutral on purpose: no brand, no accent outside state. The artboard has its own font token, so restyling the tool can never restyle the thing being designed.',
  },
  {
    q: 'Is it free?',
    a: `Yes — ${site.license}. Use it for client work; credit is appreciated, not required.`,
  },
]

export const credits = [
  { title: 'Reference tools', items: ['Figma & Figma Motion', 'Framer', 'Spline', 'Paper', 'Rive', 'Affinity'] },
  { title: 'Patterns studied', items: ['Blender', 'After Effects', 'Cavalry', 'Jitter', 'Lightroom', 'DaVinci Resolve', 'TouchDesigner', 'Cables', 'Adobe Spectrum 2'] },
  { title: 'Prior art', items: ['Toolcraft (MIT)', 'DialKit (MIT)', 'Figma PropsKit', 'Leva', 'Tweakpane', 'Theatre.js', 'shadcn/designer'] },
  { title: 'Built on', items: ['Base UI', 'shadcn registry', 'Tailwind CSS v4', 'zustand', 'lucide', 'cmdk', 'xyflow', 'three.js', 'mediabunny', 'culori', 'Inter'] },
]
