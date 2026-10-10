import type { ShellMeta } from '../types'

export const meta: ShellMeta = {
  id: 'scene',
  name: 'Scene',
  category: '3D',
  description: 'Configure a 3D product: pick colourways, move parts, switch camera angles and export a sharp image. Works with 3D code written without React.',
  archetype: '3D view + outliner + inspector',
  references: ['Spline', 'Blender', 'Framer 3D'],
  order: 30,
}
