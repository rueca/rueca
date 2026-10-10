/* ---------------------------------------------------------------------------
   The standard cluster every instrument gets for free: undo/redo, presets
   (save, apply, delete), A/B compare, share link, copy values for an agent,
   theme. Drop <ParamActions params={params} /> into a toolbar cluster.

   With document state too, pass the joined history:
     const history = createHistory([params, doc])
     <ParamActions params={params} history={history} />

   Kit hotkeys here register at priority 0, so a shell binding the same key
   (T for a Text tool, \ for before/after) wins without configuration.
--------------------------------------------------------------------------- */
import { Bookmark, Moon, Redo2, Sun, Undo2, Link, Braces, SplitSquareHorizontal, Trash2, Plus, Download, ChevronDown, Bot } from 'lucide-react'
import type { ReactElement } from 'react'
import { useStore } from 'zustand'
import type { AnyParams } from '../core/params'
import { useCanUndo, type HistoryLike } from '../core/history'
import { copyText, exportJSON } from '../core/io'
import { useHotkeys } from '../core/hotkeys'
import { useTheme } from '../core/theme'
import { cn } from '../core/cn'
import { Button, IconButton } from '../ui/button'
import { Menu, Divider, type MenuItem } from '../ui/controls'
import { toast } from './toast'
import { promptText } from './dialog'

/** ⌘Z / ⇧⌘Z for a params store, a doc store, or a joined History. */
export function useHistoryHotkeys(history: HistoryLike) {
  useHotkeys({
    'mod+z': { run: () => { history.undo() }, label: 'Undo', group: 'Edit' },
    'shift+mod+z,mod+y': { run: () => { history.redo() }, label: 'Redo', group: 'Edit' },
  }, [history], { priority: 1 })
}
/** @deprecated use useHistoryHotkeys */
export const useParamHotkeys = (params: AnyParams) => useHistoryHotkeys(params)

export function HistoryButtons({ params, history }: { params?: AnyParams; history?: HistoryLike }) {
  const h = (history ?? params)!
  const { canUndo, canRedo } = useCanUndo(h)
  useHistoryHotkeys(h)
  return (
    <>
      <IconButton icon={Undo2} label="Undo" shortcut="mod+z" disabled={!canUndo} onClick={() => h.undo()} />
      <IconButton icon={Redo2} label="Redo" shortcut="shift+mod+z" disabled={!canRedo} onClick={() => h.redo()} />
    </>
  )
}

/** Lightroom-style list of named steps; click to jump. Works with createHistory or a params store. */
export function HistoryList({ history, params, className, openLabel = 'Open' }: { history?: import('../core/history').History; params?: AnyParams; className?: string; openLabel?: string }) {
  const hs = useStore((history ?? params)! as any, (s: any) => s) as any
  const past: string[] = history ? hs.past.map((p: any) => p.label) : hs.pastLabels
  const future: string[] = history ? hs.future.map((p: any) => p.label) : hs.futureLabels
  const rows = [openLabel, ...past, ...future]
  const at = past.length
  const jump = (i: number) => {
    if (history) return history.jumpTo(i)
    let guard = 500
    while (params!.getState().past.length > i && guard--) params!.undo()
    while (params!.getState().past.length < i && params!.getState().future.length && guard--) params!.redo()
  }
  return (
    <ol className={cn('flex flex-col-reverse py-1', className)}>
      {rows.map((label, i) => (
        <li key={i}>
          <button type="button" onClick={() => jump(i)}
            className={cn('flex h-7 w-full items-center gap-2 rounded-[6px] px-2.5 text-left text-[12px] outline-none focus-visible:ring-2 focus-visible:ring-signal',
              i === at ? 'bg-signal-soft text-fg' : i > at ? 'text-fg-faint hover:bg-hover' : 'text-fg-muted hover:bg-hover hover:text-fg')}>
            <span className="truncate">{label}</span>
          </button>
        </li>
      ))}
    </ol>
  )
}

