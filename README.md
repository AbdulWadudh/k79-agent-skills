# k79-agent-skills — Engineering Skills Constitution

![Version](https://img.shields.io/github/v/tag/AbdulWadudh/k79-agent-skills?label=version)

A modular, language-agnostic, Spec-Driven engineering skill suite (`k79-*`) for AI coding agents (OpenCode, Claude Code, Cursor, Cline, Windsurf, Codex, and other agents supported by the [`skills`](https://github.com/vercel-labs/skills) CLI).

Current suite version: see [`VERSION`](./VERSION).

---

## One-Paste Project Bootstrap Prompt

Copy this into your coding agent inside **any new or existing project repository**:

```text
Bootstrap and align this project with my Engineering Skills repository (AbdulWadudh/k79-agent-skills):

1. Install or Update Global Skills:
   - Run `bunx skills@latest add AbdulWadudh/k79-agent-skills -g -a opencode -a claude-code -y`
     (use `npx skills@latest add ...` if Bun is unavailable; add `--copy` on Windows if linking fails).
   - Verify all 8 `k79-*` skills appear in `~/.agents/skills/`.
   - Report the installed suite version from `~/.agents/skills/k79-master-engineering/VERSION`.

2. Read the Constitution:
   - Load the `k79-master-engineering` skill, then read its `SKILL.md` and `AGENTS.router.md` from the installed skills directory.

3. Project Instruction Files (write once, shim everywhere):
   - PRIMARY: `AGENTS.md` at the repo root.
     - If NO `AGENTS.md` exists: create it starting with the contents of `k79-master-engineering/K79.reminder.md`, then the router block from `k79-master-engineering/AGENTS.router.md`, followed by a concise Project Context section (tech stack, package manager, build/typecheck/test commands, and key folder paths discovered from the repo).
     - If `AGENTS.md` ALREADY exists: PRESERVE 100% of all project-specific context, domain knowledge, custom commands, environment notes, and architectural quirks. MERGE the reminder and Skill Router block cleanly at the top, and align only the generic rules that directly contradict the constitution. Show me a summary of the changes.
   - SHIMS: never duplicate the router body. Add a pointer only where an agent does not read `AGENTS.md` directly:
     - Claude Code: if a `CLAUDE.md` or `CLAUDE.local.md` already exists in the project, prepend `@AGENTS.md` to it. Do not create `CLAUDE.md` when the repo has none - Claude Code reads `AGENTS.md` natively since v2.1.277.
     - Gemini CLI: if no `GEMINI.md` exists, create one containing `@AGENTS.md`.
     - GitHub Copilot: if `.github/copilot-instructions.md` exists, add a one-line pointer to `AGENTS.md`.
     - Aider: if `.aider.conf.yml` exists, add `read: AGENTS.md`.
   - OPTIONAL REMINDERS: install the hooks in `k79-master-engineering/hooks/README.md` (Claude Code `SessionStart`, OpenCode compaction). They only re-inject the reminder; they never block tools.
   - Note that instruction files are context, not enforcement. Do not claim a rule is guaranteed.

4. Changelog Tooling (only if the project has no changelog system):
   - Copy `scripts/changelog.mjs` from the installed `k79-logging-errors-git` skill to `<project>/scripts/changelog.mjs`.
   - Run `node scripts/changelog.mjs --init`, then add `changelog` and `changelog:check` package scripts and a CI check.
   - Do not overwrite or migrate an existing changelog system without asking.

5. Verify and report which instruction file each agent you use will load. Do not modify source code as part of this bootstrap.
```

---

## Why This Exists (Problems Solved)

Coding agents routinely fail in production codebases due to predictable LLM anti-patterns: context pollution, hallucinated requirements, 1,500-line God files, vague variable naming (`data`, `temp`), circular barrel imports, speculative overengineering, happy-path-only tests, and bulk Git commits.

This repository solves those failure modes through **1 Master Workflow Orchestrator** and **7 Modular Domain Skills**, all namespaced with `k79-` to prevent collisions in global skill directories:

| Skill | What Problem It Solves | Core Enforcement |
| :--- | :--- | :--- |
| **`k79-master-engineering`** | **Skill Sprawl & Attention Dilution:** Agents forget rules when dumped into one giant prompt. | Routes the agent through 4 strict phases (Spec -> Code -> Verify -> Commit), loading only the specific `k79-*` skills needed for the active task. Also owns the approval-gated suite update protocol. |
| **`k79-spec-driven`** | **Hallucinated Scope & Broken Workarounds:** Agents jump straight into coding, break contracts, touch unrelated files, or refactor away intentional hacks. | Enforces a pre-code `<feature>.spec.md` approval gate, locks the allowed file blast radius, scales specs >250L into `specs/`, and protects deliberate hacks via `// @quirk:` shields. |
| **`k79-code-structure`** | **God Files, Directory Bloat, Bad Naming & Circular Imports:** Monolithic services, barrel loops, and vague names (`data`, `handle()`) across any language. | Enforces a 250L target (300L max) per file, max 8 files/folder, zero feature barrel files, backend (`actions/helpers/queries/api`) & frontend (`components/hooks`) DAG separation, strict naming rules, and compiler-guided refactoring. |
| **`k79-evidence-and-simplicity`** | **Assumptions, Overengineering & Debug Loops:** Agents guessing schemas, building unnecessary classes/wrappers, and looping on failed fixes. | Demands verifiable proof before coding, enforces the Rule of 2+ for DRY extraction, bans speculative YAGNI abstractions, and triggers a 2-strike debugging circuit breaker. |
| **`k79-config-and-security`** | **Config Drift & Frontend Secret Leaks:** Scattered `process.env` reads, conflicting `??` fallbacks, and server configs crashing client bundles. | Enforces a 3-Tier Config Law, isolates client-safe `src/config/index` from server-only `env`/`paths`, scopes Redis/HTTP caches by `userId`, and requires idempotency keys on mutations. |
| **`k79-performance-and-db`** | **Slow Queries, N+1 Loops & Unbounded Fetches:** Un-transactional multi-writes, `SELECT *` memory bloat, and missing API timeouts. | Enforces explicit column selection, zero queries in loops, cursor pagination, DB transactions, Mongoose `.lean()`, `Promise.all`, `AbortSignal.timeout()`, and UI debouncing/lazy-loading. |
| **`k79-verification-testing`** | **False "Done" Claims & Tautological Tests:** Agents mocking the function under test or writing only happy-path tests that miss production crashes. | Mirrors `src/` 1-to-1 in top-level `tests/`, bans mocks on pure `helpers/`, mandates a **1:2 Happy-to-Breaking** adversarial test ratio, and supports both New and Legacy repos. |
| **`k79-logging-errors-git`** | **Swallowed Errors, Log Spam, Sloppy Commits & Missing Release Notes:** Double-logging, bare `console.log` strings, bulk `git add .` commits, AI co-author spam, and a hand-maintained changelog that conflicts on every branch. | Enforces throwing with context in leaf files, logging once at boundaries with structured JSON metadata (`what/when/why`), on-demand atomic Git commits with zero AI attribution, and a folder-per-change changelog that generates `CHANGELOG.md` and release notes. |

---

## Repository Structure

```text
k79-agent-skills/
├── VERSION                                  # Suite version (semver source of truth)
├── CHANGELOG.md                             # Generated from changelog/ — do not edit
├── changelog.config.json                    # Project, repository, install/update text for notes
├── LICENSE
├── changelog/
│   ├── TEMPLATE.md                          # Entry template and schema
│   └── YYYY/MM/YYYY-MM-DD-<slug>.md         # One file per logical change
├── release-notes/
│   └── v0.1.0.md                            # Generated GitHub Release body per version
├── package.json                             # Bun/Node validate, changelog & release scripts
├── scripts/
│   ├── list-skills.mjs                      # Prints available skills and count
│   ├── validate-skills.mjs                  # Frontmatter, naming, reference & version checks
│   ├── changelog.mjs                        # Validate, stamp, generate changelog & release notes
│   └── release.mjs                          # Stamp, bump, changelog, commit, tag, push
├── .github/workflows/
│   ├── validate.yml                         # CI validation on push / PR
│   └── release.yml                          # Publishes a GitHub Release on v* tags
└── skills/
    ├── k79-master-engineering/
    │   ├── SKILL.md                         # Phase-gated workflow + update protocol
    │   ├── AGENTS.router.md                 # Router block merged into project AGENTS.md
    │   ├── K79.reminder.md                  # Ten-line reminder prepended to AGENTS.md
    │   ├── hooks/                           # Optional SessionStart / compaction reminders
    │   └── VERSION                          # Installed version marker
    ├── k79-spec-driven/SKILL.md
    ├── k79-code-structure/SKILL.md
    ├── k79-evidence-and-simplicity/SKILL.md
    ├── k79-config-and-security/SKILL.md
    ├── k79-performance-and-db/SKILL.md
    ├── k79-verification-testing/SKILL.md
    └── k79-logging-errors-git/
        ├── SKILL.md                         # Error, logging, commit & changelog rules
        └── scripts/changelog.mjs            # Portable generator copied into projects
```

---

## Install (Global)

Requires **Node.js 22.20+**.

```bash
# OpenCode + Claude Code (recommended: name the agents you actually use)
bunx skills@latest add AbdulWadudh/k79-agent-skills -g -a opencode -a claude-code -y

# Node equivalent
npx skills@latest add AbdulWadudh/k79-agent-skills -g -a opencode -a claude-code -y
```

Preview what the repo exposes without installing:

```bash
bunx skills@latest add AbdulWadudh/k79-agent-skills --list
```

### List and count available skills

From this repository, with no network access:

```bash
bun run skills
```

```text
Available skills (8) — suite version 0.1.0:
  - k79-code-structure
  - k79-config-and-security
  - ...
```

The published repo also lists skills (the CLI does not print a total):

```bash
bunx skills@latest add AbdulWadudh/k79-agent-skills --list
```

`--list` cannot be combined with `--json`. To count **installed** skills, request JSON from `ls`:

```powershell
# PowerShell
(bunx skills@latest ls -g --json | ConvertFrom-Json).Count
```

```bash
# bash + jq
bunx skills@latest ls -g --json | jq length
```

Install for a single agent only:

```bash
bunx skills@latest add AbdulWadudh/k79-agent-skills -g -a opencode -y
```

Install into the current project instead of globally:

```bash
bunx skills@latest add AbdulWadudh/k79-agent-skills -a opencode -y
```

### Where global installs land

| Agent | Global skill path | How the CLI links it |
| :--- | :--- | :--- |
| OpenCode | `~/.agents/skills/` | Used directly (universal path OpenCode reads natively) |
| Claude Code | `~/.claude/skills/` | Junction/symlink to `~/.agents/skills/` |
| Most other agents | Their own `~/<agent>/skills/` | Junction/symlink to `~/.agents/skills/` |

`~/.agents/skills/` is the canonical copy; agent directories link back to it so updates happen once.

**Windows note:** the CLI creates directory junctions by default, which normally works without Developer Mode. If your setup blocks links, append `--copy` (copies files into each agent directory instead).

---

## Update an Existing Install

Tell your agent:

```text
update k79-agent-skills
```

The `k79-master-engineering` skill handles this with a strict approval gate:

1. Reads the installed version from `~/.agents/skills/k79-master-engineering/VERSION` (fallback: `metadata.version`).
2. Looks up the latest release:
   ```bash
   gh api repos/AbdulWadudh/k79-agent-skills/releases/latest --jq .tag_name
   # fallback
   curl -fsSL https://raw.githubusercontent.com/AbdulWadudh/k79-agent-skills/main/VERSION
   ```
3. If versions differ, shows current version, latest version, and release notes — then **stops for your approval**.
4. On approval, reinstalls the suite and refreshes agent links:
   ```bash
   bunx skills@latest add AbdulWadudh/k79-agent-skills -g -a opencode -a claude-code -y
   ```
   (Use `npx skills@latest ...` if Bun is unavailable.)
5. Verifies the installed `VERSION` and re-syncs the project `AGENTS.md` router block without touching project-specific content.

Manual update (no version comparison):

```bash
# Refresh only the k79 skills (leaves other global skills alone)
bunx skills@latest update k79-master-engineering k79-spec-driven k79-code-structure k79-evidence-and-simplicity k79-config-and-security k79-performance-and-db k79-verification-testing k79-logging-errors-git -g -y

# Or refresh every global skill
bunx skills@latest update -g -y
```

Node fallback: replace `bunx skills@latest` with `npx skills@latest`.

> `skills update` compares **content hashes against the repository default branch**. It does not understand semver tags. That is why the suite ships a `VERSION` marker and the update protocol compares versions explicitly.

---

## Agent Compatibility

`AGENTS.md` is the closest thing to a shared standard, but it is not universal. The router is written once and shimmed per agent:

| Agent | Reads project `AGENTS.md` | Notes |
| :--- | :--- | :--- |
| OpenCode | Yes, native | Falls back to `CLAUDE.md` when no `AGENTS.md` exists |
| Claude Code | Yes, native | v2.1.277+. Ignored when a project `CLAUDE.md`, `.claude/CLAUDE.md`, or `CLAUDE.local.md` exists - add `@AGENTS.md` to that file |
| Codex CLI | Yes, native | Root, nested, and `~/.codex/AGENTS.md` |
| Cursor | Yes, native | Root and nested directories |
| Windsurf / Cascade | Yes, native | Root is always-on; subdirectories are scoped |
| Cline | Yes, native | v3.37.0+ |
| GitHub Copilot | Agents and code review | Repo-wide chat still prefers `.github/copilot-instructions.md` |
| Gemini CLI | No, by default | Reads `GEMINI.md`. Add a `GEMINI.md` containing `@AGENTS.md`, or set `context.fileName` to include `AGENTS.md` |
| Aider | No, by default | Reads `CONVENTIONS.md`. Add `read: AGENTS.md` to `.aider.conf.yml` |

Instruction files are **context, not enforcement**. For a rule that must hold, use a hook or CI.

---

## Reminders, Not Restrictions

Prompts are advisory. A reminder raises adherence; it does not guarantee it. The suite uses three lightweight reminders instead of gates:

| Reminder | Where it lives | Survives compaction |
| :--- | :--- | :--- |
| [`K79.reminder.md`](./skills/k79-master-engineering/K79.reminder.md) | Top of the project's `AGENTS.md` | No, unless a hook re-injects it |
| Skill descriptions | The agent's skill list, shown every session | Yes |
| Session hooks | Claude Code `SessionStart`, OpenCode compaction | Yes |

The bootstrap prompt prepends the reminder to `AGENTS.md`. The copy-paste hooks are in [`skills/k79-master-engineering/hooks/README.md`](./skills/k79-master-engineering/hooks/README.md). They only add context; they never block a tool.

Keep the reminder short. A ten-line reminder gets reread; a hundred-line one gets skimmed. When a rule matters enough to guarantee, move it to a check rather than adding more prose.

---

## Does Global Install Work as Expected?

**Yes — with the caveats below.** This was verified against the `skills` CLI (v1.7.6) on Windows:

- Global install writes all 8 skills to `~/.agents/skills/`, which OpenCode reads natively.
- Claude Code gets junctions under `~/.claude/skills/`; other supported agents get their own links.
- Skill names and directories now match (`k79-spec-driven/SKILL.md` -> `name: k79-spec-driven`), so the namespacing and every router path resolve correctly.
- The CLI copies additional files in each skill directory, including `VERSION` and `AGENTS.router.md`.

What global install **does not** do:

- It does not modify any project's `AGENTS.md`. The router is loaded only after you run the bootstrap prompt above (or merge `AGENTS.router.md` yourself).
- It does not pin to a tag; updates follow the default branch. The `VERSION` marker is what makes version comparison meaningful.
- It does not update itself on a schedule. The agent only checks when you say "update k79-agent-skills".
- It requires Node 22.20+. Older Node versions fail before installation starts.

Other things to know:

- On Windows, if junction creation is blocked, re-run with `--copy`.
- Skills are instructions with full agent permissions. Review `SKILL.md` files before installing, like any third-party skill.
- `--all` installs to every supported agent and creates a lot of links; prefer naming agents with `-a`.

---

## Updating Any Project Later

Inside a bootstrapped project, say:

```text
update k79-agent-skills
```

The agent reports current vs latest version, waits for approval, updates the global skills, then refreshes the router block in `AGENTS.md`. If you only want the project router refreshed, ask it to "re-sync the k79 router block" and it will skip reinstalling.

---

## Maintainer: Changelog & Release Notes

Every logical change gets one file:

```text
changelog/YYYY/MM/YYYY-MM-DD-<slug>.md
```

The file carries frontmatter (`title`, `date`, `type`, `scope`, `version`, `released`, `breaking`, `highlight`) and four sections: `Why`, `What`, `Verification`, `Notes`. Copy [`changelog/TEMPLATE.md`](./changelog/TEMPLATE.md) to start one.

`CHANGELOG.md` and `release-notes/vX.Y.Z.md` are **generated** from those entries. Never edit `CHANGELOG.md` by hand, and never reset the `Unreleased` section: it is derived from entries whose `version` is empty.

```bash
bun run changelog        # regenerate CHANGELOG.md
bun run changelog:check  # fail if malformed or stale (runs in CI)
```

Node fallback: `node scripts/changelog.mjs`.

At release time the release script stamps every unreleased entry with the new version and date, regenerates `CHANGELOG.md`, and writes `release-notes/vX.Y.Z.md` from the same entries. Existing release notes are kept unless you pass `--force`.

### Using it in another project

The generator ships inside the `k79-logging-errors-git` skill, so there is nothing to publish. The bootstrap prompt copies it into the project:

```bash
cp ~/.agents/skills/k79-logging-errors-git/scripts/changelog.mjs scripts/changelog.mjs
node scripts/changelog.mjs --init
```

Then add the two package scripts and a CI check. An optional `changelog.config.json` supplies the repository URL, license, verification commands, and install/update text used in release notes; without it, those sections are omitted.

---

## Maintainer: Versioning & Releases

This repo uses **Semantic Versioning** and annotated Git tags. `VERSION` is the source of truth; `scripts/release.mjs` keeps all markers in sync. The scripts are plain `.mjs` with zero dependencies, so they run identically under **Bun (default)** or **Node**:

- root `VERSION`
- `skills/k79-master-engineering/VERSION`
- `package.json` `version`
- `metadata.version` in every `SKILL.md`
- stamped `version` in `changelog/**`
- generated `CHANGELOG.md` and `release-notes/vX.Y.Z.md`

Release a patch/minor/major:

```bash
bun run validate
bun run release patch    # or: minor | major | 1.2.3
```

Node fallback:

```bash
npm run validate
npm run release -- patch
```

The release script requires a clean `main` branch, refuses to run with no unreleased changelog entries, runs validation, stamps the entries, generates the changelog and release notes, bumps the version markers, commits `chore(release): vX.Y.Z`, creates an annotated `vX.Y.Z` tag, and pushes with `--follow-tags` (unless `--no-push`).

The pushed tag triggers `.github/workflows/release.yml`, which:

1. Verifies the tag matches `VERSION`.
2. Re-runs skill and changelog validation.
3. Publishes a GitHub Release using `release-notes/vX.Y.Z.md`.

Dry run:

```bash
bun run release patch --dry-run
```

One-time setup for a fresh clone:

```bash
git remote add origin https://github.com/AbdulWadudh/k79-agent-skills.git
git add .
git commit -m "feat: initial k79 skill suite"

# Tag the already-recorded 0.1.0 release (the release script only creates new versions)
git tag -a v0.1.0 -m v0.1.0
git push -u origin main --follow-tags
```

After that, use `bun run release patch` (or `minor` / `major`) for every subsequent release.

> The first tag is created manually because `VERSION` already contains `0.1.0`; the release script intentionally refuses to create a tag that is not greater than the current version.

---

## Validation Rules

`bun run validate` and `bun run changelog:check` (both enforced in CI) check:

- Every `skills/*/SKILL.md` has valid YAML frontmatter.
- `name` matches the directory name and the Agent Skills naming regex.
- `description` is present and at most 1024 characters.
- `metadata.version` matches root `VERSION` for every skill.
- The installed `VERSION` marker matches the suite version.
- Every `k79-*/SKILL.md` reference in the master skill and router file resolves.
- Skill names are unique.
- Every changelog entry has a valid path, date, type, scope, title, and body.
- `CHANGELOG.md` matches the generated output from `changelog/`.

---

## License

MIT © 2026 Mohammed Abdul Wadudh Samdani. See [`LICENSE`](./LICENSE).
