/* ---------------------------------------------------------------------------
   The composition model — a declarative clip list, like a Remotion
   <Composition> but data instead of JSX, so a UI can tune what a prompt
   generated. Positions are normalised to the frame (0–1, centre anchored);
   sizes are in units of the frame's SHORT side, so changing aspect re-lays
   everything out without touching a clip.
--------------------------------------------------------------------------- */
/* Demo content is drawn in the wire style (src/demo/wire.ts): paper, one ink, hairlines. */
import { WIRE } from '@/demo/wire'

export type Bezier = [number, number, number, number]
export type Aspect = '9:16' | '1:1' | '16:9' | '4:5'
export const ASPECTS: Record<Aspect, { w: number; h: number; label: string }> = {
  '9:16': { w: 1080, h: 1920, label: 'Story' },
  '4:5': { w: 1080, h: 1350, label: 'Portrait' },
  '1:1': { w: 1080, h: 1080, label: 'Square' },
  '16:9': { w: 1920, h: 1080, label: 'Landscape' },
}

export type ClipKind = 'text' | 'shape' | 'image' | 'bg' | 'progress'
export type Preset = 'none' | 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'pop' | 'blur' | 'wipe' | 'typewriter'
export interface Motion { preset: Preset; dur: number; ease: Bezier }
export type FontKey = 'sans' | 'display' | 'serif' | 'mono'
export type ImageGen = 'aurora' | 'sunset' | 'mesh' | 'app'

export interface Clip {
  id: string
  track: string
  kind: ClipKind
  name: string
  start: number
  dur: number
  x: number
  y: number
  w: number
  h: number
  rotation: number
  opacity: number
  enter: Motion
  exit: Motion
  // text
  text?: string
  font?: FontKey
  weight?: number
  size?: number
  color?: string
  align?: 'left' | 'center' | 'right'
  tracking?: number
  lineHeight?: number
  highlight?: string | null
  maxWidth?: number
  // shape
  shape?: 'rect' | 'circle' | 'ring' | 'blob'
  radius?: number
  fill?: string
  stroke?: number
  // image
  image?: ImageGen
  seed?: number
  kenBurns?: number
  frame?: boolean
  // bg
  from?: string
  to?: string
  angle?: number
  // progress
  trackColor?: string
  thickness?: number
  edge?: 'top' | 'bottom'
}
export interface Track { id: string; name: string; muted: boolean; locked: boolean }
/** `design` is the aspect the video was authored in; sizes are exact there and scale to fit elsewhere. */
export interface Comp { tracks: Track[]; clips: Clip[]; design?: Aspect }

export const EASE: Record<string, Bezier> = {
  Linear: [0, 0, 1, 1],
  'Ease out': [0, 0, 0.58, 1],
  'Ease in out': [0.42, 0, 0.58, 1],
  'Out expo': [0.16, 1, 0.3, 1],
  'Out back': [0.34, 1.56, 0.64, 1],
  'In out quint': [0.83, 0, 0.17, 1],
}

export const PRESETS: { value: Preset; label: string; text?: boolean }[] = [
  { value: 'none', label: 'None' }, { value: 'fade', label: 'Fade' },
  { value: 'slide-up', label: 'Slide up' }, { value: 'slide-down', label: 'Slide down' },
  { value: 'slide-left', label: 'Slide left' }, { value: 'slide-right', label: 'Slide right' },
  { value: 'pop', label: 'Pop' }, { value: 'blur', label: 'Blur' }, { value: 'wipe', label: 'Wipe' },
  { value: 'typewriter', label: 'Typewriter', text: true },
]

let n = 0
export const uid = (p = 'c') => `${p}${Date.now().toString(36)}${(n++).toString(36)}`

const M = (preset: Preset, dur = 500, ease: Bezier = EASE['Out expo']): Motion => ({ preset, dur, ease })
const base = (o: Partial<Clip> & Pick<Clip, 'id' | 'track' | 'kind' | 'name' | 'start' | 'dur'>): Clip => ({
  x: 0.5, y: 0.5, w: 0.5, h: 0.5, rotation: 0, opacity: 1, enter: M('fade', 400), exit: M('fade', 300, EASE['Ease in out']), ...o,
})

