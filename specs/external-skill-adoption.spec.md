# Spec: Optional Efficiency Skills (caveman + ponytail)

## 1. Goal & Expected Output

**Objective:** Make the k79 suite cooperate with two external skills — `caveman` (terse prose) and `ponytail` (minimal code) — without bundling them, without installing them, and without letting either weaken a k79 rule.

**Input contract:** A coding session where the agent has loaded `k79-conductor` (or any `k79-*` skill). The agent may or may not have a skill named `caveman` or `ponytail` in its skill list.

**Expected output (per session, deterministic):**

| Detected state | Required behavior |
| :--- | :--- |
| Both present | Follow both: `caveman` governs prose voice, `ponytail` governs solution minimalism. k79 wins every conflict (Section 4). |
| One present | Follow the present one only. Say nothing about the missing one unless asked. |
| Neither present | Do nothing. No offer, no detection, no mention. The task proceeds as plain k79. |
| Installed later | The one-time bootstrap handled it. The next session follows the skill with zero setup prose in the task path. |

**Hard output rules:**
- Zero install commands run from a task path. Installation exists only in the one-time bootstrap prompt, behind an explicit yes.
- Zero edits to the user's global skill directories, `skills-lock.json`, or `AGENTS.md` as a side effect of using either skill.
- The k79 "done" statement (skill loaded, check run, changelog entry) is compressed by caveman, never deleted.

## 2. Acceptance Criteria (Testable)

**Status:** [OPEN] not started · [WIP] in progress · [DONE] verified with proof · [ASSERTED] wording only, no executable check · [FAILED] · [BLOCKED]

- [DONE] WHEN a task runs and neither skill is installed, THE SYSTEM SHALL not offer, mention, or install them. (verified: no `skills add` in task-time docs)
- [DONE] WHEN a task runs, THE SYSTEM SHALL read zero setup, detection, or install prose from `k79-conductor`; that prose SHALL exist only in the README bootstrap prompt. (verified: grep)
- [ASSERTED] WHEN the bootstrap prompt reaches step 6 without an answer, THE SYSTEM SHALL run no `skills add` command.
- [ASSERTED] WHEN `ponytail` is active and the task needs new logic, THE SYSTEM SHALL still write k79-required mirrored tests at the 1:2 happy-to-breaking ratio, not ponytail's "one small test".
- [ASSERTED] WHEN `ponytail` is active and a `// @quirk:` shield exists in scope, THE SYSTEM SHALL keep the shield and SHALL NOT apply "deletion beats addition".
- [ASSERTED] WHEN `caveman` is active, THE SYSTEM SHALL still emit full sentences for approval questions, security warnings, and irreversible-action confirmations.
- [ASSERTED] WHEN `caveman` is active, THE SYSTEM SHALL write commits, changelog entries, specs, and docs in normal prose (caveman scope excludes persisted artifacts).
- [ASSERTED] WHEN a rule conflict is not covered by Section 4, THE SYSTEM SHALL apply the k79 rule and name the conflict in one line.
- [ASSERTED] WHEN any `k79-*` skill is loaded, THE SYSTEM SHALL NOT claim the external skills are enforced; wording SHALL describe them as followed instructions.

## 3. File Scope Lock (Blast Radius)

| File | Change | Size guard |
| :--- | :--- | :--- |
| `specs/external-skill-adoption.spec.md` | New (this file) | ≤ 250 lines |
| `skills/k79-conductor/SKILL.md` | One Phase 2 bullet: follow-if-installed + precedence. No setup, detection, or install prose | stays ≤ 250 lines |
| `skills/k79-evidence-and-simplicity/SKILL.md` | One subsection: ponytail ladder as tie-breaker for YAGNI | stays under current length + 15 lines |
| `skills/k79-conductor/K79.reminder.md` | One added bullet | 13 lines total |
| `skills/k79-conductor/AGENTS.router.md` | Mirror the conductor wording (router non-negotiable) | +4 lines |
| `AGENTS.md` | Reminder copy updated to match `K79.reminder.md`; router block re-synced via `node scripts/sync-agents.mjs --sync` | no unrelated edits |
| `README.md` | Bootstrap step 6 (ask, never auto-install) + one row in the skill table area | targeted edits |
| `changelog/2026/11/2026-11-04-adopt-external-efficiency-skills.md` | New entry | schema-valid |

