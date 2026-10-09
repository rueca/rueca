import type { ShellMeta } from '../types'

export const meta: ShellMeta = {
  id: 'photo',
  name: 'Develop',
  category: 'Photo',
  description: 'A non-destructive photo editor in WebGL2: tone, curves, colour mixer, crop and straighten, histogram with clipping, before/after, presets, named history, JPG/PNG and .cube LUT export.',
  archetype: 'Image + adjustments + histogram + compare',
  references: ['Lightroom', 'Affinity Photo', 'Darkroom'],
  order: 40,
}
