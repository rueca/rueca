/* The demo file: "Trailhead", a hiking app. Two phone screens wired as a
   prototype, a components page and an empty archive page. */
import { frame, rect, ellipse, text, icon, solid, linear, imageFill, shadow } from './factory'
import { uid, type Doc, type Node, type Interaction } from './types'

const C = {
  bg: '#f6f4ee', ink: '#1b1f1c', muted: '#6b706c', faint: '#9a9d98', line: '#e7e4dc', soft: '#efece4',
  green: '#2f6b4f', amber: '#e8a33d', white: '#ffffff',
}

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1]
const go = (target: string, transition: Interaction['transition'] = 'smart', duration = 380): Interaction =>
  ({ id: uid('i'), trigger: 'tap', action: 'navigate', target, transition, duration, easing: ease })

function statusBar(color: string): Node {
  return frame({
    name: 'Status bar', w: 390, h: 44, sizingW: 'fixed', sizingH: 'fixed', fills: [], clip: false,
    auto: { dir: 'row', between: true, pad: [14, 26, 0, 32], alignY: 'center' },
    children: [
      text('9:41', { name: 'Time', color, t: { size: 15, weight: 600, letterSpacing: -1 } }),
      frame({
        name: 'Indicators', fills: [], clip: false, auto: { gap: 5, alignY: 'center' },
        children: [icon('SignalHigh', { w: 17, h: 17, color, stroke: 2.25 }), icon('Wifi', { w: 17, h: 17, color, stroke: 2.25 }), icon('BatteryFull', { w: 22, h: 22, color, stroke: 1.75 })],
      }),
    ],
  })
}

function chip(label: string, active = false): Node {
  return frame({
    name: `Chip / ${label}`, radius: 99, auto: { pad: [8, 15, 8, 15], alignY: 'center' },
    fills: [solid(active ? C.ink : C.white)], strokes: active ? [] : [solid(C.line)],
    children: [text(label, { color: active ? C.white : C.ink, t: { size: 14, weight: 500 } })],
  })
}

function nearbyRow(title: string, sub: string, img: string, extra: Partial<Node> = {}): Node {
  return frame({
    name: title, radius: 16, sizingW: 'fill', fills: [solid(C.white)], strokes: [solid(C.soft)],
    auto: { gap: 12, pad: [10, 14, 10, 10], alignY: 'center' },
    children: [
      rect({ name: 'Thumbnail', w: 56, h: 56, radius: 12, fills: [imageFill(img)] }),
      frame({
        name: 'Copy', fills: [], sizingW: 'fill', clip: false, auto: { dir: 'column', gap: 3 },
        children: [
          text(title, { sizingW: 'fill', t: { size: 15, weight: 600, resize: 'auto-height' } }),
          text(sub, { color: C.muted, sizingW: 'fill', t: { size: 13, resize: 'auto-height' } }),
        ],
      }),
      icon('ChevronRight', { w: 18, h: 18, color: C.faint }),
    ],
    ...extra,
  })
}

function tab(label: string, ic: string, active = false): Node {
  const color = active ? C.green : '#8d918c'
  return frame({
    name: `Tab / ${label}`, fills: [], clip: false, auto: { dir: 'column', gap: 4, alignX: 'center' },
    children: [icon(ic, { w: 22, h: 22, color, stroke: active ? 2 : 1.75 }), text(label, { color, t: { size: 11, weight: active ? 600 : 500 } })],
  })
}

function stat(value: string, label: string): Node {
  return frame({
    name: `Stat / ${label}`, sizingW: 'fill', radius: 14, fills: [solid(C.white)], strokes: [solid(C.soft)],
    auto: { dir: 'column', gap: 2, pad: [12, 14, 12, 14] },
    children: [text(value, { t: { size: 17, weight: 650, letterSpacing: -1 } }), text(label, { color: C.muted, t: { size: 12 } })],
  })
}

function roundButton(name: string, ic: string, x: number, y: number, size = 40, inter?: Interaction[]): Node {
  return frame({
    name, x, y, w: size, h: size, sizingW: 'fixed', sizingH: 'fixed', radius: 99, fills: [solid(C.white, 0.92)],
    effects: [shadow(2, 8, 0.12)], auto: { alignX: 'center', alignY: 'center' }, interactions: inter,
    children: [icon(ic, { w: 19, h: 19 })],
  })
}

