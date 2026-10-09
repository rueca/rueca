/* Journey — PNG (DOM snapshot of the board), CSV, Markdown, JSON. */
import { copyText, download, exportCanvasPNG, exportJSON, toast, toastManager } from '@kit'
import { snapshotElement } from '@kit'
import { CHANNELS, LANES, emoji, fmtEmotion, type JourneyDoc, type Persona } from './model'
import { doc, persona, ui, history } from './store'
import { LEVEL } from './map/Card'

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'journey'
const fileBase = () => `${slug(doc.get().title)}-${slug(persona().name)}`

export const mapElement = { current: null as HTMLDivElement | null }

export async function exportPNG(scale = 2) {
  const el = mapElement.current
  if (!el) return
  const id = toast('Rendering PNG…', { type: 'loading', timeout: 0 })
  const prev = { sel: ui.getState().sel, hoverCard: ui.getState().hoverCard }
  ui.setState({ sel: null, hoverCard: null, editing: null })
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
  try {
    const w = el.offsetWidth, h = el.offsetHeight
    const pad = 40
    const canvas = await snapshotElement(el, {
      width: w + pad * 2, height: h + pad * 2, scale: Math.min(scale, 8000 / (w + pad * 2)), background: 'var(--field)',
      style: { transform: `translate(${pad}px, ${pad}px)`, margin: '0' },
      hide: (n) => (n as HTMLElement).dataset?.export === 'skip',
    })
    await exportCanvasPNG(canvas, `${fileBase()}.png`)
    toast('PNG exported', { type: 'success', description: `${canvas.width} × ${canvas.height} px` })
  } catch (e) {
    toast('Export failed', { type: 'error', description: String(e) })
  } finally {
    ui.setState(prev)
    toastManager.close(id)
  }
}

const csvCell = (v: unknown) => {
  const s = v === undefined || v === null ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCSV(p: Persona) {
  const rows: unknown[][] = [['Persona', 'Stage #', 'Stage', 'Lane', 'Order', 'Text', 'Tags', 'Channel', 'Level', 'Answers', 'Team', 'Emotion']]
  const textOf = new Map(p.cards.map((c) => [c.id, c.text]))
  p.stages.forEach((s, si) => {
    rows.push([p.name, si + 1, s.name, 'Emotion', 1, s.feeling, '', '', '', '', '', s.emotion])
    for (const lane of LANES) {
      if (lane.id === 'emotion') continue
      p.cards.filter((c) => c.stage === s.id && c.lane === lane.id).forEach((c, i) => {
        rows.push([p.name, si + 1, s.name, lane.label, i + 1, c.text, c.tags.join(' '), c.channel ? CHANNELS[c.channel].label : '', c.level ? LEVEL[c.level] : '', (c.links ?? []).map((l) => textOf.get(l)).join(' | '), c.team ?? '', ''])
      })
    }
  })
  return rows.map((r) => r.map(csvCell).join(',')).join('\n')
}

export function exportCSV() {
  // BOM so Excel opens curly quotes and arrows as UTF-8
  download(new Blob(['\ufeff' + toCSV(persona())], { type: 'text/csv;charset=utf-8' }), `${fileBase()}.csv`)
  toast('CSV downloaded', { type: 'success', description: 'One row per card, plus the emotion score per stage.' })
}

export function toMarkdown(p: Persona, title: string) {
  const out: string[] = [`# ${title} — ${p.name}`, '', `*${p.role}, ${p.age}*`]
  if (p.quote) out.push('', `> ${p.quote}`)
  if (p.goals.length) out.push('', '**Goals**', ...p.goals.map((g) => `- ${g}`))
  if (p.frustrations.length) out.push('', '**Frustrations**', ...p.frustrations.map((g) => `- ${g}`))
  const textOf = new Map(p.cards.map((c) => [c.id, c.text]))
  p.stages.forEach((s, i) => {
    out.push('', `## ${i + 1}. ${s.name}${s.duration ? ` · ${s.duration}` : ''}`, '')
    if (s.goal) out.push(`*Goal:* ${s.goal}`, '')
    out.push(`**Emotion:** ${emoji(s.emotion)} ${s.feeling || '—'} (${fmtEmotion(s.emotion)})`, '')
    for (const lane of LANES) {
      if (lane.id === 'emotion') continue
      const cards = p.cards.filter((c) => c.stage === s.id && c.lane === lane.id)
      if (!cards.length) continue
      out.push(`**${lane.label}**`)
      for (const c of cards) {
        const meta = [c.channel && CHANNELS[c.channel].label, c.level && (lane.id === 'pains' ? `severity ${LEVEL[c.level].toLowerCase()}` : lane.id === 'opps' ? `impact ${LEVEL[c.level].toLowerCase()}` : ''), ...c.tags].filter(Boolean)
        const answers = c.links?.length ? ` → answers: ${c.links.map((l) => `“${textOf.get(l)}”`).join(', ')}` : ''
        out.push(`- ${c.team ?? c.text}${meta.length ? ` _(${meta.join(', ')})_` : ''}${answers}`)
      }
      out.push('')
    }
  })
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n'
}

export async function copyMarkdown() {
  await copyText(toMarkdown(persona(), doc.get().title))
  toast('Markdown copied', { type: 'success', description: 'Paste into Notion, Linear, GitHub or an agent prompt.' })
}

export function exportJourneyJSON() {
  exportJSON({ app: 'prototype-studio/journey', version: 1, doc: doc.get() }, `${slug(doc.get().title)}.json`)
}

export function importJourneyJSON() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'application/json,.json'
  input.onchange = async () => {
    const f = input.files?.[0]
    if (!f) return
    try {
      const data = JSON.parse(await f.text())
      const d: JourneyDoc = data.doc ?? data
      if (!Array.isArray(d.personas) || !d.personas.length) throw new Error('No personas in this file')
      doc.replace(d, { label: 'Import' })
      ui.setState({ personaId: d.personas[0].id, sel: null, filterTag: null })
      toast('Journey imported', { type: 'success', action: { label: 'Undo', onClick: () => history.undo() } })
    } catch (e) {
      toast('Could not import', { type: 'error', description: (e as Error).message })
    }
  }
  input.click()
}
