/* The demo file: "Gabinete", the visitor app of a museum of scientific
   instruments (src/demo/clients.ts). Two phone screens wired as a prototype,
   a components page and an empty archive page, drawn in Rueca's Lámina
   técnica: engraved plates on Lana paper, Plex for the interface, Newsreader
   for headings, one flat bright (Cielo) per screen, and Achiote only for the
   red-pen notes and the lettered parts. */
import { frame, rect, ellipse, text, icon, solid, imageFill } from './factory'
import { DYE, GABINETE } from '@/demo/clients'
import { uid, type Doc, type Node, type Interaction } from './types'

const C = {
  bg: DYE.lana, ink: DYE.nogal, muted: DYE.mute, faint: DYE.faint, line: DYE.line, card: DYE.card,
  bright: GABINETE.bright, pen: DYE.achiote,
}
const SERIF = 'Newsreader', SANS = 'IBM Plex Sans', HAND = 'La Belle Aurore'
const [astrolabe, , orrery, telescope] = GABINETE.instruments

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1]
const go = (target: string, transition: Interaction['transition'] = 'smart', duration = 380): Interaction =>
  ({ id: uid('i'), trigger: 'tap', action: 'navigate', target, transition, duration, easing: ease })

const sans = (size: number, weight = 400, extra: object = {}) => ({ family: SANS, size, weight, ...extra })
const serif = (size: number, weight = 400, extra: object = {}) => ({ family: SERIF, size, weight, letterSpacing: -2, ...extra })

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
    name: `Chip / ${label}`, radius: 99, auto: { pad: [7, 14, 7, 14], alignY: 'center' },
    fills: [solid(active ? C.ink : C.card)], strokes: active ? [] : [solid(C.line)],
    children: [text(label, { color: active ? C.bg : C.ink, t: sans(14, 500) })],
  })
}

/** A row in a list: an engraved plate on its card, a name, where it is. */
function roomRow(title: string, sub: string, img: string, extra: Partial<Node> = {}): Node {
  return frame({
    name: title, radius: 14, sizingW: 'fill', fills: [solid(C.card)], strokes: [solid(C.line)],
    auto: { gap: 14, pad: [8, 14, 8, 8], alignY: 'center' },
    children: [
      rect({ name: 'Plate', w: 52, h: 52, radius: 10, fills: [solid(C.bg), { ...imageFill(img), fit: 'fit' }], strokes: [solid(C.line)] }),
      frame({
        name: 'Copy', fills: [], sizingW: 'fill', clip: false, auto: { dir: 'column', gap: 3 },
        children: [
          text(title, { sizingW: 'fill', t: { ...serif(19, 450, { letterSpacing: -1 }), resize: 'auto-height' } }),
          text(sub, { color: C.muted, sizingW: 'fill', t: { ...sans(13), resize: 'auto-height' } }),
        ],
      }),
      icon('ChevronRight', { w: 18, h: 18, color: C.faint }),
    ],
    ...extra,
  })
}

function tab(label: string, ic: string, active = false): Node {
  const color = active ? C.ink : C.faint
  return frame({
    name: `Tab / ${label}`, fills: [], clip: false, auto: { dir: 'column', gap: 4, alignX: 'center' },
    children: [icon(ic, { w: 22, h: 22, color, stroke: active ? 2 : 1.6 }), text(label, { color, t: sans(11, active ? 600 : 500) })],
  })
}

/** "Room 4 · Clockwork planets" → "Clockwork planets, room 4": the theme first, the room as its address */
const roomLine = (room: string) => { const [where, theme] = room.split(' · '); return `${theme}, ${where.toLowerCase()}` }

/** Facts about the object as one ruled row: a hairline above and below, hairlines between the columns, no cards. */
function facts(items: [string, string][]): Node {
  const rule = (name: string) => rect({ name, h: 1, sizingW: 'fill', sizingH: 'fixed', fills: [solid(C.line)] })
  const cols: Node[] = []
  items.forEach(([value, label], i) => {
    if (i) cols.push(rect({ name: 'Divider', w: 1, sizingW: 'fixed', sizingH: 'fill', fills: [solid(C.line)] }))
    cols.push(frame({
      name: `Fact / ${label}`, sizingW: 'fill', fills: [], clip: false, auto: { dir: 'column', gap: 2, pad: [0, 8, 0, i ? 14 : 0] },
      children: [text(value, { t: serif(20, 450, { letterSpacing: -1 }) }), text(label, { color: C.muted, t: sans(12) })],
    }))
  })
  return frame({
    name: 'Facts', sizingW: 'fill', fills: [], clip: false, auto: { dir: 'column', gap: 12 },
    children: [rule('Rule'), frame({ name: 'Columns', sizingW: 'fill', fills: [], clip: false, auto: { gap: 0 }, children: cols }), rule('Rule')],
  })
}

