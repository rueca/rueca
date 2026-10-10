/* Right panel: the selected object's properties with keyframe buttons, the
   selected keys, or — with nothing selected — the artboard and animation. */
import { Popover } from '@base-ui/react/popover'
import { ArrowLeftRight, ArrowRight, Eye, EyeOff, Lock, LockOpen, Repeat, Trash2 } from 'lucide-react'
import {
  Badge, Button, ColorField, IconButton, Inspector, Row, ScrubValue, Section, Segmented, TextInput, cn, useClockTime, type ScrubProps,
} from '@kit'
import { PROPS, PROPS_FOR, keyAt, resolve, trackKey, type Obj, type PropDef, type PropKey, type Val } from './engine'
import { KeyButton, type KeyState } from '@kit/ui/key-button'
import { EaseGlyph, EasingEditor, easeName } from '@kit/ui/easing'
import {
  animTime, clock, commitDoc, currentAnim, deleteKeys, editProp, findKey, moveKeys, params, patchObject, seek, setEase, toggleKey, ui, updateAnim, useDoc, useUI,
} from './store'

const GROUPS = ['Transform', 'Shape', 'Fill', 'Stroke'] as const

/** Number field for a property. Percent props (scale, opacity) show AND accept
    percent, so typing 150 means 150% — the kit ScrubValue's `fmt` is display-only. */
function NumField({ d, value, onChange, ...rest }: { d: PropDef; value: number; onChange: (v: number, final: boolean) => void } & Omit<ScrubProps, 'value' | 'onChange' | 'fmt' | 'unit' | 'step' | 'min' | 'max'>) {
  const pct = !!d.fmt
  const k = pct ? 100 : 1
  return <ScrubValue {...rest} value={Math.round(value * k * 100) / 100} step={d.step * k} min={d.min !== undefined ? d.min * k : undefined} max={d.max !== undefined ? d.max * k : undefined}
    unit={pct ? '%' : d.unit} fmt={pct ? (n) => `${Math.round(n)}%` : undefined} onChange={(n, f) => onChange(n / k, f)} />
}

export function AnimInspector() {
  const doc = useDoc()
  const sel = useUI((s) => s.sel)
  const keySel = useUI((s) => s.keySel)
  const mode = useUI((s) => s.mode)
  useClockTime(clock, 20)
  const obj = doc.objects.find((o) => o.id === sel)
  return (
    <div className="flex flex-col">
      {mode === 'animate' && keySel.length > 0 && <KeysSection ids={keySel} />}
      {obj ? <ObjectSections o={obj} first={!(mode === 'animate' && keySel.length > 0)} /> : <DocumentSections />}
    </div>
  )
}

