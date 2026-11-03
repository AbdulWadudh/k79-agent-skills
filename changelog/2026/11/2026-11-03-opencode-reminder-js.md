---
title: "Ship the OpenCode reminder as plain JavaScript"
date: "2026-11-03"
type: fixed
scope: "skills/k79-master-engineering/hooks/"
version: ""
released: ""
breaking: false
highlight: false
---

## Why

The OpenCode reminder was shipped as `.ts`. Without `@types/node` in the config folder, editors
reported `TS2591` for every `node:` import and `TS7006` for the two implicit-any parameters.
Installing type packages into `~/.config/opencode` just to satisfy a 25-line plugin is the wrong
trade.

## What

- Renamed `opencode-reminder.ts` to `opencode-reminder.js`; OpenCode loads both.
- Updated the hook README and replaced the installed plugin.
- Kept the plugin behavior identical: push the reminder into the compaction context.

## Verification

- `bun -e "import('file:///.../k79-reminder.js')"` resolves and exports `K79Reminder`.
- OpenCode loads the plugin from `~/.config/opencode/plugins/`.
- No TypeScript diagnostics apply to a `.js` file.

## Notes

If you prefer TypeScript, add `@types/node` and `@opencode-ai/plugin` to the config folder, then
type the parameters as `unknown` and `{ context: string[] }`.
