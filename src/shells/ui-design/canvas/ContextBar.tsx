/* The selection-aware context bar: what this selection can do next. */
import {
  AlignStartVertical, AlignCenterVertical, AlignEndVertical, AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal,
  AlignHorizontalDistributeCenter, AlignVerticalDistributeCenter, SquaresUnite, SquaresSubtract, SquaresIntersect, SquaresExclude,
  Frame, Component, Columns3, Rows3, ImageDown, CodeXml, Type, Ellipsis, TextAlignStart, TextAlignCenter, TextAlignEnd, Ungroup, Combine,
} from 'lucide-react'
import { IconButton, Menu, toast, type MenuItem } from '@kit'
import * as S from '../model/store'
import { topMost } from '../model/tree'
import { SelectionBar } from '../local/SelectionBar'
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

  return (
    <SelectionBar anchor={rect}>
      {single?.type === 'text' && (
        <>
          <IconButton icon={Type} label="Edit text" shortcut="enter" onClick={() => S.design.setState({ editing: single.id })} />
          {([['left', TextAlignStart], ['center', TextAlignCenter], ['right', TextAlignEnd]] as const).map(([a, I]) => (
            <IconButton key={a} icon={I} label={`Align ${a}`} active={single.text!.align === a} onClick={() => S.patchNode(single.id, (n) => ({ text: { ...n.text!, align: a } }))} />
          ))}
          <SelectionBar.Divider />
        </>
      )}
      {single?.type === 'frame' && (
        <>
          <IconButton icon={single.layout?.dir === 'column' ? Rows3 : Columns3} label={single.layout ? 'Remove auto layout' : 'Add auto layout'} shortcut="shift+a" active={!!single.layout} onClick={S.addAutoLayout} />
          <IconButton icon={Component} label={single.component ? 'Detach component' : 'Create component'} shortcut="alt+mod+k" active={!!single.component}
            onClick={() => { const r = S.toggleComponent(); toast(r === 'created' ? 'Component created' : 'Component detached', { type: 'success' }) }} />
          <SelectionBar.Divider />
        </>
      )}
      {free > 1 && (
        <>
          <IconButton icon={AlignStartVertical} label="Align left" shortcut="alt+a" onClick={() => S.align('left')} />
          <IconButton icon={AlignCenterVertical} label="Align horizontal centres" shortcut="alt+h" onClick={() => S.align('hcenter')} />
          <IconButton icon={AlignEndVertical} label="Align right" shortcut="alt+d" onClick={() => S.align('right')} />
          <IconButton icon={AlignStartHorizontal} label="Align top" shortcut="alt+w" onClick={() => S.align('top')} />
          <IconButton icon={AlignCenterHorizontal} label="Align vertical centres" shortcut="alt+v" onClick={() => S.align('vcenter')} />
          <IconButton icon={AlignEndHorizontal} label="Align bottom" shortcut="alt+s" onClick={() => S.align('bottom')} />
          {free > 2 && (
            <>
              <IconButton icon={AlignHorizontalDistributeCenter} label="Distribute horizontally" shortcut="alt+shift+h" onClick={() => S.distribute('x')} />
              <IconButton icon={AlignVerticalDistributeCenter} label="Distribute vertically" shortcut="alt+shift+v" onClick={() => S.distribute('y')} />
            </>
          )}
          <SelectionBar.Divider />
        </>
      )}
      {(shapes || isBool) && (
        <>
          <Menu side="bottom" trigger={<IconButton icon={isBool ? ({ union: SquaresUnite, subtract: SquaresSubtract, intersect: SquaresIntersect, exclude: SquaresExclude } as const)[single!.bool ?? 'union'] : Combine} label="Boolean" />}
            items={[
              { type: 'label', label: 'Boolean' },
              { label: 'Union', icon: SquaresUnite, checked: single?.bool === 'union', onClick: bool('union') },
              { label: 'Subtract', icon: SquaresSubtract, checked: single?.bool === 'subtract', onClick: bool('subtract') },
              { label: 'Intersect', icon: SquaresIntersect, checked: single?.bool === 'intersect', onClick: bool('intersect') },
              { label: 'Exclude', icon: SquaresExclude, checked: single?.bool === 'exclude', onClick: bool('exclude') },
            ]} />
          <SelectionBar.Divider />
        </>
      )}
      {sel.length > 1 && (
        <>
          <IconButton icon={Frame} label="Frame selection" shortcut="alt+mod+g" onClick={() => S.wrapSelection('frame')} />
          <IconButton icon={Component} label="Create component" shortcut="alt+mod+k" onClick={() => { S.toggleComponent(); toast('Component created', { type: 'success' }) }} />
          <SelectionBar.Divider />
        </>
      )}
      <IconButton icon={ImageDown} label="Export" shortcut="shift+mod+e" onClick={exportSelection} />
      <IconButton icon={CodeXml} label="Copy CSS" shortcut="alt+shift+c" onClick={copyCSS} />
      <Menu align="end" items={more} trigger={<IconButton icon={Ellipsis} label="More" />} />
    </SelectionBar>
  )
}
