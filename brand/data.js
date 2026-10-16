/* Brand board data. Availability checked 2026-10-09:
   npm      — registry.npmjs.org/<name> (404 = free)
   scope    — registry.npmjs.org/-/org/<name>/package (404 = no such org, so @name is claimable)
   GitHub   — api.github.com/users/<name> (404 = handle free); repo clash = top results for "<name> in:name"
   domains  — Vercel registrar bulk availability (live registry lookup); taken domains opened to see what's there
   web      — a search for an existing software product with the same name */

export const checkedOn = '9 Oct 2026'

/** verdict: 'short' shortlisted · 'reserve' viable, not shortlisted · 'pass' viable but a problem · 'taken' */
export const names = [
  { name: 'Thumbwheel', idea: 'The ridged wheel you roll with a thumb to fine-tune a value, as on cameras, radios and mice.',
    npm: 'free', scope: 'free', gh: 'free', repos: '12 repos, all tiny (top ★1)', domains: { free: ['.dev', '.studio', '.design', '.tools'], taken: ['.com (parked)'] },
    web: 'Only the generic control name (industrial HMI widgets).', verdict: 'short' },
  { name: 'Wingspace', idea: 'In a theatre the wings hold the crew and the controls, out of sight, so the show owns the stage.',
    npm: 'free', scope: 'free', gh: 'taken (empty org, 2015) · wingspace-dev free', repos: '5 repos, all tiny', domains: { free: ['.dev', '.studio', '.design', '.tools'], taken: ['.com (Wingspace Theatrical Design)'] },
    web: 'Wingspace Theatrical Design, a collective of set designers. Not software, but it is design.', verdict: 'short' },
  { name: 'Jigwork', idea: 'A jig holds the workpiece and guides the tool, so every cut comes out the same.',
    npm: 'free', scope: 'free', gh: 'taken (empty org, 2024) · jigwork-dev, jigworkhq free', repos: '2 repos, unrelated', domains: { free: ['.studio', '.tools', '.design'], taken: ['.com, .dev (registered, nothing live)'] },
    web: 'JigWorks, a jigsaw app for special education. JigSpace and withjig.com sit nearby.', verdict: 'short' },
  { name: 'Clampwork', idea: 'Clamps hold the piece to the bench so both hands are free for the work. Front-end people will also hear CSS clamp().',
    npm: 'free', scope: 'free', gh: 'free', repos: 'none', domains: { free: ['.com', '.dev'], taken: [] },
    web: 'Nothing found.', verdict: 'short' },
  { name: 'Knobwork', idea: 'The craft of the controls.', npm: 'free', scope: 'free', gh: 'free', repos: 'none',
    domains: { free: ['.com', '.dev'], taken: [] }, web: 'Nothing found, but “knob” is British slang for an idiot.', verdict: 'pass' },
  { name: 'Plinthkit', idea: 'A plinth is what you stand work on to show it. The kit is the part that does it.', npm: 'free', scope: 'free', gh: 'free', repos: 'none',
    domains: { free: ['.dev'], taken: ['.com'] }, web: 'Nothing found. The “kit” suffix makes it feel like a module, not a product.', verdict: 'reserve' },
  { name: 'Detent', idea: 'The click that seats a dial in place.', npm: 'free', scope: 'taken', gh: 'taken', repos: '692 repos (mostly “detention”)',
    domains: { free: ['.design', '.tools'], taken: ['.com', '.dev', '.studio', 'getdetent.com', 'usedetent.com'] },
    web: 'Detent is already a local-SEO SaaS. SwiftUI also uses “detents” for sheet heights.', verdict: 'pass' },
  { name: 'Trimpot', idea: 'A tiny potentiometer you set with a screwdriver to calibrate a circuit.', npm: 'free', scope: 'taken', gh: 'taken', repos: '7 repos, tiny',
    domains: { free: ['.dev', '.studio'], taken: ['.com'] }, web: 'Registered trademark of Bourns Inc. Out.', verdict: 'pass' },
  { name: 'Truing', idea: 'A truing stand holds a bike wheel while you true it up.', npm: 'free', scope: 'taken', gh: 'taken', repos: '27 repos, tiny',
    domains: { free: ['.studio'], taken: ['.com', '.dev'] }, web: 'Nothing found, but most people won’t know the word.', verdict: 'pass' },
  { name: 'Faderworks', idea: 'The mixing desk for your prototype.', npm: 'free', scope: 'free', gh: 'free', repos: '2 repos',
    domains: { free: ['.dev'], taken: ['.com'] }, web: 'FaderWorks is an existing audio plug-in (VertexDSP).', verdict: 'pass' },
  { name: 'Flyrail', idea: 'The rail backstage where the flown scenery is rigged.', npm: 'free', scope: 'free', gh: 'taken (org created 2026)', repos: '3 repos',
    domains: { free: [], taken: ['.com', '.dev'] }, web: 'Someone registered the org and both domains this year, so it looks like a launch in progress.', verdict: 'pass' },
  { name: 'Workstand', idea: 'The stand that holds a bike off the ground while you work on it.', npm: 'free', scope: 'taken', gh: 'free', repos: 'Bridge City Bicycle Coop app ★6',
    domains: { free: ['.studio'], taken: ['.com', '.dev'] }, web: 'An open-source bike-shop app already uses it.', verdict: 'pass' },
  { name: 'Pegrail', idea: 'The rail on a pegboard where tools hang until you need them.', npm: 'free', scope: 'free', gh: 'free', repos: 'none',
    domains: { free: ['.dev'], taken: ['.com'] }, web: 'Nothing found, but the meaning doesn’t land.', verdict: 'pass' },
  { name: 'Knobhouse', idea: 'A house of controls.', npm: 'free', scope: 'free', gh: 'free', repos: 'none',
    domains: { free: ['.dev'], taken: ['.com (Wix)'] }, web: 'Has the same “knob” problem, and it sounds like a pub.', verdict: 'pass' },
  { name: 'Plinth', idea: 'What sculpture stands on.', npm: 'taken', scope: 'taken', gh: 'taken', repos: '391 repos (jabrena/plinth ★447)',
    domains: { free: [], taken: ['.dev', '.studio'] }, web: 'Crowded.', verdict: 'taken' },
  { name: 'Jig', idea: 'Holds the work, guides the tool.', npm: 'taken', scope: 'taken', gh: 'taken', repos: '16k repos',
    domains: { free: [], taken: ['.dev', '.studio'] }, web: 'JigSpace and withjig.com are both software products.', verdict: 'taken' },
  { name: 'Maquette', idea: 'A sculptor’s small study model, the original prototype.', npm: 'taken', scope: 'taken', gh: 'taken', repos: 'AFAS maquette ★781',
    domains: { free: [], taken: [] }, web: 'maquette is already a JS UI library. That clashes directly.', verdict: 'taken' },
  { name: 'Holdfast', idea: 'The bench holdfast pins work down with one tap.', npm: 'taken', scope: 'taken', gh: 'taken', repos: '190 repos',
    domains: { free: [], taken: ['.dev'] }, web: 'Taken.', verdict: 'taken' },
  { name: 'Vernier', idea: 'The sliding scale that reads finer than the main one.', npm: 'taken', scope: 'taken', gh: 'taken', repos: 'jhawthorn/vernier ★1.1k (Ruby profiler)',
    domains: { free: [], taken: [] }, web: 'Vernier is a dev tool already, plus a science-hardware brand.', verdict: 'taken' },
  { name: 'Gantry', idea: 'The frame that carries tools over the work, or lights over a stage.', npm: 'taken', scope: 'taken', gh: 'taken', repos: 'Gantry 5 framework ★1k',
    domains: { free: [], taken: ['.dev'] }, web: 'Gantry is a known CMS framework.', verdict: 'taken' },
]

/** checked and dropped before the table: dictionary words, all taken on npm + GitHub */
export const alsoChecked = ['Easel (EaselJS ★8k)', 'Trellis (Microsoft TRELLIS ★14k)', 'Caliper (Google)', 'Gimbal', 'Bezel', 'Lathe', 'Patchbay', 'Armature',
  'Vitrine', 'Pegboard', 'Knurl', 'Benchtop', 'Surround', 'Sightline', 'Scrim', 'Tenon', 'Fixture']

export const shortlist = [
  {
    id: 'thumbwheel', name: 'Thumbwheel', recommended: true,
    say: 'THUMB-weel', short: 'Tuning by hand',
    why: 'It names the core gesture of the product: scrubbing a value until it feels right. It’s concrete, friendly and easy to picture. It’s also the only name here that’s free everywhere: npm, the @thumbwheel scope, the GitHub handle and four domains.',
    watch: 'At ten letters it’s long, but it’s one compound word that’s easy to spell. The .com is parked, so you’d launch on thumbwheel.dev.',
    font: { family: '"Geist", "Inter", sans-serif', weight: 600, tracking: '-0.035em', case: 'lower', label: 'Geist SemiBold' },
    colors: {
      light: { ink: '#18181B', acc: '#FF5B1F', bg: '#F4F2ED' },
      dark: { ink: '#E9E6DF', acc: '#FF6A33', bg: '#18181B' },
    },
    palette: [
      { name: 'Graphite', hex: '#18181B' }, { name: 'Paper', hex: '#F4F2ED' }, { name: 'Signal', hex: '#FF5B1F' },
      { name: 'Steel', hex: '#8B9099' }, { name: 'Fog', hex: '#D9D6CF' },
    ],
    taglines: ['Fine-tune anything.', 'Roll it till it’s right.', 'Every prototype deserves proper controls.'],
    handle: 'thumbwheel', domain: 'thumbwheel.dev',
  },
  {
    id: 'wingspace', name: 'Wingspace', recommended: false,
    say: 'WING-space', short: 'Your work, centre stage',
    why: 'This one carries the house rule: the controls live in the wings and the work owns the stage, which is “neutral chrome, brand inside the artboard” told as a story. It suits the client-facing present mode well, and it sounds the most premium of the four.',
    watch: 'wingspace.com belongs to a theatre set-design collective, which is close to the design world. The GitHub handle is held by an empty org, so you’d use wingspace-dev.',
    font: { family: '"Instrument Serif", Georgia, serif', weight: 400, tracking: '-0.01em', case: 'title', label: 'Instrument Serif' },
    colors: {
      light: { ink: '#141210', acc: '#8E1B2E', bg: '#F3EFE7' },
      dark: { ink: '#FFF1CC', acc: '#C8414F', bg: '#141210' },
    },
    palette: [
      { name: 'Stage', hex: '#141210' }, { name: 'Footlight', hex: '#FFF1CC' }, { name: 'Velvet', hex: '#8E1B2E' },
      { name: 'Boards', hex: '#6B5B4E' }, { name: 'House', hex: '#F3EFE7' },
    ],
    taglines: ['Your work, centre stage.', 'Everything around the work. Nothing in front of it.', 'The crew stays in the wings.'],
    handle: 'wingspace-dev', domain: 'wingspace.dev',
  },
  {
    id: 'jigwork', name: 'Jigwork', recommended: false,
    say: 'JIG-work', short: 'Repeatable tools',
    why: 'A jig is the tool you build so the real work comes out right every time, which is exactly what an instrument for a client is. It’s short, punchy and maker-grade, and it suits an agent that builds tools.',
    watch: 'jigwork.com and .dev are registered (nothing is live on them), so you’d launch on jigwork.studio. “Jig” is a busy prefix in software (JigSpace, withjig).',
    font: { family: '"Archivo", "Inter", sans-serif', weight: 700, tracking: '-0.01em', case: 'lower', stretch: '125%', label: 'Archivo Expanded Bold' },
    colors: {
      light: { ink: '#16181D', acc: '#2346D8', bg: '#F6F4EF' },
      dark: { ink: '#EAD9B5', acc: '#6E8BFF', bg: '#16181D' },
    },
    palette: [
      { name: 'Ink', hex: '#16181D' }, { name: 'Birch', hex: '#EAD9B5' }, { name: 'Layout blue', hex: '#2346D8' },
      { name: 'Steel', hex: '#9AA1AB' }, { name: 'Shop white', hex: '#F6F4EF' },
    ],
    taglines: ['Build the tool that builds the work.', 'Hold it steady. Make it repeatable.', 'Jigs for the things you make.'],
    handle: 'jigworkhq', domain: 'jigwork.studio',
  },
  {
    id: 'clampwork', name: 'Clampwork', recommended: false,
    say: 'CLAMP-work', short: 'Grips any prototype',
    why: 'This is the most literal take on “drops in around what you already have”. A clamp grips any shape, and the mark is a frame closing around your work. It’s the only name with the .com free, and front-end people get the clamp() wink.',
    watch: 'A clamp implies constraint, so the copy has to keep pointing at freedom (“both hands free”). It’s the most hardware-ish of the four.',
    font: { family: '"Bricolage Grotesque", "Inter", sans-serif', weight: 700, tracking: '-0.035em', case: 'lower', label: 'Bricolage Grotesque Bold' },
    colors: {
      light: { ink: '#1E2120', acc: '#3D6B52', bg: '#EEF2EC' },
      dark: { ink: '#EEF2EC', acc: '#D6F25B', bg: '#1E2120' },
    },
    palette: [
      { name: 'Cast iron', hex: '#1E2120' }, { name: 'Machine green', hex: '#3D6B52' }, { name: 'Chartreuse', hex: '#D6F25B' },
      { name: 'Rust', hex: '#B4532A' }, { name: 'Mint paper', hex: '#EEF2EC' },
    ],
    taglines: ['Clamp a studio onto anything.', 'Both hands free for the work.', 'Grips any prototype.'],
    handle: 'clampwork', domain: 'clampwork.com',
  },
]

export const positioning = {
  promise: 'Put a real design tool around the prototype you already have.',
  pitch: [
    'Designers now build shaders, motion studies, 3D scenes and asset generators with an agent. What they end up with is a canvas and a wall of debug sliders.',
    'This gives that work the interface it deserves: an inspector, timeline, layers, presets, undo and export, in the calm style of Figma or Spline. It wraps what you already have, whether that’s canvas, three.js, React or any page in an iframe. You install it piece by piece, so the code stays yours and it can still be updated. It also has a present mode clean enough to hand to a client, and it works on their phone too.',
    'It ships as an agent skill, a Claude Code plugin and a shadcn component registry.',
  ],
  audiences: [
    { who: 'Designers who prototype with agents', need: 'A pro-grade tool around their idea without becoming engineers, and something they can show a client tomorrow.', primary: true },
    { who: 'Design engineers and creative coders', need: 'Better controls than Leva or Tweakpane, plus undo, presets and export for shaders, 3D and motion, in any runtime.' },
    { who: 'Studios and agencies', need: 'Instruments for clients, like brand generators, multi-size ad export and demos, with a present mode and share links.' },
    { who: 'Agent and tool builders', need: 'An agent (Claude Code, Cursor, Codex) that builds pro tooling by default, from a skill plus a registry it can install from.' },
  ],
  versus: [
    { them: 'Toolcraft', what: 'An agent generates a whole new design app from a ~1,900-file starter. It’s React-only, desktop-only and can’t be updated after generation.',
      us: 'We wrap the prototype you already have, in any runtime. It installs one component at a time, stays updatable and works on phones.' },
    { them: 'DialKit', what: 'A floating panel for tuning springs and values, with “copy prompt for agent”.',
      us: 'The panel is one part of the whole tool: stage, timeline, layers, export, presets and a client view.' },
    { them: 'Figma PropsKit', what: 'Web components that help Figma’s agent build native-looking panels inside Figma.',
      us: 'Runs anywhere on the web, outside Figma, for any prototype.' },
    { them: 'Leva · Tweakpane · lil-gui', what: 'Developer debug panels that look like debug panels.',
      us: 'Presentation-grade chrome with undo, A/B, presets, share links and export, good enough to show a client.' },
    { them: 'Theatre.js', what: 'A studio for sequencing animated values over time.',
      us: 'Animation is one shell among many. The kit covers 3D, photo, flows, journeys, node graphs and batch export.' },
    { them: 'shadcn/designer', what: 'A commercial design-studio template.',
      us: 'Open source (MIT) and built from parts, so you take only the pieces you need.' },
  ],
}

