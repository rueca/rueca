---
type: regex
target: { source: file, path: src/pages/Settings.tsx }
pattern: '@/components/studio|createParams|defineSchema'
match: not_contains
weight: 1
---
