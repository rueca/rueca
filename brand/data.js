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
  'Telón (curtain)', 'Bambalina (border curtain)', 'Perilla (knob)', 'Mahlstick', 'Mechane', 'Tenter', 'Tympan', 'Heddle', 'Kitbash', 'Okudagram', 'Bilancino (Italian marionette control)']

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
    watch: 'bastidor.com is an embroidery shop and the GitHub org is empty but held (bastidorhq is free). In English it sounds a little like “matador”, which is fun or awkward depending on taste.',
    font: { family: '"Fraunces", Georgia, serif', weight: 600, tracking: '-0.02em', case: 'lower', label: 'Fraunces SemiBold' },
    colors: { light: { ink: '#1D1B19', acc: '#2F3E8F', bg: '#EFE8DA' }, dark: { ink: '#EFE8DA', acc: '#8E9CFF', bg: '#1D1B19' } },
    palette: [{ name: 'Ink', hex: '#1D1B19' }, { name: 'Linen', hex: '#EFE8DA' }, { name: 'Indigo thread', hex: '#2F3E8F' }, { name: 'Beech', hex: '#D9B98C' }, { name: 'Madder', hex: '#A33B2A' }],
    taglines: ['The frame around the work.', 'Hold it taut. Make it sing.', 'Behind the scenes of every prototype.'],
    handle: 'bastidorhq', domain: 'bastidor.dev',
  },
  {
    id: 'periaktos', name: 'Periaktos', recommended: false, say: 'peh-ree-AK-tos', short: 'Turn it to change the scene',
    why: 'This is the deep cut. Greek theatres had three-sided prisms with a different scene painted on each face, and a stagehand turned them to change the scene. That’s presets and A/B switching, about 2,000 years early. It’s free on every check, and nobody else will have it.',
    watch: 'It’s hard to spell and to say, so people will have to see it written before they can find it. Best if you want the brand to feel scholarly.',
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
  { title: 'Deus ex machina', era: 'Greek theatre, 5th c. BC', body: 'The mechane was a crane that lowered gods onto the stage. Machinery has always been part of the show.' },
  { title: 'The man behind the curtain', era: 'The Wizard of Oz, 1939', body: '“Pay no attention to the man behind the curtain.” Good chrome gets out of the way of the show.' },
]