export const voice = {
  summary: 'A good studio tech: calm, exact, a little warm. We talk about the work and the person making it, never about ourselves.',
  rules: [
    ['Name the thing.', 'Say “inspector, timeline, layers”, not “powerful controls”.'],
    ['Short, plain sentences.', 'One idea each. If a sentence needs a comma splice, it’s two sentences.'],
    ['Sentence case, always.', 'Headings, buttons and menus too. It matches the kit.'],
    ['Show, don’t adjective.', 'A screenshot or a number beats “beautiful”, “seamless” or “intuitive”.'],
    ['Calm confidence.', 'No exclamation marks, no “supercharge”, “unleash”, “magic”, “game-changer” or “AI-powered”.'],
    ['Craft words are welcome.', 'Scrub, artboard, detent and jig are all fine, as long as you explain each once.'],
    ['Credit the shoulders.', 'Toolcraft, Base UI and shadcn get named, generously.'],
  ],
  pairs: [
    ['Drop it around a three.js scene and you get an inspector, a timeline and export.', 'Supercharge your creative workflow with AI-powered controls!'],
    ['Undo works on every control, mid-drag included.', 'A seamless, intuitive editing experience.'],
    ['Send the link. Your client changes the colours on their phone.', 'Delight stakeholders with immersive presentations.'],
  ],
}

/* ---------------------------------------------------------------------------
   Round 2 — Spanish and Latin, historical tools, pop culture. Checked 9 Oct 2026, same method.
--------------------------------------------------------------------------- */

export const round2Lenses = [
  { title: 'Spanish and Latin', body: 'Words that translate close to what we’d call it in English: harness, stage machinery, the frame around the work, the marionette’s controls.' },
  { title: 'Historical tools', body: 'Instruments that held, framed or steered someone else’s work, from Greek stage machinery and the letterpress to the draughtsman’s spline weights.' },
  { title: 'Inventors', body: 'People who built machines that made other things move: automata-makers, stage engineers, the inventor of the remote control.' },
  { title: 'Pop culture', body: 'Controls that brought something to life on screen: Henson’s waldos, Star Trek’s panels, the ILM model shop and Chaplin’s footlights.' },
]

export const names2 = [
  { name: 'Cruceta', lens: 'Spanish', idea: 'The wooden cross a puppeteer holds to work a marionette’s strings. The controls that bring the thing to life.',
    npm: 'free', scope: 'free', gh: 'taken (empty user, 2017) · cruceta-dev, crucetahq free', repos: '17 repos, all ★0', domains: { free: ['.dev', '.studio', '.design', '.tools', '.app', '.io'], taken: ['.com (parked)'] },
    web: 'Only puppetry how-tos. No software.', verdict: 'short' },
  { name: 'Tramoya', lens: 'Spanish', idea: 'Theatre stage machinery: the ropes, pulleys and rigging behind the scenes that make the show work.',
    npm: 'free', scope: 'free', gh: 'taken (empty user, 2016) · tramoya-dev, tramoyahq free', repos: '8 repos, tiny', domains: { free: ['.dev', '.studio', '.design', '.tools', '.io'], taken: ['.com (parked)', '.app (audio stories)'] },
    web: 'Three small GitHub projects use the same metaphor (state machines, demo recording), and tramoya.app is an audio-story site.', verdict: 'short' },
  { name: 'Bastidor', lens: 'Spanish', idea: 'The frame a canvas is stretched on, an embroidery hoop, a car chassis and the theatre wings (“entre bastidores” = behind the scenes). Four meanings, one idea: the frame around the work.',
    npm: 'free', scope: 'free', gh: 'taken (empty org, 2014) · bastidorhq free', repos: '72 repos, tiny', domains: { free: ['.dev', '.studio', '.design', '.tools', '.io'], taken: ['.com (embroidery shop)', '.app'] },
    web: 'O Bastidor, a Brazilian news app. Nothing in design tools.', verdict: 'short' },
  { name: 'Periaktos', lens: 'History', idea: 'A Greek stage device: a three-sided prism you turn to change the scene. The original preset switcher, and Vitruvius described it.',
    npm: 'free', scope: 'free', gh: 'free', repos: '1 repo, ★0', domains: { free: ['.dev', '.studio', '.design', '.tools'], taken: ['.com (parked)'] },
    web: 'Nothing found. It is hard to spell and to say.', verdict: 'short' },
  { name: 'Juanelo', lens: 'Inventors', idea: 'Juanelo Turriano, clockmaker to Charles V. He built automata (a lute-playing lady that walks and tilts her head) and the Artificio that lifted the Tagus up to Toledo.',
    npm: 'free', scope: 'taken (empty, no packages) · use juanelo unscoped', gh: 'taken (empty user, 2012) · juanelo-dev, juanelohq free', repos: '24 repos, all tiny', domains: { free: ['.studio', '.design', '.tools', '.app'], taken: ['.com', '.dev'] },
    web: 'Fundación Juanelo Turriano, a history-of-engineering foundation. No software.', verdict: 'short' },
  { name: 'Torelli', lens: 'Inventors', idea: 'Giacomo Torelli, “il gran stregone”. His chariot-and-pole system let one stagehand at one winch change every piece of scenery at once. Presets, in 1641.',
    npm: 'free', scope: 'taken', gh: 'taken (active developer)', repos: '133 repos (surname)', domains: { free: ['.studio', '.design', '.tools'], taken: ['.com', '.dev'] },
    web: 'A common Italian surname, so it’s hard to own in search.', verdict: 'reserve' },
  { name: 'Jazari', lens: 'Inventors', idea: 'Al-Jazari (1136–1206), author of The Book of Knowledge of Ingenious Mechanical Devices. His automata musicians were driven by cams and pegs.',
    npm: 'free', scope: 'free', gh: 'taken (empty user, 2012)', repos: '130 repos (al-jazari livecoding game ★8)', domains: { free: ['.studio', '.design', '.tools'], taken: ['.com', '.dev'] },
    web: 'Nothing big in software. It’s a heritage name, so use it with care and credit.', verdict: 'reserve' },
  { name: 'Telekino', lens: 'Inventors', idea: 'Leonardo Torres Quevedo’s 1903 radio remote control. In 1906 he steered a boat in the Bilbao estuary from the shore.',
    npm: 'free', scope: 'free', gh: 'taken (empty user, 2018) · telekino-dev free', repos: '11 repos, tiny', domains: { free: ['.dev', '.studio', '.design', '.tools'], taken: ['.com', '.app'] },
    web: 'Telekino is a big Argentine lottery (since 1992), and scam casino apps trade on the name. The story is lovely but the association is strong.', verdict: 'pass' },
  { name: 'Marey', lens: 'Inventors', idea: 'Étienne-Jules Marey graphed motion over time, the ancestor of every timeline.',
    npm: 'free', scope: 'free', gh: 'taken (active developer)', repos: '264 repos', domains: { free: ['.design', '.tools', '.app'], taken: ['.com', '.dev', '.studio'] },
    web: 'Marey is Moonvalley’s AI video model, a funded creative-tools product. Out.', verdict: 'pass' },
  { name: 'Maillardet', lens: 'Inventors', idea: 'Henri Maillardet’s drawing automaton (c. 1800) inspired the film Hugo.',
    npm: 'free', scope: 'free', gh: 'free', repos: '3 repos, ★0', domains: { free: ['.dev', '.studio'], taken: ['.com'] },
    web: 'Nothing in software. Hard to spell and to say (my-ar-DAY).', verdict: 'pass' },
  { name: 'Candileja', lens: 'Pop culture', idea: 'Stage footlights. Chaplin’s Limelight was released in Spanish as “Candilejas”.',
    npm: 'free', scope: 'free', gh: 'free', repos: '4 repos, ★0', domains: { free: ['.dev', '.studio'], taken: ['.com'] },
    web: 'Nothing in software. The “j” trips English speakers (can-dee-LEH-ha).', verdict: 'reserve' },
  { name: 'Tramoyista', lens: 'Spanish', idea: 'The stagehand who works the tramoya.', npm: 'free', scope: 'free', gh: 'free', repos: 'none',
    domains: { free: ['.dev', '.studio'], taken: ['.com'] }, web: 'Nothing found, but at ten letters it’s a mouthful.', verdict: 'reserve' },
  { name: 'Atrezo', lens: 'Spanish', idea: 'Props and set dressing. From Italian “attrezzo”, which means tool or equipment.',
    npm: 'free', scope: 'free', gh: 'free', repos: '5 repos, ★0', domains: { free: ['.dev', '.studio', '.design', '.tools', '.app'], taken: ['.com (parked)'] },
    web: 'Atrezzo (double z) is Acentra Health’s care-management platform. It sounds the same and it’s software.', verdict: 'pass' },
  { name: 'Clavija', lens: 'Spanish', idea: 'A guitar’s tuning peg. Turn it till it’s right.', npm: 'free', scope: 'free', gh: 'taken (empty user, 2020)', repos: '5 repos, ★0',
    domains: { free: ['.dev', '.studio'], taken: ['.com'] }, web: 'Nothing in software, but English speakers will say “cla-vi-JA”.', verdict: 'pass' },
  { name: 'Rotula', lens: 'Latin', idea: 'Latin for “little wheel”, which makes it Thumbwheel in Latin.', npm: 'free', scope: '—', gh: 'taken (active personal account)', repos: '168 repos (rotulación noise)',
    domains: { free: ['.studio'], taken: ['.dev'] }, web: 'In English and Spanish anatomy it means the kneecap.', verdict: 'pass' },
  { name: 'Arnés', lens: 'Spanish', idea: 'Literally “harness”.', npm: 'free', scope: '—', gh: 'taken', repos: '417 repos, incl. “arnes-agentes”',
    domains: { free: ['.studio'], taken: ['.dev'] }, web: 'Spanish-speaking devs already say it for agent harnesses, so it’s generic.', verdict: 'pass' },
  { name: 'Maqueta', lens: 'Spanish', idea: 'Spanish for mock-up, scale model, or a band’s demo tape. The closest word to “prototype”.', npm: 'free', scope: '—', gh: 'taken', repos: '13.8k repos (maquetación = web layout)',
    domains: { free: ['.studio'], taken: ['.com', '.dev'] }, web: 'Unsearchable: every Spanish HTML/CSS course says “maquetación”.', verdict: 'pass' },
  { name: 'Frisket', lens: 'History', idea: 'On a hand press, the hinged frame that holds the paper and masks what shouldn’t print.', npm: 'free', scope: '—', gh: 'taken', repos: 'frisket-dev ★16 (active)',
    domains: { free: ['.studio', '.design', '.tools'], taken: ['.com', '.dev', '.app'] }, web: 'Frisket is a live AI-spreadsheet product.', verdict: 'pass' },
  { name: 'Quoin', lens: 'History', idea: 'The wedge that locks type tight in the printer’s frame.', npm: 'free', scope: '—', gh: 'taken', repos: '130 repos (Quoine exchange)',
    domains: { free: [], taken: ['.dev'] }, web: 'People will hear “coin”.', verdict: 'pass' },
  { name: 'Lay figure', lens: 'History', idea: 'The jointed wooden figure painters pose instead of a model.', npm: 'free', scope: '—', gh: 'free', repos: 'none',
    domains: { free: ['.dev'], taken: ['.com'] }, web: 'Nothing found. Reads as two words and is easily misheard.', verdict: 'pass' },
  { name: 'Greeble', lens: 'Pop culture', idea: 'The ILM model-makers’ word for the fiddly surface detail on Star Wars ships.', npm: 'free', scope: '—', gh: 'taken', repos: 'Greebler ★184',
    domains: { free: [], taken: ['.dev', '.studio'] }, web: 'Means decoration, not control. Taken in 3D tooling.', verdict: 'pass' },
  { name: 'Orrery', lens: 'History', idea: 'A clockwork model of the solar system you turn by hand. A working model with controls.', npm: 'taken', scope: 'taken', gh: 'taken', repos: '879 repos',
    domains: { free: [], taken: [] }, web: 'Taken.', verdict: 'taken' },
  { name: 'Pantograph', lens: 'History', idea: 'A linkage that copies a drawing at another scale (batch export, in brass).', npm: 'taken', scope: '—', gh: 'free', repos: 'PyPantograph ★148',
    domains: { free: [], taken: [] }, web: 'Taken on npm.', verdict: 'taken' },
  { name: 'Waldo', lens: 'Pop culture', idea: 'From Heinlein’s 1942 story to Henson’s digital puppetry: the hand controls that drive a puppet remotely.', npm: 'taken', scope: '—', gh: 'taken', repos: '3.9k repos',
    domains: { free: [], taken: [] }, web: 'Also “Where’s Waldo”.', verdict: 'taken' },
  { name: 'Esper', lens: 'Pop culture', idea: 'Deckard’s photo machine in Blade Runner. “Enhance.”', npm: 'taken', scope: '—', gh: 'taken', repos: 'espertech/esper ★876',
    domains: { free: [], taken: [] }, web: 'Taken.', verdict: 'taken' },
  { name: 'Alidade', lens: 'History', idea: 'The rotating sight on an astrolabe.', npm: 'taken', scope: '—', gh: 'taken', repos: '28 repos',
    domains: { free: [], taken: [] }, web: 'Taken.', verdict: 'taken' },
]

export const alsoChecked2 = ['Atril (music stand)', 'Ensayo (rehearsal)', 'Plantilla (template/jig)', 'Pollex (Latin: thumb)', 'Pulgar (thumb)', 'Diapasón (tuning fork)',
  'Ingenio / Ingenium (engine, ingenuity)', 'Opifex / Artifex (maker)', 'Vectis (lever)', 'Norma (carpenter’s square)', 'Tablero (board)', 'Cardo (hinge)', 'Tempera',
  'Libella (little balance)', 'Templa', 'Templador (tuning key)', 'Afina / Afinador (tune / tuner)', 'Sargento (F-clamp)', 'Aparejo (rigging)', 'Apuntador (prompter)',
  'Telón (curtain)', 'Turriano', 'Ingegno (Brunelleschi’s stage machines)', 'Sabbatini (1638 stage-machine manual)', 'Vaucanson', 'Archytas', 'Ctesibius', 'Loutherbourg (Eidophusikon)',
  'Reynaud / Praxinoscope', 'Reiniger', 'Camarena', 'Heron (taken)', 'Muybridge (taken)', 'Houdin (taken)', 'Bambalina (border curtain)', 'Perilla (knob)', 'Mahlstick', 'Mechane', 'Tenter', 'Tympan', 'Heddle', 'Kitbash', 'Okudagram', 'Bilancino (Italian marionette control)']

