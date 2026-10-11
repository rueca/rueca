/* Flows — document model, screen templates and the demo content. Pure data. */
import type { Edge, Node } from '@xyflow/react'
import { WIRE } from '@/demo/wire'
import { DYE } from '@/demo/clients'
import { uid as makeUid } from '../util'

export type Kind = 'screen' | 'decision' | 'terminal' | 'note' | 'section'
export type Status = 'draft' | 'ready' | 'shipped'
export type Trigger = 'tap' | 'swipe' | 'longpress' | 'auto' | 'condition' | 'back' | 'submit'
export type EdgeStyle = 'smooth' | 'bezier' | 'straight'
/** Notes in the wire style: `pen` is the red-pen annotation; `card` / `sheet` are plain paper stickies. */
export type StickyColor = 'pen' | 'card' | 'sheet'
export type Template =
  | 'splash' | 'welcome' | 'signup' | 'login' | 'otp' | 'permissions' | 'home' | 'search' | 'product'
  | 'cart' | 'address' | 'payment' | 'review' | 'success' | 'error' | 'profile' | 'settings' | 'paywall' | 'empty'

export interface NodeData extends Record<string, unknown> {
  name: string
  notes?: string
  status?: Status
  /** section id this node belongs to (geometric membership, refreshed on drop) */
  section?: string
  template?: Template
  role?: 'start' | 'end'
  color?: StickyColor
  hue?: string
  /** notes: the node this sticky annotates (kept beside it by auto layout) */
  attach?: string
}
export interface EdgeData extends Record<string, unknown> {
  label?: string
  trigger: Trigger
  happy?: boolean
  style?: EdgeStyle
  /** keep the chosen handles when nodes move */
  pinned?: boolean
}
export type FlowNode = Node<NodeData>
export type FlowEdge = Edge<EdgeData>

export interface Reply { id: string; author: string; text: string; at: number }
/** A pin. With `node` set, x/y are relative to that node, so the pin travels with it. */
export interface Comment { id: string; node?: string; x: number; y: number; author: string; text: string; at: number; resolved?: boolean; replies: Reply[] }

export interface Flow {
  id: string
  name: string
  description: string
  owner: string
  nodes: FlowNode[]
  edges: FlowEdge[]
  comments: Comment[]
  updated: number
}
export interface FlowsDoc { flows: Flow[] }

/* ---------------------------------------------------------------- people */
/** The Gabinete app team (src/demo/clients.ts); avatar hues are Rueca's dyes. */
export const PEOPLE: Record<string, { name: string; initials: string; hue: string }> = {
  ana: { name: 'Marta Ibáñez', initials: 'MI', hue: DYE.malva },
  kai: { name: 'Jon Arrieta', initials: 'JA', hue: DYE.achiote },
  mei: { name: 'Sofía Vega', initials: 'SV', hue: DYE.hoja },
  you: { name: 'You', initials: 'Y', hue: DYE.cielo },
}

/* ---------------------------------------------------------------- catalogue */
export const TEMPLATES: { value: Template; label: string; group: 'Onboarding' | 'Commerce' | 'System' }[] = [
  { value: 'splash', label: 'Splash', group: 'Onboarding' },
  { value: 'welcome', label: 'Welcome', group: 'Onboarding' },
  { value: 'signup', label: 'Sign up', group: 'Onboarding' },
  { value: 'login', label: 'Log in', group: 'Onboarding' },
  { value: 'otp', label: 'Verify code', group: 'Onboarding' },
  { value: 'permissions', label: 'Permission', group: 'Onboarding' },
  { value: 'paywall', label: 'Paywall', group: 'Onboarding' },
  { value: 'home', label: 'Home feed', group: 'Commerce' },
  { value: 'search', label: 'Search', group: 'Commerce' },
  { value: 'product', label: 'Product', group: 'Commerce' },
  { value: 'cart', label: 'Cart', group: 'Commerce' },
  { value: 'address', label: 'Address', group: 'Commerce' },
  { value: 'payment', label: 'Payment', group: 'Commerce' },
  { value: 'review', label: 'Review', group: 'Commerce' },
  { value: 'success', label: 'Success', group: 'System' },
  { value: 'error', label: 'Error', group: 'System' },
  { value: 'empty', label: 'Empty state', group: 'System' },
  { value: 'profile', label: 'Profile', group: 'System' },
  { value: 'settings', label: 'Settings', group: 'System' },
]
export const templateLabel = (t?: Template) => TEMPLATES.find((x) => x.value === t)?.label ?? 'Screen'

