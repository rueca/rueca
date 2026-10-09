/* The history: running jobs on top, then images grouped by prompt (or one flat masonry). */
import { useMemo } from 'react'
import { Heart, Rows3, LayoutGrid, CornerUpLeft, RotateCw, X, Columns2, Trash2, Download, FolderHeart, ImagePlus, BoxSelect } from 'lucide-react'
import { Segmented, IconButton, Button, Menu, Tip, Badge, Kbd, Divider, cn } from '@kit'
import { modelOf, aspectOf } from '../engine/models'
import { useGallery, gallery, visible, groupImages, viewTitle, select, toggleFavourite, toggleBoard, byId, renameSession, type ImageRec } from '../state/gallery'
import { useQueue, cancel, type Job } from '../state/queue'
import { ui, focusPrompt } from '../state/ui'
import { params, prompt } from '../state/params'
import { reusePrompt, removeWithUndo, exportSelected } from '../state/actions'
import { enqueue } from '../state/queue'
import { usePix } from '../state/images'
import { Masonry } from '@kit/ui/masonry'
import { DenoisePreview } from '../local/DenoisePreview'
import { InlineText } from '@kit/ui/inline-text'
import { Tile } from './Tile'

const COL = { s: 170, m: 250, l: 380 }

const ago = (t: number) => {
  const m = (Date.now() - t) / 60000
  if (m < 1) return 'just now'
  if (m < 60) return `${Math.round(m)} min ago`
  if (m < 60 * 24) return `${Math.round(m / 60)} h ago`
  return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function statusText(j: Job, ahead: number) {
  const m = modelOf(j.items[0].model)
  if (j.status === 'queued') return ahead ? `Queued · ${ahead} ahead` : 'Queued'
  if (j.status === 'loading') return `Loading ${m.name}…`
  if (j.status === 'starting') return 'Starting…'
  if (j.status === 'finishing') return 'Decoding…'
  const left = ((j.total - j.step) * j.perStep) / 1000
  return `${j.kind === 'upscale' ? 'Upscaling' : 'Step'} ${j.step} / ${j.total} · ${left < 1 ? '<1' : left.toFixed(1)}s left`
}

function JobGroup({ job, ahead, col }: { job: Job; ahead: number; col: number }) {
  const p = job.items[0]
  const parent = byId(job.parentId)
  const progress = job.status === 'running' ? job.step / job.total : job.status === 'finishing' ? 1 : 0
  const scale = p.upscale ?? 1
  return (
    <section className="flex flex-col gap-2">
      <GroupHeader
        title={p.prompt}
        meta={<>{job.kind === 'upscale' ? `Upscale 2× · ${p.w * 2} × ${p.h * 2}` : job.kind === 'variation' ? `Variations · ${p.subStrength}` : `${modelOf(p.model).name} · ${p.aspect} · ${p.steps} steps · CFG ${p.guidance}`}</>}
        badge={<Badge tone="accent">{statusText(job, ahead)}</Badge>}
        parent={parent}
        actions={<Button size="sm" variant="ghost" onClick={() => cancel(job.id)}><X size={13} strokeWidth={1.5} />Cancel</Button>}
      />
      <Masonry items={job.items} getKey={(x) => `${job.id}-${x.seed}-${x.subseed ?? ''}`} getAspect={(x) => x.w / x.h} columnWidth={col}
        render={(x, b) => (
          <div className="h-full w-full overflow-hidden rounded-[8px]">
            <DenoisePreview src={job.sketches[b.index]} progress={progress} running={job.status === 'running' || job.status === 'loading'}
              label={job.status === 'running' ? `Seed ${x.seed}${x.upscale ? ` · ${x.w * scale} × ${x.h * scale}` : ''}` : statusText(job, ahead)} />
          </div>
        )} />
    </section>
  )
}

function ParentChip({ rec }: { rec: ImageRec }) {
  const pix = usePix(rec.id, rec.params, 'thumb')
  return (
    <button type="button" onClick={() => select([rec.id])} className="flex items-center gap-1.5 rounded-[6px] py-0.5 pr-1.5 pl-0.5 text-[11px] text-fg-muted outline-none hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-signal">
      <span className="size-5 overflow-hidden rounded-[4px] bg-well">{pix && <img src={pix.url} alt="" className="h-full w-full object-cover" />}</span>
      from #{rec.id.slice(-4)}
    </button>
  )
}

function GroupHeader({ title, meta, badge, actions, parent }: { title: string; meta: React.ReactNode; badge?: React.ReactNode; actions?: React.ReactNode; parent?: ImageRec }) {
  return (
    <div className="group/head flex items-start gap-3">
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[12.5px] leading-snug text-fg select-text">{title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-fg-faint">
          {badge}
          <span className="tabular">{meta}</span>
          {parent && <ParentChip rec={parent} />}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/head:opacity-100 group-focus-within/head:opacity-100">{actions}</div>
    </div>
  )
}

function rerun(rec: ImageRec, n: number) {
  const base = Math.floor(Math.random() * 999_999)
  const items = Array.from({ length: n }, (_, k) => ({ ...rec.params, seed: base + k, subseed: undefined, subStrength: undefined, upscale: undefined, detail: undefined }))
  enqueue(items, { kind: 'generate', sessionId: rec.sessionId })
}

export function Gallery() {
  const state = useGallery((s) => s)
  const jobs = useQueue((s) => s.jobs)
  const list = useMemo(() => visible(state), [state])
  const groups = useMemo(() => (state.groupBy === 'prompt' ? groupImages(list) : [{ key: 'all', prompt: '', images: list }]), [list, state.groupBy])
  const sel = new Set(state.selection)
  const multi = state.selection.length > 1
  const col = COL[state.density]
  const v = state.view
  const viewJobs = jobs.filter((j) => v.type === 'session' ? j.sessionId === v.id : v.type === 'all')
  const session = v.type === 'session' ? state.sessions.find((s) => s.id === v.id) : undefined

  return (
    <div className="relative flex h-full flex-col">
      {/* header */}
      <div className="flex h-11 flex-none items-center gap-2 px-1">
        <div className="flex min-w-0 flex-1 items-baseline gap-2">
          {session
            ? <InlineText value={session.name} onCommit={(n) => renameSession(session.id, n)} className="truncate text-[14px] font-semibold text-fg" label="Rename session" />
            : <span className="truncate text-[14px] font-semibold text-fg">{viewTitle(state)}</span>}
          <span className="tabular text-[12px] text-fg-faint">{list.length} image{list.length === 1 ? '' : 's'}</span>
        </div>
        {state.selection.length > 0 && (
          <div className="cluster flex h-8 items-center gap-0.5 pr-1 pl-2.5">
            <span className="tabular pr-1 text-[12px] text-fg">{state.selection.length} selected</span>
            {state.selection.length === 2 && (
              <Button size="sm" variant="primary" onClick={() => ui.setState({ overlay: { type: 'compare', a: state.selection[0], b: state.selection[1], mode: 'wipe' } })}><Columns2 size={13} strokeWidth={1.5} />Compare</Button>
            )}
            <IconButton size="icon-sm" icon={Heart} label="Favourite" shortcut="f" onClick={() => toggleFavourite(state.selection)} />
            {state.boards.length > 0 && (
              <Menu align="end" trigger={<IconButton size="icon-sm" icon={FolderHeart} label="Add to board" />}
                items={state.boards.map((b) => ({ label: b.name, onClick: () => toggleBoard(state.selection, b.id) }))} />
            )}
            <IconButton size="icon-sm" icon={Download} label="Export PNG" shortcut="mod+e" onClick={() => void exportSelected()} />
            <IconButton size="icon-sm" icon={Trash2} label="Delete" shortcut="backspace" onClick={() => removeWithUndo(state.selection)} />
            <Divider vertical />
            <IconButton size="icon-sm" icon={X} label="Clear selection" shortcut="esc" onClick={() => select([])} />
          </div>
        )}
        <Tip label="Favourites only"><IconButton icon={Heart} label="Favourites only" active={state.favOnly} onClick={() => gallery.setState({ favOnly: !state.favOnly })} /></Tip>
        <div className="w-[64px]"><Segmented size="sm" iconOnly value={state.groupBy} onChange={(g) => gallery.setState({ groupBy: g as 'prompt' | 'none' })} label="Group"
          options={[{ value: 'prompt', icon: Rows3, hint: 'Group by prompt (G)' }, { value: 'none', icon: LayoutGrid, hint: 'One grid' }]} /></div>
        <div className="w-[84px]"><Segmented size="sm" value={state.density} onChange={(d) => gallery.setState({ density: d as 's' | 'm' | 'l' })} label="Thumbnail size"
          options={[{ value: 's', label: 'S', hint: 'Small' }, { value: 'm', label: 'M', hint: 'Medium' }, { value: 'l', label: 'L', hint: 'Large' }]} /></div>
      </div>

      {/* history */}
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden rounded-[var(--radius-panel)] px-1 pt-1 pb-[200px]" onClick={(e) => { if (e.target === e.currentTarget) select([]) }}>
        <div className="flex flex-col gap-7">
          {viewJobs.map((j) => <JobGroup key={j.id} job={j} col={col} ahead={jobs.filter((x) => x.status === 'queued' && x.createdAt < j.createdAt).length} />)}
          {groups.map((g) => {
            const first = g.images[0]
            const p = first?.params
            if (!p) return null
            const a = aspectOf(p.aspect)
            return (
              <section key={g.key} className="flex flex-col gap-2">
                {state.groupBy === 'prompt' && (
                  <GroupHeader
                    title={g.prompt}
                    parent={byId(first.parentId)}
                    meta={<>{modelOf(p.model).name} · {a.id} · {p.steps} steps · CFG {p.guidance} · {ago(first.createdAt)} · {g.images.length}</>}
                    badge={first.kind !== 'generate' ? <Badge>{first.kind === 'upscale' ? 'Upscaled' : first.kind === 'variation' ? 'Variations' : 'Remix'}</Badge> : undefined}
                    actions={<>
                      <IconButton size="icon-sm" icon={CornerUpLeft} label="Reuse prompt" onClick={() => reusePrompt(first)} />
                      <IconButton size="icon-sm" icon={RotateCw} label="Run again with new seeds" onClick={() => rerun(first, params.values().batch)} />
                      <IconButton size="icon-sm" icon={BoxSelect} label="Select group" onClick={() => select(g.images.map((i) => i.id))} />
                    </>}
                  />
                )}
                <Masonry items={g.images} getKey={(i) => i.id} getAspect={(i) => i.params.w / i.params.h} columnWidth={col}
                  render={(i) => <Tile rec={i} selected={sel.has(i.id)} multi={multi} />} />
              </section>
            )
          })}
          {!list.length && !viewJobs.length && <EmptyState favourites={v.type === 'favourites' || state.favOnly} board={v.type === 'board'} />}
        </div>
      </div>
    </div>
  )
}

const IDEAS = [
  'Alpine lake at dawn, layered peaks fading into mist, soft film grain',
  'Neon city skyline in the rain, wet street reflections, cinematic',
  'Iridescent glass planet with rings, deep space, studio lighting',
  'Botanical bloom in coral and cream, macro, soft pastel light',
  'Abstract liquid marble, emerald and gold silk',
]

function EmptyState({ favourites, board }: { favourites: boolean; board: boolean }) {
  if (favourites || board)
    return (
      <div className="flex flex-col items-center gap-2 py-24 text-center">
        <Heart size={22} strokeWidth={1.5} className="text-fg-faint" />
        <div className="text-[13px] font-medium text-fg">{board ? 'This board is empty' : 'No favourites yet'}</div>
        <div className="max-w-[280px] text-[12px] leading-relaxed text-fg-muted">{board ? 'Add images from a tile’s menu or the details panel.' : <>Select an image and press <Kbd>F</Kbd>, or click its heart.</>}</div>
      </div>
    )
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <ImagePlus size={24} strokeWidth={1.5} className="text-fg-faint" />
      <div className="text-[14px] font-medium text-fg">Describe an image to start this session</div>
      <div className="max-w-[340px] text-[12px] leading-relaxed text-fg-muted">Write a prompt below and press <Kbd>⌘</Kbd><Kbd>↵</Kbd>. Every run lands here, grouped by prompt. Try one of these:</div>
      <div className="flex max-w-[620px] flex-wrap justify-center gap-1.5 pt-1">
        {IDEAS.map((t) => (
          <button key={t} type="button" onClick={() => { prompt.setValue('prompt', t); focusPrompt() }}
            className={cn('rounded-full bg-panel px-3 py-1.5 text-[11.5px] text-fg-muted shadow-[var(--shadow-cluster)] outline-none hover:text-fg focus-visible:ring-2 focus-visible:ring-signal')}>{t}</button>
        ))}
      </div>
    </div>
  )
}
