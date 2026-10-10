/* ---------------------------------------------------------------------------
   revealInScroller — scroll an element into view inside its NEAREST scrolling
   box only. `el.scrollIntoView()` also scrolls every ancestor, including the
   host page when a tool runs in an iframe (an embedded tool used to pull the
   landing page 135px under its nav on load). Use this for any "keep the
   selection visible" effect.
--------------------------------------------------------------------------- */
export function revealInScroller(el: Element | null | undefined) {
  if (!el) return
  const scrolls = (n: Element, axis: 'overflowY' | 'overflowX') => /auto|scroll/.test(getComputedStyle(n)[axis])
  const nearest = (axis: 'overflowY' | 'overflowX') => {
    let box = el.parentElement
    while (box && box !== document.body && box !== document.documentElement && !scrolls(box, axis)) box = box.parentElement
    return box && box !== document.body && box !== document.documentElement ? box : null
  }
  const r = el.getBoundingClientRect()
  const y = nearest('overflowY')
  if (y) {
    const b = y.getBoundingClientRect()
    if (r.top < b.top) y.scrollTop -= b.top - r.top
    else if (r.bottom > b.bottom) y.scrollTop += r.bottom - b.bottom
  }
  const x = nearest('overflowX')
  if (x) {
    const b = x.getBoundingClientRect()
    if (r.left < b.left) x.scrollLeft -= b.left - r.left
    else if (r.right > b.right) x.scrollLeft += r.right - b.right
  }
}
