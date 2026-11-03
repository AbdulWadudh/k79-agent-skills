---
title: "Teach the Git skill to maintain changelogs and release notes"
date: "2026-11-03"
type: added
scope: "skills/k79-logging-errors-git/SKILL.md"
version: "0.2.0"
released: "2026-11-03"
breaking: false
highlight: true
---

## Why

Agents write commit messages but rarely maintain the artifacts a release needs. Without a rule,
changelogs become a single conflicted file, release notes are generated from uninformative
commit subjects, and past entries are rewritten until they no longer describe what shipped.

## What

- Added a changelog and release-notes section to `k79-logging-errors-git` covering the folder
  layout, the entry schema, the write rules, the release sequence, and the anti-patterns.
- The rules make one file per logical change mandatory, forbid editing a stamped entry, and
  require `CHANGELOG.md` and release notes to be generated from the entries.
- Added the changelog trigger to the router and to Phase 4 of the master orchestrator.

## Verification

- `bun run validate` passes with the updated description and metadata.
- The new section references the same schema that `scripts/changelog.mjs` validates.

## Notes

This is an instruction, not a generator. Projects without tooling are told to create the
generator first so the changelog has one source of truth.
