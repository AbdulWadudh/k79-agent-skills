---
title: "Ask for install scope instead of defaulting to global"
date: "2026-11-03"
type: changed
scope: "README.md, skills/k79-conductor, changelog.config.json"
version: "1.0.0"
released: "2026-11-03"
breaking: false
highlight: true
---

## Why

The setup only showed a global install. Global is wrong when a repository needs a pinned,
reproducible version that teammates and CI share, and it silently changes every project on the
machine at once. Project scope already existed but was presented as an afterthought.

## What

- The bootstrap prompt now asks for global or project scope and refuses to install before the
  answer.
- The README presents both scopes as equals, with the trade-offs and the commands side by side.
- Phase 0 and the router detect the installed scope (project first, then global) and update the
  same one.
- The release-note install block shows both commands; the update block points at the chosen
  scope.
- Project installs leave `~/.agents/skills/` untouched and can be committed.

## Verification

- `bun run validate` passes.
- `bun run changelog:check` passes.
- The bootstrap block contains both commands and the "ask before installing" line.

## Notes

When both scopes exist, the project copy wins because it is first in the router's resolution
order.
