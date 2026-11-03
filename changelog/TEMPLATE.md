# Changelog entry template

Copy this to `changelog/YYYY/MM/YYYY-MM-DD-<slug>.md`. The date in the path and in
`date` must match. Leave `version` and `released` empty; the release script stamps them.
Entries are the only changelog source: release notes are generated from the diff since the
previous release boundary.

```markdown
---
title: "User-facing, verb-led summary of the change"
date: "YYYY-MM-DD"
type: added # added | changed | deprecated | removed | fixed | security
scope: "packages/foo, apps/api"
version: ""
released: ""
breaking: false
highlight: true
---

## Why

The problem, constraint, or failure mode that forced this change.

## What

What was added, changed, or removed. Name the files, contracts, and behaviours.

## Verification

The exact commands or checks that prove it works.

## Notes

Follow-ups, rejected alternatives, or links to a spec or ADR.

## Migration

Required when `breaking: true`. State exactly what a consumer must change.
```
