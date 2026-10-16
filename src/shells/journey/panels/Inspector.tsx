/* Right panel: the selected card or stage; the map document when nothing is selected. */
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Trash2, Plus, Tag, X, CopyPlus } from 'lucide-react'
import {
  Panel, PanelHeader, Section, Row, TextInput, Select, Segmented, Slider, ScrubValue, IconButton, Button, Checkbox, Badge, useDoc, cn,
} from '@kit'
import { ChipInput } from '@kit/ui/chip-input'
import { CHANNELS, LANES, TEAMS, emoji, fmtEmotion, laneOf, type Card, type Channel, type LaneId, type Persona, type Stage } from '../model'
import {
  doc, ui, useUI, usePersona, updateCard, updateStage, deleteSelection, duplicateCard, nudgeCard, moveCard, cellCards, toggleLink, allTags, addCard, moveStage, editPersona,
} from '../store'

export function JourneyInspector() {
  const p = usePersona()
  const sel = useUI((s) => s.sel)
  const card = sel?.kind === 'card' ? p.cards.find((c) => c.id === sel.id) : undefined
  const stage = sel?.kind === 'stage' ? p.stages.find((s) => s.id === sel.id) : undefined
  return (
    <Panel header={<PanelHeader title={card ? laneOf(card.lane).one : stage ? 'Stage' : 'Map'} />}>
      {card ? <CardInspector key={card.id} card={card} p={p} /> : stage ? <StageInspector key={stage.id} stage={stage} p={p} /> : <MapInspector p={p} />}
    </Panel>
  )
}

const live = (label: string) => () => doc.commit(label)

