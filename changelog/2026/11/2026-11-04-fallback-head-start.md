---
title: "Give the local gh publish a head start over the fallback workflow"
date: "2026-11-04"
type: changed
scope: ".github/workflows/release.yml, README.md"
version: ""
released: ""
breaking: false
highlight: false
---

## Why

The fallback workflow and the local `gh release create` start at nearly the same time on a tag
push. In the 2.2.0 release the workflow won the race and published, even though `gh` was
configured. The release was correct, but the intended order is local first, workflow only if
needed.

## What

- The fallback workflow now waits 15 seconds before checking whether the release exists.
- A configured `gh` normally publishes inside that window; the workflow sees the release and
  skips.
- If `gh` is missing or unauthenticated, the workflow publishes after the wait.
- The README describes the head start and the remaining race.

## Verification

- Release 2.2.1 triggers the workflow; the local `gh` publish completes first.
- The workflow run reports the release already exists and skips.
- `bun run validate`, `bun run release-notes:check`, and `bun run agents:check` pass.

## Notes

The delay is a heuristic, not a lock. Both paths are idempotent: whichever publishes first
wins and the other exits without duplicating the release.
