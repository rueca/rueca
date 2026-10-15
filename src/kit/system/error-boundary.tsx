/* ---------------------------------------------------------------------------
   ErrorBoundary — one broken panel must never blank the whole instrument.

     <ErrorBoundary label="Inspector">…</ErrorBoundary>

   <Studio> wraps each region (toolbar, left, right, bottom, stage) in one,
   so a crash in the artwork leaves the inspector usable and vice versa. The
   fallback offers: Try again (re-mount), Reset saved settings (clears this
   app's `studio:*` storage — the usual cause of a crash that survives a
   reload), and Reload. The error is logged with the region name.
   (Break-it QA round, DX1.)
--------------------------------------------------------------------------- */
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode; label?: string; compact?: boolean; onReset?: () => void
  /** localStorage prefix that "Reset saved settings" clears (default: every `studio:` key) */
  resetPrefix?: string
}
interface State { error: Error | null }

export function clearSavedSettings(prefix = 'studio:') {
  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k?.startsWith(prefix)) keys.push(k) }
    keys.forEach((k) => localStorage.removeItem(k))
    return keys.length
  } catch { return 0 }
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }
  static getDerivedStateFromError(error: Error): State { return { error } }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[studio] ${this.props.label ?? 'A panel'} crashed:`, error, info.componentStack)
  }
  reset = () => { this.props.onReset?.(); this.setState({ error: null }) }
  render() {
    if (!this.state.error) return this.props.children
    const { label = 'This panel', compact } = this.props
    return (
      <div role="alert" className="flex h-full min-h-[120px] w-full items-center justify-center p-4">
        <div className={compact ? 'flex flex-col items-center gap-2 text-center' : 'pop flex max-w-[340px] flex-col items-center gap-3 p-5 text-center'}>
          <AlertTriangle size={18} strokeWidth={1.5} className="text-rec" />
          <div className="text-title font-medium text-fg">{label} hit an error</div>
          <div className="max-w-[280px] text-ui leading-relaxed text-fg-muted">{this.state.error.message || 'Something went wrong.'}</div>
          <div className="flex flex-wrap justify-center gap-1.5">
            <button type="button" onClick={this.reset} className="h-icon rounded-control bg-active px-2.5 text-ui font-medium text-fg hover:brightness-110">Try again</button>
            <button type="button" onClick={() => { clearSavedSettings(this.props.resetPrefix); location.reload() }} className="h-icon rounded-control px-2.5 text-ui text-fg-muted hover:bg-hover hover:text-fg">Reset saved settings</button>
            <button type="button" onClick={() => location.reload()} className="h-icon rounded-control px-2.5 text-ui text-fg-muted hover:bg-hover hover:text-fg">Reload</button>
          </div>
        </div>
      </div>
    )
  }
}
