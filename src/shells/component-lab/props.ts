/* ---------------------------------------------------------------------------
   Prop schemas — one param store per component, so the props panel is
   generated (Storybook args / Framer property controls) and every component
   keeps its own undo history, presets and share link.
--------------------------------------------------------------------------- */
import { ArrowRight, Plus, Download, Sparkles, Check, Search, Mail, Lock, Ban } from 'lucide-react'
import { defineSchema, folder, p, createParams, type AnyParams } from '@kit'

export const buttonSchema = defineSchema({
  look: folder('Appearance', {
    variant: p.select('primary', [
      { value: 'primary', label: 'Primary' }, { value: 'secondary', label: 'Secondary' }, { value: 'outline', label: 'Outline' },
      { value: 'ghost', label: 'Ghost' }, { value: 'destructive', label: 'Destructive' },
    ]),
    size: p.select('md', [{ value: 'sm', label: 'S', hint: 'Small' }, { value: 'md', label: 'M', hint: 'Medium' }, { value: 'lg', label: 'L', hint: 'Large' }]),
    state: p.select('default', [{ value: 'default', label: 'Live' }, { value: 'hover', label: 'Hover' }, { value: 'focus', label: 'Focus' }, { value: 'active', label: 'Pressed' }],
      { hint: 'Force an interaction state. Live = the real :hover / :focus / :active.', display: 'dropdown' }),
  }),
  content: folder('Content', {
    label: p.text('Book a visit', { maxLength: 40 }),
    icon: p.select('none', [{ value: 'none', label: 'None' }, { value: 'leading', label: 'Start' }, { value: 'trailing', label: 'End' }, { value: 'only', label: 'Only' }], { label: 'Icon' }),
    iconName: p.select('arrow-right', [
      { value: 'arrow-right', label: 'Arrow right', icon: ArrowRight }, { value: 'plus', label: 'Plus', icon: Plus },
      { value: 'download', label: 'Download', icon: Download }, { value: 'sparkles', label: 'Sparkles', icon: Sparkles }, { value: 'check', label: 'Check', icon: Check },
    ], { label: 'Glyph', when: (v) => v.icon !== 'none', display: 'tiles' }),
  }),
  behaviour: folder('Behaviour', {
    loading: p.boolean(false),
    disabled: p.boolean(false),
    fullWidth: p.boolean(false, { label: 'Full width' }),
  }),
})

export const inputSchema = defineSchema({
  look: folder('Appearance', {
    inputVariant: p.select('outline', [{ value: 'outline', label: 'Outline' }, { value: 'filled', label: 'Filled' }, { value: 'underline', label: 'Underline' }], { label: 'Variant', display: 'dropdown' }),
    inputSize: p.select('md', [{ value: 'sm', label: 'S', hint: 'Small' }, { value: 'md', label: 'M', hint: 'Medium' }, { value: 'lg', label: 'L', hint: 'Large' }], { label: 'Size' }),
    inputState: p.select('default', [{ value: 'default', label: 'Live' }, { value: 'hover', label: 'Hover' }, { value: 'focus', label: 'Focus' }, { value: 'error', label: 'Error' }], { label: 'State', display: 'dropdown', hint: 'Force a state. Live = real hover and focus.' }),
  }),
  content: folder('Content', {
    fieldLabel: p.text('Email for your tickets', { label: 'Label' }),
    placeholder: p.text('you@example.com'),
    value: p.text(''),
    helper: p.text('Your tickets arrive here. No account needed.', { label: 'Help text' }),
    errorText: p.text('That doesn’t look like an email address.', { label: 'Error text', when: (v) => v.inputState === 'error' }),
    inputIcon: p.select('mail', [{ value: 'none', label: 'None', icon: Ban }, { value: 'mail', label: 'Mail', icon: Mail }, { value: 'search', label: 'Search', icon: Search }, { value: 'lock', label: 'Lock', icon: Lock }], { label: 'Icon' }),
  }),
  behaviour: folder('Behaviour', {
    inputDisabled: p.boolean(false, { label: 'Disabled' }),
    required: p.boolean(true),
  }),
})

