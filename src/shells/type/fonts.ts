/* ---------------------------------------------------------------------------
   Fonts for the specimen. The chrome's "Inter Variable" is the wght-only
   build, so the artboard registers its own face from the same package: the
   opsz+wght build (opsz 14–32, wght 100–900) plus its true italic, under a
   private family name so the chrome can never be affected.

   Everything is bundled (no network): Vite turns the woff2 into a local URL.
--------------------------------------------------------------------------- */
import interUrl from '@fontsource-variable/inter/files/inter-latin-opsz-normal.woff2?url'
import interItalicUrl from '@fontsource-variable/inter/files/inter-latin-opsz-italic.woff2?url'

export const SPECIMEN_FAMILY = 'Inter Specimen'

export interface FamilyInfo {
  id: string
  label: string
  /** CSS font-family stack */
  css: string
  /** real variable axes; anything else is simulated */
  axes: { wght?: [number, number]; opsz?: [number, number] }
  italic: 'true' | 'synthetic'
  /** bundled files to embed in SVG exports (system fonts can't be embedded) */
  embed?: { url: string; style: 'normal' | 'italic' }[]
  note: string
}

export const FAMILIES: Record<string, FamilyInfo> = {
  inter: {
    id: 'inter', label: 'Inter Variable', css: `"${SPECIMEN_FAMILY}", "Inter Variable", sans-serif`,
    axes: { wght: [100, 900], opsz: [14, 32] }, italic: 'true',
    embed: [{ url: interUrl, style: 'normal' }, { url: interItalicUrl, style: 'italic' }],
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
  if (fam.axes.opsz) parts.push(`"opsz" ${(autoOpsz ? Math.min(fam.axes.opsz[1], Math.max(fam.axes.opsz[0], size)) : opsz).toFixed(1).replace(/\.0$/, '')}`)
  return parts.join(', ') || 'normal'
}
