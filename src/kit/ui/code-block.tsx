/* ---------------------------------------------------------------------------
   CodeBlock — read-only code with light syntax colouring, line numbers, a copy
   button and optional language / format tabs. The hand-off surface every
   client tool ends in: JSX for the current props, CSS variables, token JSON.

     <CodeBlock code={jsx} lang="jsx" title="Button.tsx" />
     <CodeBlock tabs={[
       { id: 'css', label: 'CSS', lang: 'css', code: css, title: 'tokens.css' },
       { id: 'json', label: 'JSON', lang: 'json', code: json },
     ]} tab={fmt} onTabChange={setFmt} actions={<IconButton … />} />

   Behaviour
     · the tokenizer is deliberately tiny (tags, attributes, strings, numbers,
       comments, keywords, CSS properties) and colours only with studio tokens,
       so it themes with the chrome and needs no dependency
     · tabs are controlled (`tab` + `onTabChange`) or uncontrolled (first tab)
     · Copy copies the visible tab and confirms with a toast; `onCopy` overrides
     · `maxHeight` scrolls the body; `wrap` soft-wraps long lines
   Keyboard / a11y: tabs are a role="tablist" (← → Home End move and select);
   the body is a focusable region so keyboard users can scroll it; line
   numbers are aria-hidden and not selectable, so copying by hand stays clean.
   (Promoted from shells/component-lab/local/CodeBlock.tsx.)
--------------------------------------------------------------------------- */
import { useId, useRef, useState, type ReactNode } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '../core/cn'
import { copyText } from '../core/io'
import { IconButton } from './button'
import { toast } from '../system/toast'

export type CodeLang = 'jsx' | 'tsx' | 'js' | 'ts' | 'css' | 'json' | 'html' | 'glsl' | 'shell' | 'text'
export interface CodeTab { id?: string; label: string; code: string; lang?: CodeLang; title?: ReactNode }

