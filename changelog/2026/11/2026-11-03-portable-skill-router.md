---
title: "Make the skill router portable across agents"
date: "2026-11-03"
type: changed
scope: "skills/k79-master-engineering/AGENTS.router.md, README.md"
version: "0.2.0"
released: "2026-11-03"
breaking: false
highlight: true
---

## Why

The router named skills as relative paths (`k79-spec-driven/SKILL.md`), which do not resolve
from a project root, and it assumed a single skills directory. Agents without a skill loader
fell back to a file read that could not succeed.

`AGENTS.md` is also not universal: Claude Code ignores it when a project `CLAUDE.md` exists,
Gemini CLI reads `GEMINI.md` by default, Aider reads `CONVENTIONS.md`, and Copilot's repo-wide
chat still prefers `.github/copilot-instructions.md`.

## What

- The router now resolves skills by name first, with an ordered list of absolute fallback
  roots: `<project>/.agents/skills`, `~/.agents/skills`, `~/.claude/skills`,
  `~/.config/opencode/skills`.
- Added a changelog trigger to the router and the master orchestrator.
- Added an agent compatibility table to the README covering OpenCode, Claude Code, Codex,
  Cursor, Windsurf, Cline, Copilot, Gemini CLI, and Aider.
- The bootstrap prompt now writes thin shims (`CLAUDE.md` with `@AGENTS.md`, `GEMINI.md`,
  `.github/copilot-instructions.md`, `.aider.conf.yml`) instead of duplicating the router
  body, and preserves every existing project-specific instruction.
- The router states plainly that instruction files are context, not enforcement.

## Verification

- `bun run validate` passes.
- Router paths checked against the installed global layout on Windows.
- Claude Code 2.1.316 confirmed to support direct `AGENTS.md` reads.

## Notes

Hard enforcement still needs hooks or CI. A markdown file marked `MANDATORY` remains a prompt.
