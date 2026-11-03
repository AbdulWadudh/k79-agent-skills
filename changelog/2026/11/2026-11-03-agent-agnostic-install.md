---
title: "Use an agent-agnostic install command and document updates"
date: "2026-11-03"
type: changed
scope: "changelog.config.json, README.md, skills/k79-master-engineering"
version: ""
released: ""
breaking: false
highlight: true
---

## Why

The install line named OpenCode and Claude Code. Anyone using another agent had to edit the
command before it worked, and the release notes repeated the same limitation. The update path
was also implicit: it was not clear whether re-running `add` or running `update` was required.

## What

- Changed the canonical install command to
  `bunx skills@latest add AbdulWadudh/k79-agent-skills -g --agent '*' -y`.
- Added the per-agent form (`-a opencode`, `-a claude-code`) and the `--all` shorthand as
  optional alternatives, not the default.
- Documented that re-running `add` updates in place because it reads the latest default branch,
  and kept `skills update -g -y` as the hash-based alternative.
- Updated the bootstrap prompt, Phase 0, the router, and the release-note config so every copy
  of the command matches.

## Verification

- `bun run validate` passes.
- `bun run changelog:check` passes.
- Generated release notes show the agent-agnostic command and the update guidance.

## Notes

`skills add` follows the default branch, not a tag. The installed `VERSION` still tells you
which release the files correspond to.
