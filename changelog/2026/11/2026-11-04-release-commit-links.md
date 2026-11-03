---
title: "Link each release entry to the commit that introduced it"
date: "2026-11-04"
type: added
scope: "skills/k79-logging-errors-git/scripts/release-notes.mjs, skills/k79-logging-errors-git/SKILL.md, README.md"
version: "2.4.4"
released: "2026-11-03"
breaking: false
highlight: true
---

## Why

The release note explained what changed, but readers still had to search the Git history to see
the exact diff. A direct commit link closes that gap without re-adding a generic release or
compare link.

## What

- Each entry in a generated release note now includes `**Commit:** [short](commit URL)`.
- The link uses the commit that introduced or last changed the entry, ignoring
  `chore(release):` commits.
- Multiple entries in one release each get their own commit link; all entries are included.
- The documentation now states that a release includes every selected entry.
- Refreshed the v2.4.3 release body with the commit link.

## Verification

- Regenerating v2.4.3 adds a commit link to its entry.
- Release 2.4.4 includes a commit link for its own entry.
- `bun run validate`, `bun run release-notes:check`, and `bun run agents:check` pass.

## Notes

If an entry has no commit yet, the link is omitted. The release note still includes the full
entry body.
