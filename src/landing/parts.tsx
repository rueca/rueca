/* Small building blocks for the landing page. Kit tokens only — no colour
   literals — so both themes come for free. */
import { useState, type ReactNode } from 'react'
import { Check, Copy, Moon, Sun } from 'lucide-react'
import { cn, copyText, useTheme, Tip } from '@kit'

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-[1120px] px-4 sm:px-8', className)}>{children}</div>
}

export function Section({ id, children, className }: { id?: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} data-section={id} className={cn('scroll-mt-16 py-16 sm:py-24', className)}>
      <Container>{children}</Container>
    </section>
  )
}

/** Section heading: a quiet kicker, a title, an optional lede. Sentence case throughout. */
export function Heading({ kicker, title, lede, className }: { kicker?: string; title: ReactNode; lede?: ReactNode; className?: string }) {
  return (
    <div className={cn('max-w-[640px]', className)}>
      {kicker && <div className="mb-3 text-[13px] font-medium text-faint">{kicker}</div>}
      <h2 className="text-[26px] leading-[1.15] font-semibold tracking-[-0.02em] text-balance text-fg sm:text-[32px]">{title}</h2>
      {lede && <p className="mt-4 text-[15px] leading-[1.6] text-pretty text-muted">{lede}</p>}
    </div>
  )
}

/* A deliberately tiny highlighter: opacity tiers, not a rainbow. Components
   and calls read at full contrast, keywords and comments recede. */
const TOKEN = /(\/\/.*|\/\*[\s\S]*?\*\/)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)|(<\/?[A-Za-z][\w.]*|\/?>)|\b(export|const|let|return|for|import|from|new|true|false|null)\b|\b([A-Za-z_]\w*)(?=\()|(\b\d+(?:\.\d+)?\b)/g

function highlight(src: string) {
  const out: ReactNode[] = []
  let last = 0
  let i = 0
  for (const m of src.matchAll(TOKEN)) {
    if (m.index! > last) out.push(src.slice(last, m.index))
    const [s, comment, str, tag, kw, call, num] = m
    const cls = comment ? 'text-faint italic' : str ? 'text-fg' : tag ? 'text-fg font-medium' : kw ? 'text-faint' : call ? 'text-fg' : num ? 'text-fg' : ''
    out.push(<span key={i++} className={cls}>{s}</span>)
    last = m.index! + s.length
  }
  out.push(src.slice(last))
  return out
}

export function Code({ code, file, className }: { code: string; file?: string; className?: string }) {
  return (
    <div className={cn('flex min-w-0 flex-col overflow-hidden rounded-[10px] bg-well', className)}>
      {file && <div className="flex h-8 flex-none items-center border-b border-line px-3.5 text-[11.5px] text-faint">{file}</div>}
      <pre className="min-w-0 overflow-x-auto px-3.5 py-3 font-mono text-[11.5px] leading-[1.65] text-muted">
        <code>{highlight(code)}</code>
      </pre>
    </div>
  )
}

/** A shell command with a copy button. `prompt` marks it as a Claude Code slash command vs a terminal line. */
export function CommandLine({ text, className }: { text: string; className?: string }) {
  const [done, setDone] = useState(false)
  const slash = text.startsWith('/')
  return (
    <div className={cn('group flex h-10 min-w-0 items-center gap-2 rounded-[9px] bg-well pr-1 pl-3.5', className)}>
      <span className="flex-none font-mono text-[12px] text-faint select-none">{slash ? '›' : '$'}</span>
      <code className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-fg" title={text}>{text}</code>
      <Tip label={done ? 'Copied' : 'Copy'}>
        <button
          type="button"
          aria-label={`Copy: ${text}`}
          onClick={() => copyText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1400) })}
          className="flex size-8 flex-none items-center justify-center rounded-[7px] text-faint outline-none hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-accent"
        >
          {done ? <Check size={14} strokeWidth={1.75} className="text-ok" /> : <Copy size={14} strokeWidth={1.5} />}
        </button>
      </Tip>
    </div>
  )
}

export function ThemeButton({ className }: { className?: string }) {
  const { theme, toggle } = useTheme()
  return (
    <Tip label={theme === 'dark' ? 'Light theme' : 'Dark theme'}>
      <button type="button" onClick={toggle} aria-label="Toggle theme"
        className={cn('flex size-8 flex-none items-center justify-center rounded-[8px] text-muted outline-none hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-accent', className)}>
        {theme === 'dark' ? <Sun size={15} strokeWidth={1.5} /> : <Moon size={15} strokeWidth={1.5} />}
      </button>
    </Tip>
  )
}

export function Mark({ size = 20 }: { size?: number }) {
  return (
    <span className="flex flex-none items-center justify-center rounded-[5px] bg-fg text-field" style={{ width: size, height: size }}>
      <svg viewBox="0 0 16 16" width={size * 0.55} height={size * 0.55} aria-hidden><circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="2.2" /></svg>
    </span>
  )
}

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('inline-flex h-6 items-center rounded-[6px] bg-hover px-2 text-[11.5px] whitespace-nowrap text-muted', className)}>{children}</span>
}

/** Scroll to a landing section without touching the hash — the hash is the router. */
export const scrollToSection = (id: string) => document.querySelector(`[data-section="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