export const TRIGGERS: { value: Trigger; label: string }[] = [
  { value: 'tap', label: 'Tap' },
  { value: 'swipe', label: 'Swipe' },
  { value: 'longpress', label: 'Long press' },
  { value: 'submit', label: 'Submit' },
  { value: 'auto', label: 'After delay' },
  { value: 'condition', label: 'Condition' },
  { value: 'back', label: 'Back' },
]

/* Demo content is drawn in the wire palette (src/demo/wire.ts): one ink on
   Rueca's paper, hairlines, Achiote only as the red pen. Swatches are the paper tones. */
export const STICKY: Record<StickyColor, string> = { pen: WIRE.pen, card: WIRE.card, sheet: WIRE.sheet }
/** Section fills: paper tones, so every section reads as a sheet on the board. */
export const SECTION_HUES: string[] = [WIRE.paper, WIRE.card, WIRE.sheet]
/** Older docs / imports may carry a colour we no longer draw. */
export const stickyOf = (c?: string): StickyColor => (c === 'pen' || c === 'sheet' ? c : 'card')

/** Fixed footprint per kind; the layout uses measured sizes when it has them. */
export const SIZE: Record<Kind, { w: number; h: number }> = {
  screen: { w: 176, h: 327 },
  decision: { w: 136, h: 136 },
  terminal: { w: 152, h: 40 },
  note: { w: 176, h: 120 },
  section: { w: 800, h: 480 },
}
export const screenSize = (thumbs: boolean) => (thumbs ? SIZE.screen : { w: 176, h: 58 })

/* ---------------------------------------------------------------- factories */
export const uid = (p = 'n') => makeUid(p)

export function makeNode(kind: Kind, at: { x: number; y: number }, data: Partial<NodeData> = {}, id = uid()): FlowNode {
  const base: FlowNode = { id, type: kind, position: at, data: { name: '', ...data } }
  if (kind === 'screen') base.data = { name: templateLabel(data.template ?? 'home'), template: 'home', status: 'draft', ...data }
  if (kind === 'decision') base.data = { name: 'Condition?', status: 'draft', ...data }
  if (kind === 'terminal') base.data = { name: data.role === 'end' ? 'End' : 'Start', role: 'start', ...data }
  if (kind === 'note') base.data = { name: 'Add a note', color: 'card', ...data }
  if (kind === 'section') {
    base.data = { name: 'Section', hue: SECTION_HUES[0], ...data }
    base.width = SIZE.section.w
    base.height = SIZE.section.h
    base.zIndex = -1
  }
  return base
}

export function makeEdge(source: string, target: string, data: Partial<EdgeData> = {}, handles: [string, string] = ['r', 'l']): FlowEdge {
  return { id: uid('e'), source, target, sourceHandle: handles[0], targetHandle: handles[1], type: 'flow', data: { trigger: 'tap', ...data } }
}

