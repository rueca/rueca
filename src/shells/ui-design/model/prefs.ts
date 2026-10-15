/* Studio preferences — the tunable, schema-driven part of the shell. They live in
   the toolbar's <SettingsMenu>; the inspector's empty state shows the page and
   document instead. */
import { defineSchema, folder, p, createParams } from '@kit'

export const prefsSchema = defineSchema({
  snapping: folder('Snapping', {
    snapObjects: p.boolean(true, { label: 'Objects', hint: 'Edges and centres snap to siblings and the parent frame while moving or resizing.' }),
    snapPixels: p.boolean(true, { label: 'Pixels', hint: 'Round positions and sizes to whole pixels.' }),
    snapDistance: p.number(6, { min: 2, max: 16, step: 1, unit: 'px', label: 'Distance', hint: 'How close (in screen pixels) an edge must come before it snaps.', when: (v) => v.snapObjects }),
  }, { place: 'settings' }),
  nudge: folder('Nudge', {
    nudgeSmall: p.number(1, { min: 0.5, max: 8, step: 0.5, display: 'field', label: 'Small', hint: 'Arrow keys move the selection by this much.' }),
    nudgeBig: p.number(10, { min: 2, max: 64, step: 1, display: 'field', label: 'Big', hint: 'Shift + arrow keys move by this much.' }),
  }, { place: 'settings' }),
  exporting: folder('Export settings', {
    exportScale: p.select('2', [{ value: '1', label: '1×' }, { value: '2', label: '2×' }, { value: '3', label: '3×' }, { value: '4', label: '4×' }], { label: 'Scale', hint: 'Pixel density of PNG exports.' }),
    exportFormat: p.select('png', [{ value: 'png', label: 'PNG' }, { value: 'jpg', label: 'JPG' }, { value: 'webp', label: 'WebP' }], { label: 'Format' }),
    exportSuffix: p.text('@2x', { label: 'Suffix', hint: 'Appended to file names, e.g. Home@2x.png.' }),
  }, { collapsed: true, place: 'settings' }),
  view: folder('View', {
    showGrid: p.boolean(false, { label: 'Dot grid', hint: 'A 20px dot grid behind the artboards.' }),
    showComments: p.boolean(true, { label: 'Comments', hint: 'Show comment pins on the canvas.' }),
    showConnectors: p.boolean(true, { label: 'Prototype links', hint: 'Show interaction arrows while the Prototype tab is open.' }),
  }, { collapsed: true, place: 'settings' }),
})

export const prefs = createParams(prefsSchema, { id: 'ui-design-prefs' })
export type Prefs = ReturnType<typeof prefs.values>
