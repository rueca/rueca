import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@kit/theme.css'
import '@/app.css'
import { CardsTool } from './CardsTool'
import { loadAssets } from './artifact'

// fonts and engravings first, so every frame draws synchronously
loadAssets().then(() => createRoot(document.getElementById('root')!).render(<StrictMode><CardsTool /></StrictMode>))
