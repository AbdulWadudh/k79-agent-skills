---
title: "Link only the changelog entries that belong to the release"
date: "2026-11-04"
type: fixed
scope: "skills/k79-logging-errors-git/scripts/release-notes.mjs, release-notes/v2.4.1.md"
version: "2.4.2"
released: "2026-11-03"
breaking: false
highlight: false
---

## Why

The generated Links section had two links that both pointed at the whole `changelog/` folder, so
a reader could not tell which entries belonged to the release. One of the two links was also a
duplicate.

## What

- The release-notes generator now lists each entry included in the release, by title, with a
  direct URL to that entry file.
- The generic "Changelog records" and "This release's entries" folder links are gone.
- The license link stays.
- Refreshed the v2.4.1 release body so the current page uses the precise links.

## Verification

- Regenerating release notes produces one link per selected entry plus the license.
- The v2.4.1 links point to the handoff entry, not the folder.
- `bun run validate`, `bun run release-notes:check`, and `bun run agents:check` pass.

## Notes

No changelog entries or entry hashes changed; only the generated Links section did.
