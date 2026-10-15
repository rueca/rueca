/* ---------------------------------------------------------------------------
   ⌘K command palette + ? shortcut sheet. Commands are data, so the same
   list feeds the palette, the sheet, and the hotkeys.

     const commands: Command[] = [
       { id: 'export-png', label: 'Export PNG', group: 'Export', shortcut: 'mod+e', run: exportPng },
     ]
     <CommandPalette commands={commands} />
--------------------------------------------------------------------------- */
import { Command as Cmdk } from 'cmdk'
import { Dialog } from '@base-ui/react/dialog'
import { useRef, useState, type ComponentType } from 'react'
import { Check, Search } from 'lucide-react'
import { useHotkeys, useHotkeyRegistry, prettyCombo } from '../core/hotkeys'
import { Kbd } from '../ui/button'
import { useDensity, type Density } from '../core/density'
import { usePresence } from '../core/presence'

export interface Command { id: string; label: string; group?: string; shortcut?: string; icon?: ComponentType<{ size?: number; strokeWidth?: number }>; run: () => void; keywords?: string[] }

export function CommandPalette({ commands, extraShortcuts = [] }: { commands: Command[]; extraShortcuts?: { keys: string; label: string; group?: string }[] }) {
  const [open, setOpenRaw] = useState(false)
  // Remember where focus was so closing returns it there (break-it A4).
  const returnTo = useRef<HTMLElement | null>(null)
  const setOpen = (v: boolean | ((o: boolean) => boolean)) => setOpenRaw((o) => {
    const next = typeof v === 'function' ? v(o) : v
    if (next && !o) returnTo.current = document.activeElement as HTMLElement | null
    return next
  })
  const [sheet, setSheet] = useState(false)
  // Commands carry their shortcuts: bound here at shell priority, labelled for the ? sheet.
  const bound = Object.fromEntries(commands.filter((c) => c.shortcut).map((c) => [c.shortcut!, { run: () => c.run(), label: c.label, group: c.group }]))
  const sig = commands.map((c) => `${c.id}:${c.shortcut ?? ''}`).join('|')
  useHotkeys(bound, [sig])
  useHotkeys({
    'mod+k': { run: () => setOpen((o) => !o), label: 'Command palette', group: 'Help' },
    '?': { run: () => setSheet((s) => !s), label: 'Keyboard shortcuts', group: 'Help' },
  }, [], { priority: 0 })
  const registry = useHotkeyRegistry()
  // every palette gets the kit's density choice (remembered per browser, see core/density)
  const { density, setDensity } = useDensity()
  const presence = usePresence()
  const all: Command[] = [...commands, ...(['default', 'comfortable', 'compact'] as Density[]).map((d) => ({
    id: `density-${d}`, label: `Density: ${d[0].toUpperCase()}${d.slice(1)}`, group: 'View',
    icon: density === d ? Check : undefined, keywords: ['size', 'spacing', 'compact', 'roomy'], run: () => setDensity(d),
  })),
  { id: 'presence-fade', label: 'Fade panels while dragging', group: 'View', icon: presence.fade ? Check : undefined, keywords: ['presence', 'focus', 'hide'], run: () => presence.set({ fade: !presence.fade }) },
  { id: 'presence-dim', label: 'Dim panels at rest', group: 'View', icon: presence.dim ? Check : undefined, keywords: ['presence', 'focus', 'quiet'], run: () => presence.set({ dim: !presence.dim }) },
  { id: 'presence-min', label: 'Minimise panels', group: 'View', shortcut: 'shift+\\', /* bound by <Studio>, shown here */ icon: presence.minimised ? Check : undefined, keywords: ['presence', 'collapse', 'fold'], run: () => presence.set({ minimised: !presence.minimised }) },
  ]
  const groups = [...new Set(all.map((c) => c.group ?? 'Actions'))]

  return (
    <>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-[150] bg-black/30 transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
          <Dialog.Popup finalFocus={returnTo} className="pop fixed top-[14vh] left-1/2 z-[151] w-[560px] max-w-[calc(100vw-32px)] -translate-x-1/2 overflow-hidden outline-none transition-[opacity,transform] duration-150 data-[ending-style]:opacity-0 data-[starting-style]:scale-[.98] data-[starting-style]:opacity-0">
            <Dialog.Title className="sr-only">Command palette</Dialog.Title>
            <Cmdk loop label="Commands" className="flex flex-col"
              // exact / prefix matches on the label outrank fuzzy keyword hits ("css" → Export CSS, not "Back 10 frames")
              filter={(value, search, keywords) => {
                const q = search.toLowerCase().trim(), label = value.toLowerCase()
                if (!q) return 1
                if (label === q) return 1
                if (label.startsWith(q)) return 0.9
                if (label.split(/\s+/).some((w) => w.startsWith(q))) return 0.8
                if (label.includes(q)) return 0.6
                if (keywords?.some((k) => k.toLowerCase().includes(q))) return 0.4
                let i = 0; for (const ch of label) if (ch === q[i]) i++
                return i === q.length ? 0.1 : 0
              }}>
              <div className="flex h-header items-center gap-2 border-b border-line px-pad">
                <Search size={14} className="text-fg-faint" />
                <Cmdk.Input autoFocus placeholder="Search commands…" className="h-full flex-1 bg-transparent text-title text-fg outline-none placeholder:text-fg-faint" />
                <Kbd>esc</Kbd>
              </div>
              <Cmdk.List className="max-h-[360px] overflow-y-auto p-1.5">
                <Cmdk.Empty className="px-pad py-6 text-center text-ui text-fg-muted">No matching commands</Cmdk.Empty>
                {groups.map((g) => (
                  <Cmdk.Group key={g} heading={g} className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-ui [&_[cmdk-group-heading]]:text-fg-faint">
                    {all.filter((c) => (c.group ?? 'Actions') === g).map((c) => {
                      const Icon = c.icon
                      return (
                        <Cmdk.Item key={c.id} value={`${c.label}`} keywords={c.keywords} onSelect={() => { setOpen(false); setTimeout(c.run, 0) }}
                          className="flex h-button-lg cursor-default items-center gap-2.5 rounded-control px-2 text-ui text-fg data-[selected=true]:bg-signal-strong data-[selected=true]:text-signal-fg">
                          <span className="flex w-4 justify-center opacity-70">{Icon && <Icon size={14} strokeWidth={1.5} />}</span>
                          <span className="flex-1">{c.label}</span>
                          {c.shortcut && <span className="text-ui opacity-60">{prettyCombo(c.shortcut)}</span>}
                        </Cmdk.Item>
                      )
                    })}
                  </Cmdk.Group>
                ))}
              </Cmdk.List>
            </Cmdk>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={sheet} onOpenChange={setSheet}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-[150] bg-black/30" />
          <Dialog.Popup className="pop fixed top-1/2 left-1/2 z-[151] max-h-[80vh] w-[600px] max-w-[calc(100vw-32px)] -translate-1/2 overflow-y-auto p-5 outline-none">
            <Dialog.Title className="mb-3 text-title font-semibold">Keyboard shortcuts</Dialog.Title>
            <ShortcutSheet entries={[...registry.map((b) => ({ keys: b.combo, label: b.label!, group: b.group })), ...extraShortcuts]} />
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}

/** Grouped list of shortcuts — fed by the live hotkey registry, so it can't drift. */
function ShortcutSheet({ entries }: { entries: { keys: string; label: string; group?: string }[] }) {
  const seen = new Set<string>()
  const list = entries.filter((e) => { const k = e.keys + e.label; if (seen.has(k)) return false; seen.add(k); return true })
  const groups = [...new Set(list.map((e) => e.group ?? 'General'))]
  return (
    <div className="columns-2 gap-x-8">
      {groups.map((g) => (
        <div key={g} className="mb-3 break-inside-avoid">
          <div className="mb-1 text-ui text-fg-faint">{g}</div>
          {list.filter((e) => (e.group ?? 'General') === g).map((s) => (
            <div key={s.keys + s.label} className="flex h-row items-center justify-between gap-3 text-ui">
              <span className="truncate text-fg-muted">{s.label}</span>
              <Kbd>{prettyCombo(s.keys)}</Kbd>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
