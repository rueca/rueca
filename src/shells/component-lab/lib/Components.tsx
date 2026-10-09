/* The component set being designed. Real, interactive components that read
   only --cl-* variables; `force` pins a state for the States matrix. */
import { ArrowRight, Plus, Download, Sparkles, Check, Search, Mail, Lock, Bookmark } from 'lucide-react'
import type { ButtonV, InputV, CardV } from '../props'

const GLYPH = { 'arrow-right': ArrowRight, plus: Plus, download: Download, sparkles: Sparkles, check: Check } as const
const FIELD_ICON = { mail: Mail, search: Search, lock: Lock } as const

export function Button({ v, force }: { v: ButtonV; force?: string }) {
  const state = force ?? v.state
  const disabled = state === 'disabled' || v.disabled
  const loading = state === 'loading' || v.loading
  const Glyph = GLYPH[v.iconName as keyof typeof GLYPH] ?? ArrowRight
  const only = v.icon === 'only'
  return (
    <button type="button" className="cl-btn" data-variant={v.variant} data-size={v.size}
      data-state={state === 'default' || state === 'disabled' || state === 'loading' ? undefined : state}
      data-icon-only={only || undefined} data-full={v.fullWidth || undefined} data-loading={loading || undefined}
      data-disabled={disabled || undefined} aria-disabled={disabled || undefined} aria-busy={loading || undefined} aria-label={only ? v.label : undefined}
      tabIndex={force ? -1 : 0}>
      {loading ? <span className="cl-spin" aria-hidden /> : v.icon === 'leading' || only ? <Glyph strokeWidth={2} /> : null}
      {!only && <span className="cl-btn-label">{v.label}</span>}
      {!loading && v.icon === 'trailing' && <Glyph strokeWidth={2} />}
    </button>
  )
}

export function TextField({ v, force }: { v: InputV; force?: string }) {
  const state = force ?? v.inputState
  const disabled = state === 'disabled' || v.inputDisabled
  const Icon = FIELD_ICON[v.inputIcon as keyof typeof FIELD_ICON]
  const error = state === 'error'
  return (
    <label className="cl-field">
      {v.fieldLabel && <span className="cl-label">{v.fieldLabel}{v.required && <i aria-hidden>*</i>}</span>}
      <span className="cl-control" data-variant={v.inputVariant} data-size={v.inputSize}
        data-state={state === 'default' || state === 'disabled' ? undefined : state} data-disabled={disabled || undefined}>
        {Icon && <Icon strokeWidth={1.75} />}
        <input type="email" placeholder={v.placeholder} defaultValue={v.value} key={v.value} disabled={disabled} tabIndex={force ? -1 : 0} aria-invalid={error || undefined} />
      </span>
      {(error ? v.errorText : v.helper) && <span className="cl-help" data-error={error || undefined}>{error ? v.errorText : v.helper}</span>}
    </label>
  )
}

export function Card({ v, force, buttonV }: { v: CardV; force?: string; buttonV: ButtonV }) {
  const state = force ?? v.cardState
  return (
    <div className="cl-card-wrap">
      <article className="cl-card" data-variant={v.cardVariant} data-layout={v.layout} data-state={state === 'default' ? undefined : state} tabIndex={force ? -1 : 0}>
        {v.media && <div className="cl-media" aria-hidden><b /></div>}
        <div className="cl-body">
          {(v.eyebrow || v.badge) && <div className="cl-eyebrow">{v.eyebrow}{v.badge && <span className="cl-badge">New</span>}</div>}
          <h3 className="cl-title">{v.title}</h3>
          <p className="cl-text">{v.body}</p>
          {v.actions !== 'none' && (
            <div className="cl-actions">
              <Button v={{ ...buttonV, variant: 'primary', size: 'sm', label: 'Read story', icon: 'trailing', iconName: 'arrow-right', loading: false, disabled: false, fullWidth: false, state: 'default' }} force={force ? 'default' : undefined} />
              {v.actions === 'two' && <Button v={{ ...buttonV, variant: 'ghost', size: 'sm', label: 'Save', icon: 'leading', iconName: 'plus', loading: false, disabled: false, fullWidth: false, state: 'default' }} force={force ? 'default' : undefined} />}
            </div>
          )}
          <div className="cl-meta"><span className="cl-avatar" aria-hidden />Priya Raman · 6 min read <Bookmark size={13} style={{ marginLeft: 'auto' }} /></div>
        </div>
      </article>
    </div>
  )
}
