# Changelog

All notable changes to this project are documented here. This project follows [Semantic Versioning](https://semver.org/).

## [0.1.0] - 2026-11-03

### Added

- Initial public release with the `k79-master-engineering` orchestrator and seven domain skills.
- MIT license.
- Global installation and agent linking via `npx skills add` / `bunx skills add`.
- Version markers (`VERSION` and `metadata.version`) so agents can compare installed and latest versions.
- Approval-gated self-update protocol triggered by "update k79-agent-skills".
- Release automation: validation script, changelog generation, annotated tags, and GitHub Releases.

### Fixed

- Skill frontmatter names now match their `k79-*` directories so global installs keep the `k79-` namespace and every router path resolves correctly.
