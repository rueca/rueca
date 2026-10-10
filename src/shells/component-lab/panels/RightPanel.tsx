/* Right: Tokens (the look) and Code (the hand-off). */
import { Download } from 'lucide-react'
import { Section, Row, Slider, ScrubValue, Inspector, Button, Badge, Tip, useValues, equal, exportJSON, download, cn } from '@kit'
import { tokens, contrastReport, grade, tokensCSS, tokensDTCG, tokensTailwind, hexOf } from '../tokens'
import { OklchField } from '@kit/ui/oklch'
import { WIRE } from '@/demo/wire'
import { CodeBlock } from '@kit/ui/code-block'
import { useUI, setUI } from '../ui'
import { jsxFor, STORES } from '../props'

export function TokensPanel() {
  const t = useValues(tokens)
  const presets = tokens.getState().presets
  const theme = useUI((s) => s.previewTheme)
  const report = contrastReport(t, theme)
  const defaults = tokens.getState().defaults
  const accentChanged = !equal([t.accentL, t.accentC, t.accentH], [defaults.accentL, defaults.accentC, defaults.accentH])
  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-2 gap-1.5 p-3">
        {presets.map((p) => {
          const v = { ...defaults, ...p.values }
          const on = equal(v, t)
          return (
            <button key={p.name} type="button" onClick={() => tokens.applyPreset(p.name)}
              className={cn('group flex h-12 items-center gap-2 rounded-[8px] px-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-signal', on ? 'bg-signal-soft shadow-[inset_0_0_0_1px_var(--signal)]' : 'bg-control hover:bg-hover')}>
              <span className="flex size-7 shrink-0 items-center justify-center text-[11px] font-semibold"
                style={{ background: hexOf(v.accentL, v.accentC, v.accentH), borderRadius: Math.min(14, v.radius), boxShadow: v.shadow === 'hard' ? '2px 2px 0 0 currentColor' : undefined, color: v.accentL > 0.75 ? WIRE.ink : WIRE.paper }}>Aa</span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[11.5px] font-medium text-fg">{p.name}</span>
                <span className="truncate text-[10.5px] text-fg-faint">{v.radius}px · {v.density}</span>
              </span>
            </button>
          )
        })}
      </div>
      <Section title="Accent" changed={accentChanged} onReset={accentChanged ? () => tokens.reset(['accentL', 'accentC', 'accentH']) : undefined}>
        <div className="px-3 pb-1">
          <OklchField value={{ l: t.accentL, c: t.accentC, h: t.accentH }} onChange={(v, f) => tokens.patch({ accentL: v.l, accentC: v.c, accentH: v.h }, { commit: f })} />
        </div>
        <Row label="Neutral tint" hint={tokens.defs.neutralTint.hint} changed={t.neutralTint !== defaults.neutralTint} onReset={() => tokens.reset(['neutralTint'])}>
          <Slider value={t.neutralTint} min={0} max={0.04} step={0.001} onChange={(v, f) => tokens.setValue('neutralTint', v, { commit: f })} label="Neutral tint" />
          <ScrubValue value={t.neutralTint} min={0} max={0.04} step={0.001} onChange={(v, f) => tokens.setValue('neutralTint', v, { commit: f })} className="w-[52px] shrink-0" label="Neutral tint" />
        </Row>
      </Section>
      <div className="border-t border-line"><Inspector params={tokens} folders={['shape', 'type', 'density']} /></div>
      <Section title={`Contrast · ${theme}`}>
        {report.map((r) => (
          <Row key={r.label} label={r.label}>
            <span className="flex size-5 shrink-0 items-center justify-center rounded-[4px] text-[10px] font-semibold shadow-[inset_0_0_0_1px_var(--line)]" style={{ background: r.bg, color: r.fg }}>Aa</span>
            <span className="flex-1 text-right tabular text-[11.5px] text-fg">{r.ratio.toFixed(2)}:1</span>
            <Tip label={r.ratio >= 4.5 ? 'Passes WCAG AA for body text' : r.ratio >= 3 ? 'Passes AA for large text and UI only' : 'Fails WCAG AA'}>
              <span><Badge tone={r.ratio >= 4.5 ? 'ok' : r.ratio >= 3 ? 'key' : 'rec'}>{grade(r.ratio)}</Badge></span>
            </Tip>
          </Row>
        ))}
      </Section>
    </div>
  )
}

export function CodePanel() {
  const comp = useUI((s) => s.comp)
  const codeTab = useUI((s) => s.codeTab)
  useValues(STORES[comp])
  const t = useValues(tokens)
  const file = { button: 'Button.tsx', input: 'TextField.tsx', card: 'Card.tsx' }[comp]
  const css = tokensCSS(t)
  const downloadTokens = () => codeTab === 'json' ? exportJSON(tokensDTCG(t), 'tokens.json') : download(new Blob([codeTab === 'css' ? css : tokensTailwind(t)], { type: 'text/css' }), codeTab === 'css' ? 'tokens.css' : 'theme.css')
  return (
    <div className="flex flex-col gap-3 p-3">
      <CodeBlock code={jsxFor(comp)} lang="jsx" title={`${file} · current props`} />
      <CodeBlock
        tab={codeTab}
        onTabChange={(v) => setUI({ codeTab: v as 'css' })}
        tabs={[
          { id: 'css', label: 'CSS vars', lang: 'css', code: css, title: 'tokens.css · light + dark' },
          { id: 'json', label: 'JSON', lang: 'json', code: JSON.stringify(tokensDTCG(t), null, 2), title: 'W3C design tokens' },
          { id: 'tailwind', label: 'Tailwind', lang: 'css', code: tokensTailwind(t), title: 'theme.css · v4 @theme' },
        ]}
        actions={
          <Tip label="Download this file">
            <Button size="icon-sm" variant="ghost" aria-label="Download tokens" onClick={downloadTokens}>
              <Download size={14} strokeWidth={1.5} />
            </Button>
          </Tip>
        }
        maxHeight={520}
      />
    </div>
  )
}
