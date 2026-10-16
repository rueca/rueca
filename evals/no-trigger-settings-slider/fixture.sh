#!/bin/bash
set -e
mkdir -p src/pages src/lib
echo '{ "name": "app", "private": true, "type": "module", "dependencies": { "react": "^19.0.0", "react-dom": "^19.0.0" } }' > package.json
cat > src/lib/prefs.ts <<'T'
export type Prefs = { theme: 'system' | 'light' | 'dark'; reduceMotion: boolean }
const KEY = 'prefs'
export function getPrefs(): Prefs { return { theme: 'system', reduceMotion: false, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') } }
export function updatePrefs(patch: Partial<Prefs>) { localStorage.setItem(KEY, JSON.stringify({ ...getPrefs(), ...patch })) }
T
cat > src/pages/Settings.tsx <<'T'
import { useState } from 'react'
import { getPrefs, updatePrefs, type Prefs } from '../lib/prefs'

export function Settings() {
  const [prefs, setPrefs] = useState<Prefs>(getPrefs)
  const set = (patch: Partial<Prefs>) => { updatePrefs(patch); setPrefs((p) => ({ ...p, ...patch })) }
  return (
    <form className="settings">
      <h2>Appearance</h2>
      <label>Theme
        <select value={prefs.theme} onChange={(e) => set({ theme: e.target.value as Prefs['theme'] })}>
          <option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option>
        </select>
      </label>
      <label><input type="checkbox" checked={prefs.reduceMotion} onChange={(e) => set({ reduceMotion: e.target.checked })} /> Reduce motion</label>
    </form>
  )
}
T
