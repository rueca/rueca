/* The site footer: the drawing's title block, shared by the landing and the shells page.
   A row of dyed cells (landing.css .title-block): the logo, who drew it, the licence, a count, and
   where else to go. Each page passes its own count and links. */
import type { ReactNode } from 'react'
import { site } from '@/site.config'
import { Logo } from './parts'
import { Hand, Row } from './plate'
import { links } from './content'

/** A title-block cell: a small-caps label over its value. */
function TitleCell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 px-5 py-5 sm:px-6">
      <span className="strip text-[8.5px] text-fg-faint">{label}</span>
      {/* one fixed-height row, centred, so handwritten values and the plain links sit on the same line */}
      <span className="flex h-8 items-center text-[24px] text-fg">{children}</span>
    </div>
  )
}

export function SiteFooter({ count, elsewhere }: {
  /** the fourth cell, e.g. { label: 'Sheets', value: '6 in all' } */
  count: { label: string; value: string }
  /** the last cell's links (in-page or external) */
  elsewhere: { label: string; href: string }[]
}) {
  return (
    <Row as="footer">
      {/* 15+15 | 14+14+14: on the landing the first two columns end exactly at the 5/12 split above, so that divider runs straight on */}
      <div data-md="5" className="cells title-block auto-rows-fr text-[12.5px] md:grid-cols-[repeat(2,minmax(0,15fr))_repeat(3,minmax(0,14fr))]">
        {/* the name is glossed in the hero's Animate plate (its "Rueca" entry), so the footer just signs it */}
        <div className="flex items-center px-5 py-5 sm:px-6"><Logo height={16} /></div>
        <TitleCell label="Drawn by">{site.author.url
          ? <a href={site.author.url} target="_blank" rel="noreferrer" className="underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-signal"><Hand>{site.author.name}</Hand></a>
          : <Hand>{site.author.name}</Hand>}</TitleCell>
        <TitleCell label="Licence"><Hand delay={0.15}>{site.license}</Hand></TitleCell>
        <TitleCell label={count.label}><Hand delay={0.3}>{count.value}</Hand></TitleCell>
        <TitleCell label="Elsewhere">
          <span className="flex gap-4 text-[12.5px]">
            {elsewhere.map((l) => <a key={l.href} href={l.href} className="hover:underline">{l.label}</a>)}
          </span>
        </TitleCell>
      </div>
    </Row>
  )
}

/** The landing's and the shells page's "Elsewhere" links. */
export const FOOTER_LINKS = {
  landing: [{ label: 'Shells', href: '#/shells' }, { label: 'GitHub', href: links.repo }, { label: 'Contributing', href: links.contributing }],
  shells: [{ label: 'Overview', href: '#/' }, { label: 'GitHub', href: links.repo }, { label: 'Contributing', href: links.contributing }],
}