export const shortlist2 = [
  {
    id: 'cruceta', name: 'Cruceta', recommended: true, say: 'kroo-SEH-ta', short: 'The controls that bring it to life',
    why: 'This is the cleanest story in either round. A marionette control doesn’t make the puppet, it makes the puppet move. That’s the whole product: we don’t build your prototype, we give it the controls. It’s Spanish, short, and says itself in English. Every check came back clean: npm, the scope, six domains and no software using the name.',
    watch: 'The GitHub handle is held by an empty account from 2017, so you’d use cruceta-dev or claim it through GitHub’s name-squatting policy. The word is unfamiliar to English speakers, so the mark has to do the explaining (it does).',
    font: { family: '"Young Serif", Georgia, serif', weight: 400, tracking: '-0.01em', case: 'title', label: 'Young Serif' },
    colors: { light: { ink: '#1B1A17', acc: '#D2452F', bg: '#F2EDE3' }, dark: { ink: '#F2EDE3', acc: '#FF6B52', bg: '#1B1A17' } },
    palette: [{ name: 'Ink', hex: '#1B1A17' }, { name: 'Linen', hex: '#F2EDE3' }, { name: 'Títere red', hex: '#D2452F' }, { name: 'Thread', hex: '#B9AE9C' }, { name: 'Pine', hex: '#C89B6D' }],
    taglines: ['Pull the strings.', 'Your prototype, with strings attached.', 'The controls that bring it to life.'],
    handle: 'cruceta-dev', domain: 'cruceta.dev',
  },
  {
    id: 'tramoya', name: 'Tramoya', recommended: false, say: 'tra-MOY-a', short: 'The machinery behind the show',
    why: 'Of all the candidates, this describes the product most completely: all the machinery behind the show, out of sight, so the work gets the stage. It sits in the same family as Wingspace but it’s a richer, rarer word, and it’s yours if you want a Spanish root.',
    watch: 'Other developers are reaching for the same metaphor (three small GitHub projects in 2026, and tramoya.app is an audio-story site). In Spanish it can also mean “a scheme”, though that reading is mild.',
    font: { family: '"Schibsted Grotesk", "Inter", sans-serif', weight: 800, tracking: '-0.035em', case: 'lower', label: 'Schibsted Grotesk ExtraBold' },
    colors: { light: { ink: '#121212', acc: '#C77800', bg: '#F1EEE8' }, dark: { ink: '#F1EEE8', acc: '#FFB547', bg: '#121212' } },
    palette: [{ name: 'Black box', hex: '#121212' }, { name: 'Paper', hex: '#F1EEE8' }, { name: 'Work light', hex: '#FFB547' }, { name: 'Hemp', hex: '#C6A46A' }, { name: 'Steel', hex: '#7D8590' }],
    taglines: ['The machinery behind the show.', 'Backstage for your prototype.', 'All the rigging. None of the noise.'],
    handle: 'tramoya-dev', domain: 'tramoya.dev',
  },
  {
    id: 'bastidor', name: 'Bastidor', recommended: false, say: 'bas-tee-DOR', short: 'The frame around the work',
    why: 'Four meanings and every one fits: the stretcher a painter tightens a canvas on, the embroidery hoop, a car chassis and the theatre wings. All of them are the frame that holds someone else’s work. “Entre bastidores” means behind the scenes.',
    watch: 'bastidor.com is an embroidery shop and the GitHub org is empty but held (bastidorhq is free). In English it sounds a little like “matador”. The hoop mark is a first draft and can read as a stopwatch.',
    font: { family: '"Fraunces", Georgia, serif', weight: 600, tracking: '-0.02em', case: 'lower', label: 'Fraunces SemiBold' },
    colors: { light: { ink: '#1D1B19', acc: '#2F3E8F', bg: '#EFE8DA' }, dark: { ink: '#EFE8DA', acc: '#8E9CFF', bg: '#1D1B19' } },
    palette: [{ name: 'Ink', hex: '#1D1B19' }, { name: 'Linen', hex: '#EFE8DA' }, { name: 'Indigo thread', hex: '#2F3E8F' }, { name: 'Beech', hex: '#D9B98C' }, { name: 'Madder', hex: '#A33B2A' }],
    taglines: ['The frame around the work.', 'Hold it taut. Make it sing.', 'Behind the scenes of every prototype.'],
    handle: 'bastidorhq', domain: 'bastidor.dev',
  },
  {
    id: 'juanelo', name: 'Juanelo', recommended: false, say: 'hwah-NEH-lo', short: 'The inventor who made machines move',
    why: 'A real person and a real story. Charles V brought Juanelo Turriano to Spain as court clockmaker. In retirement he built small automata to lift the emperor’s moods, including a lady who walks and plays the lute. He also built the Artificio, which carried water from the Tagus up to Toledo. It’s a warm, friendly name (it means “little Juan”), and nobody in software has it.',
    watch: 'juanelo.com and .dev are taken, and the @juanelo npm scope exists (empty), so you’d ship as plain juanelo on juanelo.studio. English speakers may say “joo-an-ELL-o” until they hear it.',
    font: { family: '"EB Garamond", Georgia, serif', weight: 500, tracking: '-0.01em', case: 'title', label: 'EB Garamond Medium' },
    colors: { light: { ink: '#1A1714', acc: '#9C6F1A', bg: '#EFE8DA' }, dark: { ink: '#EFE8DA', acc: '#D9A84A', bg: '#1A1714' } },
    palette: [{ name: 'Ink', hex: '#1A1714' }, { name: 'Toledo stone', hex: '#EFE8DA' }, { name: 'Brass', hex: '#B8892E' }, { name: 'Tajo green', hex: '#2E5E55' }, { name: 'Clock face', hex: '#FAF7F0' }],
    taglines: ['Machines that make things move.', 'Wind it up. Watch it go.', 'Automata for the prototype age.'],
    handle: 'juanelohq', domain: 'juanelo.studio',
  },
  {
    id: 'periaktos', name: 'Periaktos', recommended: false, say: 'peh-ree-AK-tos', short: 'Turn it to change the scene',
    why: 'This is the deep cut. Greek theatres had three-sided prisms with a different scene painted on each face, and a stagehand turned them to change the scene. That’s presets and A/B switching, about 2,000 years early. It’s free on every check, and nobody else will have it.',
    watch: 'It’s hard to spell and to say, so people will have to see it written before they can find it. Best if you want the brand to feel scholarly. The triangle-and-dot draft edges towards a warning sign or the all-seeing eye, so it needs another pass.',
    font: { family: '"Marcellus", Georgia, serif', weight: 400, tracking: '0.01em', case: 'title', label: 'Marcellus' },
    colors: { light: { ink: '#191817', acc: '#C0562F', bg: '#EEEBE5' }, dark: { ink: '#EEEBE5', acc: '#E07650', bg: '#191817' } },
    palette: [{ name: 'Ink', hex: '#191817' }, { name: 'Marble', hex: '#EEEBE5' }, { name: 'Terracotta', hex: '#C0562F' }, { name: 'Olive', hex: '#6E7346' }, { name: 'Aegean', hex: '#1F5C8C' }],
    taglines: ['Turn it to change the scene.', 'Every side of your idea.', 'Ancient stagecraft, modern tools.'],
    handle: 'periaktos', domain: 'periaktos.dev',
  },
]

/** stories worth borrowing for copy, motifs or a launch post — whatever the name */
export const stories = [
  { title: 'Spline ducks', era: 'Shipyards and drafting rooms, 1700s to 1970s', body: 'Draughtsmen bent a thin strip (the spline) around lead weights called ducks to draw smooth curves. The ducks held the curve while the designer adjusted it. That’s our curve editor, in lead.' },
  { title: 'The waldo', era: 'Heinlein, 1942 → Henson, 1989', body: 'Heinlein’s story “Waldo” named the remote hand controls. Jim Henson’s team later used a waldo to perform Waldo C. Graphic, one of TV’s first real-time digital puppets.' },
  { title: 'Okudagrams', era: 'Star Trek: The Next Generation, 1987', body: 'Michael Okuda designed the LCARS control panels so they looked usable at a glance on screen. That’s presentation-grade chrome, in prop form.' },
  { title: 'Kitbashing', era: 'ILM model shop, Star Wars, 1977', body: 'Model-makers built starships from parts of off-the-shelf kits. Installing component by component has a lineage.' },
  { title: 'Candilejas', era: 'Chaplin, Limelight, 1952', body: 'The Spanish title was “Candilejas”, the footlights. Present mode is the footlights.' },
  { title: 'Torelli’s one winch', era: 'Venice and Paris, 1641–1645', body: 'Giacomo Torelli tied every wing and shutter to one drum under the stage. One stagehand turned it, the whole scene changed in view of the audience, and they called him the great sorcerer. That’s a preset.' },
  { title: 'The Telekino', era: 'Torres Quevedo, 1903–1906', body: 'A Spanish engineer sent coded radio commands to steer a boat full of people around the Bilbao estuary from the shore. The first remote control, and our bridge, in spirit.' },
  { title: 'The lute-playing lady', era: 'Juanelo Turriano, 1550s', body: 'In retirement, Charles V’s clockmaker built tiny automata to cheer him up. The lute-playing lady attributed to him walks, turns her head and plays.' },
  { title: 'Deus ex machina', era: 'Greek theatre, 5th c. BC', body: 'The mechane was a crane that lowered gods onto the stage. Machinery has always been part of the show.' },
  { title: 'The man behind the curtain', era: 'The Wizard of Oz, 1939', body: '“Pay no attention to the man behind the curtain.” Good chrome gets out of the way of the show.' },
]

/* ---------------------------------------------------------------------------
   Round 3 — cute prefixes, toys, fictional makers. Checked 9 Oct 2026, same method.
--------------------------------------------------------------------------- */

export const round3Lenses = [
  { title: 'Cute prefixes', body: 'lil-, lite- and the Spanish diminutive -ita. “Lite” reads as the cut-down edition, so it’s out. “lil” is cute but echoes lil-gui, a panel we position against.' },
  { title: 'Toys', body: 'Things you fiddle with for the joy of it: spinning tops, cup-and-ball, pinwheels, the toddler’s busy board of knobs and switches.' },
  { title: 'Fictional makers', body: 'Characters who built things that came alive: Geppetto, Drosselmeyer, Coppélius, Pygmalion, Daedalus, Professor Calculus.' },
]

export const names3 = [
  { name: 'Trompo', lens: 'Toys', idea: 'The Latin American spinning top: wind the string, throw, and it comes alive. In Mexico it’s also the spit that turns tacos al pastor.',
    npm: 'free', scope: 'free', gh: 'taken (empty user, 2009) · trompo-dev, trompohq free', repos: '56 repos, tiny', domains: { free: ['.dev', '.studio', '.design', '.tools', '.io'], taken: ['.com', '.app'] },
    web: 'Trompo App is a small Spanish food-delivery app, and Twisted Trompo is a restaurant app. Different worlds, but it’s not empty.', verdict: 'short' },
  { name: 'Ruedita', lens: 'Cute prefixes', idea: '“Little wheel”: the lil- idea done the Spanish way, and Thumbwheel’s cute cousin.',
    npm: 'free', scope: 'free', gh: 'taken (empty user, 2024) · ruedita-dev, rueditahq free', repos: '86 repos, tiny', domains: { free: ['.dev', '.studio', '.design', '.tools', '.io'], taken: ['.com', '.app'] },
    web: 'Nothing named Ruedita in software (Ruedata is a tyre platform).', verdict: 'short' },
  { name: 'Lilknob', lens: 'Cute prefixes', idea: 'Exactly what it says: a lil knob.',
    npm: 'free', scope: 'free', gh: 'free', repos: 'none', domains: { free: ['.com', '.dev', '.studio', '.app'], taken: [] },
    web: 'Nothing found, and it’s the only name with the .com free and every check clean. But “lil” sits right next to lil-gui.', verdict: 'short' },
  { name: 'Tornasol', lens: 'Fictional makers', idea: 'Professor Calculus’s Spanish name in Tintin (Silvestre Tornasol), the inventor of the series. As a word it’s the shimmer of colour that shifts as you turn something, as well as litmus and sunflower.',
    npm: 'free', scope: 'free', gh: 'taken (user, 2016) · tornasol-dev, tornasolhq free', repos: '31 repos, tiny', domains: { free: ['.dev', '.studio', '.design', '.tools', '.io'], taken: ['.com', '.app'] },
    web: 'Tornasol Studio is a Madrid product-design collective, and there’s a small caregiving app. Lean on the everyday word, not on Tintin.', verdict: 'short' },
  { name: 'Lildial', lens: 'Cute prefixes', idea: 'A lil dial.', npm: 'free', scope: 'free', gh: 'free', repos: 'none',
    domains: { free: ['.com', '.dev', '.app'], taken: [] }, web: 'All clear, but it has the same lil-gui echo.', verdict: 'reserve' },
  { name: 'Drosselmeyer', lens: 'Fictional makers', idea: 'The Nutcracker’s godfather: a clockmaker and inventor who built every mechanical toy in the house, and fixed the nutcracker.',
    npm: 'free', scope: '—', gh: 'taken (active user)', repos: '72 repos', domains: { free: ['.dev', '.studio'], taken: ['.com'] },
    web: 'Nothing in software. At twelve letters with a German spelling, it’s a lot to type.', verdict: 'reserve' },
  { name: 'Busyboard', lens: 'Toys', idea: 'The toddler’s board of knobs, latches and switches, made to be fiddled with.', npm: 'free', scope: 'free', gh: 'taken (empty, 2011)', repos: '48 repos, tiny',
    domains: { free: ['.dev', '.studio'], taken: ['.com'] }, web: 'Nothing big. But “busy” fights the calm-chrome promise.', verdict: 'reserve' },
  { name: 'Perillita', lens: 'Cute prefixes', idea: '“Little knob” in Spanish.', npm: 'free', scope: '—', gh: 'free', repos: 'none',
    domains: { free: ['.com', '.dev'], taken: [] }, web: 'Clean, but hard to say in English (peh-ree-YEE-ta).', verdict: 'reserve' },
  { name: 'Juguetero', lens: 'Toys', idea: 'Spanish for toymaker.', npm: 'free', scope: '—', gh: 'taken', repos: '2 repos',
    domains: { free: ['.dev', '.studio'], taken: ['.com'] }, web: 'Nothing in software, but it’s long and hard for English speakers.', verdict: 'reserve' },
  { name: 'Balero', lens: 'Toys', idea: 'The cup-and-ball toy. In Mexico it also means a ball bearing.', npm: 'free', scope: 'free', gh: 'taken (empty, 2010)', repos: '60 repos',
    domains: { free: ['.studio', '.design', '.tools', '.app', '.io'], taken: ['.com', '.dev'] }, web: 'Balero Labs is a Uruguayan software company, and there’s also a Balero Ventures.', verdict: 'pass' },
  { name: 'Teetotum', lens: 'Toys', idea: 'An old spinning top with letters on its sides: spin it, and the face it lands on decides.', npm: 'free', scope: 'taken', gh: 'taken (active developer)', repos: '17 repos',
    domains: { free: ['.dev', '.studio'], taken: ['.com'] }, web: 'Hard to say and the scope is taken.', verdict: 'pass' },
  { name: 'Rehilete', lens: 'Toys', idea: 'The Mexican pinwheel.', npm: 'free', scope: '—', gh: 'taken (Estudio Mixtli)', repos: '8 repos',
    domains: { free: ['.dev', '.studio'], taken: ['.com'] }, web: 'A design studio holds the handle, and it’s hard to say.', verdict: 'pass' },
  { name: 'Papalote', lens: 'Toys', idea: 'The Mexican word for kite.', npm: 'free', scope: '—', gh: 'taken', repos: '58 repos',
    domains: { free: [], taken: [] }, web: 'Papalote Museo del Niño is the big children’s museum in Mexico City.', verdict: 'pass' },
  { name: 'Perinola', lens: 'Toys', idea: 'The Mexican teetotum (“toma todo”).', npm: 'free', scope: '—', gh: 'taken', repos: '55 repos',
    domains: { free: [], taken: [] }, web: 'It’s rude slang in some countries.', verdict: 'pass' },
  { name: 'Knobby', lens: 'Cute prefixes', idea: 'Cute knob.', npm: 'free', scope: '—', gh: 'taken', repos: 'svelte-knobby ★202, knobby ★215',
    domains: { free: [], taken: [] }, web: 'svelte-knobby is a tuning-panel library in our exact space. Out.', verdict: 'pass' },
  { name: 'Coppelius', lens: 'Fictional makers', idea: 'The toymaker in the ballet Coppélia, whose doll seems alive.', npm: 'free', scope: '—', gh: 'taken', repos: 'CoppeliaSim (robotics) ★152',
    domains: { free: [], taken: [] }, web: 'CoppeliaSim is a well-known robot simulator, and Hoffmann’s original Coppelius is sinister.', verdict: 'pass' },
  { name: 'Gearloose', lens: 'Fictional makers', idea: 'Gyro Gearloose, Disney’s inventor.', npm: 'free', scope: '—', gh: 'taken', repos: '18 repos',
    domains: { free: [], taken: [] }, web: 'This is a Disney character, so don’t.', verdict: 'pass' },
  { name: 'Geppetto', lens: 'Fictional makers', idea: 'Pinocchio’s woodcarver, who made a puppet that came alive.', npm: 'taken', scope: '—', gh: 'taken', repos: '341 repos',
    domains: { free: [], taken: [] }, web: 'Several AI products already use Gepetto/Geppetto.', verdict: 'taken' },
  { name: 'Pygmalion', lens: 'Fictional makers', idea: 'The sculptor whose statue came to life.', npm: 'taken', scope: '—', gh: 'taken', repos: '186 repos',
    domains: { free: [], taken: [] }, web: 'Taken.', verdict: 'taken' },
  { name: 'Daedalus', lens: 'Fictional makers', idea: 'The myth’s master craftsman: the labyrinth, the wings.', npm: 'taken', scope: '—', gh: 'taken', repos: '2k repos',
    domains: { free: [], taken: [] }, web: 'Taken many times over.', verdict: 'taken' },
]

export const alsoChecked3 = ['Lilrig', 'Lilstudio', 'Lilwheel', 'Lilthumb', 'Lilstage', 'Lilfader', 'Liltweak', 'Lilscrub', 'Lilknobs', 'Litestudio', 'Literig', 'Litedial', 'Litejig',
  'Tinyknob', 'Weeknob', 'Knoblet', 'Knobble (Knobbler controller)', 'Palanquita', 'Twiddle', 'Twiddly', 'Nudgy', 'Slidey', 'Fiddly', 'Doohickey', 'Thingamajig', 'Whirligig',
  'Pinwheel', 'Zoetrope', 'Thaumatrope', 'Windup', 'Jumpingjack', 'Playset', 'Kendama', 'Hurdy-gurdy', 'Tinbot', 'Bobble', 'Gepeto', 'Drossel', 'Coppelia', 'Ilmarinen',
  'Weland', 'Luthier', 'Rumpel', 'Penelope']

