/* Left: the component list, then that component's props — generated from
   its schema by the kit Inspector (Storybook "args" / Framer controls). */
import { RectangleHorizontal, TextCursorInput, PanelTop, RotateCcw } from 'lucide-react'
import { Inspector, PresetMenu, IconButton, Kbd, cn, useValues } from '@kit'
import { useUI, setUI } from '../ui'
import { STORES, MATRIX, type CompId } from '../props'

export const COMPONENTS: { id: CompId; name: string; icon: typeof PanelTop; blurb: string }[] = [
  { id: 'button', name: 'Button', icon: RectangleHorizontal, blurb: 'Actions and calls to action' },
  { id: 'input', name: 'Text field', icon: TextCursorInput, blurb: 'Label, control, help and error' },
  { id: 'card', name: 'Card', icon: PanelTop, blurb: 'Media, copy and actions' },
]

export function LeftPanel() {
  const comp = useUI((s) => s.comp)
  const store = STORES[comp]
  useValues(store)
  const changed = Object.keys(store.toJSON({ changedOnly: true })).length
  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-0.5 p-1.5">
        {COMPONENTS.map((c, i) => {
          const on = c.id === comp
          const Icon = c.icon
          return (
            <button key={c.id} type="button" onClick={() => setUI({ comp: c.id, picked: null })} aria-pressed={on}
              className={cn('group flex items-center gap-2.5 rounded-[7px] px-2 py-1.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent', on ? 'bg-accent-soft' : 'hover:bg-hover')}>
              <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-[6px]', on ? 'bg-accent-strong text-accent-fg' : 'bg-input text-muted')}><Icon size={14} strokeWidth={1.5} /></span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[12px] font-medium text-fg">{c.name}</span>
                <span className="truncate text-[11px] text-faint">{MATRIX[c.id].variants.length} variants · {c.blurb}</span>
              </span>
              <Kbd className="opacity-0 group-hover:opacity-100">{i + 1}</Kbd>
            </button>
          )
        })}
      </div>
      <div className="flex h-9 items-center gap-1 border-t border-line pr-2 pl-3">
        <span className="flex-1 text-[11.5px] font-medium">Props</span>
        {changed > 0 && <IconButton icon={RotateCcw} size="icon-sm" label="Reset props" onClick={() => store.reset()} />}
        <PresetMenu params={store} />
      </div>
      <Inspector key={comp} params={store} />
    </div>
  )
}
