/* Batch — the document model: template params, data rows, output sizes, per-size overrides. */
import { AlignCenter, AlignLeft } from 'lucide-react'
import { createStore } from 'zustand/vanilla'
import { defineSchema, folder, p, createParams, createDocStore, createHistory } from '@kit'
import { WIRE } from '@/demo/wire'
import { uid } from '../util'

/* --- template + brand: schema-driven, so the kit Inspector renders them --- */
const locked = (v: any) => !!v.brandLocked

export const schema = defineSchema({
  template: folder('Layout', {
    layout: p.select('auto', [
      { value: 'auto', label: 'Auto', hint: 'Pick by aspect: tall → stack, square → hero, wide → split.' },
      { value: 'stack', label: 'Stack', hint: 'Logo, headline, product, call to action — top to bottom.' },
      { value: 'hero', label: 'Hero', hint: 'Copy top-left, product large bottom-right.' },
      { value: 'split', label: 'Split', hint: 'Copy column left, product right.' },
    ], { hint: 'Layout rule. Each output size can override it.' }),
    align: p.select('left', [{ value: 'left', label: 'Left', icon: AlignLeft }, { value: 'center', label: 'Centre', icon: AlignCenter }], { label: 'Align' }),
    headlineScale: p.number(100, { min: 50, max: 160, step: 1, unit: '%', label: 'Headline size', hint: 'Relative to the short side of each size. Long headlines still shrink to fit.' }),
    subheadScale: p.number(100, { min: 60, max: 150, step: 1, unit: '%', label: 'Subhead size' }),
    imageScale: p.number(100, { min: 50, max: 150, step: 1, unit: '%', label: 'Product size', hint: 'Height of the product shot within the space the layout gives it.' }),
    padding: p.number(7, { min: 3, max: 14, step: 0.5, unit: '%', label: 'Margin', hint: 'Outer margin as % of the short side, inside the platform safe area.' }),
    showSubhead: p.boolean(true, { label: 'Subhead' }),
    showBadge: p.boolean(true, { label: 'Badge', hint: 'Sticker from the Badge column. Hidden when the cell is empty.' }),
    showPrice: p.boolean(true, { label: 'Price' }),
  }),
  look: folder('Look', {
    bgStyle: p.select('paper', [
      { value: 'paper', label: 'Paper', hint: 'Brand paper, a hairline ring behind the product.' },
      { value: 'flavour', label: 'Colour', hint: 'The row tone fills the background.' },
      { value: 'split', label: 'Split', hint: 'Paper and row tone, split behind the product.' },
    ], { label: 'Background' }),
    ctaStyle: p.select('pill', ['pill', 'outline', 'link'], { label: 'Button' }),
    decor: p.boolean(true, { label: 'Fruit slices', hint: 'Slices drawn in hairline, scattered around the product.' }),
    grain: p.number(0, { min: 0, max: 1, step: 0.05, label: 'Grain', hint: 'Print-like noise over the whole asset.' }),
    seed: p.seed(11, { hint: 'Scatter of the decorative slices.' }),
  }),
  brand: folder('Brand', {
    brandName: p.text('oro', { label: 'Name', hint: 'Wordmark text, used in the logo.', disabled: locked }),
    logoStyle: p.select('lockup', [{ value: 'mark', label: 'Mark' }, { value: 'lockup', label: 'Lockup' }, { value: 'word', label: 'Word' }], { label: 'Logo', disabled: locked }),
    logo: p.image(null, { label: 'Logo file', hint: 'Drop an SVG or PNG to replace the generated logo.', disabled: locked }),
    paper: p.color(WIRE.paper, { alpha: false, disabled: locked }),
    ink: p.color(WIRE.ink, { alpha: false, disabled: locked }),
    displayFont: p.select('inter', [
      { value: 'inter', label: 'Inter' }, { value: 'serif', label: 'Serif (system)' },
      { value: 'rounded', label: 'Rounded (system)' }, { value: 'mono', label: 'Mono (system)' },
    ], { label: 'Display font', disabled: locked }),
    headlineWeight: p.number(700, { min: 300, max: 900, step: 50, label: 'Weight', disabled: locked }),
    tracking: p.number(-3, { min: -8, max: 8, step: 0.5, unit: '%', label: 'Tracking', disabled: locked }),
    bodyFont: p.select('inter', [{ value: 'inter', label: 'Inter' }, { value: 'serif', label: 'Serif (system)' }, { value: 'mono', label: 'Mono (system)' }], { label: 'Body font', disabled: locked }),
  }),
  lock: folder('Lock', { brandLocked: p.boolean(false) }, { when: () => false }),
})

