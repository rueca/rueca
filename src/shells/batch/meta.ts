import type { ShellMeta } from '../types'
export const meta: ShellMeta = {
  id: 'batch',
  name: 'Batch',
  category: 'Generators',
  description: 'Turn one template and a product list into every social size at once. Adjust any size by hand and export them all as a zip.',
  archetype: 'Template × products × sizes + export queue',
  references: ['Figma', 'Canva', 'Freshcoat'],
  order: 40,
}
