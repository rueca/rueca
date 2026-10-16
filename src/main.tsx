import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// the shells' artwork sets type in "Inter Variable" (fontsource); the kit chrome brings its own Inter 4
import '@fontsource-variable/inter'
import '@kit/theme.css'
import './app.css'
import { App } from './gallery/App'
import { configureTheme } from '@kit/core/theme'
import { listenForStaleChunks } from './gallery/stale'

// This site themes the whole page (landing, gallery, shells) from `.dark` / `.light` on <html>; the kit defaults to its
// own data-studio-theme attribute so it never flips a host app's theme.
configureTheme({ htmlClass: true })

history.scrollRestoration = 'manual'
// a tab opened before a deploy asks for chunks the new build no longer has: reload once instead of hanging
listenForStaleChunks()
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
