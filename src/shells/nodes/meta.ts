import type { ShellMeta } from '../types'
export const meta: ShellMeta = {
  id: 'nodes',
  name: 'Nodes',
  category: 'Graphics',
  description: 'Build an image by wiring effect nodes together. Every node shows its own preview, and you can export the picture or the graph.',
  archetype: 'Node graph + preview + inspector',
  references: ['Cables.gl', 'TouchDesigner', 'Figma Weave', 'ComfyUI'],
  order: 40,
}
