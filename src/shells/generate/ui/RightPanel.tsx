/* Right panel: Create (sampling settings via the kit Inspector) and Details (how the selected image was made). */
import { Copy, CornerUpLeft, Wand2, Heart, Download, Trash2, FolderHeart, Lock, Settings2, Columns2, Plus, ChevronDown, ImageUpscale, Grid2x2Plus, MousePointerClick } from 'lucide-react'
import { Panel, PanelHeader, PanelTabs, Inspector, Section, Row, Button, IconButton, Menu, Badge, Empty, Tip, toast, copyText, useValues } from '@kit'
import { promptText } from '@kit/system/dialog'
import { modelOf, aspectOf, type GenParams } from '../engine/models'
import { describe } from '../engine/paint'
import { params } from '../state/params'
import { ui, useUI } from '../state/ui'
import { useGallery, byId, toggleFavourite, toggleBoard, newBoard, select, type ImageRec } from '../state/gallery'
import { usePix, exportPNG } from '../state/images'
import { variations, upscale, remix, reusePrompt, reuseAll, lockSeedFrom, copyParams, removeWithUndo } from '../state/actions'

export function RightPanel() {
  const tab = useUI((s) => s.tab)
  const selection = useGallery((s) => s.selection)
  return (
    <Panel header={<PanelHeader><PanelTabs value={tab} onChange={(t) => ui.setState({ tab: t })} tabs={[{ value: 'create', label: 'Create' }, { value: 'details', label: 'Details' }]} /></PanelHeader>}>
      {tab === 'create' ? <Create /> : selection.length === 1 ? <Details id={selection[0]} /> : selection.length === 2 ? <Pair a={selection[0]} b={selection[1]} /> : selection.length > 2 ? <Many n={selection.length} /> : (
        <Empty icon={MousePointerClick} title="Select an image" hint="Its prompt, seed and every setting used appear here — with one click to reuse them." />
      )}
    </Panel>
  )
}

function Create() {
  const v = useValues(params)
  const m = modelOf(v.model)
  const a = aspectOf(v.aspect)
  const est = ((m.msPerStep * Math.pow((a.w * a.h) / 1048576, 0.85) * (1 + 0.14 * (v.batch - 1)) * v.steps) / 1000)
  return (
    <div className="flex flex-col">
      <div className="mx-pad mt-3 mb-1 rounded-cluster bg-well p-2.5">
        <div className="flex items-center justify-between text-ui font-medium text-fg">{m.name}<Badge>{m.sampler}</Badge></div>
        <div className="mt-0.5 text-ui text-fg-muted">{m.blurb}. Best at {m.steps} steps, CFG {m.guidance}.</div>
        <div className="mt-2 flex items-center gap-3 text-ui text-fg-faint tabular">
          <span>{v.batch} × {a.w}×{a.h}</span><span>≈ {est.toFixed(1)} s per run</span>
        </div>
        {v.steps < m.steps * 0.6 && <div className="mt-1.5 text-ui text-key">Below this model’s range — expect leftover noise.</div>}
        {v.guidance > 13 && <div className="mt-1.5 text-ui text-key">High guidance burns colours and contrast.</div>}
      </div>
      <Inspector params={params} folders={['sampling', 'refine']} />
    </div>
  )
}

const ago = (t: number) => new Date(t).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

function KV({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <Row label={k}>
      <span className="min-w-0 flex-1 truncate tabular text-ui text-fg select-text">{children}</span>
    </Row>
  )
}

