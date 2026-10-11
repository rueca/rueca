import type { ComponentType } from 'react'
import type { ShellMeta } from '@/shells/types'

/* Every folder in src/shells with a meta.ts + index.tsx registers itself.
   Nothing to edit here when a shell is added. */
const metas = import.meta.glob<{ meta: ShellMeta }>('../shells/*/meta.ts', { eager: true })
const modules = import.meta.glob<{ default: ComponentType }>('../shells/*/index.tsx')

export type Shell = ShellMeta & { load: () => Promise<{ default: ComponentType }> }

export const SHELLS: Shell[] = Object.entries(metas)
  .map(([path, m]) => {
    const dir = path.split('/')[2]
    const load = modules[`../shells/${dir}/index.tsx`] as (() => Promise<{ default: ComponentType }>) | undefined
    return load ? { ...m.meta, load } : null
  })
  .filter((x): x is NonNullable<typeof x> => !!x)
  .sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || a.name.localeCompare(b.name))

/** Routes the app owns besides shells. A shell can never take these ids. */
export const RESERVED_ROUTES = ['', 'shells'] as const
if (import.meta.env.DEV) for (const s of SHELLS) if ((RESERVED_ROUTES as readonly string[]).includes(s.id))
  throw new Error(`[studio] shell id "${s.id}" is a reserved route (${RESERVED_ROUTES.map((r) => `"${r}"`).join(', ')}) — rename it in its meta.ts`)

/** Marketing thumbnail: the neutral-accent capture from scripts/thumbs-rail.mjs (qa.mjs's PNGs stay QA artefacts). */
export const thumb = (id: string, theme: string) => `${import.meta.env.BASE_URL}thumbs/rail/${id}-${theme}.jpg`
/** the small one, for the shells page grid (~340px cards): 720w WebP */
export const gridThumb = (id: string, theme: string) => `${import.meta.env.BASE_URL}thumbs/grid/${id}-${theme}.webp`
