/* Minimal, light thumbnails for the Kit cards. Abstract mini UI, not
   screenshots: grey shapes on a faint tile, one accent only where something
   is "on" (the site's accent — brand pink), almost no text. Each has one small hover motion (the card is the
   `group`), off under reduced motion. Kit tokens only, so both themes work. */
import type { ReactNode } from 'react'
import { Eye, Link2, Redo2, Undo2 } from 'lucide-react'
import { cn } from '@kit'

const T = 'transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none'
const bar = 'rounded-full bg-fg/10'

function Tile({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div aria-hidden className={cn('relative flex aspect-[16/9] items-center justify-center overflow-hidden rounded-[10px] bg-fg/[0.035] shadow-[inset_0_0_0_1px_var(--line)]', className)}>
      {children}
    </div>
  )
}

/** a small floating card inside a tile */
const card = 'rounded-[8px] bg-panel shadow-[0_1px_2px_rgb(0_0_0/0.06),0_6px_16px_-8px_rgb(0_0_0/0.18)]'

function Controls() {
  return (
    <Tile>
      <div className={cn(card, 'flex w-[62%] flex-col gap-2.5 p-3')}>
        <div className="flex items-center gap-2.5">
          <span className={cn(bar, 'h-1.5 w-8')} />
          <div className="relative h-1 flex-1 rounded-full bg-track">
            <span className={cn('absolute inset-y-0 left-0 w-[45%] rounded-full bg-signal group-hover:w-[72%]', T)} />
            <span className={cn('absolute top-1/2 left-[45%] size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-panel shadow-[0_0_0_1px_var(--line-strong)] group-hover:left-[72%]', T)} />
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span className={cn(bar, 'h-1.5 w-8')} />
          <span className="flex h-4 flex-1 items-center justify-end rounded-[4px] bg-control px-1.5"><span className={cn(bar, 'h-1 w-5 bg-fg/25')} /></span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className={cn(bar, 'h-1.5 w-8')} />
          <span className="ml-auto flex h-3 w-5 items-center rounded-full bg-signal p-px"><span className="ml-auto size-2.5 rounded-full bg-white" /></span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className={cn(bar, 'h-1.5 w-8')} />
          <div className="ml-auto flex gap-1">{[0.22, 0.4, 0.6, 0.8].map((o) => <span key={o} className="size-3 rounded-[3px] bg-fg" style={{ opacity: o }} />)}</div>
        </div>
      </div>
    </Tile>
  )
}

function Layout() {
  return (
    <Tile>
      <div className="relative h-[74%] w-[78%]">
        <span className={cn(card, 'absolute inset-x-0 top-0 h-[13%]')} />
        <span className={cn(card, 'absolute top-[19%] bottom-0 left-0 w-[20%] group-hover:-translate-x-1', T)} />
        <span className={cn(card, 'absolute top-[19%] right-0 bottom-0 w-[24%] group-hover:translate-x-1', T)} />
        <span className="absolute top-[30%] left-[29%] h-[58%] w-[38%] rounded-[4px] bg-fg/[0.07] shadow-[inset_0_0_0_1px_var(--line)]" />
        <span className={cn(card, 'absolute bottom-[5%] left-[36%] h-[11%] w-[24%] rounded-full')} />
      </div>
    </Tile>
  )
}

