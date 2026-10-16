---
type: regex
target: { source: file, path: blob.html }
pattern: '@/components/studio|from\s+["'']react'
match: not_contains
weight: 1
---
