---
title: "Initial public release of the k79 skill suite"
date: "2026-11-03"
type: added
scope: "skills/, scripts/, .github/workflows/, package metadata"
version: "0.1.0"
released: "2026-11-03"
breaking: false
---

## Why

The k79 rules existed as scattered notes and per-project copies. There was no install path,
no version marker, and no way for an agent to tell whether the rules it had were current.

## What

- Shipped `k79-master-engineering` plus seven domain skills, all namespaced with the `k79-`
  prefix so they cannot collide with unrelated skills in a global directory.
- Added `VERSION`, `metadata.version`, and package version markers so an agent can compare the
  installed suite against the latest release.
- Added the approval-gated `update k79-agent-skills` protocol.
- Added MIT licensing, a validator, a release script, and GitHub Actions for validation and
  tag-triggered releases.
- Fixed all frontmatter names so they match their `k79-*` directories.

## Verification

- `bun run validate` and `node scripts/validate-skills.mjs` pass for all eight skills.
- `npx skills@latest add AbdulWadudh/k79-agent-skills --list` lists eight namespaced skills.
- Global install verified on Windows: OpenCode reads `~/.agents/skills`; Claude Code and
  Command Code receive junctions.
- GitHub Release `v0.1.0` published by CI.
