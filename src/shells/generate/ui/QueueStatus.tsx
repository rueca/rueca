/* Toolbar queue readout: what is running, how far along, what is waiting. Click for the full queue. */
import { Popover } from '@base-ui/react/popover'
import { X, Cpu } from 'lucide-react'
import { Button, IconButton, cn } from '@kit'
import { modelOf } from '../engine/models'
import { useQueue, cancel, cancelAll } from '../state/queue'

export function QueueStatus() {
  const jobs = useQueue((s) => s.jobs)
  const loaded = useQueue((s) => s.loadedModel)
  const run = jobs.find((j) => j.status !== 'queued')
  const waiting = jobs.filter((j) => j.status === 'queued').length
  const pct = run ? (run.status === 'running' ? run.step / run.total : run.status === 'finishing' ? 1 : 0) : 0
  return (
    <Popover.Root>
      <Popover.Trigger className={cn('cluster flex h-9 min-w-[200px] items-center gap-2.5 px-3 text-[12px] outline-none focus-visible:ring-2 focus-visible:ring-signal', run ? 'text-fg' : 'text-fg-muted')}>
        {run ? (
          <>
            <span className="size-3 shrink-0 animate-spin rounded-full border-[1.5px] border-line-strong border-t-signal" />
            <span className="tabular whitespace-nowrap">{run.status === 'loading' ? 'Loading model' : run.status === 'running' ? `${run.kind === 'upscale' ? 'Upscaling' : 'Generating'} ${run.step}/${run.total}` : run.status === 'finishing' ? 'Decoding' : 'Starting'}</span>
            <span className="h-[3px] w-16 overflow-hidden rounded-full bg-track"><span className="block h-full bg-signal transition-[width] duration-100" style={{ width: `${pct * 100}%` }} /></span>
            {waiting > 0 && <span className="tabular whitespace-nowrap text-fg-faint">+{waiting} queued</span>}
          </>
        ) : (
          <><Cpu size={14} strokeWidth={1.5} className="text-fg-faint" /><span className="whitespace-nowrap">{loaded ? `${modelOf(loaded).name} ready` : 'Idle'}</span></>
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" sideOffset={8} className="z-[100]">
          <Popover.Popup className="pop w-[320px] p-1.5 outline-none">
            <div className="flex items-center justify-between px-2 pt-1 pb-1.5">
              <span className="text-[12px] font-medium text-fg">Queue</span>
              {jobs.length > 1 && <Button size="sm" variant="ghost" onClick={cancelAll}>Cancel all</Button>}
            </div>
            {!jobs.length && <div className="px-2 pb-2 text-[11.5px] text-fg-muted">Nothing running. Runs execute one at a time; switching model costs a cold load.</div>}
            {jobs.map((j) => (
              <div key={j.id} className="flex items-center gap-2 rounded-[7px] px-2 py-1.5 hover:bg-hover">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12px] text-fg">{j.items[0].prompt}</div>
                  <div className="tabular text-[11px] text-fg-faint">
                    {j.kind === 'upscale' ? 'Upscale 2×' : `${j.items.length} × ${modelOf(j.items[0].model).name}`} · {j.status === 'running' ? `${j.step}/${j.total}` : j.status}
                  </div>
                </div>
                <IconButton size="icon-sm" icon={X} label="Cancel" onClick={() => cancel(j.id)} />
              </div>
            ))}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
