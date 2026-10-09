/* The neutral accent, as a stylesheet for documents the landing page doesn't
   own: the hero's live iframe, and the screenshots in scripts/thumbs-rail.mjs.
   :root:root beats the kit theme's :root / :root.light. See landing.css. */
export const NEUTRAL_ACCENT_CSS =
  ':root:root{--signal:#ffffff;--signal-strong:#ffffff;--signal-fg:#131313;--signal-soft:rgba(255,255,255,0.14)}' +
  ':root:root.light{--signal:#1a1a1a;--signal-strong:#1a1a1a;--signal-fg:#ffffff;--signal-soft:rgba(0,0,0,0.08)}'
