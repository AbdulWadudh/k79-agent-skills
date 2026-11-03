---
title: "Make project-local install the default and drop agent selection"
date: "2026-11-03"
type: changed
scope: "README.md, changelog.config.json, skills/k79-conductor"
version: ""
released: ""
breaking: false
highlight: true
---

## Why

The default install required `--agent '*'`, which selected every supported agent and created
per-agent mirrors the user never asked for: `.claude/skills/`, `agent/skills/`, and
`skills-lock.json`. The intent was a local copy in `<repo>/.agents/skills/`, not a machine-wide
or every-agent installation.

## What

- The documented default is now `bunx skills@latest add AbdulWadudh/k79-agent-skills -y`.
- It creates exactly `.agents/skills/` and `skills-lock.json`; no `.claude/skills/`, no
  `agent/skills/`, and no agent-selection prompt.
- Global (`-g`) and per-agent (`-a <agent>` / `--agent '*'`) installs moved to an advanced
  section with the exact output of each.
- The bootstrap prompt installs project-local and never asks the user to choose agents.
- The update protocol reinstalls the same scope with `-y` or `-g`, not `--agent '*'`.
- The release-note install block shows the local command first.

## Verification

- Fresh temp project: `add ... -y` produced only `.agents/skills/` and `skills-lock.json`.
- Fresh temp project: `add ... --agent '*' -y` produced `.agents/skills/`, `.claude/skills/`,
  `agent/skills/`, and `skills-lock.json`.
- `bun run validate` and `bun run changelog:check` pass.

## Notes

Existing global installs keep working. They are no longer the documented default.
