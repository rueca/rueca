/* ---------------------------------------------------------------------------
   Site + package identity. The ONE place the product's name lives.

   The landing page and the browser tab read this directly. Everything else
   that carries the name (skill folder, plugin manifest, component registry,
   package.json, README and docs) is regenerated from it:

     1. edit the values below
     2. npm run sync

   Placeholders in CAPS are decisions still open — see docs/LAUNCH.md.
--------------------------------------------------------------------------- */
export const site = {
  /** display name — headings, tab titles, toolbar brand */
  name: 'Rueca',
  /** machine name: skill id, plugin id, registry namespace, package name. lowercase-kebab, ≤64 chars */
  slug: 'rueca',
  tagline: 'Spin your prototype into a tool.',
  description:
    'Teaches your agent to wrap what you’ve already built in a design tool: inspector, timeline, layers, export and a client view. Ships as an agent skill, a Claude Code plugin and a component registry.',
  /** GitHub owner/repo */
  repo: 'rueca/rueca',
  /** where the site and the component registry are served from, no trailing slash.
      Hosted on Vercel (team RC IDP), deployed from main. */
  url: 'https://rueca.dev',
  author: { name: 'Rafael Cespedes', url: 'https://rafaelcespedes.com' },
  license: 'MIT',
  version: '0.2.0',
} as const

export const repoURL = `https://github.com/${site.repo}`
/** registry item URL, e.g. registryItem('inspector') → https://…/r/inspector.json */
export const registryItem = (name: string) => `${site.url}/r/${name}.json`
