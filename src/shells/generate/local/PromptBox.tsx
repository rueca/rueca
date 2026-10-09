/* ---------------------------------------------------------------------------
   PromptBox — the AI-tool text area. Grows from `minRows` to `maxRows`,
   ⌘↵ / Ctrl+↵ submits, Esc blurs, and every key stays inside (global
   single-key shortcuts like F or Delete must not fire while typing).
   Optional token meter: real text encoders truncate (CLIP at 77), so the
   count turns `rec` past the limit.

     <PromptBox value={v} onChange={set} onSubmit={generate} tokenLimit={77} />

   Kit candidate: kit TextInput stops propagation of ALL keys, so a
   multiline field cannot have a submit chord; this one owns that.
--------------------------------------------------------------------------- */
import { forwardRef, useLayoutEffect, useImperativeHandle, useRef } from 'react'
import { cn } from '@kit'

export const estimateTokens = (s: string) => (s.trim() ? Math.ceil(s.trim().split(/\s+/).length * 1.3 + (s.match(/[,.;:!?()]/g)?.length ?? 0) * 0.5) : 0)

export interface PromptBoxProps {
  value: string
  onChange: (v: string) => void
  onSubmit?: () => void
  onCommit?: (v: string) => void
  placeholder?: string
  minRows?: number
  maxRows?: number
  label?: string
  className?: string
  tokenLimit?: number
  size?: 'md' | 'sm'
}

export const PromptBox = forwardRef<HTMLTextAreaElement, PromptBoxProps>(function PromptBox(
  { value, onChange, onSubmit, onCommit, placeholder, minRows = 1, maxRows = 6, label, className, tokenLimit, size = 'md' }, ref,
) {
  const el = useRef<HTMLTextAreaElement>(null)
  useImperativeHandle(ref, () => el.current!)
  const line = size === 'md' ? 20 : 18

  useLayoutEffect(() => {
    const t = el.current!
    t.style.height = 'auto'
    t.style.height = `${Math.min(maxRows * line, Math.max(minRows * line, t.scrollHeight))}px`
  }, [value, minRows, maxRows, line])

  const tokens = tokenLimit ? estimateTokens(value) : 0
  return (
    <div className={cn('relative', className)}>
      <textarea
        ref={el}
        aria-label={label}
        value={value}
        rows={minRows}
        placeholder={placeholder}
        spellCheck
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onCommit?.(e.target.value)}
        onKeyDown={(e) => {
          e.stopPropagation()
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onCommit?.(value); onSubmit?.() }
          if (e.key === 'Escape') (e.target as HTMLTextAreaElement).blur()
        }}
        className={cn(
          'block w-full resize-none bg-transparent text-fg outline-none placeholder:text-faint',
          size === 'md' ? 'text-[13.5px] leading-[20px]' : 'text-[12px] leading-[18px]',
          tokenLimit && 'pr-12',
        )}
      />
      {tokenLimit !== undefined && tokens > 0 && (
        <span className={cn('pointer-events-none absolute right-0 bottom-0 tabular text-[10.5px]', tokens > tokenLimit ? 'text-rec' : 'text-faint')} title="Estimated tokens — the text encoder ignores everything past the limit">
          {tokens}/{tokenLimit}
        </span>
      )}
    </div>
  )
})
