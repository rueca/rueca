import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@kit/theme.css'
import '@/app.css'
import { StylesTool } from './StylesTool'
import { loadAssets } from './artifact'

// fonts and the tone maps first, so every frame draws synchronously
loadAssets().then(() => createRoot(document.getElementById('root')!).render(<StrictMode><StylesTool /></StrictMode>))
