/* Kit card thumbnails. Each is a small, quiet scene with ONE focal piece of real
   UI (crisp, with tiny real labels) and faded context around it, after the
   references in research: Keitoto and Sahil Vhora's feature cards (one sharp
   card, the rest fading out), Arounda (one accent glow, a cursor acting on it),
   Mags Sousa's ui-details channel (value printed inside the slider fill, pill
   toasts). Rueca brand (brand/data.js): the artwork is flat dyed threads (no
   gradients, no glow), the tile carries the drawn scaffold. The accent is the site's (Achiote) and only
   marks what is "on".
   Motion plays as the card scrolls up the screen, or on hover (useKitScroll and
   --kh on the card). Kit tokens only, so both themes work. */
import { useEffect, type ReactNode, type RefObject } from 'react'
import { Check, Eye, Film, Link2, Play, Redo2, Square, Type, Undo2 } from 'lucide-react'
import { cn } from '@kit/core/cn'
import { Scaffold, Swatches, Threads } from './brandArt'

/** How far each thumbnail's motion has played: scroll progress (--kp, set on the card by
    useKitScroll) or hover (--kh), whichever is further along. 0 = start, 1 = end. */
const P = 'max(var(--kp, 0), var(--kh, 0))'
const T = 'transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none'

/** the focal card: crisp, lifted */
export const focal = 'rounded-[9px] bg-panel shadow-[0_0_0_1px_var(--line),0_2px_4px_-1px_rgb(0_0_0/0.08),0_14px_28px_-14px_rgb(0_0_0/0.3)]'
/** context: a quiet card behind or beside the focal one */
export const ghost = 'rounded-[9px] bg-panel/60 shadow-[0_0_0_1px_var(--line)]'
const lbl = 'text-[9px] leading-none text-fg-muted'
const val = 'tabular text-[9px] leading-none text-fg'
const bar = 'rounded-full bg-fg/10'

/** The tile: a faint dot grid that fades out towards the edges. */
function Tile({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div aria-hidden data-studio-embed className={cn('relative aspect-[16/9] overflow-hidden rounded-[10px] bg-fg/[0.025] shadow-[inset_0_0_0_1px_var(--line)]', className)}>
      <DotGrid />
      <Scaffold />
      <div className="relative flex size-full items-center justify-center">{children}</div>
    </div>
  )
}

/** A faint dot grid that fades out towards the edges. Shared with How it works. */
export function DotGrid({ size = 12 }: { size?: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_78%)]"
      style={{ backgroundImage: 'radial-gradient(var(--line-strong) 0.9px, transparent 0.9px)', backgroundSize: `${size}px ${size}px` }} />
  )
}

/** a pointer, drawn in the page's ink so it reads in both themes */
export function Cursor({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 12 16" width="11" height="15" className={cn('pointer-events-none absolute z-10 drop-shadow-[0_1px_1px_rgb(0_0_0/0.25)]', T, className)} style={style}>
      <path d="M1 1 L1 12.5 L4 9.8 L6.3 14.6 L8.4 13.7 L6.1 8.9 L10.2 8.9 Z" fill="var(--fg)" stroke="var(--panel)" strokeWidth="1.1" strokeLinejoin="round" />
    </svg>
  )
}

/* ── Controls: an inspector section; a cursor drags the slider, its value sits in the fill ── */
function Controls() {
  const at = `calc(34% + 40% * ${P})`
  return (
    <Tile>
      <div className={cn(ghost, 'absolute h-[54%] w-[46%] translate-x-[20%] -translate-y-[24%]')} />
      <div className={cn(focal, 'relative flex w-[58%] flex-col gap-2 p-2.5')}>
        <div className="flex items-center justify-between"><span className="text-[9.5px] leading-none font-medium text-fg">Threads</span><span className={bar + ' h-1 w-4'} /></div>
        <div className="flex items-center gap-2">
          <span className={cn(lbl, 'w-8')}>Grain</span>
          <div className="relative h-3.5 flex-1 rounded-[4px] bg-track/70">
            <span className={cn('absolute inset-y-0 left-0 flex items-center justify-end rounded-[4px] bg-signal pr-1', T)} style={{ width: at }}>
              <span className="tabular text-[8px] leading-none font-medium text-signal-fg">18</span>
            </span>
            <Cursor style={{ left: at, top: '55%' }} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(lbl, 'w-8')}>Drift</span>
          <span className="flex h-3.5 flex-1 items-center justify-between rounded-[4px] bg-control px-1.5"><span className="text-[8px] leading-none text-fg-faint">↔</span><span className={val}>0.72</span></span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(lbl, 'w-8')}>Loop</span>
          <span className="ml-auto flex h-3 w-5 items-center rounded-full bg-signal p-px"><span className="ml-auto size-2.5 rounded-full bg-white" /></span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(lbl, 'w-8')}>Colours</span>
          <Swatches className="ml-auto" size="size-2.5" />
        </div>
      </div>
    </Tile>
  )
}

