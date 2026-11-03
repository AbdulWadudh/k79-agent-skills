# k79 reminder hooks

These hooks only **add context**. They do not block tools, deny commands, or change permissions.

The reminder text lives in [`../K79.reminder.md`](../K79.reminder.md). Edit that file, not the hooks.

## Claude Code

Add this alongside any existing hooks in `~/.claude/settings.json` (user scope) or
`.claude/settings.json` (project scope):

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume|compact",
        "hooks": [
          {
            "type": "command",
            "command": "node \"$HOME/.agents/skills/k79-master-engineering/hooks/k79-reminder.mjs\""
          }
        ]
      }
    ]
  }
}
```

The `compact` matcher is the important one: it re-injects the reminder after context
compaction, which is where long sessions usually lose the rules.

On Windows, hooks may run under Git Bash (`$HOME` works) or PowerShell when Git Bash is not
installed. For PowerShell, use `$env:USERPROFILE` instead of `$HOME`.

## OpenCode

Copy [`opencode-reminder.js`](./opencode-reminder.js) to one of:

- `~/.config/opencode/plugins/` for every project
- `.opencode/plugins/` for a single project

OpenCode loads the plugin at startup. It re-injects the reminder when the session compacts.

## Verify

- Claude Code: run `/hooks` and confirm the `SessionStart` entry, then start a new session.
- OpenCode: start a session; the plugin loads without output. After compaction, the reminder
  appears in the continuation context.

If neither runs, `AGENTS.md` still carries the reminder at session start. The hooks are an
extra nudge, not a requirement.
