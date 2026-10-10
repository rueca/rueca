#!/bin/bash
set -e
mkdir -p src
echo '{ "name": "patterns", "private": true, "type": "module", "dependencies": { "react": "^19.0.0", "react-dom": "^19.0.0" } }' > package.json
cat > src/PatternTool.tsx <<'T'
import { Artboard, CanvasSurface, Inspector, Panel, ParamActions, Stage, Studio, Toolbar, Brand, createParams, defineSchema, folder, p, useValues } from '@/components/studio'

export const schema = defineSchema({
  tile: folder('Tile', {
    size: p.number(48, { min: 8, max: 200, step: 1, unit: 'px' }),
    gap: p.number(4, { min: 0, max: 40, step: 1, unit: 'px' }),
    shape: p.select('circle', ['circle', 'square', 'quarter', 'diamond']),
    rotation: p.angle(0),
    jitter: p.number(0, { min: 0, max: 1, step: 0.01 }),
  }),
  colour: folder('Colour', {
    palette: p.palette(['#1d1d1b', '#f2c94c', '#eb5757', '#2f80ed']),
    background: p.color('#faf7f0'),
    contrast: p.number(1, { min: 0.5, max: 1.5, step: 0.01 }),
  }),
  pattern: folder('Pattern', {
    seed: p.seed(7),
    density: p.number(0.8, { min: 0, max: 1, step: 0.01 }),
    symmetry: p.select('none', ['none', 'mirror', 'radial']),
    noiseScale: p.number(0.3, { min: 0, max: 2, step: 0.01 }),
    layers: p.number(2, { min: 1, max: 5, step: 1 }),
  }),
  canvas: folder('Canvas', {
    width: p.number(1080, { min: 256, max: 4096, step: 1 }),
    height: p.number(1080, { min: 256, max: 4096, step: 1 }),
  }),
})

export const params = createParams(schema, { id: 'patterns' })

function draw(ctx: CanvasRenderingContext2D, { v }: { v: ReturnType<typeof params.values> }) {
  ctx.fillStyle = v.background
  ctx.fillRect(0, 0, v.width, v.height)
  // … pattern drawing elided …
}

export default function PatternTool() {
  const v = useValues(params)
  return (
    <Studio
      toolbar={<Toolbar start={<Brand name="Patterns" />} end={<ParamActions params={params} />} />}
      right={<Panel><Inspector params={params} /></Panel>}
    >
      <Stage contentSize={{ w: v.width, h: v.height }}>
        <Artboard width={v.width} height={v.height}>
          <CanvasSurface params={params} draw={draw} />
        </Artboard>
      </Stage>
    </Studio>
  )
}
T
