---
title: "Remove the duplicate release title from generated notes"
date: "2026-11-03"
type: fixed
scope: "scripts/changelog.mjs, release-notes/"
version: "0.3.0"
released: "2026-11-03"
breaking: false
highlight: true
---

## Why

GitHub renders the release title above the body. The generated body also started with
`# <project> v<version>`, so every release page showed the same heading twice.

## What

- The generator no longer writes an H1 into `release-notes/vX.Y.Z.md`; the body starts with
  release metadata.
- Removed the duplicate H1 from the existing `v0.1.0` and `v0.2.0` notes and refreshed both
  published release bodies.

## Verification

- Generated `release-notes/v0.2.0.md` starts with `**Release date:**`.
- `gh release view v0.2.0` shows one title and no repeated heading.

## Notes

The release title remains owned by the workflow (`--title "k79-agent-skills vX.Y.Z"`), so the
body is safe to read standalone as well.
