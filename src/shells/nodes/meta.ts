import type { ShellMeta } from '../types'
export const meta: ShellMeta = {
  id: 'nodes',
  name: 'Nodes',
  category: 'Graphics',
  description: 'A procedural image node graph: typed ports, live per-node previews, a lazily cooked output preview and PNG / graph export.',
  archetype: 'Node graph + preview + inspector',
  references: ['Cables.gl', 'TouchDesigner', 'Figma Weave', 'ComfyUI'],
  order: 40,
}
