/* Journey — document model and demo content (Harvest meal kits). Pure data. */
import {
  Footprints, MonitorSmartphone, MessageSquareQuote, HeartPulse, TriangleAlert, Lightbulb, Users,
  Smartphone, Globe, Mail, Bell, Store, Headphones, Megaphone, Package, MessageSquare, type LucideIcon,
} from 'lucide-react'

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

export const TEAMS: Record<string, string> = {
  'Growth marketing': '#f97316', 'Web': '#0ea5e9', 'Product — app': '#8b5cf6', 'Lifecycle CRM': '#ec4899', 'Ops & logistics': '#14b8a6', 'Support': '#eab308',
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
  goals: string[]; frustrations: string[]; scenario: string
  stages: Stage[]; cards: Card[]
}
export interface JourneyDoc { title: string; personas: Persona[] }

export const uid = (p = 'c') => `${p}${Math.random().toString(36).slice(2, 8)}`
export const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?'
export const PERSONA_HUES = ['#8b5cf6', '#f97316', '#14b8a6', '#ec4899', '#0ea5e9', '#84cc16']

export const emoji = (v: number) => (v >= 1.5 ? '😄' : v >= 0.5 ? '🙂' : v > -0.5 ? '😐' : v > -1.5 ? '🙁' : '😣')
export const fmtEmotion = (v: number) => (v > 0 ? `+${v}` : v < 0 ? `−${Math.abs(v)}` : '0')

/* ------------------------------------------------------------------ demo */
const STAGE_NAMES = ['Discover', 'Consider', 'Purchase', 'Onboard', 'Use', 'Advocate']

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

