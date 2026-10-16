/* The selection-aware context bar: what this selection can do next. */
import {
  AlignHorizontalDistributeCenter, AlignVerticalDistributeCenter, SquaresUnite, SquaresSubtract, SquaresIntersect, SquaresExclude,
  Frame, Component, Columns3, Rows3, ImageDown, CodeXml, Type, Ellipsis, TextAlignStart, TextAlignCenter, TextAlignEnd, Ungroup, Combine,
} from 'lucide-react'
import { toast, type MenuItem } from '@kit'
import { ContextBar as Bar, type ContextAction } from '@kit/stage/ContextBar'
import * as S from '../model/store'
import { topMost } from '../model/tree'
import { exportSelection, copyCSS, toggleHidden, toggleLocked } from '../actions'
import type { BoolOp } from '../model/types'

export function ContextBar({ rect }: { rect: { x: number; y: number; w: number; h: number } }) {
  // subscribe to stable references only; derive arrays outside the selector
  S.useDesign((s) => s.selection)
  S.useDesign((s) => s.doc)
  const sel = S.selectedNodes()
  if (!sel.length) return null
  const nodes = S.nodesOf()
  const top = topMost(nodes, sel.map((n) => n.id))
  const single = sel.length === 1 ? sel[0] : null
  const shapes = sel.length > 1 && sel.every((n) => n.type === 'rect' || n.type === 'ellipse')
  const isBool = single?.type === 'boolean'
  const free = top.filter((id) => !S.inAutoLayout(id)).length
  const bool = (op: BoolOp) => () => { if (!S.booleanOp(op)) toast('Boolean needs two or more shapes', { type: 'error' }) }

  const more: MenuItem[] = [
    { label: 'Duplicate', shortcut: 'mod+d', onClick: () => S.duplicateSelection() },
    { label: 'Bring to front', shortcut: 'alt+mod+]', onClick: () => S.reorder('front') },
    { label: 'Send to back', shortcut: 'alt+mod+[', onClick: () => S.reorder('back') },
    { type: 'separator' },
    { label: sel.some((n) => n.visible) ? 'Hide' : 'Show', shortcut: 'shift+mod+h', onClick: toggleHidden },
    { label: 'Lock', shortcut: 'shift+mod+l', onClick: toggleLocked },
    ...(sel.some((n) => n.children?.length) ? [{ label: 'Ungroup', icon: Ungroup, shortcut: 'shift+mod+g', onClick: S.ungroup } as MenuItem] : []),
    { type: 'separator' },
    { label: 'Delete', danger: true, shortcut: 'backspace', onClick: S.deleteSelection },
  ]

  const boolIcon = isBool ? ({ union: SquaresUnite, subtract: SquaresSubtract, intersect: SquaresIntersect, exclude: SquaresExclude } as const)[single!.bool ?? 'union'] : Combine
  const actions: (ContextAction | false)[] = [
    ...(single?.type === 'text' ? [
      { icon: Type, label: 'Edit text', shortcut: 'enter', onClick: () => S.design.setState({ editing: single.id }) },
      ...([['left', TextAlignStart], ['center', TextAlignCenter], ['right', TextAlignEnd]] as const).map(([a, I]) => (
        { icon: I, label: `Align ${a}`, active: single.text!.align === a, onClick: () => S.patchNode(single.id, (n) => ({ text: { ...n.text!, align: a } }), { label: 'Text align' }) })),
      { type: 'divider' as const },
    ] : []),
    ...(single?.type === 'frame' ? [
      { icon: single.layout?.dir === 'column' ? Rows3 : Columns3, label: single.layout ? 'Remove auto layout' : 'Add auto layout', shortcut: 'shift+a', active: !!single.layout, onClick: S.addAutoLayout },
      { icon: Component, label: single.component ? 'Detach component' : 'Create component', shortcut: 'alt+mod+k', active: !!single.component,
        onClick: () => { const r = S.toggleComponent(); toast(r === 'created' ? 'Component created' : 'Component detached', { type: 'success' }) } },
      { type: 'divider' as const },
    ] : []),
    // align lives in the Design panel's Position row; distribute has no other home on screen
    ...(free > 2 ? [
      { icon: AlignHorizontalDistributeCenter, label: 'Distribute horizontally', shortcut: 'alt+shift+h', onClick: () => S.distribute('x') },
      { icon: AlignVerticalDistributeCenter, label: 'Distribute vertically', shortcut: 'alt+shift+v', onClick: () => S.distribute('y') },
      { type: 'divider' as const },
    ] : []),
    (shapes || isBool) && {
      type: 'menu', icon: boolIcon, label: 'Boolean', items: [
        { type: 'label', label: 'Boolean' },
        { label: 'Union', icon: SquaresUnite, checked: single?.bool === 'union', onClick: bool('union') },
        { label: 'Subtract', icon: SquaresSubtract, checked: single?.bool === 'subtract', onClick: bool('subtract') },
        { label: 'Intersect', icon: SquaresIntersect, checked: single?.bool === 'intersect', onClick: bool('intersect') },
        { label: 'Exclude', icon: SquaresExclude, checked: single?.bool === 'exclude', onClick: bool('exclude') },
      ],
    },
    { type: 'divider' },
    ...(sel.length > 1 ? [
      { icon: Frame, label: 'Frame selection', shortcut: 'alt+mod+g', onClick: () => S.wrapSelection('frame') },
      { icon: Component, label: 'Create component', shortcut: 'alt+mod+k', onClick: () => { S.toggleComponent(); toast('Component created', { type: 'success' }) } },
      { type: 'divider' as const },
    ] : []),
    { icon: ImageDown, label: 'Export', shortcut: 'shift+mod+e', onClick: exportSelection },
    { icon: CodeXml, label: 'Copy CSS', shortcut: 'alt+shift+c', onClick: copyCSS },
    { type: 'menu', icon: Ellipsis, label: 'More', items: more, align: 'end' },
  ]

  // inset.bottom keeps the bar clear of the tool dock
  return <Bar anchor={rect} actions={actions} inset={{ bottom: 56 }} />
}