export function newClip(kind: ClipKind, track: string, start: number): Clip {
  const id = uid()
  const common = { id, track, kind, start, dur: 2500 }
  switch (kind) {
    case 'text': return base({ ...common, name: 'Text', text: 'New headline', font: 'display', weight: 800, size: 120, color: WIRE.ink, align: 'center', tracking: -0.03, lineHeight: 1.02, highlight: null, maxWidth: 0.84, y: 0.45, enter: M('slide-up', 600) })
    case 'shape': return base({ ...common, name: 'Shape', shape: 'circle', w: 0.4, h: 0.4, radius: 0.04, fill: WIRE.ink, stroke: 0.004, enter: M('pop', 500, EASE['Out back']) })
    case 'image': return base({ ...common, name: 'Image', image: 'mesh', seed: Math.floor(Math.random() * 9999), w: 0.8, h: 0.8, radius: 0.04, kenBurns: 0.08, frame: false, enter: M('slide-up', 600) })
    case 'bg': return base({ ...common, name: 'Background', from: WIRE.paper, to: WIRE.paper, angle: 160, enter: M('none', 0), exit: M('none', 0), dur: 4000 })
    case 'progress': return base({ ...common, name: 'Progress', fill: WIRE.ink, trackColor: WIRE.line, thickness: 6, edge: 'top', enter: M('fade', 300), exit: M('none', 0), dur: 4000 })
  }
}

export function demoComp(): Comp {
  const tracks: Track[] = [
    { id: 'tText', name: 'Titles', muted: false, locked: false },
    { id: 'tText2', name: 'Captions', muted: false, locked: false },
    { id: 'tOverlay', name: 'Overlay', muted: false, locked: false },
    { id: 'tShapes', name: 'Shapes', muted: false, locked: false },
    { id: 'tMedia', name: 'Media', muted: false, locked: false },
    { id: 'tBg', name: 'Background', muted: false, locked: true },
  ]
  const clips: Clip[] = [
    base({ id: 'title', track: 'tText', kind: 'text', name: 'Meet Orbit', start: 500, dur: 3100, text: 'Meet Orbit', font: 'display', weight: 800, size: 168, color: WIRE.ink, align: 'center', tracking: -0.04, lineHeight: 1, highlight: null, maxWidth: 0.9, y: 0.19, enter: M('slide-up', 700), exit: M('fade', 300) }),
    base({ id: 'cta', track: 'tText', kind: 'text', name: 'Available today', start: 5400, dur: 2600, text: 'Available today', font: 'display', weight: 700, size: 70, color: WIRE.paper, align: 'center', tracking: -0.02, lineHeight: 1, highlight: null, maxWidth: 0.9, y: 0.83, enter: M('pop', 500, EASE['Out back']), exit: M('none', 0) }),
    base({ id: 'sub', track: 'tText2', kind: 'text', name: 'Subtitle', start: 1100, dur: 2500, text: 'Your week, in one glance.', font: 'sans', weight: 500, size: 58, color: WIRE.muted, align: 'center', tracking: -0.01, lineHeight: 1.15, highlight: null, maxWidth: 0.8, y: 0.265, enter: M('blur', 600), exit: M('fade', 300) }),
    base({ id: 'url', track: 'tText2', kind: 'text', name: 'URL', start: 6000, dur: 2000, text: 'orbit.app', font: 'mono', weight: 500, size: 40, color: WIRE.muted, align: 'center', tracking: 0.02, lineHeight: 1, highlight: null, maxWidth: 0.8, y: 0.905, enter: M('typewriter', 700, EASE.Linear), exit: M('none', 0) }),
    base({ id: 'bar', track: 'tOverlay', kind: 'progress', name: 'Progress', start: 0, dur: 8000, fill: WIRE.ink, trackColor: WIRE.line, thickness: 6, edge: 'top', enter: M('fade', 300), exit: M('none', 0) }),
    base({ id: 'ring', track: 'tShapes', kind: 'shape', name: 'Halo', start: 250, dur: 3500, shape: 'ring', w: 0.74, h: 0.74, fill: WIRE.ink, stroke: 0.0028, y: 0.515, opacity: 0.45, enter: M('pop', 900, EASE['Out expo']), exit: M('fade', 400) }),
    base({ id: 'pill', track: 'tShapes', kind: 'shape', name: 'CTA pill', start: 5300, dur: 2700, shape: 'rect', w: 0.7, h: 0.105, radius: 1, fill: WIRE.ink, y: 0.83, enter: M('wipe', 450, EASE['In out quint']), exit: M('none', 0) }),
    base({ id: 'aurora', track: 'tMedia', kind: 'image', name: 'Top', start: 0, dur: 4300, image: 'aurora', seed: 7, frame: true, kenBurns: 0.06, radius: 0, enter: M('fade', 500), exit: M('fade', 700, EASE['Ease in out']) }),
    base({ id: 'app', track: 'tMedia', kind: 'image', name: 'App screen', start: 3900, dur: 4100, image: 'app', seed: 3, w: 0.74, h: 1.22, radius: 0.06, y: 0.42, kenBurns: 0.03, frame: false, enter: M('slide-up', 800, EASE['Out expo']), exit: M('none', 0) }),
    base({ id: 'bg', track: 'tBg', kind: 'bg', name: 'Paper', start: 0, dur: 8000, from: WIRE.paper, to: WIRE.paper, angle: 160, enter: M('none', 0), exit: M('none', 0) }),
  ]
  return { tracks, clips, design: '9:16' }
}

export const clipEnd = (c: Clip) => c.start + c.dur
