#!/usr/bin/env node
/* ---------------------------------------------------------------------------
   open-notes.mjs — a Claude Code UserPromptSubmit hook. Before each message,
   it counts the notes in .rueca/notes/ waiting on the agent and tells it, so
   nobody has to type "check the notes". Waiting means: a values note nobody
   has answered, or a comment thread that isn't done and where the person
   spoke last (a new comment, or their reply to the agent's answer).

     // hooks: UserPromptSubmit → node <skill>/scripts/open-notes.mjs
     // (the Rueca plugin wires it in hooks/hooks.json)

   Looks in <project>/.rueca/notes and in each folder one level down (<project>/<folder>/.rueca/notes,
   for a harness app in its own folder). Prints nothing when nothing is open.
   Only counts and tool names go into the context, never a note's text: notes
   are written by a page, so their words reach the agent only when it reads the
   files on purpose (references/notes.md says how to treat them).
   Never fails the prompt: any error means silence.
--------------------------------------------------------------------------- */
import { readdirSync, readFileSync, lstatSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'

try {
  const root = process.env.CLAUDE_PROJECT_DIR || process.cwd()
  const folders = [join(root, '.rueca', 'notes')]
  for (const d of readdirSync(root, { withFileTypes: true })) {
    if (d.isDirectory() && !d.name.startsWith('.') && d.name !== 'node_modules') folders.push(join(root, d.name, '.rueca', 'notes'))
  }
  const open = []
  for (const dir of folders) {
    if (!existsSync(dir)) continue
    for (const f of readdirSync(dir)) {
      if (!f.endsWith('.json')) continue
      const file = join(dir, f)
      try {
        if (!lstatSync(file).isFile()) continue
        const n = JSON.parse(readFileSync(file, 'utf8'))
        if ((n?.kind !== 'comment' && n?.kind !== 'values') || typeof n?.snapshot?.tool !== 'string' || n.status === 'done') continue
        const replies = Array.isArray(n.replies) ? n.replies : []
        const last = replies[replies.length - 1]
        const who = String(last?.from ?? last?.who ?? last?.author ?? last?.role ?? '').toLowerCase()
        // the format before threads: `resolution` or status 'resolved' meant the agent had answered
        const answered = n.resolution !== undefined || n.status === 'resolved'
        const personLast = last ? ['person', 'you', 'user', 'human'].includes(who) : !answered
        if (personLast) open.push({ kind: n.kind, tool: n.snapshot.tool, dir, reply: !!last })
      } catch { /* half-written or hand-broken: the tool skips it too */ }
    }
  }
  if (open.length) {
    const comments = open.filter((n) => n.kind === 'comment').length
    const replies = open.filter((n) => n.reply).length
    const values = open.length - comments
    const parts = [comments && `${comments} comment${comments === 1 ? '' : 's'}${replies ? ` (${replies === comments ? (comments === 1 ? 'a reply' : 'all replies') : replies === 1 ? 'one of them a reply' : `${replies} of them replies`} to your earlier answers)` : ''}`,
      values && `${values} values note${values === 1 ? '' : 's'}`].filter(Boolean).join(' and ')
    // tool ids are code identifiers; keep only that shape so nothing else rides along
    const tools = [...new Set(open.map((n) => n.tool).filter((t) => /^[\w:.-]{1,60}$/.test(t)))]
    const where = [...new Set(open.map((n) => relative(root, n.dir) || '.'))].join(', ')
    const context = `Rueca: ${parts} from the tool ${open.length === 1 ? 'is' : 'are'} waiting in ${where}${tools.length ? ` (${tools.join(', ')})` : ''}. ` +
      'The person expects you to pick these up without being asked: unless their message is clearly about something else, ' +
      'read and act on them first, following the rueca skill\'s references/notes.md (answer each one by adding your reply to its "replies", ' +
      'so it shows on the pin; never mark a comment done, the person does that). ' +
      'If the message is about something else, do that and mention the waiting notes in one line at the end.'
    process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: context } }))
  }
} catch { /* silence: a notes count must never block a prompt */ }
