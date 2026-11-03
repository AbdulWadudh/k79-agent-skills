---
name: k79-logging-errors-git
description: Mandatory rules for boundary error handling, structured contextual logging (what/when/why), logical atomic Git commits without AI attribution, and changelog/release-note maintenance with one file per change. Load when handling errors, adding logs, creating Git commits, or preparing a release.
license: MIT
metadata:
  version: "0.2.0"
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
Never maintain one growing `CHANGELOG.md` by hand. The **entry file is the source of truth**; the changelog and the release notes are generated from it.

### Layout
```text
changelog/
  YYYY/
    MM/
      YYYY-MM-DD-<slug>.md     # one logical change
CHANGELOG.md                   # generated, never hand-edited
release-notes/
  vX.Y.Z.md                    # generated at release, may be enriched by hand
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
highlight: true  # false keeps internal changes out of release Highlights
---

## Why
## What
## Verification
## Notes
```

### Bundled implementation
This skill ships a zero-dependency generator at `scripts/changelog.mjs` and a `--init` mode. Copy it into the project as `<project>/scripts/changelog.mjs`, run `node scripts/changelog.mjs --init`, then wire `changelog` and `changelog:check` into the package scripts and CI. Optional `changelog.config.json` supplies `repository`, `license`, `verification`, `install`, and `update` for the generated release notes.

### Write rules
- **One file per logical change**, not per commit and not per release. A release is a set of entries stamped with the same version.
- Use the date the change landed, not the release date. The path date and the `date` field must match.
- **Never edit or delete an entry after its version is stamped.** Correct it with a new entry. History is append-only.
- `title` is user-facing and verb-led. `scope` lists packages or paths, never prose.
- Every entry needs `Why` and `Verification`. A future reader must be able to tell what problem it solved and what proved it.
- A breaking change sets `breaking: true` and carries a `## Migration` section.
- Concurrent branches each add their own file. Never resolve a changelog conflict by hand-merging a single monolith.
- Do not put design docs in entries. Link the spec or ADR; keep the entry to what shipped and why.

### Release sequence
1. Confirm every unreleased entry is present and `CHANGELOG.md` is current (run the changelog checker, e.g. `bun run changelog:check`).
2. Run the release command. It must: stamp `version`/`released` on unreleased entries, regenerate `CHANGELOG.md`, generate `release-notes/vX.Y.Z.md` from the same entries, bump version markers, commit, tag, and push.
3. Let CI publish the GitHub Release from `release-notes/vX.Y.Z.md`.
4. Never reset or delete the `Unreleased` section. It is derived from entries with an empty `version`.

### Required generator behavior
If the project has no generator, use the bundled one rather than writing entries by hand. It must support:
- validate (schema, path/date match, required sections)
- generate `CHANGELOG.md` grouped by version and type
- stamp a version onto unreleased entries
- generate release notes from the same entries
- a `--check` mode wired into CI that fails when generated output is stale

### Anti-patterns
- One 2,000-line `CHANGELOG.md` edited on every branch (merge conflicts, lost entries).
- Deleting the unreleased section on release (the record disappears unless duplicated).
- Generating notes from commit subjects alone (`fix stuff`, `wip`) with no why or evidence.
- Two hand-maintained copies of the same release summary.
- A changelog entry that only restates the diff (`changed file.ts`).
