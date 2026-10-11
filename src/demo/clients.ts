/* ---------------------------------------------------------------------------
   The demo app's three fictional clients (brand/prototypes/DIRECTION.md).
   Every shell's sample content is work for one of them, so the gallery reads
   as one studio's portfolio, and each is an old craft relaunched today: the
   Rueca tension between old and new lives in the content itself.

     Gabinete  a museum of scientific instruments, and its visitor app   Cielo
     Agalla    natural inks (agalla = the oak gall iron-gall ink is made from)   Achiote + the six dyes
     Campana   a bell foundry with one modern hand bell   Gualda

   Pictures live in public/demo/<client>/: engravings are Nogal ink on
   transparent (brand/tools/ink.py), so a shell can re-ink them for dark themes;
   photographs are plain WebP. NOT part of the kit or the registry.
--------------------------------------------------------------------------- */

/** Rueca's palette (brand/RUECA.md §2). The shells' own UI stays neutral and blue; this is for their content. */
export const DYE = {
  lana: '#F3F1EB', // paper
  card: '#FAF8F4', // a surface on the paper
  platino: '#DCDAD5',
  nogal: '#181411', // ink
  mute: '#6E6A64',
  faint: '#A39E96',
  line: '#DCD7CE',
  rubia: '#5E2219',
  achiote: '#E8582C',
  cochinilla: '#EE7A68',
  malva: '#A88BF6',
  cielo: '#5DB4E8',
  hoja: '#2FA57C',
  gualda: '#F2C744',
  anil: '#3440C8',
} as const

/** Dark-theme ink for engravings, as the animate plate uses (a dimmed warm grey, not white). */
export const INK_DARK = '#B8B1A7'

/** A demo picture's URL (works under any Vite base). */
export const demo = (path: string) => `${import.meta.env.BASE_URL}demo/${path}`

/* ---------- Gabinete: the museum ---------- */

export type Instrument = { id: string; name: string; date: string; room: string; maker: string; img: string; blurb: string; parts: [string, string, string, string] }

export const GABINETE = {
  name: 'Gabinete',
  line: 'A museum of scientific instruments',
  bright: DYE.cielo,
  instruments: [
    { id: 'astrolabe', name: 'Astrolabe', date: 'c. 1580', room: 'Room 3 · The sky in your hand', maker: 'A workshop in Leuven', img: demo('gabinete/astrolabe.webp'),
      blurb: 'A model of the heavens you could hold up to the sun. Turn the rete to the hour and it tells you the time, the date, and how high any star will climb tonight.',
      parts: ['Ring', 'Rete', 'Alidade', 'Mater'] },
    { id: 'armillary', name: 'Armillary sphere', date: 'c. 1730', room: 'Room 1 · Circles of the sky', maker: 'A London instrument maker', img: demo('gabinete/armillary.webp'),
      blurb: 'The sky drawn in brass rings, with the Earth at the centre. The tilted band is the ecliptic, the sun’s path through the year. Astronomy was taught this way for two thousand years.',
      parts: ['Meridian', 'Ecliptic', 'Earth', 'Stand'] },
    { id: 'orrery', name: 'Orrery', date: 'c. 1790', room: 'Room 4 · Clockwork planets', maker: 'A London workshop', img: demo('gabinete/orrery.webp'),
      blurb: 'Turn the handle and the planets go round the sun at their own speeds. The gear train under the drum does the arithmetic.',
      parts: ['Sun', 'Saturn', 'Gear train', 'Drum'] },
    { id: 'telescope', name: 'Refracting telescope', date: 'c. 1760', room: 'Room 2 · Seeing further', maker: 'An optician, London', img: demo('gabinete/telescope.webp'),
      blurb: 'An achromatic lens, two glasses in one, takes the coloured fringes out of the image. The finder scope rides on top so you can find the star before you look.',
      parts: ['Objective', 'Finder', 'Eyepiece', 'Tripod'] },
    { id: 'balance', name: 'Assay balance', date: 'c. 1770', room: 'Room 5 · Weight and measure', maker: 'The Seville mint', img: demo('gabinete/balance.webp'),
      blurb: 'It can weigh a single grain of gold. When the pointer at the top rests at zero, the coin is true.',
      parts: ['Pointer', 'Beam', 'Pan', 'Pillar'] },
    { id: 'compass', name: 'Mariner’s compass', date: 'c. 1800', room: 'Room 6 · Finding north', maker: 'A chandler, Cádiz', img: demo('gabinete/compass.webp'),
      blurb: 'Hung in brass gimbals so the card stays level while the ship rolls. The lid folds back as a shade for reading it in sun.',
      parts: ['Lid', 'Card', 'Gimbal', 'Box'] },
  ] as Instrument[],
  people: [
    { id: 'ines', name: 'Inés Ferrer', role: 'Schoolteacher, 44', medal: demo('gabinete/medal-ines.webp'), face: demo('gabinete/face-ines.webp'), dye: DYE.cielo },
    { id: 'tomas', name: 'Tomás Vidal', role: 'Physics student, 21', medal: demo('gabinete/medal-tomas.webp'), face: demo('gabinete/face-tomas.webp'), dye: DYE.gualda },
    { id: 'ruth', name: 'Ruth Okafor', role: 'Retired engineer, 71', medal: demo('gabinete/medal-ruth.webp'), face: demo('gabinete/face-ruth.webp'), dye: DYE.cochinilla },
  ],
} as const

