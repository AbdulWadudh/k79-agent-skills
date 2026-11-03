---
title: "Add a short reminder pack that survives context compaction"
date: "2026-11-03"
type: added
scope: "skills/k79-master-engineering/, README.md"
version: "0.4.0"
released: "2026-11-03"
breaking: false
highlight: true
---

## Why

The constitution is context, not enforcement. Two failure modes remained: long sessions lose the
rules after compaction, and a long always-on block gets skimmed. Adding more prose would make
both worse.

## What

- Added `K79.reminder.md`: a ten-line task-to-skill map with one finish line ("name the skill,
  the check, and the changelog entry").
- The bootstrap prompt now prepends the reminder before the full router block.
- Added optional reminder hooks: `SessionStart` for Claude Code with `startup|resume|compact`,
  and an OpenCode plugin that re-injects the reminder during compaction.
- The hooks only add context. They do not block tools, deny commands, or change permissions.
- Added a README section explaining the difference between a reminder and a guarantee.

## Verification

- `bun run validate` passes.
- `node skills/k79-master-engineering/hooks/k79-reminder.mjs` prints the reminder.
- `bun run changelog:check` passes.

## Notes

Reminders raise adherence; they do not guarantee it. If a rule later needs a guarantee, move it
to a check instead of adding more reminder text.
