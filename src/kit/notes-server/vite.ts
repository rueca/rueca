/* ---------------------------------------------------------------------------
   ruecaNotes() — the notes route on Vite's dev server. Lets the tool's
   "Send to agent" write into .rueca/notes/ (add .rueca/ to .gitignore).

     // vite.config.ts
     import { ruecaNotes } from './src/components/studio/notes-server/vite'
     export default defineConfig({ plugins: [react(), ruecaNotes()] })

   Dev server only (`apply: 'serve'`): a production build has no route, and the
   tool falls back to copying the note as a prompt.
--------------------------------------------------------------------------- */
import type { Plugin } from 'vite'
import { createNotesHandler, type NotesHandlerOptions } from './handler'

export function ruecaNotes(opts: Omit<NotesHandlerOptions, 'root'> = {}): Plugin {
  return {
    name: 'rueca-notes',
    apply: 'serve',
    configureServer(server) {
      const handle = createNotesHandler({ root: server.config.root, ...opts })
      server.middlewares.use((req, res, next) => {
        handle(req, res).then((done) => { if (!done) next() }, next)
      })
    },
  }
}
