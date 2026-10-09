"""One-off codemod (2026-10-09): namespace kit tokens so they can't collide with shadcn.
   accent* -> signal*, input -> control, muted -> fg-muted, faint -> fg-faint, font-sans -> font-ui.
   Only touches Tailwind utility tokens and CSS custom-property references; leaves other words alone."""
import re, sys, pathlib

UTIL = r'(?:bg|text|border(?:-[trblxy])?|ring|ring-offset|outline|fill|stroke|from|via|to|shadow|decoration|caret|divide|placeholder)'
subs = [
    # CSS custom properties (raw + theme-mapped)
    (re.compile(r'(?<![\w-])--accent(-strong|-fg|-soft)?(?![\w-])'), lambda m: '--signal' + (m.group(1) or '')),
    (re.compile(r'(?<![\w-])--input(?![\w-])'), '--control'),
    (re.compile(r'(?<![\w-])--color-accent(-strong|-fg|-soft)?(?![\w-])'), lambda m: '--color-signal' + (m.group(1) or '')),
    (re.compile(r'(?<![\w-])--color-input(?![\w-])'), '--color-control'),
    (re.compile(r'(?<![\w-])--color-muted(?![\w-])'), '--color-fg-muted'),
    (re.compile(r'(?<![\w-])--color-faint(?![\w-])'), '--color-fg-faint'),
    (re.compile(r'(?<![\w-])--font-sans(?![\w-])'), '--font-ui'),
    # Tailwind utilities
    (re.compile(r'(?<![\w-])(' + UTIL + r')-accent(-strong|-fg|-soft)?(?![\w-])'), lambda m: m.group(1) + '-signal' + (m.group(2) or '')),
    (re.compile(r'(?<![\w-])(' + UTIL + r')-input(?![\w-])'), lambda m: m.group(1) + '-control'),
    (re.compile(r'(?<![\w-])(' + UTIL + r')-muted(?![\w-])'), lambda m: m.group(1) + '-fg-muted'),
    (re.compile(r'(?<![\w-])(' + UTIL + r')-faint(?![\w-])'), lambda m: m.group(1) + '-fg-faint'),
    (re.compile(r'(?<![\w-])font-sans(?![\w-])'), 'font-ui'),
]
SKIP = {'src/shells/component-lab/tokens.ts'}  # emits shadcn-format themes for users on purpose
changed = 0
for root in sys.argv[1:]:
    for p in pathlib.Path(root).rglob('*'):
        if p.suffix not in {'.ts', '.tsx', '.css', '.md', '.mjs', '.js'} or 'node_modules' in p.parts: continue
        if str(p) in SKIP: continue
        s = p.read_text()
        t = s
        for rx, rep in subs: t = rx.sub(rep, t)
        if t != s:
            p.write_text(t); changed += 1
print('files changed:', changed)
