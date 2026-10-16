/* Journey — document model and demo content (Gabinete, a museum of scientific instruments: src/demo/clients.ts). Pure data. */
import {
  Footprints, MonitorSmartphone, MessageSquareQuote, HeartPulse, TriangleAlert, Lightbulb, Users,
  Smartphone, Globe, Mail, Bell, Store, Headphones, Megaphone, Package, MessageSquare, type LucideIcon,
} from 'lucide-react'
import { uid as makeUid } from '../util'
import { DYE, GABINETE } from '@/demo/clients'

export type LaneId = 'actions' | 'touchpoints' | 'thoughts' | 'emotion' | 'pains' | 'opps' | 'owner'
export type Channel = 'app' | 'web' | 'email' | 'push' | 'store' | 'support' | 'social' | 'packaging' | 'sms'

export const LANES: { id: LaneId; label: string; one: string; icon: LucideIcon; hint: string }[] = [
  { id: 'actions', label: 'Actions', one: 'Action', icon: Footprints, hint: 'What the customer does at this stage.' },
  { id: 'touchpoints', label: 'Touchpoints', one: 'Touchpoint', icon: MonitorSmartphone, hint: 'Where they meet the brand: channel and moment.' },
  { id: 'thoughts', label: 'Thoughts', one: 'Thought', icon: MessageSquareQuote, hint: 'What they are thinking, in their words.' },
  { id: 'emotion', label: 'Emotion', one: 'Emotion', icon: HeartPulse, hint: 'How they feel, from −2 to +2. Drag the points.' },
  { id: 'pains', label: 'Pain points', one: 'Pain point', icon: TriangleAlert, hint: 'Friction, worry, failure. Severity 1–3.' },
  { id: 'opps', label: 'Opportunities', one: 'Opportunity', icon: Lightbulb, hint: 'Ideas that answer a pain point. Link them.' },
  { id: 'owner', label: 'Owner', one: 'Owner', icon: Users, hint: 'The team accountable for this stage.' },
]
export const laneOf = (id: LaneId) => LANES.find((l) => l.id === id)!

export const CHANNELS: Record<Channel, { label: string; icon: LucideIcon }> = {
  app: { label: 'App', icon: Smartphone }, web: { label: 'Website', icon: Globe }, email: { label: 'Email', icon: Mail },
  push: { label: 'Push', icon: Bell }, store: { label: 'In store', icon: Store }, support: { label: 'Support', icon: Headphones },
  social: { label: 'Social', icon: Megaphone }, packaging: { label: 'Packaging', icon: Package }, sms: { label: 'SMS', icon: MessageSquare },
}

/** The museum's teams; swatches are Rueca's dyes. */
export const TEAMS: Record<string, string> = {
  'Marketing': DYE.achiote, 'Web': DYE.cielo, 'App team': DYE.malva, 'Membership': DYE.cochinilla, 'Front of house': DYE.hoja, 'Learning': DYE.gualda,
}

export interface Card {
  id: string
  lane: LaneId
  stage: string
  text: string
  tags: string[]
  channel?: Channel
  /** pains: severity · opps: impact (1–3) */
  level?: 1 | 2 | 3
  /** opps → the pain points they answer */
  links?: string[]
  team?: string
}
export interface Stage { id: string; name: string; goal: string; duration: string; emotion: number; feeling: string }
export interface Persona {
  id: string; name: string; role: string; age: number; hue: string; quote: string
  /** portrait (an engraved medallion, ink on transparent); the wire avatar slot stands in without one */
  photo?: string
  goals: string[]; frustrations: string[]; scenario: string
  stages: Stage[]; cards: Card[]
}
export interface JourneyDoc { title: string; personas: Persona[] }

export const uid = (p = 'c') => makeUid(p)
export const PERSONA_HUES: string[] = [DYE.cielo, DYE.gualda, DYE.cochinilla, DYE.malva, DYE.hoja, DYE.achiote]

export const emoji = (v: number) => (v >= 1.5 ? '😄' : v >= 0.5 ? '🙂' : v > -0.5 ? '😐' : v > -1.5 ? '🙁' : '😣')
export const fmtEmotion = (v: number) => (v > 0 ? `+${v}` : v < 0 ? `−${Math.abs(v)}` : '0')

/* ------------------------------------------------------------------ demo */
const STAGE_NAMES = ['Discover', 'Plan', 'Arrive', 'Explore', 'Leave', 'Return']

