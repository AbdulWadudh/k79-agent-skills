---
title: "Ship the changelog generator with the skill so other projects can adopt it"
date: "2026-11-03"
type: added
scope: "skills/k79-logging-errors-git/scripts/changelog.mjs, changelog.config.json, README.md"
version: ""
released: ""
breaking: false
highlight: true
---

## Why

The changelog rules were installed globally, but the generator was not: only `SKILL.md` reached
other projects. Agents were told to "create a generator" with no reference implementation, and
this repository's script hard-coded its own GitHub URL and skill count.

## What

- Moved the canonical generator into `k79-logging-errors-git/scripts/changelog.mjs`, so the
  `skills` CLI installs it with the skill.
- Made it project-agnostic: repository URL comes from `changelog.config.json` or the `origin`
  remote, license and verification come from config, and install/update sections are omitted
  when not configured.
- Added `--init`, which creates `changelog/`, `changelog/TEMPLATE.md`, `CHANGELOG.md`, and
  `release-notes/` in any repository.
- Kept `scripts/changelog.mjs` in this repository as a thin wrapper over the skill copy, so the
  two cannot drift.
- The bootstrap prompt now copies the generator into a project and wires the package scripts.

## Verification

- Fresh temp repository: `--init`, add one entry, generate, stamp, and release all succeed.
- This repository: `bun run changelog:check` and `node scripts/changelog.mjs --check` pass.
- `changelog.config.json` supplies this repo's install and update text.

## Notes

The generator is dependency-free and works under Node 22+ or Bun. It does not publish a package.
