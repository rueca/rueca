import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@kit/theme.css'
import '@/app.css'
import { SpecimenTool } from './SpecimenTool'
import { loadAssets } from './artifact'

// fonts, engravings and the pen's strokes first, so every frame draws synchronously
loadAssets().then(() => createRoot(document.getElementById('root')!).render(<StrictMode><SpecimenTool /></StrictMode>))