function maya(): Persona {
  const { stages, cards } = build('m', [
    { name: STAGE_NAMES[0], goal: 'Notice Harvest exists and why it is different.', duration: 'Week −2', emotion: 0.5, feeling: 'Curious' },
    { name: STAGE_NAMES[1], goal: 'Decide whether it fits the family budget and schedule.', duration: 'Week −1', emotion: -0.5, feeling: 'Sceptical' },
    { name: STAGE_NAMES[2], goal: 'Choose a plan and the first box with no surprises.', duration: 'Day 0', emotion: -1, feeling: 'Anxious' },
    { name: STAGE_NAMES[3], goal: 'Get the first box and cook the first meal.', duration: 'Days 1–4', emotion: -1.5, feeling: 'Overwhelmed' },
    { name: STAGE_NAMES[4], goal: 'Make Harvest part of the weekly routine.', duration: 'Weeks 2–6', emotion: 1, feeling: 'In control' },
    { name: STAGE_NAMES[5], goal: 'Recommend Harvest to other parents.', duration: 'Week 6+', emotion: 1.5, feeling: 'Proud' },
  ], [
    ['actions', 0, 'Sees a school-run parent unpacking a Harvest box on Instagram', ['#social']],
    ['actions', 0, 'Searches “quick family dinners under 20 minutes”', ['#recipes']],
    ['actions', 1, 'Compares Harvest with two competitors in browser tabs', ['#pricing']],
    ['actions', 1, 'Asks partner whether the kids will eat it', []],
    ['actions', 2, 'Picks the 4-person plan, 3 recipes a week', ['#subscription']],
    ['actions', 2, 'Hunts for a discount code before paying', ['#pricing']],
    ['actions', 3, 'Unpacks the box and sorts bags by recipe', ['#delivery']],
    ['actions', 3, 'Cooks the first recipe with a child “helping”', ['#recipes']],
    ['actions', 4, 'Skips a week during half-term', ['#subscription']],
    ['actions', 4, 'Swaps one recipe a week for a kid favourite', ['#recipes']],
    ['actions', 5, 'Shares a referral link in the class WhatsApp group', ['#social']],
    ['touchpoints', 0, 'Influencer post', ['#social'], { channel: 'social' }],
    ['touchpoints', 0, 'Search ad → landing page', [], { channel: 'web' }],
    ['touchpoints', 1, 'Pricing page and plan calculator', ['#pricing'], { channel: 'web' }],
    ['touchpoints', 1, 'Reviews on app store listing', ['#trust'], { channel: 'app' }],
    ['touchpoints', 2, 'Checkout on mobile web', [], { channel: 'web' }],
    ['touchpoints', 2, 'Order confirmation email', [], { channel: 'email' }],
    ['touchpoints', 3, 'Delivery-day SMS with a 2-hour window', ['#delivery'], { channel: 'sms' }],
    ['touchpoints', 3, 'The box and recipe cards', [], { channel: 'packaging' }],
    ['touchpoints', 4, 'Weekly menu push on Thursday', [], { channel: 'push' }],
    ['touchpoints', 4, 'App: skip, swap, pause', ['#subscription'], { channel: 'app' }],
    ['touchpoints', 5, 'Referral page with £20 credit', [], { channel: 'app' }],
    ['thoughts', 0, '“That looks easier than my Sunday meal plan.”', []],
    ['thoughts', 1, '“Is this actually cheaper than the supermarket?”', ['#pricing']],
    ['thoughts', 2, '“Will I be locked into a subscription?”', ['#subscription', '#trust']],
    ['thoughts', 3, '“Where do I even start with all these bags?”', ['#onboarding']],
    ['thoughts', 4, '“Tuesday dinner is solved and I didn’t think about it.”', []],
    ['thoughts', 5, '“I’d tell anyone with kids to try it.”', []],
    ['pains', 1, 'Price per meal only appears after choosing a plan', ['#pricing'], { level: 3, id: 'm-p1' }],
    ['pains', 2, 'Cancellation terms buried in the FAQ', ['#trust', '#subscription'], { level: 3, id: 'm-p2' }],
    ['pains', 3, 'Ingredients for three recipes mixed in one cool bag', ['#delivery', '#onboarding'], { level: 2, id: 'm-p3' }],
    ['pains', 3, 'First recipe assumes adult-level knife skills', ['#recipes'], { level: 2, id: 'm-p4' }],
    ['pains', 4, 'Missed the skip deadline once, paid for a week away', ['#subscription'], { level: 3, id: 'm-p5' }],
    ['opps', 1, 'Show price per serving on every plan card', ['#pricing'], { level: 3, id: 'm-o1' }],
    ['opps', 2, 'One-line “cancel anytime in two taps” promise at checkout', ['#trust'], { level: 2, id: 'm-o2' }],
    ['opps', 3, 'Colour-coded bags per recipe + “start here” card', ['#delivery', '#onboarding'], { level: 3, id: 'm-o3' }],
    ['opps', 3, '“Cook with kids” recipe track', ['#recipes'], { level: 1, id: 'm-o4' }],
    ['opps', 4, 'Skip-deadline reminder 48h before cut-off', ['#subscription'], { level: 3, id: 'm-o5' }],
    ['opps', 5, 'Referral credit for both sides, shown after a 5-star rating', ['#social'], { level: 2 }],
    ['owner', 0, 'Growth marketing', [], { team: 'Growth marketing' }],
    ['owner', 1, 'Web', [], { team: 'Web' }],
    ['owner', 2, 'Web', [], { team: 'Web' }],
    ['owner', 3, 'Ops & logistics', [], { team: 'Ops & logistics' }],
    ['owner', 3, 'Product — app', [], { team: 'Product — app' }],
    ['owner', 4, 'Lifecycle CRM', [], { team: 'Lifecycle CRM' }],
    ['owner', 5, 'Growth marketing', [], { team: 'Growth marketing' }],
  ], [['m-o1', 'm-p1'], ['m-o2', 'm-p2'], ['m-o3', 'm-p3'], ['m-o4', 'm-p4'], ['m-o5', 'm-p5'], ['m-o2', 'm-p5']])
  return {
    id: 'maya', name: 'Maya Chen', role: 'Busy parent of two', age: 38, hue: '#8b5cf6',
    quote: 'If dinner takes more than twenty minutes to plan, it’s already lost.',
    goals: ['Healthy weeknight dinners the kids will eat', 'Less time planning and shopping', 'Waste less food'],
    frustrations: ['Subscriptions that are hard to pause', 'Recipes that assume a free evening'],
    scenario: 'Works four days a week, shops on Sunday, cooks between pick-up and bath time.',
    stages, cards,
  }
}

