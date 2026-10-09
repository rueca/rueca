/* In-place text editing. A plaintext contentEditable laid exactly over the
   text node (scaled by the camera), editing the node live so auto-width /
   auto-height boxes grow as you type. Esc or click away commits; an empty
   text node is removed, like Figma. */
import { useEffect, useRef } from 'react'
import { useStore } from 'zustand'
import { camera } from './camera'
import * as S from '../model/store'
import { find } from '../model/tree'
import { fontCss, lineHeightOf } from '../model/layout'
import { rgba } from '../render/css'

export function TextEditor({ id }: { id: string }) {
  const cam = useStore(camera)
  const el = useRef<HTMLDivElement>(null)
  const n = S.useDesign((s) => find(S.nodesOf(s), id))
  const b = S.useDesign((s) => S.layout(s).get(id))
  const initial = useRef(n?.text?.content ?? '')

  useEffect(() => {
    const d = el.current
    if (!d) return
    d.textContent = initial.current
    d.focus()
    const r = document.createRange()
    r.selectNodeContents(d)
    const sel = getSelection()
    sel?.removeAllRanges()
    sel?.addRange(r)
  }, [])

  if (!n?.text || !b) return null
  const t = n.text
  const fill = n.fills.find((f) => f.visible && f.kind === 'solid')
  const finish = () => {
    const content = el.current?.innerText.replace(/\n$/, '') ?? ''
    if (!content.trim()) {
      // nothing typed into a brand-new node → it never existed
      const s = S.get()
      if (!initial.current) S.design.setState({ doc: s.anchor.doc, selection: [], editing: null })
      else { S.design.setState({ editing: null }); S.deleteSelection() }
      return
    }
    S.patchNode(id, (x) => ({ text: { ...x.text!, content }, name: x.name === initial.current.slice(0, 32) || !initial.current ? content.slice(0, 32) : x.name }), { commit: false })
    S.design.setState({ editing: null })
    S.commit()
  }
  return (
    <div
      ref={el}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      spellCheck={false}
      onInput={(e) => S.patchNode(id, (x) => ({ text: { ...x.text!, content: (e.target as HTMLDivElement).innerText } }), { commit: false })}
      onBlur={finish}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.key === 'Escape' || (e.key === 'Enter' && (e.metaKey || e.ctrlKey))) { e.preventDefault(); el.current?.blur() }
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className="pointer-events-auto absolute outline-none"
      style={{
        left: b.x * cam.zoom + cam.x,
        top: b.y * cam.zoom + cam.y,
        minWidth: Math.max(4, b.w * cam.zoom),
        width: t.resize === 'auto-width' ? undefined : b.w * cam.zoom,
        minHeight: b.h * cam.zoom,
        fontFamily: fontCss(t.family),
        fontWeight: t.weight,
        fontSize: t.size * cam.zoom,
        lineHeight: `${lineHeightOf(t) * cam.zoom}px`,
        letterSpacing: `${t.letterSpacing / 100}em`,
        textAlign: t.align,
        whiteSpace: t.resize === 'auto-width' ? 'pre' : 'pre-wrap',
        color: fill ? rgba(fill.color, fill.opacity) : '#000',
        caretColor: 'var(--signal)',
        boxShadow: '0 0 0 1px var(--signal)',
        transform: n.rotation ? `rotate(${-n.rotation}deg)` : undefined,
        wordBreak: 'break-word',
      }}
    />
  )
}