export const shortlist3 = [
  {
    id: 'trompo', name: 'Trompo', recommended: true, say: 'TROM-po', short: 'Wind it, throw it, watch it spin',
    why: 'This is the cute name that still sounds like a product. Six letters, two syllables, easy in English, and a toy every Latin American kid knows. The spinning top is a lovely metaphor for a prototype: inert in your hand, alive once you give it a spin. The mark draws itself.',
    watch: 'A small Spanish food-delivery app and a restaurant ordering app use “Trompo”, so you’d need to own it in design-tool search. Some people will think of tacos al pastor first, which might be a plus.',
    font: { family: '"Gabarito", "Inter", sans-serif', weight: 800, tracking: '-0.035em', case: 'lower', label: 'Gabarito ExtraBold (chosen 9 Oct; explored in Fredoka)' },
    colors: { light: { ink: '#1C1A19', acc: '#D1006F', bg: '#F6F1EA' }, dark: { ink: '#F6F1EA', acc: '#FF3EA5', bg: '#1C1A19' } },
    palette: [{ name: 'Ink', hex: '#1C1A19' }, { name: 'Paper', hex: '#F6F1EA' }, { name: 'Rosa mexicano', hex: '#E4007C' }, { name: 'Wood', hex: '#C58B4E' }, { name: 'Turquesa', hex: '#1E9AA0' }],
    taglines: ['Give it a spin.', 'Wind it up. Let it go.', 'Every prototype wants to spin.'],
    handle: 'trompo-dev', domain: 'trompo.dev',
  },
  {
    id: 'ruedita', name: 'Ruedita', recommended: false, say: 'rweh-DEE-ta', short: 'The lil wheel',
    why: 'This is the “lil” brief done in Spanish, without the lil-gui echo. It literally means little wheel, so it’s Thumbwheel’s friendlier cousin, and it’s clean in software. The diminutive makes it affectionate rather than technical.',
    watch: 'English speakers will need to hear it once. .com and .app are taken, but .dev, .studio, .design, .tools and .io are free.',
    font: { family: '"Nunito", "Inter", sans-serif', weight: 800, tracking: '-0.02em', case: 'lower', label: 'Nunito ExtraBold' },
    colors: { light: { ink: '#1A1B1F', acc: '#E0A800', bg: '#F5F1E8' }, dark: { ink: '#F5F1E8', acc: '#F5C84B', bg: '#1A1B1F' } },
    palette: [{ name: 'Ink', hex: '#1A1B1F' }, { name: 'Cream', hex: '#F5F1E8' }, { name: 'Butter', hex: '#F5C84B' }, { name: 'Tomato', hex: '#F0533A' }, { name: 'Sky', hex: '#5AA9E6' }],
    taglines: ['Roll it till it’s right.', 'A lil wheel for every value.', 'Small wheel. Big studio.'],
    handle: 'ruedita-dev', domain: 'ruedita.dev',
  },
  {
    id: 'lilknob', name: 'Lilknob', recommended: false, say: 'LIL-nob', short: 'A lil knob',
    why: 'This is the cleanest name in all three rounds: npm, scope, GitHub, .com, .dev, .studio and .app are all free. It’s instantly understood, impossible to misspell and plainly cute. The mark is a knob that smiles back.',
    watch: 'lil-gui is one of the debug panels we position against, so “lil” invites the comparison. And in British English “knob” is a mild insult, which is the same problem Knobwork had in round 1.',
    font: { family: '"Sniglet", "Inter", sans-serif', weight: 800, tracking: '-0.01em', case: 'lower', label: 'Sniglet ExtraBold' },
    colors: { light: { ink: '#1B1C1A', acc: '#149E72', bg: '#F2F4EE' }, dark: { ink: '#F2F4EE', acc: '#4BE0AE', bg: '#1B1C1A' } },
    palette: [{ name: 'Ink', hex: '#1B1C1A' }, { name: 'Paper', hex: '#F2F4EE' }, { name: 'Mint', hex: '#3CCB9A' }, { name: 'Peach', hex: '#FFB59A' }, { name: 'Pebble', hex: '#B9BCB4' }],
    taglines: ['Turn it up a lil.', 'Lil knobs, big tools.', 'Every prototype needs a lil knob.'],
    handle: 'lilknob', domain: 'lilknob.com',
  },
  {
    id: 'tornasol', name: 'Tornasol', recommended: false, say: 'tor-na-SOL', short: 'Colour that shifts as you turn it',
    why: 'Fans know it as Professor Calculus’s Spanish name in Tintin, the series’ absent-minded inventor. Everyone else hears the everyday word: “tornasolado” is the iridescent shimmer that changes as you turn something. That’s a design tool in one word, and it says itself in English.',
    watch: 'Tornasol Studio, a Madrid product-design collective, shares the name, so it overlaps with the design world. Don’t lean on Tintin, because the Hergé estate is famously protective. Sell the shimmer, not the professor.',
    font: { family: '"Syne", "Inter", sans-serif', weight: 700, tracking: '-0.02em', case: 'lower', label: 'Syne Bold' },
    colors: { light: { ink: '#161616', acc: '#0E6E7E', acc2: '#C2368F', bg: '#F3F1EC' }, dark: { ink: '#F3F1EC', acc: '#2BB3C4', acc2: '#F062B5', bg: '#161616' } },
    palette: [{ name: 'Ink', hex: '#161616' }, { name: 'Paper', hex: '#F3F1EC' }, { name: 'Petrol', hex: '#0E6E7E' }, { name: 'Magenta', hex: '#C2368F' }, { name: 'Gold', hex: '#E5B53A' }],
    taglines: ['Turn it. Watch it change.', 'Every angle of your idea.', 'Design that shifts in the light.'],
    handle: 'tornasol-dev', domain: 'tornasol.dev',
  },
]

export const stories3 = [
  { title: 'Penelope’s loom', era: 'The Odyssey', body: 'She wove a shroud by day and unpicked it by night to keep her suitors waiting. The oldest undo in literature.' },
  { title: 'Drosselmeyer’s castle', era: 'Hoffmann, 1816', body: 'The godfather clockmaker builds a clockwork castle where tiny figures walk the halls. The children love it for a minute, then want to change what the figures do. Every client demo, ever.' },
  { title: 'The busy board', era: 'Every toddler’s bedroom', body: 'A plank of knobs, latches and switches whose only job is to be fiddled with. Fiddling is how you learn what a thing can do.' },
]

/* ---------------------------------------------------------------------------
   Round 4 — the Thumbwheel idea in a shorter word. Checked 9 Oct 2026.
--------------------------------------------------------------------------- */

/** Rafael's favourites so far, in his order */
export const favourites = ['trompo', 'thumbwheel', 'periaktos', 'jigwork']

export const names4 = [
  { name: 'Molette', lens: 'French', idea: 'The French word for a thumbwheel: the knurled wheel on a lighter, a camera, a mouse’s scroll wheel, an adjustable wrench (clé à molette).',
    npm: 'free', scope: 'free', gh: 'taken (empty user, 2018) · molette-dev, molettehq free', repos: '15 repos, all ★0', domains: { free: ['.dev', '.studio', '.design', '.tools', '.io'], taken: ['.com', '.app'] },
    web: 'Nothing in software.', verdict: 'short' },
  { name: 'Knurly', lens: 'Coined', idea: 'From knurl, the ridged grip on a thumbwheel or a barbell. Sounds like “gnarly”.',
    npm: 'free', scope: 'free', gh: 'free', repos: '2 repos, ★0', domains: { free: ['.dev', '.studio', '.design', '.tools', '.app'], taken: ['.com (weightlifting apparel)', '.io'] },
    web: 'A small weightlifting apparel brand. No software.', verdict: 'short' },
  { name: 'Trimwheel', lens: 'English', idea: 'The wheel pilots roll to fine-tune an aircraft’s pitch.', npm: 'free', scope: '—', gh: 'taken', repos: 'TrimWheel ★9',
    domains: { free: ['.dev'], taken: ['.com'] }, web: 'Nine letters, so it’s barely shorter.', verdict: 'reserve' },
  { name: 'Roldana', lens: 'Spanish', idea: 'A grooved little wheel or pulley sheave.', npm: 'free', scope: '—', gh: 'taken (user)', repos: '27 repos',
    domains: { free: ['.dev', '.studio'], taken: [] }, web: 'It reads as a person’s name to most people.', verdict: 'pass' },
  { name: 'Rotella', lens: 'Italian', idea: 'Italian for little wheel, and the mouse scroll wheel.', npm: 'free', scope: '—', gh: 'taken', repos: '35 repos',
    domains: { free: [], taken: [] }, web: 'Shell Rotella is a major motor-oil brand. Out.', verdict: 'pass' },
  { name: 'JogDial', lens: 'English', idea: 'The jog/shuttle wheel on video decks: scrubbing, literally.', npm: 'free', scope: '—', gh: 'taken', repos: 'JogDial.js ★81',
    domains: { free: [], taken: [] }, web: 'JogDial.js is already a JS dial library.', verdict: 'pass' },
  { name: 'Rueda', lens: 'Spanish', idea: 'Wheel.', npm: 'free', scope: '—', gh: 'taken', repos: '2k repos (surname)',
    domains: { free: [], taken: [] }, web: 'It’s a common surname, so it’s hard to own in search. Ruedita (round 3) is the cuter form, and Latin Americans already call the mouse scroll wheel “la ruedita”.', verdict: 'pass' },
  { name: 'Knurl', lens: 'English', idea: 'The texture itself.', npm: 'taken', scope: '—', gh: 'taken', repos: 'knurling-rs',
    domains: { free: [], taken: [] }, web: 'Taken (round 1).', verdict: 'taken' },
  { name: 'Rowel', lens: 'English', idea: 'The little spiked wheel on a spur.', npm: 'taken', scope: '—', gh: 'taken', repos: 'fwdai/rowel ★950',
    domains: { free: [], taken: [] }, web: 'Taken.', verdict: 'taken' },
]

export const alsoChecked4 = ['Thumbl', 'Thumbie', 'Tumbl', 'Duim (Dutch: thumb)', 'Notchy', 'Trundle', 'Jogwheel', 'Rotelle']

export const shortlist4 = [
  {
    id: 'molette', name: 'Molette', recommended: true, say: 'mo-LET', short: 'Thumbwheel, in French',
    why: 'It’s the same object and the same idea in seven letters. The French have one word for every knurled wheel you roll with a thumb: the lighter, the camera dial, the mouse scroll wheel, the adjustable wrench. It sounds soft and a little chic, which makes it feel more like Paper or Rive than a hardware part. Everything that matters is free.',
    watch: 'English speakers will meet it as a new word. That’s easy (mo-LET, like roulette), but the site has to tell the story once. molette.com and .app are taken, so you’d launch on molette.dev.',
    font: { family: '"Gabarito", "Inter", sans-serif', weight: 700, tracking: '-0.03em', case: 'lower', label: 'Gabarito Bold' },
    colors: { light: { ink: '#17181B', acc: '#2443D6', bg: '#F3F1EC' }, dark: { ink: '#F3F1EC', acc: '#7D93FF', bg: '#17181B' } },
    palette: [{ name: 'Ink', hex: '#17181B' }, { name: 'Paper', hex: '#F3F1EC' }, { name: 'Bleu outremer', hex: '#2443D6' }, { name: 'Steel', hex: '#8C929B' }, { name: 'Spark', hex: '#FF6A2B' }],
    taglines: ['Roll it till it’s right.', 'Fine-tune anything.', 'One wheel. Every value.'],
    handle: 'molette-dev', domain: 'molette.dev',
  },
  {
    id: 'knurly', name: 'Knurly', recommended: false, say: 'NUR-lee', short: 'The grip under your thumb',
    why: 'This one has the most attitude. Knurling is the cross-hatched grip on a thumbwheel, so the name keeps the concept, and it reads like “gnarly”, which gives it a skate-shop energy the others don’t have. It’s six letters, and npm, scope and GitHub are all free.',
    watch: 'The silent K will be said both ways, which is fine for a playful brand. knurly.com is a small weightlifting-apparel brand.',
    font: { family: '"Archivo Black", "Inter", sans-serif', weight: 400, tracking: '-0.02em', case: 'lower', label: 'Archivo Black' },
    colors: { light: { ink: '#151515', acc: '#D3302A', bg: '#F2F2EF' }, dark: { ink: '#F2F2EF', acc: '#FF5A4E', bg: '#151515' } },
    palette: [{ name: 'Ink', hex: '#151515' }, { name: 'Chalk', hex: '#F2F2EF' }, { name: 'Iron', hex: '#5B6068' }, { name: 'Plate red', hex: '#E23B2E' }, { name: 'Bar yellow', hex: '#F2C230' }],
    taglines: ['Get a grip on your prototype.', 'Fine-tuning, with grip.', 'Pretty knurly.'],
    handle: 'knurly', domain: 'knurly.dev',
  },
]

/* ---------------------------------------------------------------------------
   Round 5 — a general search, steered by the favourites. Checked 9 Oct 2026.
--------------------------------------------------------------------------- */

export const names5 = [
  { name: 'Turnwork', lens: 'Workshop', idea: 'Turning: shaping wood on a lathe. It’s also what a trompo does, what a periaktos does and what a thumbwheel does. One word under all four favourites.',
    npm: 'free', scope: 'free', gh: 'free', repos: '2 repos, ★0', domains: { free: ['.dev', '.studio', '.app'], taken: ['.com (held, nothing public)'] },
    web: 'Nothing named Turnwork. Neighbours are “Turn” products (an ERP, background checks), but they’re a different word.', verdict: 'short' },
  { name: 'Pegtop', lens: 'Toys', idea: 'The English name for the pear-shaped string top, the trompo’s cousin.', npm: 'free', scope: 'free', gh: 'taken (user, 7 repos) · pegtop-dev free', repos: 'none',
    domains: { free: ['.dev', '.studio'], taken: ['.com'] }, web: 'Nothing in software. A fallback if Trompo’s food-app neighbours bother you.', verdict: 'reserve' },
  { name: 'Peonza', lens: 'Toys', idea: 'Spain’s word for a spinning top.', npm: 'free', scope: 'free', gh: 'free', repos: '5 repos, tiny',
    domains: { free: ['.dev', '.studio'], taken: ['.com', '.app'] }, web: 'Nothing found. Less punchy than Trompo, and Latin Americans say trompo.', verdict: 'reserve' },
  { name: 'Stagework', lens: 'Workshop', idea: 'Jigwork’s theatre cousin.', npm: 'free', scope: '—', gh: 'free', repos: '23 repos, tiny',
    domains: { free: ['.dev', '.studio'], taken: ['.com'] }, web: 'Generic, so it’s hard to own in search.', verdict: 'reserve' },
  { name: 'Twirly', lens: 'Toys', idea: 'Cute spin.', npm: 'free', scope: 'free', gh: 'taken (empty, 2016)', repos: 'twirly ★26, qiskit twirly',
    domains: { free: ['.dev', '.studio'], taken: ['.app'] }, web: 'Too generic and cute to carry a pro tool.', verdict: 'pass' },
  { name: 'Telari', lens: 'History', idea: 'Probably the Italian Renaissance name for periaktos-style turning prisms (the Brockett-era term; I couldn’t verify it online). Also Italian for frames.', npm: 'free', scope: 'taken', gh: 'taken (2025)', repos: '24 repos',
    domains: { free: ['.dev', '.studio', '.design', '.tools', '.io'], taken: ['.com', '.app'] }, web: 'Telari is a new macOS Markdown reader built for typography, which is design-adjacent, and they hold the npm scope. Out.', verdict: 'pass' },
  { name: 'Tambour', lens: 'Craft', idea: 'An embroidery hoop, also a drum.', npm: 'free', scope: '—', gh: 'taken (org created 2026)', repos: 'tambourine noise',
    domains: { free: ['.dev', '.studio', '.app'], taken: [] }, web: 'Someone registered the org this year, which looks like a launch.', verdict: 'pass' },
  { name: 'Diabolo', lens: 'Toys', idea: 'The juggling top spun on a string between two sticks.', npm: 'free', scope: 'taken', gh: 'taken (active)', repos: '249 repos',
    domains: { free: [], taken: ['.dev', '.studio', '.app'] }, web: 'Domains and scope are all taken.', verdict: 'pass' },
  { name: 'Kreisel', lens: 'Toys', idea: 'German for spinning top (and gyroscope).', npm: 'free', scope: '—', gh: 'free', repos: '47 repos',
    domains: { free: ['.dev', '.studio'], taken: [] }, web: 'Hard for English speakers, and it feels harsh.', verdict: 'pass' },
]

