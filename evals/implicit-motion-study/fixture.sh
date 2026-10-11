#!/bin/bash
set -e
mkdir -p src/assets
cat > package.json <<'J'
{ "name": "brand", "private": true, "type": "module",
  "dependencies": { "react": "^19.0.0", "react-dom": "^19.0.0" },
  "devDependencies": { "vite": "^8.0.0", "@vitejs/plugin-react": "^5.0.0", "tailwindcss": "^4.0.0", "@tailwindcss/vite": "^4.0.0", "typescript": "^7.0.0" } }
J
cat > src/assets/mark.svg <<'S'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none" stroke="#1d1d1b" stroke-width="6" stroke-linecap="round">
  <path id="a1" d="M60 100 A20 20 0 0 1 40 80"/><path id="a2" d="M60 100 A30 30 0 0 1 30 70"/>
  <path id="a3" d="M60 100 A40 40 0 0 1 20 60"/><path id="a4" d="M60 100 A50 50 0 0 1 10 50"/>
  <path id="a5" d="M60 100 A60 60 0 0 1 0 40"/>
</svg>
S
printf '@import "tailwindcss";\n' > src/index.css
