/* ---------------------------------------------------------------------------
   Mini wireframes — procedural phone screens drawn with SVG primitives.
   Tones are CSS classes (flows.css) built from kit tokens, so the thumbnails
   re-theme with the chrome and survive the DOM snapshot export.
--------------------------------------------------------------------------- */
import { memo, type ReactNode } from 'react'
import type { Template } from './model'

export const WF_W = 120
export const WF_H = 210

type Tone = 'wf-1' | 'wf-2' | 'wf-3' | 'wf-acc' | 'wf-ok' | 'wf-rec' | 'wf-ink' | 'wf-card' | 'wf-knob'
const R = (x: number, y: number, w: number, h: number, t: Tone = 'wf-1', r = 2) => <rect x={x} y={y} width={w} height={h} rx={r} className={t} />
const C = (cx: number, cy: number, r: number, t: Tone = 'wf-2') => <circle cx={cx} cy={cy} r={r} className={t} />
const Text = (x: number, y: number, w: number, t: Tone = 'wf-3') => R(x, y, w, 3, t, 1.5)
const Title = (x: number, y: number, w: number) => R(x, y, w, 6, 'wf-ink', 2)
const Field = (x: number, y: number, w: number) => <rect x={x + 0.5} y={y + 0.5} width={w - 1} height={13} rx={3} className="wf-field" />
const Btn = (x: number, y: number, w: number, t: Tone = 'wf-acc') => R(x, y, w, 14, t, 4)
const Img = (x: number, y: number, w: number, h: number, r = 4) => (
  <g>
    {R(x, y, w, h, 'wf-1', r)}
    <path d={`M${x + w * 0.12} ${y + h * 0.82} L${x + w * 0.38} ${y + h * 0.48} L${x + w * 0.56} ${y + h * 0.68} L${x + w * 0.7} ${y + h * 0.55} L${x + w * 0.9} ${y + h * 0.82} Z`} className="wf-2" />
    {C(x + w * 0.74, y + h * 0.3, Math.min(w, h) * 0.08, 'wf-2')}
  </g>
)
const TabBar = (active = 0) => (
  <g>
    <rect x="0" y={WF_H - 20} width={WF_W} height="20" className="wf-bar" />
    {[0, 1, 2, 3].map((i) => <g key={i}>{C(18 + i * 28, WF_H - 10, 3, i === active ? 'wf-acc' : 'wf-2')}</g>)}
  </g>
)
const Row = (y: number, thumb = true, trailing?: ReactNode) => (
  <g>
    {thumb && R(10, y, 16, 16, 'wf-1', 3)}
    {Text(thumb ? 32 : 10, y + 3, 44, 'wf-ink')}
    {Text(thumb ? 32 : 10, y + 10, 30)}
    {trailing}
  </g>
)

