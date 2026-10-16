/* Marks — the two stage views (variants grid, focus), the bottom panel (ladder / more like this) and side panels. */
import { memo, useMemo } from 'react'
import { useStore } from 'zustand'
import { ArrowLeftRight, Columns2, Download, FileJson, Image as ImageIcon, Sparkles, Star, X, RotateCcw, Copy, Lock, LockOpen } from 'lucide-react'
import {
  Stage, Artboard, Panel, PanelHeader, PanelTabs, Inspector, Section, Row, Button, IconButton, Menu, Badge, Empty, Tip, createCamera, useValues, useDoc, cn, humanize,
} from '@kit'
import { FAMILY, type DrawCtx } from './families'
import { doc, settings, ui, colorsOf, markLabel, type Mark, type SV } from './model'
import { lockupSVG, markSVG, svgURL } from './render'
import { VariantGrid, VariantAction, SizeLadder } from '@kit/ui/variant-grid'
import {
  focus, toggleLock, toggleFav, moreLikeThis, applyMutation, keepMutation, favMutation, compareWith, swapCompare, adoptFromCompare, exportMarkSVG,
  exportPNGSet, exportLockup, exportParams, copyMarkSVG, resetMarkParams, toggleCompare, ICON_SIZES,
} from './actions'

/* --- shared renderers --- */
export const MarkArt = memo(function MarkArt({ m, ink, paper, accent, initials, pad = 0 }: { m: Mark } & DrawCtx & { pad?: number }) {
  const svg = useMemo(() => markSVG(m, { ink, paper, accent, initials }, { pad }), [m, ink, paper, accent, initials, pad])
  return <div className="size-full [&>svg]:block [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: svg }} />
})

const darkColors = (s: SV): DrawCtx => ({ ink: s.paper, paper: s.ink, accent: s.accent, initials: s.initials })

/* ================= grid view ================= */

export function GridView({ columns }: { columns: React.MutableRefObject<number> }) {
  const d = useDoc(doc, (x) => x)
  const s = useValues(settings) as SV
  const cursor = useStore(ui, (x) => x.cursor)
  const c = colorsOf(s)
  const kept = d.grid.filter((id) => d.marks[id]?.locked).length
  const items = d.grid.map((id) => {
    const m = d.marks[id]
    return { id, label: FAMILY[m.family].name, sub: `#${m.v.seed}`, locked: m.locked, fav: d.favs.includes(id), background: s.paper }
  })
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[1280px] px-6 pt-5 pb-10">
        <div className="mb-4 flex items-center gap-2 text-ui text-fg-muted">
          <span className="whitespace-nowrap text-fg">{d.grid.length} variants</span>
          <span className="text-fg-faint">·</span>
          <span className="whitespace-nowrap">{kept} kept</span>
          <span className="text-fg-faint">·</span>
          <span>Space rerolls everything not kept · Enter opens · L keeps · F favourites</span>
        </div>
        <VariantGrid
          items={items}
          cursor={Math.min(cursor, items.length - 1)}
          onCursor={(i) => ui.setState({ cursor: i })}
          onOpen={focus}
          onLock={toggleLock}
          onFav={toggleFav}
          onColumns={(n) => { columns.current = n }}
          shortcuts={{ lock: 'l', fav: 'f' }}
          actions={(id) => <VariantAction label="More like this" shortcut="m" icon={Sparkles} onClick={() => moreLikeThis(id)} />}
          render={(id) => <MarkArt m={d.marks[id]} {...c} />}
        />
      </div>
    </div>
  )
}

/* ================= focus view ================= */

export const focusCamera = createCamera()
const MARK = 960, LW = 1280, LH = 420, GAP = 120

function Lockup({ m, s, mode }: { m: Mark; s: SV; mode: 'light' | 'dark' }) {
  const { svg } = useMemo(() => lockupSVG(m, s, mode, { bg: false }), [m, s, mode])
  return <div className="size-full p-[56px]"><div className="size-full [&>svg]:block [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: svg }} /></div>
}

