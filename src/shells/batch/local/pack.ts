/* ---------------------------------------------------------------------------
   Auto-arrange artboards of mixed sizes on the stage.

   A row of artboards is the obvious layout and the worst one: a 1080×1920
   story next to a 1600×900 banner leaves the stage mostly empty at fit.
   This keeps the caller's ORDER (so reordering in a list moves the board)
   and tries a range of wrap widths with skyline bottom-left packing, picking
   the arrangement that fits the visible stage at the largest zoom.

     const { pos, w, h } = packArtboards(sizes, { gap: 160, viewport: { w: 900, h: 560 } })
     <Stage contentSize={{ w, h }}>{sizes.map((s) => <Artboard x={pos[s.id].x} … />)}</Stage>
--------------------------------------------------------------------------- */

export interface PackItem { id: string; w: number; h: number }
export interface Packed { pos: Record<string, { x: number; y: number }>; w: number; h: number }

function skyline(items: PackItem[], width: number, gap: number, cell: number): Packed {
  const cols = Math.ceil((width + gap) / cell) + 1
  const sky = new Float64Array(cols)
  const pos: Packed['pos'] = {}
  let bw = 0, bh = 0
  for (const it of items) {
    const span = Math.ceil((it.w + gap) / cell)
    let bestX = 0, bestY = Infinity
    for (let c = 0; c + span <= cols || c === 0; c++) {
      if ((c * cell) + it.w > width && c > 0) break
      let y = 0
      for (let k = c; k < Math.min(cols, c + span); k++) y = Math.max(y, sky[k])
      if (y < bestY - 0.5) { bestY = y; bestX = c }
    }
    for (let k = bestX; k < Math.min(cols, bestX + span); k++) sky[k] = bestY + it.h + gap
    pos[it.id] = { x: bestX * cell, y: bestY }
    bw = Math.max(bw, bestX * cell + it.w)
    bh = Math.max(bh, bestY + it.h)
  }
  return { pos, w: bw, h: bh }
}

export function packArtboards(items: PackItem[], { gap = 160, viewport = { w: 1200, h: 800 }, padding = 48 }: { gap?: number; viewport?: { w: number; h: number }; padding?: number } = {}): Packed {
  if (!items.length) return { pos: {}, w: 1, h: 1 }
  const maxW = Math.max(...items.map((i) => i.w))
  const sumW = items.reduce((n, i) => n + i.w, 0) + gap * (items.length - 1)
  const cell = Math.max(10, Math.round(maxW / 120))
  const vw = Math.max(1, viewport.w - padding * 2), vh = Math.max(1, viewport.h - padding * 2)
  let best: Packed | null = null, bestScore = -Infinity
  const steps = 18
  for (let i = 0; i <= steps; i++) {
    const width = maxW + ((sumW - maxW) * i) / steps
    const p = skyline(items, width, gap, cell)
    const zoom = Math.min(vw / p.w, vh / p.h)
    const score = zoom - (p.w * p.h) * 1e-12
    if (score > bestScore + 1e-9) { bestScore = score; best = p }
  }
  return best!
}
