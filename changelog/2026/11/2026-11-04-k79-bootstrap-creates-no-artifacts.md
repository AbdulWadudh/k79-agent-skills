---
title: "Stop k79 bootstrap and updates from creating changelog entries or specs"
date: "2026-11-04"
type: changed
scope: "skills/k79-conductor, skills/k79-spec-driven, skills/k79-logging-errors-git, README.md"
version: ""
released: ""
breaking: false
highlight: true
---

## Why

Installing the suite into a project, or updating it later, is environment setup. The rules did not say so, and an agent following them literally would write a changelog entry and a spec describing its own install. That puts agent-setup noise into a project's history, where every entry is supposed to describe a product change, and it makes `release-notes:check` treat an install as shippable work.

A changelog entry answers "what changed in this product". A skill install answers "what did the agent configuration do". Mixing them corrupts the record.

## What

- `k79-logging-errors-git` §4 gains the governing rule: an entry records the project's own code, config, or behaviour; bootstrapping or updating the k79 skills produces none.
- `k79-spec-driven` §1 gains an **Environment Setup (NO SPEC)** gate: a k79 bootstrap or update needs no spec and no changelog entry.
- `k79-conductor` Phase 0 states that a suite update writes no changelog entry, spec, or docs commit, and Phase 4 scopes entries to project changes.
- `README.md` carries the same instruction in bootstrap step 5 and in the update sequence, so the rule reaches a project even when the agent only reads the prompt.

Scope is deliberately narrow: k79 bootstrapping and updating. An agent may still write entries for real project work it does while installed.

## Verification

- `node scripts/validate-skills.mjs` — 9 skills, frontmatter and references valid.
- `node scripts/sync-agents.mjs --check` — router block in sync.
- `node scripts/release-notes.mjs --check` — entry schema and append-only history pass.

## Notes

This entry itself is legitimate: it records a change to the suite, which is this repository's product. The rule it adds would forbid an entry only for the act of installing that suite somewhere else.
