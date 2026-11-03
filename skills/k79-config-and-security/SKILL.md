---
name: k79-config-and-security
description: Mandatory rules for the 3-tier configuration architecture, src/config/ client-vs-server barrel isolation, secret protection, cache/auth scoping, and idempotency. Load when adding constants, env vars, settings, auth checks, or payment/create routes.
license: MIT
metadata:
  version: "2.2.1"
  source: "AbdulWadudh/k79-agent-skills"
---

# Configuration Architecture & Security Rules

## 1. The 3-Tier Configuration Law
Every tunable value is declared **once**, in exactly one tier, grouped by domain concern (e.g., `diffusion`, `queues`, `theme`, `image.width`):
1. **Tier 1 — Domain Constants (`src/config/<concern>.ts`):**
   - Pure, immutable, hardcoded domain values safe for both frontend and backend.
   - **Rule of Naming:** A literal earns a named constant ONLY when it crosses a file boundary or is used 2+ times. Single-use literals stay inline in the file that owns them.
2. **Tier 2 — Startup Environment (`src/config/env.ts`):**
   - Infrastructure, endpoints, and secrets. Validated at process startup (fail loud if invalid/missing), immutable afterward.
   - **Single Default Rule:** Defaults live ONCE inside the `env.ts` schema. **NEVER** write a second `??` or `||` fallback at a call site.
   - **Zero Raw Env Reads:** Reading `process.env` or `Bun.env` anywhere outside `src/config/env.ts` is strictly forbidden.
3. **Tier 3 — Runtime Operator Settings (DB/Redis — Only When Spec Requires):**
   - Live-tunable settings changed via admin API without restart. When updated, publish cache invalidation across processes rather than waiting for local cache expiry.

## 2. Client vs. Server `src/config/` Isolation
- **The Isomorphic Barrel (`src/config/index.ts`):** This is the ONLY permitted `index.ts` barrel file in the codebase. It may re-export ONLY pure, client-safe Tier 1 config modules (`diffusion`, `ensemble`, `icons`, `imageEngines`, `memory`, `palettes`, `prompts`, `queues`, `routes`, `rules`, `settings`, `theme`).
- **Server-Only Configs (`src/config/env.ts`, `src/config/paths.ts`):**
  - **NEVER** re-export `env.ts` or `paths.ts` inside `src/config/index.ts`.
  - **NEVER** import `env.ts` or `paths.ts` into any frontend/client component or shared client bundle. Backend files must import them directly (`@/config/env`, `@/config/paths`).
- **Pure Helpers:** Pass config/settings into `helpers/` as function parameters rather than importing `env` inside helpers, keeping helpers 100% pure and testable.

## 3. Core Security & Data Isolation
- **Secrets:** Never store secrets in Tier 1 constants or Tier 3 DB settings. Never include secrets, tokens, or password hashes in API responses, SSR HTML payloads, logs, or OpenTelemetry spans.
- **User-Scoped Caching:** Never cache user-specific data under a shared key. Always prefix Redis Keys with the user/account ID (`user:<id>:<resource>`) and set HTTP `Cache-Control: private` or `no-store` on authenticated responses.
- **Idempotency & Resource Ownership:** Verify resource ownership (`userId` / `accountId` match) in every mutation query/action. Require idempotency keys on payment, charge, and critical creation endpoints/jobs.