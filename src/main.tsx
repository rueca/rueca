import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@kit/theme.css'
import './app.css'
import { App } from './gallery/App'

history.scrollRestoration = 'manual'
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
