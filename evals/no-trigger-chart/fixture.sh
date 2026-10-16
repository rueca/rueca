#!/bin/bash
set -e
mkdir -p src/pages src/data src/components
echo '{ "name": "admin", "private": true, "type": "module", "dependencies": { "react": "^19.0.0", "react-dom": "^19.0.0", "recharts": "^2.15.0" } }' > package.json
cat > src/data/signups.ts <<'T'
export const weeklySignups = [
  { week: '2026-07-06', signups: 182 }, { week: '2026-07-13', signups: 205 }, { week: '2026-07-20', signups: 198 },
  { week: '2026-07-27', signups: 241 }, { week: '2026-08-03', signups: 263 }, { week: '2026-08-10', signups: 255 },
  { week: '2026-08-17', signups: 301 }, { week: '2026-08-24', signups: 318 },
]
T
cat > src/pages/Dashboard.tsx <<'T'
export function Dashboard() {
  return (
    <main className="dashboard">
      <h1>Overview</h1>
      <section className="cards">{/* KPI cards */}</section>
    </main>
  )
}
T