**Out of scope (do not touch):** `scripts/validate-skills.mjs`, `scripts/release-notes.mjs`, `VERSION`, `package.json` version, the other six `k79-*` skills, `caveman`/`ponytail` upstream repos, RTK.

## 4. Conflict Precedence (the actual contract)

`caveman` owns **how prose reads**. `ponytail` owns **how small the diff is**. `k79-*` owns **process, safety, structure, tests, and records**. Where they meet:

| Topic | Winner | Why |
| :--- | :--- | :--- |
| Prose style in chat | caveman | Voice only; k79 has no style rule. |
| Code minimalism, dependency reuse, stdlib-first | ponytail | Same intent as `k79-evidence-and-simplicity` YAGNI, finer-grained ladder. |
| Spec approval gate before code | k79-spec-driven | ponytail's "smallest change" may not skip the gate. |
| 250-line cap, 8-file cap, naming, DAG imports | k79-code-structure | Structural law; ponytail defers to "structure the codebase already has". |
| Test ratio (1:2), mirrored `tests/`, no mocks in `helpers/` | k79-verification-testing | ponytail's "one small test" is a floor, k79's ratio is the bar. |
| `// @quirk:` shields | k79-spec-driven | Deliberate hacks are protected; "deletion beats addition" stops here. |
| Security/validation/accessibility | both agree (neither cuts) | Stated in both rule sets. |
| Commits, changelog, specs, PR text, docs | neither | caveman's own rule excludes persisted artifacts; ponytail has no say. |
| Approval questions, security warnings, irreversible actions | plain prose | caveman's own "when to break the rules" list. |
| Naming, logging, config isolation, DB rules | k79 | Outside both external skills' scope. |

**Conflict not in this table:** k79 wins, and the agent states the conflict in one line so the user can overrule.

## 5. Where Installation Lives (One-Time, Bootstrap Only)

Installation is setup, not workflow. It exists in exactly one place: **README bootstrap step 6**, run once when a project is bootstrapped.

1. Step 6 checks whether the skills are present.
2. If one is missing, it asks once, in full sentences, with both commands.
3. Nothing runs without an explicit yes.
4. Declined: no re-ask in that bootstrap.

Task-time documents (`k79-conductor`, the reminder, the router) carry no detection, no offer, no command. They carry one rule: if installed, follow them; k79 wins conflicts.

```text
Optional: two external skills cut token cost. caveman trims prose; ponytail trims code.
Install them globally now?

  bunx skills@latest add JuliusBrussee/caveman -g -y
  bunx skills@latest add DietrichGebert/ponytail -g -y
```

This text appears in the README only. It is not a per-task prompt.

## 6. Non-Goals

- Shipping a vendored copy of either skill. Licences and versions stay upstream's.
- Adding `caveman` or `ponytail` to `skills/`, `skills-lock.json`, `VERSION`, or the release notes.
- Auto-detecting or installing on session start, via hooks, or via `sync-agents.mjs`.
- RTK / `rtk init` / command rewriting. Explicitly rejected: measured +7.6% tokens in paired A/B.
- Enforcing any of this. Instruction files are context; the wording must not promise a guarantee.

## 7. Verification

Run before claiming done:

```bash
bun run validate        # frontmatter, name/version match, k79 reference resolution
bun run agents:check    # AGENTS.md router block matches the template
bun run release-notes:check
```

Manual read-through of the added wording against Section 2: `k79-conductor`, the reminder, and the router contain no install commands, while README step 6 is the only offer.

## 8. Risks

| Risk | Mitigation |
| :--- | :--- |
| Two voice/style systems collide and produce garbled output. | caveman sets chat prose only; Section 4 forbids it touching persisted artifacts. |
| Agent re-offers the install on every task. | No task-time document contains an offer. Setup prose lives only in the README bootstrap step. |
| Users assume the external skills are now part of k79 support. | README + conductor state "third-party, not shipped, not enforced". |
| caveman's 20-word rule flattens a spec or changelog. | Persisted artifacts are explicitly out of caveman's scope. |