function CardInspector({ card, p }: { card: Card; p: Persona }) {
  const lane = laneOf(card.lane)
  const LIcon = lane.icon
  const cell = cellCards(p, card.lane, card.stage)
  const idx = cell.findIndex((c) => c.id === card.id)
  const si = p.stages.findIndex((s) => s.id === card.stage)
  const pains = p.cards.filter((c) => c.lane === 'pains')
  const answeredBy = p.cards.filter((c) => c.lane === 'opps' && c.links?.includes(card.id))
  const stageName = (id: string) => p.stages.find((s) => s.id === id)?.name ?? ''
  const tags = allTags(p).map(([t]) => t)

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 px-pad pt-3 pb-1">
        <span className="flex size-icon items-center justify-center rounded-control bg-active text-fg-muted"><LIcon size={13} strokeWidth={1.5} /></span>
        <div className="min-w-0 flex-1 text-ui text-fg-muted">{stageName(card.stage)} · {lane.label}</div>
        <IconButton icon={CopyPlus} size="icon-sm" label="Duplicate" shortcut="mod+d" onClick={duplicateCard} />
        <IconButton icon={Trash2} size="icon-sm" label="Delete" shortcut="backspace" onClick={deleteSelection} />
      </div>
      <Section title="Content" first>
        {card.lane === 'owner' ? (
          <Row label="Team">
            <Select value={card.team ?? ''} onChange={(team) => updateCard(card.id, { team, text: team }, { label: 'Team' })} label="Team" options={Object.entries(TEAMS).map(([t, c]) => ({ value: t, label: t, swatch: c }))} />
          </Row>
        ) : (
          <Row label="Text" stacked>
            <TextInput multiline rows={3} value={card.text} label="Card text" onChange={(text) => updateCard(card.id, { text }, { commit: false })} onCommit={live('Edit card')} />
          </Row>
        )}
        {card.lane === 'touchpoints' && (
          <Row label="Channel">
            <Select value={card.channel ?? 'app'} onChange={(c) => updateCard(card.id, { channel: c as Channel }, { label: 'Channel' })} label="Channel" options={Object.entries(CHANNELS).map(([k, c]) => ({ value: k, label: c.label }))} />
          </Row>
        )}
        {(card.lane === 'pains' || card.lane === 'opps') && (
          <Row label={card.lane === 'pains' ? 'Severity' : 'Impact'}>
            <Segmented value={String(card.level ?? 2)} onChange={(s) => updateCard(card.id, { level: Number(s) as 1 | 2 | 3 }, { label: 'Level' })} label="Level" options={[{ value: '1', label: 'Low' }, { value: '2', label: 'Med', hint: 'Medium' }, { value: '3', label: 'High' }]} />
          </Row>
        )}
        <Row label="Tags" stacked>
          <ChipInput value={card.tags} prefix="#" normalize={(s) => s.trim().replace(/\s+/g, '-').toLowerCase()} suggestions={tags} onChange={(t) => updateCard(card.id, { tags: t }, { label: 'Tags' })} />
        </Row>
      </Section>

      {card.lane === 'opps' && (
        <Section title="Answers pain points">
          {!pains.length && <div className="px-pad text-ui text-fg-faint">No pain points in this journey yet.</div>}
          {pains.map((pn) => (
            <label key={pn.id} className="flex cursor-default items-start gap-2 px-pad py-1 text-ui hover:bg-hover">
              <span className="mt-0.5"><Checkbox checked={!!card.links?.includes(pn.id)} onChange={() => toggleLink(card.id, pn.id)} label={pn.text} /></span>
              <span className="min-w-0 flex-1"><span className="text-fg">{pn.text}</span><span className="block text-ui-sm text-fg-faint">{stageName(pn.stage)}</span></span>
            </label>
          ))}
          <div className="px-pad pt-1 text-ui text-fg-faint">Tip: drag from a pain point’s bottom handle onto an opportunity.</div>
        </Section>
      )}
      {card.lane === 'pains' && (
        <Section title="Answered by">
          {!answeredBy.length ? (
            <div className="flex items-center gap-2 px-pad py-1">
              <span className="flex-1 text-ui text-fg-faint">Nothing yet — an open pain point.</span>
              <Button size="sm" variant="default" onClick={() => { const c = addCard('opps', card.stage, undefined, true); if (c) toggleLink(c.id, card.id) }}><Plus size={12} />Opportunity</Button>
            </div>
          ) : answeredBy.map((o) => (
            <button key={o.id} type="button" onClick={() => ui.setState({ sel: { kind: 'card', id: o.id } })}
              className="mx-1.5 flex min-h-icon items-center gap-2 rounded-control px-1.5 py-1.5 text-left text-ui outline-none hover:bg-hover focus-visible:ring-2 focus-visible:ring-signal">
              <span className="h-3 w-[3px] shrink-0 rounded-full bg-ok" />
              <span className="min-w-0 flex-1 truncate text-fg">{o.text}</span>
              <span className="shrink-0 text-ui-sm text-fg-faint">{stageName(o.stage)}</span>
            </button>
          ))}
        </Section>
      )}

      <Section title="Position">
        <Row label="Stage">
          <Select value={card.stage} onChange={(s) => moveCard(card.id, card.lane, s, cellCards(p, card.lane, s).length)} label="Stage" options={p.stages.map((s) => ({ value: s.id, label: s.name }))} />
        </Row>
        <Row label="Lane">
          <Select value={card.lane} onChange={(l) => moveCard(card.id, l as LaneId, card.stage, cellCards(p, l as LaneId, card.stage).length)} label="Lane" options={LANES.filter((l) => l.id !== 'emotion').map((l) => ({ value: l.id, label: l.label }))} />
        </Row>
        <Row label="Move">
          <div className="flex gap-0.5">
            <IconButton icon={ArrowLeft} size="icon-sm" label="Previous stage" shortcut="alt+arrowleft" disabled={si <= 0} onClick={() => nudgeCard(-1, 0)} />
            <IconButton icon={ArrowRight} size="icon-sm" label="Next stage" shortcut="alt+arrowright" disabled={si >= p.stages.length - 1} onClick={() => nudgeCard(1, 0)} />
            <IconButton icon={ArrowUp} size="icon-sm" label="Up in cell" shortcut="alt+arrowup" disabled={idx <= 0} onClick={() => nudgeCard(0, -1)} />
            <IconButton icon={ArrowDown} size="icon-sm" label="Down in cell" shortcut="alt+arrowdown" disabled={idx >= cell.length - 1} onClick={() => nudgeCard(0, 1)} />
          </div>
        </Row>
      </Section>
    </div>
  )
}