/* ── Layout: a mini tool window; its panels slide in around the artboard ── */
function Layout() {
  const inL = `calc(-10px * (1 - ${P}))`, inR = `calc(10px * (1 - ${P}))`, fade = `calc(0.35 + 0.65 * ${P})`
  return (
    <Tile>
      <div className={cn(ghost, 'relative h-[80%] w-[84%] p-1.5')}>
        <div className={cn(focal, 'mx-auto flex h-[12%] w-[44%] items-center justify-center gap-1 rounded-full')}>
          {[0, 1, 2].map((i) => <span key={i} className={cn('size-1 rounded-full', i === 1 ? 'bg-signal' : 'bg-fg/20')} />)}
        </div>
        <div className="mt-1.5 flex h-[80%] gap-1.5">
          <div className={cn(focal, 'flex w-[24%] flex-col gap-1 p-1.5', T)} style={{ translate: `${inL} 0`, opacity: fade }}>
            <span className={cn(lbl, 'mb-0.5 text-[8px]')}>Layers</span>
            {[10, 8, 9].map((w, i) => <span key={i} className={cn(bar, 'h-1')} style={{ width: `${w * 7}%` }} />)}
          </div>
          <div className="relative flex flex-1 items-center justify-center">
            <span className="absolute top-0 left-[18%] text-[7px] leading-none text-fg-faint">Artboard</span>
            <span className="h-[72%] w-[64%] overflow-hidden rounded-[4px] shadow-[0_0_0_1px_var(--line),0_8px_18px_-8px_rgb(0_0_0/0.3)]"><Threads drift={`calc(-6px * ${P})`} /></span>
          </div>
          <div className={cn(focal, 'flex w-[28%] flex-col gap-1 p-1.5', T)} style={{ translate: `${inR} 0`, opacity: fade }}>
            <span className={cn(lbl, 'mb-0.5 text-[8px]')}>Inspector</span>
            {[0, 1, 2].map((i) => <div key={i} className="flex items-center gap-1"><span className={cn(bar, 'h-1 w-3')} /><span className="h-1 flex-1 rounded-full bg-track"><span className="block h-full rounded-full bg-signal/70" style={{ width: `${40 + i * 15}%` }} /></span></div>)}
          </div>
        </div>
      </div>
    </Tile>
  )
}

/* ── Time: a timeline card; the playhead travels and keys light up as it passes them ── */
function Time() {
  const u = `(0.18 + 0.62 * ${P})`
  const key = (x: number) => ({ left: `${x * 100}%`, opacity: `clamp(0, calc((${u} - ${x}) * 25), 1)` })
  const lanes: [string, number[]][] = [['Scale', [0.12, 0.42]], ['Opacity', [0.3, 0.7]], ['Blur', [0.55, 0.85]]]
  return (
    <Tile>
      <div className={cn(ghost, 'absolute h-[50%] w-[64%] -translate-x-[14%] translate-y-[30%]')} />
      <div className={cn(focal, 'relative flex w-[76%] flex-col gap-1.5 p-2.5')}>
        <div className="flex items-center gap-1.5">
          <span className="flex size-3.5 items-center justify-center rounded-[4px] bg-control text-fg"><Play size={7} strokeWidth={2.5} /></span>
          <span className="tabular rounded-[4px] bg-control px-1 py-0.5 text-[8.5px] leading-none text-fg">1.24s</span>
        </div>
        <div className="flex gap-1.5">
          <div className="flex w-9 flex-none flex-col justify-end gap-1.5 pb-px">{lanes.map(([n]) => <span key={n} className={cn(lbl, 'h-2 text-[8px]')}>{n}</span>)}</div>
          <div className="relative flex-1">
            <div className="mb-1 flex justify-between">{['0s', '1s', '2s', '3s'].map((t) => <span key={t} className="text-[7px] leading-none text-fg-faint">{t}</span>)}</div>
            <div className="flex flex-col gap-1.5">
              {lanes.map(([n, keys]) => (
                <div key={n} className="relative h-2">
                  <span className="absolute inset-y-[3px] rounded-full bg-fg/10" style={{ left: `${keys[0] * 100}%`, right: `${(1 - keys[1]) * 100}%` }} />
                  {keys.map((x) => (
                    <span key={x} className="absolute top-1/2 size-[7px] -translate-1/2 rotate-45 rounded-[1.5px] shadow-[inset_0_0_0_1px_var(--line-strong)]" style={{ left: `${x * 100}%` }}>
                      <span className={cn('absolute inset-0 rounded-[1.5px] bg-signal', T)} style={key(x)} />
                    </span>
                  ))}
                </div>
              ))}
            </div>
            <span className={cn('absolute -top-0.5 -bottom-0.5 w-px bg-rec', T)} style={{ left: `calc(${u} * 100%)` }}>
              <span className="absolute -top-0.5 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-rec" />
            </span>
          </div>
        </div>
      </div>
    </Tile>
  )
}

