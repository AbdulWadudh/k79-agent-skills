---
title: "Publish releases locally instead of through GitHub Actions"
date: "2026-11-04"
type: changed
scope: ".github/workflows/, scripts/release.mjs, README.md, skills/"
version: "2.1.0"
released: "2026-11-03"
breaking: false
highlight: true
---

## Why

The repository carried two GitHub Actions workflows for validation and release publishing. That
hid part of the release flow behind GitHub and made the agent depend on a remote runner. The
intended model is simpler: the agent runs the checks, cuts the tag, pushes, and publishes the
release locally with `gh`.

## What

- Removed `.github/workflows/validate.yml` and `.github/workflows/release.yml`; `.github/` is
  gone.
- `release.mjs` now publishes the GitHub Release itself with
  `gh release create --verify-tag --notes-file release-notes/vX.Y.Z.md`.
- If `gh` is missing or unauthenticated, the script prints the exact command to run after the
  push.
- `--no-push` skips both the push and the publish.
- Updated the README, conductor, router, and logging skill so checks are described as
  agent-run, not CI-run.

## Verification

- `.github/workflows/` does not exist.
- `bun run validate`, `bun run release-notes:check`, and `bun run agents:check` pass.
- `bun run release patch --dry-run` still prints the plan without pushing or publishing.
- A real release pushes the tag and publishes the GitHub Release in the same command.

## Notes

Validation is still mandatory; it is now enforced by the release command and the agent's
pre-commit checks rather than a hosted runner.
