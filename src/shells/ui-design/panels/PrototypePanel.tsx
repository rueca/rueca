/* ---------------------------------------------------------------------------
   Prototype tab. Interaction rows read as a sentence (Figma): "On tap →
   Navigate to Trail detail · Smart animate · ease out · 380ms". The same
   links appear on the canvas as arrows, and the + knob on a selected layer
   can be dragged onto a frame to create one.
--------------------------------------------------------------------------- */
import { Popover } from '@base-ui/react/popover'
import { Plus, Minus, Zap, Play, Flag } from 'lucide-react'
import { Section, Row, Select, ScrubValue, IconButton, Button, Checkbox, CurveEditor, CurveGlyph, Empty, EASINGS, useValues } from '@kit'
import * as S from '../model/store'
import { prefs } from '../model/prefs'
import { uid, type Interaction, type Node } from '../model/types'
import { locate } from '../model/tree'

const TRIGGERS = [{ value: 'tap', label: 'On tap' }, { value: 'hover', label: 'While hovering' }, { value: 'drag', label: 'On drag' }]
const ACTIONS = [{ value: 'navigate', label: 'Navigate to' }, { value: 'back', label: 'Back' }, { value: 'overlay', label: 'Open overlay' }]
const TRANSITIONS = [{ value: 'instant', label: 'Instant' }, { value: 'dissolve', label: 'Dissolve' }, { value: 'smart', label: 'Smart animate' }, { value: 'move-in', label: 'Move in' }, { value: 'push', label: 'Push' }]

