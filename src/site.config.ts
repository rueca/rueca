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
  name: 'Prototype Studio',
  /** machine name: skill id, plugin id, registry namespace, package name. lowercase-kebab, ≤64 chars */
  slug: 'prototype-studio',
  tagline: 'A design-tool harness for the prototype you already have.',
  description:
    'Inspector, timeline, layers, presets and export — dropped in around any prototype, in any runtime, installed component by component and kept up to date. Ships as an agent skill, a Claude Code plugin and a component registry.',
  /** GitHub owner/repo */
  repo: 'OWNER/prototype-studio',
  /** where the site and the component registry are served from, no trailing slash */
  url: 'https://OWNER.github.io/prototype-studio',
  author: { name: 'Rafael Cespedes', url: '' },
  license: 'MIT',
  version: '0.1.0',
} as const

export const repoURL = `https://github.com/${site.repo}`
/** registry item URL, e.g. registryItem('inspector') → https://…/r/inspector.json */
export const registryItem = (name: string) => `${site.url}/r/${name}.json`
