#!/bin/bash
set -e
cat > blob.html <<'H'
<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Blob</title><style>html,body{margin:0;height:100%;background:#0e0e12}canvas{display:block;width:100%;height:100%}</style>
</head><body><canvas id="c"></canvas>
<script>
const canvas = document.getElementById('c'), ctx = canvas.getContext('2d')
const settings = { points: 8, wobble: 0.18, speed: 0.6, hue: 265 }
function draw(ctx, t, { points, wobble, speed, hue }) {
  const { width: w, height: h } = ctx.canvas, r = Math.min(w, h) * 0.28
  ctx.fillStyle = '#0e0e12'; ctx.fillRect(0, 0, w, h)
  ctx.beginPath()
  for (let i = 0; i <= 120; i++) {
    const a = (i / 120) * Math.PI * 2
    const k = 1 + wobble * Math.sin(a * points + t * speed * 2) * Math.cos(a * 3 - t * speed)
    const x = w / 2 + Math.cos(a) * r * k, y = h / 2 + Math.sin(a) * r * k
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
  }
  ctx.fillStyle = `hsl(${hue} 80% 62%)`; ctx.fill()
}
function frame(ms) {
  canvas.width = innerWidth; canvas.height = innerHeight
  draw(ctx, ms / 1000, settings)
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
</script></body></html>
H
