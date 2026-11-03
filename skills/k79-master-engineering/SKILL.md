---
name: k79-master-engineering
description: Master orchestrator and workflow router that coordinates the 7 modular k79 engineering skills across Planning, Universal Code Structure & Naming, Evidence & Simplicity, Config/Security, DB/Performance, Testing, and Git, Changelogs & Releases. Also load when the user says "update k79-agent-skills" to compare the installed suite version against the latest release and update after explicit approval.
license: MIT
metadata:
  version: "0.1.0"
  source: "AbdulWadudh/k79-agent-skills"
---

# Master Engineering Workflow & Skill Orchestrator (k79 Suite)

Follow this strict sequential lifecycle for every task. Load the required modular skill(s) **by name** with your skill tool before executing each phase. If your agent has no skill loader, read `SKILL.md` from the first existing directory: `<project>/.agents/skills/`, `~/.agents/skills/`, `~/.claude/skills/`, or `~/.config/opencode/skills/`.

> **Suite version:** see `VERSION` next to this file (also `metadata.version` above).

## Phase 0: Suite Update (Only on "update k79-agent-skills")
- **Trigger:** The user says **"update k79-agent-skills"**, asks whether the suite is current, or asks to install the latest version.
- **Current version:** Read `VERSION` in this skill's installed directory (fallback: `metadata.version` above).
- **Latest version:** Run `gh api repos/AbdulWadudh/k79-agent-skills/releases/latest --jq .tag_name` and strip the leading `v`. Fallbacks, in order:
  1. `curl -fsSL https://raw.githubusercontent.com/AbdulWadudh/k79-agent-skills/main/VERSION`
  2. `git ls-remote --tags --refs https://github.com/AbdulWadudh/k79-agent-skills.git` (highest semver tag)
- **If versions match:** Report "already on the latest suite version" and stop. Do not reinstall unless the user explicitly asks to repair/force-sync.
- **If a newer version exists:** Show the current version, latest version, and release notes (`gh release view v<latest> --json name,body` or the matching `CHANGELOG.md` section). **STOP and wait for explicit approval.**
- **On approval:** Reinstall the global suite (this also adds any new skills and refreshes agent links):
  ```bash
  bunx skills@latest add AbdulWadudh/k79-agent-skills -g -a opencode -a claude-code -y
  ```
  If the user does not use Claude Code, drop `-a claude-code`. If symlinking fails on Windows, append `--copy`. Use `npx skills@latest` instead of `bunx skills@latest` when Bun is unavailable. To update only the already-installed skills instead, run `bunx skills@latest update k79-master-engineering k79-spec-driven k79-code-structure k79-evidence-and-simplicity k79-config-and-security k79-performance-and-db k79-verification-testing k79-logging-errors-git -g -y`.
- **After updating:** Verify the installed `VERSION` equals the latest version, then re-sync the router block in the project's `AGENTS.md` from `k79-master-engineering/AGENTS.router.md` without deleting project-specific content. Report the version delta.
- **Never** update or delete skills the user did not ask about, and never update without approval.

## Phase 1: Specification & Blast-Radius Lock (Before Coding)
- **Load:** `k79-spec-driven/SKILL.md`
- **Action:** For any new feature or contract/logic change, update `<feature>.spec.md` (or `specs/<use-case>.spec.md`) with Goals, I/O Contracts, Acceptance Criteria, and File Scope Lock. **STOP and wait for user approval** before editing source code. Check existing specs for `// @quirk:` protections.

## Phase 2: Architecture, Naming, Config & Implementation (During Coding)
Load only the skills matching the files you are touching:
- **Always Load for Coding/Debugging:** `k79-evidence-and-simplicity/SKILL.md`
  - Enforce zero assumptions (verify types/schemas first), Rule of 2+ DRY extraction (`call<Provider>Api`), zero speculative overengineering (YAGNI), and the **2-strike debugging circuit breaker**.
- **Always Load When Creating, Naming, Splitting, or Refactoring Files (Any Language):** `k79-code-structure/SKILL.md`
  - Enforce ≤250 lines/file (300 max), ≤8 files/folder, strict backend (`actions/`, `helpers/`, `queries`, `api`) and frontend (`components/`, `hooks/`, `helpers/`) separation, one-way DAG imports, strict naming conventions (verb-first functions, `is/has/can/should` booleans, explicit unit suffixes, zero vague names like `data`/`res`/`temp`), and compiler-guided refactoring.
- **If Touching Constants, Env, Auth, or Payments:** Load `k79-config-and-security/SKILL.md`
  - Enforce the 3-Tier Config Law, `src/config/index` (client-safe) vs `env`/`paths` (server-only) isolation, zero `??` call-site fallbacks, and user-scoped cache/auth security.
- **If Touching DB, External APIs, Redis, or Frontend UI:** Load `k79-performance-and-db/SKILL.md`
  - Enforce explicit column selection (no `SELECT *`), zero N+1 loop queries, cursor pagination, DB transactions, `Promise.all`, `AbortSignal.timeout()`, and UI debounce/lazy-loading rules.
- **If Handling Errors or Adding Logs:** Load `k79-logging-errors-git/SKILL.md`
  - Throw with context in leaf files; catch and log **once** at the orchestrator/boundary using the shared structured logger.

## Phase 3: Adversarial Verification (Before Claiming "Done")
- **Load:** `k79-verification-testing/SKILL.md`
- **Action:** Run the language's static type/compile checker and targeted tests in top-level `tests/` (mirroring `src/`). Enforce zero mocks for `helpers/` and a **1:2 happy-to-breaking** test ratio. Check off `- [x]` in `<feature>.spec.md`.

## Phase 4: On-Demand Logical Git Commits (Only When Asked)
- **Load:** `k79-logging-errors-git/SKILL.md`
- **Action:** Add or update one changelog entry per logical change under `changelog/YYYY/MM/`, then run the changelog generator so `CHANGELOG.md` and any release notes are derived from those entries. Stage files logically by concern (`git add <files>`, never bulk `git add .`), write the `Why / What / Verification` commit body, and include **zero** AI/agent co-author tags.