/* ---------------------------------------------------------------- demo */
function demoMain(): Flow {
  const S = (id: string, template: Template, name: string, section: string, status: Status = 'ready', notes?: string) =>
    makeNode('screen', { x: 0, y: 0 }, { template, name, section, status, notes }, id)
  const nodes: FlowNode[] = [
    makeNode('section', { x: 0, y: 0 }, { name: 'First launch', hue: WIRE.paper }, 'sec-onb'),
    makeNode('section', { x: 0, y: 0 }, { name: 'Tickets', hue: WIRE.paper }, 'sec-chk'),
    makeNode('terminal', { x: 0, y: 0 }, { name: 'App opened', role: 'start', section: 'sec-onb' }, 'start'),
    S('splash', 'splash', 'Splash', 'sec-onb', 'shipped', 'The orrery on Cielo. Holds for at most 1.2s while the session refreshes.'),
    makeNode('decision', { x: 0, y: 0 }, { name: 'Member?', section: 'sec-onb', status: 'shipped' }, 'd-account'),
    S('welcome', 'welcome', 'Welcome', 'sec-onb', 'shipped', 'Three plates, one per room. Skip is always visible.'),
    S('signup', 'signup', 'Create account', 'sec-onb', 'ready', 'Email or Apple / Google. Members get their discount from the first ticket.'),
    S('otp', 'otp', 'Verify email', 'sec-onb', 'ready', 'Six-digit code; the link in the email signs in too.'),
    S('perm', 'permissions', 'Indoor map', 'sec-onb', 'draft', 'Location lights up “you are here” on the floor plan. Copy still in review.'),
    S('login', 'login', 'Sign in', 'sec-onb', 'shipped'),
    S('home', 'home', 'On view today', 'sec-chk', 'shipped', 'Plates by room; the first card is today’s featured object.'),
    S('product', 'product', 'Object', 'sec-chk', 'ready', 'Lettered parts A–D on the plate; tap one to hear about it.'),
    S('cart', 'cart', 'Choose a visit', 'sec-chk', 'ready', 'Date strip, then half-hour slots. Busy slots shown, not hidden.'),
    makeNode('decision', { x: 0, y: 0 }, { name: 'Bringing guests?', section: 'sec-chk', status: 'ready' }, 'd-address'),
    S('address', 'address', 'Who’s coming', 'sec-chk', 'draft'),
    S('payment', 'payment', 'Payment', 'sec-chk', 'ready', 'Apple Pay sheet replaces this screen on iOS.'),
    S('review', 'review', 'Review', 'sec-chk', 'draft'),
    makeNode('decision', { x: 0, y: 0 }, { name: 'Payment OK?', section: 'sec-chk', status: 'ready' }, 'd-pay'),
    S('success', 'success', 'Tickets ready', 'sec-chk', 'draft', 'QR tickets in the wallet, and the room for the first object.'),
    S('failed', 'error', 'Payment failed', 'sec-chk', 'draft'),
    makeNode('terminal', { x: 0, y: 0 }, { name: 'Visit booked', role: 'end', section: 'sec-chk' }, 'end'),
    makeNode('note', { x: 0, y: 0 }, { name: 'Ask for location at the door, not at first launch: the map is only useful inside.', color: 'pen', section: 'sec-onb', attach: 'perm' }, 'note-1'),
    makeNode('note', { x: 0, y: 0 }, { name: 'Retry holds the slot for 10 minutes. Sunday mornings sell out.', color: 'pen', section: 'sec-chk', attach: 'failed' }, 'note-2'),
  ]
  const E = (s: string, t: string, trigger: Trigger, label = '', happy = false) => makeEdge(s, t, { trigger, label, happy })
  const edges: FlowEdge[] = [
    E('start', 'splash', 'auto', 'Launch', true),
    E('splash', 'd-account', 'auto', 'After 1.2s', true),
    E('d-account', 'welcome', 'condition', 'No', true),
    E('d-account', 'login', 'condition', 'Yes'),
    E('welcome', 'signup', 'tap', 'Get started', true),
    E('signup', 'otp', 'submit', 'Continue', true),
    E('otp', 'perm', 'auto', 'Code verified', true),
    E('perm', 'home', 'tap', 'Allow', true),
    E('login', 'home', 'submit', 'Sign in'),
    E('home', 'product', 'tap', 'Tap a plate', true),
    E('product', 'cart', 'tap', 'Visit', true),
    E('cart', 'd-address', 'tap', 'Book', true),
    E('d-address', 'payment', 'condition', 'No', true),
    E('d-address', 'address', 'condition', 'Yes'),
    E('address', 'payment', 'submit', 'Save'),
    E('payment', 'review', 'tap', 'Continue', true),
    E('review', 'd-pay', 'submit', 'Pay', true),
    E('d-pay', 'success', 'condition', 'Yes', true),
    E('d-pay', 'failed', 'condition', 'No'),
    E('failed', 'payment', 'back', 'Retry'),
    E('success', 'end', 'tap', 'Done', true),
  ]
  const now = Date.now()
  return {
    id: 'flow-main', name: 'First visit', owner: 'ana',
    description: 'First launch to first ticket in the Gabinete museum app. Happy path is highlighted; branches cover members and payment failure.',
    nodes, edges, updated: now - 1000 * 60 * 42,
    comments: [
      { id: 'c1', node: 'otp', x: 160, y: -10, author: 'kai', text: 'Can we fold Verify email into Create account? Two screens feels heavy for buying a ticket.', at: now - 1000 * 60 * 60 * 5, replies: [{ id: 'r1', author: 'ana', text: 'Members pay less, so we need the email before the price. Let’s test an inline code though.', at: now - 1000 * 60 * 60 * 3 }] },
      { id: 'c2', node: 'failed', x: 160, y: -10, author: 'mei', text: 'Failure copy should say whether the card was charged.', at: now - 1000 * 60 * 50, replies: [] },
    ],
  }
}