export const params = createParams(schema, {
  id: 'batch',
  version: 2, // v2: wire-style defaults (paper/ink, no grain)
  presets: [
    // Looks only touch Layout + Look — never the Brand folder, so they respect a locked brand.
    { name: 'Editorial', values: { bgStyle: 'paper', ctaStyle: 'link', decor: false, grain: 0, headlineScale: 92, padding: 9 } },
    { name: 'Loud', values: { bgStyle: 'flavour', headlineScale: 124, ctaStyle: 'pill', decor: true, imageScale: 110 } },
    { name: 'Split', values: { bgStyle: 'split', decor: true, grain: 0 } },
    { name: 'Minimal', values: { bgStyle: 'paper', decor: false, grain: 0, showSubhead: false, headlineScale: 90, ctaStyle: 'outline' } },
  ],
})
export type V = ReturnType<typeof params.values>

/** Keys a size may override. Everything else is template- or brand-wide. */
export const OVERRIDABLE = ['layout', 'align', 'headlineScale', 'subheadScale', 'imageScale', 'padding', 'showSubhead', 'showBadge', 'showPrice'] as const
export type OverrideKey = (typeof OVERRIDABLE)[number]
export type Overrides = Partial<Pick<V, OverrideKey>>

/* --- data rows --- */
export interface DataRow { name: string; headline: string; subhead: string; cta: string; price: string; color: string; badge: string }
export const COLUMNS: { key: keyof DataRow; label: string; width: number; kind?: 'color'; mono?: boolean; align?: 'right'; placeholder?: string; hint?: string }[] = [
  { key: 'name', label: 'Product', width: 132, hint: 'Captions the product shot and names the files.' },
  { key: 'headline', label: 'Headline', width: 220 },
  { key: 'subhead', label: 'Subhead', width: 280 },
  { key: 'cta', label: 'Button', width: 104 },
  { key: 'price', label: 'Price', width: 64, align: 'right' },
  { key: 'color', label: 'Colour', width: 96, kind: 'color', mono: true },
  { key: 'badge', label: 'Badge', width: 88, placeholder: '—' },
]

export const DEMO_ROWS: DataRow[] = [
  { name: 'Yuzu & ginger', headline: 'Bright, sharp, a little bit wild.', subhead: 'Japanese yuzu meets fresh-pressed ginger. Zero sugar, all bite.', cta: 'Shop the drop', price: '£2.20', color: '#E8E1D6', badge: 'New' },
  { name: 'Blood orange', headline: 'Sunset in a can.', subhead: 'Sicilian blood orange with a whisper of rosemary.', cta: 'Order now', price: '£2.20', color: '#DCD5CA', badge: 'Bestseller' },
  { name: 'Cucumber & mint', headline: 'Cool it.', subhead: 'Garden cucumber, spearmint and a squeeze of lime.', cta: 'Try it cold', price: '£2.20', color: '#EFE9DF', badge: '' },
  { name: 'Hibiscus & rose', headline: 'Pink, floral, never sweet.', subhead: 'Hibiscus flower steeped with Damask rose petals.', cta: 'Get 20% off', price: '£2.40', color: '#1C1A19', badge: 'Limited' },
  { name: 'Pear & cardamom', headline: 'Autumn, bottled. Well — canned.', subhead: 'Comice pear and green cardamom for slow evenings in.', cta: 'Pre-order', price: '£2.40', color: '#D3CABC', badge: 'Seasonal' },
  { name: 'Pink grapefruit', headline: 'The 3pm fix.', subhead: 'Ruby grapefruit, a pinch of sea salt, nothing else.', cta: 'Shop now', price: '£2.20', color: '#E8E1D6', badge: '' },
  { name: 'Blackcurrant & sage', headline: 'Dark fruit, green finish.', subhead: 'Kentish blackcurrant with garden sage. Best over ice.', cta: 'Discover', price: '£2.40', color: '#1C1A19', badge: 'New' },
]
export const blankRow = (): DataRow => ({ name: 'New flavour', headline: 'Your headline here.', subhead: 'One line about what makes it good.', cta: 'Shop now', price: '£2.20', color: '#E8E1D6', badge: '' })

