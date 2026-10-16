---
max_turns: 25
timeout_seconds: 600
allowed_tools: [Read, Write, Edit, Glob, Grep, Skill]
tags: [trigger, environments]
---

`blob.html` is a single HTML file with a canvas blob animation. There's no npm and no build step: I drop it in a
static folder and open it, and I want to keep it that way. Turn it into a little tool where I can tune the blob
live (points, wobble, speed, colour), save a couple of looks I like, and send someone a link with my settings.
Keep it one file, `blob.html`. Write the file; don't run anything.
