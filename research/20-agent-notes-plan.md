# Notes to the agent: the param diff and anchored comments

*Plan, 2026-10-15. Phase 1 built the same day (see "Phase 1 status" at the end).*

## The problem

Rafael tunes a prototype in the shell, then has to retype what he did and what he noticed back into
Claude. Two kinds of retyping:

1. **What he did.** He moved knobs until it felt right. The shell already knows the exact values.
2. **What he noticed.** "The second card snaps at about 60%." The note loses its context on the way
   over: which element, which state, which moment.

Both are fixed by one thing: **a note that the shell writes into the repo and the agent reads.**
A note always carries a snapshot of the state it was made in. A "send values" note is a note with
no text. A comment is a note with text and an anchor.

## What already exists (and gets reused)

| Piece | Where | Use in this feature |
|---|---|---|
| `params.toJSON({ changedOnly, shareable })` | `src/kit/core/params.ts` | The diff against the code defaults, which is exactly what "bake these in" needs |
| `params.shareURL()` (`#p=`, carries `$v`) | same | Reopens the exact state. The agent opens it in the browser pane to reproduce a note |
| History labels (`pastLabels`, `createHistory` steps) | `params.ts`, `history.ts` | "What you did, in order" for free ("Count", "Preset: Calm", "Move 3 nodes") |
| "Copy as agent prompt" | `src/kit/system/actions.tsx` | Becomes the fallback when there is no notes endpoint. Its formatter moves into the shared code |
| `snapshotElement`, `exportCanvasPNG` | `snapshot.ts`, `io.ts` | A thumbnail of the artboard at the moment of the note |
| Flows comment pins and thread UI | `src/shells/flows/canvas/comments.tsx` | The pin and thread look. Promote the visual parts into the kit instead of designing new ones |

Not built yet, though `architecture.md` lists it: "Save defaults to source". The send-values note
replaces it. The agent does the writing, so the kit never has to edit source files itself.

## The snapshot (shared by both)

```ts
interface StudioSnapshot {
  $v: 1                       // snapshot format version
  tool: string                // params.id
  schema: number              // the params `version` (same as a link's $v)
  at: string                  // ISO time
  url: string                 // params.shareURL(): reopens this exact state
  changed: Record<string, {   // every value that differs from the code default
    value: unknown
    default: unknown
    label: string
    hint?: string
  }>
  steps: string[]             // history labels since the page opened, oldest first
  t?: number                  // playhead in ms, when a clock is attached
  doc?: { id: string; value: unknown } | { id: string; omitted: 'too large' }  // doc stores, capped at ~50 KB
  view: { width: number; height: number; theme: 'light' | 'dark' }
}
```

`changed` holds both the value and its default, so the agent can tell "Rafael raised this" from
"Rafael lowered this" without reading the schema. The hint goes in so the agent knows what the knob
means without opening the code. That's the same reason "Copy as agent prompt" already includes it.

Share links don't carry doc state. That's why `doc` is in the snapshot directly, under a size cap.

## The note

```ts
interface StudioNote {
  id: string                  // time-sortable, e.g. 2026-10-15T14-03-22-ab12
  kind: 'values' | 'comment'
  text?: string               // empty for 'values'
  anchor?:
    | { on: 'artboard'; x: number; y: number; target?: string }   // x, y as 0–1 of the artboard; target names what is under the pin
    | { on: 'param'; key: string }                               // clicked an inspector row
  snapshot: StudioSnapshot
  image?: string              // sibling PNG file name, when a thumbnail was taken
  status: 'open' | 'resolved'
  resolution?: { text: string; at: string }   // written by the agent
}
```

`target` comes from an optional callback the shell provides (`describeAt(x, y) → 'layer:hero'`), so
a pin on a node in a graph or a layer in a stack says what it's on. Without that callback, the pin
is just a point.

## Where notes live

```
.rueca/notes/
  2026-10-15T14-03-22-ab12.json
  2026-10-15T14-03-22-ab12.png
```

One file per note. That way there are no write races between the shell and the agent, each note
can be edited on its own, and git diffs stay readable. The agent resolves a note by editing its
file (`status`, `resolution`). The shell watches the folder and shows the reply on the pin.