export const alsoChecked5 = ['Fettle', 'Whorl', 'Capstan', 'Windlass', 'Treadle (Chisel simulator)', 'Tourbillon', 'Flywheel', 'Gyre', 'Shim', 'Kerf', 'Bobbin', 'Gobo', 'Snoot',
  'Kalimba', 'Whammy', 'Camwork', 'Wheelwork', 'Spinwork', 'Rigwork', 'Gearwork', 'Cogwork', 'Toolwork', 'Propwork', 'Dialwork', 'Pinwork', 'Wirework', 'Topwork', 'Tappet', 'Pawl', 'Fresnel',
  'Cucoloris', 'Niddy-noddy', 'Spinly', 'Rondel', 'Toupie', 'Trottola', 'Tatting', 'Marotte', 'Palanca', 'Manivela', 'Resorte', 'Lanterna', 'Tiller', 'Spintop', 'Winder', 'Kinora', 'Swivel']

export const shortlist5 = [
  {
    id: 'turnwork', name: 'Turnwork', recommended: true, say: 'TURN-work', short: 'What all four favourites have in common',
    why: 'Your favourites share one verb. A trompo turns, a periaktos turns, a thumbwheel turns, and in the workshop “turning” is shaping wood on a lathe, which is Jigwork’s world. Turnwork names the common thread in Jigwork’s form. It’s plain English, impossible to misspell, and npm, scope, GitHub and three domains are all free.',
    watch: 'It’s the least surprising name on the board, a description more than a spark. turnwork.com is held (nothing public), so you’d launch on turnwork.dev.',
    font: { family: '"Manrope", "Inter", sans-serif', weight: 800, tracking: '-0.035em', case: 'lower', label: 'Manrope ExtraBold' },
    colors: { light: { ink: '#1A1714', acc: '#B5651D', bg: '#F4EFE6' }, dark: { ink: '#F4EFE6', acc: '#E8A35A', bg: '#1A1714' } },
    palette: [{ name: 'Ink', hex: '#1A1714' }, { name: 'Paper', hex: '#F4EFE6' }, { name: 'Oak', hex: '#B5651D' }, { name: 'Shavings', hex: '#E8D3A9' }, { name: 'Walnut', hex: '#5A3A22' }],
    taglines: ['Turn your prototype into a tool.', 'Shape it on the lathe.', 'Every idea, turned true.'],
    handle: 'turnwork', domain: 'turnwork.dev',
  },
]

/* ---------------------------------------------------------------------------
   Type — font pairings for Trompo. All Google Fonts, all SIL Open Font License
   (free for commercial use, self-hosting and bundling). Sizes are the Latin
   woff2 Chrome downloads for the exact axes requested, measured 9 Oct 2026.
--------------------------------------------------------------------------- */

export const typeLink = 'https://fonts.googleapis.com/css2?family=Fredoka:wght@400..700&family=Instrument+Sans:wght@400..700&family=Geist+Mono:wght@400..600&family=Archivo:wdth,wght@100..125,400..800&family=Chivo:wght@300..700&family=Chivo+Mono:wght@400..600&family=Recursive:wght,CASL,MONO@300..900,0..1,0..1&family=Gabarito:wght@600..900&family=Lexend:wght@300..600&family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Geist:wght@400..600&family=Fraunces:opsz,wght,SOFT@9..144,400..800,0..100&family=Inter:wght@400..700&family=JetBrains+Mono:wght@400..600&display=swap'

/** role = { family, weight, tracking, settings (font-variation-settings), stretch } */
export const pairings = [
  {
    id: 'gabarito', recommended: true, chosen: true, name: 'Geométrica', short: 'Round where the top is round, sharp where it spins',
    display: { family: 'Gabarito', weight: 800, tracking: '-0.035em', label: 'Gabarito ExtraBold' },
    body: { family: 'Lexend', weight: 350, tracking: '0', label: 'Lexend Light-Regular' },
    mono: { family: 'Geist Mono', weight: 450, label: 'Geist Mono' },
    makers: ['Naipe Foundry · Brazil', 'Santiago Orozco · Mexico, Héctor Gatti · Argentina (Lexend)', 'Basement Studio · Argentina (Geist Mono)'],
    kb: 96,
    why: 'Gabarito’s bowls are near-perfect circles with flat, confident terminals. The lowercase o, p and m echo the top’s round body, and at ExtraBold it holds its own beside the mark. Lexend was designed for reading ease, with wide letter spacing and open shapes, so long copy stays calm under a loud headline. It’s the lightest pairing, and most of its makers are Latin American.',
    watch: 'Lexend’s wide spacing reads slightly airy. Keep body text at 16px or above. Gabarito only runs from 400 to 900, so it’s a display face, not a text face.',
  },
  {
    id: 'omnibus', name: 'Hecho en Buenos Aires', short: 'One Argentine foundry, a whole type system',
    display: { family: 'Archivo', weight: 800, tracking: '-0.02em', stretch: '125%', label: 'Archivo Expanded ExtraBold' },
    body: { family: 'Chivo', weight: 400, tracking: '0', label: 'Chivo Regular' },
    mono: { family: 'Chivo Mono', weight: 450, label: 'Chivo Mono' },
    makers: ['Omnibus-Type · Buenos Aires (all three)'],
    kb: 146,
    why: 'All three faces come from Omnibus-Type in Buenos Aires, so they share proportions and details, which is the closest thing to a custom brand family for free. Archivo’s width axis goes from condensed to expanded, so headlines can be wide and confident while UI labels stay compact. Chivo Mono matches the body exactly. It’s the most “designed”, editorial option.',
    watch: 'Expanded type eats horizontal space. Long headlines wrap early on phones, so drop to 112% width below 600px. It’s less playful than the toy names suggest.',
  },
  {
    id: 'recursive', name: 'Del juguete a la herramienta', short: 'One family, one axis from toy to tool',
    display: { family: 'Recursive', weight: 850, tracking: '-0.02em', settings: '"CASL" 1, "MONO" 0', label: 'Recursive Casual Black' },
    body: { family: 'Recursive', weight: 400, tracking: '0', settings: '"CASL" 0, "MONO" 0', label: 'Recursive Linear' },
    mono: { family: 'Recursive', weight: 450, settings: '"CASL" 0, "MONO" 1', label: 'Recursive Mono Linear' },
    makers: ['Arrow Type · Stephen Nixon (USA)'],
    kb: 139,
    why: 'This one tells the brand story in type. Recursive has a Casual axis that slides from brush-written and playful to crisp and technical, so the headline sits at the toy end and the body and code sit at the tool end. That’s Trompo’s whole idea, toy outside and pro tool inside. It’s one file for display, body and mono, so everything is guaranteed to match, and the site can even animate the axis as a spin-up effect.',
    watch: 'Casual at heavy weights can feel comic or “handwritten” if overused, so keep it to the wordmark and hero. It’s one 139 KB file: heavier than two small fonts, lighter than three.',
  },
  {
    id: 'juguete', name: 'Juguete', short: 'Soft, round, friendly: the current wordmark',
    display: { family: 'Fredoka', weight: 600, tracking: '-0.02em', label: 'Fredoka SemiBold' },
    body: { family: 'Instrument Sans', weight: 400, tracking: '0', label: 'Instrument Sans' },
    mono: { family: 'Geist Mono', weight: 450, label: 'Geist Mono' },
    makers: ['Milena Brandão · Brazil (Fredoka)', 'Rodrigo Fuenzalida · Chile (Instrument Sans)', 'Basement Studio · Argentina (Geist Mono)'],
    kb: 108,
    why: 'This is the wordmark you’ve been looking at, with a sharper body face to keep it grown-up. Fredoka’s rounded terminals match the top exactly. Instrument Sans is crisp and slightly condensed, so the soft headline and precise text balance each other.',
    watch: 'Fredoka is everywhere in kids’ apps and games, so this is the option most likely to read as “for children”. That’s the risk of leaning toy.',
  },
  {
    id: 'bricolage', name: 'Taller', short: 'Quirky workshop grotesque, tech body',
    display: { family: 'Bricolage Grotesque', weight: 750, tracking: '-0.03em', settings: '"opsz" 96', label: 'Bricolage Grotesque Bold (opsz 96)' },
    body: { family: 'Geist', weight: 400, tracking: '0', label: 'Geist' },
    mono: { family: 'Geist Mono', weight: 450, label: 'Geist Mono' },
    makers: ['Mathieu Triay (Bricolage)', 'Basement Studio · Argentina, with Vercel (Geist)'],
    kb: 127,
    why: 'At large optical sizes, Bricolage’s ink traps and pinched curves feel hand-made, like a sign painted in a workshop. Geist is the body face a lot of developer tools now use, so the site would feel at home next to the docs and CLIs Trompo’s audience lives in.',
    watch: 'Bricolage became a 2024–25 “indie launch” favourite, so it’s already a little familiar. Geist is so common in dev tools that the body won’t say Trompo by itself.',
  },
  {
    id: 'fraunces', name: 'Suave', short: 'A soft serif with the product’s own Inter',
    display: { family: 'Fraunces', weight: 650, tracking: '-0.02em', settings: '"opsz" 144, "SOFT" 100', label: 'Fraunces SemiBold, SOFT 100' },
    body: { family: 'Inter', weight: 400, tracking: '0', label: 'Inter' },
    mono: { family: 'JetBrains Mono', weight: 450, label: 'JetBrains Mono' },
    makers: ['Undercase Type · Phaedra Charles, Flavia Zimbardi (Fraunces)', 'Rasmus Andersson (Inter)'],
    kb: 205,
    why: 'Fraunces has a Softness axis that rounds every corner, so at SOFT 100 it’s a serif that still feels like a toy. The body is Inter, the same face as the product chrome, so the site and the tool feel continuous. It’s the warmest, most crafted-looking option.',
    watch: 'It’s the heaviest at 205 KB, and the serif pulls the brand towards editorial or food packaging. Inter on its own reads as generic, so the serif has to carry all the personality.',
  },
]

/* ---------------------------------------------------------------------------
   Wireframe identity — research, 9 Oct 2026. Screenshots live in
   brand/references/wireframe/ (git-ignored: third-party work, never publish).
--------------------------------------------------------------------------- */

export const wireframeIdea = 'Trompo is a harness: it holds whatever you put in it. So the shells should demo with tasteful placeholders instead of finished, high-fidelity UI. That keeps the focus on the tool, lets any content feel at home, and turns “empty” into the look. The question is how to make placeholders look designed, not unfinished.'

export const wireframeDirections = [
  {
    id: 'cargo', name: 'One curated placeholder, repeated', who: 'Cargo (Basic templates)',
    refs: ['cargo-feed-01', 'cargo-grid-01', 'cargo-grid-05', 'cargo-slide-04'],
    how: 'Cargo doesn’t use grey boxes. Every Basic template uses the same single photograph, a muted pastel shot of someone resting their head on a table, repeated in every slot. Tiny captions sit under it (“01 Project Name · Jan 01”) with generous white space. You read it instantly as placeholder, but it looks deliberate and calm. The layouts change and the placeholder never does.',
    borrow: 'One signature placeholder image, used everywhere a picture would go. It becomes part of the brand. Pair it with numbered, small captions.',
    risk: 'It needs a genuinely good image that we own. A stock photo would cheapen it, and Cargo’s photo is theirs.',
  },
  {
    id: 'cargo-blank', name: 'The blank sheet', who: 'Cargo (Blank templates) · found by Rafael',
    refs: ['cargo-blank-placeholder'],
    how: 'An empty slot drawn as a physical sheet. It’s a flat card with one corner-to-corner hairline (a refined version of the classic image “X”), two binder punch holes and a tiny vertical caption that names its own format: “Cargo® Rectangular Placeholder / Image — vertical”. It reads as stationery waiting to be filled, not as broken content.',
    borrow: 'Trompo’s own version for empty slots: real cut-out punch holes on the long edge, a hairline diagonal, and a Geist Mono caption with kind, ratio and orientation. See “Trompo placeholders” above.',
    risk: 'Too literal a copy would just be Cargo’s look. Ours differs in colour, caption type and hole logic, and it pairs with the dithered top.',
  },
  {
    id: 'hig', name: 'Single-hue construction diagram', who: 'Apple Human Interface Guidelines',
    refs: ['apple-hig-layout', 'apple-hig-sidebars'],
    how: 'Apple draws UI as a diagram in one hue, all yellow or all red. Shapes are flat tints of that hue, with guide lines, margins and measurement brackets drawn on top. It looks like an explanation of the UI, not the UI itself, and it’s beautiful because it’s monochrome and exact.',
    borrow: 'Draw the artboard content in tints of one colour, with hairline guides and dimension marks as the decoration. It could use Trompo pink inside the artboard, or a neutral.',
    risk: 'If every shell is one hue, the hue has to change per shell or it gets monotonous. Labels must stay crisp at small sizes.',
  },
  {
    id: 'lofi', name: 'Lo-fi component greys', who: 'Relume · Whimsical · Figma kits (Fragments, Lookscout)',
    refs: ['relume-components-2', 'whimsical-wireframes', 'figma-fragments', 'figma-lookscout'],
    how: 'This is the literal wireframe: neutral grey blocks with rounded corners, real labels (Relume names its thumbnails “Application Shell 1, 2, 3”), and image boxes with a soft icon. The good ones (Fragments) add annotation callouts in one accent colour, which makes it feel like a design review rather than a sketch.',
    borrow: 'Labelled grey blocks for UI, plus a single annotation colour for callouts (“button”, “hero 16:9”, “→ next screen”).',
    risk: 'It’s the most generic option, and every wireframe kit looks like this. It needs our type and annotation style to feel like Trompo.',
  },
  {
    id: 'grid', name: 'Visible structure: the frame is the ornament', who: 'Vercel (Geist grid) · Dub',
    refs: ['vercel-geist-grid', 'vercel-home-2', 'dub-home'],
    how: 'Hairline grid lines, cell borders and crosshair marks at intersections stay visible on the finished page. The structure that’s usually hidden becomes the decoration. This is the closest match to “harness”: scaffolding drawn around content.',
    borrow: 'Draw the harness itself: hairline frames around the artboard, crosshair corners, rulers and size labels (“1440 × 900”). The placeholder content sits inside the scaffold.',
    risk: 'It’s fashionable right now with developer-tool sites, so on its own it reads as “another dev tool”. Combine it with something warmer.',
  },
  {
    id: 'manual', name: 'Typographic austerity: the manual', who: 'Teenage Engineering guides · Are.na',
    refs: ['te-op1-guide', 'te-ep133-guide-2', 'arena-home'],
    how: 'Almost no images. Small type, lists, labels, numbers and the occasional technical line drawing do all the work. The confidence of saying very little with very good type is the aesthetic.',
    borrow: 'Placeholders as words: “image · 16:9”, “headline”, “button”, set in Geist Mono at small size. Numbered items and index lists.',
    risk: 'Too austere for client-facing demos on its own, and it depends heavily on perfect typography.',
  },
  {
    id: 'skeleton', name: 'Skeleton loaders', who: 'shadcn/ui · Mobbin',
    refs: ['shadcn-skeleton', 'mobbin-skeleton'],
    how: 'Soft rounded bars and circles in one light grey, sometimes shimmering, mirroring a layout while it loads.',
    borrow: 'The softness and the rounded bars, used for text lines inside the other directions.',
    risk: 'Everyone reads skeletons as “still loading”, so on its own it looks broken, not designed. Use it as an ingredient only.',
  },
]

export const wireframeAvoid = [
  { name: 'Hand-drawn / sketchy', who: 'Excalidraw · Balsamiq', refs: ['excalidraw', 'balsamiq'], why: 'It signals “unfinished” or “joke”, the opposite of a pro tool. It’s fine for whiteboards, wrong for a brand.' },
  { name: 'Decorative abstract shapes', who: 'Material Design', refs: ['material-layout'], why: 'Colourful blobs are illustration, not placeholder, and they would compete with real content.' },
]

export const wireframeProposal = {
  name: 'Proposal: the harness, drawn',
  parts: [
    ['Scaffold', 'Hairline frame around every artboard, crosshair corners, a size label (“1440 × 900”) and rulers. The harness is visible. (Vercel)'],
    ['Placeholders', 'Labelled warm-grey blocks with soft skeleton text lines. Labels in Geist Mono at 10–11px: “image · 16:9”, “headline”, “button”. (Relume, Teenage Engineering)'],
    ['Signature image', 'One placeholder picture we own, used everywhere a photo goes. A dithered spinning top, made with our own dither shell, would make the placeholder itself a piece of Trompo. (Cargo)'],
    ['Annotation', 'Callouts and dimension marks in Trompo pink, inside the artboard only. The chrome accent stays blue, per the accent rule. (Apple HIG, Fragments)'],
  ],
}