function leo(): Persona {
  const { stages, cards } = build('l', [
    { name: STAGE_NAMES[0], goal: 'Hear about Harvest from friends.', duration: 'Term start', emotion: 1, feeling: 'Intrigued' },
    { name: STAGE_NAMES[1], goal: 'Work out if a box fits a student budget.', duration: '1 week', emotion: -1, feeling: 'Priced out' },
    { name: STAGE_NAMES[2], goal: 'Buy the discounted first box.', duration: 'Day 0', emotion: 0.5, feeling: 'Hopeful' },
    { name: STAGE_NAMES[3], goal: 'Cook in a shared kitchen.', duration: 'Days 1–3', emotion: -0.5, feeling: 'Awkward' },
    { name: STAGE_NAMES[4], goal: 'Keep ordering when money allows.', duration: 'Monthly', emotion: 0, feeling: 'On and off' },
    { name: STAGE_NAMES[5], goal: 'Split boxes with flatmates.', duration: 'Term 2', emotion: 1.5, feeling: 'Sociable' },
  ], [
    ['actions', 0, 'Flatmate cooks a Harvest curry and shares it', ['#social']],
    ['actions', 1, 'Reads the student discount terms twice', ['#pricing']],
    ['actions', 2, 'Orders the 2-person box with 60% off', ['#pricing']],
    ['actions', 3, 'Clears space in a shared fridge', ['#delivery']],
    ['actions', 4, 'Orders only in weeks with a promo code', ['#pricing', '#subscription']],
    ['actions', 5, 'Proposes a “Harvest night” with flatmates', ['#social']],
    ['touchpoints', 0, 'Word of mouth', [], { channel: 'social' }],
    ['touchpoints', 1, 'Student discount page', ['#pricing'], { channel: 'web' }],
    ['touchpoints', 2, 'App checkout', [], { channel: 'app' }],
    ['touchpoints', 3, 'Parcel left in the building lobby', ['#delivery'], { channel: 'packaging' }],
    ['touchpoints', 4, 'Promo email', [], { channel: 'email' }],
    ['thoughts', 1, '“After the discount it’s still more than Lidl.”', ['#pricing']],
    ['thoughts', 3, '“Someone is going to take my chicken.”', ['#delivery']],
    ['thoughts', 5, '“Cheaper if four of us share it.”', ['#pricing', '#social']],
    ['pains', 1, 'Full price after the intro offer is a cliff', ['#pricing'], { level: 3, id: 'l-p1' }],
    ['pains', 3, 'No safe-drop option for flats', ['#delivery'], { level: 2, id: 'l-p2' }],
    ['opps', 1, 'Show the real price from week 2 up front', ['#pricing', '#trust'], { level: 2, id: 'l-o1' }],
    ['opps', 3, 'Locker / pickup-point delivery', ['#delivery'], { level: 3, id: 'l-o2' }],
    ['opps', 5, 'Split-the-box: one order, four payers', ['#social', '#pricing'], { level: 3, id: 'l-o3' }],
    ['owner', 1, 'Growth marketing', [], { team: 'Growth marketing' }],
    ['owner', 3, 'Ops & logistics', [], { team: 'Ops & logistics' }],
    ['owner', 5, 'Product — app', [], { team: 'Product — app' }],
  ], [['l-o1', 'l-p1'], ['l-o2', 'l-p2'], ['l-o3', 'l-p1']])
  return {
    id: 'leo', name: 'Leo Martins', role: 'Student on a budget', age: 22, hue: '#f97316',
    quote: 'I’ll try it if the first box doesn’t cost me a week of groceries.',
    goals: ['Eat better than pasta five nights a week', 'Stay inside £40 a week for food'],
    frustrations: ['Offers that vanish after the first order', 'Deliveries to a shared building'],
    scenario: 'Second-year student in a five-person flat; cooks for himself, sometimes for friends.',
    stages, cards,
  }
}

