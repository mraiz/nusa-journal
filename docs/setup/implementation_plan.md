# Nusa Journal - Implementation Plan

## Goal Description

Implement **Nusa Journal**, a comprehensive accounting system designed for UMKM, Startup, Corporate, and internal company needs. The system is built with an **accounting-first** approach, following **PSAK (Indonesia)** standards, with auditability and data integrity as top priorities.

**Core Principles:**
- All transactions start from the general journal
- Mandatory double-entry (Debit = Credit)
- Multi-company by design
- Period lock is final
- Audit trail cannot be deleted
- **Accuracy over convenience**

---

## User Review Required

> [!IMPORTANT]
> **Multi-Company Architecture**
> The system uses URL slugs for company context (e.g., `/pt-media-antar-nusa/...`). Each user can have different roles in different companies. Please confirm this approach aligns with your infrastructure and routing strategy.

> [!WARNING]
> **Journal Immutability**
> Journals are immutable - no direct edits or deletions allowed. Corrections must be made via **Reverse Journal**. This is strict accounting best practice but may feel restrictive to users. UI messaging must clearly communicate this workflow.

> [!IMPORTANT]
> **Period Lock Enforcement**
> Once an accounting period is closed, no new journals can be posted to that period. This is enforced at the database level. Ensure business processes align with this constraint.

> [!WARNING]
> **Technology Stack Confirmation**
> - Backend: NestJS + TypeScript + Prisma + PostgreSQL
> - Frontend: Nuxt 4 + TypeScript + Tailwind CSS + Pinia
> - Node.js version requirement: Please confirm which version to use (LTS recommended)

---

## Proposed Changes

### Phase 1: Project Foundation & Infrastructure

#### Setup & Configuration

##### [NEW] Project Structure
```
/Users/mraiz_/Documents/journal/
├── api/          # NestJS backend
├── web/          # Nuxt 4 frontend
└── docs/         # Existing documentation
```

