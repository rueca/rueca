import { useEffect, useRef } from 'react'
import { useStore } from 'zustand'
import {
  ArrowLeft, ChevronLeft, ChevronRight, Columns2, Copy, Dices, Download, FileJson, Image as ImageIcon, LayoutGrid, Lock, LockOpen, Shuffle, Sparkles, Star,
  ArrowLeftRight, RotateCcw, Hash, Ruler, Eraser,
} from 'lucide-react'
import {
  Studio, Toolbar, Cluster, Brand, Panel, PanelHeader, Button, IconButton, Menu, Divider, Segmented, PresetMenu, ThemeToggle, CommandPalette, Kbd,
  shareMenuItems, useValues, type Command,
} from '@kit'
import { FAMILIES, FAMILY, type FamilyId } from './families'
import { doc, settings, ui, history, markLabel, resetDemoDoc, type SV } from './model'
import { HistoryCluster, useDoc } from '../batch/local/history'
import { GridView, FocusView, BottomPanel, FavouritesPanel, SettingsPanel, MarkPanel, focusCamera } from './views'
import {
  reroll, fitCount, focus, step, toggleLock, toggleFav, moreLikeThis, toggleCompare, swapCompare, cursorId, exportMarkSVG, exportPNGSet, exportLockup,
  exportParams, copyMarkSVG, newSeed, rerollParams, setAllLocked, clearFavs, resetMarkParams,
} from './actions'

const ALL = FAMILIES.map((f) => f.id)

// Brand links the mark home itself.
const Mark = () => <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="8" cy="8" r="5.6" /><ellipse cx="8" cy="8" rx="5.6" ry="2.2" transform="rotate(-35 8 8)" /></svg>

function setFamily(v: string) {
  settings.setValue('families', (v === 'all' ? ALL : [v]) as never)
  reroll()
}

