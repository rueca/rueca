import type { ShellMeta } from '../types'
export const meta: ShellMeta = {
  id: 'dither',
  name: 'Dither lab',
  category: 'Photo',
  description: 'Drop in a photo, shape it, then dither it — Floyd–Steinberg, Atkinson, Bayer, halftone, ASCII, pixelate — through retro palettes, with a before/after split and pixel-exact zoom.',
  archetype: 'Image in → effect chain → export',
  references: ['Efecto', 'Tooooools', 'Grainrad', 'Affinity Photo'],
  order: 21,
}
