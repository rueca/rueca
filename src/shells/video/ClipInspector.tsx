/* Right panel: the selected clip (content, style, layout, animation) or,
   with nothing selected, the composition settings from the schema. */
import { Popover } from '@base-ui/react/popover'
import {
  AlignCenter, AlignHorizontalJustifyCenter, AlignLeft, AlignRight, AlignVerticalJustifyCenter, Circle, CircleDashed, Copy, Image as ImageIcon,
  Scissors, Settings2, Shapes, Square, Trash2, Type,
} from 'lucide-react'
import {
  AngleDial, Badge, Button, ColorField, CurveEditor, CurveGlyph, IconButton, Inspector, Row, ScrubValue, SeedField, Section, Segmented, Select, Slider,
  Switch, TextInput, cn, toast, type ScrubProps,
} from '@kit'
import { ASPECTS, EASE, PRESETS, type Aspect, type Clip, type FontKey, type ImageGen, type Motion } from './comp'
import { WIRE, ditherTop, wireImage } from '@/demo/wire'
import { FONTS, IMAGE_LABEL, proceduralImage } from './render'
import { addClip, commitComp, deleteClips, duplicateClips, getComp, history, params, rebaseDesign, splitAt, ui, updateClip, useComp, useUI } from './store'

const sec = (v: number) => `${(v / 1000).toFixed(2)}s`
/** A ScrubValue that shows and accepts percent: typing 50 means 50%, not 50×.
    (The kit ScrubValue has `fmt` for display but no inverse for typed input.) */
function Pct({ value, onChange, min = 0, max = 1, step = 0.01, ...rest }: Omit<ScrubProps, 'fmt' | 'unit'>) {
  return <ScrubValue {...rest} value={Math.round(value * 10000) / 100} min={min * 100} max={max * 100} step={step * 100} unit="%" onChange={(v, f) => onChange(v / 100, f)} />
}

export const KIND_LABEL: Record<Clip['kind'], string> = { text: 'Text', shape: 'Shape', image: 'Image', bg: 'Background', progress: 'Progress bar' }

export function ClipInspector() {
  const comp = useComp()
  const sel = useUI((s) => s.sel)
  const clips = comp.clips.filter((c) => sel.includes(c.id))
  if (clips.length > 1) return <MultiSection ids={clips.map((c) => c.id)} />
  if (clips.length === 1) return <ClipSections c={clips[0]} />
  const aspect = params.values().aspect as Aspect
  const design = comp.design ?? '9:16'
  return (
    <div className="flex flex-col">
      <Inspector params={params} folders={['composition', 'view']} />
      <Section title="Re-layout" hint="Positions are relative to the frame; sizes are exact in the design frame and scale to fit the others.">
        <Row label="Design frame"><span className="flex-1 tabular text-[11.5px] text-fg">{design} · {ASPECTS[design].w} × {ASPECTS[design].h}</span></Row>
        {design !== aspect ? (
          <div className="flex flex-col gap-1.5 px-3 pt-1">
            <p className="text-[11px] leading-relaxed text-fg-muted">You are viewing {aspect}. Sizes are scaled from {design} so nothing collides.</p>
            <Button size="sm" variant="default" onClick={() => { rebaseDesign(aspect); toast(`${aspect} is now the design frame`, { action: { label: 'Undo', onClick: () => history.undo() } }) }}>Design for {aspect} from here</Button>
          </div>
        ) : <p className="px-3 pt-0.5 text-[11px] leading-relaxed text-fg-faint">Switch aspect in the toolbar (1–4) to see the re-layout.</p>}
      </Section>
      <Section title="Add clip">
        <div className="grid grid-cols-2 gap-1.5 px-3 pb-1">
          {([['text', Type, 'Text'], ['shape', Shapes, 'Shape'], ['image', ImageIcon, 'Image'], ['progress', CircleDashed, 'Progress']] as const).map(([k, Icon, l]) => (
            <Button key={k} size="md" variant="default" onClick={() => addClip(k)}><Icon size={14} strokeWidth={1.5} />{l}</Button>
          ))}
        </div>
        <p className="px-3 pt-1 text-[11px] leading-relaxed text-fg-faint">Clips land at the playhead on the first free track. ⇧T adds text.</p>
      </Section>
    </div>
  )
}