/* ── Structure: a layer list; a cursor lifts one layer and drops it into a new place ── */
function Structure() {
  const rows: { name: string; icon: ReactNode; indent: number; selected?: boolean }[] = [
    { name: 'Frame', icon: <Square size={8} strokeWidth={2} />, indent: 0 },
    { name: 'Title', icon: <Type size={8} strokeWidth={2} />, indent: 1 },
    { name: 'Button', icon: <Square size={8} strokeWidth={2} />, indent: 1, selected: true },
    { name: 'Thread', icon: <span className="size-2 rounded-full border border-current" />, indent: 1 },
  ]
  // up two rows to the drop line under Title, and out to the right so the list stays readable
  const lift = `translate(calc(36% * ${P}), calc(-30px * ${P}))`
  return (
    <Tile>
      <div className={cn(focal, 'relative flex w-[54%] flex-col p-1.5')}>
        <div className="flex items-center justify-between px-1 pb-1"><span className="text-[9.5px] leading-none font-medium text-fg">Layers</span><span className="tabular text-[8px] leading-none text-fg-faint">4</span></div>
        {rows.map((r, i) => (
          <div key={r.name} className={cn('relative flex h-[18px] items-center gap-1.5 rounded-[4px] pr-1.5', r.selected ? 'bg-signal-soft text-fg' : 'text-fg-muted', i === 3 && 'opacity-40')} style={{ paddingLeft: 6 + r.indent * 9 }}>
            <span className={cn('flex size-2.5 items-center justify-center', r.selected ? 'text-signal' : 'text-fg-faint')}>{r.icon}</span>
            <span className="text-[9px] leading-none">{r.name}</span>
            <Eye size={9} strokeWidth={1.75} className={cn('ml-auto', r.selected ? 'text-signal' : 'text-fg/25')} />
            {i === 1 && <span className={cn('absolute -bottom-px left-3 right-1 h-[1.5px] rounded-full bg-signal', T)} style={{ opacity: P }} />}
          </div>
        ))}
        {/* the layer being dragged: a lifted copy of "Thread" */}
        <div className={cn(focal, 'absolute right-1.5 bottom-1.5 left-1.5 flex h-[18px] items-center gap-1.5 pr-1.5 pl-[15px] text-fg', T)} style={{ transform: lift }}>
          <span className="size-2 rounded-full border border-current text-fg-faint" />
          <span className="text-[9px] leading-none">Thread</span>
          <Cursor className="top-[9px] left-[42%]" />
        </div>
      </div>
    </Tile>
  )
}

/* ── Working: before / after, with undo and presets alongside ── */
function Working() {
  const split = `calc(50% + 20% * ${P})`
  return (
    <Tile>
      <div className="flex w-[82%] items-center gap-2.5">
        <div className="flex flex-col gap-1.5 opacity-70">
          <div className={cn(ghost, 'flex gap-0.5 p-0.5')}>
            <span className="flex size-4 items-center justify-center text-fg-muted"><Undo2 size={9} strokeWidth={1.75} /></span>
            <span className="flex size-4 items-center justify-center text-fg/25"><Redo2 size={9} strokeWidth={1.75} /></span>
          </div>
          <div className={cn(ghost, 'flex h-5 items-center gap-1 px-1.5 text-fg-muted')}><Link2 size={9} strokeWidth={1.75} /><span className="text-[8px] leading-none">Share</span></div>
        </div>
        <div className={cn(focal, 'relative h-[96px] flex-1 overflow-hidden p-1')}>
          <div className="relative size-full overflow-hidden rounded-[6px] bg-fg/[0.06]">
            <div className="absolute inset-0"><Threads mono /></div>
            <div className={cn('absolute inset-0', T)} style={{ clipPath: `inset(0 calc(100% - ${split}) 0 0)` }}><Threads /></div>
            <span className="absolute top-1 left-1 rounded-full bg-panel/85 px-1 py-px text-[7px] leading-none text-fg">After</span>
            <span className="absolute top-1 right-1 rounded-full bg-panel/85 px-1 py-px text-[7px] leading-none text-fg-muted">Before</span>
            <span className={cn('absolute inset-y-0 w-px bg-panel', T)} style={{ left: split }}>
              <span className="absolute top-1/2 left-1/2 flex size-4 -translate-1/2 items-center justify-center rounded-full bg-panel text-[7px] leading-none text-fg shadow-[0_1px_3px_rgb(0_0_0/0.3)]">‹›</span>
            </span>
            <Cursor style={{ left: `calc(${split} + 2px)`, top: '56%' }} />
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          {['Calm', 'Brand', 'Loud'].map((n, i) => (
            <span key={n} className={cn('flex h-5 w-9 items-center justify-center rounded-[5px] text-[7.5px] leading-none', i === 1 ? 'bg-panel text-fg shadow-[0_0_0_1.5px_var(--signal)]' : 'bg-fg/[0.06] text-fg-faint')}>{n}</span>
          ))}
        </div>
      </div>
    </Tile>
  )
}

