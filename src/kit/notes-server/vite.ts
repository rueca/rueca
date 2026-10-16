/* ---------------------------------------------------------------------------
   ruecaNotes() — the notes route on Vite's dev server. Lets the tool's
   "Send to agent" and comments write into .rueca/notes/ (add .rueca/ to
   .gitignore).

     // vite.config.ts
     import { ruecaNotes } from './rueca/notes-server/vite'
     export default defineConfig({ plugins: [react(), ruecaNotes()] })

   Dev server only (`apply: 'serve'`): a production build has no route, so the
   notes buttons stay hidden there ("Copy as agent prompt" in the share menu
   still works). Hosts named in Vite's `server.allowedHosts` are answered too.
--------------------------------------------------------------------------- */
import type { Plugin } from 'vite'
import { createNotesHandler, type NotesHandlerOptions } from './handler'

export function ruecaNotes(opts: Omit<NotesHandlerOptions, 'root'> = {}): Plugin {
  return {
    name: 'rueca-notes',
    apply: 'serve',
    configureServer(server) {
      const hosts = server.config.server.allowedHosts
      const handle = createNotesHandler({ root: server.config.root, allowedHosts: hosts === true ? true : Array.isArray(hosts) ? hosts : undefined, ...opts })
      server.middlewares.use((req, res, next) => {
        handle(req, res).then((done) => { if (!done) next() }, next)
      })
    },
  }
}
