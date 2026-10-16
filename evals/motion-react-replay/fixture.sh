#!/bin/bash
set -e
mkdir -p src/components
cat > package.json <<'J'
{ "name": "notify", "private": true, "type": "module",
  "dependencies": { "react": "^19.0.0", "react-dom": "^19.0.0", "motion": "^12.0.0" },
  "devDependencies": { "vite": "^8.0.0", "@vitejs/plugin-react": "^5.0.0", "tailwindcss": "^4.0.0", "@tailwindcss/vite": "^4.0.0", "typescript": "^7.0.0" } }
J
cat > src/components/Toast.tsx <<'T'
import { motion } from 'motion/react'

export function Toast({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 26, mass: 1 }}
      className="rounded-xl bg-neutral-900 px-4 py-3 text-sm text-white shadow-lg"
    >
      {message}
    </motion.div>
  )
}
T
printf '@import "tailwindcss";\n' > src/index.css
