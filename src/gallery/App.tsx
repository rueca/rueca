import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { site } from '@/site.config'
import { Landing } from '@/landing/Landing'
import { Gallery } from './Gallery'
import { SHELLS } from './registry'

/* Routes: #/ landing · #/shells every shell · #/<id> one shell. */

const useRoute = () => {
  const read = () => location.hash.replace(/^#\/?/, '').split(/[?&#]/)[0]
  const [r, setR] = useState(read)
  useEffect(() => { const on = () => setR(read()); addEventListener('hashchange', on); return () => removeEventListener('hashchange', on) }, [])
  return r
}

export function App() {
  const route = useRoute()
  const shell = SHELLS.find((s) => s.id === route)
  const Comp = useMemo(() => (shell ? lazy(shell.load) : null), [shell])
  useEffect(() => {
    document.title = shell ? `${shell.name} — ${site.name}` : route === 'shells' ? `Shells — ${site.name}` : `${site.name} — ${site.tagline}`
  }, [shell, route])
  if (route === 'shells') return <Gallery shells={SHELLS} />
  if (!Comp) return <Landing shells={SHELLS} />
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center text-[12px] text-faint">Loading {shell!.name}…</div>}>
      <Comp />
    </Suspense>
  )
}
