---
name: k79-evidence-and-simplicity
description: Mandatory rules for evidence-based coding, zero assumptions, radical simplicity (anti-overengineering/YAGNI), universal DRY deduplication (Rule of 2+), and the 2-strike debugging circuit breaker. Load before debugging, exploring unfamiliar code, or designing implementations.
license: MIT
metadata:
  version: "2.4.0"
  source: "AbdulWadudh/k79-agent-skills"
---

# Evidence-Based Engineering & Radical Simplicity Rules

## 1. Zero-Assumption Protocol (Proof Before Code)
Never guess or assume how existing code, schemas, or APIs work.
- **Verify Signatures & Schemas:** Before calling an existing function, DB query, or external API, inspect its exact type definition or file signature. Do not invent parameters or assume fields exist.
- **Cite Your Proof:** When proposing a fix or change, explicitly reference the verifiable proof (`file:line`, compiler output, or failing test log) that justifies the change.
- **Ask When Ambiguous:** If a business requirement has two conflicting interpretations and cannot be proven from the codebase, ask 1 direct question rather than guessing.

## 2. Radical Simplicity (YAGNI) vs. Universal Deduplication (DRY)
Simplicity solves 90% of engineering problems. Balance DRY and YAGNI strictly:
- **DO Deduplicate Repeated Boilerplate & Logic (Rule of 2+):**
  - Whenever **2 or more** places share identical boilerplate, setup, or transformation logic (e.g., 3rd-party API auth/headers like `callStripeApi(endpoint, payload)`, pagination math, error formatting, data mapping, or common query filters) where only the inputs/parameters vary, extract it into a simple, verb-named function.
  - **Placement:** Put feature-internal shared logic in `<feature>/helpers/`, and cross-feature shared logic in `src/shared/helpers/` (or `src/shared/api/`).
- **DO NOT Overengineer (No Speculative Abstractions):**
  - Never write code for hypothetical "future" requirements or unrequested features not in the Spec.
  - Do NOT create classes, factories, builder patterns, or generic plugin wrappers when a plain exported function works.
  - Do NOT extract a single-use 5-line block into a separate file "just in case."
- **Minimum Viable Diff:** When editing existing files, touch the minimum lines required. Never refactor unrelated working code in the same file.

## 3. Scientific Debugging & 2-Strike Circuit Breaker
When an error, test failure, or bug occurs, blind trial-and-error editing is strictly forbidden.
1. **Reproduce & Isolate:** Read the exact error message and stack trace (`file:line`). Trace the data flow to the exact line where actual state diverges from expected state.
2. **Single-Variable Fix:** Change one thing at a time and verify via terminal (`tsc --noEmit` or targeted test).
3. **The 2-Strike Hard Stop:**
   - If **2 consecutive fix attempts** fail to resolve the same error, **STOP EDITING CODE IMMEDIATELY.**
   - **Revert** the failed experimental edits so the codebase remains clean.
   - Report back to the user with:
     1. **Verified Evidence:** Exact error log and what the 2 attempts proved.
     2. **Root Cause Hypothesis:** Why standard fixes failed.
     3. **Actionable Suggestions:** 2 concrete, simple options for how to proceed.