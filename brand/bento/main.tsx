import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@kit/theme.css'
import '@/app.css'
import { loadAssets } from './assets'
import { BentoTool } from './BentoTool'
import { clock, params, totalMs, type V } from './artifact'

// fonts, the word, kit drawings and pen strokes are prepared first, so every frame can draw synchronously
loadAssets().then(() => {
  clock.setState({ duration: totalMs(params.values() as V) }) // the pen's lines are part of the loop's length
  createRoot(document.getElementById('root')!).render(<StrictMode><BentoTool /></StrictMode>)
})
