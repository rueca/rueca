/** Every shell folder exports `meta` from meta.ts and a default component from index.tsx. */
export interface ShellMeta {
  id: string
  name: string
  /** what kind of instrument this stands in for */
  category: 'Motion' | 'Graphics' | '3D' | 'Photo' | 'UI design' | 'UX & mapping' | 'Generators' | 'Playground' | 'Audio' | 'AI' | 'Data' | 'Type'
  description: string
  /** the layout archetype — used to check coverage */
  archetype: string
  /** pro tools it cross-references */
  references?: string[]
  order?: number
}
