/* ---------------------------------------------------------------------------
   Jobs — a render queue for any batch operation (export every row × size,
   render a frame sequence, bake a set of icons), in three parts:

     export const runner = createJobRunner()               // a zustand store
     const { cancelled } = await runner.run(tasks.map((t) => ({
       id: t.id, label: t.name, detail: '1080 × 1350', aspect: 1080 / 1350,
       run: async ({ signal, set }) => {                    // one job
         const blob = await render(t, signal)
         set({ thumb: URL.createObjectURL(blob), meta: fmtBytes(blob.size) })
         return blob
       },
     })), { concurrency: 1 })
     runner.cancel()                                        // queued → cancelled; signal aborts
     runner.clear()                                         // forget the list (revokes thumbs)

     const st = useJobs(runner)                             // { status, jobs, done, failed, elapsed }
     <Progress value={st.done / st.jobs.length} label="Export" />
     <JobQueue jobs={st.jobs} onOpen={(job) => download(job)} />

   Statuses: queued (faint) · running (spinner, optional per-job progress) ·
   done (thumbnail + meta) · error (rec, message as tooltip) · cancelled
   (struck through). The list follows the running job by scrolling its own
   scroll container only, so progress controls above it never move.
   The runner yields a frame between jobs, so the UI paints while it works.

   Accessibility: Progress is role="progressbar" with aria-valuenow and a
   label; JobQueue is a list whose items name their status in text (not just
   colour); the open button is labelled and appears on hover AND focus.
   (Promoted from shells/batch/local/JobQueue.tsx + the batch exporter loop.)
--------------------------------------------------------------------------- */
import { useEffect, useRef, type ComponentType } from 'react'
import { createStore, type StoreApi } from 'zustand/vanilla'
import { useStore } from 'zustand'
import { Check, Download, X } from 'lucide-react'
import { cn } from '../core/cn'
import { Tip } from '../ui/tooltip'

export type JobStatus = 'queued' | 'running' | 'done' | 'error' | 'cancelled'

export interface Job {
  id: string
  label: string
  detail?: string
  status: JobStatus
  /** object URL / data URL of the result, shown as a thumbnail */
  thumb?: string
  /** right-aligned meta once done (file size, duration) */
  meta?: string
  /** thumbnail aspect (w / h) so the strip doesn't jump */
  aspect?: number
  /** 0–1 while running, for long single jobs */
  progress?: number
  error?: string
}

/* ------------------------------------------------------------------ Progress */

export function Progress({ value, label = 'Progress', tone = 'signal', indeterminate, className }: {
  /** 0–1 */
  value: number
  label?: string
  tone?: 'signal' | 'ok' | 'rec'
  indeterminate?: boolean
  className?: string
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={indeterminate ? undefined : Math.round(pct)}
      className={cn('relative h-[3px] w-full overflow-hidden rounded-full bg-track', className)}>
      <div className={cn('h-full rounded-full', tone === 'ok' ? 'bg-ok' : tone === 'rec' ? 'bg-rec' : 'bg-signal',
        indeterminate ? 'absolute w-1/3 animate-[studio-indeterminate_1.1s_ease-in-out_infinite]' : 'transition-[width] duration-200')}
        style={indeterminate ? undefined : { width: `${pct}%` }} />
      {indeterminate && <style>{'@keyframes studio-indeterminate{0%{left:-33%}100%{left:100%}}'}</style>}
    </div>
  )
}

/* ------------------------------------------------------------------ JobQueue */

const STATUS_TEXT: Record<JobStatus, string> = { queued: 'Queued', running: 'Running', done: 'Done', error: 'Failed', cancelled: 'Cancelled' }

