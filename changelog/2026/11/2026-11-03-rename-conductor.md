---
title: "Rename the orchestrator to k79-conductor"
date: "2026-11-03"
type: changed
scope: "skills/, scripts/, README.md"
version: ""
released: ""
breaking: true
highlight: true
---

## Why

"Master" implies ownership and carries a hierarchy the skill does not have. The skill coordinates
the domain skills; it does not own the work or the user.

## What

- Renamed `skills/k79-master-engineering` to `skills/k79-conductor`.
- Updated the frontmatter name, title, description, Phase 0, router, reminder paths, README,
  validation script, release script, and hook paths.
- Kept the old skill directory in the hook lookup as a fallback so an in-progress install still
  finds the reminder.
- Added the conductor name to the skill-resolution order everywhere.

## Migration

Remove the old skill, install the new suite, then re-run the project bootstrap so `AGENTS.md`
points at `k79-conductor`.

```bash
# Global
bunx skills@latest remove k79-master-engineering -g -y
bunx skills@latest add AbdulWadudh/k79-agent-skills -g --agent '*' -y

# Project (from the repo root)
bunx skills@latest remove k79-master-engineering -y
bunx skills@latest add AbdulWadudh/k79-agent-skills --agent '*' -y
```

The old name remains only in historical changelog and release-note files. Do not rewrite those;
they record what shipped at the time.

## Verification

- `bun run validate` passes with 8 skills, all frontmatter names matching their directories.
- `bun run changelog:check` passes.
- `bunx skills@latest add AbdulWadudh/k79-agent-skills --list` lists `k79-conductor`.
- After migrating, `VERSION` is `1.0.0` and the old directory is gone.

## Notes

This is the 1.0.0 release because the skill identifier changes. Installed copies are not
auto-migrated: the old name has to be removed once.