function demoReset(): Flow {
  const nodes: FlowNode[] = [
    makeNode('section', { x: 0, y: 0 }, { name: 'Recover access', hue: WIRE.paper }, 'sec-reset'),
    makeNode('terminal', { x: 0, y: 0 }, { name: 'Forgot password', role: 'start', section: 'sec-reset' }, 'r-start'),
    makeNode('screen', { x: 0, y: 0 }, { template: 'login', name: 'Enter email', status: 'shipped', section: 'sec-reset' }, 'r-email'),
    makeNode('decision', { x: 0, y: 0 }, { name: 'Account found?', status: 'shipped', section: 'sec-reset' }, 'r-found'),
    makeNode('screen', { x: 0, y: 0 }, { template: 'otp', name: 'Check your inbox', status: 'ready', section: 'sec-reset' }, 'r-code'),
    makeNode('screen', { x: 0, y: 0 }, { template: 'signup', name: 'New password', status: 'ready', section: 'sec-reset' }, 'r-new'),
    makeNode('screen', { x: 0, y: 0 }, { template: 'error', name: 'No account', status: 'draft', notes: 'Never confirm whether an email exists. Show the same message either way.', section: 'sec-reset' }, 'r-none'),
    makeNode('screen', { x: 0, y: 0 }, { template: 'success', name: 'Password updated', status: 'ready', section: 'sec-reset' }, 'r-done'),
    makeNode('terminal', { x: 0, y: 0 }, { name: 'Signed in', role: 'end', section: 'sec-reset' }, 'r-end'),
  ]
  const edges: FlowEdge[] = [
    makeEdge('r-start', 'r-email', { trigger: 'tap', label: 'Forgot?', happy: true }),
    makeEdge('r-email', 'r-found', { trigger: 'submit', label: 'Send link', happy: true }),
    makeEdge('r-found', 'r-code', { trigger: 'condition', label: 'Yes', happy: true }),
    makeEdge('r-found', 'r-none', { trigger: 'condition', label: 'No' }),
    makeEdge('r-code', 'r-new', { trigger: 'tap', label: 'Open link', happy: true }),
    makeEdge('r-new', 'r-done', { trigger: 'submit', label: 'Save', happy: true }),
    makeEdge('r-done', 'r-end', { trigger: 'auto', label: 'After 2s', happy: true }),
  ]
  return { id: 'flow-reset', name: 'Password reset', owner: 'mei', description: 'Members recover access without the app leaking which emails have accounts.', nodes, edges, comments: [], updated: Date.now() - 1000 * 60 * 60 * 26 }
}

function demoUpgrade(): Flow {
  const nodes: FlowNode[] = [
    makeNode('section', { x: 0, y: 0 }, { name: 'Membership', hue: WIRE.paper }, 'sec-up'),
    makeNode('terminal', { x: 0, y: 0 }, { name: 'Tap “Become a member”', role: 'start', section: 'sec-up' }, 'u-start'),
    makeNode('screen', { x: 0, y: 0 }, { template: 'paywall', name: 'Memberships', status: 'ready', section: 'sec-up' }, 'u-plans'),
    makeNode('screen', { x: 0, y: 0 }, { template: 'payment', name: 'Confirm membership', status: 'draft', section: 'sec-up' }, 'u-pay'),
    makeNode('screen', { x: 0, y: 0 }, { template: 'success', name: 'Your member card', status: 'draft', section: 'sec-up' }, 'u-ok'),
    makeNode('note', { x: 0, y: 0 }, { name: 'Family membership pre-selected? Needs a pricing review first.', color: 'pen', section: 'sec-up', attach: 'u-plans' }, 'u-note'),
  ]
  const edges: FlowEdge[] = [
    makeEdge('u-start', 'u-plans', { trigger: 'tap', label: '', happy: true }),
    makeEdge('u-plans', 'u-pay', { trigger: 'tap', label: 'Choose', happy: true }),
    makeEdge('u-pay', 'u-ok', { trigger: 'submit', label: 'Join', happy: true }),
  ]
  return { id: 'flow-upgrade', name: 'Become a member', owner: 'kai', description: 'Membership from the ticket confirmation: free entry for a year, talks, the member evenings.', nodes, edges, comments: [], updated: Date.now() - 1000 * 60 * 60 * 24 * 3 }
}

export const demoFlows = () => [demoMain(), demoReset(), demoUpgrade()]

/** A user-picked hue, darkened just enough that white text on it clears WCAG AA (≥4.5:1). */
export { readableOn as deepen } from '@kit'
