---
title: "Make the bootstrap install explicitly agent-agnostic"
date: "2026-11-03"
type: changed
scope: "README.md, release-notes/v0.4.0.md"
version: ""
released: ""
breaking: false
highlight: false
---

## Why

The bootstrap prompt and the v0.4.0 release notes still read as if the suite targets OpenCode
and Claude Code. The install command was agent-agnostic, but the surrounding text was not, and
the optional reminder hooks looked like a two-agent target list.

## What

- Added the `--agent '*'` explanation, the per-agent narrowing examples, and the update note to
  the bootstrap prompt.
- Clarified that `AGENTS.md` covers every agent and the hooks are an optional extra for harnesses
  with hook APIs.
- Refreshed the v0.4.0 release notes from the current config so the published page shows the
  same command.

## Verification

- The bootstrap block, install section, and release notes all show
  `bunx skills@latest add AbdulWadudh/k79-agent-skills -g --agent '*' -y`.
- `bun run validate` and `bun run changelog:check` pass.

## Notes

Documentation only. No skill file changed, so no new suite version is required.