function ObjectSections({ o, first }: { o: Obj; first: boolean }) {
  const doc = useDoc()
  const mode = useUI((s) => s.mode)
  const pending = useUI((s) => s.pending)
  const preview = useUI((s) => s.preview)
  const autoKey = useUI((s) => s.autoKey)
  const anim = currentAnim(doc)
  const t = animTime()
  const animate = mode === 'animate' && !preview
  const r = resolve(doc, animate ? anim : undefined, t, pending)[o.id]
  const props = PROPS_FOR[o.kind]

  const stateOf = (p: PropKey): KeyState => {
    const k = trackKey(o.id, p)
    if (pending[k] !== undefined) return 'edited'
    const keys = anim.tracks[k]
    if (keyAt(keys, Math.round(t))) return 'key'
    return keys?.length ? 'animated' : 'none'
  }
  const nav = (p: PropKey) => {
    const keys = anim.tracks[trackKey(o.id, p)] ?? []
    const prev = [...keys].reverse().find((k) => k.t < t - 0.5)
    const next = keys.find((k) => k.t > t + 0.5)
    return { onPrev: prev ? () => { clock.pause(); seek(prev.t) } : undefined, onNext: next ? () => { clock.pause(); seek(next.t) } : undefined }
  }

  const row = (p: PropKey) => {
    const d = PROPS[p]
    const st = stateOf(p)
    const v = r[p]
    const control = d.type === 'color'
      ? <ColorField value={String(v)} onChange={(c, f) => editProp(o.id, p, c, f)} />
      : <NumField d={d} value={Number(v)} boxed align="left" label={d.label} prefix={d.short}
          className={cn('flex-1', st !== 'none' && animate && 'text-signal', st === 'edited' && 'text-key')}
          onChange={(n, f) => editProp(o.id, p, n, f)} />
    return (
      <Row key={p} label={d.label} className={cn('group/row', st === 'edited' && animate && 'bg-key/10')}
        trailing={animate ? <KeyButton state={st} shortcut="k" property={d.label} onToggle={() => toggleKey(o.id, p)} {...nav(p)} className="[&>button]:w-6" /> : undefined}>
        {control}
      </Row>
    )
  }

  return (
    <>
      <Section title="Layer" first={first} actions={
        <div className="flex items-center">
          <Badge>{o.kind === 'group' ? 'Group' : o.kind === 'rect' ? 'Rectangle' : o.kind === 'ellipse' ? 'Ellipse' : o.kind === 'path' ? 'Vector' : o.kind === 'image' ? 'Image' : 'Text'}</Badge>
          <IconButton size="icon-sm" icon={o.visible ? Eye : EyeOff} label={o.visible ? 'Hide' : 'Show'} onClick={() => patchObject(o.id, { visible: !o.visible })} />
          <IconButton size="icon-sm" icon={o.locked ? Lock : LockOpen} label={o.locked ? 'Unlock' : 'Lock'} onClick={() => patchObject(o.id, { locked: !o.locked })} />
        </div>
      }>
        <Row label="Name"><TextInput value={o.name} label="Name" onChange={(s) => patchObject(o.id, { name: s }, false)} onCommit={() => commitDoc('Rename')} /></Row>
        {o.kind === 'text' && (
          <>
            <Row label="Text" hint="Static. Use {turns} to bind a state-machine number input."><TextInput value={o.text ?? ''} label="Text" mono onChange={(s) => patchObject(o.id, { text: s }, false)} onCommit={() => commitDoc('Edit text')} /></Row>
            <Row label="Font size"><ScrubValue boxed align="left" value={o.fontSize ?? 16} min={6} max={200} step={1} unit="px" className="flex-1" onChange={(n, f) => patchObject(o.id, { fontSize: n }, f)} /></Row>
          </>
        )}
      </Section>
      {GROUPS.map((g) => {
        const ps = props.filter((p) => PROPS[p].group === g)
        if (!ps.length) return null
        return <Section key={g} title={g}>{ps.map(row)}</Section>
      })}
      {animate && (
        <div className="border-t border-line px-3 py-2.5 text-[11px] leading-relaxed text-fg-faint">
          {autoKey
            ? 'Auto-key is on: every change writes a key at the playhead.'
            : 'Changes to animated properties turn amber until you key them (K). Unanimated properties change the base value.'}
        </div>
      )}
    </>
  )
}