/* ---------------------------------------------------------------------------
   Type at scale — how brands use big geometric display type (measured 10 Oct 2026,
   1440px viewport; largest text on screen vs. body paragraph). Screenshots in
   brand/references/type-scale/ (git-ignored).
--------------------------------------------------------------------------- */

export const scaleMeasures = [
  { who: 'Spotify Premium', ref: 'spotify-premium', font: 'Spotify Mix Title', px: 128, weight: 900, tracking: '0', leading: 'tight', ratio: '10.7×', note: 'Three stacked lines over a photo, one word italic for emphasis' },
  { who: 'Spotify, For the Record', ref: 'spotify-fortherecord', font: 'Spotify Mix', px: 140, weight: 700, tracking: '−0.04em', leading: '1.07', ratio: '8.8×', note: '“About Spotify” runs off the bottom of its frame' },
  { who: 'Spotify for Artists', ref: 'spotify-artists', font: 'Spotify Mix Title', px: 96, weight: 800, tracking: '0', leading: 'tight', ratio: '—', note: 'Left-aligned, one short phrase per line' },
  { who: 'Uber brand', ref: 'uber-brand', font: 'Uber Move', px: 120, weight: 'light', tracking: '0', leading: '0.90', ratio: '7.5×', note: 'Huge and thin over photography' },
  { who: 'Wise', ref: 'wise-home', font: 'Wise Sans', px: 89, weight: 900, tracking: '0', leading: '0.85', ratio: '5.6×', note: 'Heavy, centred, on a full brand-green field' },
  { who: 'Robinhood', ref: 'robinhood', font: 'Martina Plantijn', px: 110, weight: 400, tracking: '−0.005em', leading: '1.00', ratio: '6.9×', note: 'Big but light, centred' },
  { who: 'Gumroad', ref: 'gumroad', font: 'ABC Favorit', px: 96, weight: 400, tracking: '0', leading: '1.00', ratio: '6.0×', note: 'Playful props around a calm headline' },
  { who: 'Cash App', ref: 'cashapp', font: 'Cash Sans', px: 56, weight: 400, tracking: '−0.03em', leading: '0.95', ratio: '3.1×', note: 'Modest size, but the whole page is brand green' },
  { who: 'Lineto (Circular specimen)', ref: 'lineto-circular', font: 'Circular Black', px: 294, weight: 900, tracking: '0', leading: '1.00', ratio: '—', note: 'The name as the image' },
  { who: 'Trompo today', ref: null, font: 'Gabarito', px: 52, weight: 700, tracking: '−0.035em', leading: '1.06', ratio: '3.1×', note: 'Our current hero, for comparison' },
]

export const scalePrinciples = [
  ['Go 7–10× the body', 'Spotify Premium’s headline is 10.7× its body text, Uber’s 7.5×, Robinhood’s 6.9×. Ours is 3.1×. For Trompo: about 120–150px on desktop (clamp to 9–10vw), 48–56px on phones.'],
  ['Heavy, then heavier', 'Display weights sit at 800–900. Gabarito runs to 900 (Black), so use it for the hero and 700–800 for section heads.'],
  ['Tighten everything', 'Line height 0.85–0.95 (Wise 0.85, Uber 0.9). Tracking −0.03 to −0.045em at these sizes, since big type looks loose at default spacing.'],
  ['Few words, stacked', 'Two to five words per line, with deliberate breaks (“Where your / music / is everything”). The headline is a shape as much as a sentence.'],
  ['Let it fill, or bleed', 'Type becomes the image: it runs to the edges or past them (Spotify’s “About Spotify”, Lineto’s 294px name). The wordmark can do this too.'],
  ['Plain, small body', 'The contrast does the work. Big geometric display wants a quiet, neutral body at 16–18px. That’s why Lexend, which has its own personality, fights it.'],
  ['Colour fields', 'Wise and Cash App set big type on a full brand-colour field. Trompo’s version is white Gabarito on rosa mexicano (#D1006F passes 5.3:1 with white).'],
  ['Emphasis without italics', 'Spotify italicises one word. Gabarito has no italic, so we emphasise with weight or the pink instead.'],
]

export const bodyFonts = [
  { family: 'Geist', kb: 29, makers: 'Basement Studio (Argentina) with Vercel', note: 'Neutral, slightly technical, and the same family as our Geist Mono, so body and code feel related.' },
  { family: 'Inter', kb: 47, makers: 'Rasmus Andersson', note: 'The most neutral, and it’s the product’s own chrome font, so site and tool would match. Also the most generic.' },
  { family: 'Instrument Sans', kb: 29, makers: 'Rodrigo Fuenzalida (Chile), Jordan Egstad', note: 'Crisp and a little condensed. Precise without being cold.' },
  { family: 'Figtree', kb: 20, makers: 'Erik Kennedy', note: 'Friendly geometric, closest to Gabarito’s shapes, lightest download. The least contrast with the display face.' },
  { family: 'Hanken Grotesk', chosen: true, kb: 34, makers: 'Alfredo Marco Pradil, Hanken Design Co.', note: 'A warm, plain grotesque. Reads like good editorial body text.' },
  { family: 'Public Sans', kb: 26, makers: 'USWDS, with Pablo Impallari and Rodrigo Fuenzalida', note: 'Deliberately neutral, built for US government sites. As plain as it gets.' },
]

export const scaleLink = 'https://fonts.googleapis.com/css2?family=Gabarito:wght@400..900&family=Geist:wght@400..600&family=Inter:wght@400..600&family=Instrument+Sans:wght@400..600&family=Figtree:wght@400..600&family=Hanken+Grotesk:wght@400..600&family=Public+Sans:wght@400..600&family=Geist+Mono:wght@400..500&display=swap'

/* ---------------------------------------------------------------------------
   Paper (paper.design) — their own take on the wireframed look, site + socials.
   Studied 10 Oct 2026; screenshots in brand/references/paper/ (git-ignored).
--------------------------------------------------------------------------- */

export const paperRefs = [
  { ref: 'home-08', label: 'Roadmap block: ruler ticks, dashed columns, corner handles, stepped pixel diagonal, mark in 3 materials' },
  { ref: 'home-02', label: 'Giant guide arc framing a centred, lowercase, light headline' },
  { ref: 'home-05', label: 'Hairline section grid like a cutting mat, with dither texture in the corner' },
  { ref: 'home-10', label: 'Footer: the wordmark huge and faded into the paper' },
  { ref: 'social-youtube-0', label: 'YouTube: the mark as halftone, noise and checker dither on ruled paper, with rulers and blue arcs' },
  { ref: 'social-x-0', label: 'X banner: the mark as a window holding solid, riso overprint, torn paper, sky, painting' },
]

export const paperLessons = [
  ['The mark is a window', 'Paper fills its two-squares mark with different materials and images. The mark holds content, which is exactly Trompo’s promise. Our top’s silhouette can hold dither, halftone, overprint, a blank sheet or a blueprint.'],
  ['Brand art made with the product', 'Their textures (paper grain, halftone, dithering) are the same effects Paper Shaders sells. Trompo has its own dither shell, so our art should come out of our own tools and say so.'],
  ['Measurement as ornament', 'Ruler ticks down the edge, dashed column guides, selection-handle squares at frame corners and guide arcs. It’s the harness, drawn, and they already do it well.'],
  ['Paper, not white', 'A warm off-white with faint grain everywhere, never pure white. Trompo’s paper (#F6F1EA) already fits; add a subtle grain.'],
  ['Where we differ', 'Paper is quiet and lowercase-light (Matter). Trompo is loud: stacked Gabarito Black and rosa mexicano. Borrow the scaffolding and the material idea, not the voice.'],
]

/* ---------------------------------------------------------------------------
   Wire aesthetic v2 — polish rules from are.na + Cosmos (10 Oct 2026).
   Screenshots: brand/references/wire2/ (git-ignored). Kit: brand/wire.js.
--------------------------------------------------------------------------- */
export const wireRules = [
  ['One ink, line weight is the hierarchy', 'The polished references draw in one colour: Klein-blue sheets, ink-on-paper patents, a red “line weight” plan. Structure is hairline, objects are thin, emphasis is medium. Our v1 mixed grey fills, teal arcs, pink and black, which is why it looked unfinished.'],
  ['Pink is the red pen', 'Annotation is the only colour: dimensions, numbered callouts and revision notes, like a reviewer’s markup over a print. Content never uses it.'],
  ['Real drafting conventions', 'Extension lines, 45° ticks and the value set in a gap in the dimension line (from the adidas and Mitsubishi logo drawings and the patent sheets). It’s instantly “engineered”, not “sketched”.'],
  ['Every sheet is a document', 'Border, ruler ticks, registration marks and a title block (project, drawing, sheet n / N, scale, date, drawn by). That one block turns a mock-up into an artefact.'],
  ['Placeholders follow type', 'Headlines are heavy bars stacked at the real leading (0.88–0.95), not pills. Body is thin bars on a baseline grid with a short last line. Images are a box with both diagonals.'],
  ['Numbered callouts, not floating labels', 'A dot on the target, a straight leader and a circled number, then the note. Leaders never cross content.'],
  ['Stationery, physically', 'Cosmos’s “paper archives” mock-ups (punch holes, clips, stamps, sheet numbers, typewriter mono) are the physical twin of the blank card. Use sheet numbers and punch holes, never fake staples.'],
]
export const wire2Refs = [
  ['cosmos-technical-drawing-0', 'Cosmos · technical drawing'],
  ['cosmos-wireframe-0', 'Cosmos · wireframe'],
  ['cosmos-placeholder-0', 'Cosmos · placeholder'],
  ['cosmos-annotation-0', 'Cosmos · annotation'],
  ['cosmos-blueprint-0', 'Cosmos · blueprint'],
  ['cosmos-grid-layout-0', 'Cosmos · grid layout'],
  ['ch-placeholder-as-form-0', 'are.na · placeholder as form'],
  ['ch-markup-0', 'are.na · markup & annotation'],
  ['ch-wireframe-prototype-1', 'are.na · wireframe → prototype'],
]

/* ---------------------------------------------------------------------------
   Rueca — the rename (11 Oct 2026) and a rustic rethink. Rafael: "go with rueca …
   requires a rethink as far as brand elements go … more rustic, probably a serif
   display font." Reference: spinning-wheel photography (wood, undyed wool, thread).
--------------------------------------------------------------------------- */

export const ruecaLink = 'https://fonts.googleapis.com/css2?family=Alegreya:wght@500..900&family=Alegreya+Sans:wght@400;500&family=IM+Fell+Double+Pica&family=IM+Fell+English:ital@0;1&family=Fraunces:opsz,wght,SOFT,WONK@9..144,400..900,0..100,0..1&family=Young+Serif&family=Gloock&family=Vollkorn:wght@500..900&family=Piazzolla:opsz,wght@8..30,500..900&family=Hanken+Grotesk:wght@400..600&family=Libre+Franklin:wght@400..600&family=IBM+Plex+Sans:wght@400..600&family=Geist+Mono&family=Architects+Daughter&family=Caveat:wght@400..700&family=La+Belle+Aurore&family=Nanum+Pen+Script&family=Kalam:wght@400;700&family=Covered+By+Your+Grace&family=Walter+Turncoat&family=Reenie+Beanie&display=swap'

export const ruecaPairs = [
  { id: 'alegreya', name: 'Huerta', display: { family: 'Alegreya', weight: 800, tracking: '-0.02em' }, body: 'Alegreya Sans',
    makers: 'Juan Pablo del Peral · Huerta Tipográfica, Argentina', pick: true,
    why: 'A calligraphic, hand-made serif with a matching sans, both from an Argentine foundry. It has the warmth of the wheel without looking like a costume, and it reads well at body size. Best all-rounder.' },
  { id: 'fell', name: 'Imprenta', display: { family: 'IM Fell Double Pica', weight: 400, tracking: '-0.01em' }, body: 'Hanken Grotesk',
    makers: 'Igino Marini · revival of the 17th-century Fell types',
    why: 'The most rustic: real letterpress unevenness, ink spread and wobble from 1670s type. Unmistakable, but it reads as historical and only comes in one weight.' },
  { id: 'fraunces', name: 'Telar', display: { family: 'Fraunces', weight: 700, tracking: '-0.02em', settings: "'opsz' 144, 'SOFT' 50, 'WONK' 1" }, body: 'Hanken Grotesk',
    makers: 'Undercase Type · Phaedra Charles, Flavia Zimbardi (Brazil)',
    why: 'An old-style serif with deliberately wonky letters and softened corners. It’s rustic and modern at once, and the most flexible (variable weight, softness, optical size).' },
  { id: 'young', name: 'Taller', display: { family: 'Young Serif', weight: 400, tracking: '-0.015em' }, body: 'Hanken Grotesk',
    makers: 'Bastien Sozeau',
    why: 'Heavy, warm and chunky, like a hand-painted shop sign or a seed packet. Friendly and bold at big sizes. Single weight.' },
  { id: 'vollkorn', name: 'Pan', display: { family: 'Vollkorn', weight: 800, tracking: '-0.02em' }, body: 'Hanken Grotesk',
    makers: 'Friedrich Althausen',
    why: '“Vollkorn” means wholemeal. A dark, sturdy book serif that feels like an old manual. Earthy rather than decorative.' },
  { id: 'gloock', name: 'Molino', display: { family: 'Gloock', weight: 400, tracking: '-0.01em' }, body: 'Hanken Grotesk',
    makers: 'Duarte Pinto (Portugal)',
    why: 'High-contrast and sculptural with soft, ball-ended strokes. The most elegant: rustic like a good wood workshop, not a farmhouse.' },
  { id: 'piazzolla', name: 'Piazzolla', display: { family: 'Piazzolla', weight: 800, tracking: '-0.02em', settings: "'opsz' 30" }, body: 'Hanken Grotesk',
    makers: 'Juan Pablo del Peral · Huerta Tipográfica, Argentina',
    why: 'Alegreya’s sharper sibling: angular, carved strokes like woodcut lettering. Rustic with an edge.' },
]

/* v2 (11 Oct): "rustic meets modern, like Figma made in the 90s". The ground and ink stay rustic (paper, walnut,
   madder oxblood, platinum 90s chrome). The brights are Figma's five hues plus a yolk yellow, printed flat and chalky
   instead of glowing, and each named for the natural dye that gives that colour. Tuned against colours sampled from
   ayushsoni_io / HEX work (Cardinal, the legal-tech system, the Klein biotech set). */
export const ruecaPalette = [
  { name: 'Lana', hex: '#F3F1EB', dark: '#F3F1EB', group: 'base', role: 'paper: undyed wool, tint halved 11 Oct so the shells’ neutral UI sits well on it' },
  { name: 'Platino', hex: '#DCDAD5', dark: '#383430', group: 'base', role: 'chrome: the platinum grey of a 1997 Mac window' },
  { name: 'Nogal', hex: '#181411', dark: '#151210', group: 'base', role: 'ink: walnut, nearly black (dark value is the night ground, next to the kit’s #131313)' },
  { name: 'Rubia', hex: '#5E2219', dark: '#5E2219', group: 'base', role: 'deep block: madder oxblood, the rustic dark (as in Cardinal)' },
  { name: 'Achiote', hex: '#E8582C', dark: '#F06A3E', group: 'bright', figma: '#F24E1E', role: 'annatto orange-red: the lead accent and the CTA' },
  { name: 'Cochinilla', hex: '#EE7A68', dark: '#F38B79', group: 'bright', figma: '#FF7262', role: 'cochineal coral' },
  { name: 'Malva', hex: '#A88BF6', dark: '#B39AF8', group: 'bright', figma: '#A259FF', role: 'mallow violet' },
  { name: 'Cielo', hex: '#5DB4E8', dark: '#6FC0EE', group: 'bright', figma: '#1ABCFE', role: 'light indigo dip: sky' },
  { name: 'Hoja', hex: '#2FA57C', dark: '#3DB68B', group: 'bright', figma: '#0ACF83', role: 'weld over indigo: leaf green' },
  { name: 'Gualda', hex: '#F2C744', dark: '#F5D05A', group: 'bright', role: 'weld yolk yellow (from the legal-tech and Cardinal sets)' },
  { name: 'Añil', hex: '#3440C8', dark: '#8C95F0', group: 'line', role: 'deep indigo, cobalt-bright: diagram lines and links only' },
]
export const ruecaPaletteRules = [
  ['Paper carries it', 'Lana, Platino and Nogal cover most of every layout. Rustic lives in the ground and the ink, never in muddy accents.'],
  ['Brights are flat blocks', 'The brights are printed flat with a little grain: no gradients, no glow. Use one or two per layout, set as blocks or threads, with Nogal text on top (never white).'],
  ['All six only together', 'The full set appears together only in the mark and system moments, the way Figma’s logo uses all five of its colours. That’s the nod.'],
  ['Rubia is the dark, not black', 'For a dark block, reach for madder oxblood before Nogal. That’s where the warmth comes from.'],
  ['Ramps for depth', 'Every family has lights (50–300) for washes and tints, and darks (600–900) for text on colour and deep blocks. The darks lean slightly warmer, like dyed cloth.'],
]

