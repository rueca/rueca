#!/bin/bash
set -e
mkdir -p src/components
cat > package.json <<'J'
{ "name": "acme-app", "private": true, "type": "module",
  "scripts": { "dev": "vite", "build": "tsc -b && vite build" },
  "dependencies": { "react": "^18.3.1", "react-dom": "^18.3.1" },
  "devDependencies": { "vite": "^5.4.10", "@vitejs/plugin-react": "^4.3.3", "tailwindcss": "^3.4.14", "postcss": "^8.4.47", "autoprefixer": "^10.4.20", "typescript": "^5.6.3", "@types/react": "^18.3.12", "@types/react-dom": "^18.3.1" } }
J
cat > tailwind.config.js <<'J'
/** @type {import('tailwindcss').Config} */
export default { content: ['./index.html', './src/**/*.{ts,tsx}'], theme: { extend: {} }, plugins: [] }
J
echo "export default { plugins: { tailwindcss: {}, autoprefixer: {} } }" > postcss.config.js
cat > vite.config.ts <<'J'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({ plugins: [react()] })
J
cat > index.html <<'J'
<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Acme</title></head>
<body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>
J
printf '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n' > src/index.css
cat > src/main.tsx <<'J'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>)
J
cat > src/App.tsx <<'J'
import { PricingCard } from './components/PricingCard'
export default function App() {
  return (
    <main className="mx-auto grid max-w-5xl gap-8 p-10 md:grid-cols-3">
      <PricingCard plan="Free" price={0} features={['1 project', 'Community support']} cta="Get started" />
      <PricingCard plan="Pro" price={24} features={['Unlimited projects', 'Priority support', 'Analytics']} highlighted />
      <PricingCard plan="Team" price={79} features={['Everything in Pro', 'SSO', 'Audit log']} cta="Contact sales" />
    </main>
  )
}
J
cat > src/components/PricingCard.tsx <<'J'
type Props = { plan: string; price: number; period?: 'month' | 'year'; features: string[]; highlighted?: boolean; cta?: string }

export function PricingCard({ plan, price, period = 'month', features, highlighted = false, cta = 'Start free trial' }: Props) {
  return (
    <div className={`rounded-2xl p-8 ${highlighted ? 'bg-indigo-600 text-white shadow-xl ring-2 ring-indigo-600' : 'bg-white text-slate-900 ring-1 ring-slate-200'}`}>
      <h3 className="text-lg font-semibold">{plan}</h3>
      <p className="mt-4 flex items-baseline gap-x-1">
        <span className="text-4xl font-bold tracking-tight">${price}</span>
        <span className="text-sm opacity-70">/{period}</span>
      </p>
      <ul className="mt-6 space-y-2 text-sm">{features.map((f) => <li key={f}>✓ {f}</li>)}</ul>
      <a href="#" className={`mt-8 block rounded-lg px-4 py-2.5 text-center text-sm font-semibold ${highlighted ? 'bg-white text-indigo-600' : 'bg-indigo-600 text-white'}`}>{cta}</a>
    </div>
  )
}
J
