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
  tagline: 'A design-tool harness for the prototype you already have.',
  description:
    'The inspector, timeline, layers and export of a real design tool, wrapped around any prototype. Ships as an agent skill, a Claude Code plugin and a component registry.',
  /** GitHub owner/repo */
  repo: 'rueca/rueca',
  /** where the site and the component registry are served from, no trailing slash.
      GitHub Pages until rueca.dev is bought and live — then switch and re-sync. */
  url: 'https://rueca.github.io/rueca',
  author: { name: 'Rafael Cespedes', url: 'https://rafaelcespedes.com' },
  license: 'MIT',
  version: '0.1.0',
} as const

export const repoURL = `https://github.com/${site.repo}`
/** registry item URL, e.g. registryItem('inspector') → https://…/r/inspector.json */
export const registryItem = (name: string) => `${site.url}/r/${name}.json`
