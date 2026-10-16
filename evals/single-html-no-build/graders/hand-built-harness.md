---
type: llm
weight: 2
focus: { source: file, path: blob.html }
---
The user has one HTML file and no npm, so the kit can't be installed: this is the one case where the design-tool
harness is built by hand, in the same file. PASS only if:
- the tunable values (points, wobble, speed, colour) are declared ONCE in a param table that drives the controls,
  defaults, reset, presets, undo and a share link (values in the URL, e.g. a `#p=` hash, restored on load);
- saved looks are named presets the user can apply again, kept across reloads;
- the blob is drawn as a function of (values, t) by one animation loop that reads the current values, rather than
  a loop restarted or re-created on every change;
- the chrome is neutral and comes from inlined theme tokens (`var(--panel)`, `var(--fg)` and the like); a hex or
  hsl colour belongs only inside the artwork; a light theme works too;
- it stays plain HTML/CSS/JS with no npm packages and no build step.
FAIL if it is a bare form of `<input type="range">` with no presets, undo or share link, if the chrome is hard-coded
colours, or if the page now needs a build.
