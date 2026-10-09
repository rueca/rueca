/* Document settings — what the inspector shows when nothing is selected (Spline convention). */
import { defineSchema, folder, p, createParams } from '@kit'

export const docSchema = defineSchema({
  preview: folder('Preview', {
    previewRes: p.select('768', [{ value: '512', label: '512' }, { value: '768', label: '768' }, { value: '1024', label: '1024' }], { label: 'Resolution', hint: 'Pixels the preview cooks at. Thumbnails are always small.' }),
    backdrop: p.select('checker', ['checker', 'dark', 'light'], { hint: 'What shows through transparent pixels.' }),
    draft: p.boolean(true, { label: 'Draft cook', hint: 'Cook the preview at half resolution while a value is moving, then refine on release.' }),
  }),
  graph: folder('Graph', {
    thumbs: p.boolean(true, { label: 'Node previews', hint: 'Live thumbnail on every node.' }),
    wires: p.select('bezier', [{ value: 'bezier', label: 'Curved' }, { value: 'step', label: 'Stepped' }, { value: 'straight', label: 'Straight' }]),
    snap: p.boolean(true, { label: 'Snap to grid' }),
    minimap: p.boolean(false),
  }),
  // owned by the toolbar and the preview HUD, so the inspector skips this folder
  view: folder('View', {
    previewOf: p.select('output', [{ value: 'output', label: 'Output' }, { value: 'selection', label: 'Selection' }], { label: 'Show', hint: 'Selection previews whichever node is selected (TouchDesigner viewer). P toggles.' }),
    view: p.select('split', ['graph', 'split', 'preview']),
  }),
  export: folder('Export', {
    exportRes: p.select('2048', [{ value: '1024', label: '1024' }, { value: '2048', label: '2048' }], { label: 'PNG size', hint: 'Export re-cooks the graph at this size, so it is sharp, not upscaled.' }),
  }),
})

export const doc = createParams(docSchema, { id: 'nodes-doc', url: false })
export type DocValues = ReturnType<typeof doc.values>
