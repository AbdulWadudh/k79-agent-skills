---
name: k79-verification-testing
description: Mandatory verification protocol, mirrored tests/ directory structure, anti-mocking rules, adversarial/breaking edge-case testing, and spec acceptance checking. Load before writing tests or marking any coding task complete.
license: MIT
metadata:
  version: "1.0.0"
  source: "AbdulWadudh/k79-agent-skills"
---

# Verification & Testing Rules (Language-Agnostic)

## 1. Mirrored Directory Structure & Limits
All test files MUST live in the top-level `tests/` directory, mirroring `src/` 1-to-1:
- **Source:** `src/features/billing/actions/create-invoice.action.ts` -> **Test:** `tests/features/billing/actions/create-invoice.action.test.ts`
- **Source:** `src/features/billing/helpers/tax-calc.helper.ts` -> **Test:** `tests/features/billing/helpers/tax-calc.helper.test.ts`
- **Size Limit:** Max **250 lines** (300 hard ceiling) per test file. Split large test suites by scenario if needed.

## 2. Anti-Hallucination & Mocking Rules
Never write tautological tests (tests that mock the function being tested or only assert that a mock was called).
- **Helpers (`helpers/`): ZERO MOCKS ALLOWED.** Helpers are pure, stateless functions. Test them with real inputs and assert exact outputs.
- **Orchestrators (`actions/`): Mock ONLY I/O Boundaries.** You MAY mock external 3rd-party calls (`api`) and database layers (`queries`) if a test DB is unavailable. You MUST NEVER mock `helpers` called inside an `action`.

## 3. Mandatory Breaking & Adversarial Tests (1:2 Happy-to-Breaking Ratio)
Happy-path-only test files are strictly forbidden. Every tested function MUST include:
1. **Happy Path (1x):** Valid standard input produces expected output.
2. **Input & Boundary Breaking (≥1x):** Actively try to break the function with empty values (`""`, `[]`, `{}`), `null`/`undefined`, boundary numbers (`0`, `-1`, `NaN`, float traps), malformed payloads, or unauthorized states.
3. **Failure & Downstream Breaking (≥1x for `actions/`):** Simulate `queries` returning `null`/throwing constraint errors, and 3rd-party `api` timing out or returning `4xx/5xx`. Assert exact expected errors and zero partial/corrupt writes.

## 4. Spec-to-Test Traceability & Dual-Mode Execution
Every testable checkbox in `<feature>.spec.md` (`WHEN / IF ... THE SYSTEM SHALL ...`) must map to a real test block before checking off `- [x]`.
- **Mode A — Test Runner Configured:** Run `tsc --noEmit`, write/update the mirrored test in `tests/<path>`, and run ONLY that specific test file (`bun test tests/<path>`).
- **Mode B — Legacy Repo (No Test Infrastructure):** Run `tsc --noEmit`, extract new pure logic into a `.helper` file and verify against valid + breaking inputs, and report which criteria were verified statically vs. at runtime.