export function FocusView() {
  const id = useStore(ui, (x) => x.focus)
  const compare = useStore(ui, (x) => x.compare)
  const m = useDoc(doc, (d) => (id ? d.marks[id] : undefined))
  const b = useDoc(doc, (d) => (compare ? d.marks[compare] : undefined))
  const s = useValues(settings) as SV
  const c = colorsOf(s)
  const content = useMemo(() => (b ? { w: MARK * 2 + GAP, h: MARK } : { w: MARK + GAP + LW, h: MARK }), [b])
  if (!m) return null
  return (
    <Stage key={b ? 'compare' : 'single'} camera={focusCamera} contentSize={content} grid>
      <div className="relative" style={{ width: content.w, height: content.h }}>
        <Artboard width={MARK} height={MARK} background={s.paper} label={b ? <span><span className="text-signal">A</span> · {markLabel(m)}</span> : markLabel(m)}>
          <MarkArt m={m} {...c} />
        </Artboard>
        {b ? (
          <Artboard x={MARK + GAP} width={MARK} height={MARK} background={s.paper} label={<span><span className="text-key">B</span> · {markLabel(b)}</span>}>
            <MarkArt m={b} {...c} />
          </Artboard>
        ) : (
          <>
            <Artboard x={MARK + GAP} width={LW} height={LH} background={s.paper} label="Light lockup"><Lockup m={m} s={s} mode="light" /></Artboard>
            <Artboard x={MARK + GAP} y={MARK - LH} width={LW} height={LH} background={s.ink} label="Dark lockup"><Lockup m={m} s={s} mode="dark" /></Artboard>
          </>
        )}
      </div>
    </Stage>
  )
}

/* ================= bottom panel: ladder / more like this ================= */

