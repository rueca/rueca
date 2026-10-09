/* Theme scope + "render the current component" helpers shared by both views. */
import type { CSSProperties, ReactNode } from 'react'
import { useValues } from '@kit'
import { tokens, deriveVars, type Theme } from '../tokens'
import { buttonProps, inputProps, cardProps, type CompId } from '../props'
import { Button, TextField, Card } from '../lib/Components'

/** A .cl-root carrying the token variables for one theme. Brand lives in here, never in chrome. */
export function LabRoot({ theme, children, className, style }: { theme: Theme; children: ReactNode; className?: string; style?: CSSProperties }) {
  const t = useValues(tokens)
  return (
    <div className={`cl-root ${className ?? ''}`} data-theme={theme} style={{ ...(deriveVars(t, theme) as CSSProperties), background: 'var(--cl-bg)', ...style }}>
      {children}
    </div>
  )
}

export function Instance({ comp, force, patch }: { comp: CompId; force?: string; patch?: Record<string, unknown> }) {
  const b = useValues(buttonProps)
  const i = useValues(inputProps)
  const c = useValues(cardProps)
  if (comp === 'button') return <Button v={{ ...b, ...patch }} force={force} />
  if (comp === 'input') return <TextField v={{ ...i, ...patch }} force={force} />
  return <Card v={{ ...c, ...patch }} force={force} buttonV={b} />
}