export function PresetMenu({ params, trigger, title = 'Presets' }: { params: AnyParams; trigger?: ReactElement; title?: string }) {
  const presets = useStore(params, (s) => s.presets)
  useStore(params, (s) => s.values)
  const active = params.activePreset()
  const items: MenuItem[] = [
    { type: 'label', label: title },
    ...presets.map((p) => ({ label: p.name, checked: active?.name === p.name, onClick: () => params.applyPreset(p.name) })),
    { type: 'separator' },
    {
      label: 'Save current as preset…', icon: Plus, onClick: async () => {
        const name = await promptText({ title: 'Save preset', label: 'Name', defaultValue: `Preset ${presets.filter((p) => !p.builtin).length + 1}`, confirmLabel: 'Save' })
        if (name) toast(`Saved “${params.savePreset(name)}”`, { type: 'success' })
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
          <ChevronDown size={12} className="text-fg-faint" />
        </Button>
      )}
      items={items}
    />
  )
}

export function CompareButton({ params, hotkey = '\\' }: { params: AnyParams; hotkey?: string | false }) {
  const has = useStore(params, (s) => !!s.compare)
  const run = () => { const r = params.toggleCompare(); toast(r === 'stored' ? 'Stored A — tweak, then swap to compare' : 'Swapped A ↔ B') }
  useHotkeys(hotkey ? { [hotkey]: { run, label: 'A / B compare', group: 'View' } } : {}, [params, hotkey], { priority: 0 })
  return <IconButton icon={SplitSquareHorizontal} label={has ? 'Swap A / B' : 'Store A for comparison'} shortcut={hotkey || undefined} active={has} onClick={run} />
}

/** Copy values in the form an engineer or an agent can act on. */
export function shareMenuItems(params: AnyParams): MenuItem[] {
  return [
    { label: 'Copy link with values', icon: Link, onClick: async () => { await copyText(params.shareURL()); toast('Link copied', { type: 'success' }) } },
    { label: 'Copy changed values (JSON)', icon: Braces, onClick: async () => { await copyText(JSON.stringify(params.toJSON({ changedOnly: true, shareable: true }), null, 2)); toast('Changed values copied', { type: 'success' }) } },
    {
      label: 'Copy as agent prompt', icon: Bot, hint: 'Values plus what each one means', onClick: async () => {
        const changed = params.toJSON({ changedOnly: true, shareable: true }) as Record<string, unknown>
        const lines = Object.entries(changed).map(([k, v]) => {
          const d = params.defs[k] as any
          return `- ${d?.label ?? k} (\`${k}\`): ${JSON.stringify(v)} (default ${JSON.stringify(params.getState().defaults[k])})${d?.hint ? ` — ${d.hint}` : ''}`
        })
        const text = `Apply these tuned values to ${params.id}. Each is a param key in the schema:\n\n${lines.join('\n') || '- (no changes from defaults)'}\n`
        await copyText(text)
        toast('Prompt copied', { type: 'success' })
      },
    },
    { label: 'Download all values', icon: Download, onClick: () => exportJSON(params.toJSON({ shareable: true }), `${params.id}-values.json`) },
  ]
}

export function ThemeToggle({ hotkey = 't' }: { hotkey?: string | false }) {
  const { theme, toggle } = useTheme()
  useHotkeys(hotkey ? { [hotkey]: { run: toggle, label: 'Toggle theme', group: 'View' } } : {}, [theme, hotkey], { priority: 0 })
  return <IconButton icon={theme === 'dark' ? Sun : Moon} label={theme === 'dark' ? 'Light theme' : 'Dark theme'} shortcut={hotkey || undefined} onClick={toggle} />
}

/** The usual right-hand cluster: history · compare · presets · share · theme. Each part can be switched off. */
export function ParamActions({
  params, history, presets = true, compare = true, share = true, theme = true,
}: { params: AnyParams; history?: HistoryLike; presets?: boolean; compare?: boolean | { hotkey: string | false }; share?: boolean; theme?: boolean | { hotkey: string | false } }) {
  return (
    <>
      <HistoryButtons params={params} history={history} />
      {compare && <CompareButton params={params} hotkey={typeof compare === 'object' ? compare.hotkey : '\\'} />}
      <Divider vertical />
      {presets && <PresetMenu params={params} />}
      {share && <Menu align="end" trigger={<IconButton icon={Link} label="Share & copy" />} items={shareMenuItems(params)} />}
      {theme && <ThemeToggle hotkey={typeof theme === 'object' ? theme.hotkey : 't'} />}
    </>
  )
}