export const ruecaTaglines = ['Spin your prototype into a tool.', 'Spin up a real tool.', 'Turn it into a tool.', 'Your prototype, with handles.', 'Spun from what you have.', 'Tune it by hand.', 'Raw prototype in. Real tool out.', 'Put a wheel on it.', 'Give it a spin.']

/** From Rafael's Trove (read 11 Oct 2026 via trove.quest, signed in). Old-meets-new references he saved. */
export const troveRefs = [
  { theme: 'Craft material × precise mark', s: 'Interlaced line monogram for Claude Type, a maison-style mark paired with a high-contrast serif wordmark on brown wool.', url: 'https://the-brandidentity.com/interview/how-margot-l%C3%A9v%C3%AAque-built-claude-type-around-slowness-and-craft', img: 'https://d2w9rnfcy7mm78.cloudfront.net/43261939/original_a4334ed1248ca7e6060a3b8c5e184032.webp?1770115343?bc=0' },
  { theme: 'Craft material × precise mark', s: 'Blind deboss of a crane mark into blue linen cloth, all the identity carried by texture and shadow with zero ink.', url: 'https://www.are.na/block/9803031', img: 'https://images.are.na/eyJidWNrZXQiOiJhcmVuYV9pbWFnZXMiLCJrZXkiOiI5ODAzMDMxL29yaWdpbmFsX2Y3NjBjZGQ5NDEzNjMzNzJkODQ5ODM0MTNlMTk0OGQ1IiwiZWRpdHMiOnsicmVzaXplIjp7IndpZHRoIjoxMjAwLCJoZWlnaHQiOjYzMCwiZml0IjoiY292ZXIiLCJ3aXRob3V0RW5sYXJnZW1lbnQiOnRydWV9LCJ3ZWJwIjp7InF1YWxpdHkiOjgwfSwianBlZyI6eyJxdWFsaXR5Ijo4MH0sInJvdGF0ZSI6bnVsbH19' },
  { theme: 'Craft material × precise mark', s: 'Whole Earth Catalog cover translated into woven textile, high-contrast type and halftone earth surviving the yarn grid.', url: 'https://images.squarespace-cdn.com/content/v1/6435e515f2053a1aa71379e5/50da67e8-a429-42a8-8470-7562f421ad27/94_whole-earth-catalog-blanket.jpg', img: 'https://images.squarespace-cdn.com/content/v1/6435e515f2053a1aa71379e5/50da67e8-a429-42a8-8470-7562f421ad27/94_whole-earth-catalog-blanket.jpg' },
  { theme: 'Craft material × precise mark', s: 'Hand embroidery on sheer white fabric where dense running stitches map organic shapes and loose thread ends stay visible.', url: 'https://uk.pinterest.com/pin/39195459253260123/', img: 'https://d2w9rnfcy7mm78.cloudfront.net/45942758/original_e9b1c43ec31bcbb210ad7aa24f76ddc8.jpeg?1778235034?bc=0' },
  { theme: 'Old picture × flat diagram', s: 'Legal-tech brand system pairing Victorian engraving illustrations with flat geometric diagrams and bold primaries — serious but warm.', url: 'https://x.com/ayushsoni_io/status/2076549249399914510', img: 'https://pbs.twimg.com/media/HNFifOCWwAEyqsa?format=jpg&name=large' },
  { theme: 'Old picture × flat diagram', s: 'Neoclassical oil painting imagery paired with clean sans-serif and italic serif accents, an AI brand identity that avoids the usual tech look.', url: 'https://x.com/Oriku175', img: 'https://framerusercontent.com/images/9VseybFkI3E7tot1jiu5oXIGIxI.png' },
  { theme: 'Old picture × flat diagram', s: 'Sepia halftone collage system with technical registration marks, rulers and barcodes — archival-technical art direction.', url: 'https://x.com/olegcoada/status/2075143489768071506', img: 'https://pbs.twimg.com/media/HMuQfR5WEAASKbG?format=jpg&name=large' },
  { theme: 'Old picture × flat diagram', s: 'Korean furniture catalog printed on kraft paper, hand-lettered header with sepia line drawings in a dense grid.', url: 'https://www.are.na/block/38051138', img: 'https://images.are.na/eyJidWNrZXQiOiJhcmVuYV9pbWFnZXMiLCJrZXkiOiIzODA1MTEzOC9vcmlnaW5hbF9mNDlkYmMzNTAwZmM5ZmVjOTM2MGJiM2M5ZWM1MWU0ZS5wbmciLCJlZGl0cyI6eyJyZXNpemUiOnsid2lkdGgiOjEyMDAsImhlaWdodCI6NjMwLCJmaXQiOiJjb3ZlciIsIndpdGhvdXRFbmxhcmdlbWVudCI6dHJ1ZX0sIndlYnAiOnsicXVhbGl0eSI6ODB9LCJqcGVnIjp7InF1YWxpdHkiOjgwfSwicm90YXRlIjpudWxsfX0=' },
  { theme: 'Old mark kept beside new', s: 'ARRI pairs a heavy angular sans with a surviving vintage oval monogram — old mark kept beside new.', url: 'https://www.are.na/block/13829527', img: 'https://d2w9rnfcy7mm78.cloudfront.net/13829527/original_6c12b7432de208f99949066404453900.png?1635962780?bc=0' },
  { theme: 'Old mark kept beside new', s: 'Nike Run: a 1980s Swoosh lockup with “RUN” swapped in, Volt Orange sourced from the 1972 shoe box.', url: 'https://www.portorocha.com/nikerun', img: 'https://images.prismic.io/portorocha/aMFtF2GNHVfTO_Qo_image382.jpg' },
  { theme: 'Old mark kept beside new', s: 'Arcane: Art Deco and Art Nouveau encoded into one identity, unified by a custom typeface.', url: 'https://wearecollins.com/case-studies/arcane', img: 'https://cdn.sanity.io/images/fmzd4n68/production/7d3e523dc655a6798a183298ef720305d0e4ec03-1000x1500.webp' },
  { theme: 'Hand-made type', s: 'Hand-carved maker’s mark and date gouged into walnut — rough incised lettering on wood.', url: 'https://images.squarespace-cdn.com/content/v1/6435e515f2053a1aa71379e5/8dd2473a-920b-463a-b855-d2bf84fb6db2/4_noll-n189-2-jpg.jpg', img: 'https://images.squarespace-cdn.com/content/v1/6435e515f2053a1aa71379e5/8dd2473a-920b-463a-b855-d2bf84fb6db2/4_noll-n189-2-jpg.jpg' },
  { theme: 'Hand-made type', s: 'Letters built from repeated impressions of themselves, hand-pressed wood type on A2 paper.', url: 'https://www.are.na/block/5025511', img: 'https://images.are.na/eyJidWNrZXQiOiJhcmVuYV9pbWFnZXMiLCJrZXkiOiI1MDI1NTExL29yaWdpbmFsX2Y5ZWViZTczZGI1MTk3MjMwMWUwNjQ5NjI0OTQ4OWJkLmpwZyIsImVkaXRzIjp7InJlc2l6ZSI6eyJ3aWR0aCI6MjA0OCwiZml0IjoiaW5zaWRlIiwid2l0aG91dEVubGFyZ2VtZW50Ijp0cnVlfSwid2VicCI6eyJxdWFsaXR5Ijo3NX0sImpwZWciOnsicXVhbGl0eSI6NzV9LCJyb3RhdGUiOm51bGx9fQ==' },
  { theme: 'Hand-made type', s: 'Heavy slab-serif capital A printed with visible ink grain on cream stock — letterpress texture and weight.', url: 'https://www.are.na/block/15474632', img: 'https://d2w9rnfcy7mm78.cloudfront.net/15474632/original_3f905217de2edb17a886b1c26504464c.png?1646683908?bc=0' },
  { theme: 'Hand-made type', s: 'Interlocked serif S monogram tiled into an allover pattern, photocopy-degraded — a mark turned into brand texture.', url: 'https://www.are.na/block/10142772', img: 'https://d2w9rnfcy7mm78.cloudfront.net/10142772/original_0f25e7c8dd139b16771313db13ac25b5.jpg?1610026515?bc=0' },
]

/* Rueca rethink, grounded in Rafael's Trove (read through the x-book MCP, 11 Oct 2026).
   ~90 saves across brand-identity, typography, textiles, color-palettes, material-studies and print-aesthetics.
   Each pattern below repeats across several saves, so it's a habit of his eye, not a one-off. */
export const ruecaTrove = [
  { id: 'material', title: 'The mark lives in the material',
    says: 'The most repeated move in the brand saves: a mark blind-debossed into linen, board, stone or steel, with no ink at all. The identity is carried by texture and raking light.',
    refs: [
      { t: 'Crane Paper: crane debossed into blue linen (Collins)', u: 'https://www.are.na/block/9803031' },
      { t: 'Monogram blind-embossed into coarse fibrous board', u: 'https://www.are.na/block/35539940' },
      { t: 'Jacquemus wordmark debossed into a steel tray', u: 'https://www.are.na/block/16892083' },
      { t: 'Claude Type: serif wordmark on brown wool, “slowness and craft”', u: 'https://the-brandidentity.com/interview/how-margot-l%C3%A9v%C3%AAque-built-claude-type-around-slowness-and-craft' },
    ] },
  { id: 'engraving', title: 'Old picture, new drawing',
    says: 'Classical or engraved imagery set against flat geometric diagrams and monospace labels. Your own note on one save: “soften AI with classical imagery, natural textures, and more analog feelings.”',
    refs: [
      { t: 'Legal-tech system: Victorian engravings + flat geometric diagrams', u: 'https://x.com/ayushsoni_io/status/2076549249399914510' },
      { t: 'Sepia halftone collage with registration marks and rulers', u: 'https://x.com/olegcoada/status/2075143489768071506' },
      { t: 'Nexus: neoclassical paintings for an AI brand (your note)', u: 'https://x.com/Oriku175' },
      { t: 'Biotech lab: serif display over monospace annotation', u: 'https://x.com/ayushsoni_io/status/2093246561677705238' },
    ] },
  { id: 'tool', title: 'The oldest tool next to the newest',
    says: 'Objects that put prehistoric and digital making in one silhouette. A spinning wheel next to a prototype harness is the same joke, played straight.',
    refs: [
      { t: 'Flint hand axe seated in a Dremel housing', u: 'https://arena-images-temp.s3.amazonaws.com/D0788F0E-F17C-4B8A-A316-8209256C657D.jpg' },
      { t: 'Knapped flint blade on a titanium handle, stamped MAN MADE', u: 'https://kr.pinterest.com/pin/326651779244745766/' },
      { t: 'Maker’s mark and date gouged into walnut', u: 'https://images.squarespace-cdn.com/content/v1/6435e515f2053a1aa71379e5/8dd2473a-920b-463a-b855-d2bf84fb6db2/4_noll-n189-2-jpg.jpg' },
    ] },
  { id: 'accent', title: 'Near-invisible image, one loud accent',
    says: 'A whisper of an image (embossed, tonal, raw) and then one hard colour doing all the shouting. Rueca’s brights work the same way: flat, small, and loud against a quiet paper ground.',
    refs: [
      { t: 'Embossed St George engraving + three flat red stars', u: 'https://www.are.na/block/29659225' },
      { t: 'Red thread embroidered in tangled lines on raw linen', u: 'https://www.are.na/block/29038294' },
      { t: 'Matchbox: hand-cut red lettering on cream does everything', u: 'https://thegraphicsideof.tumblr.com/' },
    ] },
  { id: 'serif', title: 'Warm serif, never a costume',
    says: 'The serifs you keep are calligraphic or old-style but drawn with a modern hand. “Warm and hand-drawn without being twee” is your caption on Tagada, and it’s the brief for Rueca’s type.',
    refs: [
      { t: 'Tagada (Laurent Muller): calligraphic serif, warm not twee', u: 'https://www.futurefonts.xyz/laurent-muller/tagada' },
      { t: 'Old-style serif with ct ligatures, single-weight specimen', u: 'https://www.aboutcontact.com/typography' },
      { t: 'Atelier Dyakova: bespoke high-contrast serif, old-master names', u: 'https://www.instagram.com/p/C1ftr5MtsTk/' },
      { t: 'Pine deck: heavy grotesk against a delicate serif, ochre and olive', u: 'https://images.squarespace-cdn.com/content/v1/6435e515f2053a1aa71379e5/fc5bbd2b-486d-4ee5-8e61-47d36a8359ec/104_pine-albinholmqvist-4-jpg.jpg' },
    ] },
  { id: 'dye', title: 'Dyed, not printed',
    says: 'The palettes you save come from cloth and process: rust and ochre quilts, crimson ikat on cream, indigo cyanotype. Rueca’s palette names every bright after the natural dye that makes it, and then prints it like 90s software.',
    refs: [
      { t: 'Slow Roads quilt: rust, ochre, grey, yellow thread ties', u: 'https://images.squarespace-cdn.com/content/v1/6435e515f2053a1aa71379e5/aa639b1e-a902-420e-9113-907e7afa71f9/110_slow-roads-sunday-quilt.jpg' },
      { t: 'Ikat poppies: crimson and violet bleeding on cream linen', u: 'https://uk.pinterest.com/pin/371335931747051999/' },
      { t: 'RM “Indigo”: cyanotype botanicals in Prussian blue', u: 'https://uk.pinterest.com/pin/616289530297057019/' },
      { t: 'The Clove Club: a whole identity in Klein-blue cyanotypes', u: 'https://e-i-b.com/work/the-clove-club/' },
    ] },
]

ruecaTrove.push({ id: 'keep', title: 'Keep the old mark beside the new',
  says: 'Instead of blending old and new into one compromise, these brands set a surviving vintage element right next to a modern one. For Rueca: an engraved wheel as the seal, a plain modern wordmark beside it.',
  refs: [
    { t: 'ARRI: vintage oval monogram kept beside a heavy angular sans', u: 'https://www.are.na/block/13829527' },
    { t: 'Nike Run: the 1980s lockup, Volt Orange from the 1972 shoe box', u: 'https://www.portorocha.com/nikerun' },
    { t: 'Arcane: Art Deco and Art Nouveau held in one identity', u: 'https://wearecollins.com/case-studies/arcane' },
  ] })

export const ruecaWatch = [
  { t: 'You saved a shelved identity for a design tool called Weaver, shelved because Figma bought Weave. Textile metaphors for design tools are getting crowded, so Rueca should lean on the wheel and the hand, not on “weaving”.', u: 'https://x.com/thenickpattison/status/2090078556269289742' },
  { t: 'You also saved an essay arguing brand work should build one world instead of pitching safe, middle and bold routes. So the three directions below aren’t a risk ladder. They’re three materials of one world (thread, paper, wood), and they combine.', u: 'https://x.com/samstooff/status/2076632115878232394' },
]

/* Three directions, one world. Each names its type pairing (from ruecaPairs) and the Trove patterns it rests on. */
export const ruecaDirections = [
  { id: 'grabado', name: 'Grabado', gloss: 'engraving', rec: true, chosen: true, pair: 'alegreya', from: ['engraving', 'keep', 'serif', 'accent'],
    line: 'Old picture, new drawing.',
    idea: 'A hand-drawn engraving of the wheel sits next to flat technical diagrams in indigo hairline and handwritten callouts. Achiote “red pen” marks the one thing that matters, and the picture can be a flat bright block (as in Vorflux). This is the wire identity you already chose (“the harness, drawn”) with a 17th-century picture inside the frame, so the 12-shell rollout carries over and only the imagery changes.',
    type: 'Alegreya 800 display (the free, open cousin of Tagada) · Libre Franklin body · handwritten labels (Geist Mono stays for code only)',
    image: 'Your hand-drawn engraving or woodcut of a rueca, plus diagrams of how it works: wheel, drive band, flyer.',
    watch: 'Needs the engraving to be good. A clip-art engraving would sink it, and that part is in your hands.' },
  { id: 'hilo', name: 'Hilo', gloss: 'thread', pair: 'gloock', from: ['material', 'accent', 'dye'],
    line: 'Spin something real.',
    idea: 'No printed mark at all. The wordmark is pressed into felt, linen or paper, and dyed threads in the brights run through every layout as the accent and the motion: they spin, pull and tie things off. The quietest and most premium of the three.',
    type: 'Gloock display (high contrast, like Claude Type’s wordmark on wool) · Libre Franklin body · handwritten notes',
    image: 'Photographs of real material (wool roving, felt, linen) with the mark debossed. The thread is a vector line that can animate.',
    watch: 'Debossing reads beautifully large and dies at 16px. The favicon needs its own solid form.' },
  { id: 'taller', name: 'Taller', gloss: 'workshop', pair: 'young', from: ['tool', 'dye', 'serif'],
    line: 'Raw material in. Real tools out.',
    idea: 'A maker’s mark cut into walnut, chunky shop-sign serif, and the old-tool/new-tool pairing as the image system: a spindle next to a cursor, a flyer next to a slider. Gualda thread ties stitch the wood panels to flat, bright software panels: rustic and modern side by side.',
    type: 'Young Serif display (single weight, chunky) · Libre Franklin body · handwritten labels',
    image: 'Paired still lifes of an old tool and its software twin, carved or incised lettering.',
    watch: 'The warmest and the most likely to drift into farmhouse kitsch. Keep the grids strict.' },
]

