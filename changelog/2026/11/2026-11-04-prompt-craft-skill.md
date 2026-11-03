---
title: "Add k79-prompt-craft for turning vague requests into precise prompts"
date: "2026-11-04"
type: added
scope: "skills/k79-prompt-craft, skills/k79-conductor, README.md, AGENTS.md"
version: ""
released: ""
breaking: false
highlight: true
---

## Why

Vague requests make agents guess the outcome, scope, and success criteria. The suite had strong
rules for executing work but no skill for turning an ambiguous ask into a prompt that another
agent can execute without follow-up questions.

## What

- Added `k79-prompt-craft` with two modes: continuation and new request.
- Added a mandatory goal-agreement gate: interview one question at a time, read the goal and
  success criteria back, and continue until the user confirms them.
- Added evidence gathering (branch, diff, failing output), a scope challenge, and a target-agent
  question.
- Added a prompt template with role, session bootstrap, objective, context, in/out scope, file
  scope, requirements, observable acceptance criteria, constraints, assumptions, stop conditions,
  verification, and first action.
- Added a cold-read test, real-command rule, context budget, untrusted-content rule, and secret
  redaction.
- Routed prompt tasks from `K79.reminder.md` and added a prompt-task entry point to the conductor.
- Updated the README skill table, counts, and tree.

## Verification

- `bun run validate` passes with 9 skills.
- `bun run skills` lists `k79-prompt-craft`.
- A vague request produces a goal statement, an interview, and one self-contained prompt.
- `bun run release-notes:check` and `bun run agents:check` pass.

## Notes

The suite now has 1 conductor and 8 domain skills. The goal-agreement gate has no arbitrary
question cap; it stops when both sides agree the goal is unambiguous.
