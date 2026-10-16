/* ---------------------------------------------------------------------------
   PromptBox — the AI-tool text area (Midjourney, Krea, ChatGPT composer).
   Grows from `minRows` to `maxRows`, then scrolls.

     <PromptBox value={v} onChange={set} onSubmit={generate} label="Prompt"
       tokenLimit={77} chips={<Chip>seed 42</Chip>} />

   Behaviour / keyboard
     ⌘↵ / Ctrl+↵   → onSubmit (after onCommit, so the text is saved first)
     Enter         → newline (or submit with `enterSubmits`, chat style; ⇧↵ then adds a line)
     Esc           → blur (hands the keyboard back to the tool's shortcuts)
     blur          → onCommit (one undo step per edit session, like kit fields)
   Global single-key shortcuts already ignore text fields, so nothing leaks.

   Optional token meter: real text encoders truncate (CLIP stops at 77), so
   the count turns `rec` past the limit. `countTokens` swaps the estimator.
   `chips` renders a row under the text (attached references, style tags,
   a seed lock) and `trailing` a slot at the end of that row (a send button).

   Accessibility: a labelled <textarea> (`label`); the meter is described by
   aria-describedby and announced politely when it crosses the limit.
   (Promoted from shells/generate/local/PromptBox.tsx.)
--------------------------------------------------------------------------- */
import { forwardRef, useId, useImperativeHandle, useLayoutEffect, useRef, type ReactNode } from 'react'
import { cn } from '../core/cn'

/** Rough CLIP-ish token estimate: ~1.3 tokens per word plus punctuation. */
export const estimateTokens = (s: string) => (s.trim() ? Math.ceil(s.trim().split(/\s+/).length * 1.3 + (s.match(/[,.;:!?()]/g)?.length ?? 0) * 0.5) : 0)

export interface PromptBoxProps {
  value: string
  onChange: (v: string) => void
  onSubmit?: () => void
  onCommit?: (v: string) => void
  placeholder?: string
  minRows?: number
  maxRows?: number
  /** accessible name */
  label?: string
  tokenLimit?: number
  countTokens?: (s: string) => number
  /** Enter submits and Shift+Enter adds a line (chat style) */
  enterSubmits?: boolean
  size?: 'md' | 'sm'
  chips?: ReactNode
  trailing?: ReactNode
  disabled?: boolean
  className?: string
}

export const PromptBox = forwardRef<HTMLTextAreaElement, PromptBoxProps>(function PromptBox(
  { value, onChange, onSubmit, onCommit, placeholder, minRows = 1, maxRows = 6, label = 'Prompt', tokenLimit, countTokens = estimateTokens,
    enterSubmits, size = 'md', chips, trailing, disabled, className }, ref,
) {
  const el = useRef<HTMLTextAreaElement>(null)
  useImperativeHandle(ref, () => el.current!)
  const meterId = useId()
  const line = size === 'md' ? 20 : 18

  useLayoutEffect(() => {
    const t = el.current!
    t.style.height = 'auto'
    t.style.height = `${Math.min(maxRows * line, Math.max(minRows * line, t.scrollHeight))}px`
  }, [value, minRows, maxRows, line])

  const tokens = tokenLimit !== undefined ? countTokens(value) : 0
  const over = tokenLimit !== undefined && tokens > tokenLimit
  const submit = () => { onCommit?.(value); onSubmit?.() }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="relative">
        <textarea
          ref={el}
          aria-label={label}
          aria-describedby={tokenLimit !== undefined ? meterId : undefined}
          value={value}
          rows={minRows}
          placeholder={placeholder}
          disabled={disabled}
          spellCheck
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => onCommit?.(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit() }
            else if (e.key === 'Enter' && enterSubmits && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit() }
            else if (e.key === 'Escape') (e.target as HTMLTextAreaElement).blur()
          }}
          className={cn(
            'block w-full resize-none bg-transparent text-fg outline-none placeholder:text-fg-faint disabled:opacity-50',
            size === 'md' ? 'text-[13.5px] leading-[20px]' : 'text-[12px] leading-[18px]',
            tokenLimit !== undefined && 'pr-12',
          )}
        />
        {tokenLimit !== undefined && (
          <span id={meterId} aria-live={over ? 'polite' : 'off'}
            className={cn('pointer-events-none absolute right-0 bottom-0 tabular text-ui-sm', over ? 'text-rec' : 'text-fg-faint', !tokens && 'sr-only')}>
            <span aria-hidden>{tokens}/{tokenLimit}</span>
            <span className="sr-only">{over ? `${tokens} of ${tokenLimit} tokens. The end will be ignored` : `${tokens} of ${tokenLimit} tokens`}</span>
          </span>
        )}
      </div>
      {(chips || trailing) && (
        <div className="flex min-w-0 items-center gap-1.5">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">{chips}</div>
          {trailing}
        </div>
      )}
    </div>
  )
})