/* --- output sizes --- */
export interface Zone { x: number; y: number; w: number; h: number; label: string }
export interface SizeSpec {
  id: string
  name: string
  platform: 'instagram' | 'linkedin' | 'x' | 'facebook' | 'pinterest' | 'youtube' | 'display' | 'custom'
  w: number
  h: number
  /** layout keeps all content inside these insets */
  safe: { t: number; r: number; b: number; l: number }
  /** shown by the safe-area overlay */
  zones: Zone[]
  visible?: boolean
  locked?: boolean
  builtin?: boolean
}

const S0 = { t: 0, r: 0, b: 0, l: 0 }
export const DEFAULT_SIZES: SizeSpec[] = [
  { id: 'ig-post', name: 'Instagram post', platform: 'instagram', w: 1080, h: 1080, safe: S0, builtin: true,
    zones: [{ x: 0, y: 0, w: 135, h: 1080, label: 'Cropped in profile grid (3:4)' }, { x: 945, y: 0, w: 135, h: 1080, label: '' }] },
  { id: 'ig-story', name: 'Instagram story', platform: 'instagram', w: 1080, h: 1920, safe: { t: 250, r: 0, b: 340, l: 0 }, builtin: true,
    zones: [{ x: 0, y: 0, w: 1080, h: 250, label: 'Profile and progress bar' }, { x: 0, y: 1580, w: 1080, h: 340, label: 'Reply bar and stickers' }] },
  { id: 'linkedin', name: 'LinkedIn post', platform: 'linkedin', w: 1200, h: 627, safe: { t: 24, r: 24, b: 24, l: 24 }, builtin: true, zones: [] },
  { id: 'x', name: 'X post', platform: 'x', w: 1600, h: 900, safe: { t: 0, r: 0, b: 0, l: 0 }, builtin: true,
    zones: [{ x: 0, y: 0, w: 1600, h: 50, label: 'May crop to 2:1 in the timeline' }, { x: 0, y: 850, w: 1600, h: 50, label: '' }] },
]

export const SIZE_PRESETS: Omit<SizeSpec, 'id'>[] = [
  { name: 'Instagram portrait', platform: 'instagram', w: 1080, h: 1350, safe: S0, zones: [{ x: 0, y: 0, w: 1080, h: 135, label: 'Cropped in profile grid' }, { x: 0, y: 1215, w: 1080, h: 135, label: '' }] },
  { name: 'Facebook feed', platform: 'facebook', w: 1200, h: 630, safe: S0, zones: [] },
  { name: 'Pinterest pin', platform: 'pinterest', w: 1000, h: 1500, safe: { t: 0, r: 0, b: 120, l: 0 }, zones: [{ x: 0, y: 1380, w: 1000, h: 120, label: 'Save button overlay' }] },
  { name: 'YouTube thumbnail', platform: 'youtube', w: 1280, h: 720, safe: { t: 0, r: 0, b: 0, l: 0 }, zones: [{ x: 1060, y: 640, w: 200, h: 64, label: 'Duration badge' }] },
  { name: 'LinkedIn square', platform: 'linkedin', w: 1200, h: 1200, safe: S0, zones: [] },
  { name: 'Display MPU', platform: 'display', w: 300, h: 250, safe: S0, zones: [] },
  { name: 'Display leaderboard', platform: 'display', w: 728, h: 90, safe: S0, zones: [] },
]

/* --- the document (rows · sizes · overrides) with its own history --- */
export interface Doc { rows: DataRow[]; sizes: SizeSpec[]; overrides: Record<string, Overrides> }
export const DEMO_DOC: Doc = { rows: DEMO_ROWS, sizes: DEFAULT_SIZES, overrides: { 'ig-story': { headlineScale: 112 }, linkedin: { showSubhead: false } } }

/* v2: the template is drawn in the wire style; v1 docs (colourful flavour rows) are not carried over. */
export const doc = createDocStore<Doc>(DEMO_DOC, { id: 'batch', version: 2 })

/** ⌘Z undoes whichever changed last — template/brand values or the document. */
export const history = createHistory([params, doc])

/* --- view state (not undoable) --- */
export const ui = createStore<{ row: number; selected: string | null; safe: boolean; tab: 'design' | 'brand' | 'export'; data: boolean }>(() => ({
  row: 0, selected: null, safe: false, tab: 'design', data: true,
}))

export const effective = (v: V, o?: Overrides): V => (o ? { ...v, ...o } : v)
export { uid }
