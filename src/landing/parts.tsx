/* Small building blocks for the landing page. Kit tokens only — no colour
   literals — so both themes come for free. The brand colour comes in through
   --signal (landing.css), which Mark's hub uses. */
import { useState, type ReactNode } from 'react'
import { Check, Copy, Moon, Sun } from 'lucide-react'
import { cn } from '@kit/core/cn'
import { copyText } from '@kit/core/io'
import { useTheme } from '@kit/core/theme'
import { Tip } from '@kit/ui/tooltip'
import { site } from '@/site.config'

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-[1120px] px-4 sm:px-8', className)}>{children}</div>
}

export function Section({ id, children, className }: { id?: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} data-section={id} className={cn('scroll-mt-16 py-16 sm:py-20', className)}>
      <Container>{children}</Container>
    </section>
  )
}

/** Section heading: a quiet kicker, a title, an optional lede. Sentence case throughout. */
export function Heading({ kicker, title, lede, className }: { kicker?: string; title: ReactNode; lede?: ReactNode; className?: string }) {
  return (
    <div className={cn('max-w-[640px]', className)}>
      {kicker && <div data-reveal="fade" data-kicker className="font-hand mb-2.5 text-[24px] leading-none text-fg-muted">{kicker}</div>}
      <h2 data-reveal="head" className="font-display text-[36px] leading-[0.88] font-normal tracking-[-0.02em] text-balance text-fg sm:text-[56px]">{title}</h2>
      {lede && <p data-reveal style={{ '--reveal-delay': '80ms' } as React.CSSProperties} className="mt-5 text-[17px] leading-[1.6] text-pretty text-fg-muted">{lede}</p>}
    </div>
  )
}

/** A shell command with a copy button. `prompt` marks it as a Claude Code slash command vs a terminal line. */
export function CommandLine({ text, className }: { text: string; className?: string }) {
  const [done, setDone] = useState(false)
  const slash = text.startsWith('/')
  return (
    <div className={cn('group flex h-10 min-w-0 items-center gap-2 rounded-[9px] bg-control pr-1 pl-3.5 shadow-[inset_0_0_0_1px_var(--line)] dark:bg-fg/[0.035]', className)}>
      <span className="flex-none font-code text-[12px] text-fg-faint select-none">{slash ? '›' : '$'}</span>
      <code className="min-w-0 flex-1 truncate font-code text-[12.5px] text-fg" title={text}>{text}</code>
      <Tip label={done ? 'Copied' : 'Copy'}>
        <button
          type="button"
          aria-label={`Copy: ${text}`}
          onClick={() => copyText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1400) })}
          className="flex size-8 flex-none items-center justify-center rounded-[7px] text-fg-faint outline-none hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-signal"
        >
          {done ? <Check size={14} strokeWidth={1.75} className="text-ok" /> : <Copy size={14} strokeWidth={1.5} />}
        </button>
      </Tip>
    </div>
  )
}

export function ThemeButton({ className }: { className?: string }) {
  const { theme, toggle } = useTheme()
  return (
    <Tip label={theme === 'dark' ? 'Light theme' : 'Dark theme'}>
      <button type="button" onClick={toggle} aria-label="Toggle theme"
        className={cn('flex size-8 flex-none items-center justify-center rounded-[8px] text-fg-muted outline-none hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-signal', className)}>
        {theme === 'dark' ? <Sun size={15} strokeWidth={1.5} /> : <Moon size={15} strokeWidth={1.5} />}
      </button>
    </Tip>
  )
}

/** The Rueca mark, STAND-IN until Rafael's hand-drawn version (brand/BRAND.md): a spinning
    wheel, rim and spokes in the text colour, the hub in Achiote (annatto), the brand's one
    deliberate colour on the site. Drawn on a 32 grid so it survives 16px. */
/* The Rueca logo (rueca-logo.svg, 10 Oct 2026, 03:44), recoloured to the brand dyes
   (brand/data.js ruecaPalette): the mark's three parts in Gualda, Cielo and
   Achiote, lifted in dark mode; the wordmark in the page's ink (Nogal on light,
   Lana on dark) via currentColor. The file's white background is dropped. */
