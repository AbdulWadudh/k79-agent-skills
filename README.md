# k79-agent-skills — Engineering Skills Constitution

![Version](https://img.shields.io/github/v/tag/AbdulWadudh/k79-agent-skills?label=version)

A modular, language-agnostic, Spec-Driven engineering skill suite (`k79-*`) for AI coding agents (OpenCode, Claude Code, Cursor, Cline, Windsurf, Codex, and other agents supported by the [`skills`](https://github.com/vercel-labs/skills) CLI).

Current suite version: see [`VERSION`](./VERSION).

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
| **`k79-logging-errors-git`** | **Swallowed Errors, Log Spam & Sloppy Commits:** Double-logging, bare `console.log` strings, bulk `git add .` commits, and AI co-author spam. | Enforces throwing with context in leaf files, logging once at boundaries with structured JSON metadata (`what/when/why`), and on-demand atomic Git commits with zero AI attribution. |

---

## Repository Structure

```text
k79-agent-skills/
├── VERSION                                  # Suite version (semver source of truth)
├── CHANGELOG.md
├── LICENSE
├── release-notes/
│   └── v0.1.0.md                            # Rich GitHub Release body per version
├── package.json                             # Bun/Node validate & release scripts (not published)
├── scripts/
│   ├── list-skills.mjs                      # Prints available skills and count
│   ├── validate-skills.mjs                  # Frontmatter, naming, reference & version checks
│   └── release.mjs                          # Bump, changelog, commit, tag, push
├── .github/workflows/
│   ├── validate.yml                         # CI validation on push / PR
│   └── release.yml                          # Publishes a GitHub Release on v* tags
└── skills/
    ├── k79-master-engineering/
    │   ├── SKILL.md                         # Phase-gated workflow + update protocol
    │   ├── AGENTS.router.md                 # Router block merged into project AGENTS.md
    │   └── VERSION                          # Installed version marker
    ├── k79-spec-driven/SKILL.md
    ├── k79-code-structure/SKILL.md
    ├── k79-evidence-and-simplicity/SKILL.md
    ├── k79-config-and-security/SKILL.md
    ├── k79-performance-and-db/SKILL.md
    ├── k79-verification-testing/SKILL.md
    └── k79-logging-errors-git/SKILL.md
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

## Does Global Install Work as Expected?

**Yes — with the caveats below.** This was verified against the `skills` CLI (v1.7.6) on Windows:

- Global install writes all 8 skills to `~/.agents/skills/`, which OpenCode reads natively.
- Claude Code gets junctions under `~/.claude/skills/`; other supported agents get their own links.
- Skill names and directories now match (`k79-spec-driven/SKILL.md` -> `name: k79-spec-driven`), so the namespacing and every router path resolve correctly.
- The CLI copies additional files in each skill directory, including `VERSION` and `AGENTS.router.md`.

What global install **does not** do:

- It does not modify any project's `AGENTS.md`. Enforcement is automatic only after you run the bootstrap prompt below (or merge `AGENTS.router.md` yourself).
- It does not pin to a tag; updates follow the default branch. The `VERSION` marker is what makes version comparison meaningful.
- It does not update itself on a schedule. The agent only checks when you say "update k79-agent-skills".
- It requires Node 22.20+. Older Node versions fail before installation starts.

Other things to know:

- On Windows, if junction creation is blocked, re-run with `--copy`.
- Skills are instructions with full agent permissions. Review `SKILL.md` files before installing, like any third-party skill.
- `--all` installs to every supported agent and creates a lot of links; prefer naming agents with `-a`.

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
   - Read `k79-master-engineering/SKILL.md` and `k79-master-engineering/AGENTS.router.md` from the installed skills directory.

3. Non-Destructive Project AGENTS.md Alignment:
   - Check if this project has an existing `AGENTS.md` in the root directory.
   - If NO `AGENTS.md` exists: Create `AGENTS.md` starting with the contents of `k79-master-engineering/AGENTS.router.md`, followed by a concise Project Context section (tech stack, package manager, build/typecheck/test commands, and key folder paths discovered from the repo).
   - If `AGENTS.md` ALREADY exists:
     - PRESERVE 100% of all project-specific context, domain knowledge, custom commands, environment notes, and architectural quirks.
     - MERGE or UPDATE the Skill Router block from `k79-master-engineering/AGENTS.router.md` cleanly at the top of `AGENTS.md`.
     - RECONCILE CONFLICTS: Scan the existing `AGENTS.md` for generic coding rules that directly contradict our constitution and align only those specific lines.
     - Show me a summary of the changes made to `AGENTS.md`.

4. Do not modify source code as part of this bootstrap.
```

---

## Updating Any Project Later

Inside a bootstrapped project, say:

```text
update k79-agent-skills
```

The agent reports current vs latest version, waits for approval, updates the global skills, then refreshes the router block in `AGENTS.md`. If you only want the project router refreshed, ask it to "re-sync the k79 router block" and it will skip reinstalling.

---

## Maintainer: Versioning & Releases

This repo uses **Semantic Versioning** and annotated Git tags. `VERSION` is the source of truth; `scripts/release.mjs` keeps all markers in sync. The scripts are plain `.mjs` with zero dependencies, so they run identically under **Bun (default)** or **Node**:

- root `VERSION`
- `skills/k79-master-engineering/VERSION`
- `package.json` `version`
- `metadata.version` in every `SKILL.md`
- `CHANGELOG.md` entry

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

The release script requires a clean `main` branch, runs validation, writes the version and changelog, commits `chore(release): vX.Y.Z`, creates an annotated `vX.Y.Z` tag, and pushes with `--follow-tags` (unless `--no-push`).

The pushed tag triggers `.github/workflows/release.yml`, which:

1. Verifies the tag matches `VERSION`.
2. Re-runs skill validation.
3. Publishes a GitHub Release with generated notes.

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

`bun run validate` (also enforced in CI) checks:

- Every `skills/*/SKILL.md` has valid YAML frontmatter.
- `name` matches the directory name and the Agent Skills naming regex.
- `description` is present and at most 1024 characters.
- `metadata.version` matches root `VERSION` for every skill.
- The installed `VERSION` marker matches the suite version.
- Every `k79-*/SKILL.md` reference in the master skill and router file resolves.
- Skill names are unique.

---

## License

MIT © 2026 Mohammed Abdul Wadudh Samdani. See [`LICENSE`](./LICENSE).