type Row = [LaneId, number, string, string[]?, Partial<Card>?]
function build(prefix: string, stages: Omit<Stage, 'id'>[], rows: Row[], links: [string, string][] = []): { stages: Stage[]; cards: Card[] } {
  const st = stages.map((s, i) => ({ ...s, id: `${prefix}-s${i}` }))
  const cards: Card[] = rows.map(([lane, si, text, tags = [], extra = {}], i) => ({ id: extra.id ?? `${prefix}-c${i}`, lane, stage: st[si].id, text, tags, ...extra }))
  for (const [opp, pain] of links) {
    const o = cards.find((c) => c.id === opp)
    if (o) o.links = [...(o.links ?? []), pain]
  }
  return { stages: st, cards }
}

const [INES, TOMAS, RUTH] = GABINETE.people

function ines(): Persona {
  const { stages, cards } = build('i', [
    { name: STAGE_NAMES[0], goal: 'Find a trip that fits the science syllabus.', duration: '6 weeks before', emotion: 0.5, feeling: 'Hopeful' },
    { name: STAGE_NAMES[1], goal: 'Book 28 pupils and two helpers in one go.', duration: '4 weeks before', emotion: -1, feeling: 'Stretched' },
    { name: STAGE_NAMES[2], goal: 'Get the class through the door and counted.', duration: 'Day · 9:40', emotion: -0.5, feeling: 'On edge' },
    { name: STAGE_NAMES[3], goal: 'Keep thirty children curious for ninety minutes.', duration: 'Day · 10:00', emotion: 1.5, feeling: 'Delighted' },
    { name: STAGE_NAMES[4], goal: 'Leave on time, nobody left behind.', duration: 'Day · 11:30', emotion: 0.5, feeling: 'Relieved' },
    { name: STAGE_NAMES[5], goal: 'Bring next year’s class back.', duration: 'Next term', emotion: 1, feeling: 'Committed' },
  ], [
    ['actions', 0, 'Searches “museum trip astronomy key stage 2”', ['#schools']],
    ['actions', 0, 'Asks the staff-room group who has been', ['#social']],
    ['actions', 1, 'Fills in the group booking form twice after a timeout', ['#booking']],
    ['actions', 1, 'Downloads the risk assessment for the head', ['#schools']],
    ['actions', 2, 'Counts heads in the courtyard, then again inside', ['#arrival']],
    ['actions', 3, 'Splits the class into four rooms with the audio guide', ['#guide']],
    ['actions', 3, 'Lets a pupil wind the orrery at the demo table', ['#guide']],
    ['actions', 4, 'Buys a pocket compass for the classroom', ['#shop']],
    ['actions', 5, 'Puts the visit on next year’s calendar', ['#schools']],
    ['touchpoints', 0, 'Schools page', ['#schools'], { channel: 'web' }],
    ['touchpoints', 1, 'Group booking form', ['#booking'], { channel: 'web' }],
    ['touchpoints', 1, 'Booking confirmation with a PDF', [], { channel: 'email' }],
    ['touchpoints', 2, 'Front desk and the coat room', ['#arrival'], { channel: 'store' }],
    ['touchpoints', 3, 'Audio guide, child track', ['#guide'], { channel: 'app' }],
    ['touchpoints', 4, 'Museum shop', ['#shop'], { channel: 'store' }],
    ['thoughts', 1, '“Why can’t I book thirty people without phoning?”', ['#booking']],
    ['thoughts', 2, '“Where do thirty coats go?”', ['#arrival']],
    ['thoughts', 3, '“They’re quiet. They’re actually listening.”', ['#guide']],
    ['pains', 1, 'Group booking caps at 10 tickets online', ['#booking'], { level: 3, id: 'i-p1' }],
    ['pains', 1, 'Risk assessment hidden in a PDF on another page', ['#schools'], { level: 2, id: 'i-p2' }],
    ['pains', 2, 'Coats and bags block the entrance at 9:45', ['#arrival'], { level: 2, id: 'i-p3' }],
    ['opps', 1, 'Group booking up to 40, with helpers free', ['#booking'], { level: 3, id: 'i-o1' }],
    ['opps', 1, 'Teacher pack: syllabus links, risk form, room map', ['#schools'], { level: 2, id: 'i-o2' }],
    ['opps', 2, 'Schools entrance with crates for bags', ['#arrival'], { level: 2, id: 'i-o3' }],
    ['opps', 3, 'A child track in the audio guide for every room', ['#guide'], { level: 2 }],
    ['owner', 0, 'Learning', [], { team: 'Learning' }],
    ['owner', 1, 'Web', [], { team: 'Web' }],
    ['owner', 2, 'Front of house', [], { team: 'Front of house' }],
    ['owner', 3, 'App team', [], { team: 'App team' }],
    ['owner', 5, 'Learning', [], { team: 'Learning' }],
  ], [['i-o1', 'i-p1'], ['i-o2', 'i-p2'], ['i-o3', 'i-p3']])
  return {
    id: 'ines', name: INES.name, role: 'Schoolteacher, Year 6', age: 44, hue: INES.dye, photo: INES.medal,
    quote: 'If thirty eleven-year-olds can’t touch anything, give them something to listen to.',
    goals: ['A trip that teaches the solar system better than the textbook', 'Thirty children, nobody lost', 'Back on the coach by 11:45'],
    frustrations: ['Booking forms built for one family', 'Museums that are all glass and no story'],
    scenario: 'Teaches a class of 28 in a state school forty minutes away; takes one trip a term.',
    stages, cards,
  }
}

