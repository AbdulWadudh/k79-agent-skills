---
title: "Replace spec checkboxes with six verification status markers"
date: "2026-11-04"
type: changed
scope: "skills/k79-spec-driven, skills/k79-conductor, skills/k79-verification-testing, specs/spec-status-markers.spec.md"
version: ""
released: ""
breaking: false
highlight: true
---

## Why

`- [ ]` and `- [x]` record one bit: touched or not. That bit lies in the most common case. An agent that reads the wording it just wrote marks a criterion complete, and the spec then claims verification that never ran. Instruction-file rules have no executable check at all, so they could never earn an honest `[x]`.

The suite needed a status that can say "the rule exists but nothing can test it" — otherwise every prose rule is either falsely complete or permanently open.

## What

- `k79-spec-driven` §3 template now ships a marker legend and marker-led example criteria, plus a new §3.1 **Status Discipline** defining all six markers and the evidence each one requires.
- `k79-conductor` Phase 3 marks criteria with the legend and requires the proof command on the `[DONE]` line; a rule no check can execute stays `[ASSERTED]`.
- `k79-verification-testing` §4 requires a passing test before `[DONE]`, allows `[ASSERTED]` for untestable wording, and bans `- [x]`.
- `specs/spec-status-markers.spec.md` records the contract, the anti-patterns, and the non-goals.

Markers: [OPEN] not started · [WIP] in progress · [DONE] verified with proof · [ASSERTED] wording only · [FAILED] · [BLOCKED].

## Verification

- `node scripts/validate-skills.mjs` — 9 skills, frontmatter and references valid.
- `node scripts/sync-agents.mjs --check` — router block unchanged and in sync.
- `node scripts/release-notes.mjs --check` — entry schema and append-only history pass.
- `grep -rn "^- \[ \]\|^- \[x\]" skills/*/SKILL.md` — returns nothing.

## Notes

No validator rule was added, so nothing enforces the markers; this is instruction text. The honest marker for that limitation is `[ASSERTED]`, which is exactly what the change introduces. Specs written before this entry are not retrofitted.
