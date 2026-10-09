# QA findings while building (feeds skill gotchas)

1. **Tailwind v4 + Vite dev: classes used only in files created after the server started may not reach the served CSS** — the `?direct` CSS had `.px-4`, the module the page imported didn't, even after reload. Fix: restart the dev server after an agent creates new component files (or touch the CSS entry). Symptom: an element's padding/size silently 0.
2. **rAF throttled in the desktop preview pane** (2 frames / 1.5s while `document.hidden=false`). Environment artifact; verify motion by stepping the clock (`clock.seek`) and sampling, not by waiting.
3. **TypeScript 7**: `baseUrl` removed; `paths` must be relative (`./src/*`).
4. **Store method variance**: declare store APIs with method syntax (bivariant) so `ParamStore<Specific>` is assignable to `ParamStore<any, any>` in kit components.
5. **Iframes swallow wheel/pointer** — a canvas camera can't pan over an iframe artboard. Pattern: Hand vs Interact mode with a transparent shield (Figma design vs prototype).
6. **Segmented labels truncate** at 3+ options in a 280px inspector — auto-pick dropdown when total label length is long, or icon-only with tooltips.
7. Flex rows with fixed-size icon buttons need `shrink-0` or they get squeezed on phones.
8. Option strings should auto-capitalise for display (`'solid'` → "Solid") but keep raw values.
