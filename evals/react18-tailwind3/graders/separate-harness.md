---
type: llm
weight: 2
focus: { source: file, path: harness/src/PricingHarness.tsx }
---
This file is a tuning harness for a `PricingCard` component that lives in an existing React 18 + Tailwind 3 app the
user won't upgrade. The kit needs React 19 + Tailwind 4, so the harness is its own small app that shows the real
card in iframes. PASS only if:
- the card is shown in iframes (`FrameSurface`) pointing at a page served by the user's own app and toolchain (for
  example a new preview entry that renders the real `PricingCard` with the values it receives), NOT re-implemented,
  copied or restyled inside the harness;
- plan name, price, highlighted, CTA copy and feature count are params in one schema (`defineSchema` / `p.*`)
  that drives the inspector, and the values reach the card (through `cssVars` / `apply` on the same origin, or the
  studio-bridge postMessage script on another origin);
- at least two widths (a phone and a desktop) are shown side by side;
- it deals with iframes swallowing pointer / wheel events (an interact / hand mode, a shield, or the kit surface's
  built-in handling).
FAIL if the card is ported into the harness, if there is only one width, or if the inputs are hand-built instead of
kit controls.
