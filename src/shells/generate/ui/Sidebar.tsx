/* Left panel: boards (All, Favourites, custom) and sessions. */
import { useRef, useState } from 'react'
import { Images, Heart, FolderHeart, Plus, MoreHorizontal, Pencil, Braces, Trash2, FolderOpen, MessagesSquare } from 'lucide-react'
import { Panel, PanelHeader, IconButton, Menu, toast, cn } from '@kit'
import { useGallery, setView, newSession, renameSession, deleteSession, newBoard, renameBoard, deleteBoard, type View, type ImageRec } from '../state/gallery'
import { usePix } from '../state/images'
import { exportSession, importSession } from '../state/actions'
import { InlineEdit } from '../local/InlineEdit'

const same = (a: View, b: View) => a.type === b.type && ('id' in a ? a.id : '') === ('id' in b ? b.id : '')

function Thumb({ rec }: { rec?: ImageRec }) {
  const pix = usePix(rec?.id, rec?.params, 'thumb')
  return (
    <span className="relative size-8 shrink-0 overflow-hidden rounded-[6px] bg-well shadow-[inset_0_0_0_1px_var(--line)]">
      {pix && <img src={pix.url} alt="" className="h-full w-full object-cover" draggable={false} />}
    </span>
  )
}

function NavRow({ view, icon: Icon, label, count, active }: { view: View; icon: typeof Images; label: string; count: number; active: boolean }) {
  return (
    <button type="button" onClick={() => setView(view)} aria-current={active || undefined}
      className={cn('flex h-8 w-full items-center gap-2 rounded-[6px] px-2 text-left text-[12px] outline-none focus-visible:ring-2 focus-visible:ring-signal', active ? 'bg-active text-fg' : 'text-fg-muted hover:bg-hover hover:text-fg')}>
      <Icon size={14} strokeWidth={1.5} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="tabular text-[11px] text-fg-faint">{count}</span>
    </button>
  )
}

const ago = (t: number) => {
  const m = (Date.now() - t) / 60000
  if (m < 1) return 'just now'
  if (m < 60) return `${Math.round(m)} min ago`
  if (m < 60 * 24) return `${Math.round(m / 60)} h ago`
  return `${Math.round(m / 1440)} d ago`
}

export function Sidebar() {
  const view = useGallery((s) => s.view)
  const sessions = useGallery((s) => s.sessions)
  const boards = useGallery((s) => s.boards)
  const images = useGallery((s) => s.images)
  const [editing, setEditing] = useState<string | null>(null)
  const file = useRef<HTMLInputElement>(null)

  return (
    <Panel
      header={
        <PanelHeader title="Library">
          <Menu align="end" trigger={<IconButton icon={MoreHorizontal} label="Library options" size="icon-sm" />}
            items={[
              { label: 'Import session JSON…', icon: FolderOpen, shortcut: 'mod+o', onClick: () => file.current?.click() },
              { label: 'New board…', icon: FolderHeart, onClick: () => { const n = prompt('Board name', `Board ${boards.length + 1}`); if (n) { const b = newBoard(n); setView({ type: 'board', id: b.id }) } } },
            ]} />
          <IconButton icon={Plus} label="New session" shortcut="n" size="icon-sm" onClick={() => newSession()} />
        </PanelHeader>
      }
    >
      <input ref={file} type="file" accept=".json,application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void importSession(f); e.target.value = '' }} />
      <div className="flex flex-col gap-px p-1.5">
        <NavRow view={{ type: 'all' }} icon={Images} label="All images" count={images.length} active={same(view, { type: 'all' })} />
        <NavRow view={{ type: 'favourites' }} icon={Heart} label="Favourites" count={images.filter((i) => i.favourite).length} active={same(view, { type: 'favourites' })} />
        {boards.map((b) => {
          const active = same(view, { type: 'board', id: b.id })
          return (
            <div key={b.id} className="group/row relative">
              {editing === b.id ? (
                <div className="flex h-8 items-center gap-2 px-2"><FolderHeart size={14} strokeWidth={1.5} className="text-fg-muted" />
                  <InlineEdit value={b.name} editing onEditingChange={(e) => !e && setEditing(null)} onCommit={(n) => renameBoard(b.id, n)} className="flex-1 text-[12px]" />
                </div>
              ) : <NavRow view={{ type: 'board', id: b.id }} icon={FolderHeart} label={b.name} count={images.filter((i) => i.boards?.includes(b.id)).length} active={active} />}
              <div className="absolute top-1 right-7 opacity-0 group-hover/row:opacity-100 group-focus-within/row:opacity-100">
                <Menu align="end" trigger={<IconButton icon={MoreHorizontal} label="Board options" size="icon-sm" />}
                  items={[
                    { label: 'Rename', icon: Pencil, onClick: () => setEditing(b.id) },
                    { label: 'Delete board', icon: Trash2, danger: true, onClick: () => { deleteBoard(b.id); toast(`Deleted board “${b.name}”`, { description: 'Images stay in their sessions.' }) } },
                  ]} />
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-1.5 border-t border-line px-3 pt-3 pb-1 text-[11.5px] font-medium text-fg"><MessagesSquare size={13} strokeWidth={1.5} className="text-fg-muted" />Sessions</div>
      <div className="flex flex-col gap-px p-1.5 pt-0">
        {sessions.map((s) => {
          const list = images.filter((i) => i.sessionId === s.id)
          const active = same(view, { type: 'session', id: s.id })
          const latest = list[0]
          return (
            <div key={s.id} className="group/row relative">
              <button type="button" onClick={() => setView({ type: 'session', id: s.id })} onDoubleClick={() => setEditing(s.id)} aria-current={active || undefined}
                className={cn('flex w-full items-center gap-2.5 rounded-[8px] p-1.5 pr-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-signal', active ? 'bg-active' : 'hover:bg-hover')}>
                <Thumb rec={latest} />
                <span className="flex min-w-0 flex-1 flex-col">
                  {editing === s.id
                    ? <InlineEdit value={s.name} editing onEditingChange={(e) => !e && setEditing(null)} onCommit={(n) => renameSession(s.id, n)} className="text-[12px]" />
                    : <span className={cn('truncate text-[12px]', active ? 'font-medium text-fg' : 'text-fg')}>{s.name}</span>}
                  <span className="tabular truncate text-[11px] text-fg-faint">{list.length} images · {ago(latest?.createdAt ?? s.createdAt)}</span>
                </span>
              </button>
              <div className="absolute top-2 right-1.5 opacity-0 group-hover/row:opacity-100 group-focus-within/row:opacity-100">
                <Menu align="end" trigger={<IconButton icon={MoreHorizontal} label="Session options" size="icon-sm" />}
                  items={[
                    { label: 'Rename', icon: Pencil, onClick: () => setEditing(s.id) },
                    { label: 'Export session JSON', icon: Braces, onClick: () => { setView({ type: 'session', id: s.id }); exportSession() } },
                    { type: 'separator' },
                    {
                      label: 'Delete session', icon: Trash2, danger: true, onClick: () => {
                        const undo = deleteSession(s.id)
                        if (undo) toast(`Deleted “${s.name}”`, { description: `${list.length} images`, action: { label: 'Undo', onClick: undo }, timeout: 6000 })
                      },
                    },
                  ]} />
              </div>
            </div>
          )
        })}
      </div>
      <div className="px-3 pt-1 pb-3 text-[11px] leading-relaxed text-fg-faint">Images re-render from their parameters, so history costs almost no storage.</div>
    </Panel>
  )
}

