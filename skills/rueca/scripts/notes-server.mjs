#!/usr/bin/env node
/* ---------------------------------------------------------------------------
   notes-server.mjs — the notes route for a page with no dev server of its own
   (plain HTML, a static folder): runs it on its own port so the page can send
   notes to .rueca/notes/ and the agent can read them.

     node <skill>/scripts/notes-server.mjs                 # port 4388, notes in ./.rueca/notes
     node <skill>/scripts/notes-server.mjs --port 4390 --root ~/my-project

   The page talks to it with assets/rueca-notes.js (it finds this server on its
   own). Pages on any localhost port may use it (CORS for local origins only);
   nothing else is answered. Needs Node 23.6 or later (it runs the TypeScript
   handler in ../assets/notes-handler.ts directly).

   Already have a Node server for the page? Mount the handler there instead and
   skip this one: `import { createNotesHandler } from '<skill>/assets/notes-handler.ts'`,
   then `if (await handle(req, res)) return` first thing in your request handler.
--------------------------------------------------------------------------- */
import { createServer } from 'node:http'
import { resolve } from 'node:path'
import { createNotesHandler, NOTES_ROUTE } from '../assets/notes-handler.ts'

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}
const port = Number(arg('port', process.env.RUECA_NOTES_PORT || 4388))
const root = resolve(arg('root', process.cwd()))

const handle = createNotesHandler({ root, cors: 'local' })
const server = createServer(async (req, res) => {
  if (await handle(req, res)) return
  res.statusCode = 404
  res.setHeader('content-type', 'text/plain')
  res.end(`Rueca notes server: only ${NOTES_ROUTE} lives here.\n`)
})
server.on('error', (e) => {
  console.error(e.code === 'EADDRINUSE' ? `Port ${port} is taken. Try --port ${port + 1}.` : String(e))
  process.exit(1)
})
server.listen(port, '127.0.0.1', () => {
  console.log(`Rueca notes: http://127.0.0.1:${port}${NOTES_ROUTE} → ${resolve(root, '.rueca/notes')}`)
})
