#!/bin/bash
set -e
mkdir -p src
echo '{ "name": "site", "private": true, "type": "module", "dependencies": { "react": "^19.0.0", "react-dom": "^19.0.0" } }' > package.json
cat > src/Hero.tsx <<'T'
import logo from './logo.svg'
export function Hero() {
  return (
    <section className="hero">
      <img src={logo} alt="Acme" className="hero-logo" width={96} height={96} />
      <h1>Ship the thing.</h1>
    </section>
  )
}
T
printf '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"/></svg>\n' > src/logo.svg
