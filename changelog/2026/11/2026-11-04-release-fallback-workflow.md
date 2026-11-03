---
title: "Add a tag-triggered fallback for publishing releases"
date: "2026-11-04"
type: added
scope: ".github/workflows/release.yml, scripts/release.mjs, README.md, skills/k79-logging-errors-git"
version: ""
released: ""
breaking: false
highlight: true
---

## Why

Local publishing with `gh` is the primary path, but `gh` can be missing or unauthenticated while
`git push` still works. A pushed tag alone does not create a GitHub Release, so the release page
would silently be missing.

## What

- Added `.github/workflows/release.yml`, triggered only by `v*.*.*` tag pushes.
- The workflow first checks whether the release exists. If the local `gh` publish already won,
  it skips. Otherwise it verifies the tag matches `VERSION`, checks the generated notes file,
  and publishes it.
- The publish step tolerates a concurrent create: if the release appears during the run, the
  workflow exits successfully.
- `release.mjs` now treats a local publish failure as non-fatal: the tag is already pushed, and
  the fallback workflow can finish the job. It prints the manual command when Actions is
  disabled.
- Documented the primary/fallback order in the README and the logging skill.

## Verification

- A local release with an authenticated `gh` publishes immediately.
- The tag-triggered workflow sees the existing release and skips.
- With `gh` unavailable, the tag push still triggers the workflow, which publishes from
  `release-notes/vX.Y.Z.md`.
- `bun run validate`, `bun run release-notes:check`, and `bun run agents:check` pass.

## Notes

The workflow is a fallback, not the primary release path. It never regenerates notes and never
rewrites an existing release.