const screens: Record<Template, () => ReactNode> = {
  splash: () => (
    <g>
      <rect x="0" y="0" width={WF_W} height={WF_H} className="wf-acc" opacity="0.14" />
      {C(60, 92, 16, 'wf-acc')}
      <path d="M53 92 l5 5 l9 -10" className="wf-check" />
      {Title(38, 120, 44)}
      {Text(46, 132, 28)}
    </g>
  ),
  welcome: () => (
    <g>
      {Img(10, 18, 100, 92, 6)}
      {Title(10, 122, 74)}
      {Text(10, 134, 96)}
      {Text(10, 141, 80)}
      {C(52, 158, 2, 'wf-acc')}{C(60, 158, 2)}{C(68, 158, 2)}
      {Btn(10, 172, 100)}
      {Text(42, 194, 36)}
    </g>
  ),
  signup: () => (
    <g>
      {Title(10, 22, 70)}
      {Text(10, 34, 90)}
      {Field(10, 52, 100)}{Field(10, 72, 100)}{Field(10, 92, 100)}
      {Text(10, 112, 64)}
      {Btn(10, 128, 100)}
      {Text(40, 152, 40)}
      {C(44, 170, 7, 'wf-1')}{C(60, 170, 7, 'wf-1')}{C(76, 170, 7, 'wf-1')}
    </g>
  ),
  login: () => (
    <g>
      {C(60, 38, 12, 'wf-acc')}
      {Title(32, 60, 56)}
      {Field(10, 82, 100)}{Field(10, 102, 100)}
      {Text(70, 121, 40, 'wf-acc')}
      {Btn(10, 134, 100)}
      {Text(30, 188, 60)}
    </g>
  ),
  otp: () => (
    <g>
      {Title(10, 22, 66)}
      {Text(10, 34, 92)}
      {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={10 + i * 17} y={50} width={14} height={18} rx={3} className={i < 3 ? 'wf-field wf-field-on' : 'wf-field'} />)}
      {Text(36, 78, 48, 'wf-acc')}
      <rect x="0" y="98" width={WF_W} height={WF_H - 98} className="wf-bar" />
      {Array.from({ length: 12 }, (_, i) => <g key={i}>{R(8 + (i % 3) * 36, 104 + Math.floor(i / 3) * 25, 32, 20, 'wf-1', 4)}</g>)}
    </g>
  ),
  permissions: () => (
    <g>
      {C(60, 62, 26, 'wf-1')}
      <path d="M50 70 h20 l-3 -4 v-8 a7 7 0 0 0 -14 0 v8 z M57 72 a3 3 0 0 0 6 0" className="wf-acc" />
      {Title(26, 104, 68)}
      {Text(16, 118, 88)}{Text(22, 125, 76)}
      {Btn(10, 160, 100)}
      {Text(44, 184, 32)}
    </g>
  ),
  paywall: () => (
    <g>
      <rect x="0" y="0" width={WF_W} height="70" className="wf-acc" opacity="0.18" />
      {C(60, 34, 14, 'wf-acc')}
      {Title(30, 80, 60)}
      {Text(18, 92, 84)}
      <rect x="10.5" y="106.5" width="47" height="44" rx="5" className="wf-field wf-field-on" />
      <rect x="62.5" y="106.5" width="47" height="44" rx="5" className="wf-field" />
      {Text(16, 114, 24, 'wf-ink')}{Text(68, 114, 24, 'wf-ink')}
      {R(16, 126, 30, 7, 'wf-ink')}{R(68, 126, 30, 7, 'wf-2')}
      {Btn(10, 164, 100)}
      {Text(40, 186, 40)}
    </g>
  ),
  home: () => (
    <g>
      {Title(10, 18, 50)}
      {C(102, 21, 6, 'wf-1')}
      <rect x="10.5" y="32.5" width="99" height="13" rx="6.5" className="wf-field" />
      {[0, 1, 2].map((i) => <g key={i}>{R(10 + i * 34, 52, 30, 9, i === 0 ? 'wf-acc' : 'wf-1', 4.5)}</g>)}
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          {Img(10 + (i % 2) * 52, 70 + Math.floor(i / 2) * 60, 48, 36)}
          {Text(10 + (i % 2) * 52, 110 + Math.floor(i / 2) * 60, 36, 'wf-ink')}
          {Text(10 + (i % 2) * 52, 117 + Math.floor(i / 2) * 60, 22)}
        </g>
      ))}
      {TabBar(0)}
    </g>
  ),
  search: () => (
    <g>
      <rect x="10.5" y="18.5" width="99" height="14" rx="7" className="wf-field wf-field-on" />
      {[0, 1, 2, 3, 4, 5].map((i) => <g key={i}>{Row(42 + i * 24)}</g>)}
      {TabBar(1)}
    </g>
  ),
  product: () => (
    <g>
      {Img(0, 0, WF_W, 96, 0)}
      {Title(10, 106, 70)}
      {R(10, 118, 26, 6, 'wf-acc')}
      {[0, 1, 2, 3, 4].map((i) => <g key={i}>{C(76 + i * 7, 121, 2.2, i < 4 ? 'wf-acc' : 'wf-2')}</g>)}
      {Text(10, 134, 98)}{Text(10, 141, 90)}{Text(10, 148, 70)}
      {R(10, 168, 30, 14, 'wf-1', 4)}
      {Btn(46, 168, 64)}
    </g>
  ),
  cart: () => (
    <g>
      {Title(10, 18, 40)}
      {[0, 1, 2].map((i) => <g key={i}>{Row(34 + i * 26, true, R(88, 37 + i * 26, 22, 10, 'wf-1', 5))}</g>)}
      {R(10, 118, 100, 4, 'wf-1', 2)}{R(10, 118, 66, 4, 'wf-ok', 2)}
      {Text(10, 132, 40)}{Text(84, 132, 26)}
      {Text(10, 140, 34)}{Text(84, 140, 26)}
      {R(10, 150, 100, 1, 'wf-2', 0)}
      {Text(10, 157, 30, 'wf-ink')}{Text(80, 157, 30, 'wf-ink')}
      {Btn(10, 176, 100)}
    </g>
  ),
  address: () => (
    <g>
      {R(0, 0, WF_W, 82, 'wf-1', 0)}
      <path d="M0 40 C30 30 50 60 120 44 M20 0 L46 82 M80 0 C70 30 90 50 84 82" className="wf-road" />
      <path d="M60 30 a8 8 0 0 1 8 8 c0 6 -8 14 -8 14 s-8 -8 -8 -14 a8 8 0 0 1 8 -8z" className="wf-acc" />
      {Title(10, 92, 60)}
      {Field(10, 106, 100)}{Field(10, 125, 64)}{Field(78, 125, 32)}{Field(10, 144, 100)}
      {Btn(10, 176, 100)}
    </g>
  ),
  payment: () => (
    <g>
      {Title(10, 18, 54)}
      <rect x="10" y="32" width="100" height="58" rx="7" className="wf-acc" />
      {R(18, 42, 16, 11, 'wf-card', 2)}
      {R(18, 68, 60, 4, 'wf-card', 2)}{R(18, 77, 30, 4, 'wf-card', 2)}
      {Field(10, 100, 100)}{Field(10, 119, 48)}{Field(62, 119, 48)}
      {Btn(10, 150, 100)}
      {R(10, 170, 100, 14, 'wf-ink', 4)}
    </g>
  ),
  review: () => (
    <g>
      {Title(10, 18, 62)}
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x="10.5" y={32.5 + i * 32} width="99" height="27" rx="4" className="wf-field" />
          {Text(16, 39 + i * 32, 30)}{Text(16, 47 + i * 32, 60, 'wf-ink')}{Text(96, 43 + i * 32, 8, 'wf-acc')}
        </g>
      ))}
      {Text(10, 138, 30, 'wf-ink')}{Text(78, 138, 32, 'wf-ink')}
      {Btn(10, 172, 100)}
    </g>
  ),
  success: () => (
    <g>
      {C(60, 70, 24, 'wf-ok')}
      <path d="M49 70 l8 8 l14 -16" className="wf-check" />
      {Title(26, 108, 68)}
      {Text(18, 122, 84)}{Text(28, 129, 64)}
      <rect x="10.5" y="142.5" width="99" height="20" rx="4" className="wf-field" />
      {Text(16, 150, 54)}
      {Btn(10, 176, 100)}
    </g>
  ),
  error: () => (
    <g>
      <path d="M60 46 L84 88 H36 Z" className="wf-rec" />
      {R(58.5, 60, 3, 14, 'wf-card', 1.5)}{C(60, 80, 1.8, 'wf-card')}
      {Title(28, 104, 64)}
      {Text(16, 118, 88)}{Text(26, 125, 68)}
      {Btn(10, 160, 100)}
      {Text(40, 184, 40)}
    </g>
  ),
  empty: () => (
    <g>
      {C(60, 72, 28, 'wf-1')}
      {R(46, 62, 28, 20, 'wf-2', 3)}
      {Title(34, 116, 52)}
      {Text(22, 130, 76)}
      {Btn(30, 152, 60)}
      {TabBar(2)}
    </g>
  ),
  profile: () => (
    <g>
      {C(60, 40, 18, 'wf-2')}
      {Title(36, 66, 48)}
      {Text(44, 77, 32)}
      {[0, 1, 2, 3].map((i) => <g key={i}>{Row(94 + i * 22, false, R(100, 99 + i * 22, 6, 6, 'wf-2', 1))}</g>)}
      {TabBar(3)}
    </g>
  ),
  settings: () => (
    <g>
      {Title(10, 18, 50)}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i}>
          {R(10, 36 + i * 24, 12, 12, 'wf-1', 3)}
          {Text(28, 40 + i * 24, 46, 'wf-ink')}
          <rect x="90" y={38 + i * 24} width="20" height="10" rx="5" className={i % 3 === 0 ? 'wf-acc' : 'wf-2'} />
          {C(i % 3 === 0 ? 105 : 95, 43 + i * 24, 3.4, 'wf-knob')}
        </g>
      ))}
      {TabBar(3)}
    </g>
  ),
}

export const Wireframe = memo(function Wireframe({ template, className }: { template: Template; className?: string }) {
  const draw = screens[template] ?? screens.empty
  return (
    <svg viewBox={`0 0 ${WF_W} ${WF_H}`} className={className} aria-hidden>
      <rect x="0" y="0" width={WF_W} height={WF_H} className="wf-bg" />
      {draw()}
      {/* status bar */}
      {R(8, 5, 14, 3, 'wf-3', 1.5)}
      {R(96, 5, 16, 3, 'wf-3', 1.5)}
    </svg>
  )
})