function TabMock({ m, s, dark }: { m: Mark; s: SV; dark: boolean }) {
  const cc = dark ? darkColors(s) : colorsOf(s)
  return (
    <div className="flex flex-col gap-2 self-stretch pl-2">
      <div className="flex h-8 w-[208px] items-center gap-2 rounded-t-[8px] px-2.5" style={{ background: dark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.05)' }}>
        <img alt="" width={16} height={16} src={svgURL(markSVG(m, cc, { pad: 0.02 }))} />
        <span className="min-w-0 flex-1 truncate text-[12px]">{s.name || 'Brand'} — Home</span>
        <X size={12} strokeWidth={1.5} className="opacity-50" />
      </div>
      <div className="mt-auto flex items-end gap-3">
        <div className="flex flex-col items-center gap-1">
          <div className="size-[60px] overflow-hidden rounded-[14px] shadow-[0_1px_3px_rgba(0,0,0,.25)]" style={{ background: s.iconBg === 'ink' ? s.ink : s.paper }}>
            <img alt="" className="size-full" src={svgURL(markSVG(m, s.iconBg === 'ink' ? darkColors(s) : colorsOf(s), { pad: s.iconPad }))} />
          </div>
          <span className="text-[10.5px] opacity-70">{s.name || 'Brand'}</span>
        </div>
      </div>
    </div>
  )
}

export function BottomPanel() {
  const tab = useStore(ui, (x) => x.bottom)
  const id = useStore(ui, (x) => x.focus)
  const mutations = useStore(ui, (x) => x.mutations)
  const m = useDoc(doc, (d) => (id ? d.marks[id] : undefined))
  const s = useValues(settings) as SV
  const c = colorsOf(s)
  if (!m) return null
  return (
    <Panel className="h-[356px]" header={
      <PanelHeader>
        <PanelTabs value={tab} onChange={(t) => ui.setState({ bottom: t })} tabs={[{ value: 'ladder', label: 'Size ladder' }, { value: 'more', label: `More like this${mutations.length ? ` · ${mutations.length}` : ''}` }]} />
        {tab === 'more' && <Button size="sm" onClick={() => moreLikeThis(m.id)}><Sparkles size={12} strokeWidth={1.5} />{mutations.length ? 'Regenerate' : 'Generate'}</Button>}
        <IconButton icon={X} label="Hide panel" size="icon-sm" onClick={() => ui.setState({ ladder: false })} />
      </PanelHeader>
    }>
      {tab === 'ladder' ? (
        <div className="overflow-x-auto p-2">
          <SizeLadder
            sizes={[16, 32, 64, 256]}
            surfaces={[{ label: 'On paper', bg: s.paper, fg: s.ink }, { label: 'On ink', bg: s.ink, fg: s.paper }]}
            render={(size, si) => <img alt="" width={size} height={size} src={svgURL(markSVG(m, si ? darkColors(s) : c, { pad: size <= 32 ? 0 : 0.02 }))} />}
            extra={(si) => <TabMock m={m} s={s} dark={si === 1} />}
          />
        </div>
      ) : mutations.length ? (
        <div className="p-3">
          <VariantGrid
            minSize={112}
            gap={10}
            items={mutations.map((x) => ({ id: x.id, label: x.v.seed === m.v.seed ? 'Same seed' : `#${x.v.seed}`, background: s.paper }))}
            cursor={-1}
            onCursor={(i) => applyMutation(mutations[i])}
            onOpen={(mid) => applyMutation(mutations.find((x) => x.id === mid)!)}
            onLock={(mid) => keepMutation(mutations.find((x) => x.id === mid)!)}
            onFav={(mid) => favMutation(mutations.find((x) => x.id === mid)!)}
            render={(mid) => <MarkArt m={mutations.find((x) => x.id === mid)!} {...c} />}
          />
          <div className="mt-2 text-ui text-fg-faint">Click to apply to the focused mark (undoable) · lock keeps it in the grid · star saves it to favourites</div>
        </div>
      ) : (
        <Empty icon={Sparkles} title="Variations around this mark" hint="Nudges every parameter a little — how far is set by Variation in the brand settings."
          action={<Button variant="default" className="mt-2" onClick={() => moreLikeThis(m.id)}><Sparkles size={13} strokeWidth={1.5} />More like this</Button>} />
      )}
    </Panel>
  )
}

/* ================= left: favourites ================= */

export function FavouritesPanel() {
  const d = useDoc(doc, (x) => x)
  const s = useValues(settings) as SV
  const focusId = useStore(ui, (x) => x.focus)
  const compare = useStore(ui, (x) => x.compare)
  const c = colorsOf(s)
  const favs = d.favs.filter((id) => d.marks[id])
  return (
    <Panel header={<PanelHeader title={<span>Favourites <span className="font-normal text-fg-faint">{favs.length || ''}</span></span>} />}
      footer={<div className="px-pad py-2 text-ui text-fg-faint">Favourites survive rerolls. Alt-click to compare.</div>}>
      {favs.length ? (
        <div className="grid grid-cols-2 gap-2 p-2">
          {favs.map((id) => {
            const m = d.marks[id]
            const on = id === focusId, cmp = id === compare
            return (
              <div key={id} className="group/fav flex min-w-0 flex-col gap-1">
                {/* the actions sit on the thumbnail, so the label gets the tile's full width (an invisible Compare
                    button beside it reserved 20px and truncated every name) */}
                <div className="relative">
                  <button type="button" aria-label={`Open ${markLabel(m)}`}
                    onClick={(e) => (e.altKey && focusId ? compareWith(id) : focus(id))}
                    className={cn('relative block aspect-square w-full overflow-hidden rounded-[8px] outline-none focus-visible:ring-2 focus-visible:ring-signal',
                      on ? 'shadow-[0_0_0_2px_var(--signal)]' : cmp ? 'shadow-[0_0_0_2px_var(--key)]' : 'shadow-[0_0_0_1px_var(--line)] hover:shadow-[0_0_0_1px_var(--line-strong)]')}
                    style={{ background: s.paper }}>
                    <MarkArt m={m} {...c} />
                  </button>
                  <div className="absolute top-1 right-1 flex gap-0.5">
                    {focusId && focusId !== id && (
                      <Tip label="Compare with focused"><button type="button" aria-label="Compare" onClick={() => compareWith(id)} className="hidden size-icon-sm items-center justify-center rounded-control bg-overlay text-fg-muted shadow-[var(--shadow-segment)] outline-none hover:text-fg group-focus-within/fav:flex group-hover/fav:flex focus-visible:ring-2 focus-visible:ring-signal"><Columns2 size={11} strokeWidth={1.5} /></button></Tip>
                    )}
                    <Tip label="Remove from favourites"><button type="button" aria-label="Unfavourite" onClick={() => toggleFav(id)} className="flex size-icon-sm items-center justify-center rounded-control bg-overlay text-key shadow-[var(--shadow-segment)] outline-none focus-visible:ring-2 focus-visible:ring-signal"><Star size={11} strokeWidth={1.5} fill="currentColor" /></button></Tip>
                  </div>
                </div>
                <span className="min-w-0 truncate text-ui text-fg-muted">{markLabel(m)}</span>
              </div>
            )
          })}
        </div>
      ) : (
        <Empty icon={Star} title="No favourites yet" hint="Star a variant (F) to collect it here. Favourites survive rerolls and can be compared." />
      )}
    </Panel>
  )
}

/* ================= right: inspector ================= */

export function SettingsPanel() {
  return (
    <>
      <div className="px-pad pt-3 pb-1 text-ui leading-relaxed text-fg-muted">Brand settings, shared by every variant. Open a variant to tune its shape.</div>
      <Inspector params={settings} />
    </>
  )
}

const fmt = (v: unknown) => (typeof v === 'number' ? (Number.isInteger(v) ? String(v) : v.toFixed(2)) : typeof v === 'boolean' ? (v ? 'on' : 'off') : String(v))

export function MarkPanel() {
  const id = useStore(ui, (x) => x.focus)
  const compare = useStore(ui, (x) => x.compare)
  const d = useDoc(doc, (x) => x)
  const m = id ? d.marks[id] : undefined
  const b = compare ? d.marks[compare] : undefined
  const fam = m ? FAMILY[m.family] : undefined
  const ladderHidden = useStore(ui, (x) => !x.ladder)
  const choices = useMemo(() => [...new Set([...d.favs, ...d.grid])].filter((x) => x !== id && d.marks[x]), [d, id])
  if (!m || !fam) return null
  const Icon = fam.icon
  const fav = d.favs.includes(m.id)
  const defaults = fam.params.getState().defaults as Record<string, unknown>
  const A = { ...defaults, ...m.v }
  const B = b ? { ...(FAMILY[b.family].params.getState().defaults as Record<string, unknown>), ...b.v } : null
  const diffs = B && b!.family === m.family ? Object.keys(A).filter((k) => JSON.stringify(A[k]) !== JSON.stringify(B[k])) : []
  return (
    <>
      <div className="flex items-start gap-2.5 border-b border-line px-pad py-3">
        <div className="flex size-button-lg shrink-0 items-center justify-center rounded-cluster bg-control text-fg-muted"><Icon size={15} strokeWidth={1.5} /></div>
        <div className="min-w-0 flex-1">
          <div className="text-title font-medium text-fg">{fam.name} <span className="font-normal tabular text-fg-faint">#{String(m.v.seed)}</span></div>
          <div className="text-ui leading-snug text-fg-muted">{fam.blurb}</div>
        </div>
      </div>
      <div className="flex items-center gap-0.5 border-b border-line px-1.5 py-1.5">
        <IconButton icon={Star} label={fav ? 'Unfavourite' : 'Favourite'} shortcut="f" size="icon-sm" active={fav} onClick={() => toggleFav(m.id)} />
        <IconButton icon={m.locked ? Lock : LockOpen} label={m.locked ? 'Kept in grid. Unlock' : 'Keep in grid (lock)'} shortcut="l" size="icon-sm" active={!!m.locked} onClick={() => toggleLock(m.id)} />
        <IconButton icon={Sparkles} label="More like this" shortcut="m" size="icon-sm" onClick={() => moreLikeThis(m.id)} />
        <Menu trigger={<IconButton icon={Columns2} label="Compare with…" size="icon-sm" active={!!b} />} items={[
          { label: b ? 'Stop comparing' : 'Compare with last viewed', shortcut: 'c', icon: Columns2, onClick: toggleCompare },
          { type: 'separator' },
          { type: 'label', label: 'Compare with' },
          ...choices.slice(0, 24).map((x) => ({ label: markLabel(d.marks[x]), checked: x === compare, hint: d.favs.includes(x) ? 'Favourite' : undefined, onClick: () => compareWith(x) })),
        ]} />
        <span className="flex-1" />
        {ladderHidden && <Button size="sm" onClick={() => ui.setState({ ladder: true })}>Size ladder</Button>}
        <IconButton icon={RotateCcw} label="Reset shape to family defaults (keeps seed)" size="icon-sm" onClick={() => resetMarkParams(m.id)} />
      </div>
      {b && (
        <Section title="Compare" first actions={<Badge tone="key">B</Badge>}>
          <div className="flex items-center gap-1.5 px-pad pb-1.5 text-ui text-fg-muted">
            <span className="min-w-0 flex-1 truncate">A {markLabel(m)} · B {markLabel(b)}</span>
            <Button size="sm" onClick={swapCompare}><ArrowLeftRight size={12} strokeWidth={1.5} />Swap</Button>
          </div>
          {b.family !== m.family ? (
            <div className="px-pad pb-1 text-ui leading-relaxed text-fg-muted">Different families. “Use B” replaces A’s family and shape with B’s.</div>
          ) : diffs.length ? diffs.map((k) => (
            <Row key={k} label={(fam.params.defs[k] as { label?: string })?.label ?? humanize(k)}
              trailing={<Button size="sm" onClick={() => adoptFromCompare(k)}>Use B</Button>}>
              <span className="flex min-w-0 flex-1 items-center gap-1.5 tabular text-ui">
                <span className="truncate text-fg">{fmt(A[k])}</span><span className="text-fg-faint">→</span><span className="truncate text-key">{fmt(B![k])}</span>
              </span>
            </Row>
          )) : <div className="px-pad pb-1 text-ui text-fg-muted">Identical parameters.</div>}
          <div className="px-pad pt-1.5"><Button variant="outline" size="md" className="w-full" onClick={() => adoptFromCompare()}>Use all of B</Button></div>
        </Section>
      )}
      <Inspector params={fam.params} />
      <Section title="Export">
        <div className="grid grid-cols-2 gap-1.5 px-pad pb-1">
          <Button variant="default" size="md" onClick={() => exportMarkSVG(m.id)}><Download size={13} strokeWidth={1.5} />SVG</Button>
          <Button variant="default" size="md" onClick={() => void exportPNGSet(m.id)}><ImageIcon size={13} strokeWidth={1.5} />PNG set</Button>
          <Button variant="default" size="md" onClick={() => exportLockup('light', m.id)}>Lockup light</Button>
          <Button variant="default" size="md" onClick={() => exportLockup('dark', m.id)}>Lockup dark</Button>
          <Button variant="default" size="md" onClick={() => exportParams(m.id)}><FileJson size={13} strokeWidth={1.5} />Params</Button>
          <Button variant="default" size="md" onClick={() => void copyMarkSVG(m.id)}><Copy size={13} strokeWidth={1.5} />Copy SVG</Button>
        </div>
        <div className="px-pad pt-1.5 text-ui leading-relaxed text-fg-faint">PNG set: {ICON_SIZES.map((i) => `${i.size}`).join(', ')} px, zipped with SVGs and params.</div>
      </Section>
    </>
  )
}