const KW = /\b(?:const|let|var|function|return|import|from|export|default|if|else|for|while|new|class|extends|type|interface|async|await|typeof|as)\b/
const SCRIPT: [RegExp, string][] = [
  [/\{\/\*[\s\S]*?\*\/\}|\/\*[\s\S]*?\*\/|\/\/.*$/m, 'text-fg-faint italic'],
  [/"[^"]*"|'[^']*'|`[^`]*`/, 'text-ok'],
  [/<\/?[A-Z][\w.]*|<\/?[a-z][\w-]*|\/?>/, 'text-signal'],
  [/\b[a-zA-Z-]+(?==)/, 'text-key'],
  [KW, 'text-cat-7'],
  [/\b-?\d*\.?\d+\b|\b(?:true|false|null|undefined)\b/, 'text-key'],
  [/[{}]/, 'text-fg-faint'],
]
const RULES: Record<CodeLang, [RegExp, string][]> = {
  jsx: SCRIPT, tsx: SCRIPT, js: SCRIPT, ts: SCRIPT,
  css: [[/\/\*[\s\S]*?\*\//, 'text-fg-faint italic'], [/--[\w-]+/, 'text-signal'], [/^[^:{}\n]+(?=\s*\{)|@[\w-]+/m, 'text-key'], [/#[0-9a-fA-F]{3,8}\b|-?\d*\.?\d+(px|%|em|rem|deg|s|ms)?\b/, 'text-ok'], [/[{}:;]/, 'text-fg-faint']],
  json: [[/"[^"]*"(?=\s*:)/, 'text-signal'], [/"[^"]*"/, 'text-ok'], [/-?\d*\.?\d+\b|\btrue\b|\bfalse\b|\bnull\b/, 'text-key'], [/[{}[\],:]/, 'text-fg-faint']],
  html: [[/<!--[\s\S]*?-->/, 'text-fg-faint italic'], [/"[^"]*"|'[^']*'/, 'text-ok'], [/<\/?[\w-]+|\/?>/, 'text-signal'], [/\b[\w-]+(?==)/, 'text-key']],
  glsl: [[/\/\*[\s\S]*?\*\/|\/\/.*$/m, 'text-fg-faint italic'], [/\b(?:uniform|varying|attribute|in|out|precision|highp|mediump|lowp|void|return|if|else|for|const)\b/, 'text-cat-7'], [/\b(?:float|int|bool|vec[234]|mat[234]|sampler2D)\b/, 'text-signal'], [/-?\d*\.?\d+\b/, 'text-key']],
  shell: [[/#.*$/m, 'text-fg-faint italic'], [/"[^"]*"|'[^']*'/, 'text-ok'], [/^\s*[\w.-]+/m, 'text-signal'], [/\s--?[\w-]+/, 'text-key']],
  text: [],
}

function highlight(line: string, lang: CodeLang): ReactNode[] {
  const rules = RULES[lang] ?? []
  const out: ReactNode[] = []
  let rest = line, k = 0
  while (rest.length) {
    let best: { i: number; len: number; cls: string } | null = null
    for (const [re, cls] of rules) {
      const m = re.exec(rest)
      if (m && m[0].length && (!best || m.index < best.i)) best = { i: m.index, len: m[0].length, cls }
    }
    if (!best) { out.push(rest); break }
    if (best.i) out.push(rest.slice(0, best.i))
    out.push(<span key={k++} className={best.cls}>{rest.slice(best.i, best.i + best.len)}</span>)
    rest = rest.slice(best.i + best.len)
  }
  return out
}

export function CodeBlock({
  code, lang = 'jsx', title, tabs, tab, onTabChange, actions, onCopy, lineNumbers = true, wrap = false, maxHeight, label, className,
}: {
  code?: string
  lang?: CodeLang
  title?: ReactNode
  /** language / format tabs; each carries its own code */
  tabs?: CodeTab[]
  /** controlled tab (id, or label when no id) */
  tab?: string
  onTabChange?: (id: string) => void
  /** extra header buttons (download, open…) before Copy */
  actions?: ReactNode
  onCopy?: (code: string) => void
  lineNumbers?: boolean
  wrap?: boolean
  maxHeight?: number
  /** accessible name of the code region (default the title or tab label) */
  label?: string
  className?: string
}) {
  const uid = useId()
  const [own, setOwn] = useState<string | undefined>(undefined)
  const [copied, setCopied] = useState(false)
  const tabList = useRef<HTMLDivElement>(null)
  const idOf = (t: CodeTab) => t.id ?? t.label
  const active = tabs?.length ? (tabs.find((t) => idOf(t) === (tab ?? own)) ?? tabs[0]) : undefined
  const src = active?.code ?? code ?? ''
  const lng = active?.lang ?? lang
  const head = active?.title ?? title
  const select = (t: CodeTab) => { if (tab === undefined) setOwn(idOf(t)); onTabChange?.(idOf(t)) }
  const copy = async () => {
    if (onCopy) return onCopy(src)
    if (await copyText(src)) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
      toast('Copied', { type: 'success', description: typeof head === 'string' ? head : active?.label })
    }
  }
  const onTabKey = (e: React.KeyboardEvent) => {
    if (!tabs?.length || !active) return
    const i = tabs.indexOf(active)
    const j = e.key === 'ArrowRight' ? (i + 1) % tabs.length : e.key === 'ArrowLeft' ? (i - 1 + tabs.length) % tabs.length : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : -1
    if (j < 0) return
    e.preventDefault()
    e.stopPropagation()
    select(tabs[j])
    requestAnimationFrame(() => tabList.current?.querySelectorAll<HTMLElement>('[role="tab"]')[j]?.focus())
  }
  const lines = src.replace(/\n$/, '').split('\n')
  const panelId = `${uid}-panel`
  return (
    <div className={cn('overflow-hidden rounded-[8px] bg-well shadow-[inset_0_0_0_1px_var(--line)]', className)}>
      <div className="flex h-8 items-center gap-2 border-b border-line pr-1 pl-2.5">
        {tabs?.length ? (
          <div ref={tabList} role="tablist" aria-label="Format" onKeyDown={onTabKey} className="-ml-1.5 flex min-w-0 items-center gap-0.5">
            {tabs.map((t) => {
              const on = t === active
              return (
                <button key={idOf(t)} type="button" role="tab" id={`${uid}-tab-${idOf(t)}`} aria-selected={on} aria-controls={panelId} tabIndex={on ? 0 : -1}
                  onClick={() => select(t)}
                  className={cn('h-6 shrink-0 rounded-[5px] px-2 text-[11px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-signal', on ? 'bg-active text-fg' : 'text-fg-muted hover:bg-hover hover:text-fg')}>
                  {t.label}
                </button>
              )
            })}
          </div>
        ) : null}
        <span className={cn('min-w-0 flex-1 truncate text-[11px] text-fg-muted', tabs?.length && 'text-right text-fg-faint')}>{head}</span>
        {actions}
        <IconButton icon={copied ? Check : Copy} label="Copy" size="icon-sm" onClick={copy} />
      </div>
      <pre id={panelId} role={tabs?.length ? 'tabpanel' : 'region'} aria-label={tabs?.length ? undefined : label ?? (typeof head === 'string' ? head : 'Code')}
        aria-labelledby={tabs?.length && active ? `${uid}-tab-${idOf(active)}` : undefined} tabIndex={0}
        className="overflow-auto py-2 font-mono text-[11px] leading-[1.6] text-fg outline-none select-text focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-inset" style={{ maxHeight }}>
        <code>
          {lines.map((l, i) => (
            <div key={i} className="flex">
              {lineNumbers && <span aria-hidden className="w-8 shrink-0 pr-2.5 text-right text-fg-faint/70 no-select">{i + 1}</span>}
              <span className={cn('pr-3', wrap ? 'break-all whitespace-pre-wrap' : 'whitespace-pre', !lineNumbers && 'pl-3')}>{highlight(l, lng)}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  )
}