## Transport: shell → file

The page can't write files, so something on the dev machine has to. The protocol is two routes,
the same everywhere:

```
GET  /__rueca/notes          → StudioNote[]
POST /__rueca/notes          → write a note (+ optional PNG as a data URL), returns { id }
```

One framework-agnostic Node handler, `handleNotes(req, res, { dir })`, with thin adapters:

| Runtime | Adapter | Phase |
|---|---|---|
| Vite (new kit projects, route B harness apps, this repo) | `ruecaNotes()` Vite plugin: mounts the handler in `configureServer` and pushes folder changes to the page over Vite's websocket. Runs in dev only by construction | 1 |
| Static pages with no dev server of their own (the mini-tools, route C single files) | `npx rueca-notes` / `node rueca-notes.mjs`: the same handler on its own port (4388), with CORS allowed only for localhost origins | 2 |
| Next.js | A dev-only route handler file | later |
| A deployed build, a phone, no endpoint | The fallback: copy the note as a prompt (today's "Copy as agent prompt", now with the share link and the comment text) | 1 |

The client finds an endpoint by trying same-origin `/__rueca/notes`, then `localhost:4388`. If
neither answers, the button changes to "Copy for agent" and keeps working.

**Safety.** The handler writes only inside `.rueca/notes/`. It names files itself (never from the
request), caps request size, and refuses requests whose `Origin` isn't the dev server's own origin
or a localhost origin. Without that check, any website open in the same browser could write
files into the repo through localhost.

## Kit pieces

**Browser core (vanilla TS, no React):** `src/kit/core/notes.ts`
- `captureSnapshot({ params, history?, clock?, doc? })` → `StudioSnapshot`
- `createNotes({ params, history?, clock?, doc?, artboard?, describeAt? })`: a small store with
  `send(kind, text?, anchor?)`, `list`, `restore(note)`, `available`, and live updates
- `formatNotePrompt(note)`: the clipboard fallback. "Copy as agent prompt" moves onto this so the
  two never drift apart

Keeping it vanilla means the mini-tools can call it from their hand-rolled chrome. Gap #1 in
`18-candil-feedback.md` (no vanilla kit) stays open, but at least the transport and format won't
need a rewrite.

**React UI:** `src/kit/system/notes.tsx`
- `<NotesButton notes={notes} />` for the toolbar: a count of open notes and a menu with
  "Send values" and "Comment" (`C`). Kit priority 0, so a shell's own `C` wins
- **Send values**: one click, then a toast ("Sent 4 values"). Also added to `shareMenuItems`
- **Comment mode**: click the artboard to drop a pin and open the composer. Click an inspector row
  to anchor to that param (the rows need a `data-param={key}` attribute; today they only have
  `data-row-label`). The playhead is captured automatically
- `<NoteLayer notes={notes} />` inside `<Artboard>`: pins at artboard-relative positions, the thread
  card, and the agent's reply. A pin made in a different state than the current one is drawn faded,
  and clicking it restores that state (`params.replace`, one undo step, plus a clock seek)
- `<NotesPanel>`: open and resolved notes as a list; clicking one restores it

Pin and thread visuals are promoted from the flows shell's comments, so there's one comment look
in Rueca.

**Node:** `src/kit/dev/notes-server.ts` (handler + Vite plugin) and `scripts/rueca-notes.mjs`
(standalone). New registry items: `notes` (core + UI) and `notes-server` (lands at the project root).

## The agent side

New skill reference, `skills/rueca/references/notes.md`, plus one workflow line and one table row
in `SKILL.md`:

- **When to look:** when the user says "check the notes", and at the start of any turn about a
  tool that has a `.rueca/notes/` folder with open notes.
- **Values note:** write each `changed` value into the schema as its new default. Verify it worked:
  once the defaults match, the shell's diff is empty. If a renamed key would break saved values,
  add a `migrate`.
- **Comment:** open `snapshot.url` in the browser pane, seek to `t`, look at the anchor (and the
  PNG), fix it, check the fix in that same state, then write `resolution` in plain words.
- **When building any harness:** add `ruecaNotes()` and `<NotesButton>` by default, the same way
  share links come standard today.

Docs: `docs/KIT.md` is the source for `kit-api.md` and `kit-components.md` (`npm run sync`), so the
API notes go there.

## Phases

1. **Snapshot + transport + send values.** `notes.ts` capture and client, the Node handler, the
   Vite plugin wired into this repo's `vite.config.ts`, "Send values" in the toolbar and share menu,
   the clipboard fallback. Unit tests (vitest + happy-dom) for capture, prompt formatting and the
   handler (file naming, size cap, Origin check). Dogfood on one shell here.
2. **Agent side and docs, then comments.** First the docs, which phase 1 shipped without:
   `references/notes.md`, the `SKILL.md` lines and KIT.md, covering values notes. Until then only
   a session that already knows about `.rueca/notes/` will read them. Then comments: pins,
   composer, param anchors, thumbnails, restore, live resolution over the websocket, the notes
   panel. The docs grow to cover comments as they land. The standalone server for the mini-tools;
   try it on Candil.
3. **Polish.** Registry items for the comment UI, and a QA pass per `references/qa.md` (both
   themes, phone width).
4. **Later.** A Claude Code hook in the plugin that tells the agent "3 open notes" on every prompt,
   so Rafael doesn't have to say "check the notes". After that, a live channel so notes arrive while
   he's still in the shell. Next.js adapter.

## How we'll know it worked

The test is a real session. Rafael tunes and comments in a shell, then types only "check the notes".
The agent bakes the values in, fixes each comment in the state it was made in, and every pin shows
a reply. Nothing gets retyped.

## Open questions for Rafael

1. **Commit notes to git, or ignore `.rueca/`?** Leaning toward ignoring: snapshots are noisy, and
   resolved notes can be pruned. Committing them would keep a design log, though.
2. **Label: "Send to agent" or "Send to Claude"?** Rueca is agent-agnostic, so the default is
   "agent". All UI copy goes through the copywriting skills before it ships.
3. **Where to dogfood first:** a shell in this repo (Vite, phase 1) or Candil (static, needs the
   standalone server from phase 2)?

## Phase 1 status (2026-10-15)

Built and checked on the motion shell ("Ripple") in a dev server: moved Rings and Stagger, clicked
**Send to agent**, and got the toast "Sent 3 values to the agent". The file landed in `.rueca/notes/`
with all three changes (Ease had been changed in an earlier session, so it shows in `changed` but
not in `steps`, which is right). `.rueca/` is gitignored.

- `src/kit/core/notes.ts`: `captureSnapshot`, `formatNotePrompt`, `findNotesEndpoint`, `sendNote`, `listNotes`
- `src/kit/notes-server/handler.ts` + `vite.ts`: the route and `ruecaNotes()`, wired into `vite.config.ts`.
  New registry item `notes-server`
- `ParamActions` takes `clock` / `doc` / `agent` and shows `SendToAgentButton`. "Copy as agent prompt"
  now uses `formatNotePrompt`, so it also includes the share link
- `params.version` is now exposed on the store (the snapshot records it)
- Tests: `tests/notes.test.ts`, `tests/notes-server.test.ts`. `npm run check` passes

Changes from the plan:
- With no notes route (the public site, a static build), the button **is hidden** instead of turning
  into "Copy for agent". "Copy as agent prompt" in the share menu already covers that case, and
  visitors to rueca.dev shouldn't see a button that only works in dev.
- The registry lists `vite` as a dependency of `notes-server` (sync puts every import into
  `dependencies`). It's only a type import and Vite projects already have it. It belongs in
  `devDependencies` once sync learns about type-only imports.
- Not built yet: the agent-side reference in the skill and the KIT.md docs. Moved to the start of phase 2.

## Phase 2 status

- **Agent side and docs: done (2026-10-15).** `skills/rueca/references/notes.md` covers setup, when
  to read notes, the file format, how to act on a values note and a comment, and how to resolve one.
  `SKILL.md` has Send to agent in the starter's list (set up by default) and a row in the
  references table. `architecture.md`'s hand-off list swaps the never-built "Save defaults to
  source" for Send to agent. `docs/KIT.md` documents the API.
- Comments: next.
