import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { site } from '@/site.config'
import { ErrorBoundary } from '@kit/system/error-boundary'
import { DesktopNotice } from './DesktopNotice'
import { SHELLS } from './registry'
import { fresh } from './stale'
import { BrandOverride } from '@kit/layout/Toolbar'
import { Mark } from '@/landing/parts'

/* Routes: #/ landing · #/shells every shell · #/<id> one shell · anything else: "no such tool".
   The landing and the gallery load on demand, so a shell's own route never pays for them
   (or for motion, which only the landing uses). */
const Landing = lazy(fresh(() => import('@/landing/Landing').then((m) => ({ default: m.Landing }))))
const Gallery = lazy(fresh(() => import('./Gallery').then((m) => ({ default: m.Gallery }))))
const blank = <div className="h-full bg-field" />

const useRoute = () => {
  const read = () => location.hash.replace(/^#\/?/, '').split(/[?&#]/)[0]
  const [r, setR] = useState(read)
  useEffect(() => { const on = () => setR(read()); addEventListener('hashchange', on); return () => removeEventListener('hashchange', on) }, [])
  return r
}

export function App() {
  const route = useRoute()
  const shell = SHELLS.find((s) => s.id === route)
  const Comp = useMemo(() => (shell ? lazy(fresh(shell.load)) : null), [shell])
  useEffect(() => {
    document.title = shell ? `${shell.name} · ${site.name}` : route === 'shells' ? `Shells · ${site.name}` : route === '' ? `${site.name} · ${site.tagline.replace(/\.$/, '')}` : `Not found · ${site.name}`
  }, [shell, route])
  if (route === 'shells') return <Suspense fallback={blank}><Gallery shells={SHELLS} /></Suspense>
  if (route === '') return <Suspense fallback={blank}><Landing shells={SHELLS} /></Suspense>
  if (!Comp) return <NotFound route={route} />
  // Stores are created when a shell's module loads, so a corrupt saved doc can throw before <Studio>
  // exists. This outer boundary is the guaranteed way back: it clears only this shell's saved data.
  return (
    <ErrorBoundary key={shell!.id} label={shell!.name} resetPrefix={`studio:${shell!.id}`}>
      <Suspense fallback={<div className="flex h-full items-center justify-center text-[12px] text-fg-faint">Loading {shell!.name}…</div>}>
        {/* on rueca.dev every shell is one of Rueca's demos: its corner carries Rueca's mark, and the menu leads back to all of them */}
        <BrandOverride mark={<Mark size={15} />}><Comp /></BrandOverride>
      </Suspense>
      <DesktopNotice />
    </ErrorBoundary>
  )
}

/** An address that names no tool: say so, and offer the way on. Kit tokens only, so it needs neither the landing nor the gallery. */
function NotFound({ route }: { route: string }) {
  return (
    <main className="flex h-full flex-col items-center justify-center gap-3 bg-field px-6 text-center text-fg">
      <p className="text-[15px] font-medium">There's no tool called “{decodeURIComponent(route)}”.</p>
      <p className="text-[13px] text-fg-muted">It may have been renamed. All {SHELLS.length} are on the shells page.</p>
      <div className="mt-2 flex gap-4 text-[13px]">
        <a href="#/shells" className="text-fg underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-signal">See all shells</a>
        <a href="#/" className="text-fg-muted underline underline-offset-4 outline-none hover:text-fg focus-visible:ring-2 focus-visible:ring-signal">Back to {site.name}</a>
      </div>
    </main>
  )
}