function Details({ id }: { id: string }) {
  const rec = useGallery((s) => s.images.find((i) => i.id === id))
  const boards = useGallery((s) => s.boards)
  const pix = usePix(rec?.id, rec?.params, 'full')
  if (!rec) return null
  const p = rec.params
  const m = modelOf(p.model)
  const parent = byId(rec.parentId)
  const seen = describe(p)
  const scale = p.upscale ?? 1
  return (
    <div className="flex flex-col">
      <div className="p-pad pb-2">
        <button type="button" onClick={() => ui.setState({ overlay: { type: 'lightbox' } })} aria-label="Open large"
          className="relative block w-full overflow-hidden rounded-cluster bg-well outline-none focus-visible:ring-2 focus-visible:ring-signal" style={{ aspectRatio: `${p.w} / ${p.h}` }}>
          {pix ? <img src={pix.url} alt="" className="h-full w-full object-cover" /> : <span className="block h-full w-full animate-pulse bg-hover" />}
        </button>
        <div className="mt-2 flex items-center gap-1">
          <Button size="md" variant="primary" className="flex-1" onClick={() => variations(rec)}><Grid2x2Plus size={14} strokeWidth={1.5} />Variations</Button>
          <Menu align="end" trigger={<Button size="icon" variant="default" aria-label="Variation strength"><ChevronDown size={14} strokeWidth={1.5} /></Button>}
            items={[
              { type: 'label', label: 'Variation strength' },
              { label: 'Subtle', hint: '0.15', onClick: () => variations(rec, 0.15) },
              { label: 'Medium', hint: '0.4', onClick: () => variations(rec, 0.4) },
              { label: 'Strong', hint: '0.7', onClick: () => variations(rec, 0.7) },
            ]} />
          <Tip label={p.upscale ? 'Already upscaled' : 'Upscale 2×'} shortcut="u"><Button size="icon" variant="default" aria-label="Upscale" disabled={!!p.upscale} onClick={() => upscale(rec)}><ImageUpscale size={14} strokeWidth={1.5} /></Button></Tip>
          <Tip label="Remix" shortcut="r"><Button size="icon" variant="default" aria-label="Remix" onClick={() => remix(rec)}><Wand2 size={14} strokeWidth={1.5} /></Button></Tip>
        </div>
        <div className="mt-1 flex items-center gap-0.5">
          <IconButton icon={Heart} label={rec.favourite ? 'Unfavourite' : 'Favourite'} shortcut="f" active={!!rec.favourite} onClick={() => toggleFavourite([rec.id])} />
          <Menu trigger={<IconButton icon={FolderHeart} label="Add to board" />}
            items={[
              { type: 'label', label: 'Boards' },
              ...boards.map((b) => ({ label: b.name, checked: !!rec.boards?.includes(b.id), onClick: () => toggleBoard([rec.id], b.id) })),
              { type: 'separator' },
              { label: 'New board…', icon: Plus, onClick: async () => { const n = await promptText({ title: 'New board', label: 'Board name', defaultValue: `Board ${boards.length + 1}`, confirmLabel: 'Create board', description: 'This image is added to it.' }); if (n) { const b = newBoard(n); toggleBoard([rec.id], b.id) } } },
            ]} />
          <IconButton icon={Download} label="Download PNG" shortcut="mod+e" onClick={async () => { await exportPNG(p, rec.id); toast('PNG exported', { type: 'success', description: `${p.w * scale} × ${p.h * scale}` }) }} />
          <IconButton icon={Copy} label="Copy parameters" onClick={() => copyParams(rec)} />
          <div className="flex-1" />
          <IconButton icon={Trash2} label="Delete" shortcut="backspace" onClick={() => removeWithUndo([rec.id])} />
        </div>
      </div>

      <Section title="Prompt" actions={<IconButton size="icon-sm" icon={CornerUpLeft} label="Reuse prompt" onClick={() => reusePrompt(rec)} />}>
        <p className="px-pad text-ui leading-relaxed text-fg select-text">{p.prompt}</p>
        {p.negative && <p className="px-pad pt-1.5 text-ui leading-relaxed text-fg-muted select-text"><span className="text-fg-faint">Negative · </span>{p.negative}</p>}
        <div className="flex flex-wrap gap-1 px-pad pt-2">
          <Badge>{seen.scene}</Badge>
          {seen.features.map((f) => <Badge key={f}>{f}</Badge>)}
          <span className="flex items-center gap-0.5 pl-1">{seen.palette.map((c) => <span key={c} className="size-3 rounded-full shadow-[inset_0_0_0_1px_var(--line-strong)]" style={{ background: c }} title={c} />)}</span>
        </div>
      </Section>

      <Section title="Settings" actions={<Tip label="Load all settings into Create"><Button size="sm" variant="ghost" onClick={() => reuseAll(rec)}><Settings2 size={13} strokeWidth={1.5} />Reuse all</Button></Tip>}>
        <div><KV k="Model">{m.name}</KV></div>
        <div><KV k="Size">{p.w * scale} × {p.h * scale} · {p.aspect}{p.upscale ? ' · 2× upscale' : ''}</KV></div>
        <div><KV k="Steps">{p.steps} · {m.sampler}</KV></div>
        <div><KV k="Guidance">{p.guidance}</KV></div>
        <Row label="Seed">
          <span className="min-w-0 flex-1 truncate tabular text-ui text-fg select-text">{p.seed}</span>
          <IconButton size="icon-sm" icon={Copy} label="Copy seed" onClick={async () => { await copyText(String(p.seed)); toast('Seed copied') }} />
          <IconButton size="icon-sm" icon={Lock} label="Lock this seed" onClick={() => lockSeedFrom(rec)} />
        </Row>
        {p.subseed !== undefined && <div><KV k="Variation">{p.subseed} @ {p.subStrength}</KV></div>}
        <div><KV k="Time">{(rec.ms / 1000).toFixed(1)} s</KV></div>
        <div><KV k="Created">{ago(rec.createdAt)}</KV></div>
        {parent && (
          <Row label={rec.kind === 'upscale' ? 'Upscaled from' : rec.kind === 'remix' ? 'Remixed from' : 'Variation of'}>
            <button type="button" onClick={() => select([parent.id])} className="truncate text-left text-ui text-signal outline-none hover:underline focus-visible:ring-2 focus-visible:ring-signal">#{parent.id.slice(-4)} · seed {parent.params.seed}</button>
          </Row>
        )}
      </Section>
    </div>
  )
}

