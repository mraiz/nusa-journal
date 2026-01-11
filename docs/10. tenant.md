# Multi-Tenancy Architecture

Nusa Journal implements a **Database-per-Tenant** architecture (SaaS) to ensure data isolation, security, and scalability. This document details how the application handles multiple tenants using a single codebase.

## 1. High-Level Concept

Each "Company" (Tenant) in the system has its **own exclusive database**.
- **Registry Database**: Managed centrally. Stores the list of tenants and their database connection details.
- **Tenant Databases**: One database per company (e.g., `nusa_journal_pt_abc`, `nusa_journal_pt_xyz`). Stores all accounting data (Journals, Accounts, Transactions) for that company.

This approach ensures:
- **Isolation**: Data leak between tenants is impossible at the database level.
- **Scalability**: Large tenants can be moved to dedicated servers easily.
- **Backup/Restore**: Each tenant can be backed up or restored individually.

## 2. Infrastructure Components

### A. Registry Service
- **Role**: The "Gatekeeper".
- **Database**: `nusa_journal_registry` (default).
- **Function**:
    - Authenticates users globally (JWT).
    - Maps `tenantSlug` (from URL) to database credentials.
    - Manages tenant lifecycle (Provisioning, Suspension).

### B. Tenant Middleware (`src/tenancy/tenant.middleware.ts`)
The core routing logic happens here:
1.  **Intercepts Request**: Checks if URL is `/:tenantSlug/...`.
2.  **Registry Lookup**: Queries the Registry DB to find the `Tenant` record matching the slug.
3.  **Client Provisioning**:
    - If found, retrieves the database credentials (Host, Name, User, Password).
    - Instantiates (or retrieves from cache) a `PrismaClient` connected to that **specific tenant database**.
4.  **Context Attachment**: Attaches this client to `request.tenantPrisma`.

### C. Tenant Prisma Service (`src/tenancy/tenant-prisma.service.ts`)
A generic wrapper used by Feature Modules (Journal, Account, etc.).
- **Request Scoped**: Created fresh for each request.
- **Dynamic**: Instead of hardcoding a connection, it uses the client attached by the Middleware.
- **Usage**:
    ```typescript
    constructor(private tenantPrisma: TenantPrismaService) {}
    
    async create() {
       // Automatically connects to the correct DB based on URL
       return this.tenantPrisma.account.create(...);
    }
    ```

## 3. Data Flow Example

User accesses `http://api.nusajournal.com/pt-john-doe/journals`.

1.  **Middleware**:
    - Extracts `pt-john-doe`.
    - Looks up Registry -> Found `dbName: nusa_journal_pt_john_doe`.
    - Connects to Postgres DB `nusa_journal_pt_john_doe`.
2.  **Controller**:
    - Receives request.
    - Calls `JournalService`.
3.  **JournalService**:
    - Uses `TenantPrismaService`.
    - Executes SQL queries against `nusa_journal_pt_john_doe`.
4.  **Result**: User sees only John Doe's data.

## 4. Database Schemas

We maintain two schema definitions:
1.  **Registry Schema** (`prisma/registry/schema.prisma`): Definition for Tenant Metadata.
2.  **Tenant Schema** (`prisma/schema.prisma`): Definition for the Accounting System (Account, Journal, etc.).

*Note: Some tables like `User` and `Company` exist in **BOTH** schemas.*
- **Registry User**: For Login/Auth.
- **Tenant User**: For permissions and Foreign Key relationships within the tenant (e.g., `createdById`). These are synchronized during invitation/signup.

## 5. Current Implementation Status

- **Middleware**: Active and enforcing db switching.
- **Database Provisioning**: Currently handled via CLI/Seed (Auto-provisioning via API is pending).
- **Migration**: Schema changes must be pushed to *all* tenant databases (currently manual via `DATABASE_URL` override).

---
**Summary**: Although valid users use the same application (Frontend/Backend API), their data effectively lives on completely separate islands (Databases), bridged dynamically by the middleware.
