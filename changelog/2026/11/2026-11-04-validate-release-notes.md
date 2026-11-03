---
title: "Run release-note validation from the skill validator"
date: "2026-11-04"
type: changed
scope: "scripts/validate-skills.mjs"
version: "2.0.1"
released: "2026-11-03"
breaking: false
highlight: false
---

## Why

After removing the aggregate changelog, `validate-skills.mjs` no longer checked any changelog
artifact. Release-note validation only ran as a separate CI step, so a local `bun run validate`
could pass with a broken manifest.

## What

- `validate-skills.mjs` now invokes `release-notes.mjs --check` after the skill checks.
- CI keeps the explicit `release-notes:check` step; the two are intentionally idempotent.
- The release command therefore validates the manifest and entry diff before stamping.

## Verification

- `bun run validate` prints the release-notes check and the skill count.
- A broken entry or a modified released entry makes `bun run validate` fail.
- `bun run release-notes:check` still passes independently.

## Notes

Projects that copy only `release-notes.mjs` are unaffected; `validate-skills.mjs` is a suite
maintainer script.