function MultiSection({ ids }: { ids: string[] }) {
  return (
    <Section title={`${ids.length} clips`} first actions={<IconButton size="icon-sm" icon={Trash2} label="Delete" shortcut="backspace" onClick={() => deleteClips(ids)} />}>
      <div className="flex flex-col gap-1.5 px-3 pb-1">
        <Button size="md" variant="default" onClick={() => duplicateClips(ids)}><Copy size={14} strokeWidth={1.5} />Duplicate</Button>
        <Button size="md" variant="default" onClick={() => splitAt(ids)}><Scissors size={14} strokeWidth={1.5} />Split at playhead</Button>
      </div>
    </Section>
  )
}

function MotionRows({ c, which }: { c: Clip; which: 'enter' | 'exit' }) {
  const m = c[which]
  const set = (patch: Partial<Motion>, f = true) => updateClip(c.id, { [which]: { ...m, ...patch } } as Partial<Clip>, f)
  const presets = PRESETS.filter((p) => !p.text || c.kind === 'text')
  return (
    <>
      <Row label={which === 'enter' ? 'In' : 'Out'} hint={which === 'enter' ? 'Entrance animation at the start of the clip.' : 'Exit animation at the end of the clip.'}>
        <Select value={m.preset} label={`${which === 'enter' ? 'Entrance' : 'Exit'} preset`} onChange={(p) => set({ preset: p as Motion['preset'], dur: m.dur || 400 })}
          options={presets.map((p) => ({ value: p.value, label: p.label }))} />
      </Row>
      {m.preset !== 'none' && (
        <Row label="" className="-mt-0.5">
          <span className="w-[84px] shrink-0" />
          <ScrubValue boxed align="left" value={m.dur} min={0} max={Math.max(100, c.dur)} step={10} fmt={sec} className="w-[64px]" label="Duration" onChange={(v, f) => set({ dur: v }, f)} />
          <Popover.Root>
            <Popover.Trigger aria-label="Easing" className="flex h-6 min-w-0 flex-1 items-center gap-1.5 rounded-[5px] bg-control px-1.5 text-left outline-none hover:shadow-[inset_0_0_0_1px_var(--line-strong)] focus-visible:ring-2 focus-visible:ring-signal data-[popup-open]:shadow-[inset_0_0_0_1px_var(--signal)]">
              <CurveGlyph value={m.ease} className="text-signal" />
              <span className="truncate text-[11px] text-fg">{Object.entries(EASE).find(([, v]) => v.join() === m.ease.join())?.[0] ?? 'Custom'}</span>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner side="left" align="start" sideOffset={12} collisionPadding={12} className="z-[100]">
                <Popover.Popup className="pop w-[260px] p-3 outline-none">
                  <CurveEditor value={m.ease} presets={EASE} onChange={(e, f) => set({ ease: e }, f)} />
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        </Row>
      )}
    </>
  )
}

