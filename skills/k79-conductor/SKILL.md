---
name: k79-conductor
description: Conductor and workflow router that coordinates the 8 modular k79 engineering skills across Planning, Universal Code Structure & Naming, Evidence & Simplicity, Config/Security, DB/Performance, Testing, Prompt Craft, and Git, Changelogs & Releases. Also load when the user says "update k79-agent-skills" to compare the installed suite version against the latest release and update after explicit approval.
license: MIT
metadata:
  version: "2.4.5"
  source: "AbdulWadudh/k79-agent-skills"
---

# Engineering Workflow & Skill Conductor (k79 Suite)

Follow this strict sequential lifecycle for every task. Load the required modular skill(s) **by name** with your skill tool before executing each phase. If your agent has no skill loader, read `SKILL.md` from the first existing directory: `<project>/.agents/skills/`, `~/.agents/skills/`, `~/.claude/skills/`, or `~/.config/opencode/skills/`.

> **Suite version:** see `VERSION` next to this file (also `metadata.version` above).

## Phase 0: Suite Update (Only on "update k79-agent-skills")
- **Scope:** Check `<project>/.agents/skills/k79-conductor` first, then `~/.agents/skills/k79-conductor`. If both exist, update the project copy.
- **Current version:** Read `VERSION` from the installed scope (fallback: `metadata.version` above).
- **Latest version:** Run `gh api repos/AbdulWadudh/k79-agent-skills/releases/latest --jq .tag_name`. Fallback: `curl -fsSL https://raw.githubusercontent.com/AbdulWadudh/k79-agent-skills/main/VERSION`.
- **Same version:** Report "already on the latest suite version" and stop.
- **Newer version:** Show the current version, latest version, and release notes. **STOP for explicit approval.**
- **On approval:** Reinstall the same scope. Project (from the repo root): `bunx skills@latest add AbdulWadudh/k79-agent-skills -y`. Global: add `-g`. Verify `VERSION`, then run `node scripts/sync-agents.mjs --sync` and `--check` so the marked `AGENTS.md` block matches without deleting project content.
- **Never** update without approval or touch unrelated skills.

## Prompt Tasks (Any Time)
If the request is to write a prompt, task brief, or handoff, load `k79-prompt-craft`, run its goal-agreement interview, and do not start coding. After it emits the prompt, ask whether to take it as input and continue this session.

## Phase 1: Specification & Blast-Radius Lock (Before Coding)
- **Load:** `k79-spec-driven`
- **Action:** For any new feature or contract/logic change, update `<feature>.spec.md` (or `specs/<use-case>.spec.md`) with Goals, I/O Contracts, Acceptance Criteria, and File Scope Lock. **STOP and wait for user approval** before editing source code. Check existing specs for `// @quirk:` protections.

## Phase 2: Architecture, Naming, Config & Implementation (During Coding)
Load only the skills matching the files you are touching:
- **Always Load for Coding/Debugging:** `k79-evidence-and-simplicity`
  - Enforce zero assumptions (verify types/schemas first), Rule of 2+ DRY extraction (`call<Provider>Api`), zero speculative overengineering (YAGNI), and the **2-strike debugging circuit breaker**.
- **Always Load When Creating, Naming, Splitting, or Refactoring Files (Any Language):** `k79-code-structure`
  - Enforce ≤250 lines/file (300 max), ≤8 files/folder, strict backend (`actions/`, `helpers/`, `queries`, `api`) and frontend (`components/`, `hooks/`, `helpers/`) separation, one-way DAG imports, strict naming conventions (verb-first functions, `is/has/can/should` booleans, explicit unit suffixes, zero vague names like `data`/`res`/`temp`), and compiler-guided refactoring.
- **If Touching Constants, Env, Auth, or Payments:** Load `k79-config-and-security`
  - Enforce the 3-Tier Config Law, `src/config/index` (client-safe) vs `env`/`paths` (server-only) isolation, zero `??` call-site fallbacks, and user-scoped cache/auth security.
- **If Touching DB, External APIs, Redis, or Frontend UI:** Load `k79-performance-and-db`
  - Enforce explicit column selection (no `SELECT *`), zero N+1 loop queries, cursor pagination, DB transactions, `Promise.all`, `AbortSignal.timeout()`, and UI debounce/lazy-loading rules.
- **If Handling Errors, Adding Logs, Committing, or Releasing:** Load `k79-logging-errors-git`
  - Throw with context in leaf files; catch and log **once** at the orchestrator/boundary using the shared structured logger.

## Phase 3: Adversarial Verification (Before Claiming "Done")
- **Load:** `k79-verification-testing`
- **Action:** Run the language's static type/compile checker and targeted tests in top-level `tests/` (mirroring `src/`). Enforce zero mocks for `helpers/` and a **1:2 happy-to-breaking** test ratio. Check off `- [x]` in `<feature>.spec.md`.

## Phase 4: On-Demand Logical Git Commits (Only When Asked)
- **Load:** `k79-logging-errors-git`
- **Action:** Add or update one changelog entry per logical change under `changelog/YYYY/MM/`, then run the release-notes generator so the notes are derived from the entry diff. There is no `CHANGELOG.md`. Stage files logically by concern (`git add <files>`, never bulk `git add .`), write the `Why / What / Verification` commit body, and include **zero** AI/agent co-author tags.