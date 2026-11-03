---
title: "Remove duplicated routing from AGENTS.md and add a sync check"
date: "2026-11-03"
type: changed
scope: "AGENTS.md, skills/k79-conductor, scripts/sync-agents.mjs, README.md"
version: "1.1.0"
released: "2026-11-03"
breaking: false
highlight: true
---

## Why

The generated `AGENTS.md` contained the same seven task-to-skill mappings twice: once in
`K79.reminder.md` and again in `AGENTS.router.md`. It was also unclear whether
`AGENTS.router.md` was read at runtime. The manual "re-sync this block" instruction had no way
to prove the block still matched.

## What

- `K79.reminder.md` is now the only routing list in `AGENTS.md`.
- The router block's seven-item trigger list is replaced with one line: load `k79-conductor`
  first; it owns phase order and routes to the seven domain skills.
- The router block is wrapped in `<!-- k79:router:start -->` and `<!-- k79:router:end -->`.
- Added `sync-agents.mjs`: `--check` fails on drift, `--sync` replaces only the marked block.
- Added `agents:check` and `agents:sync` scripts, a CI step, and a pre-release check.
- Added an artifact-role table to the README. `AGENTS.router.md` is documented as the canonical
  template, not a shim and not read at runtime.
- Added a dogfooded `AGENTS.md` at the repo root with the reminder, marked block, and project
  context.

## Verification

- `bun run agents:check` passes.
- Editing one line inside the block makes `--check` fail with the first differing line.
- `--sync` restores the block and preserves the Project Context section outside the markers.
- `bun run validate` and `bun run changelog:check` pass.

## Migration

Existing projects keep working with the old block. To adopt the new format, re-run the
bootstrap prompt or add the markers manually, replace the block with
`k79-conductor/AGENTS.router.md`, remove the duplicate trigger list, then run
`node scripts/sync-agents.mjs --check`.

## Notes

`AGENTS.router.md` is still required. Do not delete it: it is the source the sync script reads.
