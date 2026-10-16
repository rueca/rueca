---
type: llm
weight: 1
focus: last_message
---
This is the agent's final message to the user after building a tuning tool with comments wired in. PASS only if it
tells the user how to leave a comment (press `C`, then click the art or a knob, or equivalent wording) and gives the
install step for the notes route (the `notes-server.json` registry item, or says it is installed). FAIL if comments
and Send to agent go unmentioned.
