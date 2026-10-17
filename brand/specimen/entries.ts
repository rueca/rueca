/* The nomenclature (brand/NOMENCLATURE.md), one entry per Mora colour, after Werner's Nomenclature of Colours
   (1821). Hex values are brand/RUECA.md's; the facts are the nomenclature's, word for word, so the two stay in step.
   `job` is what the hand writes in the margin: the colour's job in Rueca. */
import achiote from './engravings/achiote.webp?url'
import gualda from './engravings/gualda.webp?url'
import anil from './engravings/anil.webp?url'
import malva from './engravings/malva.webp?url'
import mora from './engravings/mora.webp?url'
import nogal from './engravings/nogal.webp?url'
import lana from './engravings/lana.webp?url'
import platino from './engravings/platino.webp?url'

export type Entry = {
  name: string
  english: string
  /** the source's Latin name, set in italic; empty for the metal */
  latin: string
  part: string
  note: string
  job: string
  /** the swatch, and the text shade that sits beside it on the plate */
  hex: string
  /** engravings of the source, side by side (Hoja is two dips: Gualda over Añil) */
  art: string[]
}

export const ENTRIES: Entry[] = [
  { name: 'Achiote', english: 'annatto', latin: 'Bixa orellana', part: 'the seeds’ red coat', hex: '#F6571C', art: [achiote],
    note: 'Ground for centuries in Mesoamerica, for cloth, food and skin. It still colours Red Leicester.', job: 'the call to action' },
  { name: 'Gualda', english: 'weld, dyer’s rocket', latin: 'Reseda luteola', part: 'the whole plant, cut in flower', hex: '#FFD000', art: [gualda],
    note: 'Europe’s steadiest yellow; it holds where others fade.', job: 'an accent, never a field' },
  { name: 'Hoja', english: 'leaf green', latin: 'Reseda over Indigofera', part: 'two dips: Gualda, then Añil', hex: '#84C900', art: [gualda, anil],
    note: 'Nature has no fast green. Dyers made it from yellow over blue.', job: 'an accent, never a field' },
  { name: 'Cielo', english: 'sky blue', latin: 'Indigofera suffruticosa', part: 'the leaves, fermented in a vat', hex: '#5070F0', art: [anil],
    note: 'Dyed with añil, the indigo of the Americas.', job: 'the tools’ blue' },
  { name: 'Malva', english: 'mallow', latin: 'Malva sylvestris', part: 'the flower', hex: '#EFA6FF', art: [malva],
    note: 'Mauve is French for mallow. The colour kept the plant’s name.', job: 'the hero’s loop' },
  { name: 'Mora', english: 'blackberry, mulberry', latin: 'Rubus ulmifolius', part: 'the fruit', hex: '#6E1A3E', art: [mora],
    note: 'More a stain than a dye: it runs. We keep it for depth.', job: 'Achiote’s shadow' },
  { name: 'Nogal', english: 'walnut', latin: 'Juglans regia', part: 'the green hull', hex: '#171615', art: [nogal],
    note: 'Walnut-hull ink: the drafter’s brown-black.', job: 'all ink, all text' },
  { name: 'Lana', english: 'wool', latin: 'Ovis aries', part: 'the fleece', hex: '#FDFBFA', art: [lana],
    note: 'What the wheel is for.', job: 'the paper' },
  { name: 'Platino', english: 'platinum', latin: '', part: 'the metal', hex: '#DCDAD9', art: [platino],
    note: 'The one colour that isn’t grown.', job: 'the grey plate' },
]

/** text on a colour: Nogal on brights and pale fields, Lana on the dark ones (brand/RUECA.md → Colour, rule 3) */
export const onColour = (hex: string) => (['#171615', '#6E1A3E'].includes(hex) ? '#F7F5F4' : '#171615')
