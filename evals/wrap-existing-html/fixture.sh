#!/bin/bash
set -e
mkdir -p public src
echo '{ "name": "hero-harness", "private": true, "type": "module", "dependencies": { "react": "^19.0.0", "react-dom": "^19.0.0" } }' > package.json
cat > public/hero.html <<'H'
<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>:root{--accent:#ff5a1f;--headline-size:64px}body{margin:0;font:16px system-ui}
.hero{padding:10vw 6vw}h1{font-size:var(--headline-size);margin:0}a.cta{background:var(--accent);color:#fff;padding:12px 20px;border-radius:999px;display:inline-block;margin-top:24px}</style>
</head><body><section class="hero"><h1 id="headline">Ship the thing.</h1><p>Everything your team needs.</p><a class="cta" href="#">Get started</a></section></body></html>
H