function Time() {
  return (
    <Tile>
      <div className={cn(card, 'flex w-[78%] flex-col gap-2 p-3')}>
        <div className="flex justify-between">{Array.from({ length: 9 }, (_, i) => <span key={i} className={cn('w-px bg-fg/20', i % 2 ? 'h-1' : 'h-2')} />)}</div>
        <div className="relative flex flex-col gap-1.5">
          <span className={cn(bar, 'h-2 w-[62%]')} />
          <span className={cn(bar, 'ml-[18%] h-2 w-[54%]')} />
          <div className="relative h-2">
            {[12, 38, 70].map((x) => <span key={x} className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[1px] bg-signal" style={{ left: `${x}%` }} />)}
            <span className="absolute inset-y-[3px] right-[30%] left-[12%] bg-fg/10" />
          </div>
          <span className={cn('absolute -top-4 -bottom-1 left-[30%] w-px bg-rec group-hover:left-[66%]', T)} />
        </div>
      </div>
    </Tile>
  )
}

function Structure() {
  const rows = [
    { indent: 0, w: 'w-12' },
    { indent: 1, w: 'w-9', selected: true },
    { indent: 1, w: 'w-14' },
    { indent: 0, w: 'w-10' },
  ]
  return (
    <Tile>
      <div className={cn(card, 'flex w-[56%] flex-col gap-0.5 p-1.5')}>
        {rows.map((r, i) => (
          <div key={i} className={cn('flex h-5 items-center gap-2 rounded-[4px] px-1.5', r.selected && 'bg-signal-soft', i === 2 && 'group-hover:translate-x-1', T)} style={{ paddingLeft: 6 + r.indent * 10 }}>
            <span className={cn('size-2 flex-none rounded-[2px]', r.selected ? 'bg-signal' : 'bg-fg/20')} />
            <span className={cn(bar, 'h-1.5', r.w, r.selected && 'bg-signal/40')} />
            <Eye size={10} strokeWidth={1.75} className={cn('ml-auto flex-none', r.selected ? 'text-signal' : 'text-fg/25')} />
          </div>
        ))}
      </div>
    </Tile>
  )
}

function Working() {
  return (
    <Tile>
      <div className="flex w-[74%] items-center gap-2.5">
        <div className="flex flex-col gap-2">
          <div className={cn(card, 'flex gap-0.5 p-1')}>
            <span className="flex size-5 items-center justify-center rounded-[4px] text-fg/60"><Undo2 size={11} strokeWidth={1.75} /></span>
            <span className="flex size-5 items-center justify-center rounded-[4px] text-fg/25"><Redo2 size={11} strokeWidth={1.75} /></span>
          </div>
          <div className={cn(card, 'flex h-6 items-center gap-1 px-1.5 text-fg/45')}><Link2 size={11} strokeWidth={1.75} /><span className={cn(bar, 'h-1 w-6')} /></div>
        </div>
        {/* before / after */}
        <div className={cn(card, 'relative h-[74px] flex-1 overflow-hidden p-1')}>
          <div className="relative size-full overflow-hidden rounded-[5px] bg-fg/[0.06]">
            <span className="absolute top-1/2 left-1/2 aspect-square h-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-fg/15" />
            {/* "after" — the same picture, recoloured, revealed up to the divider */}
            <div className={cn('absolute inset-0 bg-signal-soft [clip-path:inset(0_50%_0_0)] group-hover:[clip-path:inset(0_28%_0_0)]', T)}>
              <span className="absolute top-1/2 left-1/2 aspect-square h-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal/55" />
            </div>
            <span className={cn('absolute inset-y-0 left-1/2 w-px bg-panel group-hover:left-[72%]', T)} />
          </div>
        </div>
        {/* presets */}
        <div className="flex flex-col gap-1">
          {[1, 0, 0].map((on, i) => <span key={i} className={cn('h-4 w-7 rounded-[4px]', on ? 'bg-panel shadow-[0_0_0_1.5px_var(--signal)]' : 'bg-fg/[0.08]')} />)}
        </div>
      </div>
    </Tile>
  )
}

function Handoff() {
  const files = ['PNG', 'SVG', 'MP4']
  return (
    <Tile>
      <div className="relative h-[60%] w-[60%]">
        {files.map((f, i) => (
          <div key={f} className={cn(card, 'absolute top-1/2 left-1/2 flex h-[86%] w-[30%] flex-col justify-between p-1.5 group-hover:[--spread:1.18]', T)}
            style={{ transform: `translate(calc(-50% + ${(i - 1) * 78}% * var(--spread, 1)), -50%) rotate(${(i - 1) * 7}deg)`, zIndex: i === 1 ? 2 : 1 }}>
            <span className={cn('h-[55%] rounded-[3px]', i === 1 ? 'bg-signal-soft' : 'bg-fg/[0.07]')} />
            <span className={cn('text-[8px] font-semibold tracking-[0.06em] text-fg/40', i === 2 && 'self-end')}>{f}</span>
          </div>
        ))}
      </div>
    </Tile>
  )
}

export const KIT_THUMBS: Record<string, () => ReactNode> = {
  Controls, Layout, Time, Structure, Working, 'Hand-off': Handoff,
}
