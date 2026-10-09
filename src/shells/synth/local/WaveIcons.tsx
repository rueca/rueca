/* ---------------------------------------------------------------------------
   Waveform glyphs — sine, triangle, saw, square — drawn to match lucide's
   grid (24 × 24, round caps) so they sit in Segmented/Tiles options next to
   lucide icons. Same props as a lucide icon: size, strokeWidth, className.
--------------------------------------------------------------------------- */
type P = { size?: number; strokeWidth?: number; className?: string }

const Svg = ({ size = 14, strokeWidth = 1.5, className, d }: P & { d: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth * 1.15} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d={d} />
  </svg>
)

export const SineIcon = (p: P) => <Svg {...p} d="M2 12c2.5-7 5.5-7 8 0s5.5 7 8 0c1-2.8 2.2-4.3 4-4.6" />
export const TriangleIcon = (p: P) => <Svg {...p} d="M2 12l5-7 10 14 5-7" />
export const SawIcon = (p: P) => <Svg {...p} d="M2 17L12 6v12L22 7" />
export const SquareIcon = (p: P) => <Svg {...p} d="M2 17h5V7h10v10h5" />
