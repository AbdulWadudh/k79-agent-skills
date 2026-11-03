---
title: "Attach the commit link to each change title"
date: "2026-11-04"
type: changed
scope: "skills/k79-logging-errors-git/scripts/release-notes.mjs, release-notes/v2.4.4.md"
version: ""
released: ""
breaking: false
highlight: false
---

## Why

The standalone `**Commit:**` line separated the link from the change it described. The commit
belongs at the end of the change title, where it reads as part of that change.

## What

- Commit links are now appended to each change title:
  `Title ([short](commit URL))`.
- The same suffix appears in Highlights and Breaking Changes.
- The standalone `**Commit:**` line is gone.
- Multiple entries in one release each get their own inline commit link.
- Refreshed the v2.4.4 release body.

## Verification

- Regenerating release notes puts the commit link on the title line.
- The v2.4.4 body shows the inline link in Highlights and the entry heading.
- `bun run validate`, `bun run release-notes:check`, and `bun run agents:check` pass.

## Notes

No changelog entry hashes changed; only the generated release-note layout did.
