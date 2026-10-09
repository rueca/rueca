import type { ShellMeta } from '../types'
export const meta: ShellMeta = {
  id: 'generate',
  name: 'Generate',
  category: 'AI',
  description: 'An image-generation playground with a mock model: streamed progress, a queue, a masonry history grouped by prompt, compare, variations, remix and upscale.',
  archetype: 'Prompt + params + history gallery',
  references: ['Figma Weave', 'Midjourney web', 'Krea', 'Nano Banana editors'],
  order: 41,
}
