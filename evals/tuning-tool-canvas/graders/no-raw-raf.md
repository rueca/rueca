---
type: regex
target: { source: file, path: src/RippleTool.tsx }
pattern: 'requestAnimationFrame'
match: not_contains
weight: 1
---
