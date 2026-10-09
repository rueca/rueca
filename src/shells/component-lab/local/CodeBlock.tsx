/* ---------------------------------------------------------------------------
   CodeBlock (kit candidate) — read-only code with light syntax colouring,
   line numbers and a copy button. The hand-off surface every client tool
   ends in: JSX for the current props, CSS variables, token JSON.

     <CodeBlock code={jsx} lang="jsx" title="Button.tsx" />

   The tokenizer is deliberately tiny (tags, attributes, strings, numbers,
   comments, CSS properties) and colours only with studio tokens, so it
   themes with the chrome and needs no dependency.
--------------------------------------------------------------------------- */
import { useState, type ReactNode } from 'react'
import { Check, Copy } from 'lucide-react'
import { IconButton, copyText, toast, cn } from '@kit'

type Lang = 'jsx' | 'css' | 'json'
const RULES: Record<Lang, [RegExp, string][]> = {
  jsx: [[/\{\/\*[\s\S]*?\*\/\}|\/\/.*$/m, 'text-fg-faint italic'], [/"[^"]*"|'[^']*'/, 'text-ok'], [/<\/?[A-Z][\w.]*|<\/?[a-z][\w-]*|\/?>/, 'text-signal'], [/\b[a-zA-Z-]+(?==)/, 'text-key'], [/[{}]/, 'text-fg-faint']],
  css: [[/\/\*[\s\S]*?\*\//, 'text-fg-faint italic'], [/--[\w-]+/, 'text-signal'], [/^[^:{}\n]+(?=\s*\{)|@[\w-]+/m, 'text-key'], [/#[0-9a-fA-F]{3,8}\b|-?\d*\.?\d+(px|%|em|rem)?\b/, 'text-ok'], [/[{}:;]/, 'text-fg-faint']],
  json: [[/"[^"]*"(?=\s*:)/, 'text-signal'], [/"[^"]*"/, 'text-ok'], [/-?\d*\.?\d+\b|true|false|null/, 'text-key'], [/[{}[\],:]/, 'text-fg-faint']],
}

function highlight(line: string, lang: Lang): ReactNode[] {
  const out: ReactNode[] = []
  let rest = line, k = 0
  while (rest.length) {
    let best: { i: number; len: number; cls: string } | null = null
    for (const [re, cls] of RULES[lang]) {
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

export function CodeBlock({ code, lang = 'jsx', title, className, maxHeight }: { code: string; lang?: Lang; title?: ReactNode; className?: string; maxHeight?: number }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    if (await copyText(code)) { setCopied(true); setTimeout(() => setCopied(false), 1200); toast('Copied', { type: 'success', description: typeof title === 'string' ? title : undefined }) }
  }
  const lines = code.replace(/\n$/, '').split('\n')
  return (
    <div className={cn('overflow-hidden rounded-[8px] bg-well shadow-[inset_0_0_0_1px_var(--line)]', className)}>
      <div className="flex h-8 items-center justify-between border-b border-line pr-1 pl-2.5">
        <span className="truncate text-[11px] text-fg-muted">{title}</span>
        <IconButton icon={copied ? Check : Copy} label="Copy" size="icon-sm" onClick={copy} />
      </div>
      <pre className="overflow-auto py-2 font-mono text-[11px] leading-[1.6] text-fg select-text" style={{ maxHeight }}>
        <code>
          {lines.map((l, i) => (
            <div key={i} className="flex">
              <span className="w-8 shrink-0 pr-2.5 text-right text-fg-faint/70 no-select">{i + 1}</span>
              <span className="pr-3 whitespace-pre">{highlight(l, lang)}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  )
}
