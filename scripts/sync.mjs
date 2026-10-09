/* ---------------------------------------------------------------------------
   sync — regenerate everything derived from src/site.config.ts and src/kit.

     npm run sync            # after editing site.config.ts or the kit
     npm run sync -- --check # CI: fail if anything committed is out of date
     npm run sync -- --registry-url http://localhost:5276   # install-test against a local server

   1. Rename: if name / slug / repo / url changed since the last sync
      (.site-lock.json), rewrite them across the docs and the skill, and move
      skills/<old-slug> → skills/<new-slug>.
   2. Skill assets: copy docs/KIT.md, src/kit/theme.css and
      public/studio-bridge.js into the skill so it is self-contained.
      Regenerate the example-shell table in references/layouts.md.
   3. Plugin: .claude-plugin/plugin.json + marketplace.json.
   4. Registry: registry.json + public/r/<item>.json (shadcn format, file
      contents inlined). Items and their dependencies are derived from the
      kit's imports, so a new kit file needs no registration.
   5. package.json identity fields.
--------------------------------------------------------------------------- */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, renameSync, rmSync } from 'node:fs'
import { dirname, join, relative, posix } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CHECK = process.argv.includes('--check')
const r = (...p) => join(ROOT, ...p)
const read = (p) => readFileSync(r(p), 'utf8')
const changed = []
const write = (p, text) => {
  const full = r(p)
  if (existsSync(full) && readFileSync(full, 'utf8') === text) return
  changed.push(p)
  if (CHECK) return
  mkdirSync(dirname(full), { recursive: true })
  writeFileSync(full, text)
}
const json = (o) => JSON.stringify(o, null, 2) + '\n'
const walk = (dir) => existsSync(r(dir))
  ? readdirSync(r(dir)).flatMap((f) => { const p = posix.join(dir, f); return statSync(r(p)).isDirectory() ? walk(p) : [p] })
  : []

const { site, repoURL } = await import(pathToFileURL(r('src/site.config.ts')).href)
const pkg = JSON.parse(read('package.json'))

/* 1 ── rename ───────────────────────────────────────────────────────────── */
const LOCK = '.site-lock.json'
const ident = { name: site.name, slug: site.slug, repo: site.repo, url: site.url }
const prev = existsSync(r(LOCK)) ? JSON.parse(read(LOCK)) : ident
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(site.slug) || site.slug.length > 64) throw new Error(`site.slug "${site.slug}" must be lowercase-kebab, ≤64 chars`)
if (prev.slug !== site.slug && existsSync(r('skills', prev.slug))) {
  if (CHECK) changed.push(`skills/${prev.slug} → skills/${site.slug}`)
  else renameSync(r('skills', prev.slug), r('skills', site.slug))
}
const SKILL = `skills/${site.slug}`
// longest first, so the url and repo (which contain the slug) are replaced whole
const swaps = ['url', 'repo', 'slug', 'name'].filter((k) => prev[k] !== ident[k]).map((k) => [prev[k], ident[k]])
if (swaps.length) {
  const docs = ['README.md', 'CONTRIBUTING.md', ...walk('docs'), ...walk('.github'), ...walk(SKILL)]
    .filter((p) => /\.(md|ya?ml|json)$/.test(p) && p !== 'docs/SESSION-CONTEXT.md')
  for (const p of docs) {
    let t = read(p)
    for (const [a, b] of swaps) t = t.split(a).join(b)
    write(p, t)
  }
}
write(LOCK, json(ident))

/* 2 ── skill assets ────────────────────────────────────────────────────── */
const skillMd = read(`${SKILL}/SKILL.md`).replace(/^name: .*$/m, `name: ${site.slug}`)
write(`${SKILL}/SKILL.md`, skillMd)

const banner = (src) => `<!-- Copied from ${src} by \`npm run sync\`. Edit the source, not this file. -->\n\n`
write(`${SKILL}/references/kit-api.md`, banner('docs/KIT.md') +
  `> In a project that installed the kit from the registry, \`@kit\` means \`@/components/studio\` ` +
  `(or alias it). Live examples of every shell: ${site.url}/ · source: ${repoURL}/tree/main/src/shells\n\n` +
  read('docs/KIT.md'))
write(`${SKILL}/assets/theme.css`, `/* Copied from src/kit/theme.css by \`npm run sync\`. */\n` + read('src/kit/theme.css'))
write(`${SKILL}/assets/studio-bridge.js`, read('public/studio-bridge.js'))

const metaField = (src, k) => src.match(new RegExp(`${k}:\\s*(['"\`])((?:\\\\.|(?!\\1).)*)\\1`))?.[2]
const shells = readdirSync(r('src/shells'))
  .filter((d) => existsSync(r('src/shells', d, 'meta.ts')) && existsSync(r('src/shells', d, 'index.tsx')))
  .map((d) => { const s = read(`src/shells/${d}/meta.ts`); return { id: metaField(s, 'id') ?? d, name: metaField(s, 'name') ?? d, archetype: metaField(s, 'archetype') ?? '', order: +(s.match(/order:\s*(\d+)/)?.[1] ?? 99) } })
  .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
