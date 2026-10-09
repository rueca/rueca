/* ---------------------------------------------------------------------------
   The component set's stylesheet. Plain CSS reading only --cl-* variables,
   scoped under .cl-root so it can never touch the studio chrome. Every
   interactive state also has a [data-state] twin so the States matrix can
   force it without faking events.
--------------------------------------------------------------------------- */
export const LIB_CSS = /* css */ `
.cl-root { font-family: var(--cl-font); color: var(--cl-text); -webkit-font-smoothing: antialiased; font-size: var(--cl-text-sm); line-height: 1.45; }
.cl-root *, .cl-root *::before, .cl-root *::after { box-sizing: border-box; }

/* ---------- Button ---------- */
.cl-btn {
  --h: var(--cl-h-md); --px: var(--cl-px-md); --fs: var(--cl-text-sm);
  position: relative; display: inline-flex; align-items: center; justify-content: center; gap: calc(var(--cl-gap) * .75);
  height: var(--h); padding: 0 var(--px); min-width: var(--h);
  font: inherit; font-size: var(--fs); font-weight: var(--cl-weight); letter-spacing: -0.005em; line-height: 1; white-space: nowrap;
  border-radius: var(--cl-radius); border: var(--cl-border-w) solid transparent; cursor: pointer; user-select: none;
  transition: background-color .15s, border-color .15s, box-shadow .15s, transform .08s, color .15s;
  outline: none;
}
.cl-btn[data-size="sm"] { --h: var(--cl-h-sm); --px: var(--cl-px-sm); --fs: var(--cl-text-xs); }
.cl-btn[data-size="lg"] { --h: var(--cl-h-lg); --px: var(--cl-px-lg); --fs: var(--cl-text-md); }
.cl-btn[data-icon-only] { padding: 0; width: var(--h); }
.cl-btn[data-full] { width: 100%; }
.cl-btn svg { width: 1.15em; height: 1.15em; flex: none; }

.cl-btn[data-variant="primary"] { background: var(--cl-accent); color: var(--cl-on-accent); box-shadow: var(--cl-shadow-sm); border-color: var(--cl-accent); }
.cl-btn[data-variant="primary"]:hover, .cl-btn[data-variant="primary"][data-state="hover"] { background: var(--cl-accent-hover); border-color: var(--cl-accent-hover); }
.cl-btn[data-variant="primary"]:active, .cl-btn[data-variant="primary"][data-state="active"] { background: var(--cl-accent-active); border-color: var(--cl-accent-active); }

.cl-btn[data-variant="secondary"] { background: var(--cl-surface-2); color: var(--cl-text); border-color: var(--cl-border); box-shadow: var(--cl-shadow-sm); }
.cl-btn[data-variant="secondary"]:hover, .cl-btn[data-variant="secondary"][data-state="hover"] { background: var(--cl-surface); border-color: var(--cl-border-strong); }
.cl-btn[data-variant="secondary"]:active, .cl-btn[data-variant="secondary"][data-state="active"] { background: var(--cl-border); }

.cl-btn[data-variant="outline"] { background: transparent; color: var(--cl-text); border-color: var(--cl-border-strong); }
.cl-btn[data-variant="outline"]:hover, .cl-btn[data-variant="outline"][data-state="hover"] { background: var(--cl-surface-2); }
.cl-btn[data-variant="outline"]:active, .cl-btn[data-variant="outline"][data-state="active"] { background: var(--cl-border); }

.cl-btn[data-variant="ghost"] { background: transparent; color: var(--cl-text); }
.cl-btn[data-variant="ghost"]:hover, .cl-btn[data-variant="ghost"][data-state="hover"] { background: var(--cl-surface-2); }
.cl-btn[data-variant="ghost"]:active, .cl-btn[data-variant="ghost"][data-state="active"] { background: var(--cl-border); }

.cl-btn[data-variant="destructive"] { background: var(--cl-danger); color: var(--cl-on-danger); border-color: var(--cl-danger); box-shadow: var(--cl-shadow-sm); }
.cl-btn[data-variant="destructive"]:hover, .cl-btn[data-variant="destructive"][data-state="hover"] { filter: brightness(1.06); }
.cl-btn[data-variant="destructive"]:active, .cl-btn[data-variant="destructive"][data-state="active"] { filter: brightness(.94); }

.cl-btn:active, .cl-btn[data-state="active"] { transform: var(--cl-press); }
.cl-btn:focus-visible, .cl-btn[data-state="focus"] { box-shadow: 0 0 0 2px var(--cl-bg), 0 0 0 4px var(--cl-ring), var(--cl-shadow-sm); }
.cl-btn[data-variant="destructive"]:focus-visible, .cl-btn[data-variant="destructive"][data-state="focus"] { box-shadow: 0 0 0 2px var(--cl-bg), 0 0 0 4px var(--cl-danger-soft); }
.cl-btn:disabled, .cl-btn[data-disabled] { opacity: .45; cursor: not-allowed; box-shadow: none; transform: none; filter: none; }
.cl-btn[data-loading] { cursor: progress; }
.cl-btn[data-loading] .cl-btn-label { opacity: .7; }

.cl-spin { width: 1.05em; height: 1.05em; border-radius: 99px; border: 2px solid currentColor; border-right-color: transparent; animation: cl-spin .7s linear infinite; flex: none; }
@keyframes cl-spin { to { transform: rotate(360deg); } }

/* ---------- Input ---------- */
.cl-field { display: flex; flex-direction: column; gap: 6px; width: 100%; max-width: 360px; }
.cl-label { font-size: var(--cl-text-xs); font-weight: var(--cl-weight); color: var(--cl-text); display: flex; gap: 4px; }
.cl-label i { color: var(--cl-danger); font-style: normal; }
.cl-control {
  --h: var(--cl-h-md); --px: var(--cl-px-md);
  display: flex; align-items: center; gap: 8px; height: var(--h); padding: 0 var(--px);
  background: var(--cl-surface); border: var(--cl-border-w) solid var(--cl-border-strong); border-radius: var(--cl-radius);
  color: var(--cl-text); transition: border-color .15s, box-shadow .15s, background-color .15s; box-shadow: var(--cl-shadow-sm);
}
.cl-control[data-size="sm"] { --h: var(--cl-h-sm); --px: var(--cl-px-sm); }
.cl-control[data-size="lg"] { --h: var(--cl-h-lg); --px: var(--cl-px-lg); }
.cl-control svg { width: 1.1em; height: 1.1em; color: var(--cl-text-faint); flex: none; }
.cl-control input { all: unset; flex: 1; min-width: 0; font: inherit; font-size: var(--cl-text-sm); color: var(--cl-text); }
.cl-control input::placeholder { color: var(--cl-text-faint); }
.cl-control[data-variant="filled"] { background: var(--cl-surface-2); border-color: transparent; box-shadow: none; }
.cl-control[data-variant="underline"] { background: transparent; border-width: 0 0 var(--cl-border-w) 0; border-radius: 0; padding: 0 2px; box-shadow: none; }
.cl-control:hover, .cl-control[data-state="hover"] { border-color: var(--cl-text-faint); }
.cl-control:focus-within, .cl-control[data-state="focus"] { border-color: var(--cl-accent); box-shadow: 0 0 0 3px var(--cl-ring); }
.cl-control[data-variant="underline"]:focus-within, .cl-control[data-variant="underline"][data-state="focus"] { box-shadow: 0 1px 0 0 var(--cl-accent); }
.cl-control[data-state="error"] { border-color: var(--cl-danger); box-shadow: 0 0 0 3px var(--cl-danger-soft); }
.cl-control[data-disabled] { opacity: .55; background: var(--cl-surface-2); cursor: not-allowed; box-shadow: none; }
.cl-help { font-size: var(--cl-text-xs); color: var(--cl-text-muted); }
.cl-help[data-error] { color: var(--cl-danger); }

/* ---------- Card ---------- */
.cl-card-wrap { container-type: inline-size; width: 100%; max-width: 680px; }
.cl-card {
  display: flex; flex-direction: column; overflow: hidden; width: 100%;
  background: var(--cl-surface); color: var(--cl-text); border-radius: var(--cl-radius-lg);
  border: var(--cl-border-w) solid transparent; transition: transform .2s cubic-bezier(.2,.8,.2,1), box-shadow .2s;
  outline: none;
}
.cl-card[data-variant="elevated"] { box-shadow: var(--cl-shadow-md); border-color: color-mix(in oklab, var(--cl-border) 60%, transparent); }
.cl-card[data-variant="outline"] { border-color: var(--cl-border-strong); }
.cl-card[data-variant="filled"] { background: var(--cl-surface-2); }
.cl-card:hover, .cl-card[data-state="hover"] { transform: translateY(-2px); box-shadow: var(--cl-shadow-lg); }
.cl-card:focus-visible, .cl-card[data-state="focus"] { box-shadow: 0 0 0 2px var(--cl-bg), 0 0 0 4px var(--cl-ring), var(--cl-shadow-md); }
.cl-card[data-layout="horizontal"] { flex-direction: row; }
@container (min-width: 520px) { .cl-card[data-layout="auto"] { flex-direction: row; } .cl-card[data-layout="auto"] .cl-media { width: 42%; aspect-ratio: auto; min-height: 220px; } }
.cl-card[data-layout="horizontal"] .cl-media { width: 42%; aspect-ratio: auto; min-height: 200px; }
.cl-media { position: relative; aspect-ratio: 16 / 9; flex: none; overflow: hidden;
  background:
    radial-gradient(120% 90% at 15% 20%, color-mix(in oklab, var(--cl-accent) 85%, white 15%) 0%, transparent 55%),
    radial-gradient(90% 120% at 85% 80%, color-mix(in oklab, var(--cl-accent) 40%, var(--cl-text) 60%) 0%, transparent 60%),
    linear-gradient(135deg, color-mix(in oklab, var(--cl-accent) 55%, var(--cl-bg) 45%), color-mix(in oklab, var(--cl-accent) 25%, var(--cl-surface-2) 75%));
}
.cl-media::after { content: ""; position: absolute; inset: 0; background: repeating-linear-gradient(115deg, rgb(255 255 255 / .07) 0 2px, transparent 2px 14px); }
.cl-media b { position: absolute; left: 50%; top: 50%; width: 38%; aspect-ratio: 1; translate: -50% -50%; border-radius: 999px; border: 1.5px solid rgb(255 255 255 / .55); box-shadow: 0 0 0 18px rgb(255 255 255 / .06), 0 0 0 40px rgb(255 255 255 / .04); }
.cl-body { display: flex; flex-direction: column; gap: calc(var(--cl-gap) * .75); padding: var(--cl-pad); flex: 1; min-width: 0; }
.cl-eyebrow { display: flex; align-items: center; gap: 8px; font-size: var(--cl-text-xs); color: var(--cl-accent-text); font-weight: var(--cl-weight); }
.cl-badge { display: inline-flex; align-items: center; height: 20px; padding: 0 7px; border-radius: 999px; background: var(--cl-accent-soft); color: var(--cl-accent-text); font-size: 11px; font-weight: 600; }
.cl-title { font-size: var(--cl-text-lg); font-weight: var(--cl-weight); letter-spacing: -0.015em; line-height: 1.2; margin: 0; text-wrap: balance; }
.cl-text { font-size: var(--cl-text-sm); color: var(--cl-text-muted); margin: 0; text-wrap: pretty; }
.cl-actions { display: flex; gap: var(--cl-gap); margin-top: calc(var(--cl-gap) * .75); flex-wrap: wrap; }
.cl-meta { display: flex; align-items: center; gap: 8px; margin-top: auto; padding-top: var(--cl-gap); font-size: var(--cl-text-xs); color: var(--cl-text-faint); }
.cl-avatar { width: 22px; height: 22px; border-radius: 99px; background: linear-gradient(135deg, var(--cl-accent), var(--cl-accent-active)); }
`