function StageInspector({ stage, p }: { stage: Stage; p: Persona }) {
  const i = p.stages.findIndex((s) => s.id === stage.id)
  const set = (patch: Partial<Stage>, commit = true) => updateStage(stage.id, patch, { commit, label: 'Edit stage' })
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 px-pad pt-3 pb-1">
        <span className="flex h-icon min-w-icon items-center justify-center rounded-control bg-signal-strong px-1 text-ui font-semibold text-signal-fg tabular">{i + 1}</span>
        <div className="min-w-0 flex-1 truncate text-title font-semibold">{stage.name}</div>
        <IconButton icon={ArrowLeft} size="icon-sm" label="Move stage left" shortcut="alt+arrowleft" disabled={i === 0} onClick={() => moveStage(stage.id, -1)} />
        <IconButton icon={ArrowRight} size="icon-sm" label="Move stage right" shortcut="alt+arrowright" disabled={i === p.stages.length - 1} onClick={() => moveStage(stage.id, 1)} />
        <IconButton icon={Trash2} size="icon-sm" label="Delete stage" shortcut="backspace" onClick={deleteSelection} />
      </div>
      <Section title="Stage" first>
        <Row label="Name"><TextInput value={stage.name} label="Stage name" onChange={(name) => set({ name }, false)} onCommit={live('Rename stage')} /></Row>
        <Row label="When"><TextInput value={stage.duration} label="Duration" placeholder="Day 0, Weeks 2–6…" onChange={(duration) => set({ duration }, false)} onCommit={live('Edit stage')} /></Row>
        <Row label="Goal" stacked><TextInput multiline rows={2} value={stage.goal} label="Goal" placeholder="What the customer wants to achieve here" onChange={(goal) => set({ goal }, false)} onCommit={live('Edit stage')} /></Row>
      </Section>
      <Section title="Emotion">
        <Row label="Score" hint="−2 (very negative) to +2 (delighted). Also draggable on the curve.">
          <Slider value={stage.emotion} min={-2} max={2} step={0.5} onChange={(n, f) => set({ emotion: n }, f)} label="Emotion" />
          <ScrubValue value={stage.emotion} min={-2} max={2} step={0.5} fmt={fmtEmotion} onChange={(n, f) => set({ emotion: n }, f)} className="w-[44px] shrink-0" label="Emotion" changed />
        </Row>
        <Row label="Feeling">
          <TextInput value={stage.feeling} label="Feeling" placeholder="One word" onChange={(feeling) => set({ feeling }, false)} onCommit={live('Edit feeling')} />
          <span className="text-[16px]" aria-hidden>{emoji(stage.emotion)}</span>
        </Row>
      </Section>
      <Section title="Cards">
        {LANES.filter((l) => l.id !== 'emotion').map((l) => {
          const n = cellCards(p, l.id, stage.id).length
          const LI = l.icon
          return (
            <div key={l.id} className="group/l flex h-row items-center gap-2 px-pad text-ui">
              <LI size={13} strokeWidth={1.5} className="text-fg-faint" />
              <span className="flex-1 text-fg-muted">{l.label}</span>
              <span className={cn('tabular', n ? 'text-fg' : 'text-fg-faint')}>{n}</span>
              <IconButton icon={Plus} size="icon-sm" label={`Add to ${l.label.toLowerCase()}`} className="opacity-0 group-hover/l:opacity-100 focus-visible:opacity-100" onClick={() => addCard(l.id, stage.id)} />
            </div>
          )
        })}
      </Section>
    </div>
  )
}

