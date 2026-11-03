---
name: k79-code-structure
description: Mandatory language-agnostic rules for file size limits (250-300 lines), feature folder architecture, strict naming conventions (files, functions, variables, booleans, units), and preventing circular dependencies across all languages. Load before creating files, naming symbols, refactoring, or editing files >220 lines.
license: MIT
metadata:
  version: "2.4.1"
  source: "AbdulWadudh/k79-agent-skills"
---

# Universal Code Structure, Naming & Refactoring Rules (All Languages)

## 1. Hard Numeric Limits (Universal)
- **File Line Limit:** Target **≤250 lines**. **Hard Ceiling: 300 lines.** If an edit pushes any source file >250 lines, split it immediately by responsibility.
- **Folder Density Limit:** Max **8 files** per folder. If any subfolder exceeds 8 files, split the feature into narrower sub-domains (e.g., `billing/` -> `invoicing/`, `refunds/`).
- **NO Re-Export Barrel Files:** Never create barrel files that blindly re-export other modules (`index.ts`/`index.js`, wildcard `__init__.py` dumps, etc.) inside features. Always use direct module imports. *(Note: `src/config/index` for client-safe constants is the sole permitted exception).*

## 2. Feature Directory Blueprint & Scaling Rule
Group code by domain/feature (`src/features/<feature>/` or equivalent root module path):

```text
<root>/features/<feature>/
├── <feature>.spec.md            # Living spec & quirks (if >250L -> specs/<use-case>.spec.md)
├── <feature>.controller.<ext>   # Routes/CLI/entrypoints only (parses input, calls actions)
├── <feature>.types.<ext>        # Types, interfaces, DTOs, schemas, models (if >250L -> types/)
├── <feature>.queries.<ext>      # DB read/write functions only (if >250L -> queries/<verb>.query.<ext>)
├── <feature>.api.<ext>          # 3rd-party HTTP/SDK calls only (if >250L -> api/<verb>.api.<ext>)
├── actions/                     # Backend orchestrators: coordinates queries, api, and helpers
│   └── <verb>-<noun>.action.<ext>
├── components/                  # Frontend UI views/components (presentation only, ≤250L each)
│   └── <ComponentName>.<ext>
├── hooks/                       # Frontend state, effects & client query hooks
│   └── use-<verb>-<noun>.<ext>
└── helpers/                     # Pure, stateless logic/math/formatting (NO DB, API, I/O, or UI state)
    └── <noun>.helper.<ext>
```

- **File-to-Folder Scaling:** Start `<feature>.queries`, `<feature>.api`, and `<feature>.types` as single files. The moment any crosses **250 lines**, convert it into a subfolder (`queries/`, `api/`, `types/`) with verb/noun-named files.

## 3. Strict Naming Conventions (Files, Functions, Variables & Types)
Names must be self-documenting, deterministic, and free of ambiguity.

### 3.1 File & Directory Casing
- **Directories:** Always `kebab-case` (TS/JS/Web) or `snake_case` (Python/Rust/Go). Never use `camelCase` or `PascalCase` folder names.
- **Logic & Backend Files:** `kebab-case` with role suffix in TS/JS (`create-invoice.action.ts`, `tax-calc.helper.ts`) or `snake_case` in Python/Rust/Go (`create_invoice_action.py`).
- **UI Component Files (`.tsx` / `.jsx`):** `PascalCase` matching the exported component (`InvoiceTable.tsx`, `RefundModal.jsx`).

### 3.2 Function & Method Naming (Verb-First Mandate)
Every function/method MUST begin with a precise action verb:
- **Orchestrators (`actions/`):** `createInvoiceAction`, `processRefundAction`, `syncStripeSubscriptionAction`.
- **DB Queries (`queries`):** `getInvoiceById`, `listUnpaidInvoices`, `insertPaymentRecord`, `updateInvoiceStatus`, `deleteExpiredDraft`.
- **External APIs (`api`):** `callStripeApi`, `fetchCurrencyRates`, `sendTransactionalEmail`.
- **Pure Helpers (`helpers/`):** `calculateTaxAndTotals`, `formatCurrency`, `validateRefundWindow`, `mapStripeEventToInvoice`.
- **Forbidden Function Names:** Never use noun-only names (`invoice()`, `tax()`) or vague verbs (`handleData()`, `processInfo()`, `doWork()`, `execute()`).

