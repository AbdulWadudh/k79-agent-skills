---
name: k79-performance-and-db
description: Mandatory database safety (Postgres/Drizzle, Prisma, Mongoose, Redis) and full-stack performance rules. Load when writing DB queries, external API calls, caching, background jobs, or frontend data-fetching/UI lists.
license: MIT
metadata:
  version: "2.4.6"
  source: "AbdulWadudh/k79-agent-skills"
---

# Database Safety & Full-Stack Performance Rules

## 1. Database Query & Schema Safety (Drizzle / Prisma / Mongoose)
- **Select Only Needed Columns:** Never run unbounded `SELECT *` or fetch full ORM documents when only specific fields are needed—especially on list endpoints or tables with large JSON/text/sensitive columns.
- **Zero N+1 Queries:** Never execute DB or Redis calls inside loops (`for`, `.map`, `forEach`). Use `JOIN`, eager loading, or batch lookups (`inArray`, `$in`, `mget`).
- **Cursor Pagination & Hard Limits:** Every list query/endpoint MUST enforce a `limit` (default e.g. 20, hard server ceiling e.g. 100). Prefer cursor-based (keyset) pagination on indexed columns over deep `OFFSET`.
- **Mongoose Read Optimization:** Always append `.lean()` to read-only Mongoose queries.
- **Transactions for Multi-Writes:** Wrap any operation that mutates 2+ tables/collections in a DB transaction (`db.transaction()`). **NEVER** make external HTTP/API calls inside an open DB transaction.
- **Connection Pooling:** Reuse a single shared DB/Redis client pool per process (never instantiate a new client per request).
- **Indexes & Safe Migrations:** Ensure columns in `WHERE`, `JOIN`, and `ORDER BY` are indexed. On large Postgres tables, use `CREATE INDEX CONCURRENTLY`. Never run destructive DB drops/pushes without explicit user approval.

## 2. Backend Async, Caching & External APIs
- **Parallelize Independent Work:** Never chain sequential `await a(); await b();` when `b` does not depend on `a`. Run independent DB/API calls concurrently via `Promise.all()` (or `Promise.allSettled()`).
- **External API Timeouts & Safe Retries:** Every outbound call in `.api.ts` MUST set an explicit timeout (`AbortSignal.timeout(ms)`). Only retry idempotent calls (with exponential backoff + max attempts).
- **Redis Cache-Aside Pattern:** For frequent, slow reads: check Redis -> on miss, query DB -> store in Redis with explicit `TTL`. Invalidate/update cache on writes. If Redis is down, fall back to DB gracefully instead of crashing.
- **Background Queues & AI Streaming:** Offload tasks taking >1s (emails, PDFs, media/bulk jobs) to an idempotent background worker and return `202 Accepted` + `jobId`. Stream LLM/AI responses token-by-token (SSE) with abort support.

## 3. Frontend & Network Performance (When Touching UI)
- **Search Debouncing:** Wrap search/autocomplete inputs in a ~300ms debounce, require ≥2 characters, and cancel stale in-flight requests with `AbortController`.
- **Prevent Duplicate Requests:** Deduplicate in-flight GET requests across components and disable submit buttons while mutations are pending.
- **Images, Fonts & Bundling:** Serve AVIF/WebP with explicit `width`/`height` (zero CLS). Use `loading="lazy"` ONLY below the fold; give the top hero/LCP image `fetchpriority="high"`. Lazy-load heavy below-the-fold/modal components (`import()`) and virtualize lists >100 rows.