import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@kit/theme.css'
import './app.css'
import { App } from './gallery/App'
import { configureTheme } from '@kit/core/theme'

// This site themes the whole page (landing, gallery, shells) from `.dark` / `.light` on <html>; the kit defaults to its
// own data-studio-theme attribute so it never flips a host app's theme.
configureTheme({ htmlClass: true })

history.scrollRestoration = 'manual'
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
