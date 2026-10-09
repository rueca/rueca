/* ---------------------------------------------------------------------------
   contrastRatio — WCAG 2.x contrast between two hex colours (alpha ignored).

     contrastRatio('#111', '#fff')   // 18.88
     wcagGrade(4.6)                  // 'AA'

   Candidate for the kit: ColorField could show this as a badge when a
   schema pairs a foreground with a background (`p.color(…, { against: 'bg' })`).
--------------------------------------------------------------------------- */

function channel(c: number) {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}

export function luminance(hex: string) {
  let h = hex.replace('#', '')
  if (h.length === 3 || h.length === 4) h = h.split('').map((x) => x + x).join('')
  const n = parseInt(h.slice(0, 6), 16)
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
}

export function contrastRatio(a: string, b: string) {
  const la = luminance(a), lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

export const wcagGrade = (r: number) => (r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? 'AA large' : 'Fail')