/* ---------- Agalla: the inks ---------- */

export type Ink = { id: string; name: string; dye: string; ground: string; from: string; line: string; price: string; img: string }

export const AGALLA = {
  name: 'Agalla',
  line: 'Natural inks',
  bright: DYE.achiote,
  hero: demo('agalla/hero.webp'),
  still: demo('agalla/still.webp'),
  inks: [
    { id: 'achiote', name: 'Achiote', dye: DYE.achiote, ground: '#F6D6C8', from: 'Annatto seed, Yucatán', line: 'The red of the annatto seed, warm as brick.', price: '€14', img: demo('agalla/ink-achiote.webp') },
    { id: 'cochinilla', name: 'Cochinilla', dye: DYE.cochinilla, ground: '#FADCD6', from: 'Cochineal, Oaxaca', line: 'Crimson from a beetle that lives on cactus.', price: '€18', img: demo('agalla/ink-cochinilla.webp') },
    { id: 'gualda', name: 'Gualda', dye: DYE.gualda, ground: '#FBEFC6', from: 'Weld, La Mancha', line: 'The yellow painters used for three hundred years.', price: '€14', img: demo('agalla/ink-gualda.webp') },
    { id: 'anil', name: 'Añil', dye: DYE.cielo, ground: '#D7ECF8', from: 'Indigo, Guatemala', line: 'Blue that darkens as it dries.', price: '€16', img: demo('agalla/ink-anil.webp') },
    { id: 'nogal', name: 'Nogal', dye: '#8A5A3A', ground: '#EDE0D2', from: 'Walnut husk, Navarra', line: 'Brown ink for letters that last.', price: '€12', img: demo('agalla/ink-nogal.webp') },
    { id: 'hoja', name: 'Hoja', dye: DYE.hoja, ground: '#D2EDE2', from: 'Nettle and alum, Asturias', line: 'A green you can only get from leaves.', price: '€14', img: demo('agalla/ink-hoja.webp') },
  ] as Ink[],
} as const

/* ---------- Campana: the bell ---------- */

export const CAMPANA = {
  name: 'Campana',
  line: 'Bell foundry, since 1871',
  product: 'The hand bell',
  bright: DYE.gualda,
  bell: demo('campana/bell.webp'), // engraving, isolated
  plate: demo('campana/bell-plate.webp'), // engraving with its section
  photo: demo('campana/bell-gualda.webp'),
  night: demo('campana/bell-black.webp'),
} as const

/** Decode a demo picture (shells that paint to a canvas). Cached per URL. */
const decoded = new Map<string, Promise<HTMLImageElement>>()
export function loadDemo(url: string): Promise<HTMLImageElement> {
  let p = decoded.get(url)
  if (!p) {
    p = new Promise((res, rej) => { const im = new Image(); im.decoding = 'async'; im.onload = () => res(im); im.onerror = rej; im.src = url })
    decoded.set(url, p)
  }
  return p
}