export const ruecaEcho = {
  alegreya: 'Closest free match to Tagada, which you saved as “warm and hand-drawn without being twee”.',
  fell: 'Echoes the old-style specimen with ct ligatures you saved (aboutcontact).',
  fraunces: 'Wonky and soft. No direct match in your saves, so kept as the flexible fallback.',
  young: 'Echoes the letterpress slab A and the hand-cut matchbox lettering.',
  vollkorn: 'Echoes the condensed letterpress slab set on an arc.',
  gloock: 'Echoes Claude Type’s high-contrast wordmark on brown wool and Atelier Dyakova’s serif.',
  piazzolla: 'Echoes the walnut maker’s mark: carved, angular strokes.',
}

/* Paid display serifs, 11 Oct 2026. All are foundry TRIALS already installed on Rafael's Mac (~/Library/Fonts),
   loaded on the board with CSS local(), so they render on this machine only and are never shipped or published.
   Trials are for evaluation; the site needs a web + desktop licence from the foundry. */
export const ruecaPaid = [
  { id: 'dominicale', name: 'Dominicale', ps: 'DominicaleTrial-Alpha', weight: 600, tracking: '-0.01em',
    foundry: 'Altiplano Typefaces · Raphael Verona', url: 'https://www.altiplano.xyz', fit: ['grabado', 'taller'], star: true,
    why: 'Chunky, soft-wedged and a little uneven, like letters cut by hand. The most rustic of the paid set without being a costume, and the closest in spirit to Tagada. It comes from Altiplano, named for the Andean highlands, which is a nice origin for a Spanish name.',
    watch: 'The trial is an “Alpha” with one weight, so check the foundry for the finished family and its release date.' },
  { id: 'signifier', name: 'Signifier', ps: 'TestSignifier-Black', chosen: true, alt: 'TestSignifier-Regular', weight: 900, tracking: '-0.02em',
    foundry: 'Klim Type Foundry · Kris Sowersby', url: 'https://klim.co.nz/retail-fonts/signifier/', fit: ['grabado'], star: true,
    why: 'Klim’s re-reading of the 17th-century Fell types, drawn with digital precision, which is old meets new in the letters themselves. It’s the grown-up version of the free IM Fell draft. Black is sturdy and rustic, and Regular is sharp and literary.',
    watch: 'It’s cool rather than warm at light weights. Use Bold or Black for the wordmark.' },
  { id: 'sectra', name: 'GT Sectra', ps: 'GTSectraDisplayTrial-Bold', weight: 700, tracking: '-0.02em',
    foundry: 'Grilli Type', url: 'https://www.grillitype.com/typeface/gt-sectra', fit: ['grabado', 'hilo'],
    why: 'A broad-nib pen crossed with a scalpel: calligraphic strokes with cut, angular joins. It reads as carved and engraved, which suits the Grabado direction.',
    watch: 'Widely used in editorial since 2014, so it’s less of a discovery than the others.' },
  { id: 'ivar', name: 'Ivar Display', ps: 'IvarDisplayTRIAL-SemiBold', weight: 600, tracking: '-0.015em',
    foundry: 'Letters from Sweden · Göran Söderström', url: 'https://lettersfromsweden.se/font/ivar/', fit: ['hilo'],
    why: 'Warm, open old-style forms with crisp details, plus Display, Headline, Text and Fine cuts for every size. It’s the most refined and quiet of the set, wool rather than wood.',
    watch: 'It can look like a premium lifestyle brand. You’d rely on the imagery for the rustic part.' },
  { id: 'plantijn', name: 'Martina Plantijn', ps: 'TestMartinaPlantijnVF-Roman', weight: 700, tracking: '-0.02em', variable: true,
    foundry: 'Klim Type Foundry', url: 'https://klim.co.nz/retail-fonts/martina-plantijn/', fit: ['grabado', 'taller'],
    why: 'A sturdy 16th-century book face from the Plantin printing tradition, rethought by Klim. Dark, solid and practical, like an old manual. It’s variable from 300 to 900.',
    watch: 'It’s bookish, so at hero size it needs tight tracking to avoid feeling like a newspaper.' },
  { id: 'incise', name: 'F37 Incise', ps: 'F37InciseTrial-Bold', weight: 700, tracking: '-0.02em',
    foundry: 'F37 Foundry · Rodrigo Fuenzalida, Rick Banks', url: 'https://www.f37foundry.com', fit: ['taller'],
    why: 'Glyphic, flared letters that look chiselled into stone or wood, the walnut maker’s mark as a typeface. Co-designed by Rodrigo Fuenzalida from Chile.',
    watch: 'It isn’t a true serif. It reads as carved, not printed, so it pairs best with Taller.' },
  { id: 'arizona', name: 'ABC Arizona Flare', ps: 'ABCArizonaFlareTrial-Regular', weight: 400, tracking: '-0.02em',
    foundry: 'Dinamo · Elias Hanzer', url: 'https://abcdinamo.com/typefaces/arizona', fit: ['hilo', 'grabado'],
    why: 'One family that slides from sans to serif (Sans, Serif, Flare, Mix). Old and new live in the same type system, so a mono-like sans and a flared serif can share one voice.',
    watch: 'It’s gentle, and less rustic than Dominicale or Signifier.' },
]
export const ruecaPaidAlsoTried = 'Also tried from your installed fonts and set aside: GT Alpina (lovely but bouncy), Reckless Neue and PP Hatton (fashion, not craft), Tiempos Headline (newspaper), PP Cirka, GTF Byrd, Civilitate (a gorgeous Civilité script, but only as a one-word accent), Jabin, Louche and Grenat (too decorative). Tagada, the one you saved, isn’t installed. It’s on Future Fonts, so trying it means buying early access.'

/* HEX swipe file (swipe.hex.inc), shared by Rafael 11 Oct 2026. Images hotlinked, never copied. */
export const hexRefs = [
  { t: 'Vorflux: Roman helmet as a flat screen-print, over golden-ratio construction lines, dotted measures and code', img: 'https://swipe.hex.inc/media/uploads/mumuxxk8-b551fc-image.webp', take: 'Grabado doesn’t have to be hatched. The old picture can be a flat Rubia silhouette with Añil construction geometry drawn over it.' },
  { t: 'Vorflux: classical bust on a coin, “Multi-agent harness · Orchestration system”', img: 'https://swipe.hex.inc/media/uploads/muvtb8yd-c65d18-image.webp', take: 'Proof the move works for agent tooling: an old object plus technical labels, framed like a seal. Rueca’s version is the wheel on the coin, with the harness parts as the legend around the rim.' },
  { t: 'Ryvn: a line of copy set as a tight spiral', img: 'https://swipe.hex.inc/media/uploads/mumza3rc-1435c2-image.webp', take: 'Type wound like thread on a bobbin. A motion idea: Rueca’s tagline spins onto the wheel.' },
  { t: 'Dessn, “the design tool built for curious minds”: serif display with procedural flowers', img: 'https://swipe.hex.inc/media/uploads/musfu8fr-e29097-image.webp', take: 'A design tool with a warm serif and organic, procedural imagery: confirmation that serif + hand-made reads as “creative tool”, not old-fashioned. The flowers could be generated by the harness itself.' },
  { t: 'AgentMail: rubber stamp and an iridescent seal over code', img: 'https://swipe.hex.inc/media/uploads/mumz638n-329194-image.webp', take: 'A stamp or seal as the mark, old office ritual over new tech. Good for Taller’s maker’s mark.' },
  { t: 'Anthrogen: mark embossed into paper, no ink', img: 'https://swipe.hex.inc/media/uploads/mun2qhqg-9f40d8-a-1.webp', take: 'The same move as the crane in linen, done for a tech brand. It backs up Hilo.' },
  { t: 'Anthrogen: one tangled procedural line', img: 'https://swipe.hex.inc/media/uploads/muvtdv8f-2cc79e-image.webp', take: 'The madder thread, generative. It could be drawn live by the harness itself.' },
  { t: 'First Star: pen plotter drawing an engraving-like hatch', img: 'https://swipe.hex.inc/media/uploads/mun2wac4-4bc571-img-2317.webp', take: 'A production idea: draw the rueca by hand, then plot it, so a machine draws the hand.' },
]

/* Handwriting replaces the mono for labels, measurements, captions and red-pen notes (11 Oct, Rafael's call).
   All free and open-licensed (OFL or Apache) so an open-source site can ship them. Code stays in Geist Mono:
   a command people copy should be unambiguous. Local handwriting fonts were tried and skipped (unclear licences). */
export const ruecaHands = [
  { id: 'aurore', family: 'La Belle Aurore', size: 1.2, star: true, note: 'Chosen 11 Oct for Lámina técnica: a fine-nib, 18th–19th-century hand, the plate annotator’s pen. It replaced Caveat, which read as a felt-tip marker next to the engravings. Weight 400, Latin only.' },
  { id: 'architects', family: 'Architects Daughter', size: 1.15, note: 'Draftsman’s lettering: hand-made but still technical, so it takes over the mono’s job (labels, sizes) without losing precision. Fits the diagrams and the 90s software side best.' },
  { id: 'caveat', family: 'Caveat', size: 1.25, note: 'Used until 11 Oct. The most natural pen note: red-pen asides, labels on the engraving, the note beside the install command. Weight 500, Latin only, about 20 KB on the site.' },
  { id: 'nanum', family: 'Nanum Pen Script', size: 1.35, note: 'A quick, narrow ballpoint hand. The most rustic and personal, like notes in the margin of a workshop manual.' },
  { id: 'kalam', family: 'Kalam', size: 1.05, note: 'A neat, slightly slanted hand from Indian Type Foundry. The most legible at small sizes.' },
  { id: 'walter', family: 'Walter Turncoat', size: 0.95, note: 'Blocky drafting caps. It reads like labels on a blueprint and makes the most of the 90s-software mood.' },
  { id: 'covered', family: 'Covered By Your Grace', size: 1.3, note: 'Felt-tip marker. Bold and loud, good for one-word callouts, too heavy for running labels.' },
  { id: 'reenie', family: 'Reenie Beanie', size: 1.4, note: 'A rough, scratchy ballpoint. The most authentic, and the hardest to read below 14px.' },
]

/* SUPERSEDED 16 Oct 2026 by the Mora palette (brand/RUECA.md → Colour): these are the walnut-era ramps, kept as
   the record. Don't build new work from them.
   Tonal ramps, 11 Oct (Rafael: "add some more darks and lights in the same hue families"). OKLCH, same hue,
   stepped lightness, chroma eased toward the ends; each family's original colour (base: true) sits at its natural
   step. Lights are the modern half (pastel washes, tints); darks lean a few degrees warmer, like dyed cloth, for
   text on colour and deep blocks. Generated by brand/tools/ramps.mjs. */
export const ruecaRamps = {
  'Tierra': { note: 'neutral: undyed wool (50) to walnut (900)', steps: [{ s: 50, hex: '#F3F1EB', base: true }, { s: 100, hex: '#E8E2DD' }, { s: 200, hex: '#D7CFCA' }, { s: 300, hex: '#C1B9B3' }, { s: 400, hex: '#A8A099' }, { s: 500, hex: '#908781' }, { s: 600, hex: '#766E69' }, { s: 700, hex: '#5C5551' }, { s: 800, hex: '#423D3A' }, { s: 900, hex: '#181411', base: true }] },
  'Achiote': { note: 'annatto', steps: [{ s: 50, hex: '#FFF4F1' }, { s: 100, hex: '#FFE7E0' }, { s: 200, hex: '#FED0C3' }, { s: 300, hex: '#FEAF99' }, { s: 400, hex: '#FE8562' }, { s: 500, hex: '#E8582C', base: true }, { s: 600, hex: '#CB4522' }, { s: 700, hex: '#A53016' }, { s: 800, hex: '#7F1E0C' }, { s: 900, hex: '#5B0C04' }] },
  'Cochinilla': { note: 'cochineal', steps: [{ s: 50, hex: '#FEF4F2' }, { s: 100, hex: '#FEE7E3' }, { s: 200, hex: '#FED0C7' }, { s: 300, hex: '#FEAEA0' }, { s: 400, hex: '#EE7A68', base: true }, { s: 500, hex: '#DF6C5D' }, { s: 600, hex: '#BC5448' }, { s: 700, hex: '#983E36' }, { s: 800, hex: '#752B25' }, { s: 900, hex: '#531816' }] },
  'Gualda': { note: 'weld', steps: [{ s: 50, hex: '#FDF7E5' }, { s: 100, hex: '#F8ECCB' }, { s: 200, hex: '#F0DBA1' }, { s: 300, hex: '#F2C744', base: true }, { s: 400, hex: '#D2A628' }, { s: 500, hex: '#B98C09' }, { s: 600, hex: '#9A7103' }, { s: 700, hex: '#7C5800' }, { s: 800, hex: '#5E4000' }, { s: 900, hex: '#412A00' }] },
  'Hoja': { note: 'leaf', steps: [{ s: 50, hex: '#ECFBF4' }, { s: 100, hex: '#D7F5E7' }, { s: 200, hex: '#B6EAD2' }, { s: 300, hex: '#89D9B7' }, { s: 400, hex: '#5DC39B' }, { s: 500, hex: '#2FA57C', base: true }, { s: 600, hex: '#138E6B' }, { s: 700, hex: '#067056' }, { s: 800, hex: '#015341' }, { s: 900, hex: '#00382C' }] },
  'Cielo': { note: 'light indigo', steps: [{ s: 50, hex: '#F0F8FE' }, { s: 100, hex: '#DBF0FF' }, { s: 200, hex: '#B9E3FF' }, { s: 300, hex: '#8ECFF8' }, { s: 400, hex: '#5DB4E8', base: true }, { s: 500, hex: '#459DD0' }, { s: 600, hex: '#2E81AF' }, { s: 700, hex: '#1B668E' }, { s: 800, hex: '#0B4C6C' }, { s: 900, hex: '#01334C' }] },
  'Malva': { note: 'mallow', steps: [{ s: 50, hex: '#F7F5FF' }, { s: 100, hex: '#EEEAFE' }, { s: 200, hex: '#DED6FF' }, { s: 300, hex: '#C9BAFE' }, { s: 400, hex: '#A88BF6', base: true }, { s: 500, hex: '#9D7DE7' }, { s: 600, hex: '#8363C3' }, { s: 700, hex: '#694B9D' }, { s: 800, hex: '#503578' }, { s: 900, hex: '#372156' }] },
  'Añil': { note: 'deep indigo, for lines', steps: [{ s: 50, hex: '#F4F7FF' }, { s: 100, hex: '#E7ECFE' }, { s: 200, hex: '#D0DBFE' }, { s: 300, hex: '#B1C3FE' }, { s: 400, hex: '#8FA7FE' }, { s: 500, hex: '#6E89FE' }, { s: 600, hex: '#5269EA' }, { s: 700, hex: '#3440C8', base: true }, { s: 800, hex: '#2C3A95' }, { s: 900, hex: '#1B246C' }] },
  'Rubia': { note: 'madder: the warm darks', steps: [{ s: 50, hex: '#FEF4F2' }, { s: 100, hex: '#FDE7E3' }, { s: 200, hex: '#F7D3CC' }, { s: 300, hex: '#ECB7AD' }, { s: 400, hex: '#D89B8F' }, { s: 500, hex: '#C08175' }, { s: 600, hex: '#A1685D' }, { s: 700, hex: '#815047' }, { s: 800, hex: '#623A33' }, { s: 900, hex: '#5E2219', base: true }] },
}