export const cardSchema = defineSchema({
  look: folder('Appearance', {
    cardVariant: p.select('elevated', [{ value: 'elevated', label: 'Elevated' }, { value: 'outline', label: 'Outline' }, { value: 'filled', label: 'Filled' }], { label: 'Variant', display: 'dropdown' }),
    layout: p.select('auto', [{ value: 'vertical', label: 'Stacked' }, { value: 'horizontal', label: 'Side' }, { value: 'auto', label: 'Auto' }],
      { hint: 'Auto switches to side-by-side when the card is wider than 520px (a container query). Drag the viewport to see it.' }),
    cardState: p.select('default', [{ value: 'default', label: 'Live' }, { value: 'hover', label: 'Hover' }, { value: 'focus', label: 'Focus' }], { label: 'State' }),
  }),
  content: folder('Content', {
    media: p.boolean(true),
    badge: p.boolean(false, { label: 'New badge' }),
    eyebrow: p.text(''),
    title: p.text('How to read an astrolabe'),
    body: p.text('Turn the rete to the hour and it tells you the time, the date, and how high any star will climb tonight.', { multiline: true }),
    actions: p.select('two', [{ value: 'none', label: 'None' }, { value: 'one', label: 'One' }, { value: 'two', label: 'Two' }], { label: 'Actions' }),
  }),
})

export const buttonProps = createParams(buttonSchema, { id: 'component-lab-button', presets: [
  { name: 'Default', values: {} },
  { name: 'Call to action', values: { variant: 'primary', size: 'lg', label: 'Become a member', icon: 'trailing', iconName: 'arrow-right' } },
  { name: 'Toolbar', values: { variant: 'ghost', size: 'sm', icon: 'only', iconName: 'plus', label: 'Add' } },
  { name: 'Danger zone', values: { variant: 'destructive', label: 'Cancel booking', icon: 'none' } },
] })
export const inputProps = createParams(inputSchema, { id: 'component-lab-input', presets: [
  { name: 'Default', values: {} },
  { name: 'Search', values: { fieldLabel: '', placeholder: 'Search instruments…', helper: '', inputIcon: 'search', inputVariant: 'filled', required: false } },
  { name: 'Validation error', values: { inputState: 'error', value: 'ines@', helper: '' } },
] })
export const cardProps = createParams(cardSchema, { id: 'component-lab-card', presets: [
  { name: 'Default', values: {} },
  { name: 'Feature', values: { layout: 'horizontal', cardVariant: 'outline', eyebrow: 'New room', title: 'The navigation room opens on Saturday', badge: false } },
  { name: 'Text only', values: { media: false, actions: 'one', cardVariant: 'filled', badge: false, eyebrow: 'Note' } },
] })

export type ButtonV = ReturnType<typeof buttonProps.values>
export type InputV = ReturnType<typeof inputProps.values>
export type CardV = ReturnType<typeof cardProps.values>

export type CompId = 'button' | 'input' | 'card'
export const STORES: Record<CompId, AnyParams> = { button: buttonProps, input: inputProps, card: cardProps }