export function PrototypePanel({ onPresent }: { onPresent: () => void }) {
  S.useDesign((s) => s.doc)
  S.useDesign((s) => s.selection)
  const v = useValues(prefs)
  const st = S.get()
  const sel = S.selectedNodes(st)
  const frames = S.frames(st)
  const pg = S.page(st)

  if (!sel.length)
    return (
      <div className="flex flex-col">
        <Section title="Flow" first>
          <Row label="Starting frame">
            <Select value={pg.start ?? ''} placeholder="None" label="Starting frame" onChange={(id) => S.setPage({ start: id })} options={frames.map((f) => ({ value: f.id, label: f.name }))} />
          </Row>
          <Row label="Show links">
            <div className="flex flex-1 justify-end"><Checkbox checked={v.showConnectors} onChange={(b) => prefs.setValue('showConnectors', b)} label="Show prototype links" /></div>
          </Row>
          <div className="px-pad pt-1.5">
            <Button variant="primary" size="md" className="w-full" onClick={onPresent} disabled={!frames.length}><Play size={13} strokeWidth={1.75} fill="currentColor" />Present flow</Button>
          </div>
        </Section>
        <Section title="Connections">
          {countLinks(pg.nodes) ? (
            <div className="flex flex-col gap-0.5 px-pad">
              {listLinks(pg.nodes).map((l) => (
                <button key={l.id} type="button" onClick={() => S.select([l.from.id])} className="flex h-row items-center gap-1.5 rounded-control px-1.5 text-left text-ui hover:bg-hover">
                  <Zap size={12} strokeWidth={1.5} className="shrink-0 text-signal" />
                  <span className="truncate text-fg">{l.from.name}</span>
                  <span className="text-fg-faint">→</span>
                  <span className="truncate text-fg-muted">{l.to}</span>
                </button>
              ))}
            </div>
          ) : <Empty icon={Zap} title="No connections yet" hint="Select a layer and drag its + knob onto a frame, or add an interaction here." />}
        </Section>
      </div>
    )

  if (sel.length > 1) return <Empty icon={Zap} title="Select one layer" hint="Interactions are edited one layer at a time." />
  const n = sel[0]
  const isTop = !locate(pg.nodes, n.id)?.parent && n.type === 'frame'
  const list = n.interactions ?? []
  const set = (next: Interaction[], final = true) => S.patchNode(n.id, { interactions: next }, { commit: final })
  const add = () => set([...list, { id: uid('i'), trigger: 'tap', action: 'navigate', target: frames.find((f) => f.id !== rootFrame(n)?.id)?.id, transition: 'smart', duration: 350, easing: [0.16, 1, 0.3, 1] }])
  return (
    <div className="flex flex-col">
      {isTop && (
        <Section title="Flow starting point" first>
          <Row label="Start here">
            <div className="flex flex-1 items-center justify-end gap-2">
              {pg.start === n.id && <Flag size={12} strokeWidth={1.5} className="text-signal" />}
              <Checkbox checked={pg.start === n.id} onChange={(b) => S.setPage({ start: b ? n.id : undefined })} label="Flow starting point" />
            </div>
          </Row>
        </Section>
      )}
      <Section title="Interactions" first={!isTop} actions={<IconButton icon={Plus} size="icon-sm" label="Add interaction" onClick={add} />}>
        {!list.length && <div className="px-pad pb-1 text-ui text-fg-faint">No interactions. Click + or drag the knob on the canvas onto a frame.</div>}
        {list.map((it) => {
          const upd = (patch: Partial<Interaction>, final = true) => set(list.map((x) => (x.id === it.id ? { ...x, ...patch } : x)), final)
          const preset = Object.entries(EASINGS).find(([, e]) => e.join() === it.easing.join())?.[0] ?? 'Custom'
          return (
            <div key={it.id} className="mx-2 mb-1.5 rounded-cluster bg-well py-1">
              <Row label="Trigger" trailing={<IconButton icon={Minus} size="icon-sm" label="Remove interaction" onClick={() => set(list.filter((x) => x.id !== it.id))} />}>
                <Select value={it.trigger} label="Trigger" onChange={(t) => upd({ trigger: t as Interaction['trigger'] })} options={TRIGGERS} />
              </Row>
              <Row label="Action">
                <Select value={it.action} label="Action" onChange={(a) => upd({ action: a as Interaction['action'] })} options={ACTIONS} />
              </Row>
              {it.action !== 'back' && (
                <Row label="Destination">
                  <Select value={it.target ?? ''} placeholder="Choose a frame" label="Destination" onChange={(t) => upd({ target: t })} options={frames.filter((f) => f.id !== rootFrame(n)?.id).map((f) => ({ value: f.id, label: f.name }))} />
                </Row>
              )}
              <Row label="Animation">
                <Select value={it.transition} label="Animation" onChange={(t) => upd({ transition: t as Interaction['transition'] })} options={TRANSITIONS} />
              </Row>
              {it.transition !== 'instant' && (
                <Row label="Curve">
                  <Popover.Root>
                    <Popover.Trigger className="flex h-control min-w-0 flex-1 items-center gap-2 rounded-control bg-control px-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-signal hover:shadow-[inset_0_0_0_1px_var(--line-strong)] data-[popup-open]:shadow-[inset_0_0_0_1px_var(--signal)]">
                      <CurveGlyph value={it.easing} className="text-signal" />
                      <span className="truncate text-ui text-fg">{preset}</span>
                    </Popover.Trigger>
                    <Popover.Portal>
                      <Popover.Positioner side="left" align="start" sideOffset={12} collisionPadding={12} className="z-[100]">
                        <Popover.Popup className="pop w-[260px] p-3 outline-none"><CurveEditor value={it.easing} onChange={(e, f) => upd({ easing: e }, f)} /></Popover.Popup>
                      </Popover.Positioner>
                    </Popover.Portal>
                  </Popover.Root>
                </Row>
              )}
              {/* its own row: sharing one with Curve cut the preset name to "Out …" */}
              {it.transition !== 'instant' && (
                <Row label="Duration">
                  <ScrubValue boxed align="left" value={it.duration} min={0} max={5000} step={10} unit="ms" label="Duration" onChange={(d, f) => upd({ duration: d }, f)} className="flex-1" />
                </Row>
              )}
            </div>
          )
        })}
      </Section>
    </div>
  )
}

function rootFrame(n: Node): Node | undefined {
  const anc = S.ancestors(S.nodesOf(), n.id)
  return anc[0] ?? (n.type === 'frame' ? n : undefined)
}

function listLinks(nodes: Node[]) {
  const out: { id: string; from: Node; to: string }[] = []
  const frames = new Map(nodes.map((f) => [f.id, f.name]))
  const walk = (list: Node[]) => list.forEach((n) => {
    for (const i of n.interactions ?? []) out.push({ id: n.id + i.id, from: n, to: i.action === 'back' ? 'Back' : frames.get(i.target ?? '') ?? 'Missing frame' })
    if (n.children) walk(n.children)
  })
  walk(nodes)
  return out
}
const countLinks = (nodes: Node[]) => listLinks(nodes).length
