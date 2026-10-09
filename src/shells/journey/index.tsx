/* Journey — a customer journey map on the kit's docked layout and <Stage> camera. */
import { useEffect, useRef } from 'react'
import {
  Download, Image as ImageIcon, FileSpreadsheet, ClipboardCopy, Braces, Upload, Plus, Columns3, Tag, X, Maximize2, RotateCcw, Trash2, Copy, UserRound, Rows3, ChevronDown,
} from 'lucide-react'
import {
  Studio, Toolbar, Cluster, Brand, Button, Menu, Divider, ThemeToggle, PresetMenu, CommandPalette, Stage, useHotkeys, useValues, toast,
  type Command, type MenuItem,
} from '@kit'
import { HistoryControls } from '../flows/local/HistoryControls'
import { useDoc } from '../flows/local/doc-store'
import { JourneyMap } from './map/JourneyMap'
import { PersonasPanel } from './panels/Personas'
import { JourneyInspector } from './panels/Inspector'
import { LANES } from './model'
import {
  params, history, doc, ui, useUI, usePersona, camera, fitMap, addCard, addStage, deleteSelection, duplicateCard, nudgeCard, switchPersona, addPersona, allTags, resetDemo, persona, cellCards,
} from './store'
import { exportPNG, exportCSV, copyMarkdown, exportJourneyJSON, importJourneyJSON, mapElement } from './export'

const Mark = (
  <a href="#/" aria-label="All shells" className="contents">
    <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1.5 11 C4 11 4.5 5 8 5 S12 10 14.5 7" /><circle cx="1.8" cy="11" r="1" fill="currentColor" /><circle cx="14.2" cy="7" r="1" fill="currentColor" /></svg>
  </a>
)

