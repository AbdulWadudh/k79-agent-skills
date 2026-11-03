---
title: "Remove CHANGELOG.md and generate release notes from entry diffs"
date: "2026-11-04"
type: changed
scope: "scripts/, changelog/, release-notes/, skills/, README.md, AGENTS.md, CI"
version: ""
released: ""
breaking: true
highlight: true
---

## Why

`CHANGELOG.md` duplicated the changelog ledger. It had to be regenerated and validated separately, it drifted from the entries, and it made the release flow depend on a generated file that consumers had to keep in sync. Release notes should be derived from what changed since the previous release, not from a second aggregate.

## What

- Removed `CHANGELOG.md` and every generation, validation, and documentation reference.
- Added `scripts/release-notes.mjs`, with `--version`, `--check`, `--dry-run`, and `--baseline`.
- The generator selects entries from the diff since the latest tag, or from `release-notes/.last-release.json` when no tag exists.
- Released entries are append-only: modified or deleted entries fail the check.
- `release-notes/.last-release.json` records the path and SHA-256 of every covered entry and is written only after the release note succeeds.
- `release.mjs` now stamps entries, generates notes from the diff, updates the manifest, then bumps, commits, tags, and pushes.
- The generator ships inside `k79-logging-errors-git` and is copied into projects; `changelog.mjs` is gone.
- Updated the conductor, router, logging skill, README, AGENTS.md, package scripts, and CI.

## Verification

- `bun run validate` passes.
- `bun run release-notes:check` passes on a clean tree and fails on a modified released entry.
- `bun run release-notes --dry-run --version 2.0.0` lists only entries since `v1.1.0`.
- Running the generator twice does not duplicate entries.
- A test release writes `release-notes/vX.Y.Z.md` and updates `.last-release.json`.
- `bun run agents:check` passes.

## Migration

In each project that used the old generator:

1. Delete `CHANGELOG.md`; the changelog entries are the only source.
2. Replace `scripts/changelog.mjs` with `scripts/release-notes.mjs` from the installed `k79-logging-errors-git` skill.
3. Remove `changelog` and `changelog:check` package scripts; add `release-notes` and `release-notes:check`.
4. Replace the `changelog:check` CI step with `release-notes:check`.
5. Run `node scripts/release-notes.mjs --baseline <previous-release-ref> --version <next-version>` once if the project has no tags and no manifest; otherwise the latest tag is the boundary.
6. Run `node scripts/release-notes.mjs --check` and commit the generated `release-notes/vX.Y.Z.md` with `.last-release.json`.

History is not rewritten: existing release notes and changelog entries stay in place.
