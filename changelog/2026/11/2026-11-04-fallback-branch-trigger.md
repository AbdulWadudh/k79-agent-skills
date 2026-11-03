---
title: "Trigger the release fallback only when local gh fails"
date: "2026-11-04"
type: changed
scope: ".github/workflows/release.yml, scripts/release.mjs, README.md, skills/k79-logging-errors-git"
version: "2.3.0"
released: "2026-11-03"
breaking: false
highlight: true
---

## Why

The fallback workflow was triggered by every version tag, so it always ran and could race the
local `gh` publish. The intent is the opposite: when `gh` is configured, the workflow should not
run at all. A `push` trigger cannot be conditioned on local tooling, so the trigger itself had to
change.

## What

- The workflow now triggers only on pushes to `k79-release-fallback/**`, not on version tags.
- `release.mjs` pushes a `k79-release-fallback/vX.Y.Z` branch only after a local publish fails or
  `gh` is missing.
- The workflow reads `VERSION`, verifies the matching tag, publishes from the generated notes,
  and deletes the fallback branch.
- A successful local publish never pushes the branch, so the workflow never starts.
- Removed the 15-second head start; there is no race left.

## Verification

- A release with an authenticated `gh` publishes locally and triggers no workflow run.
- Pushing a fallback branch for an existing release makes the workflow skip and delete the branch.
- A missing `gh` still produces a fallback branch push using the git credentials only.
- `bun run validate`, `bun run release-notes:check`, and `bun run agents:check` pass.

## Notes

If the fallback branch push itself fails, the script prints the exact `gh release create`
command. The workflow is never the primary publisher.