/* ── Hand-off: exports fan out, and a "copied" toast arrives ── */
function Handoff() {
  const files = [
    { name: 'threads.png', meta: '2x', art: <span className="block size-full overflow-hidden rounded-[4px]"><Threads /></span> },
    { name: 'threads.svg', meta: '', art: <span className="block size-full overflow-hidden rounded-[4px] bg-fg/[0.04]"><Threads outline /></span> },
    { name: 'loop.mp4', meta: '4s', art: <span className="flex size-full items-center justify-center rounded-[4px] bg-fg/[0.07] text-fg-faint"><Film size={12} strokeWidth={1.5} /></span> },
  ]
  return (
    <Tile>
      <div className="relative h-[62%] w-[66%] -translate-y-[8%]">
        {files.map((f, i) => (
          <div key={f.name} className={cn(i === 1 ? focal : focal + ' opacity-85', 'absolute top-1/2 left-1/2 flex h-full w-[34%] flex-col gap-1 p-1', i === 1 && 'shadow-[0_0_0_1.5px_var(--signal),0_14px_28px_-14px_rgb(0_0_0/0.3)]', T)}
            style={{ transform: `translate(calc(-50% + ${(i - 1) * 74}% * (1 + 0.2 * ${P})), -50%) rotate(${(i - 1) * 6 * 1}deg)`, zIndex: i === 1 ? 2 : 1 }}>
            <div className="min-h-0 flex-1">{f.art}</div>
            {/* the right-hand file shows its label on its visible side */}
            <div className={cn('flex items-baseline justify-between gap-1 px-0.5', i === 2 && 'flex-row-reverse')}><span className="truncate text-[8px] leading-none text-fg">{f.name}</span><span className="text-[7px] leading-none text-fg-faint">{f.meta}</span></div>
          </div>
        ))}
      </div>
      <div className={cn(focal, 'absolute bottom-[9%] left-1/2 flex items-center gap-1.5 rounded-full py-1 pr-2 pl-1.5', T)}
        style={{ opacity: `clamp(0, calc((${P} - 0.55) * 4), 1)`, transform: `translate(-50%, calc(6px * (1 - ${P})))` }}>
        <span className="flex size-3 items-center justify-center rounded-full bg-ok text-white"><Check size={7} strokeWidth={3} /></span>
        <span className="text-[8.5px] leading-none text-fg">Copied as agent prompt</span>
      </div>
    </Tile>
  )
}

export const KIT_THUMBS: Record<string, () => ReactNode> = {
  Controls, Layout, Time, Structure, Working, 'Hand-off': Handoff,
}

/** Scroll-drive the thumbnails: each card's --kp runs 0 → 1 as its top travels from
    near the bottom of the screen to a third of the way down. Scrolling back reverses
    it. Written straight to the card's style, so scrolling never re-renders React.
    Reduced motion: every thumbnail just shows its end state. */
export function useKitScroll(grid: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = grid.current
    if (!el) return
    const cards = [...el.children] as HTMLElement[]
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { cards.forEach((c) => c.style.setProperty('--kp', '1')); return }
    let scroller: HTMLElement | null = el.parentElement
    while (scroller && !/auto|scroll/.test(getComputedStyle(scroller).overflowY)) scroller = scroller.parentElement
    const target: HTMLElement | Window = scroller ?? window
    let raf = 0
    const update = () => {
      raf = 0
      const top = scroller ? scroller.getBoundingClientRect().top : 0
      const vh = scroller ? scroller.clientHeight : innerHeight
      for (const c of cards) {
        const y = c.getBoundingClientRect().top - top
        const p = Math.min(1, Math.max(0, (vh * 0.92 - y) / (vh * 0.55)))
        c.style.setProperty('--kp', p.toFixed(3))
      }
    }
    const on = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    target.addEventListener('scroll', on, { passive: true })
    addEventListener('resize', on)
    return () => { target.removeEventListener('scroll', on); removeEventListener('resize', on); cancelAnimationFrame(raf) }
  }, [grid])
}
