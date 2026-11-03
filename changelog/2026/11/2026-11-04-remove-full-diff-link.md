---
title: "Remove the redundant Full diff link from release notes"
date: "2026-11-04"
type: changed
scope: "skills/k79-logging-errors-git/scripts/release-notes.mjs, release-notes/v2.4.2.md"
version: ""
released: ""
breaking: false
highlight: false
---

## Why

The release page already shows the tag and commit. The `**Full diff:**` line repeated that
navigation with a compare URL, and for a first release it fell back to the release page itself.
It was noise in every generated note.

## What

- Removed the `**Full diff:**` metadata line from generated release notes.
- Removed the now-unused previous-version calculation from the generator.
- Kept the release-specific changelog entry links and the license link.
- Refreshed the v2.4.2 release body so the current page matches.

## Verification

- Generated notes start with the release date and license, then Highlights.
- The v2.4.2 Links section lists the change record and license only.
- `bun run validate`, `bun run release-notes:check`, and `bun run agents:check` pass.

## Notes

No changelog entries or hashes changed; only the generated release-note header did.
