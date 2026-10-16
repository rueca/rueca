---
type: regex
target: { source: file, path: package.json }
pattern: '"react": "\^18\.3\.1"[\s\S]*"tailwindcss": "\^3\.4\.14"'
match: contains
weight: 1
---
