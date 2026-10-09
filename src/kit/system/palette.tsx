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
import { useState, type ComponentType } from 'react'
import { Search } from 'lucide-react'
import { useHotkeys, prettyCombo } from '../core/hotkeys'
import { Kbd } from '../ui/button'

export interface Command { id: string; label: string; group?: string; shortcut?: string; icon?: ComponentType<{ size?: number; strokeWidth?: number }>; run: () => void; keywords?: string[] }

export function CommandPalette({ commands, extraShortcuts = [] }: { commands: Command[]; extraShortcuts?: { keys: string; label: string; group?: string }[] }) {
  const [open, setOpen] = useState(false)
  const [sheet, setSheet] = useState(false)
  const bound = Object.fromEntries(commands.filter((c) => c.shortcut).map((c) => [c.shortcut!, () => c.run()]))
  useHotkeys({ 'mod+k': () => setOpen((o) => !o), 'shift+/': () => setSheet((s) => !s), ...bound }, [commands])
  const groups = [...new Set(commands.map((c) => c.group ?? 'Actions'))]

  return (
    <>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-[150] bg-black/30 transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
          <Dialog.Popup className="pop fixed top-[14vh] left-1/2 z-[151] w-[560px] max-w-[calc(100vw-32px)] -translate-x-1/2 overflow-hidden outline-none transition-[opacity,transform] duration-150 data-[ending-style]:opacity-0 data-[starting-style]:scale-[.98] data-[starting-style]:opacity-0">
            <Dialog.Title className="sr-only">Command palette</Dialog.Title>
            <Cmdk loop label="Commands" className="flex flex-col">
              <div className="flex h-11 items-center gap-2 border-b border-line px-3.5">
                <Search size={14} className="text-faint" />
                <Cmdk.Input autoFocus placeholder="Search commands…" className="h-full flex-1 bg-transparent text-[13px] text-fg outline-none placeholder:text-faint" />
                <Kbd>esc</Kbd>
              </div>
              <Cmdk.List className="max-h-[360px] overflow-y-auto p-1.5">
                <Cmdk.Empty className="px-3 py-6 text-center text-[12px] text-muted">No matching commands</Cmdk.Empty>
                {groups.map((g) => (
                  <Cmdk.Group key={g} heading={g} className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:text-faint">
                    {commands.filter((c) => (c.group ?? 'Actions') === g).map((c) => {
                      const Icon = c.icon
                      return (
                        <Cmdk.Item key={c.id} value={`${c.label} ${c.keywords?.join(' ') ?? ''}`} onSelect={() => { setOpen(false); setTimeout(c.run, 0) }}
                          className="flex h-8 cursor-default items-center gap-2.5 rounded-[6px] px-2 text-[12.5px] text-fg data-[selected=true]:bg-accent-strong data-[selected=true]:text-accent-fg">
                          <span className="flex w-4 justify-center opacity-70">{Icon && <Icon size={14} strokeWidth={1.5} />}</span>
                          <span className="flex-1">{c.label}</span>
                          {c.shortcut && <span className="text-[11px] opacity-60">{prettyCombo(c.shortcut)}</span>}
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
          <Dialog.Popup className="pop fixed top-1/2 left-1/2 z-[151] max-h-[80vh] w-[520px] max-w-[calc(100vw-32px)] -translate-1/2 overflow-y-auto p-5 outline-none">
            <Dialog.Title className="mb-3 text-[13px] font-semibold">Keyboard shortcuts</Dialog.Title>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              {[
                ...commands.filter((c) => c.shortcut).map((c) => ({ keys: c.shortcut!, label: c.label })),
                { keys: 'mod+k', label: 'Command palette' },
                { keys: 'mod+z', label: 'Undo' },
                { keys: 'shift+mod+z', label: 'Redo' },
                { keys: 'mod+\\', label: 'Hide interface' },
                { keys: 't', label: 'Toggle theme' },
                ...extraShortcuts,
              ].map((s) => (
                <div key={s.keys + s.label} className="flex h-7 items-center justify-between gap-3 text-[12px]">
                  <span className="text-muted">{s.label}</span>
                  <Kbd>{prettyCombo(s.keys)}</Kbd>
                </div>
              ))}
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
