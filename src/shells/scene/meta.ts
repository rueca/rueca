import type { ShellMeta } from '../types'

export const meta: ShellMeta = {
  id: 'scene',
  name: 'Scene',
  category: '3D',
  description: 'A product configurator in vanilla three.js: outliner, transform gizmo, axis view, colourways, camera views and a 2× render. Proves the harness wraps a non-React renderer.',
  archetype: 'Viewport + outliner + inspector',
  references: ['Spline', 'Blender', 'Framer 3D'],
  order: 30,
}
