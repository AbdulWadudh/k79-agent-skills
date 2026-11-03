---
title: "Adopt caveman and ponytail as opt-in efficiency skills"
date: "2026-11-04"
type: added
scope: "skills/k79-conductor, skills/k79-evidence-and-simplicity, README.md, specs/external-skill-adoption.spec.md"
version: ""
released: ""
breaking: false
highlight: true
---

## Why

The suite carried no rule for token cost. Two third-party skills address it: `caveman` shortens chat prose, `ponytail` shortens the diff. Bundling either would take on their licences and maintenance, and installing either silently would change a user's global skill directory without consent. The suite needed to cooperate with them, ask before touching anything, and make sure neither skill can quietly weaken a k79 rule.

## What

- `k79-conductor` gains **one Phase 2 bullet**: follow an installed `caveman` or `ponytail`, and keep every k79 rule on top. No detection loop, no install offer, no setup text in the task path.
- `k79-evidence-and-simplicity` names `ponytail`'s ladder as the tie-breaker for YAGNI, bounded by the spec gate, the 250-line cap, the 1:2 test ratio, security, and `@quirk:` shields.
- `K79.reminder.md` and `AGENTS.router.md` each gain one line so the rule survives into any project's `AGENTS.md`; the reminder is now thirteen lines.
- `README.md` holds the whole of setup: a section documenting both skills with upstream links and install commands, and bootstrap step 6, which asks once and runs nothing without a yes. Installation lives nowhere else.
- `specs/external-skill-adoption.spec.md` records the precedence table, the one-time-only setup boundary, and the non-goals, including the rejection of RTK command rewriting.

Neither skill is vendored, added to `skills/`, or recorded in `skills-lock.json`.

## Verification

- `node scripts/validate-skills.mjs` — frontmatter, name/version match, and k79 reference resolution pass.
- `node scripts/sync-agents.mjs --check` — the marked block in `AGENTS.md` matches the router template.
- `node scripts/release-notes.mjs --check` — the entry schema and append-only history pass.
- Manual read-through against the nine acceptance criteria in the spec, including the conflict cases (test ratio, `@quirk:` shields, approval questions, persisted artifacts).

## Notes

RTK was evaluated and rejected: an independent paired A/B benchmark measured it at +7.6% tokens, and its docs confirm the gain depends on a rewrite hook that rules-file agents do not have. Ponytail and caveman were measured at −10.3% cost and −8.5% tokens respectively, well below their advertised numbers. The suite treats both as trims, not transformations.

`sync-agents.mjs` manages only the marked router block. The reminder at the top of `AGENTS.md` is a bootstrap-time copy of `K79.reminder.md`, so this entry updates both by hand. Making the check verify the reminder copy is a separate change.
