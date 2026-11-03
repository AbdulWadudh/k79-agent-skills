---
name: k79-logging-errors-git
description: Mandatory rules for boundary error handling, structured contextual logging (what/when/why), logical atomic Git commits without AI attribution, and changelog/release-note maintenance with one file per change. Load when handling errors, adding logs, creating Git commits, or preparing a release.
license: MIT
metadata:
  version: "2.0.1"
  source: "AbdulWadudh/k79-agent-skills"
---

# Error Handling, Structured Logging & Git Hygiene Rules

## 1. Error Handling & Boundary Logging (Zero Double-Logging)
- **Never Swallow Errors:** Empty `catch {}` blocks or catching an error just to return `null`/`false` without context is strictly forbidden.
- **Throw with Context Below, Log Once Above:**
  - **Leaf Workers (`queries`, `api`, `helpers`):** Do NOT log errors inside leaf functions. Throw typed or contextual errors (`new AppError(...)` or `new Error("msg", { cause: err })`) upward.
  - **Orchestrators / Boundaries (`actions`, `controllers`, `workers`):** Catch, log the error **once** with full structured context, and return/throw a clean client-safe response.

## 2. Structured Observability (Know Exactly What & When)
- **No Raw `console.log`:** Use the project's shared structured logger (e.g., `pino` or `src/shared/logger`). If none exists, create a single lightweight structured JSON logger wrapper.
- **Mandatory Log Context Fields:** Always pass a structured metadata object first:
  - **On Failure (`logger.error`):** `{ event, action, userId, entityId, durationMs, errorCode, err }`
  - **On Fallback / Retry (`logger.warn`):** `{ event, action, attempt, reason }`
  - **On Critical State Success (`logger.info`):** `{ event, entityId, durationMs }` for major mutations/background jobs.
- **Redaction:** Never log passwords, API keys, tokens, or raw payment details.

## 3. Logical Atomic Git Commits (On-Demand Only)
Never run `git commit` unless explicitly instructed by the user. When asked to commit:
1. **No Bulk Commits:** Run `git status` and `git diff` first. Group modified/untracked files into **separate logical commits** by concern. Always stage explicit file paths (`git add <file1> <file2>`), never blind `git add .`.
2. **Mandatory Commit Message Format (Why + What + Data):**
   ```text
   <type>(<scope>): <concise summary of change in ≤72 chars>

   Why:
   - <Root cause, business reason, or system constraint driving this change>

   What:
   - <Specific modules, functions, or contracts added/modified>

   Context & Verification:
   - Spec / Quirk: <path to .spec.md or QUIRK-ID if applicable>
   - Verified: <exact test command or static check executed>
   ```
3. **ZERO AI Attribution:** Strictly forbidden from including `Co-authored-by:`, `Generated with...`, or any agent/AI signatures in commit messages.

## 4. Changelogs & Release Notes (One File Per Change)
There is no `CHANGELOG.md`. The **entry file is the source of truth**; release notes are generated from the entries added or modified since the previous release boundary. History is append-only.

### Layout
```text
changelog/
  TEMPLATE.md                    # entry template
  YYYY/
    MM/
      YYYY-MM-DD-<slug>.md       # one logical change
release-notes/
  vX.Y.Z.md                      # generated from the entry diff
  .last-release.json             # paths + SHA-256 of covered entries
```

### Entry schema
```markdown
---
title: "Verb-led, user-facing summary"
date: "YYYY-MM-DD"
type: added # added | changed | deprecated | removed | fixed | security
scope: "packages/foo, apps/api"
version: ""   # stamped by the release script
released: ""  # stamped by the release script
breaking: false
highlight: true  # false keeps internal changes out of Highlights
---

## Why
## What
## Verification
## Notes        # optional
## Migration    # required when breaking: true
```

### Bundled implementation
This skill ships a zero-dependency generator at `scripts/release-notes.mjs`. Copy it into the project as `<project>/scripts/release-notes.mjs`, then wire `release-notes` and `release-notes:check` into the package scripts and run the check before every release. Optional `changelog.config.json` supplies `repository`, `license`, `verification`, `install`, and `update` for the generated notes. The generator reads only the changelog entries; it never uses `git log` or commit subjects.

### Write rules
- **One file per logical change**, not per commit and not per release. A release is a set of entries stamped with the same version.
- Use the date the change landed, not the release date. The path date and the `date` field must match.
- **Never edit or delete an entry after its version is stamped.** Correct it with a new entry. The generator rejects changed or deleted released entries.
- `title` is user-facing and verb-led. `scope` lists packages or paths, never prose.
- Every entry needs `Why`, `What`, and `Verification`. A breaking change adds `Migration`.
- Concurrent branches each add their own file. Never resolve a changelog conflict by hand-merging a single file.
- Do not put design docs in entries. Link the spec or ADR; keep the entry to what shipped and why.

### Release sequence
1. Run `release-notes:check` to validate entries and the append-only history.
2. Run the release command. It stamps `version`/`released`, selects entries since the last tag (or manifest), generates `release-notes/vX.Y.Z.md`, updates `.last-release.json`, bumps version markers, commits, tags, and pushes.
3. Publish the GitHub Release from `release-notes/vX.Y.Z.md` with `gh release create --verify-tag --notes-file ...`; the agent runs this locally.
4. Never rewrite a release note or a released entry. Add a new entry instead.

### Required generator behavior
If the project has no generator, use the bundled one rather than writing entries by hand. It must support:
- validate frontmatter, path/date match, required sections, and `Migration` for breaking entries
- determine the boundary from `--baseline`, the latest Git tag, or `.last-release.json`
- select only entries added or modified since that boundary
- reject modifications or deletions of released entries
- generate notes grouped by `type`, with title, scope, `Why`, `What`, `Verification`, and `Migration`
- update `.last-release.json` only after a successful write
- `--check` and `--dry-run`

### Anti-patterns
- A single aggregate changelog edited on every branch (merge conflicts, lost entries).
- Editing or deleting a released entry (history is not append-only anymore).
- Generating notes from commit subjects alone (`fix stuff`, `wip`) with no why or evidence.
- Regenerating old release notes from the current ledger.
- A changelog entry that only restates the diff (`changed file.ts`).