const DIFF_KEYS: { k: keyof GenParams; label: string; fmt?: (v: any) => string }[] = [
  { k: 'prompt', label: 'Prompt' }, { k: 'negative', label: 'Negative' }, { k: 'model', label: 'Model', fmt: (v) => modelOf(v).name }, { k: 'aspect', label: 'Aspect' },
  { k: 'steps', label: 'Steps' }, { k: 'guidance', label: 'Guidance' }, { k: 'seed', label: 'Seed' }, { k: 'subStrength', label: 'Variation' }, { k: 'upscale', label: 'Upscale', fmt: (v) => (v ? `${v}×` : '—') },
]

function Pair({ a, b }: { a: string; b: string }) {
  const A = useGallery((s) => s.images.find((i) => i.id === a))
  const B = useGallery((s) => s.images.find((i) => i.id === b))
  if (!A || !B) return null
  const diffs = DIFF_KEYS.filter((d) => String(A.params[d.k] ?? '') !== String(B.params[d.k] ?? ''))
  return (
    <div className="flex flex-col gap-2 p-pad">
      <div className="grid grid-cols-2 gap-1.5"><PairThumb rec={A} label="A" /><PairThumb rec={B} label="B" /></div>
      <Button variant="primary" onClick={() => ui.setState({ overlay: { type: 'compare', a, b, mode: 'wipe' } })}><Columns2 size={14} strokeWidth={1.5} />Compare</Button>
      <div className="pt-2 text-ui font-medium text-fg">{diffs.length ? `${diffs.length} difference${diffs.length > 1 ? 's' : ''}` : 'Identical settings'}</div>
      {diffs.map((d) => (
        <div key={d.k} className="rounded-cluster bg-well px-pad py-2 text-ui">
          <div className="text-fg-faint">{d.label}</div>
          <div className="mt-0.5 grid grid-cols-[14px_1fr] gap-x-1.5 gap-y-0.5 text-fg">
            <span className="text-fg-faint">A</span><span className="line-clamp-2 tabular">{d.fmt ? d.fmt(A.params[d.k]) : String(A.params[d.k] ?? '—')}</span>
            <span className="text-fg-faint">B</span><span className="line-clamp-2 tabular">{d.fmt ? d.fmt(B.params[d.k]) : String(B.params[d.k] ?? '—')}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function PairThumb({ rec, label }: { rec: ImageRec; label: string }) {
  const pix = usePix(rec.id, rec.params, 'thumb')
  return (
    <div className="relative overflow-hidden rounded-cluster bg-well" style={{ aspectRatio: `${rec.params.w} / ${rec.params.h}` }}>
      {pix && <img src={pix.url} alt="" className="h-full w-full object-cover" />}
      <span className="absolute top-1 left-1 rounded-control bg-scrim px-1.5 text-ui-sm font-medium text-white">{label}</span>
    </div>
  )
}

function Many({ n }: { n: number }) {
  const sel = useGallery((s) => s.selection)
  return (
    <div className="flex flex-col gap-1.5 p-pad">
      <div className="pb-1 text-title font-medium text-fg">{n} images selected</div>
      <Button variant="default" onClick={() => toggleFavourite(sel)}><Heart size={14} strokeWidth={1.5} />Toggle favourite</Button>
      <Button variant="default" onClick={() => { for (const id of sel) { const r = byId(id); if (r) upscale(r) } }}><ImageUpscale size={14} strokeWidth={1.5} />Upscale all</Button>
      <Button variant="danger" onClick={() => removeWithUndo(sel)}><Trash2 size={14} strokeWidth={1.5} />Delete {n} images</Button>
      <p className="pt-1 text-ui leading-relaxed text-fg-muted">Select exactly two to compare them side by side.</p>
      <Button variant="ghost" onClick={() => select([])}>Clear selection</Button>
    </div>
  )
}