/** the States matrix axes for each component */
export const MATRIX: Record<CompId, { variantKey: string; stateKey: string; variants: { value: string; label: string }[]; states: { value: string; label: string }[] }> = {
  button: {
    variantKey: 'variant', stateKey: 'state',
    variants: ['primary', 'secondary', 'outline', 'ghost', 'destructive'].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) })),
    states: [{ value: 'default', label: 'Default' }, { value: 'hover', label: 'Hover' }, { value: 'focus', label: 'Focus' }, { value: 'active', label: 'Pressed' }, { value: 'disabled', label: 'Disabled' }, { value: 'loading', label: 'Loading' }],
  },
  input: {
    variantKey: 'inputVariant', stateKey: 'inputState',
    variants: ['outline', 'filled', 'underline'].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) })),
    states: [{ value: 'default', label: 'Default' }, { value: 'hover', label: 'Hover' }, { value: 'focus', label: 'Focus' }, { value: 'error', label: 'Error' }, { value: 'disabled', label: 'Disabled' }],
  },
  card: {
    variantKey: 'cardVariant', stateKey: 'cardState',
    variants: ['elevated', 'outline', 'filled'].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) })),
    states: [{ value: 'default', label: 'Default' }, { value: 'hover', label: 'Hover' }, { value: 'focus', label: 'Focus' }],
  },
}

/* --- JSX for the current props (only what differs from the component's defaults) --- */
const attr = (k: string, v: unknown) => (typeof v === 'string' ? `${k}="${v}"` : v === true ? k : `${k}={${JSON.stringify(v)}}`)
const pascal = (s: string) => s.split('-').map((x) => x[0].toUpperCase() + x.slice(1)).join('')

export function jsxFor(id: CompId): string {
  if (id === 'button') {
    const v = buttonProps.values()
    const a: string[] = [attr('variant', v.variant)]
    if (v.size !== 'md') a.push(attr('size', v.size))
    const icon = `<${pascal(v.iconName)} />`
    if (v.icon === 'leading') a.push(`iconStart={${icon}}`)
    if (v.icon === 'trailing') a.push(`iconEnd={${icon}}`)
    if (v.icon === 'only') a.push(`icon={${icon}}`, attr('aria-label', v.label))
    if (v.loading) a.push('loading')
    if (v.disabled) a.push('disabled')
    if (v.fullWidth) a.push('fullWidth')
    const open = a.join(' ').length > 34 ? `<Button\n  ${a.join('\n  ')}\n` : `<Button ${a.join(' ')}`
    return v.icon === 'only' ? `${open}${open.endsWith('\n') ? '' : ' '}/>` : `${open}>\n  ${v.label}\n</Button>`
  }
  if (id === 'input') {
    const v = inputProps.values()
    const a = [attr('label', v.fieldLabel)]
    if (v.inputVariant !== 'outline') a.push(attr('variant', v.inputVariant))
    if (v.inputSize !== 'md') a.push(attr('size', v.inputSize))
    if (v.inputIcon !== 'none') a.push(`icon={<${pascal(v.inputIcon)} />}`)
    a.push(attr('type', 'email'), attr('placeholder', v.placeholder))
    if (v.value) a.push(attr('defaultValue', v.value))
    if (v.helper) a.push(attr('description', v.helper))
    if (v.inputState === 'error') a.push(attr('error', v.errorText))
    if (v.required) a.push('required')
    if (v.inputDisabled) a.push('disabled')
    return `<TextField\n  ${a.join('\n  ')}\n/>`
  }
  const v = cardProps.values()
  const a = [attr('variant', v.cardVariant)]
  if (v.layout !== 'vertical') a.push(attr('layout', v.layout))
  const lines = [`<Card ${a.join(' ')}>`]
  if (v.media) lines.push('  <Card.Media src="/cover.jpg" alt="" />')
  lines.push('  <Card.Body>')
  if (v.eyebrow || v.badge) lines.push(`    <Card.Eyebrow>${v.eyebrow}${v.badge ? ' <Badge>New</Badge>' : ''}</Card.Eyebrow>`)
  lines.push(`    <Card.Title>${v.title}</Card.Title>`, `    <Card.Text>${v.body}</Card.Text>`)
  if (v.actions !== 'none') {
    lines.push('    <Card.Actions>', '      <Button variant="primary">Play the audio guide</Button>')
    if (v.actions === 'two') lines.push('      <Button variant="ghost">Save</Button>')
    lines.push('    </Card.Actions>')
  }
  lines.push('  </Card.Body>', '</Card>')
  return lines.join('\n')
}