function MapInspector({ p }: { p: Persona }) {
  const title = useDoc(doc, (d) => d.title)
  const filter = useUI((s) => s.filterTag)
  const pains = p.cards.filter((c) => c.lane === 'pains')
  const opps = p.cards.filter((c) => c.lane === 'opps')
  const answered = pains.filter((pn) => opps.some((o) => o.links?.includes(pn.id))).length
  const low = [...p.stages].sort((a, b) => a.emotion - b.emotion)[0]
  const high = [...p.stages].sort((a, b) => b.emotion - a.emotion)[0]
  const tags = allTags(p)
  const open = pains.filter((pn) => !opps.some((o) => o.links?.includes(pn.id))).sort((a, b) => (b.level ?? 2) - (a.level ?? 2))
  return (
    <div className="flex flex-col">
      <Section title="Journey" first>
        <Row label="Title"><TextInput value={title} label="Map title" onChange={(t) => doc.set((d) => ({ ...d, title: t }), { commit: false })} onCommit={live('Rename map')} /></Row>
        <Row label="Scenario" stacked>
          <TextInput multiline rows={2} value={p.scenario} label="Scenario" onChange={(scenario) => editPersona((x) => ({ ...x, scenario }), { commit: false })} onCommit={live('Edit scenario')} />
        </Row>
      </Section>
      <Section title="Insights">
        <div className="grid grid-cols-3 gap-1.5 px-pad">
          <Stat label="Stages" value={p.stages.length} />
          <Stat label="Pains" value={pains.length} />
          <Stat label="Answered" value={pains.length ? `${Math.round((answered / pains.length) * 100)}%` : '—'} />
        </div>
        {low && high && (
          <div className="mt-2 flex flex-col gap-1 px-pad text-ui">
            <button type="button" className="flex items-center gap-2 rounded-control py-0.5 text-left hover:text-fg" onClick={() => ui.setState({ sel: { kind: 'stage', id: low.id } })}>
              <span className="w-14 shrink-0 text-fg-faint">Low point</span><span className="text-fg">{low.name}</span><Badge tone="rec">{emoji(low.emotion)} {fmtEmotion(low.emotion)}</Badge>
            </button>
            <button type="button" className="flex items-center gap-2 rounded-control py-0.5 text-left hover:text-fg" onClick={() => ui.setState({ sel: { kind: 'stage', id: high.id } })}>
              <span className="w-14 shrink-0 text-fg-faint">High point</span><span className="text-fg">{high.name}</span><Badge tone="ok">{emoji(high.emotion)} {fmtEmotion(high.emotion)}</Badge>
            </button>
          </div>
        )}
        {open.length > 0 && (
          <div className="mt-2 px-pad">
            <div className="pb-1 text-ui text-fg-faint">Open pain points</div>
            {open.slice(0, 4).map((pn) => (
              <button key={pn.id} type="button" onClick={() => ui.setState({ sel: { kind: 'card', id: pn.id } })}
                className="flex min-h-row w-full items-center gap-2 rounded-control py-1 text-left text-ui outline-none hover:text-fg focus-visible:ring-2 focus-visible:ring-signal">
                <span className="h-3 w-[3px] shrink-0 rounded-full bg-rec" /><span className="min-w-0 flex-1 truncate text-fg-muted">{pn.text}</span>
              </button>
            ))}
          </div>
        )}
      </Section>
      <Section title="Tags" actions={filter ? <IconButton icon={X} size="icon-sm" label="Clear highlight" shortcut="esc" onClick={() => ui.setState({ filterTag: null })} /> : undefined}>
        {!tags.length && <div className="px-pad text-ui text-fg-faint">Add #tags to cards to highlight themes across stages.</div>}
        <div className="flex flex-wrap gap-1 px-pad">
          {tags.map(([t, n]) => (
            <button key={t} type="button" aria-pressed={filter === t} onClick={() => ui.setState({ filterTag: filter === t ? null : t })}
              className={cn('flex h-control items-center gap-1 rounded-control px-2 text-ui outline-none focus-visible:ring-2 focus-visible:ring-signal', filter === t ? 'bg-signal-strong text-signal-fg' : 'bg-control text-fg-muted hover:text-fg')}>
              <Tag size={11} strokeWidth={1.5} />{t}<span className="tabular opacity-60">{n}</span>
            </button>
          ))}
        </div>
      </Section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-cluster bg-well px-2.5 py-2">
      <span className="text-ui text-fg-faint">{label}</span>
      <span className="text-title font-semibold tabular">{value}</span>
    </div>
  )
}
