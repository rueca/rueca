/* States matrix: every variant × every state, rendered with forced states so
   the whole surface of the component is reviewable at a glance. Click a cell
   to load it into the props; double-click to open it in the preview. */
import { useLayoutEffect, useRef, useState } from 'react'
import { Sun, Moon, Columns2 } from 'lucide-react'
import { Segmented, Tip, cn, useStudio } from '@kit'
import { useUI, setUI } from '../ui'
import { MATRIX, STORES, type CompId } from '../props'
import { LabRoot, Instance } from './Instance'
import type { Theme } from '../tokens'

const CELL_W: Record<CompId, number> = { button: 148, input: 260, card: 300 }

function apply(comp: CompId, variant: string, state: string, open = false) {
  const m = MATRIX[comp]
  const store = STORES[comp]
  const patch: Record<string, unknown> = { [m.variantKey]: variant }
  if (comp === 'button') Object.assign(patch, { state: ['disabled', 'loading'].includes(state) ? 'default' : state, disabled: state === 'disabled', loading: state === 'loading' })
  else if (comp === 'input') Object.assign(patch, { inputState: state === 'disabled' ? 'default' : state, inputDisabled: state === 'disabled' })
  else Object.assign(patch, { cardState: state })
  store.patch(patch)
  setUI({ picked: `${variant}:${state}`, ...(open ? { view: 'preview' as const } : {}) })
}

function Grid({ comp, theme }: { comp: CompId; theme: Theme }) {
  const m = MATRIX[comp]
  const picked = useUI((s) => s.picked)
  const w = CELL_W[comp]
  return (
    <LabRoot theme={theme} className="overflow-hidden rounded-[10px] shadow-[var(--shadow-artboard),0_0_0_1px_var(--artboard-ring)]">
      <div className="grid" style={{ gridTemplateColumns: `112px repeat(${m.states.length}, ${w}px)` }}>
        <div className="sticky top-0 z-[1]" />
        {m.states.map((s) => (
          <div key={s.value} className="px-4 pt-4 pb-2 font-ui text-[11px] font-medium" style={{ color: 'var(--cl-text-muted)' }}>{s.label}</div>
        ))}
        {m.variants.map((v) => (
          <div key={v.value} className="contents">
            <div className="flex items-center px-4 font-ui text-[11px] font-medium" style={{ color: 'var(--cl-text-muted)', borderTop: '1px solid var(--cl-border)' }}>{v.label}</div>
            {m.states.map((s) => {
              const on = picked === `${v.value}:${s.value}`
              return (
                <Tip key={s.value} label={`${v.label} · ${s.label}. Click to load, double-click to preview`} side="top">
                  <div role="button" tabIndex={0} onClick={() => apply(comp, v.value, s.value)} onDoubleClick={() => apply(comp, v.value, s.value, true)}
                    onKeyDown={(e) => { if (e.key === 'Enter') apply(comp, v.value, s.value, true) }}
                    className={cn('relative flex min-h-[84px] cursor-pointer items-center justify-center p-4 outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-inset', comp === 'card' && 'items-start')}
                    style={{ borderTop: '1px solid var(--cl-border)', background: on ? 'var(--cl-accent-soft)' : undefined }}>
                    <div className="pointer-events-none flex w-full justify-center">
                      <Instance comp={comp} force={s.value} patch={{ [m.variantKey]: v.value, ...(comp === 'button' ? { disabled: false, loading: false } : comp === 'input' ? { inputDisabled: false } : {}) }} />
                    </div>
                  </div>
                </Tip>
              )
            })}
          </div>
        ))}
      </div>
    </LabRoot>
  )
}

export function Matrix() {
  const comp = useUI((s) => s.comp)
  const theme = useUI((s) => s.previewTheme)
  const both = useUI((s) => s.matrixThemes) === 'both'
  const m = MATRIX[comp]
  const { present } = useStudio()   // ⌘\ hides the matrix bar (break-it F3)
  // fit the grid to the stage width (down to 60%), then scroll
  const box = useRef<HTMLDivElement>(null)
  const [avail, setAvail] = useState(900)
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setAvail(el.clientWidth - 64))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const gridW = 112 + m.states.length * CELL_W[comp]
  const zoom = Math.max(0.6, Math.min(1, avail / gridW))
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={cn('flex flex-none items-center justify-center gap-2 px-4 pt-3 pb-2', present && 'invisible')}>
        <span className="text-ui text-fg-muted tabular">{m.variants.length} variants × {m.states.length} states{zoom < 1 ? ` · ${Math.round(zoom * 100)}%` : ''}</span>
        <div className="w-[120px]">
          <Segmented iconOnly value={both ? 'both' : theme} label="Matrix theme"
            onChange={(t) => (t === 'both' ? setUI({ matrixThemes: 'both' }) : setUI({ matrixThemes: 'one', previewTheme: t as Theme }))}
            options={[{ value: 'light', label: 'Light', icon: Sun }, { value: 'dark', label: 'Dark', icon: Moon }, { value: 'both', label: 'Light and dark', icon: Columns2 }]} />
        </div>
      </div>
      <div ref={box} className="min-h-0 flex-1 overflow-auto">
        <div className={cn('flex w-max min-w-full gap-8 px-8 pt-4 pb-16', both ? 'flex-col items-center' : 'justify-center')} style={{ zoom }}>
          {(both ? (['light', 'dark'] as Theme[]) : [theme]).map((t) => (
            <div key={t} className="flex flex-col gap-2">
              {both && <div className="text-ui font-medium text-fg-muted">{t === 'light' ? 'Light' : 'Dark'}</div>}
              <Grid comp={comp} theme={t} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
