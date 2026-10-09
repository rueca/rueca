/* Shell-level actions with feedback (toasts). Shared by commands, menus,
   the context bar and the inspector so each verb has one implementation. */
import { toast, toastManager, download, copyText, exportJSON, stamp } from '@kit'
import * as S from './model/store'
import { prefs } from './model/prefs'
import { renderNodeToCanvas } from './render/paint'
import { cssFor } from './render/css'
import { find, locate } from './model/tree'
import { camera, zoomToBox } from './canvas/camera'
import { union } from './model/layout'
import type { Node } from './model/types'

const fileName = (n: Node) => {
  const v = prefs.values()
  return `${n.name.replace(/[\\/:*?"<>|]+/g, '-').trim() || 'export'}${v.exportSuffix}.${v.exportFormat}`
}

async function exportNodes(nodes: Node[]) {
  if (!nodes.length) { toast('Nothing to export', { description: 'Select a layer or frame first.', type: 'error' }); return }
  const v = prefs.values()
  const scale = Number(v.exportScale)
  const id = toast(nodes.length > 1 ? `Exporting ${nodes.length} layers…` : `Exporting ${nodes[0].name}…`, { type: 'loading', timeout: 0 })
  try {
    for (const n of nodes) {
      const bg = v.exportFormat === 'jpg' ? '#ffffff' : undefined
      const c = await renderNodeToCanvas(n, S.nodesOf(), scale, bg)
      const type = v.exportFormat === 'jpg' ? 'image/jpeg' : v.exportFormat === 'webp' ? 'image/webp' : 'image/png'
      const blob = await new Promise<Blob | null>((r) => c.toBlob(r, type, 0.92))
      if (blob) download(blob, fileName(n))
    }
    toast(nodes.length > 1 ? `${nodes.length} files exported` : `${fileName(nodes[0])} exported`, { type: 'success', description: `${scale}× ${v.exportFormat.toUpperCase()}` })
  } catch (e) {
    toast('Export failed', { type: 'error', description: String(e) })
  } finally {
    toastManager.close(id)
  }
}

export const exportSelection = () => exportNodes(S.selectedNodes())
export const exportFrames = () => exportNodes(S.nodesOf().filter((n) => n.type === 'frame' && n.visible))

export async function copyCSS() {
  const s = S.get()
  const sel = S.selectedNodes(s)
  if (!sel.length) { toast('Select a layer to copy its CSS', { type: 'error' }); return }
  const L = S.layout(s)
  const css = sel.map((n) => cssFor(n, L.get(n.id)!, !!locate(S.nodesOf(s), n.id)?.parent?.layout)).join('\n\n')
  await copyText(css)
  toast('CSS copied', { type: 'success', description: sel.length > 1 ? `${sel.length} layers` : sel[0].name })
}

export function downloadDocument() {
  exportJSON(S.get().doc, `${S.get().doc.name.toLowerCase().replace(/\s+/g, '-')}-${stamp()}.json`)
}

export async function openDocument(file: File) {
  try {
    const doc = JSON.parse(await file.text())
    if (!doc?.pages?.length) throw new Error('Not a design file')
    S.design.setState({ doc, pageId: doc.pages[0].id, selection: [] })
    S.commit()
    toast(`Opened ${doc.name ?? file.name}`, { type: 'success' })
  } catch (e) { toast('Could not open file', { type: 'error', description: String((e as Error).message ?? e) }) }
}

export function zoomToSelection() {
  const s = S.get()
  const b = S.selectionBox(s) ?? union(S.nodesOf(s).map((n) => S.layout(s).get(n.id)!).filter(Boolean))
  zoomToBox(b)
}
export function zoomToFitPage() {
  const s = S.get()
  zoomToBox(union(S.nodesOf(s).map((n) => S.layout(s).get(n.id)!).filter(Boolean)))
}
export function zoomBy(k: number) { camera.zoomTo(camera.getState().zoom * k) }

export function toggleHidden() {
  const sel = S.selectedNodes()
  if (!sel.length) return
  const hide = sel.some((n) => n.visible)
  S.patchSelection({ visible: !hide })
}
export function toggleLocked() {
  const sel = S.selectedNodes()
  if (!sel.length) return
  const lock = sel.some((n) => !n.locked)
  S.patchSelection({ locked: lock })
  if (lock) S.select([])
}

export function setOpacityKey(digit: number) {
  if (!S.get().selection.length) return
  S.patchSelection({ opacity: digit === 0 ? 1 : digit / 10 })
}

export function nameOf(id: string) { return find(S.nodesOf(), id)?.name ?? '' }
