# Spec: Acceptance-Criteria Status Markers

## 1. Goal & Expected Output

**Objective:** Replace the `- [ ]` / `- [x]` checkbox in generated specs with six status markers, so a spec records *how* a criterion was satisfied — executed check, wording only, failed, blocked — instead of a binary that flatters itself.

**Markers:**

| Marker | State | Required evidence |
| :--- | :--- | :--- |
| `[OPEN]` | Not started | None. Written, not begun. |
| `[WIP]` | In progress | None. Partly landed. |
| `[DONE]` | Done and verified | The exact command or static check that proved it. |
| `[ASSERTED]` | Wording only | No executable check exists (instruction text, prompts, docs). Say so. |
| `[FAILED]` | Failed | One line naming the cause. |
| `[BLOCKED]` | Blocked | Name what unblocks it. |

**Expected output:** every spec `k79-spec-driven` generates opens its criteria with one legend line and starts each criterion with a bracketed word marker. `[DONE]` never appears without proof on the same line.

## 2. Acceptance Criteria (Testable)

**Status:** [OPEN] not started · [WIP] in progress · [DONE] verified with proof · [ASSERTED] wording only, no executable check · [FAILED] · [BLOCKED]

- [DONE] WHEN `k79-spec-driven` emits its template, THE TEMPLATE SHALL carry one status legend line and marker-led example criteria. (verified: grep `Status:` in `k79-spec-driven/SKILL.md`)
- [ASSERTED] WHEN a criterion is marked [DONE], THE SPEC SHALL name the command or check that proved it on the same line.
- [ASSERTED] WHEN no executable check can prove a criterion, THE SPEC SHALL mark it [ASSERTED] and SHALL NOT mark it [DONE].
- [DONE] WHEN Phase 3 runs, `k79-conductor` SHALL require markers instead of `- [x]`. (verified: grep Phase 3)
- [DONE] WHEN tests trace to criteria, `k79-verification-testing` SHALL require a passing test before [DONE] and allow [ASSERTED] for untestable wording. (verified: grep §4)
- [ASSERTED] WHEN a criterion fails, THE SPEC SHALL carry [FAILED] plus one line naming the cause.
- [DONE] WHEN the update lands, ZERO `- [ ]` or `- [x]` criteria SHALL remain in newly generated spec templates. (verified: grep over `skills/*/SKILL.md`, no matches)

## 3. File Scope Lock (Blast Radius)

| File | Change |
| :--- | :--- |
| `skills/k79-spec-driven/SKILL.md` | Template §2 gains legend + markers; new "Status Discipline" subsection |
| `skills/k79-conductor/SKILL.md` | Phase 3: markers, not `- [x]` |
| `skills/k79-verification-testing/SKILL.md` | §4: test required for `[DONE]`, `[ASSERTED]` allowed for untestable wording |
| `specs/spec-status-markers.spec.md` | This file |
| `changelog/2026/11/2026-11-04-spec-status-markers.md` | New entry |

**Out of scope:** `scripts/validate-skills.mjs` (no new enforcement), retrofitting specs written before this change, `k79-prompt-craft`'s prompt section (prompts are not specs), test-ratio rules.

## 4. Anti-patterns

- `[DONE]` awarded for reading code. Reading is not a check.
- `[ASSERTED]` used to hide an unfinished item. `[ASSERTED]` means the wording exists; `[OPEN]` means it does not.
- `[OPEN]` on a released feature because nobody went back. Stale status is worse than no status.
- Adding a seventh marker for "partially verified". `[WIP]` plus a note covers it.

## 5. Verification

```bash
node scripts/validate-skills.mjs
node scripts/sync-agents.mjs --check
node scripts/release-notes.mjs --check
grep -rn "^- \[ \]\|^- \[x\]" skills/*/SKILL.md
```

Last command must return nothing.
