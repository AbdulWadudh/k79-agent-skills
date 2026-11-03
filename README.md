# k79-agent-skills — Engineering Skills Constitution

![Version](https://img.shields.io/github/v/tag/AbdulWadudh/k79-agent-skills?label=version)

A modular, language-agnostic, Spec-Driven engineering skill suite (`k79-*`) for AI coding agents (OpenCode, Claude Code, Cursor, Cline, Windsurf, Codex, and other agents supported by the [`skills`](https://github.com/vercel-labs/skills) CLI).

Current suite version: see [`VERSION`](./VERSION).

## Artifact Roles

| Artifact | Role | Read when |
| :--- | :--- | :--- |
| `AGENTS.md` | Always-loaded map: reminder, router block, project context | Every session |
| `k79-conductor/SKILL.md` | On-demand procedure: phase order, approval gates, update protocol | When `k79-conductor` is invoked |
| `k79-conductor/AGENTS.router.md` | Canonical template for the marked block in `AGENTS.md`; **not a shim** | Never at runtime; only by `sync-agents.mjs` |
| `k79-*/SKILL.md` (7 domain skills) | Detailed rules for one concern | When the task matches that concern |

`AGENTS.router.md` is not a shim and should not be loaded on every task. It exists so the block in `AGENTS.md` can be re-synced after an update. The only routing list in `AGENTS.md` lives in `K79.reminder.md`; the router block points at `k79-conductor`.

---

## One-Paste Project Bootstrap Prompt

Copy this into your coding agent inside **any new or existing project repository**:

```text
Bootstrap and align this project with my Engineering Skills repository (AbdulWadudh/k79-agent-skills):

1. Install the suite locally (default, no agent selection):
   - Run `bunx skills@latest add AbdulWadudh/k79-agent-skills -y` from the repo root.
   - This creates `<repo>/.agents/skills/` and `<repo>/skills-lock.json` only. It does not create `.claude/skills/`, `agent/skills/`, or any per-agent mirror.
   - Verify all 8 `k79-*` skills are in `.agents/skills/` and report the `VERSION` from `k79-conductor/VERSION`.
   - Global (`-g`) and per-agent (`-a <agent>` or `--agent '*'`) installs are optional and advanced. Do not use them unless I ask.

2. Read the Constitution:
   - Load the `k79-conductor` skill, then read its `SKILL.md`.
   - `k79-conductor/AGENTS.router.md` is the source template for the marked block in `AGENTS.md`. It is not read at runtime and should not be loaded on every task.

3. Project Instruction Files (one map, one source):
   - PRIMARY: `AGENTS.md` at the repo root.
     - If NO `AGENTS.md` exists: create it with `k79-conductor/K79.reminder.md` at the top, then this exact block:
       ```html
       <!-- k79:router:start -->
       ... contents of k79-conductor/AGENTS.router.md ...
       <!-- k79:router:end -->
       ```
       then a concise Project Context section (tech stack, package manager, build/typecheck/test commands, and key folder paths discovered from the repo).
     - Do not paste the seven task-to-skill mappings a second time. The reminder is the only copy in `AGENTS.md`; the router block points at `k79-conductor`.
     - If `AGENTS.md` ALREADY exists: PRESERVE 100% of all project-specific context, domain knowledge, custom commands, environment notes, and architectural quirks. Replace only the marked block. If there are no markers, insert the reminder and a marked block at the top without deleting anything. Show me a summary of the changes.
   - Copy `k79-conductor/scripts/sync-agents.mjs` to `<project>/scripts/sync-agents.mjs`, add `agents:check` and `agents:sync` package scripts, and run `node scripts/sync-agents.mjs --check`.
   - SHIMS: never duplicate the router body. Add a pointer only where an agent does not read `AGENTS.md` directly:
     - Claude Code: if a `CLAUDE.md` or `CLAUDE.local.md` already exists in the project, prepend `@AGENTS.md` to it. Do not create `CLAUDE.md` when the repo has none - Claude Code reads `AGENTS.md` natively since v2.1.277.
     - Gemini CLI: if no `GEMINI.md` exists, create one containing `@AGENTS.md`.
     - GitHub Copilot: if `.github/copilot-instructions.md` exists, add a one-line pointer to `AGENTS.md`.
     - Aider: if `.aider.conf.yml` exists, add `read: AGENTS.md`.
   - OPTIONAL REMINDERS: `AGENTS.md` already covers every agent. For harnesses with hook APIs, `k79-conductor/hooks/README.md` adds re-injection (Claude Code `SessionStart`, OpenCode compaction). This is an optional extra, not a target list; the hooks only add context and never block tools.
   - Note that instruction files are context, not enforcement. Do not claim a rule is guaranteed.

4. Release-notes tooling (only if the project has no changelog ledger):
   - Copy `scripts/release-notes.mjs` from the installed `k79-logging-errors-git` skill to `<project>/scripts/release-notes.mjs`.
   - Create `changelog/TEMPLATE.md` from the schema in `k79-logging-errors-git/SKILL.md`, and create `release-notes/`.
   - Add `release-notes` and `release-notes:check` package scripts and run the check before every release.
   - Do not overwrite or migrate an existing ledger without asking.

5. Verify and report which instruction file each agent you use will load. Do not modify source code as part of this bootstrap.
```

---

## Why This Exists (Problems Solved)

Coding agents routinely fail in production codebases due to predictable LLM anti-patterns: context pollution, hallucinated requirements, 1,500-line God files, vague variable naming (`data`, `temp`), circular barrel imports, speculative overengineering, happy-path-only tests, and bulk Git commits.

This repository solves those failure modes through **1 Conductor** and **7 Modular Domain Skills**, all namespaced with `k79-` to prevent collisions in global skill directories:

| Skill | What Problem It Solves | Core Enforcement |
| :--- | :--- | :--- |
| **`k79-conductor`** | **Skill Sprawl & Attention Dilution:** Agents forget rules when dumped into one giant prompt. | Routes the agent through 4 strict phases (Spec -> Code -> Verify -> Commit), loading only the specific `k79-*` skills needed for the active task. Also owns the approval-gated suite update protocol. |
| **`k79-spec-driven`** | **Hallucinated Scope & Broken Workarounds:** Agents jump straight into coding, break contracts, touch unrelated files, or refactor away intentional hacks. | Enforces a pre-code `<feature>.spec.md` approval gate, locks the allowed file blast radius, scales specs >250L into `specs/`, and protects deliberate hacks via `// @quirk:` shields. |
| **`k79-code-structure`** | **God Files, Directory Bloat, Bad Naming & Circular Imports:** Monolithic services, barrel loops, and vague names (`data`, `handle()`) across any language. | Enforces a 250L target (300L max) per file, max 8 files/folder, zero feature barrel files, backend (`actions/helpers/queries/api`) & frontend (`components/hooks`) DAG separation, strict naming rules, and compiler-guided refactoring. |
| **`k79-evidence-and-simplicity`** | **Assumptions, Overengineering & Debug Loops:** Agents guessing schemas, building unnecessary classes/wrappers, and looping on failed fixes. | Demands verifiable proof before coding, enforces the Rule of 2+ for DRY extraction, bans speculative YAGNI abstractions, and triggers a 2-strike debugging circuit breaker. |
| **`k79-config-and-security`** | **Config Drift & Frontend Secret Leaks:** Scattered `process.env` reads, conflicting `??` fallbacks, and server configs crashing client bundles. | Enforces a 3-Tier Config Law, isolates client-safe `src/config/index` from server-only `env`/`paths`, scopes Redis/HTTP caches by `userId`, and requires idempotency keys on mutations. |
| **`k79-performance-and-db`** | **Slow Queries, N+1 Loops & Unbounded Fetches:** Un-transactional multi-writes, `SELECT *` memory bloat, and missing API timeouts. | Enforces explicit column selection, zero queries in loops, cursor pagination, DB transactions, Mongoose `.lean()`, `Promise.all`, `AbortSignal.timeout()`, and UI debouncing/lazy-loading. |
| **`k79-verification-testing`** | **False "Done" Claims & Tautological Tests:** Agents mocking the function under test or writing only happy-path tests that miss production crashes. | Mirrors `src/` 1-to-1 in top-level `tests/`, bans mocks on pure `helpers/`, mandates a **1:2 Happy-to-Breaking** adversarial test ratio, and supports both New and Legacy repos. |
| **`k79-logging-errors-git`** | **Swallowed Errors, Log Spam, Sloppy Commits & Missing Release Notes:** Double-logging, bare `console.log` strings, bulk `git add .` commits, AI co-author spam, and a hand-maintained changelog that conflicts on every branch. | Enforces throwing with context in leaf files, logging once at boundaries with structured JSON metadata (`what/when/why`), on-demand atomic Git commits with zero AI attribution, and a folder-per-change ledger that generates release notes from entry diffs. |

---

## Repository Structure

```text
k79-agent-skills/
├── AGENTS.md                                # Always-loaded map: reminder + marked router block
├── VERSION                                  # Suite version (semver source of truth)
├── changelog.config.json                    # Project, repository, install/update text for notes
├── LICENSE
├── changelog/
│   ├── TEMPLATE.md                          # Entry template and schema
│   └── YYYY/MM/YYYY-MM-DD-<slug>.md         # One file per logical change
├── release-notes/
│   ├── .last-release.json                   # Paths + SHA-256 of covered entries
│   └── v0.1.0.md                            # Generated GitHub Release body per version
├── package.json                             # Bun/Node validate, release-notes & release scripts
├── scripts/
│   ├── list-skills.mjs                      # Prints available skills and count
│   ├── validate-skills.mjs                  # Frontmatter, naming, reference & version checks
│   ├── release-notes.mjs                    # Validate entries and generate release notes
│   ├── sync-agents.mjs                      # Check or replace the marked AGENTS.md block
│   └── release.mjs                          # Stamp, bump, notes, commit, tag, push, publish
└── skills/
    ├── k79-conductor/
    │   ├── SKILL.md                         # Phase-gated workflow + update protocol
    │   ├── AGENTS.router.md                 # Canonical template for the marked AGENTS.md block
    │   ├── K79.reminder.md                  # Ten-line reminder prepended to AGENTS.md
    │   ├── scripts/sync-agents.mjs          # Keeps the AGENTS.md block in sync
    │   ├── hooks/                           # Optional SessionStart / compaction reminders
    │   └── VERSION                          # Installed version marker
    ├── k79-spec-driven/SKILL.md
    ├── k79-code-structure/SKILL.md
    ├── k79-evidence-and-simplicity/SKILL.md
    ├── k79-config-and-security/SKILL.md
    ├── k79-performance-and-db/SKILL.md
    ├── k79-verification-testing/SKILL.md
    └── k79-logging-errors-git/
        ├── SKILL.md                         # Error, logging, commit & release-note rules
        └── scripts/release-notes.mjs        # Portable generator copied into projects
```

---

## Install

Requires **Node.js 22.20+**.

### Default: project-local, no agent selection

Run from the repository root:

```bash
bunx skills@latest add AbdulWadudh/k79-agent-skills -y
```

This creates exactly:

- `.agents/skills/` — the canonical copy of all 8 skills.
- `skills-lock.json` — the project lockfile.

It does **not** create `.claude/skills/`, `agent/skills/`, or any per-agent mirror. No `-a` flag is required.

Commit `.agents/skills/` and `skills-lock.json` if teammates and your agent should use the same version; ignore them if the install is only for you.

### Advanced: global or per-agent mirrors

| Option | Command | Creates |
| :--- | :--- | :--- |
| Global copy | `... -g -y` | `~/.agents/skills/`; add `-a` only if you also want mirrors |
| One agent | `... -a claude-code -y` | `.agents/skills/` plus `.claude/skills/` |
| Every agent | `... --agent '*' -y` | `.agents/skills/`, `.claude/skills/`, `agent/skills/`, and other agent directories |

`--agent '*'` is not the default and is not needed for a local install. Use it only when you deliberately want mirrors for every supported agent.

When both project and global copies exist, the project copy wins because it is first in the router's resolution order.

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
# Global, one agent
bunx skills@latest add AbdulWadudh/k79-agent-skills -g -a opencode -y

# Project, one agent
bunx skills@latest add AbdulWadudh/k79-agent-skills -a opencode -y
```

### Where installs land

| Scope | Canonical copy | Agent directories |
| :--- | :--- | :--- |
| Global | `~/.agents/skills/` | `~/.claude/skills/`, `~/.commandcode/skills/`, and other `~/<agent>/skills/` links |
| Project | `<repo>/.agents/skills/` | `.claude/skills/` and other agent directories inside the repo |

The canonical copy is the single source; agent directories link back to it so updates happen once.

**Windows note:** the CLI creates directory junctions by default, which normally works without Developer Mode. If your setup blocks links, append `--copy` (copies files into each agent directory instead).

---

## Update an Existing Install

Tell your agent:

```text
update k79-agent-skills
```

The `k79-conductor` skill handles this with a strict approval gate:

1. Detects the scope: project copy first (`<repo>/.agents/skills/k79-conductor/VERSION`), then global (`~/.agents/skills/k79-conductor/VERSION`). If both exist, the project copy is the one to update.
2. Looks up the latest release:
   ```bash
   gh api repos/AbdulWadudh/k79-agent-skills/releases/latest --jq .tag_name
   # fallback
   curl -fsSL https://raw.githubusercontent.com/AbdulWadudh/k79-agent-skills/main/VERSION
   ```
3. If versions differ, shows current version, latest version, and release notes — then **stops for your approval**.
4. On approval, reinstalls the same scope:
   ```bash
   # Project (from the repo root)
   bunx skills@latest add AbdulWadudh/k79-agent-skills -y

   # Global
   bunx skills@latest add AbdulWadudh/k79-agent-skills -g -y
   ```
   (Use `npx skills@latest ...` if Bun is unavailable.)
5. Verifies the installed `VERSION`, then runs `node scripts/sync-agents.mjs --sync` and `--check` so the `AGENTS.md` block matches the new template without touching project-specific content.

Re-running the install command also updates in place: `skills add` reads the latest default branch. A separate update step is optional.

Manual update (no version comparison):

```bash
# Project scope: refresh only the k79 skills
bunx skills@latest update k79-conductor k79-spec-driven k79-code-structure k79-evidence-and-simplicity k79-config-and-security k79-performance-and-db k79-verification-testing k79-logging-errors-git -p -y

# Global scope: refresh only the k79 skills
bunx skills@latest update k79-conductor k79-spec-driven k79-code-structure k79-evidence-and-simplicity k79-config-and-security k79-performance-and-db k79-verification-testing k79-logging-errors-git -g -y

# Or refresh every skill in the current scope
bunx skills@latest update -y
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

Instruction files are **context, not enforcement**. For a rule that must hold, use a hook or a local check.

---

## Reminders, Not Restrictions

Prompts are advisory. A reminder raises adherence; it does not guarantee it. The suite uses three lightweight reminders instead of gates:

| Reminder | Where it lives | Coverage |
| :--- | :--- | :--- |
| [`K79.reminder.md`](./skills/k79-conductor/K79.reminder.md) | Top of the project's `AGENTS.md` | Every agent that reads `AGENTS.md` or a shim |
| Skill descriptions | The agent's skill list, shown every session | Every agent with skills support |
| Session hooks | Claude Code `SessionStart`, OpenCode compaction | Only harnesses with hook APIs; optional |

The bootstrap prompt prepends the reminder to `AGENTS.md`. The copy-paste hooks are in [`skills/k79-conductor/hooks/README.md`](./skills/k79-conductor/hooks/README.md). They only add context; they never block a tool.

Keep the reminder short. A ten-line reminder gets reread; a hundred-line one gets skimmed. When a rule matters enough to guarantee, move it to a check rather than adding more prose.

---

## Keeping AGENTS.md in Sync

The router block in `AGENTS.md` is wrapped in markers:

```html
<!-- k79:router:start -->
...
<!-- k79:router:end -->
```

`k79-conductor/AGENTS.router.md` is the canonical template. The sync script compares and replaces only that block:

```bash
node scripts/sync-agents.mjs --check
node scripts/sync-agents.mjs --sync
```

`--check` fails on drift. `--sync` preserves every line outside the markers. The suite runs the check before every release. Projects get the script from `k79-conductor/scripts/sync-agents.mjs` during bootstrap.

---

## Does Installation Work as Expected?

**Yes. The default is a project-local install with no agent selection.** Verified against the `skills` CLI on Windows:

- `bunx skills@latest add AbdulWadudh/k79-agent-skills -y` writes `.agents/skills/` and `skills-lock.json`, and nothing else.
- It does not create `.claude/skills/`, `agent/skills/`, or any per-agent mirror.
- Global (`-g`) writes to `~/.agents/skills/`; per-agent mirrors appear only when you pass `-a` or `--agent '*'`.
- Skill names and directories match (`k79-spec-driven/SKILL.md` -> `name: k79-spec-driven`), so namespacing and every router path resolve.
- The CLI copies additional files in each skill directory, including `VERSION`, `AGENTS.router.md`, `K79.reminder.md`, and `hooks/`.
- When both scopes exist, the project copy wins in the router's resolution order.

What installation **does not** do:

- It does not modify any project's `AGENTS.md`. The router is loaded only after you run the bootstrap prompt above (or merge `AGENTS.router.md` yourself).
- It does not pin to a tag; `add` follows the default branch. The `VERSION` marker is what makes version comparison meaningful.
- It does not update itself on a schedule. The agent only checks when you say "update k79-agent-skills".
- It requires Node 22.20+. Older Node versions fail before installation starts.

Other things to know:

- On Windows, if junction creation is blocked, re-run with `--copy`.
- Skills are instructions with full agent permissions. Review `SKILL.md` files before installing, like any third-party skill.
- `--all` installs to every supported agent and creates a lot of links; prefer naming agents with `-a` when you do not need all of them.

---

## Updating Any Project Later

Inside a bootstrapped project, say:

```text
update k79-agent-skills
```

The agent reports current vs latest version, waits for approval, updates the installed scope (project or global), then refreshes the router block in `AGENTS.md`. If you only want the project router refreshed, ask it to "re-sync the k79 router block" and it will skip reinstalling.

---

## Maintainer: Changelog & Release Notes

Every logical change gets one file:

```text
changelog/YYYY/MM/YYYY-MM-DD-<slug>.md
```

The file carries frontmatter (`title`, `date`, `type`, `scope`, `version`, `released`, `breaking`, `highlight`) and the sections `Why`, `What`, `Verification`, plus `Notes` or `Migration` when needed. Copy [`changelog/TEMPLATE.md`](./changelog/TEMPLATE.md) to start one.

There is no aggregate changelog file. `release-notes/vX.Y.Z.md` is generated from the entries added or modified since the previous release boundary. The boundary is, in order:

1. `--baseline <git-ref>`
2. the latest Git tag (`git describe --tags --abbrev=0`)
3. `release-notes/.last-release.json` (path + SHA-256 manifest)

```bash
bun run release-notes --dry-run --version 2.0.0
bun run release-notes:check
```

Node fallback: `node scripts/release-notes.mjs`.

At release time the release script stamps every unreleased entry with the new version and date, generates `release-notes/vX.Y.Z.md` from the entry diff, and updates `.last-release.json` only after the write succeeds. Released entries are append-only: the generator rejects edits or deletions.

### Using it in another project

The generator ships inside the `k79-logging-errors-git` skill, so there is nothing to publish. The bootstrap prompt copies it into the project:

```bash
cp ~/.agents/skills/k79-logging-errors-git/scripts/release-notes.mjs scripts/release-notes.mjs
mkdir -p changelog release-notes
```

Create `changelog/TEMPLATE.md` from the schema in the skill, then add the `release-notes` and `release-notes:check` package scripts and run the check before every release. An optional `changelog.config.json` supplies the repository URL, license, verification commands, and install/update text used in release notes; without it, those sections are omitted.

---

## Maintainer: Versioning & Releases

This repo uses **Semantic Versioning** and annotated Git tags. `VERSION` is the source of truth; `scripts/release.mjs` keeps all markers in sync. The scripts are plain `.mjs` with zero dependencies, so they run identically under **Bun (default)** or **Node**:

- root `VERSION`
- `skills/k79-conductor/VERSION`
- `package.json` `version`
- `metadata.version` in every `SKILL.md`
- stamped `version` in `changelog/**`
- generated `release-notes/vX.Y.Z.md` and `release-notes/.last-release.json`

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

The release script requires a clean `main` branch, refuses to run with no unreleased changelog entries, runs validation, stamps the entries, generates release notes from the entry diff, updates the manifest, bumps the version markers, commits `chore(release): vX.Y.Z`, creates an annotated `vX.Y.Z` tag, pushes with `--follow-tags`, and publishes the GitHub Release (unless `--no-push`).

After pushing, the script runs `gh release create --verify-tag --notes-file release-notes/vX.Y.Z.md`. If `gh` is unavailable or unauthenticated, it prints the exact command to run. There is no GitHub Actions workflow in this repository.

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

`bun run validate` and `bun run release-notes:check` (both run by the agent before every release) check:

- Every `skills/*/SKILL.md` has valid YAML frontmatter.
- `name` matches the directory name and the Agent Skills naming regex.
- `description` is present and at most 1024 characters.
- `metadata.version` matches root `VERSION` for every skill.
- The installed `VERSION` marker matches the suite version.
- Every `k79-*/SKILL.md` reference in the conductor skill and router file resolves.
- Skill names are unique.
- Every changelog entry has a valid path, date, type, scope, title, `Why`, `What`, and `Verification`.
- Breaking entries have a `Migration` section.
- Released entries are unchanged since the last release manifest.
- Every stamped version has a `release-notes/vX.Y.Z.md` file.

---

## License

MIT © 2026 Mohammed Abdul Wadudh Samdani. See [`LICENSE`](./LICENSE).
