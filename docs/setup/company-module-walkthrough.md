# Company Management Module - Implementation Walkthrough

## Overview

Successfully implemented **Company Management Module** with multi-tenant database provisioning integration. Users can create companies, invite members, manage roles, and switch between multiple company contexts seamlessly.

---

## What Was Implemented

### 1. Data Transfer Objects (DTOs)

#### [CreateCompanyDto](file:///Users/mraiz_/Documents/journal/api/src/company/dto/create-company.dto.ts)

```typescript
{
  name: string;           // Display name (max 100 chars)
  slug?: string;          // Optional URL slug (auto-generated if not provided)  
  plan?: 'STARTER' | 'BUSINESS' | 'ENTERPRISE';
}
```

**Validations:**
- Slug must be lowercase, alphanumeric, hyphens only
- Auto-generated from name if not provided

#### [InviteUserDto](file:///Users/mraiz_/Documents/journal/api/src/company/dto/invite-user.dto.ts)

```typescript
{
  email: string;          // User email
  role: Role;            // ADMIN | ACCOUNTANT | FINANCE | AUDITOR
}
```

---

### 2. Company Service

**File**: [company.service.ts](file:///Users/mraiz_/Documents/journal/api/src/company/company.service.ts)

#### Key Methods

**1. `createCompany(userId, userEmail, userName, dto)`**

**Flow:**
1. Auto-generate slug from name if not provided
2. Check slug uniqueness in registry
3. Provision tenant database via `TenantProvisioningService`
4. Create `Company` record in tenant database
5. Create `User` record in tenant database
6. Create `CompanyUser` with creator as ADMIN
7. Return company details

**Error Handling:**
- On failure: Mark tenant as SUSPENDED
- Cleanup automatically handled

**2. `getUserCompanies(userId, userEmail)`**

**Flow:**
1. Query all ACTIVE tenants from registry
2. For each tenant, check if user exists (by email)
3. Get user's company memberships
4. Return list with roles

**Returns:**
```typescript
[
  {
    id: string,
    name: string,
    slug: string,
    role: Role,
    status: CompanyUserStatus
  }
]
```

**3. `inviteUser(tenantSlug, dto, invitedBy)`**

**Flow:**
1. Get tenant Prisma client
2. Check if user exists in tenant DB (by email)
3. Create user if needed (password empty, auth via registry)
4. Create `CompanyUser` with status PENDING
5. Return invitation details

**4. `approveUser(tenantSlug, userId)`**

**Flow:**
1. Find pending `CompanyUser` record
2. Update status to APPROVED
3. User can now access company

**5. `removeUser(tenantSlug, userId)`**

**Flow:**
1. Soft delete by updating status to REJECTED
2. User loses access to company

**6. `getCompanyUsers(tenantSlug)`**

Returns all company users with status APPROVED or PENDING.

---

### 3. Company Controller

**File**: [company.controller.ts](file:///Users/mraiz_/Documents/journal/api/src/company/company.controller.ts)

#### API Endpoints

| Method | Path | Description | Auth | Role |
|--------|------|-------------|------|------|
| POST | `/companies` | Create new company | JWT | Any |
| GET | `/companies` | List user's companies | JWT | Any |
| GET | `/:tenantSlug/company` | Get company details | JWT + Tenant | Any |
| POST | `/:tenantSlug/company/invite` | Invite user | JWT + Tenant | ADMIN |
| POST | `/:tenantSlug/company/approve/:userId` | Approve user | JWT + Tenant | ADMIN |
| DELETE | `/:tenantSlug/company/users/:userId` | Remove user | JWT + Tenant | ADMIN |
| GET | `/:tenantSlug/company/users` | List users | JWT + Tenant | Any |

**Note:** Routes `/companies` bypass tenant middleware, others are tenant-scoped.

---

### 4. JWT Payload Updates

#### Updated [JwtStrategy](file:///Users/mraiz_/Documents/journal/api/src/auth/strategies/jwt.strategy.ts)

**New Payload:**
```typescript
{
  sub: string;       // user ID
  email: string;     // user email (NEW)
  name: string;      // user name (NEW)
  company: string;   // company ID
  roles: string[];   // user roles
}
```

**Returned to Controllers:**
```typescript
{
  userId: string,
  email: string,    // Now available in @CurrentUser()
  name: string,     // Now available in @CurrentUser()
  companyId: string,
  roles: string[]
}
```

#### Updated [AuthService](file:///Users/mraiz_/Documents/journal/api/src/auth/auth.service.ts)

**generateTokens() method now requires:**
- `userId`
- `email` ← NEW
- `name` ← NEW
- `companyId`
- `roles[]`

All token generation calls updated throughout auth service.

---

### 5. App Module Integration

**Updated**: [app.module.ts](file:///Users/mraiz_/Documents/journal/api/src/app.module.ts)

**Changes:**
1. Import `CompanyModule`
2. Exclude `/companies` from tenant middleware

```typescript
.exclude('health', 'auth/(.*)', 'companies')
```

This allows company creation WITHOUT requiring tenant context.

---

## Usage Examples

### Create Company

```bash
POST /companies
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "name": "PT Media Nusa",
  "plan": "STARTER"
  // slug auto-generated: "pt-media-nusa"
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "PT Media Nusa",
  "slug": "pt-media-nusa",
  "role": "ADMIN",
  "createdAt": "2026-01-08T03:40:00.000Z"
}
```

**Behind the Scenes:**
1. Registry database → Tenant record created
2. PostgreSQL → Database `nusa_journal_pt_media_nusa` created
3. Migrations applied automatically
4. Company + User + CompanyUser records created

---

### List User's Companies

```bash
GET /companies
Authorization: Bearer {jwt_token}
```

**Response:**
```json
[
  {
    "id": "company-id-1",
    "name": "PT Media Nusa",
    "slug": "pt-media-nusa",
    "role": "ADMIN",
    "status": "APPROVED"
  },
  {
    "id": "company-id-2",
    "name": "PT Tech Startup",
    "slug": "pt-tech-startup",
    "role": "ACCOUNTANT",
    "status": "APPROVED"
  }
]
```

---

### Invite User to Company

```bash
POST /pt-media-nusa/company/invite
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "email": "accountant@example.com",
  "role": "ACCOUNTANT"
}
```

**Response:**
```json
{
  "userId": "user-uuid",
  "email": "accountant@example.com",
  "role": "ACCOUNTANT",
  "status": "PENDING"
}
```

---

### Approve User

```bash
POST /pt-media-nusa/company/approve/{userId}
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "userId": "user-uuid",
  "email": "accountant@example.com",
  "role": "ACCOUNTANT",
  "status": "APPROVED"
}
```

---

### List Company Users

```bash
GET /pt-media-nusa/company/users
Authorization: Bearer {jwt_token}
```

**Response:**
```json
[
  {
    "userId": "user-1",
    "email": "admin@company.com",
    "name": "Admin User",
    "role": "ADMIN",
    "status": "APPROVED",
    "joinedAt": "2026-01-01T00:00:00.000Z"
  },
  {
    "userId": "user-2",
    "email": "accountant@example.com",
    "name": "Accountant User",
    "role": "ACCOUNTANT",
    "status": "PENDING",
    "joinedAt": "2026-01-08T03:40:00.000Z"
  }
]
```

---

## Multi-Company User Flow

### Scenario: User Belongs to 3 Companies

**Login Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "company": {
    "id": "company-1-id",
    "name": "PT First Company",
    "slug": "pt-first-company"
  },
  "role": "ADMIN"
}
```

**List Companies:**
- GET `/companies` → Returns all 3 companies

**Access Different Companies:**
- `/pt-first-company/journals` → Company A's database
- `/pt-second-company/journals` → Company B's database
- `/pt-third-company/journals` → Company C's database

**Each company context:**
- Uses separate database
- User has different role per company
- Complete data isolation

---

## Database Architecture

### Registry Database

```sql
tenants table:
- id (uuid)
- slug (unique)
- name
- dbHost, dbPort, dbName
- dbUsername, dbPassword (encrypted)
- status (ACTIVE/SUSPENDED/PROVISIONING)
```

### Tenant Database (Each Company)

```sql
companies table:
- id (uuid)
- name
- slug (matches tenant slug)

users table:
- id (uuid)
- email (unique, matches registry)
- name
- password (empty, auth via registry)

company_users table:
- userId + companyId (composite key)
- role (ADMIN/ACCOUNTANT/FINANCE/AUDITOR)
- status (APPROVED/PENDING/REJECTED)
```

---

## Key Features

✅ **Automatic Provisioning** - Company creation triggers database setup  
✅ **Multi-Company Support** - Users can belong to multiple companies  
✅ **Role-Based Access** - Different roles per company  
✅ **User Invitation** - Email-based invitation system  
✅ **Approval Workflow** - Admin approval required  
✅ **Auto Slug Generation** - URL-friendly slugs from company names  
✅ **JWT Integration** - Email and name in token payload  
✅ **Error Handling** - Automatic cleanup on failures  

---

## Next Steps

### 1. Chart of Accounts Module
- Seed default COA templates during provisioning
- CRUD operations for accounts
- Hierarchy support

### 2. Accounting Period Module
- Create initial period on company creation
- Period management (open/close)

### 3. Journal Module
- Core accounting engine
- Double-entry validation

### 4. Frontend Integration
- Company creation UI
- Company selection page
- User invitation interface

---

## Summary

🎉 **Company Management Module Complete!**

**Capabilities:**
- ✅ Create companies with auto DB provisioning
- ✅ Multi-company membership
- ✅ User invitation & approval
- ✅ Role management per company
- ✅ Tenant context switching

**Ready for:** Chart of Accounts and Journal operations! 🚀
