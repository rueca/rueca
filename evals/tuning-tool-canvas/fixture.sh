#!/bin/bash
set -e
mkdir -p src
cat > package.json <<'J'
{ "name": "ripple", "private": true, "type": "module",
  "dependencies": { "react": "^19.0.0", "react-dom": "^19.0.0" },
  "devDependencies": { "vite": "^8.0.0", "@vitejs/plugin-react": "^5.0.0", "tailwindcss": "^4.0.0", "@tailwindcss/vite": "^4.0.0", "typescript": "^7.0.0" } }
J
cat > src/ripple.ts <<'T'
export type Ease = 'linear' | 'easeOut' | 'easeInOut'
const E: Record<Ease, (x: number) => number> = { linear: (x) => x, easeOut: (x) => 1 - (1 - x) ** 3, easeInOut: (x) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2) }
export function draw(ctx: CanvasRenderingContext2D, t: number, { rings, stagger, ease }: { rings: number; stagger: number; ease: Ease }) {
  const { width: w, height: h } = ctx.canvas
  ctx.fillStyle = '#0b0b0f'; ctx.fillRect(0, 0, w, h)
  for (let i = 0; i < rings; i++) {
    const k = E[ease](Math.min(1, Math.max(0, t * 2 - i * stagger)))
    ctx.strokeStyle = `rgba(120,160,255,${k})`
    ctx.beginPath(); ctx.arc(w / 2, h / 2, 20 + i * 18, 0, Math.PI * 2); ctx.stroke()
  }
}
T
