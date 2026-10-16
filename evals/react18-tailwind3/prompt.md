---
max_turns: 30
timeout_seconds: 900
allowed_tools: [Read, Write, Edit, Glob, Grep, Skill]
tags: [trigger, environments]
---

Our app is React 18 + Tailwind 3 and we're not upgrading it. I want to tune `src/components/PricingCard.tsx`:
plan name, price, the highlighted state, the CTA copy and how many features it lists, and see the card at a phone
width and a desktop width side by side. Don't touch our app: you can add new files, but don't change any existing
file and don't upgrade anything. Put the tuning tool's main component in `harness/src/PricingHarness.tsx`.
Write the files; don't run anything.