export default function MarksShell() {
  const focusId = useStore(ui, (s) => s.focus)
  const compare = useStore(ui, (s) => s.compare)
  const ladder = useStore(ui, (s) => s.ladder)
  const d = useDoc(doc, (x) => x)
  const s = useValues(settings) as SV
  const columns = useRef(4)
  const families = s.families as FamilyId[]
  const filter = families.length === ALL.length ? 'all' : families.length === 1 ? families[0] : ''

  // keep the grid as long as the Variants setting says
  useEffect(() => { fitCount() }, [s.count])
  // leave focus if the focused mark disappears (undo, reroll of an unfavourited focus)
  useEffect(() => { if (focusId && !d.marks[focusId]) focus(null) }, [d, focusId])

  const cur = cursorId()
  const curMark = cur ? d.marks[cur] : undefined
  const inFocus = !!focusId && !!d.marks[focusId]

  const exportItems = [
    { type: 'label' as const, label: curMark ? `Export ${markLabel(curMark)}` : 'Export' },
    { label: 'SVG', icon: Download, shortcut: 'mod+e', onClick: () => exportMarkSVG() },
    { label: 'PNG icon set (zip)', icon: ImageIcon, hint: '32 · 180 · 512 · 1024', shortcut: 'shift+mod+e', onClick: () => void exportPNGSet() },
    { label: 'Lockup — light (SVG)', onClick: () => exportLockup('light') },
    { label: 'Lockup — dark (SVG)', onClick: () => exportLockup('dark') },
    { label: 'Params (JSON)', icon: FileJson, onClick: () => exportParams() },
    { type: 'separator' as const },
    { label: 'Copy SVG', icon: Copy, shortcut: 'shift+mod+c', onClick: () => void copyMarkSVG() },
    { type: 'separator' as const },
    ...shareMenuItems(settings),
  ]

  const commands: Command[] = [
    ...(!inFocus ? [
      { id: 'reroll', label: 'Reroll unlocked variants', group: 'Explore', shortcut: 'space', icon: Dices, run: reroll },
      { id: 'open', label: 'Open variant', group: 'Explore', shortcut: 'enter', run: () => focus(cursorId()) },
      { id: 'right', label: 'Next variant', group: 'Navigate', shortcut: 'arrowright', run: () => step(1) },
      { id: 'left', label: 'Previous variant', group: 'Navigate', shortcut: 'arrowleft', run: () => step(-1) },
      { id: 'down', label: 'Variant below', group: 'Navigate', shortcut: 'arrowdown', run: () => step(columns.current) },
      { id: 'up', label: 'Variant above', group: 'Navigate', shortcut: 'arrowup', run: () => step(-columns.current) },
      { id: 'lock-all', label: 'Keep all variants', group: 'Explore', icon: Lock, run: () => setAllLocked(true) },
      { id: 'unlock-all', label: 'Unlock all variants', group: 'Explore', icon: LockOpen, run: () => setAllLocked(false) },
    ] : [
      { id: 'back', label: 'Back to variants', group: 'Navigate', shortcut: 'esc', icon: ArrowLeft, run: () => focus(null) },
      { id: 'next', label: 'Next variant', group: 'Navigate', shortcut: 'arrowright', icon: ChevronRight, run: () => step(1) },
      { id: 'prev', label: 'Previous variant', group: 'Navigate', shortcut: 'arrowleft', icon: ChevronLeft, run: () => step(-1) },
      { id: 'compare', label: compare ? 'Stop comparing' : 'Compare side by side', group: 'Focus', shortcut: 'c', icon: Columns2, run: toggleCompare },
      ...(compare ? [{ id: 'swap', label: 'Swap A and B', group: 'Focus', shortcut: 'x', icon: ArrowLeftRight, run: swapCompare }] : []),
      { id: 'ladder', label: ladder ? 'Hide size ladder' : 'Show size ladder', group: 'Focus', shortcut: 'b', icon: Ruler, run: () => ui.setState((x) => ({ ladder: !x.ladder })) },
      { id: 'reset-shape', label: 'Reset shape to family defaults', group: 'Focus', icon: RotateCcw, run: () => resetMarkParams() },
      { id: 'fit', label: 'Zoom to fit', group: 'Focus', run: () => focusCamera.fit() },
    ]),
    { id: 'lock', label: 'Keep / unlock', group: 'Variant', shortcut: 'l', icon: Lock, run: () => toggleLock() },
    { id: 'fav', label: 'Favourite / unfavourite', group: 'Variant', shortcut: 'f', icon: Star, run: () => toggleFav() },
    { id: 'more', label: 'More like this', group: 'Variant', shortcut: 'm', icon: Sparkles, run: () => moreLikeThis() },
    { id: 'seed', label: 'New seed (same params)', group: 'Variant', shortcut: 'r', icon: Hash, run: () => newSeed() },
    { id: 'shuffle', label: 'Shuffle params (same family)', group: 'Variant', shortcut: 'shift+r', icon: Shuffle, run: () => rerollParams() },
    ...FAMILIES.map((f, i) => ({ id: `fam-${f.id}`, label: `Only ${f.name.toLowerCase()} marks`, group: 'Families', shortcut: String(i + 1), icon: f.icon, run: () => setFamily(f.id) })),
    { id: 'fam-all', label: 'All families', group: 'Families', shortcut: '0', icon: LayoutGrid, run: () => setFamily('all') },
    { id: 'svg', label: 'Export SVG', group: 'Export', shortcut: 'mod+e', icon: Download, run: () => exportMarkSVG() },
    { id: 'png', label: 'Export PNG icon set (32, 180, 512, 1024)', group: 'Export', shortcut: 'shift+mod+e', icon: ImageIcon, run: () => void exportPNGSet() },
    { id: 'lockup-l', label: 'Export lockup — light', group: 'Export', run: () => exportLockup('light') },
    { id: 'lockup-d', label: 'Export lockup — dark', group: 'Export', run: () => exportLockup('dark') },
    { id: 'json', label: 'Export params JSON', group: 'Export', icon: FileJson, run: () => exportParams() },
    { id: 'copy', label: 'Copy SVG', group: 'Export', shortcut: 'shift+mod+c', icon: Copy, run: () => void copyMarkSVG() },
    { id: 'clear-favs', label: 'Clear favourites', group: 'Document', icon: Eraser, run: clearFavs },
    { id: 'demo', label: 'Restore demo variants', group: 'Document', icon: RotateCcw, run: () => { focus(null); resetDemoDoc() } },
    ...settings.getState().presets.map((p) => ({ id: `palette-${p.name}`, label: `Brand: ${p.name}`, group: 'Document', run: () => settings.applyPreset(p.name) })),
  ]

  return (
    <Studio
      leftWidth={232}
      rightWidth={300}
      toolbar={
        <Toolbar
          start={<Brand name="Marks" doc={`${s.name || 'Untitled'} — mark exploration`} mark={<Mark />} />}
          center={inFocus ? (
            <Cluster>
              <Button size="md" onClick={() => focus(null)}><ArrowLeft size={14} strokeWidth={1.5} />Variants</Button>
              <Divider vertical />
              <IconButton icon={ChevronLeft} label="Previous variant" shortcut="arrowleft" onClick={() => step(-1)} />
              <span className="min-w-[120px] px-1 text-center text-[12px] text-fg">{curMark ? markLabel(curMark) : ''}</span>
              <IconButton icon={ChevronRight} label="Next variant" shortcut="arrowright" onClick={() => step(1)} />
              <Divider vertical />
              <IconButton icon={Columns2} label={compare ? 'Stop comparing' : 'Compare side by side'} shortcut="c" active={!!compare} onClick={toggleCompare} />
              <IconButton icon={Sparkles} label="More like this" shortcut="m" onClick={() => moreLikeThis()} />
              <IconButton icon={Star} label="Favourite" shortcut="f" active={!!focusId && d.favs.includes(focusId)} onClick={() => toggleFav()} />
            </Cluster>
          ) : (
            <Cluster>
              <Segmented size="md" className="w-[212px]" value={filter} onChange={setFamily} iconOnly label="Families"
                options={[{ value: 'all', label: 'All families', icon: LayoutGrid, hint: 'All families (0)' }, ...FAMILIES.map((f, i) => ({ value: f.id, label: f.name, icon: f.icon, hint: `${f.name} (${i + 1})` }))]} />
              <Divider vertical />
              <Button size="md" onClick={reroll} className="gap-2"><Dices size={14} strokeWidth={1.5} />Reroll<Kbd>Space</Kbd></Button>
            </Cluster>
          )}
          end={
            <>
              <Cluster>
                <HistoryCluster history={history} />
                <Divider vertical />
                <PresetMenu params={settings} />
                <ThemeToggle />
              </Cluster>
              <Menu align="end" items={exportItems} trigger={<Button variant="primary" size="lg" disabled={!curMark}><Download size={14} strokeWidth={1.75} />Export</Button>} />
            </>
          }
        />
      }
      left={<FavouritesPanel />}
      right={
        <Panel header={<PanelHeader title={inFocus ? 'Mark' : 'Brand'}>{inFocus && <span className="text-[11px] text-fg-faint">{FAMILY[d.marks[focusId!].family].name}</span>}</PanelHeader>}>
          {inFocus ? <MarkPanel /> : <SettingsPanel />}
        </Panel>
      }
      bottom={inFocus && ladder ? <BottomPanel /> : undefined}
    >
      {inFocus ? <FocusView /> : <GridView columns={columns} />}
      <CommandPalette commands={commands} extraShortcuts={inFocus
        ? [{ keys: 'space', label: 'Hold and drag to pan' }, { keys: 'shift+1', label: 'Zoom to fit' }, { keys: 'shift+0', label: 'Zoom to 100%' }]
        : [{ keys: 'enter', label: 'Open variant' }, { keys: 'mod+k', label: 'Commands' }]} />
    </Studio>
  )
}
