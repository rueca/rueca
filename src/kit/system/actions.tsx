/* ---------------------------------------------------------------------------
   The standard cluster every instrument gets for free: undo/redo, presets
   (save, apply, delete), A/B compare, share link, copy values for an agent,
   theme. Drop <ParamActions params={params} /> into a toolbar cluster.
--------------------------------------------------------------------------- */
import { Bookmark, Moon, Redo2, Sun, Undo2, Link, Braces, SplitSquareHorizontal, Trash2, Plus, Download, ChevronDown } from 'lucide-react'
import type { ReactElement } from 'react'
import { useStore } from 'zustand'
import type { AnyParams } from '../core/params'
import { copyText, exportJSON } from '../core/io'
import { useHotkeys } from '../core/hotkeys'
import { useTheme } from '../core/theme'
import { Button, IconButton } from '../ui/button'
import { Menu, Divider, type MenuItem } from '../ui/controls'
import { toast } from './toast'
import { equal } from '../core/schema'

export function useParamHotkeys(params: AnyParams) {
  useHotkeys({
    'mod+z': () => params.undo(),
    'shift+mod+z,mod+y': () => params.redo(),
  }, [params])
}

export function HistoryButtons({ params }: { params: AnyParams }) {
  const canUndo = useStore(params, (s) => s.past.length > 0)
  const canRedo = useStore(params, (s) => s.future.length > 0)
  useParamHotkeys(params)
  return (
    <>
      <IconButton icon={Undo2} label="Undo" shortcut="mod+z" disabled={!canUndo} onClick={() => params.undo()} />
      <IconButton icon={Redo2} label="Redo" shortcut="shift+mod+z" disabled={!canRedo} onClick={() => params.redo()} />
    </>
  )
}

export function PresetMenu({ params, trigger }: { params: AnyParams; trigger?: ReactElement }) {
  const presets = useStore(params, (s) => s.presets)
  const values = useStore(params, (s) => s.values)
  const active = presets.find((p) => equal(p.values, values))
  const items: MenuItem[] = [
    { type: 'label', label: 'Presets' },
    ...presets.map((p) => ({ label: p.name, checked: active?.name === p.name, onClick: () => params.applyPreset(p.name) })),
    { type: 'separator' },
    {
      label: 'Save current as preset…', icon: Plus, onClick: () => {
        const name = prompt('Preset name', `Preset ${presets.filter((p) => !p.builtin).length + 1}`)
        if (name) { params.savePreset(name); toast(`Saved “${name}”`, { type: 'success' }) }
      },
    },
    ...(active && !active.builtin ? [{ label: `Delete “${active.name}”`, icon: Trash2, danger: true, onClick: () => params.deletePreset(active.name) } as MenuItem] : []),
  ]
  return (
    <Menu
      trigger={trigger ?? (
        <Button size="md" className="max-w-[160px] gap-1 px-2">
          <Bookmark size={13} strokeWidth={1.5} />
          <span className="truncate">{active?.name ?? 'Custom'}</span>
          <ChevronDown size={12} className="text-faint" />
        </Button>
      )}
      items={items}
    />
  )
}

export function CompareButton({ params }: { params: AnyParams }) {
  const has = useStore(params, (s) => !!s.compare)
  useHotkeys({ '\\': () => { const r = params.toggleCompare(); toast(r === 'stored' ? 'Stored A — tweak, then \\ to swap' : 'Swapped A ↔ B') } }, [params])
  return (
    <IconButton icon={SplitSquareHorizontal} label={has ? 'Swap A / B' : 'Store A for comparison'} shortcut="\\" active={has}
      onClick={() => { const r = params.toggleCompare(); toast(r === 'stored' ? 'Stored A — tweak, then \\ to swap' : 'Swapped A ↔ B') }} />
  )
}

/** Copy values in the form an engineer or an agent can act on. */
export function shareMenuItems(params: AnyParams): MenuItem[] {
  return [
    { label: 'Copy link with values', icon: Link, onClick: async () => { await copyText(params.shareURL()); toast('Link copied', { type: 'success' }) } },
    { label: 'Copy changed values (JSON)', icon: Braces, onClick: async () => { await copyText(JSON.stringify(params.toJSON({ changedOnly: true }), null, 2)); toast('Changed values copied', { type: 'success' }) } },
    {
      label: 'Copy as agent prompt', icon: Braces, hint: 'Values plus what each one means', onClick: async () => {
        const changed = params.toJSON({ changedOnly: true }) as Record<string, unknown>
        const lines = Object.entries(changed).map(([k, v]) => {
          const d = params.defs[k] as any
          return `- ${d?.label ?? k} (\`${k}\`): ${JSON.stringify(v)} (default ${JSON.stringify(params.getState().defaults[k])})${d?.hint ? ` — ${d.hint}` : ''}`
        })
        const text = `Apply these tuned values to ${params.id}. Each is a param key in the schema:\n\n${lines.join('\n') || '- (no changes from defaults)'}\n`
        await copyText(text)
        toast('Prompt copied', { type: 'success' })
      },
    },
    { label: 'Download all values', icon: Download, onClick: () => exportJSON(params.toJSON(), `${params.id}-values.json`) },
  ]
}

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  useHotkeys({ t: toggle }, [theme])
  return <IconButton icon={theme === 'dark' ? Sun : Moon} label={theme === 'dark' ? 'Light theme' : 'Dark theme'} shortcut="t" onClick={toggle} />
}

/** The usual right-hand cluster: history · compare · presets · share · theme. */
export function ParamActions({ params, presets = true }: { params: AnyParams; presets?: boolean }) {
  return (
    <>
      <HistoryButtons params={params} />
      <CompareButton params={params} />
      <Divider vertical />
      {presets && <PresetMenu params={params} />}
      <Menu align="end" trigger={<IconButton icon={Link} label="Share & copy" />} items={shareMenuItems(params)} />
      <ThemeToggle />
    </>
  )
}
