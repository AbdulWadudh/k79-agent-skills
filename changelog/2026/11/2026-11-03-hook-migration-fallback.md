---
title: "Keep the old skill path as a reminder fallback"
date: "2026-11-03"
type: fixed
scope: "skills/k79-conductor/hooks/"
version: "1.0.1"
released: "2026-11-03"
breaking: false
highlight: false
---

## Why

The 1.0.0 rename note promised that the reminder hooks would still find an in-progress install
under the old path. The shipped hook lookup only used `k79-conductor`, so the promise was not
kept.

## What

- The Claude Code reminder now checks `k79-conductor` first, then `k79-master-engineering`.
- The OpenCode compaction plugin checks the same two paths.
- The fallback is temporary; it can be removed after the migration window.

## Verification

- `node skills/k79-conductor/hooks/k79-reminder.mjs` prints the reminder.
- Removing the conductor directory still resolves through the fallback.
- `bun run validate` and `bun run changelog:check` pass.

## Notes

The fallback does not install anything. It only helps a session whose skill directory is being
replaced during the 1.0.0 migration.
