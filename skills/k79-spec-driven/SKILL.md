---
name: k79-spec-driven
description: Mandatory language-agnostic Spec-Driven Development (SDD) workflow, approval gates, 250-line spec scaling, and @quirk workaround tracking. Load before building features, changing behavior, or writing workarounds in any language.
license: MIT
metadata:
  version: "2.4.5"
  source: "AbdulWadudh/k79-agent-skills"
---

# Spec-Driven Development & Quirk Tracking Rules

## 1. Execution Gate (When to Pause vs. Proceed)
- **New Features / Contract or Logic Changes (STOP & WAIT):**
  1. Read existing `<feature>.spec.md` (or `specs/<use-case>.spec.md`).
  2. Create/update the spec with Goals, Expected Input/Output, Acceptance Criteria, and File Scope Lock.
  3. **STOP** and ask the user to approve the spec. Do NOT write or edit source code files until approved.
- **Small Bug Fixes (AUTO-PROCEED):**
  - If fixing a clear bug, typo, or syntax/type error that does NOT change expected inputs/outputs or add new files, fix the code directly after checking the spec for any `@quirk:` rules.

## 2. Spec Location & 250-Line Scaling Rule
- **Default (≤250 lines):** Single file inside the feature/module directory (`<feature>.spec.md`).
- **Large Features (>250 lines):** Split `<feature>.spec.md` into a `specs/<use-case>.spec.md` subfolder inside that feature/module (matching the exact name of the primary action/handler file). Max **250 lines** per spec file; max **8 files** per `specs/` folder.

## 3. Standard Spec Template (Compact & Actionable)
```markdown
# Spec: <Feature or Use-Case Name>

## 1. Goal & Expected Output
- **Objective:** 1-2 sentences on what this solves.
- **Input Contract:** Exact parameters/payload and validation rules.
- **Expected Output:** Exact return shape, side effects (DB/API/State), and error states.

## 2. Acceptance Criteria (Testable)
**Status:** [OPEN] not started · [WIP] in progress · [DONE] verified with proof · [ASSERTED] wording only, no executable check · [FAILED] · [BLOCKED]
- [OPEN] WHEN <trigger/condition>, THE SYSTEM SHALL <deterministic outcome>.
- [OPEN] IF <invalid input/failure>, THE SYSTEM SHALL return/raise <exact error>.

## 3. File Scope Lock (Blast Radius)
*Agent may ONLY create or edit the source files listed below during implementation:*
- `<path/to/implementation_file_1>`
- `<path/to/implementation_file_2>`

## 4. Active Quirks & Anti-Pattern Exceptions (On-Demand Only)
*Omit this section unless a deliberate workaround/hack exists.*
### [<QUIRK-ID>] — `<file_name>` (`<function_or_block_name>`)
- **Constraint (Why):** Why standard architecture/code failed.
- **Workaround (What):** How this exception works.
- **DO NOT:** What future edits must never change.
```

### 3.1 Status Discipline (every generated spec)

Never use `- [ ]` or `- [x]` in Acceptance Criteria. Every criterion starts with one word marker in brackets, and every spec carries the legend line above them:

- **[OPEN]** — written, not started. The default at approval.
- **[WIP]** — partly implemented; note what remains.
- **[DONE]** — append the exact proof on the same line: `(verified: bun test tests/foo.test.ts)` or `(verified: tsc --noEmit)`.
- **[ASSERTED]** — the rule is in place but nothing can execute it (instruction files, prompts, docs). This is the honest marker for prose rules. Never upgrade it to `[DONE]`.
- **[FAILED]** — append one line naming the cause, then apply the 2-strike rule from `k79-evidence-and-simplicity`.
- **[BLOCKED]** — name what unblocks it.

Reading code is not a check. A criterion with no executed command is `[ASSERTED]`, not `[DONE]`. A criterion left `[OPEN]` after release is stale drift, not a status.

## 4. Inline Quirk Shield (Post-Write Automatic Upsert)
Whenever you write a deliberate workaround or anti-pattern due to system/3rd-party constraints:
1. Add a single-line comment (`// @quirk: <QUIRK-ID> — <reason>. See spec.` or `# @quirk: ...`) directly above the workaround in the source code.
2. Automatically upsert **Section 4** of the corresponding `.spec.md` file immediately after writing the code.