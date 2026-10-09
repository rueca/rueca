import type { ShellMeta } from '../types'
export const meta: ShellMeta = {
  id: 'shader',
  name: 'Gradient studio',
  category: 'Graphics',
  description: 'A live WebGL2 mesh gradient built from an effect stack — warp, grain, halftone, chromatic, vignette — with looks, randomise, 4K stills and frame-accurate loops.',
  archetype: 'Full-bleed canvas + layer stack + inspector (overlay)',
  references: ['Paper Shaders', 'Unicorn Studio', 'Spline'],
  order: 20,
}
