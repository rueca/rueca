/* ---------------------------------------------------------------------------
   The standard cluster every instrument gets for free: undo/redo, presets
   (save, apply, delete), A/B compare, send to agent, share link, copy values
   for an agent, theme. Drop <ParamActions params={params} /> into a toolbar cluster.

   With document state too, pass the joined history:
     const history = createHistory([params, doc])
     <ParamActions params={params} history={history} />

   "Send to agent" and "Comment" appear only when the dev server has the notes
   route (ruecaNotes()); pass `clock` / `doc` so notes carry the playhead and doc.
   Comment also needs a <NoteLayer> inside the artboard (./notes.tsx).

   Kit hotkeys here register at priority 0, so a shell binding the same key
   (T for a Text tool, \ for before/after) wins without configuration.
--------------------------------------------------------------------------- */
import { Bookmark, Moon, Redo2, Sun, Undo2, Link, Braces, SplitSquareHorizontal, Trash2, Plus, Download, ChevronDown, Bot, Smartphone, Send } from 'lucide-react'
import { useState, type ReactElement } from 'react'
import { useStore } from 'zustand'
import type { AnyParams } from '../core/params'
import type { DocStore } from '../core/doc'
import { captureSnapshot, formatNotePrompt, refreshNotes, sendNote } from '../core/notes'
import { CommentButton, useNotesEndpoint } from './notes'
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
            className={cn('flex h-row w-full items-center gap-2 rounded-control px-pad text-left text-ui outline-none focus-visible:ring-2 focus-visible:ring-signal',
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
  const run = () => { const r = params.toggleCompare(); toast(r === 'stored' ? 'Stored A. Tweak, then swap to compare' : 'Swapped A ↔ B') }
  useHotkeys(hotkey ? { [hotkey]: { run, label: 'A / B compare', group: 'View' } } : {}, [params, hotkey], { priority: 0 })
  return <IconButton icon={SplitSquareHorizontal} label={has ? 'Swap A / B' : 'Store A for comparison'} shortcut={hotkey || undefined} active={has} onClick={run} />
}

/** Copy values in the form an engineer or an agent can act on. */
export function shareMenuItems(params: AnyParams): MenuItem[] {
  // Tools with published knobs have a client view: the link for a client must open it, not the designer tool (client-view C1/C2).
  const published = Object.values(params.defs).some((d) => 'publish' in d && d.publish)
  return [
    ...(published ? [{ label: 'Copy client link', icon: Smartphone, hint: 'Opens the client view, with these values', onClick: async () => { const u = params.shareURL(); await copyText(/[#?&]client\b/.test(u) ? u : `${u}&client`); toast('Client link copied', { type: 'success' }) } }] : []),
    { label: 'Copy link with values', icon: Link, onClick: async () => { await copyText(params.shareURL()); toast('Link copied', { type: 'success' }) } },
    { label: 'Copy changed values (JSON)', icon: Braces, onClick: async () => { await copyText(JSON.stringify(params.toJSON({ changedOnly: true, shareable: true }), null, 2)); toast('Changed values copied', { type: 'success' }) } },
    {
      label: 'Copy as agent prompt', icon: Bot, hint: 'Values plus what each one means', onClick: async () => {
        await copyText(formatNotePrompt({ kind: 'values', snapshot: captureSnapshot({ params }) }))
        toast('Prompt copied', { type: 'success' })
      },
    },
    { label: 'Download all values', icon: Download, onClick: () => exportJSON(params.toJSON({ shareable: true }), `${params.id}-values.json`) },
  ]
}

/** Writes the changed values to .rueca/notes/ for the agent to bake in. Renders nothing without the notes route. */
export function SendToAgentButton({ params, history, clock, doc }: { params: AnyParams; history?: HistoryLike; clock?: { time(): number }; doc?: DocStore<any> }) {
  const available = useNotesEndpoint()
  const [busy, setBusy] = useState(false)
  if (!available) return null
  const run = async () => {
    const snapshot = captureSnapshot({ params, history, clock, doc })
    const n = Object.keys(snapshot.changed).length
    if (!n && !doc) { toast('Nothing to send', { description: 'Every value is at its default.' }); return }
    setBusy(true)
    try {
      await sendNote({ kind: 'values', snapshot })
      refreshNotes()
      toast(n ? `Sent ${n} ${n === 1 ? 'value' : 'values'} to the agent` : 'Sent to the agent', { type: 'success', description: 'Ask it to check the notes.' })
    } catch (e) {
      toast('Could not send', { type: 'error', description: (e as Error).message })
    } finally { setBusy(false) }
  }
  return <IconButton icon={Send} label="Send to agent" disabled={busy} onClick={run} />
}

export function ThemeToggle({ hotkey = 't' }: { hotkey?: string | false }) {
  const { theme, toggle } = useTheme()
  useHotkeys(hotkey ? { [hotkey]: { run: toggle, label: 'Toggle theme', group: 'View' } } : {}, [theme, hotkey], { priority: 0 })
  return <IconButton icon={theme === 'dark' ? Sun : Moon} label={theme === 'dark' ? 'Light theme' : 'Dark theme'} shortcut={hotkey || undefined} onClick={toggle} />
}

/** The usual right-hand cluster: history · compare · presets · share · theme. Each part can be switched off. */
export function ParamActions({
  params, history, clock, doc, presets = true, compare = true, agent = true, share = true, theme = true,
}: {
  params: AnyParams; history?: HistoryLike; clock?: { time(): number }; doc?: DocStore<any>
  presets?: boolean; compare?: boolean | { hotkey: string | false }; agent?: boolean; share?: boolean; theme?: boolean | { hotkey: string | false }
}) {
  return (
    <>
      <HistoryButtons params={params} history={history} />
      {compare && <CompareButton params={params} hotkey={typeof compare === 'object' ? compare.hotkey : '\\'} />}
      <Divider vertical />
      {presets && <PresetMenu params={params} />}
      {agent && <CommentButton params={params} />}
      {agent && <SendToAgentButton params={params} history={history} clock={clock} doc={doc} />}
      {share && <Menu align="end" trigger={<IconButton icon={Link} label="Share & copy" />} items={shareMenuItems(params)} />}
      {theme && <ThemeToggle hotkey={typeof theme === 'object' ? theme.hotkey : 't'} />}
    </>
  )
}