const LOGO_WORD = [
  'M479.67 177.81V192.19H389.25V177.79C396.73 177.36 402.56 175.83 406.74 173.21C410.92 170.59 413.01 166.55 413.01 161.1V70.09L389.25 55.36V48.16L443.37 28.52H449.31V61.58C456.79 53.29 464.27 45.71 471.75 38.83C479.23 31.96 487.26 28.52 495.84 28.52C501.56 28.52 506.18 30.06 509.7 33.14C513.22 36.22 515.86 40.07 517.62 44.69C519.38 49.31 520.37 54.04 520.59 58.88L494.85 76.37H489.24C486.82 71.53 484.34 67.62 481.81 64.66C479.28 61.69 475.92 60.2 471.75 60.2C468.23 60.2 464.54 61.4 460.7 63.79C456.85 66.19 453.05 69.24 449.31 72.94V161.16C449.31 166.61 451.56 170.58 456.08 173.09C460.59 175.6 468.46 177.18 479.67 177.83V177.81Z',
  'M678.05 31.81V155.23C678.05 160.47 679.04 164.35 681.02 166.85C683 169.36 686.74 171.05 692.24 171.92L702.14 173.55V186.97L648.35 195.48H642.08V168.31C635.48 174.86 627.94 181.02 619.47 186.81C611 192.59 601.49 195.48 590.93 195.48C581.91 195.48 574.1 193.46 567.5 189.43C560.9 185.39 555.84 179.83 552.32 172.73C548.8 165.64 547.04 157.73 547.04 149V70.1C547.04 63.77 545.28 59.41 541.76 57.01C538.24 54.61 532.41 52.97 524.27 52.1V37.37L583.34 31.81V136.08C583.34 147.63 585.81 156.08 590.76 161.41C595.71 166.75 602.8 169.42 612.05 169.42C617.55 169.42 622.99 168.17 628.38 165.66C633.77 163.15 638.22 160.27 641.75 157V70.06C641.75 63.74 639.99 59.38 636.47 56.98C632.95 54.59 627.12 52.95 618.98 52.08V37.37L678.05 31.81Z',
  'M736.77 100.17C736.77 112.79 739.13 123.95 743.86 133.63C748.59 143.31 755.13 150.99 763.49 156.64C771.85 162.3 781.31 165.13 791.87 165.13C799.79 165.13 807.43 163.77 814.8 161.05C822.17 158.33 828.83 153.47 834.76 146.5L842.35 153.4C836.41 165.45 828 175.48 817.1 183.49C806.21 191.49 793.18 195.49 778 195.49C764.36 195.49 751.98 192.11 740.88 185.34C729.77 178.58 720.92 169.13 714.31 157.02C707.71 144.91 704.41 130.88 704.41 114.94C704.41 102.94 706.39 91.7 710.35 81.22C714.31 70.74 719.64 61.57 726.35 53.72C733.06 45.86 740.87 39.7 749.78 35.22C758.69 30.74 768.2 28.51 778.32 28.51C789.1 28.51 798.5 30.69 806.53 35.05C814.56 39.41 821.1 45.13 826.16 52.21C831.22 59.29 835.01 66.97 837.54 75.25C840.07 83.53 841.34 91.59 841.34 99.43H727.49L726.83 83.59L802.73 83.92C802.73 77.22 801.63 70.95 799.43 65.11C797.23 59.27 793.87 54.47 789.36 50.68C784.85 46.89 779.07 45 772.03 45C765.65 45 759.76 47.23 754.38 51.69C748.99 56.15 744.7 62.46 741.51 70.62C738.32 78.78 736.72 88.63 736.72 100.16L736.77 100.17Z',
  'M927.5 45.01C920.46 45.01 913.86 47.3 907.7 51.87C901.54 56.44 896.48 63.13 892.52 71.94C888.56 80.75 886.58 91.47 886.58 104.09C886.58 114.97 888.72 125.03 893.01 134.29C897.3 143.54 903.29 150.93 911 156.48C918.7 162.03 927.61 164.8 937.73 164.8C944.99 164.8 952.09 163.44 959.02 160.72C965.95 158 972.39 153.26 978.32 146.52L985.58 153.42C979.86 165.47 971.61 175.49 960.83 183.49C950.05 191.49 937.4 195.48 922.88 195.48C909.68 195.48 897.74 192.15 887.07 185.5C876.4 178.84 867.98 169.57 861.83 157.67C855.67 145.77 852.59 132.08 852.59 116.58C852.59 104.36 854.73 92.95 859.02 82.37C863.31 71.78 869.25 62.45 876.84 54.38C884.43 46.31 893.23 39.97 903.24 35.39C913.25 30.81 923.97 28.51 935.42 28.51C943.34 28.51 950.98 29.88 958.35 32.6C965.72 35.33 971.77 39.21 976.5 44.23C981.23 49.25 983.59 55.48 983.59 62.9C983.59 68.14 981.99 72.51 978.8 76C975.61 79.5 971.38 81.24 966.09 81.24C961.69 81.24 958.17 79.99 955.53 77.49C952.89 74.99 950.91 71.24 949.59 66.23C947.83 58.83 945.35 53.44 942.17 50.07C938.98 46.7 934.09 45.01 927.49 45.01H927.5Z',
  'M1125.5 170.41C1128.14 170.41 1130.62 170.03 1132.92 169.26C1135.23 168.49 1137.15 167.56 1138.7 166.45L1142.66 176.35C1139.14 181.41 1134.35 185.92 1128.3 189.88C1122.25 193.84 1115.92 195.82 1109.33 195.82C1102.74 195.82 1096.18 193.8 1090.35 189.76C1084.52 185.72 1080.39 179.98 1077.97 172.55C1075.11 175.39 1071.42 178.61 1066.92 182.22C1062.41 185.83 1057.24 188.94 1051.41 191.56C1045.58 194.18 1039.14 195.49 1032.1 195.49C1020.66 195.49 1010.98 192.1 1003.06 185.33C995.14 178.55 991.18 169.6 991.18 158.45C991.18 149.49 993.6 141.84 998.44 135.5C1003.28 129.16 1009.88 123.7 1018.24 119.11C1026.6 114.52 1035.95 110.48 1046.29 106.98L1077.97 96.49V74.52C1077.97 66 1075.6 59.17 1070.88 54.03C1066.15 48.89 1059.05 46.33 1049.59 46.33C1043.87 46.33 1039.41 48.03 1036.22 51.41C1033.03 54.8 1031.44 58.9 1031.44 63.7C1031.44 66.76 1032.04 69.93 1033.25 73.21C1034.46 76.49 1036.16 79.99 1038.37 83.7L1008.34 91.95C1005.26 90.63 1002.45 88.43 999.92 85.36C997.39 82.29 996.13 78.44 996.13 73.85C996.13 67.94 998 62.29 1001.74 56.93C1005.48 51.57 1010.59 46.8 1017.08 42.64C1023.57 38.48 1030.94 35.09 1039.19 32.46C1047.44 29.83 1055.96 28.52 1064.77 28.52C1081.71 28.52 1094.03 32.07 1101.73 39.17C1109.43 46.27 1113.28 56.81 1113.28 70.79V157.63C1113.28 162 1114.49 165.23 1116.91 167.3C1119.33 169.38 1122.19 170.41 1125.49 170.41H1125.5ZM1026.83 149.2C1026.83 155.73 1029.19 160.95 1033.92 164.86C1038.65 168.78 1044.53 170.73 1051.58 170.73C1055.76 170.73 1060.27 170.08 1065.11 168.78C1069.95 167.48 1074.24 165.41 1077.98 162.58V112.65C1068.74 115.48 1060.27 118.42 1052.57 121.46C1044.87 124.51 1038.65 128.15 1033.93 132.39C1029.2 136.63 1026.84 142.23 1026.84 149.19L1026.83 149.2Z',
]
const LOGO_MARK: [string, 'achiote' | 'cielo' | 'gualda'][] = [
  ['M200.5 169C233.913 169 261 141.913 261 108.5C261 75.0868 233.913 48 200.5 48C167.087 48 140 75.0868 140 108.5C140 141.913 167.087 169 200.5 169Z', 'cielo'],
  ['M67 169C78.598 169 88 159.598 88 148C88 136.402 78.598 127 67 127C55.402 127 46 136.402 46 148C46 159.598 55.402 169 67 169Z', 'achiote'],
  ['M200.47 25C246.64 25 284.06 62.43 284.06 108.59C284.06 154.75 246.63 192.18 200.47 192.18H66.8C43.72 192.18 25 173.47 25 150.38C25 127.29 47.9 113.09 47.9 113.09L147.29 44.08C161.74 32.15 180.27 24.99 200.46 24.99M200.47 0C175.67 0 151.49 8.55 132.24 24.11L33.9 92.38C28.71 95.84 0 116.46 0 150.39C0 187.22 29.96 217.19 66.8 217.19H200.47C229.48 217.19 256.75 205.89 277.26 185.38C297.77 164.87 309.07 137.6 309.07 108.59C309.07 79.58 297.77 52.31 277.26 31.8C256.74 11.3 229.47 0 200.47 0Z', 'gualda'],
]
/** brand dyes: light value, then the lifted dark value */
const LOGO_DYE = {
  achiote: 'fill-[#E8582C] dark:fill-[#F06A3E]',
  cielo: 'fill-[#5DB4E8] dark:fill-[#6FC0EE]',
  gualda: 'fill-[#F2C744] dark:fill-[#F5D05A]',
}