function priya(): Persona {
  const { stages, cards } = build('p', [
    { name: STAGE_NAMES[0], goal: 'Be reminded Harvest exists — again.', duration: 'Month 4 after churn', emotion: 0, feeling: 'Indifferent' },
    { name: STAGE_NAMES[1], goal: 'Check what changed since she left.', duration: '2 weeks', emotion: 0.5, feeling: 'Open' },
    { name: STAGE_NAMES[2], goal: 'Reactivate without re-entering everything.', duration: 'Day 0', emotion: 1, feeling: 'Relieved' },
    { name: STAGE_NAMES[3], goal: 'Get the first box back.', duration: 'Week 1', emotion: 0.5, feeling: 'Reassured' },
    { name: STAGE_NAMES[4], goal: 'Stay subscribed past week 6 this time.', duration: 'Weeks 2–8', emotion: -1, feeling: 'Wary' },
    { name: STAGE_NAMES[5], goal: 'Become a loyal flexible subscriber.', duration: 'Month 3+', emotion: 1, feeling: 'Settled' },
  ], [
    ['actions', 0, 'Opens a “We’ve changed” email', ['#subscription']],
    ['actions', 1, 'Browses new recipes without logging in', ['#recipes']],
    ['actions', 2, 'Reactivates with one tap from the email', ['#subscription']],
    ['actions', 4, 'Sets the plan to “every other week”', ['#subscription']],
    ['touchpoints', 0, 'Win-back email', [], { channel: 'email' }],
    ['touchpoints', 2, 'Saved address and card', ['#trust'], { channel: 'app' }],
    ['touchpoints', 4, 'Flexible delivery settings', ['#subscription'], { channel: 'app' }],
    ['thoughts', 1, '“Do they finally let me skip without a phone call?”', ['#subscription']],
    ['thoughts', 4, '“I’ll cancel again if I get a box I forgot about.”', ['#subscription', '#trust']],
    ['pains', 4, 'Boxes arrived during holidays she had forgotten to skip', ['#subscription'], { level: 3, id: 'p-p1' }],
    ['pains', 1, 'Old preferences lost after churn', ['#recipes'], { level: 1, id: 'p-p2' }],
    ['opps', 4, 'Calendar-aware “are you away?” prompt', ['#subscription'], { level: 3, id: 'p-o1' }],
    ['opps', 1, 'Keep taste profile for 12 months after cancel', ['#recipes', '#trust'], { level: 2, id: 'p-o2' }],
    ['owner', 0, 'Lifecycle CRM', [], { team: 'Lifecycle CRM' }],
    ['owner', 4, 'Product — app', [], { team: 'Product — app' }],
  ], [['p-o1', 'p-p1'], ['p-o2', 'p-p2']])
  return {
    id: 'priya', name: 'Priya Nair', role: 'Lapsed subscriber', age: 45, hue: '#14b8a6',
    quote: 'I loved the recipes. I hated getting boxes I forgot to skip.',
    goals: ['Cook something new twice a week', 'Never pay for a box she didn’t want'],
    frustrations: ['Rigid weekly plans', 'Re-entering details after a break'],
    scenario: 'Cancelled after six weeks; travels for work one week in three.',
    stages, cards,
  }
}

export const demoDoc = (): JourneyDoc => ({ title: 'Harvest · first 60 days', personas: [maya(), leo(), priya()] })

export const blankStages = (prefix: string): Stage[] =>
  STAGE_NAMES.map((name, i) => ({ id: `${prefix}-s${i}`, name, goal: '', duration: '', emotion: 0, feeling: '' }))

/** A user-picked hue, darkened just enough that white text on it clears WCAG AA (≥4.5:1). */
export { readableOn as deepen } from '@kit'
