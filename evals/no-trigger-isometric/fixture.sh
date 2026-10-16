#!/bin/bash
set -e
mkdir -p docs
cat > docs/queue.md <<'M'
# How the job queue works

Jobs enter one queue. A dispatcher hands the oldest job to the first free worker (there are three). A worker that
fails a job puts it back at the end of the queue with its retry count raised; after three retries it goes to the
dead-letter shelf.
M
