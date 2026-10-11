/* ---------------------------------------------------------------------------
   Fonts for the specimen. The chrome's "Inter Variable" is the wght-only
   build, so the artboard registers its own face from the same package: the
   opsz+wght build (opsz 14–32, wght 100–900) plus its true italic, under a
   private family name so the chrome can never be affected.

   Everything is bundled (no network): Vite turns the woff2 into a local URL.
--------------------------------------------------------------------------- */
import interUrl from '@fontsource-variable/inter/files/inter-latin-opsz-normal.woff2?url'
import interItalicUrl from '@fontsource-variable/inter/files/inter-latin-opsz-italic.woff2?url'
import newsUrl from '@fontsource-variable/newsreader/files/newsreader-latin-opsz-normal.woff2?url'
import newsItalicUrl from '@fontsource-variable/newsreader/files/newsreader-latin-opsz-italic.woff2?url'

export const SPECIMEN_FAMILY = 'Inter Specimen'
/** Newsreader (opsz 6–72, wght 200–800, true italic): the serif Rueca falls back to, set as the default specimen */
export const NEWS_FAMILY = 'Newsreader Specimen'

export interface FamilyInfo {
  id: string
  label: string
  /** CSS font-family stack */
  css: string
  /** real variable axes; anything else is simulated */
  axes: { wght?: [number, number]; opsz?: [number, number] }
  italic: 'true' | 'synthetic'
  /** bundled files to embed in SVG exports (system fonts can't be embedded), under this private family name */
  embed?: { url: string; style: 'normal' | 'italic' }[]
  face?: string
  note: string
}

export const FAMILIES: Record<string, FamilyInfo> = {
  newsreader: {
    id: 'newsreader', label: 'Newsreader', css: `"${NEWS_FAMILY}", Georgia, serif`,
    axes: { wght: [200, 800], opsz: [6, 72] }, italic: 'true', face: NEWS_FAMILY,
    embed: [{ url: newsUrl, style: 'normal' }, { url: newsItalicUrl, style: 'italic' }],
    note: 'Variable · wght 200–800 · opsz 6–72 · true italic',
  },
  inter: {
    id: 'inter', label: 'Inter Variable', css: `"${SPECIMEN_FAMILY}", "Inter Variable", sans-serif`,
    axes: { wght: [100, 900], opsz: [14, 32] }, italic: 'true',
    embed: [{ url: interUrl, style: 'normal' }, { url: interItalicUrl, style: 'italic' }], face: SPECIMEN_FAMILY,
    note: 'Variable · wght 100–900 · opsz 14–32 · true italic',
  },
  georgia: {
    id: 'georgia', label: 'Georgia', css: 'Georgia, "Times New Roman", serif',
    axes: {}, italic: 'true', note: 'System serif · static weights (400, 700)',
  },
  mono: {
    id: 'mono', label: 'System mono', css: 'ui-monospace, "SF Mono", Menlo, monospace',
    axes: {}, italic: 'synthetic', note: 'System monospace · static weights',
  },
  system: {
    id: 'system', label: 'System UI', css: 'system-ui, -apple-system, "Segoe UI", sans-serif',
    axes: { wght: [100, 900] }, italic: 'synthetic', note: 'Platform UI face · weight via the OS',
  },
}

let loading: Promise<void> | null = null
/** Register the specimen faces once. Resolves when both are usable (canvas needs this). */
export function loadSpecimenFonts(): Promise<void> {
  if (loading) return loading
  const faces = [
    new FontFace(SPECIMEN_FAMILY, `url(${interUrl}) format("woff2")`, { weight: '100 900', style: 'normal' }),
    new FontFace(SPECIMEN_FAMILY, `url(${interItalicUrl}) format("woff2")`, { weight: '100 900', style: 'italic' }),
    new FontFace(NEWS_FAMILY, `url(${newsUrl}) format("woff2")`, { weight: '200 800', style: 'normal' }),
    new FontFace(NEWS_FAMILY, `url(${newsItalicUrl}) format("woff2")`, { weight: '200 800', style: 'italic' }),
  ]
  loading = Promise.all(faces.map((f) => f.load().then((ff) => { document.fonts.add(ff) }))).then(() => undefined)
  return loading
}

const b64cache = new Map<string, Promise<string>>()
/** A bundled font as a data URI, for self-contained SVG exports. */
export function fontDataURI(url: string) {
  if (!b64cache.has(url))
    b64cache.set(url, fetch(url).then((r) => r.blob()).then((b) => new Promise<string>((res) => {
      const fr = new FileReader()
      fr.onload = () => res(fr.result as string)
      fr.readAsDataURL(b)
    })))
  return b64cache.get(url)!
}

/** CSS font-variation-settings for the current axes. */
export function variationSettings(fam: FamilyInfo, wght: number, opsz: number, autoOpsz: boolean, size: number) {
  const parts: string[] = []
  if (fam.axes.wght) parts.push(`"wght" ${Math.round(wght)}`)
  if (fam.axes.opsz) parts.push(`"opsz" ${Math.min(fam.axes.opsz[1], Math.max(fam.axes.opsz[0], autoOpsz ? size : opsz)).toFixed(1).replace(/\.0$/, '')}`)
  return parts.join(', ') || 'normal'
}
