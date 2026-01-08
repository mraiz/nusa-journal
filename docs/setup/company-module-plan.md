# Company Management Module - Implementation Plan

## Goal

Implement company management with **multi-tenant database provisioning**. Each company creation triggers automatic database provisioning, migrations, and seeding.

## Architecture Integration

```
User Creates Company
    ↓
CompanyService.create()
    ↓
TenantProvisioningService.provisionTenant()
    ├─ Create tenant database
    ├─ Run Prisma migrations
    └─ Seed initial data (COA templates)
    ↓
CompanyUser record created (creator = ADMIN)
    ↓
User can access /:company-slug/...
```

---

## Proposed Changes

### Backend - Company Module

#### [NEW] `src/company/dto/create-company.dto.ts`
```typescript
export class CreateCompanyDto {
  name: string;           // Display name
  slug: string;           // URL slug (auto-generated from name if not provided)
  plan?: 'STARTER' | 'BUSINESS' | 'ENTERPRISE';
}
```

#### [NEW] `src/company/dto/invite-user.dto.ts`
```typescript
export class InviteUserDto {
  email: string;
  role: Role; // ADMIN, ACCOUNTANT, FINANCE, AUDITOR
}
```

#### [NEW] `src/company/company.service.ts`

**Key Methods:**

1. **`createCompany(userId: string, dto: CreateCompanyDto)`**
   - Validate slug uniqueness
   - Call `TenantProvisioningService.provisionTenant()`
   - Wait for provisioning completion
   - Create `Company` record in **registry database**
   - Create `CompanyUser` with creator as ADMIN
   - Create user account in tenant database
   - Return company details

2. **`getUserCompanies(userId: string)`**
   - Query registry for all companies user belongs to
   - Return list with roles

3. **`inviteUser(companyId: string, dto: InviteUserDto)`**
   - Check if user exists in main auth system
   - Create `CompanyUser` with status PENDING
   - Send invitation email (optional)

4. **`approveUser(companyId: string, userId: string)`**
   - Update `CompanyUser` status to APPROVED
   - Create user record in tenant database
   - Grant database access

5. **`removeUser(companyId: string, userId: string)`**
   - Soft delete `CompanyUser`
   - Remove from tenant database (optional)

#### [NEW] `src/company/company.controller.ts`

**Endpoints:**

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/companies` | Create new company + provision DB | JWT |
| GET | `/companies` | List user's companies | JWT |
| GET | `/:tenantSlug/company` | Get current company details | JWT + Tenant |
| POST | `/:tenantSlug/company/invite` | Invite user to company | JWT + Tenant + ADMIN |
| POST | `/:tenantSlug/company/approve/:userId` | Approve user join | JWT + Tenant + ADMIN |
| DELETE | `/:tenantSlug/company/users/:userId` | Remove user from company | JWT + Tenant + ADMIN |
| GET | `/:tenantSlug/company/users` | List company users | JWT + Tenant |

**Note:** `/companies` (no tenant) vs `/:tenantSlug/company/...` (tenant-scoped)

---

### Database Schema Updates

#### Registry Database (Already exists)

```prisma
// In prisma/registry/schema.prisma
model Tenant {
  id     String @id
  slug   String @unique
  name   String
  // ... connection details
}
```

#### Tenant Database (Each company DB)

```prisma
// In prisma/schema.prisma
// Already defined - no changes needed

model Company {
  id   String @id
  name String
  slug String @unique  // Matches tenant slug
  // ... relations
}

model CompanyUser {
  userId    String
  companyId String
  role      Role
  status    CompanyUserStatus
  // ... constraints
}
```

**Key Point:** `Company.slug` in tenant DB must match `Tenant.slug` in registry

---

### Company Creation Flow

```typescript
// 1. User calls POST /companies with { name, slug }

// 2. Backend validates and provisions
const tenantId = await provisioningService.provisionTenant({
  slug: dto.slug,
  name: dto.name,
  plan: dto.plan || 'STARTER'
});

// 3. Get tenant Prisma client
const tenantPrisma = await prismaClientManager.getClient(dto.slug);

// 4. Create company record in TENANT database
const company = await tenantPrisma.company.create({
  data: {
    name: dto.name,
    slug: dto.slug,
  }
});

// 5. Create user record in TENANT database
const tenantUser = await tenantPrisma.user.create({
  data: {
    email: currentUser.email,
    name: currentUser.name,
    // Link to registry user via email
  }
});

// 6. Create CompanyUser relation with ADMIN role
await tenantPrisma.companyUser.create({
  data: {
    userId: tenantUser.id,
    companyId: company.id,
    role: 'ADMIN',
    status: 'APPROVED',
  }
});

// 7. Return company details
return { id: company.id, slug: company.slug, name: company.name };
```

---

### Multi-Company User Flow

#### Scenario: User belongs to 3 companies

**Registry Database:**
- User exists once in auth system

**Tenant Databases:**
- User exists in Company A's database
- User exists in Company B's database  
- User exists in Company C's database

**Each tenant DB has:**
- Local `User` record (email matches registry)
- `CompanyUser` with specific role

**Access Control:**
- URL: `/pt-company-a/journals` → Uses Company A's database
- URL: `/pt-company-b/journals` → Uses Company B's database

---

## Frontend Integration

### [NEW] `web/pages/companies/index.vue`

**Features:**
- List all companies user belongs to
- Create new company button
- Company cards with role badges
- Click to navigate to `/:slug/dashboard`

### [NEW] `web/pages/companies/create.vue`

**Form:**
- Company name input
- Auto-generate slug (editable)
- Plan selection (STARTER/BUSINESS/ENTERPRISE)
- Loading state during provisioning
- Success message with link to dashboard

### [NEW] `web/pages/[companySlug]/settings/users.vue`

**Features:**
- List company users with roles
- Invite user form
- Approve/reject pending invitations
- Remove user action (Admin only)

---

## Verification Plan

### Test Cases

1. **Company Creation**
   - Create company → Verify database provisioned
   - Check registry has tenant record
   - Check tenant DB has company + user records
   - Verify creator has ADMIN role

2. **Multi-Company Access**
   - User creates Company A and Company B
   - List companies → Should see both
   - Access `/company-a/...` → Correct database
   - Access `/company-b/...` → Correct database
   - Verify data isolation

3. **User Invitation**
   - Admin invites user to company
   - Verify `CompanyUser` status = PENDING
   - Approve user
   - Verify status = APPROVED
   - Verify user can access company

4. **Role-Based Access**
   - Create user with ACCOUNTANT role
   - Verify can create journals
   - Verify cannot invite users
   - Verify cannot close periods

---

## Next Steps After Company Module

1. **Chart of Accounts Module** - Seed COA templates during provisioning
2. **Accounting Period Module** - Create initial period on company creation
3. **Journal Module** - Core accounting engine
4. **Dashboard** - Company overview with metrics

---

## Important Notes

> [!WARNING]
> **Database Provisioning Time**
> Provisioning a new tenant database takes 5-10 seconds. UI must show loading state. Consider background processing for production.

> [!IMPORTANT]
> **User Synchronization**
> User records exist in both registry (authentication) and tenant databases (company-specific). Email is the unique identifier across systems.

> [!CAUTION]
> **Company Deletion**
> Deleting a company means dropping the entire tenant database. This is IRREVERSIBLE. Implement soft delete + grace period.