export function seedDoc(): Doc {
  const homeId = uid('f'), detailId = uid('f')

  const home = frame({
    id: homeId, name: 'Home', x: 0, y: 0, w: 390, h: 844, fills: [solid(C.bg)],
    children: [
      statusBar(C.ink),
      frame({
        name: 'Greeting', x: 24, y: 66, w: 270, sizingW: 'fixed', fills: [], clip: false, auto: { dir: 'column', gap: 4 },
        children: [
          text('Good morning, Maya', { color: C.muted, t: { size: 14, weight: 500 } }),
          text('Where to today?', { t: { size: 28, weight: 700, letterSpacing: -2.5 } }),
        ],
      }),
      ellipse({ name: 'Avatar', x: 322, y: 70, w: 44, h: 44, fills: [imageFill('avatar')], strokes: [solid(C.white)], strokeWidth: 2, strokeAlign: 'outside', effects: [shadow(2, 6, 0.12)] }),
      frame({
        name: 'Search', x: 24, y: 146, w: 342, h: 50, sizingW: 'fixed', sizingH: 'fixed', radius: 14, fills: [solid(C.white)], strokes: [solid(C.line)],
        effects: [shadow(1, 2, 0.04)], auto: { gap: 10, pad: [0, 14, 0, 16], alignY: 'center' },
        children: [
          icon('Search', { w: 18, h: 18, color: C.muted }),
          text('Search trails, parks, peaks', { color: C.faint, sizingW: 'fill', t: { size: 15, resize: 'auto-height' } }),
          icon('SlidersHorizontal', { w: 18, h: 18 }),
        ],
      }),
      frame({ name: 'Filters', x: 24, y: 212, fills: [], clip: false, auto: { gap: 8 }, children: [chip('All', true), chip('Hiking'), chip('Trail running'), chip('Biking')] }),
      frame({
        name: 'Section / Featured', x: 24, y: 272, w: 342, sizingW: 'fixed', fills: [], clip: false, auto: { between: true, alignY: 'center' },
        children: [text('Featured', { t: { size: 18, weight: 650, letterSpacing: -1 } }), text('See all', { color: C.green, t: { size: 14, weight: 500 } })],
      }),
      frame({
        name: 'Featured card', x: 24, y: 306, w: 342, h: 232, radius: 22, fills: [imageFill('ridge')], effects: [shadow(14, 30, 0.2)],
        interactions: [go(detailId)],
        children: [
          rect({ name: 'Scrim', x: 0, y: 96, w: 342, h: 136, fills: [linear([{ pos: 0, color: '#14181500' }, { pos: 1, color: '#141815d9' }], 180)] }),
          frame({
            name: 'Rating', x: 16, y: 16, radius: 99, fills: [solid(C.white, 0.92)], auto: { gap: 4, pad: [6, 10, 6, 8], alignY: 'center' },
            children: [icon('Star', { w: 14, h: 14, color: C.amber, stroke: 2.25 }), text('4.8', { t: { size: 13, weight: 600 } })],
          }),
          roundButton('Save', 'Bookmark', 288, 14, 38),
          text('Eagle Ridge Loop', { x: 18, y: 160, color: C.white, t: { size: 22, weight: 700, letterSpacing: -2 } }),
          frame({
            name: 'Meta', x: 18, y: 194, fills: [], clip: false, auto: { gap: 4, alignY: 'center' },
            children: [icon('MapPin', { w: 14, h: 14, color: '#e8ebe7' }), text('Mt. Tamalpais  ·  6.4 mi  ·  3h 10m', { color: '#e8ebe7', t: { size: 13, weight: 500 } })],
          }),
        ],
      }),
      text('Nearby', { x: 24, y: 560, t: { size: 18, weight: 650, letterSpacing: -1 } }),
      frame({
        name: 'Nearby list', x: 24, y: 592, w: 342, sizingW: 'fixed', fills: [], clip: false, auto: { dir: 'column', gap: 10 },
        children: [
          nearbyRow('Muir Woods Trail', '2.1 mi  ·  Easy  ·  45 min', 'forest', { interactions: [go(detailId, 'move-in', 320)] }),
          nearbyRow('Stinson Bluffs', '4.8 mi  ·  Moderate  ·  2h', 'coast'),
        ],
      }),
      frame({
        name: 'Tab bar', x: 0, y: 760, w: 390, h: 84, sizingW: 'fixed', sizingH: 'fixed', fills: [solid(C.white)],
        effects: [shadow(-1, 0, 0.07)], auto: { between: true, pad: [10, 34, 26, 34], alignY: 'start' },
        children: [tab('Explore', 'Compass', true), tab('Saved', 'Bookmark'), tab('Activity', 'Activity'), tab('Profile', 'User')],
      }),
    ],
  })

  const detail = frame({
    id: detailId, name: 'Trail detail', x: 470, y: 0, w: 390, h: 844, fills: [solid(C.bg)],
    children: [
      rect({ name: 'Hero', x: 0, y: 0, w: 390, h: 380, fills: [imageFill('ridge')] }),
      rect({ name: 'Top scrim', x: 0, y: 0, w: 390, h: 130, fills: [linear([{ pos: 0, color: '#00000059' }, { pos: 1, color: '#00000000' }], 180)] }),
      statusBar(C.white),
      roundButton('Back', 'ArrowLeft', 20, 56, 40, [{ id: uid('i'), trigger: 'tap', action: 'back', transition: 'smart', duration: 380, easing: ease }]),
      roundButton('Share', 'Share', 330, 56, 40),
      frame({
        name: 'Sheet', x: 0, y: 340, w: 390, h: 504, sizingW: 'fixed', sizingH: 'fixed', radius: [28, 28, 0, 0], fills: [solid(C.bg)],
        effects: [shadow(-8, 24, 0.12)], auto: { dir: 'column', gap: 20, pad: [26, 24, 28, 24] },
        children: [
          frame({
            name: 'Title', sizingW: 'fill', fills: [], clip: false, auto: { dir: 'column', gap: 6 },
            children: [
              text('Eagle Ridge Loop', { t: { size: 26, weight: 700, letterSpacing: -2.5 } }),
              frame({
                name: 'Location', fills: [], clip: false, auto: { gap: 5, alignY: 'center' },
                children: [icon('MapPin', { w: 14, h: 14, color: C.muted }), text('Mount Tamalpais State Park, CA', { color: C.muted, t: { size: 14 } })],
              }),
            ],
          }),
          frame({ name: 'Stats', sizingW: 'fill', fills: [], clip: false, auto: { gap: 10 }, children: [stat('6.4 mi', 'Distance'), stat('1,240 ft', 'Elevation'), stat('3h 10m', 'Est. time')] }),
          text('A classic loop that climbs through redwood groves to open ridgeline views of the Pacific and the Bay. Best in the late afternoon, when the fog rolls back.', {
            name: 'Description', color: '#434843', sizingW: 'fill', t: { size: 15, lineHeight: 23, resize: 'auto-height' },
          }),
          frame({
            name: 'Actions', sizingW: 'fill', fills: [], clip: false, auto: { gap: 12, alignY: 'center' },
            children: [
              frame({ name: 'Save button', w: 54, h: 54, sizingW: 'fixed', sizingH: 'fixed', radius: 16, fills: [solid(C.white)], strokes: [solid('#e2ded4')], auto: { alignX: 'center', alignY: 'center' }, children: [icon('Bookmark', { w: 20, h: 20 })] }),
              frame({
                name: 'Start route', h: 54, sizingW: 'fill', sizingH: 'fixed', radius: 16, fills: [solid(C.green)], effects: [shadow(8, 20, 0.28, '#2f6b4f')],
                auto: { gap: 8, alignX: 'center', alignY: 'center' },
                children: [icon('Navigation', { w: 18, h: 18, color: C.white, stroke: 2 }), text('Start route', { color: C.white, t: { size: 16, weight: 600 } })],
              }),
            ],
          }),
        ],
      }),
    ],
  })

  const button = frame({
    name: 'Button / Primary', component: true, x: 0, y: 0, radius: 16, fills: [solid(C.green)], effects: [shadow(8, 20, 0.28, '#2f6b4f')],
    auto: { gap: 8, pad: [16, 24, 16, 24], alignX: 'center', alignY: 'center' },
    children: [icon('Navigation', { w: 18, h: 18, color: C.white, stroke: 2 }), text('Start route', { color: C.white, t: { size: 16, weight: 600 } })],
  })
  const secondary = frame({
    name: 'Button / Secondary', component: true, x: 220, y: 0, radius: 16, fills: [solid(C.white)], strokes: [solid('#e2ded4')],
    auto: { gap: 8, pad: [16, 24, 16, 24], alignX: 'center', alignY: 'center' },
    children: [icon('Bookmark', { w: 18, h: 18 }), text('Save trail', { t: { size: 16, weight: 600 } })],
  })
  const chipC = { ...chip('Chip', false), component: true, x: 0, y: 110, name: 'Chip / Default' }
  const chipA = { ...chip('Chip', true), component: true, x: 120, y: 110, name: 'Chip / Selected' }
  const row = { ...nearbyRow('List row', 'Supporting text  ·  Meta', 'forest'), component: true, x: 0, y: 190, w: 342, sizingW: 'fixed' as const, name: 'List row' }
  const statC = { ...stat('6.4 mi', 'Distance'), component: true, x: 0, y: 300, w: 120, sizingW: 'fixed' as const, name: 'Stat' }

  return {
    name: 'Trailhead app',
    pages: [
      {
        id: uid('pg'), name: 'App screens', bg: '', nodes: [home, detail], start: homeId,
        comments: [{ id: uid('c'), x: 470 + 316, y: 452, text: 'Can we show elevation as a mini chart here? Feels like the number alone undersells the climb.', author: 'Jun Park', at: Date.now() - 1000 * 60 * 60 * 3 }],
      },
      { id: uid('pg'), name: 'Components', bg: '', nodes: [button, secondary, chipC, chipA, row, statC], comments: [] },
      { id: uid('pg'), name: 'Archive', bg: '', nodes: [], comments: [] },
    ],
  }
}