function tomas(): Persona {
  const { stages, cards } = build('t', [
    { name: STAGE_NAMES[0], goal: 'See the orrery a lecturer mentioned.', duration: 'Monday', emotion: 1, feeling: 'Curious' },
    { name: STAGE_NAMES[1], goal: 'Get in free with a student card.', duration: 'Thursday night', emotion: -0.5, feeling: 'Unsure' },
    { name: STAGE_NAMES[2], goal: 'Walk in without queueing.', duration: 'Saturday · 15:00', emotion: 0.5, feeling: 'Easy' },
    { name: STAGE_NAMES[3], goal: 'See the orrery actually move.', duration: 'Saturday · 15:20', emotion: -1.5, feeling: 'Let down' },
    { name: STAGE_NAMES[4], goal: 'Take something home to remember it.', duration: 'Saturday · 16:30', emotion: 0.5, feeling: 'Satisfied' },
    { name: STAGE_NAMES[5], goal: 'Come back for the Thursday talks.', duration: 'Next month', emotion: 1.5, feeling: 'Hooked' },
  ], [
    ['actions', 0, 'Looks up the orrery on the museum’s site', ['#collection']],
    ['actions', 1, 'Scrolls for a student price that isn’t there', ['#pricing']],
    ['actions', 2, 'Shows his student card at the desk', ['#arrival']],
    ['actions', 3, 'Waits twenty minutes for a demo that was cancelled', ['#guide']],
    ['actions', 3, 'Watches the orrery video in the app instead', ['#guide']],
    ['actions', 4, 'Photographs the gear train for his notes', ['#collection']],
    ['actions', 5, 'Signs up for the Thursday evening talks', ['#membership']],
    ['touchpoints', 0, 'Object page: Orrery', ['#collection'], { channel: 'web' }],
    ['touchpoints', 1, 'Prices page', ['#pricing'], { channel: 'web' }],
    ['touchpoints', 3, 'Demo-table sign', ['#guide'], { channel: 'store' }],
    ['touchpoints', 3, 'Object video in the app', ['#guide'], { channel: 'app' }],
    ['touchpoints', 5, 'Talks newsletter', ['#membership'], { channel: 'email' }],
    ['thoughts', 1, '“Is it free for students or not?”', ['#pricing']],
    ['thoughts', 3, '“I came to see it move.”', ['#guide']],
    ['thoughts', 5, '“A talk on how they cut the gears? I’m in.”', ['#membership']],
    ['pains', 1, 'Free student entry only mentioned at the desk', ['#pricing'], { level: 2, id: 't-p1' }],
    ['pains', 3, 'Demo times change and nobody says so', ['#guide'], { level: 3, id: 't-p2' }],
    ['opps', 1, 'Say “students free” on the prices page', ['#pricing'], { level: 2, id: 't-o1' }],
    ['opps', 3, 'Live demo times in the app, with a nudge 10 min before', ['#guide'], { level: 3, id: 't-o2' }],
    ['opps', 5, 'Student membership for the evening talks', ['#membership'], { level: 2 }],
    ['owner', 1, 'Web', [], { team: 'Web' }],
    ['owner', 3, 'App team', [], { team: 'App team' }],
    ['owner', 5, 'Membership', [], { team: 'Membership' }],
  ], [['t-o1', 't-p1'], ['t-o2', 't-p2']])
  return {
    id: 'tomas', name: TOMAS.name, role: 'Physics student', age: 21, hue: TOMAS.dye, photo: TOMAS.medal,
    quote: 'I came to see the orrery move, not to read about it behind glass.',
    goals: ['See the instruments working, not just behind glass', 'Spend nothing he doesn’t have to'],
    frustrations: ['Pricing that hides the student deal', 'Demos that don’t happen'],
    scenario: 'Second-year physics student; comes on Saturday afternoons with a notebook.',
    stages, cards,
  }
}

