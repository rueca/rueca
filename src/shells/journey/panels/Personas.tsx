/* Left panel: personas. Switching persona swaps the whole map. */
import { MoreHorizontal, Plus, Copy, Trash2, X } from 'lucide-react'
import { Panel, PanelHeader, Section, IconButton, Menu, Row, ScrubValue, useDoc, cn, Kbd } from '@kit'
import { InlineText } from '@kit/ui/inline-text'
import { deepen, initials, type Persona } from '../model'
import { doc, useUI, usePersona, switchPersona, addPersona, duplicatePersona, deletePersona, editPersona } from '../store'

export function Avatar({ p, size = 28 }: { p: Pick<Persona, 'name' | 'hue'>; size?: number }) {
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white" style={{ width: size, height: size, background: deepen(p.hue), fontSize: size * 0.38 }}>
      {initials(p.name)}
    </span>
  )
}

export function PersonasPanel() {
  const personas = useDoc(doc, (d) => d.personas)
  const active = useUI((s) => s.personaId)
  const p = usePersona()
  const set = (patch: Partial<Persona>, label = 'Edit persona') => editPersona((x) => ({ ...x, ...patch }), { label })

  return (
    <Panel header={<PanelHeader title="Personas"><IconButton icon={Plus} size="icon-sm" label="New persona" onClick={addPersona} /></PanelHeader>}>
      <div className="flex flex-col gap-0.5 p-1.5" role="listbox" aria-label="Personas">
        {personas.map((x, i) => {
          const on = x.id === active
          return (
            <div key={x.id} role="option" aria-selected={on} tabIndex={0}
              onClick={() => switchPersona(x.id)} onKeyDown={(e) => e.key === 'Enter' && switchPersona(x.id)}
              className={cn('group/row flex items-center gap-2.5 rounded-[8px] p-2 outline-none focus-visible:ring-2 focus-visible:ring-signal', on ? 'bg-active' : 'hover:bg-hover')}>
              <Avatar p={x} size={30} />
              <div className="min-w-0 flex-1">
                <div className={'truncate text-[12.5px] font-medium text-fg'}>{x.name}</div>
                <div className="truncate text-[11px] text-fg-faint">{x.role} · {x.stages.length} stages</div>
              </div>
              {i < 9 && <Kbd className="group-hover/row:hidden group-focus-within/row:hidden">{i + 1}</Kbd>}
              <div className="hidden group-hover/row:block group-focus-within/row:block" onClick={(e) => e.stopPropagation()}>
                <Menu align="end" trigger={<IconButton icon={MoreHorizontal} size="icon-sm" label="Persona actions" />}
                  items={[
                    { label: 'Duplicate with journey', icon: Copy, onClick: () => duplicatePersona(x.id) },
                    { type: 'separator' },
                    { label: 'Delete', icon: Trash2, danger: true, disabled: personas.length < 2, onClick: () => deletePersona(x.id) },
                  ]} />
              </div>
            </div>
          )
        })}
      </div>

      <Section title="Profile">
        <div className="flex flex-col items-center gap-2 px-3 pt-1 pb-2 text-center">
          <Avatar p={p} size={56} />
          <div className="w-full">
            <InlineText bare value={p.name} onCommit={(name) => set({ name }, 'Rename persona')} className="block min-h-6 truncate text-[14px] leading-6 font-semibold" label="Persona name" />
            <InlineText bare allowEmpty value={p.role} onCommit={(role) => set({ role })} className="block min-h-6 truncate text-[11.5px] leading-6 text-fg-muted" label="Role" />
          </div>
          <div className="flex gap-0.5">
            {['#8b5cf6', '#f97316', '#14b8a6', '#ec4899', '#0ea5e9', '#84cc16'].map((h) => (
              // 24px target around a 16px swatch (WCAG 2.5.8, break-it A15); the selected one also says so (not colour only)
              <button key={h} type="button" aria-label={`Colour ${h}`} aria-pressed={p.hue === h} onClick={() => set({ hue: h }, 'Persona colour')}
                className="group/sw flex size-6 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-signal">
                <span className="size-4 rounded-full" style={{ background: h, boxShadow: p.hue === h ? '0 0 0 2px var(--panel), 0 0 0 3.5px var(--fg-muted)' : undefined }} />
              </button>
            ))}
          </div>
        </div>
        <Row label="Age"><ScrubValue boxed value={p.age} min={12} max={99} onChange={(age, f) => editPersona((x) => ({ ...x, age }), { commit: f, label: 'Age' })} className="flex-1" label="Age" /></Row>
        <div className="px-3 pt-2">
          <div className="relative rounded-[10px] bg-well px-3 py-2.5 text-[12px] leading-relaxed text-fg italic">
            <span aria-hidden className="absolute -top-1 left-2 text-[22px] leading-none text-fg-faint not-italic">“</span>
            <InlineText bare allowEmpty value={p.quote} multiline onCommit={(quote) => set({ quote })} placeholder="Add a quote in their words" className="block whitespace-pre-wrap" label="Quote" />
          </div>
        </div>
      </Section>

      <ListSection title="Goals" items={p.goals} onChange={(goals) => set({ goals }, 'Edit goals')} add="Add goal" />
      <ListSection title="Frustrations" items={p.frustrations} onChange={(frustrations) => set({ frustrations }, 'Edit frustrations')} add="Add frustration" />
      <Section title="Scenario">
        <div className="px-3 pb-1 text-[12px] leading-relaxed text-fg-muted">
          <InlineText bare allowEmpty value={p.scenario} multiline onCommit={(scenario) => set({ scenario })} placeholder="When, where, with whom?" className="block whitespace-pre-wrap" label="Scenario" />
        </div>
      </Section>
    </Panel>
  )
}

function ListSection({ title, items, onChange, add }: { title: string; items: string[]; onChange: (v: string[]) => void; add: string }) {
  return (
    <Section title={title} actions={<IconButton icon={Plus} size="icon-sm" label={add} onClick={() => onChange([...items, 'New item'])} />}>
      {!items.length && <div className="px-3 text-[11.5px] text-fg-faint">None yet.</div>}
      {items.map((g, i) => (
        <div key={i} className="group/item flex items-start gap-2 px-3 py-1">
          <span className="mt-[7px] size-1 shrink-0 rounded-full bg-fg-faint" />
          <InlineText bare allowEmpty value={g} multiline onCommit={(s) => onChange(s ? items.map((x, j) => (j === i ? s : x)) : items.filter((_, j) => j !== i))} className="block min-w-0 flex-1 text-[12px] leading-relaxed text-fg" label={title} />
          <button type="button" aria-label="Remove" onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="mt-0.5 flex size-5 items-center justify-center rounded-[4px] text-fg-faint opacity-0 hover:bg-hover hover:text-fg group-hover/item:opacity-100 focus-visible:opacity-100"><X size={11} /></button>
        </div>
      ))}
    </Section>
  )
}
