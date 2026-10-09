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

  /* A clockwork winding key set into the work: wind it up, watch it go. Juanelo's automata ran on springs and cams. */
  juanelo({ ink, acc, bg }, size = 32) {
    return svg(
      `<ellipse cx="10" cy="7" rx="5.5" ry="4.5" fill="${ink}"/><ellipse cx="22" cy="7" rx="5.5" ry="4.5" fill="${ink}"/>` +
        `<circle cx="9.5" cy="7" r="1.7" fill="${bg}"/><circle cx="22.5" cy="7" r="1.7" fill="${bg}"/>` +
        `<rect x="14" y="5" width="4" height="12" rx="1" fill="${ink}"/>` +
        `<rect x="7" y="17" width="18" height="12" rx="2" fill="${acc}"/>`,
      size,
      'Juanelo mark',
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

  /* Round 3 ---------------------------------------------------------------- */

  /* A trompo: the Latin American spinning top. Wound with string, thrown, alive. */
  trompo({ ink, acc }, size = 32, small = size < 24) {
    return svg(
      `<rect x="14.4" y="2.5" width="3.2" height="6" rx="1.2" fill="${ink}"/>` +
        `<path d="M5.5 12.5 C5.5 9 10 7.5 16 7.5 C22 7.5 26.5 9 26.5 12.5 C26.5 17.5 20 23.5 16 29.5 C12 23.5 5.5 17.5 5.5 12.5 Z" fill="${ink}"/>` +
        `<path d="M5.7 11.2 H26.3 C26.5 12 26.5 13 26.3 14 H5.7 C5.5 13 5.5 12 5.7 11.2 Z" fill="${acc}"/>` +
        (small ? '' : `<path d="M2.5 20 Q4 24 7.5 25.5" fill="none" stroke="${acc}" stroke-width="1.6" stroke-linecap="round"/><path d="M29.5 20 Q28 24 24.5 25.5" fill="none" stroke="${acc}" stroke-width="1.6" stroke-linecap="round"/>`),
      size,
      'Trompo mark',
    )
  },

  /* Ruedita, “lil wheel”: a toy wheel with a hub and one bright grip to roll it by. */
  ruedita({ ink, acc, bg }, size = 32) {
    return svg(
      `<circle cx="16" cy="17" r="11.5" fill="${ink}"/>` +
        `<circle cx="16" cy="17" r="4" fill="${bg}"/>` +
        `<circle cx="16" cy="17" r="1.6" fill="${ink}"/>` +
        `<circle cx="16" cy="5.5" r="3.4" fill="${acc}"/>`,
      size,
      'Ruedita mark',
    )
  },

  /* Lilknob: a stubby knob with its pointer, and two dots on the scale that make it smile back. */
  lilknob({ ink, acc, bg }, size = 32) {
    return svg(
      `<circle cx="16" cy="18" r="10.5" fill="${ink}"/>` +
        `<line x1="16" x2="16" y1="18" y2="9.5" stroke="${acc}" stroke-width="2.8" stroke-linecap="round"/>` +
        `<circle cx="12" cy="20.5" r="1.5" fill="${bg}"/><circle cx="20" cy="20.5" r="1.5" fill="${bg}"/>` +
        `<circle cx="6" cy="5.5" r="1.6" fill="${ink}"/><circle cx="16" cy="3" r="1.6" fill="${ink}"/><circle cx="26" cy="5.5" r="1.6" fill="${ink}"/>`,
      size,
      'Lilknob mark',
    )
  },

  /* Tornasol: the shimmer of colour that shifts as you turn something. A disc with a turning sheen. */
  tornasol({ ink, acc, acc2, bg }, size = 32) {
    const id = 'tg' + Math.random().toString(36).slice(2, 8)
    return svg(
      `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${acc}"/><stop offset="1" stop-color="${acc2}"/></linearGradient></defs>` +
        `<circle cx="16" cy="16" r="12.5" fill="url(#${id})"/>` +
        `<path d="M16 3.5 C9 9 9 23 16 28.5 C11 28 4.5 23 4.5 16 C4.5 9 11 4 16 3.5 Z" fill="${ink}" opacity=".9"/>` +
        '',
      size,
      'Tornasol mark',
    )
  },
}
