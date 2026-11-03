---
title: "Trim the suite update protocol to its essentials"
date: "2026-11-03"
type: changed
scope: "skills/k79-master-engineering/SKILL.md, skills/k79-master-engineering/AGENTS.router.md"
version: ""
released: ""
breaking: false
highlight: false
---

## Why

Phase 0 spent fourteen lines on one operation. It listed three fallback lookups, per-agent
install variations, an alternative update command, and a re-sync instruction. The router
repeated the same protocol, so an agent read it twice and could follow two different versions.

## What

- Reduced Phase 0 to six bullets: current, latest, same, newer, approval, never.
- Kept one fallback lookup and moved install variations into one parenthetical.
- Reduced the router's update block to four bullets and let it point at the release, not at a
  duplicated command sequence.
- Replaced the remaining `k79-*/SKILL.md` path references in the master skill with skill names,
  and validation now checks every backticked `k79-*` name instead of only file paths.

## Verification

- `bun run validate` passes.
- The router and Phase 0 describe the same approval gate and reinstall command.

## Notes

The README still holds the long-form user documentation, which is the right place for install
variants and manual commands.