##### [NEW] Backend Configuration Files
- [package.json](file:///Users/mraiz_/Documents/journal/api/package.json) - NestJS dependencies
- [tsconfig.json](file:///Users/mraiz_/Documents/journal/api/tsconfig.json) - TypeScript strict mode
- [.env.example](file:///Users/mraiz_/Documents/journal/api/.env.example) - Environment variables template
- [prisma/schema.prisma](file:///Users/mraiz_/Documents/journal/api/prisma/schema.prisma) - Database schema

##### [NEW] Frontend Configuration Files
- [package.json](file:///Users/mraiz_/Documents/journal/web/package.json) - Nuxt 4 dependencies
- [nuxt.config.ts](file:///Users/mraiz_/Documents/journal/web/nuxt.config.ts) - Nuxt configuration
- [tailwind.config.ts](file:///Users/mraiz_/Documents/journal/web/tailwind.config.ts) - Tailwind theming
- [tsconfig.json](file:///Users/mraiz_/Documents/journal/web/tsconfig.json) - As specified in architecture docs

---

### Phase 2: Database & Authentication

#### Database Schema (Prisma)

##### [NEW] [schema.prisma](file:///Users/mraiz_/Documents/journal/api/prisma/schema.prisma)

Core tables to implement:
- `User` - User accounts with hashed passwords and refresh tokens
- `Company` - Multi-tenant company entities with slugs
- `CompanyUser` - Many-to-many with roles per company
- `Account` - Chart of Accounts with PSAK types and hierarchy
- `AccountingPeriod` - Period management with open/close status
- `Journal` - Immutable journal headers
- `JournalLine` - Journal entries (Debit/Credit)
- `ExchangeRate` - Currency snapshots per period
- `AuditLog` - Immutable audit trail
- `Customer`, `Vendor`, `Product`, `Tax` - Master data

**Key Constraints:**
- Foreign keys enforced
- Check constraint: `SUM(journal_lines.debit) = SUM(journal_lines.credit)` per journal
- Unique constraint on company slug
- Soft delete NOT allowed for journals and audit logs

---

#### Authentication Module

##### [NEW] [auth.module.ts](file:///Users/mraiz_/Documents/journal/api/src/auth/auth.module.ts)
- JWT strategy with HTTP-only cookies
- Access token: 7 days expiration
- Refresh token: 30 days expiration
- Token payload: `sub` (user_id), `company`, `roles[]`

##### [NEW] [auth.service.ts](file:///Users/mraiz_/Documents/journal/api/src/auth/auth.service.ts)
- Register user
- Login with JWT generation
- Refresh token rotation
- Logout (clear cookies + invalidate refresh token)

##### [NEW] [auth.controller.ts](file:///Users/mraiz_/Documents/journal/api/src/auth/auth.controller.ts)
- POST `/auth/register`
- POST `/auth/login`
- POST `/auth/refresh`
- POST `/auth/logout`

##### [NEW] [jwt-auth.guard.ts](file:///Users/mraiz_/Documents/journal/api/src/auth/guards/jwt-auth.guard.ts)
- Extract JWT from HTTP-only cookie
- Validate token
- Attach user + company + roles to request

##### [NEW] [roles.decorator.ts](file:///Users/mraiz_/Documents/journal/api/src/auth/decorators/roles.decorator.ts)
- Custom decorator for ACL enforcement

---

### Phase 3: Core Accounting Engine

#### Company Module

##### [NEW] [company.module.ts](file:///Users/mraiz_/Documents/journal/api/src/company/company.module.ts)

##### [NEW] [company.service.ts](file:///Users/mraiz_/Documents/journal/api/src/company/company.service.ts)
- Create company (auto-assign creator as Admin)
- Join company request (pending approval)
- Approve user join
- Assign/remove roles per company

##### [NEW] [company.controller.ts](file:///Users/mraiz_/Documents/journal/api/src/company/company.controller.ts)
- POST `/companies`
- POST `/companies/join`
- POST `/companies/:slug/approve-user`
- GET `/companies/:slug`

---

#### Chart of Accounts Module

##### [NEW] [account.module.ts](file:///Users/mraiz_/Documents/journal/api/src/account/account.module.ts)

##### [NEW] [account.service.ts](file:///Users/mraiz_/Documents/journal/api/src/account/account.service.ts)
- Create account (PSAK validation: Asset, Liability, Equity, Revenue, Expense)
- Multi-level hierarchy (e.g., 1000 → 1100 → 1110)
- Lock account (prevent edits)
- Validate account before journal posting

##### [NEW] [account.controller.ts](file:///Users/mraiz_/Documents/journal/api/src/account/account.controller.ts)
- POST `/companies/:slug/accounts`
- GET `/companies/:slug/accounts`
- PATCH `/companies/:slug/accounts/:id/lock`

---

#### Journal Module (Core of Accounting)

##### [NEW] [journal.module.ts](file:///Users/mraiz_/Documents/journal/api/src/journal/journal.module.ts)

##### [NEW] [journal.service.ts](file:///Users/mraiz_/Documents/journal/api/src/journal/journal.service.ts)
- **Create Journal**: Validate double-entry (Debit = Credit)
- Check period is open
- Validate accounts exist and are not locked
- Create immutable journal + journal lines in transaction
- Auto-log in audit trail
- **Reverse Journal**: Create reversing entry
- Get journal by ID
- List journals with filters (date, period, account)

**Validation Rules:**
```typescript
const totalDebit = journalLines.reduce((sum, line) => sum + line.debit, 0);
const totalCredit = journalLines.reduce((sum, line) => sum + line.credit, 0);
if (totalDebit !== totalCredit) throw new BadRequestException('Debit must equal Credit');
```

##### [NEW] [journal.controller.ts](file:///Users/mraiz_/Documents/journal/api/src/journal/journal.controller.ts)
- POST `/companies/:slug/journals` (requires Accountant/Finance role)
- POST `/companies/:slug/journals/:id/reverse`
- GET `/companies/:slug/journals`
- GET `/companies/:slug/journals/:id`

---

#### Accounting Period Module

##### [NEW] [period.module.ts](file:///Users/mraiz_/Documents/journal/api/src/period/period.module.ts)

##### [NEW] [period.service.ts](file:///Users/mraiz_/Documents/journal/api/src/period/period.service.ts)
- Create period
- Open period
- **Close period** (lock, no new journals allowed)
- Validate journal posting against period status

##### [NEW] [period.controller.ts](file:///Users/mraiz_/Documents/journal/api/src/period/period.controller.ts)
- POST `/companies/:slug/periods`
- PATCH `/companies/:slug/periods/:id/close` (Admin only)

---

### Phase 4: Reporting & Analysis

#### General Ledger Module

##### [NEW] [ledger.service.ts](file:///Users/mraiz_/Documents/journal/api/src/ledger/ledger.service.ts)
- Get account balance (running total)
- Get account transactions with date range
- Calculate balance for Trial Balance

##### [NEW] [ledger.controller.ts](file:///Users/mraiz_/Documents/journal/api/src/ledger/ledger.controller.ts)
- GET `/companies/:slug/ledger/:accountId`

---

#### Financial Reports Module

##### [NEW] [report.service.ts](file:///Users/mraiz_/Documents/journal/api/src/report/report.service.ts)
- **Trial Balance** (Before/After Adjustment, After Closing)
- **Profit & Loss** (Revenue - Expense)
- **Balance Sheet** (Asset = Liability + Equity)
- **Cash Flow** (Indirect method)
- **Equity Changes**
- Export to PDF (use library like `pdfkit`)
- Export to Excel (use library like `exceljs`)

##### [NEW] [report.controller.ts](file:///Users/mraiz_/Documents/journal/api/src/report/report.controller.ts)
- GET `/companies/:slug/reports/trial-balance`
- GET `/companies/:slug/reports/profit-loss`
- GET `/companies/:slug/reports/balance-sheet`
- GET `/companies/:slug/reports/cash-flow`
- GET `/companies/:slug/reports/equity-changes`
- GET `/companies/:slug/reports/:type/export?format=pdf|excel`

---

### Phase 5: Transaction Modules

#### Sales (Invoice) Module

##### [NEW] [sales.service.ts](file:///Users/mraiz_/Documents/journal/api/src/sales/sales.service.ts)
- Create invoice
- **Auto-generate journal**:
  - Debit: Accounts Receivable
  - Credit: Sales Revenue
- Calculate tax (PPN)

##### [NEW] [sales.controller.ts](file:///Users/mraiz_/Documents/journal/api/src/sales/sales.controller.ts)
- POST `/companies/:slug/sales/invoices`
- GET `/companies/:slug/sales/invoices`

---

#### Purchase (Bill) Module

##### [NEW] [purchase.service.ts](file:///Users/mraiz_/Documents/journal/api/src/purchase/purchase.service.ts)
- Create bill
- **Auto-generate journal**:
  - Debit: Expense/Inventory
  - Credit: Accounts Payable

##### [NEW] [purchase.controller.ts](file:///Users/mraiz_/Documents/journal/api/src/purchase/purchase.controller.ts)
- POST `/companies/:slug/purchases/bills`
- GET `/companies/:slug/purchases/bills`

---

#### Payment Module

##### [NEW] [payment.service.ts](file:///Users/mraiz_/Documents/journal/api/src/payment/payment.service.ts)
- Record payment
- **Auto-generate journal**:
  - Debit: Accounts Payable
  - Credit: Cash/Bank

##### [NEW] [payment.controller.ts](file:///Users/mraiz_/Documents/journal/api/src/payment/payment.controller.ts)
- POST `/companies/:slug/payments`

---

### Phase 6: Master Data & Supporting Features

#### Master Data Module

##### [NEW] [customer.controller.ts](file:///Users/mraiz_/Documents/journal/api/src/master-data/customer.controller.ts)
- CRUD for customers
- Import from Excel

##### [NEW] [vendor.controller.ts](file:///Users/mraiz_/Documents/journal/api/src/master-data/vendor.controller.ts)
- CRUD for vendors
- Import from Excel

##### [NEW] [product.controller.ts](file:///Users/mraiz_/Documents/journal/api/src/master-data/product.controller.ts)
- CRUD for products/services

##### [NEW] [tax.controller.ts](file:///Users/mraiz_/Documents/journal/api/src/master-data/tax.controller.ts)
- Configure tax rates (PPN, PPh)

---

#### Currency & Exchange Rate Module

##### [NEW] [exchange-rate.service.ts](file:///Users/mraiz_/Documents/journal/api/src/exchange-rate/exchange-rate.service.ts)
- Fetch rates from **Bank Indonesia API**
- Store snapshots per period
- Multi-currency transaction support

##### [NEW] [exchange-rate.controller.ts](file:///Users/mraiz_/Documents/journal/api/src/exchange-rate/exchange-rate.controller.ts)
- POST `/companies/:slug/exchange-rates/sync` (Admin only)
- GET `/companies/:slug/exchange-rates`

---

#### Audit Log Module

##### [NEW] [audit.service.ts](file:///Users/mraiz_/Documents/journal/api/src/audit/audit.service.ts)
- Log all changes (who, when, before/after)
- **No delete functionality**

##### [NEW] [audit.controller.ts](file:///Users/mraiz_/Documents/journal/api/src/audit/audit.controller.ts)
- GET `/companies/:slug/audit-logs` (Auditor role)

---

### Phase 7: Frontend Application (Nuxt 4)

#### Design System

##### [NEW] [tailwind.config.ts](file:///Users/mraiz_/Documents/journal/web/tailwind.config.ts)
- Custom color palette (avoid plain red/blue/green)
- Dark mode support
- Typography (Google Fonts: Inter recommended)
- Spacing and border radius tokens

##### [NEW] [assets/css/main.css](file:///Users/mraiz_/Documents/journal/web/assets/css/main.css)
- Global styles
- Custom utilities
- Glassmorphism effects
- Smooth animations

---

#### Authentication Pages

##### [NEW] [pages/auth/register.vue](file:///Users/mraiz_/Documents/journal/web/pages/auth/register.vue)
- Premium design with gradients and micro-animations
- Form validation
- Loading states

##### [NEW] [pages/auth/login.vue](file:///Users/mraiz_/Documents/journal/web/pages/auth/login.vue)
- Eye-catching design
- Remember me option
- HTTP-only cookie handling

---

#### Company Management

##### [NEW] [pages/companies/index.vue](file:///Users/mraiz_/Documents/journal/web/pages/companies/index.vue)
- List all companies user belongs to
- Create new company
- Join company flow

##### [NEW] [pages/[companySlug]/dashboard.vue](file:///Users/mraiz_/Documents/journal/web/pages/[companySlug]/dashboard.vue)
- Company-specific dashboard
- Key metrics and charts
- Recent transactions

---

#### Chart of Accounts UI

##### [NEW] [pages/[companySlug]/accounts/index.vue](file:///Users/mraiz_/Documents/journal/web/pages/[companySlug]/accounts/index.vue)
- Hierarchical tree view
- PSAK type grouping
- Lock/unlock accounts

##### [NEW] [components/accounts/AccountForm.vue](file:///Users/mraiz_/Documents/journal/web/components/accounts/AccountForm.vue)
- Create/edit account
- Parent account selection
- Account type validation

---

#### Journal Entry UI

##### [NEW] [pages/[companySlug]/journals/create.vue](file:///Users/mraiz_/Documents/journal/web/pages/[companySlug]/journals/create.vue)
- **Double-entry form with live balance validation**
- Account selection with search
- Date picker with period validation
- Real-time Debit = Credit check
- Clear error messages

##### [NEW] [pages/[companySlug]/journals/index.vue](file:///Users/mraiz_/Documents/journal/web/pages/[companySlug]/journals/index.vue)
- List journals with filters
- Reverse journal action
- View journal details modal

##### [NEW] [components/journals/JournalLineInput.vue](file:///Users/mraiz_/Documents/journal/web/components/journals/JournalLineInput.vue)
- Reusable journal line component
- Account autocomplete
- Debit/Credit input

---

#### Financial Reports UI

##### [NEW] [pages/[companySlug]/reports/trial-balance.vue](file:///Users/mraiz_/Documents/journal/web/pages/[companySlug]/reports/trial-balance.vue)
- Interactive table
- Export to PDF/Excel

##### [NEW] [pages/[companySlug]/reports/profit-loss.vue](file:///Users/mraiz_/Documents/journal/web/pages/[companySlug]/reports/profit-loss.vue)
- Hierarchical revenue/expense breakdown
- Period comparison

##### [NEW] [pages/[companySlug]/reports/balance-sheet.vue](file:///Users/mraiz_/Documents/journal/web/pages/[companySlug]/reports/balance-sheet.vue)
- Asset = Liability + Equity visualization

---

#### Transaction Modules UI

##### [NEW] [pages/[companySlug]/sales/invoices/create.vue](file:///Users/mraiz_/Documents/journal/web/pages/[companySlug]/sales/invoices/create.vue)
- Invoice form with line items
- Customer selection
- Tax calculation preview
- Show auto-generated journal preview

##### [NEW] [pages/[companySlug]/purchases/bills/create.vue](file:///Users/mraiz_/Documents/journal/web/pages/[companySlug]/purchases/bills/create.vue)
- Bill form with line items
- Vendor selection
- Show auto-generated journal preview

---

#### State Management (Pinia)

##### [NEW] [stores/auth.ts](file:///Users/mraiz_/Documents/journal/web/stores/auth.ts)
- User state
- Login/logout/refresh actions
- HTTP-only cookie handling

##### [NEW] [stores/company.ts](file:///Users/mraiz_/Documents/journal/web/stores/company.ts)
- Current company context
- Company switching
- User role in current company

##### [NEW] [stores/journal.ts](file:///Users/mraiz_/Documents/journal/web/stores/journal.ts)
- Journal creation state
- Validation logic

---

#### Responsive Design

All pages must be fully responsive:
- Mobile: Single column, bottom nav
- Tablet: Two columns, sidebar
- Desktop: Multi-column layouts, fixed sidebar

**Breakpoints:**
- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px
- 2xl: 1536px

---

## Verification Plan

### Automated Tests

#### Backend (NestJS + Jest)

```bash
# Unit tests for core services
npm run test

# E2E tests for critical flows
npm run test:e2e
```

**Test Cases:**
1. **Double-entry validation**: Create journal with unbalanced entries → should fail
2. **Period lock**: Post journal to closed period → should fail
3. **Journal immutability**: Attempt to edit/delete journal → should fail
4. **ACL enforcement**: Non-admin tries to close period → should fail 403
5. **Multi-company isolation**: User A cannot access Company B's data
6. **Auto-journal generation**: Create invoice → verify journal created correctly
7. **Reverse journal**: Verify reversing entry created with opposite signs

#### Frontend (Vitest - config only)

```bash
# Unit tests for stores and utilities
npm run test
```

**Test Cases:**
1. Balance validation in journal form
2. Company context switching
3. HTTP-only cookie handling

---

### Manual Verification

#### Flow 1: User Onboarding & Multi-Company
1. Register new user
2. Create Company A (user auto-assigned as Admin)
3. Create Company B
4. Navigate to `/pt-company-a/dashboard` → verify correct company context
5. Switch to `/pt-company-b/dashboard` → verify context switches

#### Flow 2: Chart of Accounts Setup
1. Create Asset account (1000 - Cash)
2. Create sub-account (1100 - Bank Account)
3. Create Revenue account (4000 - Sales Revenue)
4. Lock account → verify edit disabled

#### Flow 3: Double-Entry Journal
1. Navigate to Journal Create page
2. Add line: Debit Cash 1,000,000
3. Add line: Credit Sales Revenue 1,000,000
4. Submit → verify success
5. Attempt to create unbalanced journal → verify error message
6. View journal list → verify immutability (no edit/delete buttons)

#### Flow 4: Period Close & Lock
1. Create Accounting Period (Jan 2026, status: Open)
2. Post journal to Jan 2026 → success
3. Close period
4. Attempt to post journal to Jan 2026 → verify error
5. Verify period status UI shows "Closed"

#### Flow 5: Financial Reports
1. Post multiple journals (revenue + expenses)
2. Generate Trial Balance → verify totals balance
3. Generate Profit & Loss → verify Revenue - Expense = Net Income
4. Generate Balance Sheet → verify Asset = Liability + Equity
5. Export to PDF → verify file downloaded
6. Export to Excel → verify file format correct

#### Flow 6: Auto-Journal from Invoice
1. Navigate to Sales → Create Invoice
2. Select customer
3. Add line item (Product X, 1,000,000 + 10% PPN)
4. Submit invoice
5. Navigate to Journals → verify auto-created journal:
   - Debit: Accounts Receivable 1,100,000
   - Credit: Sales Revenue 1,000,000
   - Credit: PPN Output 100,000

#### Flow 7: ACL Testing
1. Login as Admin of Company A
2. Verify can close periods
3. Create user without Finance role
4. Login as that user
5. Attempt to create journal → verify 403 Forbidden
6. Verify can view reports (Auditor role)

#### Flow 8: Responsive Design
1. Open app on mobile (375px width)
2. Verify navigation is accessible
3. Verify journal form is usable
4. Verify reports are readable
5. Test on tablet (768px)
6. Test on desktop (1440px)

---

### Browser Testing

Use the browser tool to validate:
- Login flow with HTTP-only cookies
- Company switching via URL
- Journal form validation (real-time balance check)
- Report generation and export
- Mobile responsiveness

---

### Performance Testing

1. Create 1,000 journals
2. Generate Trial Balance → should complete in < 3 seconds
3. Filter journals by date range → should complete in < 2 seconds
4. Load General Ledger for account with 500 transactions → should complete in < 2 seconds

---

## Implementation Phases

**Recommended approach:**
1. **Phase 1-2**: Foundation & Auth (Week 1-2)
2. **Phase 3**: Core Accounting (Week 3-4)
3. **Phase 4**: Reporting (Week 5)
4. **Phase 5**: Transaction Modules (Week 6)
5. **Phase 6**: Master Data & Integration (Week 7)
6. **Phase 7**: Frontend UI (Week 8-10)
7. **Testing & Polish** (Week 11-12)

---

## Notes

- Prioritize **backend accuracy** over frontend polish initially
- Test double-entry enforcement rigorously
- Ensure audit trail captures ALL changes
- Use database transactions for all journal postings
- Consider snapshot-based reporting for performance
- Plan for export functionality early (PDF/Excel libraries)

This is a **complex, mission-critical system**. Accounting errors are unacceptable. Every financial calculation must be verified against PSAK standards.

