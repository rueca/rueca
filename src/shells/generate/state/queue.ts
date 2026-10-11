/* ---------------------------------------------------------------------------
   The mock inference queue. One job runs at a time (one GPU); a job is a
   batch of images that denoise together. Switching models costs a cold
   load. Progress streams step by step; cancel is immediate.
--------------------------------------------------------------------------- */
import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'
import { stepMs, type GenParams } from '../engine/models'
import { paint, ready } from '../engine/paint'
import { addImages, uid, type ImageKind, type ImageRec } from './gallery'
import { put, sketch, thumbFrom } from './images'

export type JobStatus = 'queued' | 'loading' | 'starting' | 'running' | 'finishing'
export interface Job {
  id: string
  sessionId: string
  kind: ImageKind
  parentId?: string
  items: GenParams[]
  status: JobStatus
  step: number
  total: number
  createdAt: number
  startedAt?: number
  /** low-res renders shown through the denoise effect */
  sketches: string[]
  /** simulated ms per step for this job */
  perStep: number
}

interface QueueState { jobs: Job[]; loadedModel: string | null }
export const queue = createStore<QueueState>(() => ({ jobs: [], loadedModel: null }))
export const useQueue = <T,>(pick: (s: QueueState) => T) => useStore(queue, pick)

const timers = new Map<string, ReturnType<typeof setTimeout>>()
const setJob = (id: string, patch: Partial<Job>) => queue.setState((s) => ({ jobs: s.jobs.map((j) => (j.id === id ? { ...j, ...patch } : j)) }))
const alive = (id: string) => queue.getState().jobs.some((j) => j.id === id)
const wait = (id: string, ms: number) => new Promise<boolean>((res) => { timers.set(id, setTimeout(() => res(alive(id)), ms)) })

export function enqueue(items: GenParams[], o: { kind: ImageKind; sessionId: string; parentId?: string }) {
  const first = items[0]
  const total = o.kind === 'upscale' ? 20 : first.steps
  const perStep = o.kind === 'upscale' ? stepMs({ ...first, w: first.w * 2, h: first.h * 2, model: 'lumen-xl' }, 1) * 0.6 : stepMs(first, items.length)
  const job: Job = { id: uid('j-'), sessionId: o.sessionId, kind: o.kind, parentId: o.parentId, items, status: 'queued', step: 0, total, createdAt: Date.now(), sketches: [], perStep }
  queue.setState((s) => ({ jobs: [...s.jobs, job] }))
  void pump()
  return job
}

export function cancel(id: string) {
  clearTimeout(timers.get(id))
  timers.delete(id)
  queue.setState((s) => ({ jobs: s.jobs.filter((j) => j.id !== id) }))
  void pump()
}
export function cancelAll() { for (const j of queue.getState().jobs) cancel(j.id) }

let running: string | null = null

async function pump() {
  if (running && alive(running)) return
  running = null
  const job = queue.getState().jobs.find((j) => j.status === 'queued')
  if (!job) return
  running = job.id
  await run(job)
  running = null
  void pump()
}

async function run(job: Job) {
  const model = job.items[0].model
  if (queue.getState().loadedModel !== model) {
    setJob(job.id, { status: 'loading' })
    if (!(await wait(job.id, 700 + Math.random() * 500))) return
    queue.setState({ loadedModel: model })
  } else {
    setJob(job.id, { status: 'starting' })
    if (!(await wait(job.id, 160 + Math.random() * 160))) return
  }
  const sketches = job.items.map((p) => sketch(p, 220))
  const startedAt = performance.now()
  setJob(job.id, { status: 'running', sketches, startedAt: Date.now() })
  for (let s = 1; s <= job.total; s++) {
    // a little jitter per step, like a real sampler's timings
    if (!(await wait(job.id, job.perStep * (0.85 + Math.random() * 0.3)))) return
    setJob(job.id, { step: s })
  }
  setJob(job.id, { status: 'finishing' })
  const recs: ImageRec[] = []
  for (let k = 0; k < job.items.length; k++) {
    if (!(await wait(job.id, 0))) return
    const params = job.items[k]
    const id = uid('i-')
    await ready(params)
    const c = paint(params, 1)
    await put(id, 'full', c)
    await put(id, 'thumb', thumbFrom(c, params))
    recs.push({ id, sessionId: job.sessionId, jobId: job.id, createdAt: Date.now() - k, params, kind: job.kind, parentId: job.parentId, ms: Math.round(performance.now() - startedAt), boards: [] })
  }
  if (!alive(job.id)) return
  queue.setState((s) => ({ jobs: s.jobs.filter((j) => j.id !== job.id) }))
  const n = recs.length, what = job.kind === 'upscale' ? 'Upscale' : job.kind === 'variation' ? 'Vary' : job.kind === 'remix' ? 'Remix' : 'Generate'
  addImages(recs, `${what} · ${n} image${n === 1 ? '' : 's'}`)
}
