#!/bin/bash
set -e
mkdir -p src
echo '{ "name": "shaders", "private": true, "type": "module", "dependencies": { "react": "^19.0.0", "react-dom": "^19.0.0" } }' > package.json
cat > src/ShaderPlayground.tsx <<'T'
import { useState } from 'react'
import { EffectStack, HistoryButtons, Inspector, Panel, Stage, Studio, Toolbar, Brand, WebGLSurface, createParams, defineSchema, folder, p, useValues } from '@/components/studio'

type Layer = { id: string; type: 'noise' | 'gradient' | 'grain'; visible: boolean; opacity: number; params: Record<string, number> }

export const schema = defineSchema({
  global: folder('Global', { speed: p.number(1, { min: 0, max: 4, step: 0.01 }), scale: p.number(1, { min: 0.1, max: 8, step: 0.01 }) }),
})
export const params = createParams(schema, { id: 'shader' })

export default function ShaderPlayground() {
  const v = useValues(params)
  const [layers, setLayers] = useState<Layer[]>([
    { id: 'a', type: 'gradient', visible: true, opacity: 1, params: { angle: 45 } },
    { id: 'b', type: 'noise', visible: true, opacity: 0.6, params: { freq: 3 } },
  ])
  const add = (type: Layer['type']) => setLayers((ls) => [...ls, { id: crypto.randomUUID(), type, visible: true, opacity: 1, params: {} }])
  const remove = (id: string) => setLayers((ls) => ls.filter((l) => l.id !== id))
  const move = (id: string, to: number) => setLayers((ls) => { const l = ls.find((x) => x.id === id)!; const rest = ls.filter((x) => x.id !== id); rest.splice(to, 0, l); return rest })
  return (
    <Studio
      toolbar={<Toolbar start={<Brand name="Shaders" />} end={<HistoryButtons history={params} />} />}
      right={<Panel><Inspector params={params} /><EffectStack label="Layers" items={layers.map((l) => ({ id: l.id, name: l.type, visible: l.visible, opacity: l.opacity }))} remove={remove} onMove={move} /></Panel>}
    >
      <Stage><WebGLSurface params={params} frag={'/* … */'} uniforms={() => ({ uSpeed: v.speed, uScale: v.scale, uLayers: layers.length })} /></Stage>
    </Studio>
  )
}
T