function roundButton(name: string, ic: string, x: number, y: number, size = 40, inter?: Interaction[]): Node {
  return frame({
    name, x, y, w: size, h: size, sizingW: 'fixed', sizingH: 'fixed', radius: 99, fills: [solid(C.card)], strokes: [solid(C.line)], auto: { alignX: 'center', alignY: 'center' }, interactions: inter,
    children: [icon(ic, { w: 19, h: 19, color: C.ink })],
  })
}

/** A lettered part: an Achiote ring with a hand-lettered letter, and its leader to the part (RUECA.md §3). */
function partLetter(letter: string, x: number, y: number, lead: { dx: number; dy: number }): Node[] {
  // rotation turns a node about its centre, counter-clockwise (Figma's sign): place the leader by its midpoint
  const len = Math.hypot(lead.dx, lead.dy), ang = (Math.atan2(lead.dy, lead.dx) * 180) / Math.PI
  const mx = x + 11 + lead.dx / 2, my = y + 11 + lead.dy / 2
  return [
    rect({ name: `Leader ${letter}`, x: mx - len / 2, y: my - 0.5, w: len, h: 1, rotation: -ang, fills: [solid(C.pen)] }),
    frame({
      name: `Part ${letter}`, x, y, w: 22, h: 22, sizingW: 'fixed', sizingH: 'fixed', radius: 99, fills: [solid(C.bg)], strokes: [solid(C.pen)], strokeWidth: 1.25, auto: { alignX: 'center', alignY: 'center' },
      children: [text(letter, { color: C.pen, t: { family: HAND, size: 15, weight: 400 } })],
    }),
  ]
}

function partRow(letter: string, name: string): Node {
  return frame({
    name: `Part / ${name}`, fills: [], clip: false, sizingW: 'fill', auto: { gap: 10, alignY: 'center' },
    children: [
      frame({ name: 'Letter', w: 20, h: 20, sizingW: 'fixed', sizingH: 'fixed', radius: 99, fills: [], strokes: [solid(C.pen)], auto: { alignX: 'center', alignY: 'center' }, children: [text(letter, { color: C.pen, t: { family: HAND, size: 13 } })] }),
      text(name, { t: sans(14, 500) }),
    ],
  })
}

/** Red-pen notes on the canvas: numbered, mono, Achiote. Annotation, never content. */
function penNotes(): Node[] {
  const note = (n: number, x: number, y: number, label: string): Node => frame({
    name: `Note ${n}`, x, y, fills: [], clip: false, auto: { gap: 8, alignY: 'center' },
    children: [
      frame({
        name: 'Number', w: 20, h: 20, sizingW: 'fixed', sizingH: 'fixed', radius: 99, fills: [], strokes: [solid(C.pen)], auto: { alignX: 'center', alignY: 'center' },
        children: [text(String(n), { color: C.pen, t: { family: 'Menlo', size: 11, weight: 600 } })],
      }),
      text(label, { color: C.pen, t: { family: HAND, size: 18 } }),
    ],
  })
  return [note(1, 884, 150, 'the plate · one flat bright'), note(2, 884, 330, 'letters A–D name the parts'), note(3, 884, 752, 'one primary action')]
}