function ClipSections({ c }: { c: Clip }) {
  const comp = getComp()
  const duration = params.values().duration
  const set = (patch: Partial<Clip>, f = true) => updateClip(c.id, patch, f)
  const locked = comp.tracks.find((t) => t.id === c.track)?.locked
  const positioned = c.kind === 'text' || c.kind === 'shape' || (c.kind === 'image' && !c.frame)
  return (
    <div className={cn('flex flex-col', locked && 'opacity-60')}>
      <Section title="Clip" first actions={
        <div className="flex items-center">
          <Badge>{KIND_LABEL[c.kind]}</Badge>
          <IconButton size="icon-sm" icon={Copy} label="Duplicate" shortcut="mod+d" onClick={() => duplicateClips([c.id])} />
          <IconButton size="icon-sm" icon={Trash2} label="Delete" shortcut="backspace" onClick={() => deleteClips([c.id])} />
        </div>
      }>
        {locked && <p className="px-3 pb-1 text-[11px] text-key">This track is locked. Unlock it in the timeline to edit.</p>}
        <Row label="Name"><TextInput value={c.name} label="Clip name" onChange={(s) => set({ name: s }, false)} onCommit={() => commitComp('Rename clip')} /></Row>
        <Row label="Start" hint="Where the clip begins.">
          <ScrubValue boxed align="left" value={c.start} min={0} max={duration - 100} step={10} fmt={sec} className="flex-1" label="Start" onChange={(v, f) => set({ start: Math.min(v, duration - c.dur) }, f)} />
          <ScrubValue boxed align="left" prefix="↔" value={c.dur} min={100} max={duration - c.start} step={10} fmt={sec} className="flex-1" label="Duration" onChange={(v, f) => set({ dur: v }, f)} />
        </Row>
        <Row label="Track">
          <Select value={c.track} label="Track" onChange={(t) => set({ track: t })} options={comp.tracks.filter((t) => !t.locked || t.id === c.track).map((t) => ({ value: t.id, label: t.name }))} />
        </Row>
      </Section>

      {c.kind === 'text' && (
        <Section title="Text">
          <Row label="" stacked><TextInput multiline rows={2} value={c.text ?? ''} label="Text content" onChange={(s) => set({ text: s }, false)} onCommit={() => commitComp('Edit text')} /></Row>
          <Row label="Font">
            <Select value={c.font ?? 'sans'} label="Font" onChange={(f) => set({ font: f as FontKey, weight: f === 'display' ? 800 : c.weight })} options={(Object.keys(FONTS) as FontKey[]).map((k) => ({ value: k, label: FONTS[k].label }))} />
          </Row>
          <Row label="Weight">
            <Select value={String(c.weight ?? 600)} label="Weight" onChange={(w) => set({ weight: Number(w) })}
              options={[['400', 'Regular'], ['500', 'Medium'], ['600', 'Semibold'], ['700', 'Bold'], ['800', 'Extra bold'], ['900', 'Black']].map(([value, label]) => ({ value, label }))} />
          </Row>
          <Row label="Size" hint="Pixels at 1080 on the short side; scales with the frame.">
            <Slider value={c.size ?? 80} min={16} max={260} step={1} label="Size" onChange={(v, f) => set({ size: v }, f)} />
            <ScrubValue value={c.size ?? 80} min={8} max={400} step={1} unit="px" className="w-[52px] shrink-0" label="Size" onChange={(v, f) => set({ size: v }, f)} />
          </Row>
          <Row label="Colour"><ColorField value={c.color ?? '#ffffff'} onChange={(v, f) => set({ color: v }, f)} /></Row>
          <Row label="Align">
            <Segmented value={c.align ?? 'center'} label="Align" iconOnly onChange={(a) => set({ align: a as Clip['align'] })}
              options={[{ value: 'left', label: 'Left', icon: AlignLeft }, { value: 'center', label: 'Centre', icon: AlignCenter }, { value: 'right', label: 'Right', icon: AlignRight }]} />
          </Row>
          <Row label="Spacing" hint="Letter spacing (em) and line height.">
            <Pct boxed align="left" prefix="A" value={c.tracking ?? 0} min={-0.1} max={0.4} step={0.005} className="flex-1" label="Letter spacing" onChange={(v, f) => set({ tracking: v }, f)} />
            <ScrubValue boxed align="left" prefix="↕" value={c.lineHeight ?? 1.1} min={0.7} max={2} step={0.01} className="flex-1" label="Line height" onChange={(v, f) => set({ lineHeight: v }, f)} />
          </Row>
          <Row label="Max width" hint="Text wraps beyond this share of the frame width.">
            <Slider value={c.maxWidth ?? 0.9} min={0.2} max={1} step={0.01} label="Max width" onChange={(v, f) => set({ maxWidth: v }, f)} />
            <Pct label="Max width" value={c.maxWidth ?? 0.9} min={0.2} max={1} step={0.01} className="w-[52px] shrink-0" onChange={(v, f) => set({ maxWidth: v }, f)} />
          </Row>
          <Row label="Highlight" hint="A rounded marker behind each line (caption style).">
            <div className="flex w-full items-center gap-1.5">
              <Switch checked={!!c.highlight} label="Highlight" onChange={(b) => set({ highlight: b ? WIRE.sheet : null })} />
              {c.highlight && <ColorField value={c.highlight} onChange={(v, f) => set({ highlight: v }, f)} />}
            </div>
          </Row>
        </Section>
      )}

      {c.kind === 'shape' && (
        <Section title="Shape">
          <Row label="Type">
            <Segmented value={c.shape ?? 'rect'} label="Shape" iconOnly onChange={(s) => set({ shape: s as Clip['shape'] })}
              options={[{ value: 'rect', label: 'Rectangle', icon: Square }, { value: 'circle', label: 'Circle', icon: Circle }, { value: 'ring', label: 'Ring', icon: CircleDashed }, { value: 'blob', label: 'Blob', icon: Shapes }]} />
          </Row>
          <Row label="Fill"><ColorField value={c.fill ?? '#ffffff'} onChange={(v, f) => set({ fill: v }, f)} /></Row>
          {c.shape === 'rect' && <Row label="Radius" hint="Corner radius as a share of the short side; 100% makes a pill.">
            <Slider value={Math.min(c.radius ?? 0, 0.5)} min={0} max={0.5} step={0.005} label="Radius" onChange={(v, f) => set({ radius: v >= 0.5 ? 1 : v }, f)} />
            <Pct label="Radius" value={c.radius ?? 0} min={0} max={1} step={0.005} className="w-[52px] shrink-0" onChange={(v, f) => set({ radius: v }, f)} />
          </Row>}
          {c.shape === 'ring' && <Row label="Stroke">
            <Slider value={c.stroke ?? 0.02} min={0.002} max={0.1} step={0.001} label="Stroke" onChange={(v, f) => set({ stroke: v }, f)} />
            <Pct label="Stroke" value={c.stroke ?? 0.02} min={0.001} max={0.2} step={0.001} className="w-[52px] shrink-0" onChange={(v, f) => set({ stroke: v }, f)} />
          </Row>}
        </Section>
      )}

      {c.kind === 'image' && (
        <Section title="Image">
          <div className="grid grid-cols-4 gap-1.5 px-3 pb-1.5">
            {(['aurora', 'sunset', 'mesh', 'app'] as ImageGen[]).map((g) => (
              <button key={g} type="button" aria-pressed={c.image === g} onClick={() => set({ image: g })}
                className={cn('flex flex-col items-center gap-1 rounded-[7px] p-1 text-[10.5px] outline-none focus-visible:ring-2 focus-visible:ring-signal', c.image === g ? 'bg-signal-soft text-signal' : 'text-fg-muted hover:bg-hover hover:text-fg')}>
                <Thumb gen={g} seed={c.seed ?? 1} />
                {IMAGE_LABEL[g]}
              </button>
            ))}
          </div>
          <Row label="Seed" hint="Generates a new variation of the procedural image."><SeedField value={c.seed ?? 1} onChange={(v, f) => set({ seed: v }, f)} /></Row>
          <Row label="Fill frame" hint="Cover the whole frame at any aspect, behind everything on higher tracks.">
            <div className="flex flex-1 justify-end"><Switch checked={!!c.frame} label="Fill frame" onChange={(b) => set({ frame: b })} /></div>
          </Row>
          <Row label="Ken Burns" hint="Slow zoom across the clip’s duration.">
            <Slider value={c.kenBurns ?? 0} min={0} max={0.4} step={0.01} label="Ken Burns" onChange={(v, f) => set({ kenBurns: v }, f)} />
            <Pct label="Ken Burns" value={c.kenBurns ?? 0} min={0} max={1} step={0.01} className="w-[52px] shrink-0" onChange={(v, f) => set({ kenBurns: v }, f)} />
          </Row>
          {!c.frame && <Row label="Radius">
            <Slider value={c.radius ?? 0} min={0} max={0.2} step={0.002} label="Radius" onChange={(v, f) => set({ radius: v }, f)} />
            <Pct label="Radius" value={c.radius ?? 0} min={0} max={0.5} step={0.002} className="w-[52px] shrink-0" onChange={(v, f) => set({ radius: v }, f)} />
          </Row>}
        </Section>
      )}

      {c.kind === 'bg' && (
        <Section title="Background">
          <Row label="From"><ColorField value={c.from ?? '#000000'} alpha={false} onChange={(v, f) => set({ from: v }, f)} /></Row>
          <Row label="To"><ColorField value={c.to ?? '#222222'} alpha={false} onChange={(v, f) => set({ to: v }, f)} /></Row>
          <Row label="Angle"><AngleDial value={c.angle ?? 180} onChange={(v, f) => set({ angle: v }, f)} /></Row>
        </Section>
      )}

      {c.kind === 'progress' && (
        <Section title="Progress bar">
          <Row label="Bar"><ColorField value={c.fill ?? '#ffffff'} onChange={(v, f) => set({ fill: v }, f)} /></Row>
          <Row label="Track"><ColorField value={c.trackColor ?? '#ffffff33'} onChange={(v, f) => set({ trackColor: v }, f)} /></Row>
          <Row label="Thickness">
            <Slider value={c.thickness ?? 8} min={2} max={30} step={1} label="Thickness" onChange={(v, f) => set({ thickness: v }, f)} />
            <ScrubValue value={c.thickness ?? 8} min={1} max={60} step={1} unit="px" className="w-[52px] shrink-0" onChange={(v, f) => set({ thickness: v }, f)} />
          </Row>
          <Row label="Edge"><Segmented value={c.edge ?? 'top'} label="Edge" onChange={(e) => set({ edge: e as Clip['edge'] })} options={[{ value: 'top', label: 'Top' }, { value: 'bottom', label: 'Bottom' }]} /></Row>
        </Section>
      )}

      {(positioned || c.kind === 'image') && (
        <Section title="Layout">
          {positioned && (
            <Row label="Position" hint="Centre of the clip as a share of the frame. Drag on the canvas, or arrow keys.">
              <Pct boxed align="left" prefix="X" value={c.x} min={-0.5} max={1.5} step={0.001} className="flex-1" label="X" onChange={(v, f) => set({ x: v }, f)} />
              <Pct boxed align="left" prefix="Y" value={c.y} min={-0.5} max={1.5} step={0.001} className="flex-1" label="Y" onChange={(v, f) => set({ y: v }, f)} />
            </Row>
          )}
          {(c.kind === 'shape' || (c.kind === 'image' && !c.frame)) && (
            <Row label="Size" hint="Width and height in units of the frame’s short side; shrinks to fit narrower frames.">
              <Pct boxed align="left" prefix="W" value={c.w} min={0.01} max={3} step={0.005} className="flex-1" label="Width" onChange={(v, f) => set({ w: v }, f)} />
              <Pct boxed align="left" prefix="H" value={c.h} min={0.01} max={3} step={0.005} className="flex-1" label="Height" onChange={(v, f) => set({ h: v }, f)} />
            </Row>
          )}
          {positioned && (
            <Row label="Rotation"><ScrubValue boxed align="left" value={c.rotation} min={-180} max={180} step={1} unit="°" className="flex-1" label="Rotation" onChange={(v, f) => set({ rotation: v }, f)} />
              <IconButton size="icon-sm" icon={AlignHorizontalJustifyCenter} label="Centre horizontally" onClick={() => set({ x: 0.5 })} />
              <IconButton size="icon-sm" icon={AlignVerticalJustifyCenter} label="Centre vertically" onClick={() => set({ y: 0.5 })} />
            </Row>
          )}
          <Row label="Opacity">
            <Slider value={c.opacity} min={0} max={1} step={0.01} label="Opacity" onChange={(v, f) => set({ opacity: v }, f)} />
            <Pct label="Opacity" value={c.opacity} min={0} max={1} step={0.01} className="w-[52px] shrink-0" onChange={(v, f) => set({ opacity: v }, f)} />
          </Row>
        </Section>
      )}

      {c.kind !== 'bg' && (
        <Section title="Animation">
          <MotionRows c={c} which="enter" />
          <MotionRows c={c} which="exit" />
        </Section>
      )}
      <div className="flex gap-1.5 border-t border-line px-3 py-2.5">
        <Button size="sm" variant="default" className="flex-1" onClick={() => splitAt([c.id])}><Scissors size={13} strokeWidth={1.5} />Split</Button>
        <Button size="sm" variant="default" className="flex-1" onClick={() => ui.setState({ sel: [] })}><Settings2 size={13} strokeWidth={1.5} />Composition</Button>
      </div>
    </div>
  )
}

