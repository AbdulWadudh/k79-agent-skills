## Engineering Constitution & Skill Router (MANDATORY)

You are strictly bound by our modular `k79-*` engineering skills.

**Resolving a skill:** load it by name with your skill tool first (for example the `k79-spec-driven` skill). If your agent has no skill loader, read `SKILL.md` from the first directory that exists:
1. `.agents/skills/` in the project
2. `~/.agents/skills/`
3. `~/.claude/skills/`
4. `~/.config/opencode/skills/`

1. **Master Workflow Entrypoint:** Load `k79-master-engineering` first, or the specific domain skill(s) triggered by the task at hand:
   - **Planning, Features & `@quirk` Workarounds:** `k79-spec-driven`
   - **Creating/Splitting Files (>220L), Naming Conventions & Imports (Any Language):** `k79-code-structure`
   - **Debugging, Exploring & Extracting Shared Logic:** `k79-evidence-and-simplicity`
   - **Env Vars, `src/config/`, Auth & Caching Keys:** `k79-config-and-security`
   - **DB Queries, Migrations, APIs, Redis & UI Speed:** `k79-performance-and-db`
   - **Writing Tests & Verifying Completion:** `k79-verification-testing`
   - **Error Handling, Logging, Git Commits & Changelogs:** `k79-logging-errors-git`

2. **Core Non-Negotiables (Always Active):**
   - **Spec First:** For any new feature or contract/logic change, create/update `<feature>.spec.md` and **STOP for user approval** before editing source code. Never remove `@quirk:` code without checking the spec.
   - **Hard Size Caps & Naming:** Max **250 lines/file** (300 hard ceiling). Max **8 files/folder**. Zero feature barrel files (except client-safe `src/config/index`). Use verb-first functions, `is/has/can/should` booleans, explicit unit suffixes (`timeoutMs`), and zero vague names (`data`, `res`, `temp`).
   - **Evidence & Simplicity:** Zero unverified assumptions. Deduplicate repeated boilerplate (Rule of 2+), forbid speculative overengineering (YAGNI). Stop after **2 failed fix attempts**, revert guesses, and report back with proof.
   - **Verification & Commits:** Mirror tests in top-level `tests/` (`1:2` happy-to-breaking ratio, zero mocks for `helpers/`). Only commit when explicitly asked, stage logically (`git add <files>`), and NEVER add `Co-authored-by` AI tags.
   - **Changelogs:** One entry per logical change under `changelog/YYYY/MM/`. `CHANGELOG.md` and `release-notes/` are generated from those entries, never hand-maintained.

3. **Self-Update Protocol ("update k79-agent-skills"):**
   - Read the installed version from the `k79-master-engineering` skill directory (`VERSION`; fallback: `metadata.version` in its `SKILL.md`).
   - Look up the latest release: `gh api repos/AbdulWadudh/k79-agent-skills/releases/latest --jq .tag_name`, or `curl -fsSL https://raw.githubusercontent.com/AbdulWadudh/k79-agent-skills/main/VERSION`.
   - If a newer version exists, show the current version, latest version, and changelog summary. **STOP for explicit approval before updating.**
   - On approval, run `bunx skills@latest add AbdulWadudh/k79-agent-skills -g -a opencode -a claude-code -y` (use `npx skills@latest` if Bun is unavailable; add `--copy` if Windows symlinks fail), verify the installed `VERSION`, and re-sync this router block from `k79-master-engineering/AGENTS.router.md` while preserving all project-specific sections below it.
   - Never update without approval and never touch unrelated skills.

4. **Instruction Files Are Context, Not Enforcement:** `AGENTS.md` (and its shims) guides the agent; it cannot block an action. If a rule must be guaranteed, back it with CI or an agent hook.
