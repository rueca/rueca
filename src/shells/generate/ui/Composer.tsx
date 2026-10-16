/* The prompt bar: prompt, collapsible negative prompt, model / aspect / batch, settings summary, Generate. */
import { useEffect, useRef } from 'react'
import { Sparkles, MinusCircle, ChevronDown, SlidersHorizontal, X, Lock, Shuffle, PencilSparkles } from 'lucide-react'
import { Button, Menu, Select, Segmented, Tip, Kbd, useValues, prettyCombo, cn } from '@kit'
import { MODELS, ASPECTS, aspectOf, modelOf } from '../engine/models'
import { params, prompt } from '../state/params'
import { ui, useUI } from '../state/ui'
import { byId } from '../state/gallery'
import { useQueue } from '../state/queue'
import { usePix } from '../state/images'
import { generate } from '../state/actions'
import { PromptBox } from '@kit/ui/prompt-box'
import { aspectIcon } from './AspectGlyph'

const ENHANCE = ['soft volumetric light', 'fine detail', 'considered composition', 'subtle film grain']

export function Composer() {
  const v = useValues(params)
  const t = useValues(prompt)
  const { focusTick, negativeOpen, remixOf } = useUI((s) => s)
  const busy = useQueue((s) => s.jobs.length)
  const box = useRef<HTMLTextAreaElement>(null)
  const remix = byId(remixOf)
  const remixPix = usePix(remix?.id, remix?.params, 'thumb')
  const a = aspectOf(v.aspect)
  const m = modelOf(v.model)

  useEffect(() => { if (focusTick) { box.current?.focus(); const l = box.current?.value.length ?? 0; box.current?.setSelectionRange(l, l) } }, [focusTick])

  const setModel = (id: string) => {
    const next = modelOf(id)
    // follow the model's sweet spot unless the user has moved away from the old one
    const patch: Record<string, unknown> = { model: id }
    if (v.steps === m.steps || v.steps > next.maxSteps) patch.steps = next.steps
    if (v.guidance === m.guidance) patch.guidance = next.guidance
    params.patch(patch)
  }
  const enhance = () => {
    const add = ENHANCE.filter((w) => !t.prompt.toLowerCase().includes(w))
    if (add.length) prompt.setValue('prompt', `${t.prompt.trim().replace(/[,.]$/, '')}, ${add.slice(0, 2).join(', ')}`)
    box.current?.focus()
  }

  return (
    <div className="@container panel pointer-events-auto flex w-full max-w-[780px] flex-col gap-2 p-2.5">
      {remix && (
        <div className="flex items-center gap-2 rounded-cluster bg-signal-soft py-1 pr-1 pl-1">
          <span className="size-icon overflow-hidden rounded-control bg-well">{remixPix && <img src={remixPix.url} alt="" className="h-full w-full object-cover" />}</span>
          <span className="flex-1 text-ui text-fg">Remixing <span className="text-fg-muted">#{remix.id.slice(-4)} · seed {remix.params.seed} locked — edit the prompt and generate</span></span>
          <Button size="icon-sm" variant="ghost" aria-label="Stop remixing" onClick={() => ui.setState({ remixOf: null })}><X size={13} strokeWidth={1.5} /></Button>
        </div>
      )}
      <div className="px-1.5 pt-1">
        <PromptBox
          ref={box}
          value={t.prompt}
          onChange={(x) => prompt.setValue('prompt', x, { commit: false })}
          onCommit={() => prompt.commit()}
          onSubmit={generate}
          placeholder="Describe an image…"
          label="Prompt"
          minRows={2}
          maxRows={7}
          tokenLimit={77}
        />
      </div>
      {negativeOpen && (
        <div className="flex items-start gap-2 rounded-cluster bg-control px-2.5 py-2">
          <MinusCircle size={13} strokeWidth={1.5} className="mt-[3px] shrink-0 text-fg-faint" />
          <PromptBox
            className="flex-1"
            size="sm"
            value={t.negative}
            onChange={(x) => prompt.setValue('negative', x, { commit: false })}
            onCommit={() => prompt.commit()}
            onSubmit={generate}
            placeholder="Leave out — e.g. text, watermark, people, stars"
            label="Negative prompt"
            maxRows={4}
          />
        </div>
      )}
      {/* Narrow bars (1024–1280 windows): the settings summary shrinks to its icon, then hides, and Generate wraps
          onto its own line rather than overflowing the panel (break-it F6). */}
      {/* The bar's controls take the icon-button height (24px at default density) rather than the field height (22px):
          they float over the gallery, so they need a full 24px target (WCAG 2.5.8), not the spacing exception. */}
      <div className="flex flex-wrap items-center gap-1.5 [--d-control:var(--d-icon)]">
        <div className="w-[112px] @[560px]:w-[150px]"><Select value={v.model} onChange={setModel} label="Model" options={MODELS.map((x) => ({ value: x.id, label: x.name, hint: x.blurb }))} /></div>
        <Menu side="top" trigger={
          <Button size="sm" variant="default" className="gap-1 px-2" aria-label={`Aspect ratio ${a.id}`}>
            {(() => { const I = aspectIcon(a.w, a.h); return <I size={13} /> })()}
            <span className="tabular">{a.id}</span><ChevronDown size={11} className="text-fg-faint" />
          </Button>}
          items={[{ type: 'label', label: 'Aspect ratio' }, ...ASPECTS.map((x) => ({ label: `${x.id}  ·  ${x.label}`, icon: aspectIcon(x.w, x.h), checked: x.id === v.aspect, hint: `${x.w} × ${x.h}`, onClick: () => params.setValue('aspect', x.id) }))]} />
        <div className="w-[104px]"><Segmented value={String(v.batch)} onChange={(n) => params.setValue('batch', Number(n))} label="Images per run"
          options={['1', '2', '3', '4'].map((n) => ({ value: n, label: n, hint: `${n} image${n === '1' ? '' : 's'} per run` }))} /></div>
        <Tip label={negativeOpen ? 'Hide negative prompt' : 'Negative prompt'}>
          <Button size="icon" variant="ghost" active={negativeOpen || !!t.negative} aria-label="Negative prompt" onClick={() => ui.setState({ negativeOpen: !negativeOpen })}><MinusCircle size={14} strokeWidth={1.5} /></Button>
        </Tip>
        <Tip label="Enhance prompt"><Button size="icon" variant="ghost" aria-label="Enhance prompt" disabled={!t.prompt.trim()} onClick={enhance}><PencilSparkles size={14} strokeWidth={1.5} /></Button></Tip>
        <button type="button" onClick={() => ui.setState({ tab: 'create' })} aria-label={`Settings: ${v.steps} steps, CFG ${v.guidance}, seed ${v.lockSeed ? 'locked' : 'random'}`}
          className="hidden h-control min-w-0 items-center gap-1.5 rounded-control px-1.5 text-ui text-fg-muted outline-none hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-signal @[460px]:flex">
          <SlidersHorizontal size={13} strokeWidth={1.5} className="shrink-0" />
          <span className="hidden tabular truncate @[700px]:inline">{v.steps} steps · CFG {v.guidance}</span>
          {v.lockSeed ? <Lock size={11} strokeWidth={1.75} className="shrink-0" /> : <Shuffle size={11} strokeWidth={1.75} className="shrink-0" />}
        </button>
        <Button variant="primary" size="lg" onClick={generate} className={cn('ml-auto shrink-0 gap-2 pr-2')} aria-label="Generate">
          <Sparkles size={14} strokeWidth={1.75} />
          {busy ? 'Queue' : 'Generate'}
          <Kbd className="bg-signal-fg/15 text-signal-fg">{prettyCombo('mod+enter')}</Kbd>
        </Button>
      </div>
    </div>
  )
}
