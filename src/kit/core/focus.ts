/* ---------------------------------------------------------------------------
   keepFocus — run something that may delete the focused element (Backspace on a
   card, node or row) without dropping keyboard focus to <body>. Afterwards focus
   moves to the item now at the same position among `peers`, or the last one.

     run: () => keepFocus(deleteSelection, '[data-card]')
--------------------------------------------------------------------------- */
export function keepFocus(run: () => void, peers: string) {
  const before = [...document.querySelectorAll<HTMLElement>(peers)]
  const i = before.indexOf(document.activeElement as HTMLElement)
  run()
  if (i < 0) return
  requestAnimationFrame(() => {
    const a = document.activeElement
    if (a && a !== document.body && a.isConnected) return
    const after = [...document.querySelectorAll<HTMLElement>(peers)]
    after[Math.min(i, after.length - 1)]?.focus({ preventScroll: true })
  })
}
