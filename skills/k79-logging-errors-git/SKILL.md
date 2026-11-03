---
name: k79-logging-errors-git
description: Mandatory rules for boundary error handling, structured contextual logging (what/when/why), and logical atomic Git commits without AI attribution. Load when handling errors, adding logs, or creating Git commits.
license: MIT
metadata:
  version: "0.1.0"
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