### 3.3 Variables, Booleans, Units & Types
- **Forbidden Vague Identifiers:** Never use `data`, `res`, `val`, `temp`, `obj`, `info`, `item`, or `flag` as variable names (except short-lived 1-line lambda parameters like `.map(item => item.id)`). Name the exact domain entity (`invoiceRecord`, `stripeResponse`, `pendingOrders`).
- **Booleans:** MUST start with `is`, `has`, `can`, or `should` (e.g., `isInvoicePaid`, `hasValidSignature`, `canIssueRefund`, `shouldRetryRequest`). Never name a boolean `status` or `check`.
- **Collections / Arrays:** Always use descriptive plural nouns (`unpaidInvoices`, `lineItems`), never `invoiceList` or `invoiceArray`.
- **Explicit Units in Numeric Names:** Always suffix numbers that have physical/financial/time units (`timeoutMs`, `cacheTtlSeconds`, `amountCents`, `maxFileSizeBytes`).
- **Types, Interfaces & Constants:**
  - Types/Interfaces/Classes: `PascalCase` (`CreateInvoiceInput`, `InvoiceStatus`). **Never** prefix interfaces with `I` (`IUser` is forbidden; use `User`).
  - Variables & Functions: `camelCase` (TS/JS/Go/Java) or `snake_case` (Python/Rust).
  - Immutable Constants & Env Keys: `UPPER_SNAKE_CASE` (`MAX_RETRY_ATTEMPTS`, `DEFAULT_PAGE_SIZE`).
  - Database Tables & Columns: `snake_case` (`user_id`, `created_at`).

## 4. How to Split Files Crossing 250 Lines
- **Backend / Service Files (>250L):**
  1. Extract pure math, validation, transformations, and formatting into `helpers/<name>.helper.<ext>`.
  2. Extract raw DB queries into `queries/` and external HTTP/SDK calls into `api/`.
  3. Keep only step-by-step workflow orchestration inside `actions/<verb>.action.<ext>`.
- **Frontend / UI Component Files (>250L):**
  1. Extract pure formatting/sorting/filtering math into `helpers/<name>.helper.<ext>`.
  2. Extract state, side-effects, and data-fetching orchestration into `hooks/use-<name>.<ext>`.
  3. Split distinct visual sections (modals, tables, forms) into `components/<SubComponent>.<ext>`.

## 5. Strict One-Way Dependency Flow (Zero Circular Imports)
Imports MUST flow strictly top-to-bottom (Directed Acyclic Graph):
- **Backend:** `controller` -> `actions` -> (`queries` | `api` | `helpers`) -> `types` -> `shared/` -> `config/`
- **Frontend:** `Page / Parent Component` -> `Child Components` & `hooks` -> (`api` | `actions` | `helpers`) -> `types` -> `shared/` -> `config/`

- **Leaf Isolation:** `queries`, `api`, and `helpers` are leaf workers—they MUST NEVER import `actions`, `components`, `hooks`, or each other.
- **Peer Isolation:** An `action` file MUST NEVER import another `action` in the same feature (extract shared logic into `helpers/`). Child components MUST NEVER import parent components.
- **Cross-Feature Sharing:** Other features MAY directly import a specific `action` or `types` file. If a helper, hook, UI component, or 3rd-party API client is needed by 2+ features, promote it to `<root>/shared/`.

## 6. Context-Safe Refactoring Protocol (Compiler-Guided)
After moving, splitting, or renaming any function/module, **DO NOT** blindly read dozens of files to find broken imports. Run the language's fast static checker in the terminal, read the exact `file:line` errors, and update only those specific files:
- **TypeScript / JS:** `tsc --noEmit` (or `bunx tsc --noEmit` / `npx tsc --noEmit` / project linter)
- **Python:** `pyright` / `mypy` / `ruff check`
- **Go:** `go build ./...` / `go vet ./...`
- **Rust:** `cargo check`