const table = ['| Shell | Archetype | Live | Source |', '|---|---|---|---|',
  ...shells.map((s) => `| ${s.name} | ${s.archetype} | [open](${site.url}/#/${s.id}) | [src/shells/${s.id}](${repoURL}/tree/main/src/shells/${s.id}) |`)].join('\n')
const layouts = read(`${SKILL}/references/layouts.md`)
  .replace(/(<!-- shells:start[^>]*-->)[\s\S]*?(<!-- shells:end -->)/, `$1\n${table}\n$2`)
write(`${SKILL}/references/layouts.md`, layouts)

/* 3 ── Claude Code plugin ──────────────────────────────────────────────── */
const author = { name: site.author.name, ...(site.author.url ? { url: site.author.url } : {}) }
const keywords = ['design-tools', 'prototyping', 'inspector', 'timeline', 'motion', 'shadcn', 'skills']
write('.claude-plugin/plugin.json', json({
  name: site.slug, displayName: site.name, version: site.version, description: site.description,
  author, homepage: site.url, repository: repoURL, license: site.license, keywords,
}))
write('.claude-plugin/marketplace.json', json({
  name: site.slug, owner: author, description: site.tagline,
  plugins: [{ name: site.slug, source: './', description: site.description, version: site.version }],
}))

/* 4 ── component registry ──────────────────────────────────────────────── */
const KIT = 'src/kit'
const deps = { ...pkg.dependencies, ...pkg.devDependencies }
const pkgName = (spec) => spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]
const PEERS = new Set(['react', 'react-dom'])
// ui/ and system/ ship file by file; every other folder ships as one item
const itemOf = (file) => {
  const rel = relative(KIT, file).split('/')
  if (rel.length === 1) return rel[0] === 'theme.css' ? 'theme' : 'studio'
  if (rel[0] === 'ui' || rel[0] === 'system') return rel[1].replace(/\.tsx?$/, '')
  return rel[0] === 'layout' ? 'studio-layout' : rel[0]
}
const ABOUT = {
  studio: ['Studio kit (everything)', 'The whole harness: schema → inspector, clock, surfaces, layout, stage, timeline, layers, palette, toasts and theme.'],
  theme: ['Studio theme', 'Contrast-audited dark + light tokens via @theme inline. Import it as the last line of your main CSS.'],
  core: ['Core', 'Schema, param store (undo, presets, A/B, share), clock, hotkeys, IO and theme hook. Framework-agnostic.'],
  inspector: ['Inspector', 'Turns a schema into sections and rows with reset, hints and the changed-from-default cue.'],
  timeline: ['Timeline', 'Ruler, lanes, keys, markers and a playhead driven by the clock.'],
  layers: ['Layer tree', 'Layers with eye/lock, rename, drag to reorder, and tree helpers.'],
  stage: ['Stage and surfaces', 'Pan/zoom canvas camera, artboards, and Canvas / Mount / Frame surfaces for any runtime.'],
  'studio-layout': ['Studio layout', 'Islands, overlay and docked layouts, toolbar, brand, clusters, tool dock, panels.'],
  scrub: ['Scrub value', 'Drag, type or write expressions into a number. Shift ×10, Alt ×0.1.'],
  color: ['Colour', 'Colour field, panel and swatches with OKLCH.'],
  bridge: ['Studio bridge', '2 KB script that lets the harness drive any page inside an iframe via postMessage.'],
}
/* The registry copy of theme.css lands next to an existing stylesheet — often
   shadcn's, whose @theme also defines muted / accent / input / font-sans.
   Imported LAST, the kit's @theme wins (Tailwind v4 inlines @import anywhere);
   doubling :root also lifts the raw tokens above shadcn's .dark block. The
   user's main CSS already imports tailwindcss. Verified against a fresh
   `shadcn init` project. */
