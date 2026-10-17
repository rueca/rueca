import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@kit/theme.css'
import '@/app.css'
import { MoodsTool } from './MoodsTool'
import { loadAssets } from './artifact'

// fonts first, so every frame draws synchronously
loadAssets().then(() => createRoot(document.getElementById('root')!).render(<StrictMode><MoodsTool /></StrictMode>))
