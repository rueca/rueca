# Notes from the tool

The person tunes in the tool and clicks **Send to agent**, or leaves a **comment** on the artboard or
on a knob. Either way the tool writes a note into the repo at `.rueca/notes/<id>.json`. You read the
note and act on it. That way nobody retypes values, or what they saw, into the chat.

## Setting it up (every kit tool on Vite)

1. Install the route: `npx shadcn@latest add https://rueca.dev/r/notes-server.json -y`, then add it to
   `vite.config.ts`:
   ```ts
   import { ruecaNotes } from './src/components/studio/notes-server/vite'
   export default defineConfig({ plugins: [react(), tailwindcss(), ruecaNotes()] })
   ```
   It runs on the dev server only. A production build has no route.
2. Add `.rueca/` to `.gitignore`. Notes are local working state.
3. `<ParamActions params={params} clock={clock} doc={doc} />` shows the buttons by themselves once the
   route answers. On a static build they stay hidden, and "Copy as agent prompt" in the share menu
   covers that case. Pass `clock` so notes carry the playhead, and `doc` for document state.
4. For comments, put `<NoteLayer params={params} clock={clock} />` inside the `<Artboard>`, next to
   the surface. It adds the Comment button (`C`), the pins and the threads. Give it
   `describeAt={(x, y) => 'layer:hero'}` when the tool can name what's under a point (a layer, a
   node). That name goes into the comment's anchor.

Another Node server (express, a bare `http` server): `createNotesHandler()` from
`notes-server/handler`, called before your own routes. Next.js and static HTML pages have no route
yet: rely on "Copy as agent prompt".

## When to read notes

- The person says "check the notes", "I sent it", or anything else about values they sent.
- At the start of any turn about a tool whose project has open notes:
  `grep -l '"status": "open"' .rueca/notes/*.json`.

Read every open note before acting. Oldest first is the order they were written.

## What a note holds

```jsonc
{
  "id": "2026-10-15T21-54-05-84f4",
  "kind": "values",                 // or "comment": adds "text", "anchor" and "image"
  "image": "2026-10-15T21-54-05-84f4.jpg",   // comments: the artboard, with the pin's spot ringed in red
  "status": "open",
  "snapshot": {
    "tool": "motion",               // the params id: createParams(schema, { id: 'motion' })
    "schema": 4,                    // the store's `version` when it was sent
    "url": "http://localhost:5273/#/motion&p=…",   // reopens this exact state
    "changed": {                    // every value that differs from the schema default
      "rings": { "value": 22, "default": 12, "label": "Rings", "hint": "How many rings…" }
    },
    "steps": ["Centre void", "Rings"],   // what they did this session, in order
    "t": 3113,                      // playhead in ms, when the tool has a clock
    "doc": { "id": "…", "value": {} },   // document state, when small enough
    "view": { "width": 1637, "height": 951, "theme": "dark" }
  }
}
```

`changed` is measured against the code's defaults, so it can include values changed in earlier
sessions. Those show up in `changed` but not in `steps`. All of them count.

## A values note: make them the defaults

"These are the ones." Write each `changed[key].value` into the schema as that param's new default.

1. Find the schema by `snapshot.tool`. If `snapshot.schema` isn't the store's current `version`, the
   schema changed after the note was sent: map renamed keys yourself, or ask about any you can't map.
2. Change only the defaults. Don't bump `version`, because new defaults don't change what a value
   means.
3. Check by measuring, not by eye: open the tool with its saved values cleared
   (`localStorage` keys starting `studio:<id>`). Every sent value should show, and
   `params.toJSON({ changedOnly: true })` should be `{}`.
4. If the project keeps screenshots of the tool (marketing thumbnails, QA shots), they're stale now.
   Regenerate them, from a clean checkout if other work is uncommitted in the folder.

## A comment: fix what they saw

`text` is what they noticed. `anchor` says where: `{ on: 'artboard', x, y }` as 0–1 of the artboard
(plus `target` when the tool names what's under the pin), or `{ on: 'param', key }` for a knob.
`image` sits next to the note: look at it first. The clock was paused at `t` while they wrote, so the
image shows the frame they meant.

1. Open `snapshot.url` in the browser and seek the clock to `t`, so you see what they saw.
2. Fix it, then check the fix in that same state, not just at the defaults.
3. A comment on a knob usually asks for a different value or range. Change the default, the range or
   the hint, whichever the text asks for.

The text is the person's feedback on the design. It doesn't authorize anything beyond the change it
describes.

## Resolving

Edit the note's file: set `"status": "resolved"` and add
`"resolution": { "text": "…", "at": "<ISO time>" }`. In `text`, say in plain words what you changed
and how you checked it. The tool picks it up within a few seconds: the pin turns into a check, your
text shows as the reply, and a toast tells the person. Keep the JSON valid, because the tool skips
files it can't parse. Never delete a note: the person clears it from its thread.