const thumbCache = new Map<string, string>()
export function thumbURL(gen: ImageGen, seed: number) {
  const k = `${gen}:${seed}`
  let u = thumbCache.get(k)
  if (!u && gen !== 'app') {
    // the wire painters hand back data URLs already — one dither cell per pixel, scaled down by the browser
    const at = 0.44 + (((seed * 37) % 13) / 100)
    u = gen === 'mesh' ? wireImage(192, 192, 'image') : ditherTop(260, 260, { at, size: 0.72, night: gen === 'sunset' })
    thumbCache.set(k, u)
  }
  if (!u) {
    const src = proceduralImage(gen, seed, gen === 'app' ? 384 : 512, gen === 'app' ? 640 : 512)
    const c = document.createElement('canvas')
    c.width = 96; c.height = 96
    const g = c.getContext('2d')!
    const s = Math.max(96 / src.width, 96 / src.height)
    g.drawImage(src, (96 - src.width * s) / 2, (96 - src.height * s) / 2, src.width * s, src.height * s)
    u = c.toDataURL('image/jpeg', 0.8)
    thumbCache.set(k, u)
  }
  return u
}
function Thumb({ gen, seed }: { gen: ImageGen; seed: number }) {
  return <img src={thumbURL(gen, seed)} alt="" className="aspect-square w-full rounded-[5px] object-cover shadow-[inset_0_0_0_1px_var(--line)]" />
}
