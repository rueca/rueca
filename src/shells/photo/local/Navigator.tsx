/* ---------------------------------------------------------------------------
   Navigator — a minimap of the artboard with the visible viewport drawn on
   it (Lightroom / Photoshop Navigator, Figma's minimap). Bound to a kit
   Stage camera, so it works for any <Stage camera={cam}>.

     <Navigator camera={cam} content={{ w, h }} image={imageData} />

   Click or drag in the minimap to centre the view there; the zoom segment
   underneath gives Fit / 50 / 100 / 200 % without a pointer drag.
--------------------------------------------------------------------------- */
import { useEffect, useRef } from 'react'
import { useStore } from 'zustand'
import { Segmented, clamp, type CameraStore } from '@kit'

export function Navigator({ camera, content, image, height = 132 }: { camera: CameraStore; content: { w: number; h: number }; image: ImageData | null; height?: number }) {
  const { x, y, zoom } = useStore(camera)
  const canvas = useRef<HTMLCanvasElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  useEffect(() => {
    const c = canvas.current
    if (!c || !image) return
    c.width = image.width
    c.height = image.height
    c.getContext('2d')!.putImageData(image, 0, 0)
  }, [image])

  // fit the content into the box
  const bw = box.current?.clientWidth ?? 240
  const s = Math.min(bw / content.w, height / content.h)
  const dw = content.w * s, dh = content.h * s
  const b = camera.bounds?.()
  const vis = b ? { x: -x / zoom, y: -y / zoom, w: b.width / zoom, h: b.height / zoom } : null
  const r = vis && {
    l: clamp(vis.x / content.w, 0, 1), t: clamp(vis.y / content.h, 0, 1),
    r: clamp((vis.x + vis.w) / content.w, 0, 1), b: clamp((vis.y + vis.h) / content.h, 0, 1),
  }
  const whole = r && r.l <= 0.001 && r.t <= 0.001 && r.r >= 0.999 && r.b >= 0.999

  const centre = (e: React.PointerEvent) => {
    const el = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const nx = clamp((e.clientX - el.left) / el.width, 0, 1), ny = clamp((e.clientY - el.top) / el.height, 0, 1)
    const bb = camera.bounds?.()
    if (!bb) return
    const z = camera.getState().zoom
    camera.setState({ x: bb.width / 2 - nx * content.w * z, y: bb.height / 2 - ny * content.h * z })
  }

  const preset = Math.abs(zoom - 0.5) < 0.005 ? '0.5' : Math.abs(zoom - 1) < 0.005 ? '1' : Math.abs(zoom - 2) < 0.005 ? '2' : 'fit'
  return (
    <div className="flex flex-col gap-2 px-3 pb-1">
      <div ref={box} className="flex items-center justify-center rounded-[6px] bg-well" style={{ height }}>
        <div
          className="relative cursor-crosshair overflow-hidden rounded-[3px] shadow-[0_0_0_1px_var(--line)]"
          style={{ width: dw, height: dh }}
          onPointerDown={(e) => { dragging.current = true; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); centre(e) }}
          onPointerMove={(e) => dragging.current && centre(e)}
          onPointerUp={() => { dragging.current = false }}
          role="presentation"
        >
          <canvas ref={canvas} className="absolute inset-0 size-full" />
          {r && !whole && (
            <div className="pointer-events-none absolute shadow-[0_0_0_1.5px_#fff,0_0_0_9999px_rgba(0,0,0,.45)]"
              style={{ left: `${r.l * 100}%`, top: `${r.t * 100}%`, width: `${(r.r - r.l) * 100}%`, height: `${(r.b - r.t) * 100}%` }} />
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Segmented size="sm" label="Zoom" value={preset} onChange={(z) => (z === 'fit' ? camera.fit() : camera.zoomTo(Number(z)))}
          options={[{ value: 'fit', label: 'Fit' }, { value: '0.5', label: '50%' }, { value: '1', label: '100%' }, { value: '2', label: '200%' }]} />
        <span className="w-10 shrink-0 text-right text-[11px] tabular text-faint">{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  )
}
