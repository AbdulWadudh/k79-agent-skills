---
title: "Add a handoff question after prompt generation"
date: "2026-11-04"
type: changed
scope: "skills/k79-prompt-craft, skills/k79-conductor, README.md"
version: ""
released: ""
breaking: false
highlight: false
---

## Why

`k79-prompt-craft` produced a prompt and then stopped. In a new session the user often wants to
use that prompt immediately, but the agent had no instruction to offer that, so the session sat
idle or the user had to restate the task.

## What

- After emitting the fenced prompt, the skill now asks exactly one question:
  "Should I take this prompt as input and continue this session?"
- On **yes**, it adopts the prompt as the active task, loads `k79-conductor` if installed, and
  starts at the prompt's `First action` without repeating the interview.
- On **no**, it stops and leaves the prompt for copying.
- If the prompt targets another agent, it asks whether to adapt it for this session or leave it
  for that agent.
- The handoff question is mandatory in a new session.
- Updated the conductor's prompt-task entry point and the README table.

## Verification

- `bun run validate` passes with 9 skills.
- The skill's output section emits one fenced block plus the single handoff question.
- `bun run release-notes:check` and `bun run agents:check` pass.

## Notes

The handoff question is outside the fenced prompt block. No other commentary is added.
