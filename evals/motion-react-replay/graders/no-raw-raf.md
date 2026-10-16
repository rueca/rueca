---
type: regex
target: { source: file, path: src/ToastTuner.tsx }
pattern: 'requestAnimationFrame'
match: not_contains
weight: 1
---
