---
title: "Add a folder-per-change changelog ledger with generated release notes"
date: "2026-11-03"
type: added
scope: "changelog/, scripts/changelog.mjs, scripts/release.mjs, CHANGELOG.md"
version: "0.2.0"
released: "2026-11-03"
breaking: false
highlight: false
---

## Why

A single hand-maintained `CHANGELOG.md` causes merge conflicts on concurrent branches, loses
entries when the Unreleased section is reset, and forces the release notes to be re-written
from commit subjects that say nothing about why a change exists.

## What

- Added `changelog/YYYY/MM/YYYY-MM-DD-<slug>.md` as the atomic record, with frontmatter for
  `title`, `date`, `type`, `scope`, `version`, `released`, and `breaking`.
- Added `scripts/changelog.mjs` with four modes: validate and regenerate, `--check`,
  `--stamp <version>`, and `--release <version>`.
- `CHANGELOG.md` is now generated. `Unreleased` is derived from entries without a version, so
  nothing has to be reset or deleted at release time.
- `release-notes/vX.Y.Z.md` is generated from the same entries, including highlights, grouped
  change details, breaking changes, verification commands, and install/update instructions.
- `release.mjs` now stamps unreleased entries, regenerates both files, and refuses to release
  when there is nothing to record.
- CI runs `bun run changelog:check` so a stale or malformed changelog fails the build.

## Verification

- `bun run changelog:check` passes.
- Generated `CHANGELOG.md` reproduces the `0.1.0` history from its backfilled entry.
- `bun run release --dry-run` reports the entries that would be stamped.

## Notes

Existing release notes are never overwritten; pass `--force` to regenerate one deliberately.