export default function JourneyShell() {
  const p = usePersona()
  const title = useDoc(doc, (d) => d.title)
  const personas = useDoc(doc, (d) => d.personas)
  const filterTag = useUI((s) => s.filterTag)
  const visible = useValues(params, (v) => v.visibleLanes)
  const mapRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => { mapElement.current = mapRef.current })
  const tags = allTags(p)

  /** N: add a card next to the selection (same cell), or into the first lane of the selected stage. */
  const addHere = () => {
    const s = ui.getState().sel
    const pr = persona()
    if (s?.kind === 'card') {
      const c = pr.cards.find((x) => x.id === s.id)
      if (c) addCard(c.lane, c.stage, cellCards(pr, c.lane, c.stage).findIndex((x) => x.id === c.id) + 1)
    } else {
      const lane = LANES.find((l) => l.id !== 'emotion' && params.values().visibleLanes.includes(l.id))?.id ?? 'actions'
      const stage = s?.kind === 'stage' ? s.id : pr.stages[0]?.id
      if (stage) addCard(lane, stage)
      else addStage()
    }
  }

  useHotkeys({
    'alt+arrowleft': () => nudgeCard(-1, 0),
    'alt+arrowright': () => nudgeCard(1, 0),
    'alt+arrowup': () => nudgeCard(0, -1),
    'alt+arrowdown': () => nudgeCard(0, 1),
    enter: () => { const s = ui.getState().sel; if (s?.kind === 'card') ui.setState({ editing: s.id }) },
    esc: () => { const s = ui.getState(); if (s.editing) ui.setState({ editing: null }); else if (s.sel) ui.setState({ sel: null }); else if (s.filterTag) ui.setState({ filterTag: null }) },
    ...Object.fromEntries(personas.slice(0, 9).map((x, i) => [String(i + 1), () => switchPersona(x.id)])),
  }, [personas])

  const exportItems: MenuItem[] = [
    { type: 'label', label: `Export ${p.name}’s journey` },
    { label: 'PNG image (2×)', icon: ImageIcon, shortcut: 'mod+e', onClick: () => exportPNG(2) },
    { label: 'CSV (one row per card)', icon: FileSpreadsheet, onClick: exportCSV },
    { label: 'Copy as Markdown', icon: ClipboardCopy, shortcut: 'shift+mod+c', onClick: copyMarkdown },
    { type: 'separator' },
    { label: 'Download all as JSON', icon: Braces, onClick: exportJourneyJSON },
    { label: 'Import JSON…', icon: Upload, onClick: importJourneyJSON },
  ]

  const commands: Command[] = [
    { id: 'add-card', label: 'Add card', group: 'Map', shortcut: 'n', icon: Plus, run: addHere, keywords: ['sticky', 'note', 'new'] },
    ...LANES.filter((l) => l.id !== 'emotion').map((l) => ({ id: `add-${l.id}`, label: `Add ${l.one.toLowerCase()}`, group: 'Map', icon: l.icon, run: () => { const s = ui.getState().sel; const pr = persona(); const stage = s?.kind === 'stage' ? s.id : s?.kind === 'card' ? pr.cards.find((c) => c.id === s.id)?.stage : pr.stages[0]?.id; if (stage) addCard(l.id, stage) } })),
    { id: 'add-stage', label: 'Add stage', group: 'Map', shortcut: 'shift+n', icon: Columns3, run: () => { const s = ui.getState().sel; const pr = persona(); addStage(s?.kind === 'stage' ? pr.stages.findIndex((x) => x.id === s.id) + 1 : undefined) } },
    { id: 'dup', label: 'Duplicate card', group: 'Edit', shortcut: 'mod+d', icon: Copy, run: duplicateCard },
    { id: 'del', label: 'Delete selection', group: 'Edit', shortcut: 'backspace,delete', icon: Trash2, run: deleteSelection },
    { id: 'fit', label: 'Zoom to fit', group: 'View', shortcut: 'shift+1', icon: Maximize2, run: fitMap },
    ...LANES.map((l) => ({ id: `lane-${l.id}`, label: `${visible.includes(l.id) ? 'Hide' : 'Show'} lane: ${l.label}`, group: 'View', icon: Rows3, run: () => {
      const cur = params.values().visibleLanes
      if (cur.includes(l.id) && cur.length === 1) return
      params.setValue('visibleLanes', cur.includes(l.id) ? cur.filter((x) => x !== l.id) : LANES.map((x) => x.id).filter((x) => x === l.id || cur.includes(x)))
    } })),
    ...tags.map(([t]) => ({ id: `tag-${t}`, label: `Highlight ${t}`, group: 'Highlight', icon: Tag, run: () => ui.setState({ filterTag: t }) })),
    { id: 'clear-tag', label: 'Clear highlight', group: 'Highlight', icon: X, run: () => ui.setState({ filterTag: null }) },
    ...personas.map((x) => ({ id: `persona-${x.id}`, label: `Switch to ${x.name}`, group: 'Personas', icon: UserRound, run: () => switchPersona(x.id) })),
    { id: 'new-persona', label: 'New persona', group: 'Personas', icon: Plus, run: addPersona },
    { id: 'png', label: 'Export PNG', group: 'Export', shortcut: 'mod+e', icon: ImageIcon, run: () => exportPNG(2) },
    { id: 'csv', label: 'Export CSV', group: 'Export', icon: FileSpreadsheet, run: exportCSV },
    { id: 'md', label: 'Copy as Markdown', group: 'Export', shortcut: 'shift+mod+c', icon: ClipboardCopy, run: copyMarkdown },
    { id: 'json', label: 'Download JSON', group: 'Export', icon: Braces, run: exportJourneyJSON },
    { id: 'import', label: 'Import JSON…', group: 'Export', icon: Upload, run: importJourneyJSON },
    { id: 'reset', label: 'Reset demo content', group: 'Export', icon: RotateCcw, run: () => { resetDemo(); toast('Demo restored') } },
  ]

  return (
    <Studio
      layout="docked"
      leftWidth={256}
      rightWidth={300}
      toolbar={
        <Toolbar
          start={<Brand name="Journey" doc={title} mark={Mark} />}
          center={
            <Cluster>
              <Menu trigger={<Button size="md" active={!!filterTag}><Tag size={14} strokeWidth={1.5} />{filterTag ?? 'Highlight'}<ChevronDown size={12} className="text-fg-faint" /></Button>}
                items={[
                  { type: 'label', label: 'Highlight cards by tag' },
                  ...(tags.length ? tags.map(([t, n]) => ({ label: `${t}  ·  ${n}`, checked: filterTag === t, onClick: () => ui.setState({ filterTag: filterTag === t ? null : t }) })) : [{ label: 'No tags yet', disabled: true, onClick: () => {} }]),
                  ...(filterTag ? [{ type: 'separator' } as MenuItem, { label: 'Clear highlight', icon: X, shortcut: 'esc', onClick: () => ui.setState({ filterTag: null }) }] : []),
                ]} />
              <Menu trigger={<Button size="md"><Rows3 size={14} strokeWidth={1.5} />Lanes <span className="text-fg-faint tabular">{visible.length}/{LANES.length}</span></Button>}
                items={[
                  { type: 'label', label: 'Visible lanes' },
                  ...LANES.map((l) => ({ label: l.label, checked: visible.includes(l.id), onClick: () => {
                    const cur = params.values().visibleLanes
                    if (cur.includes(l.id) && cur.length === 1) return
                    params.setValue('visibleLanes', cur.includes(l.id) ? cur.filter((x) => x !== l.id) : LANES.map((x) => x.id).filter((x) => x === l.id || cur.includes(x)))
                  } })),
                ]} />
              <Divider vertical />
              <Button size="md" onClick={addHere}><Plus size={14} strokeWidth={1.5} />Card</Button>
            </Cluster>
          }
          end={
            <>
              <Cluster>
                <HistoryControls history={history} />
                <Divider vertical />
                <PresetMenu params={params} />
                <ThemeToggle />
              </Cluster>
              <Menu align="end" trigger={<Button variant="primary" size="lg"><Download size={14} strokeWidth={1.75} />Export</Button>} items={exportItems} />
            </>
          }
        />
      }
      left={<PersonasPanel />}
      right={<JourneyInspector />}
    >
      <Stage camera={camera} grid padding={40} onBackgroundPointerDown={() => ui.setState({ sel: null, editing: null })} minZoom={0.2} maxZoom={3}>
        <JourneyMap mapRef={mapRef} />
      </Stage>
      <CommandPalette commands={commands} extraShortcuts={[
        { keys: 'enter', label: 'Edit selected card' }, { keys: 'alt+arrowleft', label: 'Move card / stage left' }, { keys: 'alt+arrowright', label: 'Move card / stage right' },
        { keys: 'alt+arrowup', label: 'Move card up' }, { keys: 'alt+arrowdown', label: 'Move card down' }, { keys: '1', label: 'Switch persona 1–9' },
        { keys: 'esc', label: 'Deselect / clear highlight' }, { keys: 'space', label: 'Hold to pan' }, { keys: 'shift+0', label: 'Zoom to 100%' },
      ]} />
    </Studio>
  )
}