function ruth(): Persona {
  const { stages, cards } = build('r', [
    { name: STAGE_NAMES[0], goal: 'Hear about the new navigation room.', duration: 'Members’ email', emotion: 1, feeling: 'Interested' },
    { name: STAGE_NAMES[1], goal: 'Book a quiet morning slot.', duration: 'A week before', emotion: 0.5, feeling: 'Organised' },
    { name: STAGE_NAMES[2], goal: 'Get in with her member card.', duration: 'Tuesday · 10:00', emotion: 0, feeling: 'Patient' },
    { name: STAGE_NAMES[3], goal: 'Understand how the compass gimbal works.', duration: 'Tuesday · 10:15', emotion: -1, feeling: 'Frustrated' },
    { name: STAGE_NAMES[4], goal: 'Talk to someone who knows.', duration: 'Tuesday · 11:30', emotion: 1, feeling: 'Satisfied' },
    { name: STAGE_NAMES[5], goal: 'Renew her membership.', duration: 'Month 11', emotion: 0.5, feeling: 'Loyal' },
  ], [
    ['actions', 0, 'Reads the members’ email in print size 150%', ['#membership']],
    ['actions', 1, 'Books Tuesday 10:00, the quietest slot', ['#booking']],
    ['actions', 2, 'Scans the member card in the app at the door', ['#arrival']],
    ['actions', 3, 'Squints at a label set in 9-point type', ['#access']],
    ['actions', 3, 'Plays the audio guide at full volume', ['#guide', '#access']],
    ['actions', 4, 'Asks a volunteer about the compass card', ['#guide']],
    ['actions', 5, 'Renews from the reminder email', ['#membership']],
    ['touchpoints', 0, 'Members’ newsletter', ['#membership'], { channel: 'email' }],
    ['touchpoints', 2, 'Member card in the app', ['#arrival'], { channel: 'app' }],
    ['touchpoints', 3, 'Object labels', ['#access'], { channel: 'store' }],
    ['touchpoints', 3, 'Audio guide, expert track', ['#guide'], { channel: 'app' }],
    ['touchpoints', 4, 'Volunteer on the floor', ['#guide'], { channel: 'support' }],
    ['thoughts', 3, '“Labels tell me the date. I want to know how it works.”', ['#guide']],
    ['thoughts', 3, '“Why is the text so small?”', ['#access']],
    ['pains', 3, 'Labels set too small to read without glasses', ['#access'], { level: 3, id: 'r-p1' }],
    ['pains', 3, 'Audio guide has no expert depth', ['#guide'], { level: 2, id: 'r-p2' }],
    ['opps', 3, 'Large-print label in the app for every object', ['#access'], { level: 3, id: 'r-o1' }],
    ['opps', 3, 'Expert track: how it works, with the plate’s lettered parts', ['#guide'], { level: 3, id: 'r-o2' }],
    ['opps', 4, 'Volunteer hours shown per room', ['#guide'], { level: 1 }],
    ['owner', 0, 'Membership', [], { team: 'Membership' }],
    ['owner', 3, 'App team', [], { team: 'App team' }],
    ['owner', 4, 'Front of house', [], { team: 'Front of house' }],
  ], [['r-o1', 'r-p1'], ['r-o2', 'r-p2']])
  return {
    id: 'ruth', name: RUTH.name, role: 'Retired engineer, member', age: 71, hue: RUTH.dye, photo: RUTH.medal,
    quote: 'Labels tell me the date. I want to know how it works.',
    goals: ['Understand the mechanism, not just the history', 'Visit when it’s quiet'],
    frustrations: ['Small print on labels', 'Guides written for children only'],
    scenario: 'Spent forty years designing pumps; a member for nine years, visits monthly.',
    stages, cards,
  }
}

export const demoDoc = (): JourneyDoc => ({ title: 'Gabinete · first visit', personas: [ines(), tomas(), ruth()] })

export const blankStages = (prefix: string): Stage[] =>
  STAGE_NAMES.map((name, i) => ({ id: `${prefix}-s${i}`, name, goal: '', duration: '', emotion: 0, feeling: '' }))

