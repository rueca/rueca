#!/bin/bash
set -e
mkdir -p src
cat > package.json <<'J'
{ "name": "grain", "private": true, "type": "module",
  "scripts": { "dev": "vite", "build": "tsc -b && vite build" },
  "dependencies": { "react": "^19.0.0", "react-dom": "^19.0.0" },
  "devDependencies": { "vite": "^8.0.0", "@vitejs/plugin-react": "^5.0.0", "tailwindcss": "^4.0.0", "@tailwindcss/vite": "^4.0.0", "typescript": "^7.0.0" } }
J
cat > vite.config.ts <<'J'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({ plugins: [react(), tailwindcss()] })
J
printf 'node_modules\ndist\n' > .gitignore
printf '@import "tailwindcss";\n' > src/index.css
cat > src/grain.ts <<'T'
function hash(x: number, y: number, s: number) { const n = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return n - Math.floor(n) }
export function draw(ctx: CanvasRenderingContext2D, t: number, { scale, grain, contrast, tint }: { scale: number; grain: number; contrast: number; tint: string }) {
  const { width: w, height: h } = ctx.canvas
  ctx.fillStyle = tint; ctx.fillRect(0, 0, w, h)
  const seed = Math.floor(t * 12)
  for (let y = 0; y < h; y += scale) for (let x = 0; x < w; x += scale) {
    const v = (hash(x, y, seed) - 0.5) * contrast
    ctx.fillStyle = v > 0 ? `rgba(255,255,255,${v * grain})` : `rgba(0,0,0,${-v * grain})`
    ctx.fillRect(x, y, scale, scale)
  }
}
T
