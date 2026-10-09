/* ---------------------------------------------------------------------------
   PaintField (kit candidate) — one row of a Fill/Stroke stack: a swatch +
   value chip that opens a popover with paint TYPE tabs (Solid · Linear ·
   Radial · Image), the matching editor, and opacity as its own scrub field
   beside the chip (Figma keeps opacity out of the colour picker).

     <PaintField value={paint} onChange={(p, final) => …} images={{ key: url }} />

   The kit's ColorField covers solid colour only; this adds paint kinds.
--------------------------------------------------------------------------- */
import { Popover } from '@base-ui/react/popover'
import { ColorPanel, GradientEditor, ImageDrop, ScrubValue, Segmented, Select, formatColor, cn } from '@kit'

export interface PaintValue {
  kind: 'solid' | 'linear' | 'radial' | 'image'
  color: string
  opacity: number
  angle?: number
  stops?: { pos: number; color: string }[]
  image?: string
  fit?: 'fill' | 'fit' | 'tile'
}

export function paintPreview(p: PaintValue, imageURL: (k?: string) => string) {
  if (p.kind === 'solid') return p.color
  if (p.kind === 'image') return `center / cover no-repeat url("${imageURL(p.image)}")`
  const stops = [...(p.stops ?? [])].sort((a, b) => a.pos - b.pos).map((s) => `${s.color} ${s.pos * 100}%`).join(', ')
  return p.kind === 'linear' ? `linear-gradient(${p.angle ?? 180}deg, ${stops})` : `radial-gradient(${stops})`
}

export function PaintField<T extends PaintValue>({
  value, onChange, images, imageURL, opacity = true,
}: {
  value: T
  onChange: (p: T, final: boolean) => void
  /** image fills to offer: key → label */
  images?: Record<string, string>
  imageURL: (k?: string) => string
  opacity?: boolean
}) {
  const set = (patch: Partial<PaintValue>, final: boolean) => onChange({ ...value, ...patch }, final)
  const setKind = (kind: PaintValue['kind']) => {
    if (kind === value.kind) return
    if (kind === 'solid') set({ kind, color: value.stops?.[0]?.color.slice(0, 7) ?? value.color }, true)
    else if (kind === 'image') set({ kind, image: value.image ?? Object.keys(images ?? {})[0], fit: value.fit ?? 'fill' }, true)
    else set({ kind, stops: value.stops ?? [{ pos: 0, color: value.color }, { pos: 1, color: `${value.color.slice(0, 7)}00` }], angle: value.angle ?? 180 }, true)
  }
  const label = value.kind === 'solid' ? formatColor(value.color, 'hex') : value.kind === 'image' ? (images?.[value.image ?? ''] ?? 'Image') : value.kind === 'linear' ? 'Linear' : 'Radial'
  return (
    <div className="flex min-w-0 flex-1 items-center gap-1">
      <Popover.Root>
        <Popover.Trigger
          className={cn('flex h-6 min-w-0 flex-1 items-center gap-2 rounded-[5px] bg-control pr-2 pl-1 text-left outline-none',
            'hover:shadow-[inset_0_0_0_1px_var(--line-strong)] focus-visible:ring-2 focus-visible:ring-signal data-[popup-open]:shadow-[inset_0_0_0_1px_var(--signal)]')}>
          <span className="checker relative size-4 shrink-0 overflow-hidden rounded-[4px] shadow-[inset_0_0_0_1px_var(--line-strong)]">
            <span className="absolute inset-0" style={{ background: paintPreview(value, imageURL), opacity: value.opacity }} />
          </span>
          <span className={cn('min-w-0 flex-1 truncate text-[11px]', value.kind === 'solid' ? 'tabular uppercase text-fg' : 'text-fg')}>{label}</span>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner side="left" align="start" sideOffset={12} collisionPadding={12} className="z-[100]">
            <Popover.Popup className="pop w-[264px] origin-[var(--transform-origin)] outline-none transition-[opacity,transform] duration-100 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
              <div className="border-b border-line p-2">
                <Segmented size="sm" value={value.kind} onChange={(k) => setKind(k as PaintValue['kind'])}
                  options={[{ value: 'solid', label: 'Solid' }, { value: 'linear', label: 'Linear' }, { value: 'radial', label: 'Radial' }, { value: 'image', label: 'Image' }]} />
              </div>
              {value.kind === 'solid' && <ColorPanel value={value.color} alpha={false} onChange={(c, f) => set({ color: c.slice(0, 7) }, f)} />}
              {(value.kind === 'linear' || value.kind === 'radial') && (
                <div className="p-3"><GradientEditor value={{ angle: value.angle ?? 180, stops: value.stops ?? [] }} onChange={(g, f) => set({ angle: g.angle, stops: g.stops }, f)} /></div>
              )}
              {value.kind === 'image' && (
                <div className="flex flex-col gap-2 p-3">
                  <div className="grid grid-cols-3 gap-1.5">
                    {Object.entries(images ?? {}).map(([k, l]) => (
                      <button key={k} type="button" aria-label={l} title={l} onClick={() => set({ image: k }, true)}
                        className={cn('aspect-square rounded-[6px] bg-cover bg-center outline-none focus-visible:ring-2 focus-visible:ring-signal', value.image === k ? 'shadow-[0_0_0_2px_var(--signal)]' : 'shadow-[inset_0_0_0_1px_var(--line)]')}
                        style={{ backgroundImage: `url("${imageURL(k)}")` }} />
                    ))}
                  </div>
                  <ImageDrop compact value={value.image?.startsWith('data:') ? value.image : null} onChange={(d) => d && set({ image: d }, true)} />
                  <Select value={value.fit ?? 'fill'} onChange={(f) => set({ fit: f as PaintValue['fit'] }, true)} label="Image fit"
                    options={[{ value: 'fill', label: 'Fill' }, { value: 'fit', label: 'Fit' }, { value: 'tile', label: 'Tile' }]} />
                </div>
              )}
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
      {opacity && (
        <ScrubValue boxed value={Math.round(value.opacity * 100)} min={0} max={100} step={1} unit="%" label="Opacity"
          onChange={(v, f) => set({ opacity: v / 100 }, f)} className="w-[50px] shrink-0" />
      )}
    </div>
  )
}
