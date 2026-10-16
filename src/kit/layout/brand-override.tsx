/* The host-wide brand mark, in its own file so a host (the gallery) can wrap tools in it without loading the
   whole toolbar and studio chrome on first paint. Toolbar re-exports BrandOverride. */
import { createContext, type ReactNode } from 'react'

export const BrandOverrideContext = createContext<{ mark: ReactNode; tile: boolean } | null>(null)

/**
 * A host that runs many tools (a gallery, a product site) gives them one mark: every <Brand> inside shows
 * `mark` in place of its own. `tile={false}` (the default) draws it bare, in ink, the way a logo sits in a
 * site header; `tile` keeps the inverted square. A tool used on its own keeps its own mark.
 *   <BrandOverride mark={<Logo />}><Tool /></BrandOverride>
 */
export function BrandOverride({ mark, tile = false, children }: { mark: ReactNode; tile?: boolean; children: ReactNode }) {
  return <BrandOverrideContext.Provider value={{ mark, tile }}>{children}</BrandOverrideContext.Provider>
}
