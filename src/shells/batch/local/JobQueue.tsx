/* ---------------------------------------------------------------------------
   Render queue — a list of jobs with status, thumbnail and progress, for any
   batch operation (export every row × size, render a frame sequence, bake a
   set of icons).

     <Progress value={done / total} />
     <JobQueue jobs={jobs} onOpen={(job) => download(job.blob, job.name)} />

   Statuses: queued (faint) · running (spinner) · done (thumb + size) ·
   error (rec) · cancelled (struck through). The list scrolls the running job
   into view so a long batch is watchable.
--------------------------------------------------------------------------- */
import { useEffect, useRef } from 'react'
import { Check, X, Download } from 'lucide-react'
import { cn } from '@kit'

export interface Job {
  id: string
  label: string
  detail?: string
  status: 'queued' | 'running' | 'done' | 'error' | 'cancelled'
  /** object URL of the result, shown as a thumbnail */
  thumb?: string
  /** right-aligned meta once done (file size) */
  meta?: string
  /** thumbnail aspect (w / h) so the strip doesn't jump */
  aspect?: number
}

export function Progress({ value, className, tone = 'accent' }: { value: number; className?: string; tone?: 'accent' | 'ok' | 'rec' }) {
  const pct = Math.max(0, Math.min(1, value)) * 100
  return (
    <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}
      className={cn('h-[3px] w-full overflow-hidden rounded-full bg-track', className)}>
      <div className={cn('h-full rounded-full transition-[width] duration-200', tone === 'ok' ? 'bg-ok' : tone === 'rec' ? 'bg-rec' : 'bg-accent')} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function JobQueue({ jobs, onOpen, className }: { jobs: Job[]; onOpen?: (job: Job) => void; className?: string }) {
  const list = useRef<HTMLDivElement>(null)
  const running = jobs.find((j) => j.status === 'running')?.id
  // Follow the running job by scrolling the nearest scrollable ancestor only — scrollIntoView
  // would also scroll the panel and push the progress controls out of view.
  useEffect(() => {
    const el = running ? list.current?.querySelector<HTMLElement>(`[data-job="${CSS.escape(running)}"]`) : null
    let c = list.current?.parentElement ?? null
    while (c && !/(auto|scroll)/.test(getComputedStyle(c).overflowY)) c = c.parentElement
    if (!el || !c) return
    const top = el.getBoundingClientRect().top - c.getBoundingClientRect().top + c.scrollTop
    if (top < c.scrollTop) c.scrollTop = top
    else if (top + el.offsetHeight > c.scrollTop + c.clientHeight) c.scrollTop = top + el.offsetHeight - c.clientHeight
  }, [running])

  return (
    <div ref={list} className={cn('flex flex-col', className)} role="list">
      {jobs.map((j) => (
        <div key={j.id} data-job={j.id} role="listitem"
          className={cn('group/job flex h-10 shrink-0 items-center gap-2.5 rounded-[6px] px-2', j.status === 'running' && 'bg-hover')}>
          <div className="flex h-7 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[4px] bg-input shadow-[inset_0_0_0_1px_var(--line)]">
            {j.thumb ? (
              <img src={j.thumb} alt="" className="max-h-full max-w-full object-contain" style={{ aspectRatio: j.aspect }} />
            ) : j.status === 'running' ? (
              <span className="size-3 animate-spin rounded-full border-[1.5px] border-line-strong border-t-accent" />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <div className={cn('truncate text-[12px]', j.status === 'queued' || j.status === 'cancelled' ? 'text-faint' : 'text-fg', j.status === 'cancelled' && 'line-through')}>{j.label}</div>
            {j.detail && <div className="truncate text-[11px] text-faint">{j.detail}</div>}
          </div>
          <div className="flex shrink-0 items-center gap-1 text-[11px] tabular text-faint">
            {j.status === 'done' && j.meta && <span className="group-hover/job:hidden">{j.meta}</span>}
            {j.status === 'done' && onOpen && (
              <button type="button" aria-label={`Download ${j.label}`} onClick={() => onOpen(j)}
                className="hidden size-6 items-center justify-center rounded-[5px] text-muted outline-none hover:bg-hover hover:text-fg group-hover/job:flex focus-visible:flex">
                <Download size={13} strokeWidth={1.5} />
              </button>
            )}
            {j.status === 'done' && <Check size={13} strokeWidth={2} className="text-ok group-hover/job:hidden" />}
            {j.status === 'error' && <X size={13} strokeWidth={2} className="text-rec" />}
          </div>
        </div>
      ))}
    </div>
  )
}