/** Mono for now (Rafael, 10 Oct 2026): the whole logo in the page's ink. Flip to bring the dyes back. */
const LOGO_IN_COLOUR = false
const markFill = (dye: keyof typeof LOGO_DYE) => (LOGO_IN_COLOUR ? { className: LOGO_DYE[dye] } : { fill: 'currentColor' })

/** The mark alone. */
export function Mark({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 310 218" height={size} width={(size * 310) / 218} aria-hidden className={cn('flex-none text-fg', className)}>
      {LOGO_MARK.map(([d, dye]) => <path key={d} d={d} {...markFill(dye)} />)}
    </svg>
  )
}

/** Mark + wordmark, as drawn in the logo file. `height` is the whole lockup's. */
export function Logo({ height = 20, className }: { height?: number; className?: string }) {
  return (
    <svg viewBox="0 0 1143 218" height={height} width={(height * 1143) / 218} role="img" aria-label={site.name} className={cn('flex-none text-fg', className)}>
      {LOGO_MARK.map(([d, dye]) => <path key={d} d={d} {...markFill(dye)} />)}
      {LOGO_WORD.map((d) => <path key={d} d={d} fill="currentColor" />)}
    </svg>
  )
}

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('inline-flex h-6 items-center rounded-[6px] bg-hover px-2 text-[11.5px] whitespace-nowrap text-fg-muted', className)}>{children}</span>
}

/** Scroll to a landing section without touching the hash — the hash is the router. */
export const scrollToSection = (id: string) => document.querySelector(`[data-section="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