function KeysSection({ ids }: { ids: string[] }) {
  useDoc()
  const found = ids.map(findKey).filter((x): x is NonNullable<ReturnType<typeof findKey>> => !!x)
  if (!found.length) return null
  const t0 = Math.min(...found.map((f) => f.key.t))
  const eases = [...new Set(found.map((f) => JSON.stringify(f.key.ease)))]
  const ease = found[0].key.ease
  const one = found.length === 1 ? found[0] : null
  const span = one?.next ? one.next.t - one.key.t : 500
  const a = currentAnim()
  return (
    <Section title={found.length === 1 ? 'Keyframe' : `${found.length} keyframes`} first actions={
      <IconButton size="icon-sm" icon={Trash2} label="Delete keyframes" shortcut="backspace" onClick={() => deleteKeys(ids)} />
    }>
      <Row label="Time" hint="Moves every selected key together. Alt+← / → nudges by a frame.">
        <ScrubValue boxed align="left" value={Math.round(t0)} min={0} max={a.duration} step={1} unit="ms" className="flex-1" label="Time"
          onChange={(n, f) => {
            const d = n - t0
            const next: Record<string, number> = {}
            found.forEach((x) => (next[x.key.id] = Math.max(0, Math.min(a.duration, x.key.t + d))))
            moveKeys(next, f)
          }} />
      </Row>
      {one && typeof one.key.v === 'number' && (
        <Row label="Value"><NumField d={PROPS[one.track.split('.').pop() as PropKey]} value={one.key.v} boxed align="left" className="flex-1" label="Value"
          onChange={(n, f) => setKeyValue(one.key.id, n, f)} /></Row>
      )}
      {one && typeof one.key.v === 'string' && (
        <Row label="Value"><ColorField value={one.key.v} onChange={(c, f) => setKeyValue(one.key.id, c, f)} /></Row>
      )}
      <Row label="Easing" hint="The easing of the segment that starts at this key.">
        <Popover.Root>
          <Popover.Trigger className="flex h-6 w-full min-w-0 items-center gap-2 rounded-[5px] bg-control px-1.5 text-left outline-none hover:shadow-[inset_0_0_0_1px_var(--line-strong)] focus-visible:ring-2 focus-visible:ring-signal data-[popup-open]:shadow-[inset_0_0_0_1px_var(--signal)]">
            <EaseGlyph ease={ease} className="size-4 text-signal" />
            <span className="truncate text-[11px] text-fg">{eases.length > 1 ? 'Mixed' : easeName(ease)}</span>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner side="left" align="start" sideOffset={12} collisionPadding={12} className="z-[100]">
              <Popover.Popup className="pop outline-none">
                <EasingEditor value={ease} span={span} onChange={(e, f) => setEase(ids, e, f)}
                  footer={found.length > 1 ? `Applies to ${found.length} keys` : one?.next ? `${(one.key.t / 1000).toFixed(2)}s → ${(one.next.t / 1000).toFixed(2)}s` : 'Last key — easing has no effect'} />
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </Row>
    </Section>
  )
}

function setKeyValue(id: string, v: Val, final: boolean) {
  const f = findKey(id)
  if (!f) return
  const a = currentAnim()
  updateAnim({ tracks: { ...a.tracks, [f.track]: a.tracks[f.track].map((k) => (k.id === id ? { ...k, v } : k)) } }, final)
}

function DocumentSections() {
  const doc = useDoc()
  const anim = currentAnim(doc)
  const mode = useUI((s) => s.mode)
  return (
    <>
      <Section title={`Animation · ${anim.name}`} first={!(mode === 'animate' && ui.getState().keySel.length)}>
        <Row label="Name"><TextInput value={anim.name} label="Animation name" onChange={(s) => updateAnim({ name: s }, false)} onCommit={() => commitDoc('Rename')} /></Row>
        <Row label="Duration" hint="Drag the end marker on the ruler, or type a length.">
          <ScrubValue boxed align="left" value={anim.duration} min={100} max={20000} step={10} unit="ms" className="flex-1" label="Duration"
            onChange={(n, f) => updateAnim({ duration: n }, f)} />
        </Row>
        <Row label="Playback" hint="Loop, play once, or ping-pong (forward then back).">
          <Segmented value={anim.loop} label="Loop mode" onChange={(l) => updateAnim({ loop: l as typeof anim.loop })}
            options={[{ value: 'loop', label: 'Loop', icon: Repeat }, { value: 'once', label: 'Once', icon: ArrowRight }, { value: 'pingpong', label: 'Ping-pong', icon: ArrowLeftRight }]} />
        </Row>
        <div className="flex gap-1.5 px-3 pt-1">
          <Button size="sm" variant="default" className="flex-1" onClick={() => ui.setState({ sel: 'wheel' })}>Select wheel</Button>
          <Button size="sm" variant="default" className="flex-1" onClick={() => ui.setState({ mode: mode === 'design' ? 'animate' : 'design' })}>{mode === 'design' ? 'Animate mode' : 'Design mode'}</Button>
        </div>
      </Section>
      <div className="border-t border-line">
        <Inspector params={params} folders={['artboard', 'playback']} />
      </div>
    </>
  )
}
