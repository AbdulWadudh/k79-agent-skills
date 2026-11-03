# k79-agent-skills

## k79 — Reminder (read before every task)

- **Spec before code:** feature or contract change -> `k79-spec-driven`. Write the spec, then stop for approval.
- **Structure:** new file, split, rename, or refactor -> `k79-code-structure`. 250 lines, 8 files/folder, no barrels.
- **Evidence:** debug, explore, or deduplicate -> `k79-evidence-and-simplicity`. Prove it, Rule of 2+, stop after 2 failed attempts.
- **Security:** env, config, auth, payments -> `k79-config-and-security`.
- **Performance:** DB, API, cache, UI -> `k79-performance-and-db`.
- **Tests:** mirror `tests/`, 1:2 happy-to-breaking, no mocks in `helpers/` -> `k79-verification-testing`.
- **Git:** errors, logs, commit, or release -> `k79-logging-errors-git`.

Before saying "done": name the skill you loaded, the check you ran, and the changelog entry you added.

<!-- k79:router:start -->
## Engineering Constitution & Skill Router (MANDATORY)

> **Map:** the reminder at the top of this file is the only task-to-skill list. This block holds the resolution order, the non-negotiables, and the update protocol.

You are strictly bound by our modular `k79-*` engineering skills.

**Resolving a skill:** load it by name with your skill tool first (for example the `k79-spec-driven` skill). If your agent has no skill loader, read `SKILL.md` from the first directory that exists:
1. `.agents/skills/` in the project
2. `~/.agents/skills/`
3. `~/.claude/skills/`
4. `~/.config/opencode/skills/`

1. **Workflow Entrypoint:** Load `k79-conductor` first. It owns phase order, approval gates, and routes to the seven domain skills. Load a domain skill directly only when the task is already unambiguous.

2. **Core Non-Negotiables (Always Active):**
   - **Spec First:** For any new feature or contract/logic change, create/update `<feature>.spec.md` and **STOP for user approval** before editing source code. Never remove `@quirk:` code without checking the spec.
   - **Hard Size Caps & Naming:** Max **250 lines/file** (300 hard ceiling). Max **8 files/folder**. Zero feature barrel files (except client-safe `src/config/index`). Use verb-first functions, `is/has/can/should` booleans, explicit unit suffixes (`timeoutMs`), and zero vague names (`data`, `res`, `temp`).
   - **Evidence & Simplicity:** Zero unverified assumptions. Deduplicate repeated boilerplate (Rule of 2+), forbid speculative overengineering (YAGNI). Stop after **2 failed fix attempts**, revert guesses, and report back with proof.
   - **Verification & Commits:** Mirror tests in top-level `tests/` (`1:2` happy-to-breaking ratio, zero mocks for `helpers/`). Only commit when explicitly asked, stage logically (`git add <files>`), and NEVER add `Co-authored-by` AI tags.
   - **Changelogs:** One entry per logical change under `changelog/YYYY/MM/`. Release notes are generated from entry diffs; there is no `CHANGELOG.md`.

3. **Self-Update Protocol ("update k79-agent-skills"):**
   - Detect the installed scope: `<project>/.agents/skills` first, then `~/.agents/skills`.
   - Compare the installed `VERSION` with the latest GitHub Release.
   - Show current, latest, and the release notes. **STOP for explicit approval.**
   - On approval, reinstall the same scope: project `bunx skills@latest add AbdulWadudh/k79-agent-skills -y`; global add `-g`. Verify `VERSION`, then run `node scripts/sync-agents.mjs --sync` and `--check`.
   - Never update without approval or touch unrelated skills.

4. **Instruction Files Are Context, Not Enforcement:** `AGENTS.md` (and its shims) guides the agent; it cannot block an action. If a rule must be guaranteed, back it with a local check or an agent hook.
<!-- k79:router:end -->

## Project Context

- Bun-first; Node 22.20+ is the fallback.
- `bun run validate`, `bun run release-notes:check`, `bun run agents:check`.
- Skills live in `skills/`; one directory per skill.
- Changelog entries live in `changelog/YYYY/MM/`; release notes are generated from entry diffs, with no aggregate changelog file.