export function JobQueue({ jobs, onOpen, openLabel = 'Download', openIcon: OpenIcon = Download, className }: {
  jobs: Job[]
  /** click a finished job (download, reveal, open in a viewer) */
  onOpen?: (job: Job) => void
  openLabel?: string
  openIcon?: ComponentType<{ size?: number; strokeWidth?: number }>
  className?: string
}) {
  const list = useRef<HTMLUListElement>(null)
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
    <ul ref={list} className={cn('flex flex-col', className)} aria-label="Jobs">
      {jobs.map((j) => (
        <li key={j.id} data-job={j.id} aria-label={`${j.label}: ${STATUS_TEXT[j.status]}`}
          className={cn('group/job relative flex min-h-row shrink-0 items-center gap-2.5 rounded-control px-2 py-0.5', j.status === 'running' && 'bg-hover')}>
          <div className="flex h-7 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[4px] bg-control shadow-[inset_0_0_0_1px_var(--line)]">
            {j.thumb ? (
              <img src={j.thumb} alt="" className="max-h-full max-w-full object-contain" style={{ aspectRatio: j.aspect }} />
            ) : j.status === 'running' ? (
              <span className="size-3 animate-spin rounded-full border-[1.5px] border-line-strong border-t-signal" aria-hidden />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <div className={cn('truncate text-ui', j.status === 'queued' || j.status === 'cancelled' ? 'text-fg-muted' : 'text-fg', j.status === 'cancelled' && 'line-through')}>{j.label}</div>
            {j.detail && <div className="truncate text-ui text-fg-faint">{j.detail}</div>}
          </div>
          <div className="flex shrink-0 items-center gap-1 text-ui tabular text-fg-faint">
            {j.status === 'done' && j.meta && <span className={cn(onOpen && 'group-hover/job:hidden group-focus-within/job:hidden')}>{j.meta}</span>}
            {j.status === 'done' && onOpen && (
              <button type="button" aria-label={`${openLabel} ${j.label}`} onClick={() => onOpen(j)}
                // swapped in for the size and tick on hover (not just made transparent), so it doesn't take the title's room at rest
                className="hidden size-icon items-center justify-center rounded-control text-fg-muted outline-none hover:bg-hover hover:text-fg group-hover/job:flex group-focus-within/job:flex focus-visible:flex focus-visible:ring-2 focus-visible:ring-signal">
                <OpenIcon size={13} strokeWidth={1.5} />
              </button>
            )}
            {j.status === 'done' && <Check size={13} strokeWidth={2} className={cn('text-ok', onOpen && 'group-hover/job:hidden group-focus-within/job:hidden')} aria-hidden />}
            {j.status === 'error' && <Tip label={j.error ?? 'Failed'}><span className="flex text-rec" aria-label={j.error ?? 'Failed'}><X size={13} strokeWidth={2} /></span></Tip>}
          </div>
          {j.status === 'running' && j.progress !== undefined && (
            <Progress value={j.progress} label={`${j.label} progress`} className="absolute inset-x-2 bottom-0.5 h-[2px] w-auto" />
          )}
        </li>
      ))}
    </ul>
  )
}

/* ------------------------------------------------------------------ runner */

export interface JobRunState {
  status: 'idle' | 'running' | 'done' | 'cancelled'
  jobs: Job[]
  done: number
  failed: number
  startedAt: number
  elapsed: number
}

export interface JobTask<R = unknown> extends Omit<Job, 'status'> {
  run: (ctx: { signal: AbortSignal; set: (patch: Partial<Omit<Job, 'id' | 'status'>>) => void; index: number }) => Promise<R>
}

export interface JobRunner extends StoreApi<JobRunState> {
  /** run tasks in order (or `concurrency` at a time). Resolves when every job finished, failed or was cancelled. */
  run<R>(tasks: JobTask<R>[], opts?: { concurrency?: number }): Promise<{ results: (R | undefined)[]; cancelled: boolean }>
  cancel(): void
  /** forget the list (revokes blob: thumbnails) — not while running */
  clear(): void
  update(id: string, patch: Partial<Job>): void
}

export function createJobRunner(): JobRunner {
  const store = createStore<JobRunState>(() => ({ status: 'idle', jobs: [], done: 0, failed: 0, startedAt: 0, elapsed: 0 }))
  let ctrl: AbortController | null = null
  const update = (id: string, patch: Partial<Job>) => store.setState((s) => ({ jobs: s.jobs.map((j) => (j.id === id ? { ...j, ...patch } : j)) }))
  const frame = () => new Promise((r) => setTimeout(r, 0))
  const revoke = () => { for (const j of store.getState().jobs) if (j.thumb?.startsWith('blob:')) URL.revokeObjectURL(j.thumb) }

  const api: JobRunner = Object.assign(store, {
    update,
    cancel: () => { ctrl?.abort() },
    clear: () => {
      if (store.getState().status === 'running') return
      revoke()
      store.setState({ status: 'idle', jobs: [], done: 0, failed: 0, startedAt: 0, elapsed: 0 })
    },
    run: async <R,>(tasks: JobTask<R>[], opts: { concurrency?: number } = {}) => {
      if (store.getState().status === 'running') throw new Error('createJobRunner: already running')
      revoke()
      ctrl = new AbortController()
      const signal = ctrl.signal
      const startedAt = performance.now()
      store.setState({ status: 'running', jobs: tasks.map(({ run: _r, ...j }) => ({ ...j, status: 'queued' as const })), done: 0, failed: 0, startedAt, elapsed: 0 })
      const results: (R | undefined)[] = new Array(tasks.length)
      let next = 0
      const worker = async () => {
        while (next < tasks.length && !signal.aborted) {
          const index = next++
          const t = tasks[index]
          update(t.id, { status: 'running' })
          await frame()
          if (signal.aborted) { update(t.id, { status: 'cancelled' }); break }
          try {
            results[index] = await t.run({ signal, index, set: (patch) => update(t.id, patch) })
            const ok = !(signal.aborted && results[index] === undefined)
            update(t.id, { status: ok ? 'done' : 'cancelled', progress: undefined })
            if (ok) store.setState((s) => ({ done: s.done + 1, elapsed: performance.now() - startedAt }))
          } catch (e) {
            update(t.id, { status: signal.aborted ? 'cancelled' : 'error', error: e instanceof Error ? e.message : String(e), progress: undefined })
            if (!signal.aborted) store.setState((s) => ({ failed: s.failed + 1, elapsed: performance.now() - startedAt }))
          }
        }
      }
      await Promise.all(Array.from({ length: Math.max(1, Math.min(opts.concurrency ?? 1, tasks.length)) }, worker))
      const cancelled = signal.aborted
      store.setState((s) => ({
        status: cancelled ? 'cancelled' : 'done',
        jobs: cancelled ? s.jobs.map((j) => (j.status === 'queued' ? { ...j, status: 'cancelled' as const } : j)) : s.jobs,
        elapsed: performance.now() - startedAt,
      }))
      ctrl = null
      return { results, cancelled }
    },
  })
  return api
}

/** React: the runner's state, or a slice of it. */
export function useJobs(runner: JobRunner): JobRunState
export function useJobs<T>(runner: JobRunner, pick: (s: JobRunState) => T): T
export function useJobs<T>(runner: JobRunner, pick?: (s: JobRunState) => T) {
  return useStore(runner, (s) => (pick ? pick(s) : s))
}
