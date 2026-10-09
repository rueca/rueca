/* Logo marks for the four shortlisted names, drawn on a 32-unit grid.
   Each takes { ink, acc, bg } so one drawing serves light, dark and icon tiles.
   `small` drops detail that turns to mush below ~24px. */

const svg = (body, size, label) =>
  `<svg viewBox="0 0 32 32" width="${size}" height="${size}" role="img" aria-label="${label}">${body}</svg>`

export const marks = {
  /* A thumbwheel seen edge-on in its slot. Ridges bunch towards the top and
     bottom the way a rolling cylinder does; the orange line is the current value. */
  thumbwheel({ ink, acc, bg }, size = 32, small = size < 24) {
    const angles = small ? [-50, -25, 25, 50] : [-67.5, -45, -22.5, 22.5, 45, 67.5]
    const ridges = angles
      .map((a) => {
        const r = (a * Math.PI) / 180
        const y = 16 + 10 * Math.sin(r)
        const w = Math.max(0.7, 1.7 * Math.cos(r))
        return `<line x1="12.6" x2="19.4" y1="${y.toFixed(2)}" y2="${y.toFixed(2)}" stroke="${bg}" stroke-width="${w.toFixed(2)}" stroke-linecap="round"/>`
      })
      .join('')
    return svg(
      `<rect x="9" y="2.5" width="14" height="27" rx="7" fill="${ink}"/>${ridges}` +
        `<line x1="4.5" x2="27.5" y1="16" y2="16" stroke="${acc}" stroke-width="${small ? 2.6 : 2.1}" stroke-linecap="round"/>`,
      size,
      'Thumbwheel mark',
    )
  },

  /* Stage seen from the house: two wing flats in perspective, the work lit in the middle. */
  wingspace({ ink, acc }, size = 32) {
    const wing = (d) => `<path d="${d}" fill="${acc}" stroke="${acc}" stroke-width="2" stroke-linejoin="round"/>`
    return svg(
      wing('M4 5 L11 8.5 V23.5 L4 27 Z') + wing('M28 5 L21 8.5 V23.5 L28 27 Z') +
        `<rect x="13.25" y="12" width="5.5" height="8" rx="1" fill="${ink}"/>`,
      size,
      'Wingspace mark',
    )
  },

  /* A corner jig: an L-shaped fence holds the workpiece; the hole is the drill bushing. */
  jigwork({ ink, acc, bg }, size = 32) {
    return svg(
      `<path d="M4.5 4.5 H10.5 V21.5 H27.5 V27.5 H4.5 Z" fill="${ink}" stroke="${ink}" stroke-width="1" stroke-linejoin="round"/>` +
        `<rect x="13" y="4.5" width="14.5" height="14.5" rx="1.5" fill="${acc}"/>` +
        `<circle cx="20.25" cy="11.75" r="2.7" fill="${bg}"/>`,
      size,
      'Jigwork mark',
    )
  },

  /* A C-clamp closing on the work. Reads as a C at small sizes. */
  clampwork({ ink, acc }, size = 32, small = size < 24) {
    return svg(
      `<path d="M24.5 6.5 H10 Q6.5 6.5 6.5 10 V22 Q6.5 25.5 10 25.5 H24.5" fill="none" stroke="${ink}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>` +
        (small ? '' : `<line x1="16.5" x2="23.5" y1="2.2" y2="2.2" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>`) +
        `<line x1="20" x2="20" y1="${small ? 6.5 : 2.2}" y2="12" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/>` +
        `<rect x="15.5" y="11.5" width="9" height="2.6" rx="1" fill="${ink}"/>` +
        `<rect x="12.5" y="15.1" width="15" height="7.6" rx="1.2" fill="${acc}"/>`,
      size,
      'Clampwork mark',
    )
  },

  /* Round 2 ---------------------------------------------------------------- */

  /* A marionette's control cross. The strings run down to the work; the work stays itself. */
  cruceta({ ink, acc }, size = 32, small = size < 24) {
    const s = small ? 2 : 1.3
    return svg(
      `<line x1="5" x2="27" y1="6.5" y2="6.5" stroke="${ink}" stroke-width="3.2" stroke-linecap="round"/>` +
        `<line x1="16" x2="16" y1="2.5" y2="11.5" stroke="${ink}" stroke-width="3.2" stroke-linecap="round"/>` +
        `<line x1="5.5" x2="10" y1="7.5" y2="19" stroke="${ink}" stroke-width="${s}" stroke-linecap="round"/>` +
        `<line x1="26.5" x2="22" y1="7.5" y2="19" stroke="${ink}" stroke-width="${s}" stroke-linecap="round"/>` +
        (small ? '' : `<line x1="16" x2="16" y1="12" y2="19" stroke="${ink}" stroke-width="${s}" stroke-linecap="round"/>`) +
        `<rect x="9" y="18.5" width="14" height="10.5" rx="1.6" fill="${acc}"/>`,
      size,
      'Cruceta mark',
    )
  },

  /* Stage machinery: a fly-loft pulley. One side flies the scenery, the other is the counterweight in your hand. */
  tramoya({ ink, acc }, size = 32) {
    return svg(
      `<line x1="4" x2="28" y1="3" y2="3" stroke="${ink}" stroke-width="2.6" stroke-linecap="round"/>` +
        `<circle cx="16" cy="10" r="5.2" fill="none" stroke="${ink}" stroke-width="2.6"/>` +
        `<line x1="16" x2="16" y1="3" y2="6" stroke="${ink}" stroke-width="2.6"/>` +
        `<line x1="10.8" x2="10.8" y1="10" y2="19" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>` +
        `<line x1="21.2" x2="21.2" y1="10" y2="22" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>` +
        `<rect x="4" y="18.5" width="13.5" height="10.5" rx="1.4" fill="${acc}"/>` +
        `<rect x="18.7" y="21.5" width="5" height="7.5" rx="1.2" fill="${ink}"/>`,
      size,
      'Tramoya mark',
    )
  },

  /* An embroidery hoop: the frame that holds the work taut while you work on it. */
  bastidor({ ink, acc }, size = 32) {
    return svg(
      `<circle cx="16" cy="17.5" r="11.5" fill="none" stroke="${ink}" stroke-width="3.2"/>` +
        `<rect x="13" y="2" width="6" height="5.5" rx="1.2" fill="${ink}"/>` +
        `<circle cx="16" cy="17.5" r="7.2" fill="${acc}"/>`,
      size,
      'Bastidor mark',
    )
  },

  /* A periaktos from above: a three-sided turning prism. The lit face is the scene the audience sees. */
  periaktos({ ink, acc }, size = 32) {
    return svg(
      `<path d="M16 4.5 L27.5 24.5 H4.5 Z" fill="none" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>` +
        `<line x1="4.5" x2="27.5" y1="24.5" y2="24.5" stroke="${acc}" stroke-width="4.4" stroke-linecap="round"/>` +
        `<circle cx="16" cy="17.5" r="2" fill="${ink}"/>`,
      size,
      'Periaktos mark',
    )
  },
}