const registryTheme = (css) => '/* Installed from the ' + site.name + ' registry.\n' +
  '   Import it as the LAST line of your main CSS so its tokens win over any shadcn theme:\n' +
  '     @import "./components/studio/theme.css";\n   */\n' +
  css.replace(/^@import "tailwindcss";\n/m, '').replace(/^:root(?=[\s.[{])/gm, ':root:root')
const files = walk(KIT).filter((f) => /\.(tsx?|css)$/.test(f))
const items = new Map()
const ensure = (name) => items.get(name) ?? items.set(name, { name, files: [], deps: new Set(), reg: new Set() }).get(name)
for (const f of files) {
  const it = ensure(itemOf(f))
  const isCss = f.endsWith('.css')
  const src = isCss ? registryTheme(read(f)) : read(f)
  it.files.push({
    path: f,
    type: isCss ? 'registry:file' : f.endsWith('.tsx') ? 'registry:component' : 'registry:lib',
    target: `@components/studio/${relative(KIT, f)}`,
    content: src,
  })
  for (const [, spec] of src.matchAll(/(?:from|import)\s+['"]([^'"]+)['"]/g)) {
    if (spec.startsWith('.')) {
      const target = posix.normalize(posix.join(posix.dirname(f), spec))
      const hit = files.find((g) => g === target || g.replace(/\.(tsx?|css)$/, '') === target || g === `${target}/index.ts`)
      const other = hit && itemOf(hit)
      if (other && other !== it.name) it.reg.add(other)
    } else if (!spec.startsWith('@kit') && !spec.startsWith('@/')) {
      const name = pkgName(spec)
      if (!PEERS.has(name) && deps[name]) it.deps.add(`${name}@${deps[name]}`)
    }
  }
}
// every component needs the tokens; the barrel needs every item
ensure('core').reg.add('theme')
for (const name of items.keys()) if (name !== 'studio') ensure('studio').reg.add(name)
ensure('bridge').files.push({ path: 'public/studio-bridge.js', type: 'registry:file', target: '~/public/studio-bridge.js', content: read('public/studio-bridge.js') })

// cycles make the CLI resolve forever on some versions — fail loudly instead
const seen = new Set(), stack = new Set()
const visit = (n, path) => {
  if (stack.has(n)) throw new Error(`registry dependency cycle: ${[...path, n].join(' → ')}`)
  if (seen.has(n)) return
  stack.add(n); items.get(n)?.reg.forEach((d) => visit(d, [...path, n])); stack.delete(n); seen.add(n)
}
items.forEach((_, n) => visit(n, []))

// --registry-url http://localhost:5276 builds the registry against a local server, for install tests
const regFlag = process.argv.indexOf('--registry-url')
const REG = regFlag > 0 ? process.argv[regFlag + 1].replace(/\/$/, '') : site.url
const itemURL = (n) => `${REG}/r/${n}.json`
const title = (n) => ABOUT[n]?.[0] ?? n.replace(/(^|-)(\w)/g, (_, s, c) => (s ? ' ' : '') + c.toUpperCase())
const entries = [...items.values()].sort((a, b) => (a.name === 'studio' ? -1 : b.name === 'studio' ? 1 : a.name.localeCompare(b.name))).map((it) => ({
  name: it.name,
  type: it.name === 'studio' ? 'registry:block' : it.name === 'theme' ? 'registry:style' : it.files.every((f) => f.type === 'registry:lib') ? 'registry:lib' : it.name === 'bridge' ? 'registry:file' : 'registry:component',
  title: title(it.name),
  description: ABOUT[it.name]?.[1] ?? `${title(it.name)} — part of the ${site.name} kit.`,
  ...(it.name === 'theme' ? { extends: 'none' } : {}),
  dependencies: [...it.deps].sort(),
  registryDependencies: [...it.reg].sort().map(itemURL),
  files: it.files.sort((a, b) => a.path.localeCompare(b.path)),
}))
const index = { $schema: 'https://ui.shadcn.com/schema/registry.json', name: site.slug, homepage: site.url }
write('registry.json', json({ ...index, items: entries.map((e) => ({ ...e, files: e.files.map(({ content, ...f }) => f) })) }))
if (!CHECK) rmSync(r('public/r'), { recursive: true, force: true })
write('public/r/registry.json', json({ ...index, items: entries.map(({ files, ...e }) => e) }))
for (const e of entries) write(`public/r/${e.name}.json`, json({ $schema: 'https://ui.shadcn.com/schema/registry-item.json', ...e }))

/* 5 ── package.json ────────────────────────────────────────────────────── */
const nextPkg = { ...pkg, name: site.slug, version: site.version, description: site.description, license: site.license,
  author: site.author.name, homepage: site.url, repository: { type: 'git', url: `git+${repoURL}.git` }, bugs: `${repoURL}/issues` }
write('package.json', json(nextPkg))

/* ── report ─────────────────────────────────────────────────────────────── */
const generated = (p) => p.startsWith('public/r/')
const real = changed.filter((p) => !generated(p))
if (CHECK) {
  if (real.length) { console.error(`Out of date — run \`npm run sync\`:\n  ${real.join('\n  ')}`); process.exit(1) }
  console.log('sync: up to date')
} else {
  console.log(`sync: ${entries.length} registry items, ${shells.length} shells${swaps.length ? `, renamed ${swaps.map(([a, b]) => `"${a}" → "${b}"`).join(', ')}` : ''}`)
  if (real.length) console.log(`  updated: ${real.join(', ')}`)
}