export function seedDoc(): Doc {
  const homeId = uid('f'), detailId = uid('f')

  const home = frame({
    id: homeId, name: 'Home', x: 0, y: 0, w: 390, h: 844, fills: [solid(C.bg)],
    children: [
      statusBar(C.ink),
      frame({
        name: 'Greeting', x: 24, y: 66, w: 280, sizingW: 'fixed', fills: [], clip: false, auto: { dir: 'column', gap: 2 },
        children: [
          text('Good morning, Inés', { color: C.muted, t: sans(14, 500) }),
          text('What will you look at today?', { sizingW: 'fill', t: { ...serif(30, 400), lineHeight: 33, resize: 'auto-height' } }),
        ],
      }),
      ellipse({ name: 'Avatar', x: 322, y: 64, w: 44, h: 44, fills: [solid(C.card), imageFill('ines')], strokes: [solid(C.line)], strokeWidth: 1, strokeAlign: 'outside' }),
      frame({
        name: 'Search', x: 24, y: 172, w: 342, h: 48, sizingW: 'fixed', sizingH: 'fixed', radius: 12, fills: [solid(C.card)], strokes: [solid(C.line)], auto: { gap: 10, pad: [0, 14, 0, 16], alignY: 'center' },
        children: [
          icon('Search', { w: 18, h: 18, color: C.muted }),
          text('Instruments, rooms, makers', { color: C.faint, sizingW: 'fill', t: { ...sans(15), resize: 'auto-height' } }),
          icon('SlidersHorizontal', { w: 18, h: 18, color: C.ink }),
        ],
      }),
      frame({ name: 'Filters', x: 24, y: 234, fills: [], clip: false, auto: { gap: 8 }, children: [chip('All', true), chip('Astronomy'), chip('Navigation'), chip('Measure')] }),
      frame({
        name: 'Section / On view', x: 24, y: 290, w: 342, sizingW: 'fixed', fills: [], clip: false, auto: { between: true, alignY: 'center' },
        children: [text('On view today', { t: serif(21, 450, { letterSpacing: -1 }) }), text('See all', { color: C.ink, t: sans(14, 500) })],
      }),
      frame({
        name: 'Featured card', x: 24, y: 326, w: 342, h: 212, radius: 18, fills: [solid(C.bright)],
        interactions: [go(detailId)],
        children: [
          rect({ name: 'Plate', x: 156, y: 10, w: 176, h: 192, fills: [{ ...imageFill('astrolabe'), fit: 'fit' }] }),
          frame({
            name: 'Room', x: 16, y: 16, radius: 99, fills: [solid(C.bg)], auto: { gap: 5, pad: [5, 10, 5, 9], alignY: 'center' },
            children: [icon('MapPin', { w: 13, h: 13, color: C.ink, stroke: 2 }), text('Room 3', { t: sans(12, 600) })],
          }),
          text(astrolabe.name, { x: 18, y: 128, color: C.ink, t: serif(32, 400) }),
          text(`Made around 1580, with a 3 minute audio guide`, { x: 18, y: 170, w: 150, sizingW: 'fixed', color: C.ink, t: { ...sans(13, 500), lineHeight: 18, resize: 'auto-height' } }),
        ],
      }),
      text('Rooms', { x: 24, y: 556, t: serif(21, 450, { letterSpacing: -1 }) }),
      frame({
        name: 'Rooms list', x: 24, y: 590, w: 342, sizingW: 'fixed', fills: [], clip: false, auto: { dir: 'column', gap: 10 },
        children: [
          roomRow(orrery.name, roomLine(orrery.room), 'orrery', { interactions: [go(detailId, 'move-in', 320)] }),
          roomRow(telescope.name, roomLine(telescope.room), 'telescope'),
        ],
      }),
      frame({
        name: 'Tab bar', x: 0, y: 760, w: 390, h: 84, sizingW: 'fixed', sizingH: 'fixed', fills: [solid(C.card)], strokes: [solid(C.line)], auto: { between: true, pad: [10, 34, 26, 34], alignY: 'start' },
        children: [tab('Explore', 'Compass', true), tab('Map', 'Map'), tab('Tickets', 'Ticket'), tab('Saved', 'Bookmark')],
      }),
    ],
  })

  const detail = frame({
    id: detailId, name: 'Object', x: 470, y: 0, w: 390, h: 844, fills: [solid(C.bg)],
    children: [
      rect({ name: 'Plate', x: 50, y: 70, w: 290, h: 290, fills: [{ ...imageFill('astrolabe'), fit: 'fit' }] }),
      ...partLetter('A', 268, 82, { dx: -66, dy: 6 }),
      ...partLetter('B', 302, 168, { dx: -92, dy: 22 }),
      ...partLetter('C', 304, 254, { dx: -78, dy: -24 }),
      ...partLetter('D', 62, 300, { dx: 52, dy: -26 }),
      statusBar(C.ink),
      roundButton('Back', 'ArrowLeft', 20, 56, 40, [{ id: uid('i'), trigger: 'tap', action: 'back', transition: 'smart', duration: 380, easing: ease }]),
      roundButton('Save', 'Bookmark', 330, 56, 40),
      frame({
        name: 'Sheet', x: 0, y: 376, w: 390, h: 468, sizingW: 'fixed', sizingH: 'fixed', radius: [26, 26, 0, 0], fills: [solid(C.card)], strokes: [solid(C.line)], auto: { dir: 'column', gap: 18, pad: [24, 24, 28, 24] },
        children: [
          frame({
            name: 'Title', sizingW: 'fill', fills: [], clip: false, auto: { dir: 'column', gap: 4 },
            children: [
              text(astrolabe.name, { t: serif(34, 400) }),
              text(`Made around 1580 by ${astrolabe.maker.replace(/^A /, 'a ')}`, { color: C.muted, t: sans(14) }),
            ],
          }),
          facts([['Room 3', 'Where'], ['4 parts', 'On the plate'], ['3 min', 'Audio guide']]),
          frame({
            name: 'Parts', sizingW: 'fill', fills: [], clip: false, auto: { dir: 'column', gap: 8 },
            children: [
              frame({ name: 'Row 1', sizingW: 'fill', fills: [], clip: false, auto: { gap: 12 }, children: [partRow('A', astrolabe.parts[0]), partRow('B', astrolabe.parts[1])] }),
              frame({ name: 'Row 2', sizingW: 'fill', fills: [], clip: false, auto: { gap: 12 }, children: [partRow('C', astrolabe.parts[2]), partRow('D', astrolabe.parts[3])] }),
            ],
          }),
          text(astrolabe.blurb, { name: 'Description', color: C.muted, sizingW: 'fill', t: { ...sans(15), lineHeight: 23, resize: 'auto-height' } }),
          frame({
            name: 'Actions', sizingW: 'fill', fills: [], clip: false, auto: { gap: 12, alignY: 'center' },
            children: [
              frame({ name: 'Map button', w: 52, h: 52, sizingW: 'fixed', sizingH: 'fixed', radius: 14, fills: [solid(C.bg)], strokes: [solid(C.line)], auto: { alignX: 'center', alignY: 'center' }, children: [icon('Map', { w: 20, h: 20, color: C.ink })] }),
              frame({
                name: 'Hear it', h: 52, sizingW: 'fill', sizingH: 'fixed', radius: 14, fills: [solid(C.bright)],
                auto: { gap: 8, alignX: 'center', alignY: 'center' },
                children: [icon('Headphones', { w: 18, h: 18, color: C.ink, stroke: 2 }), text('Play the audio guide', { color: C.ink, t: sans(16, 600) })],
              }),
            ],
          }),
        ],
      }),
    ],
  })

  const button = frame({
    name: 'Button / Primary', component: true, x: 0, y: 0, radius: 14, fills: [solid(C.bright)],
    auto: { gap: 8, pad: [15, 24, 15, 24], alignX: 'center', alignY: 'center' },
    children: [icon('Headphones', { w: 18, h: 18, color: C.ink, stroke: 2 }), text('Play the audio guide', { color: C.ink, t: sans(16, 600) })],
  })
  const secondary = frame({
    name: 'Button / Secondary', component: true, x: 200, y: 0, radius: 14, fills: [solid(C.card)], strokes: [solid(C.line)],
    auto: { gap: 8, pad: [15, 24, 15, 24], alignX: 'center', alignY: 'center' },
    children: [icon('Bookmark', { w: 18, h: 18, color: C.ink }), text('Save', { color: C.ink, t: sans(16, 600) })],
  })
  const chipC = { ...chip('Chip', false), component: true, x: 0, y: 100, name: 'Chip / Default' }
  const chipA = { ...chip('Chip', true), component: true, x: 110, y: 100, name: 'Chip / Selected' }
  const row = { ...roomRow('List row', 'Theme, room number', 'telescope'), component: true, x: 0, y: 170, w: 342, sizingW: 'fixed' as const, name: 'List row' }
  const statC = { ...facts([['Room 3', 'Where'], ['4 parts', 'On the plate'], ['3 min', 'Audio guide']]), component: true, x: 0, y: 280, w: 342, sizingW: 'fixed' as const, name: 'Facts row' }
  const parts = { ...partRow('A', 'Part name'), component: true, x: 360, y: 296, sizingW: 'hug' as const, name: 'Part / Lettered' }
  const scrim = rect({ name: 'Plate / On bright', component: true, x: 0, y: 380, w: 220, h: 160, radius: 18, fills: [solid(C.bright), { ...imageFill('orrery'), fit: 'fit' }] })
  const fade = rect({ name: 'Plate / On paper', component: true, x: 240, y: 380, w: 160, h: 160, radius: 18, fills: [solid(C.bg), { ...imageFill('armillary'), fit: 'fit' }], strokes: [solid(C.line)] })

  return {
    name: 'Gabinete app',
    pages: [
      {
        id: uid('pg'), name: 'App screens', bg: '', nodes: [home, detail, ...penNotes()], start: homeId,
        comments: [{ id: uid('c'), x: 470 + 300, y: 300, text: 'Could the letters on the plate be tappable? Tap B, hear about the rete.', author: 'Marta Ibáñez', at: Date.now() - 1000 * 60 * 60 * 3 }],
      },
      { id: uid('pg'), name: 'Components', bg: '', nodes: [button, secondary, chipC, chipA, row, statC, parts, scrim, fade], comments: [] },
      { id: uid('pg'), name: 'Archive', bg: '', nodes: [], comments: [] },
    ],
  }
}
