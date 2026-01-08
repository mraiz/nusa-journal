# Multi-Tenancy Architecture for Nusa Journal

## Overview

Based on the updated requirements, Nusa Journal will implement **multi-tenancy with separate databases** (Database-per-Tenant pattern). This means:

- **Single application** serving all companies
- **Separate PostgreSQL database** for each company/tenant
- **Tenant identification** via URL slug (`/pt-company-slug/...`)
- **Dynamic database connection** based on tenant context

---

## Architecture Pattern

### Database-per-Tenant vs Shared Database

| Aspect | Shared Database (Current) | Separate Databases (Target) |
|--------|--------------------------|------------------------------|
| Data Isolation | Via `companyId` column | Complete isolation |
| Security | Logical separation | Physical separation |
| Scalability | Limited by single DB | Independent scaling |
| Backup/Restore | All companies together | Per company |
| Compliance | Harder (GDPR, data residency) | Easier |
| Complexity | Simpler | More complex |

**Decision**: Switch to **Database-per-Tenant** for better security and compliance.

---

## Implementation Approach

### 1. Tenant Database Registry

Create a **registry database** that tracks all tenant databases:

```typescript
// Registry Database Schema
model Tenant {
  id          String   @id @default(uuid())
  slug        String   @unique // Company slug
  name        String
  dbHost      String   // Database host
  dbName      String   // Database name
  dbUsername  String   // DB credentials (encrypted)
  dbPassword  String   // DB credentials (encrypted)
  status      TenantStatus @default(ACTIVE)
  createdAt   DateTime @default(now())
}

enum TenantStatus {
  ACTIVE
  SUSPENDED
  DELETED
}
```

### 2. Prisma Client Manager

Create a service to manage dynamic Prisma clients per tenant:

**File**: `src/tenancy/prisma-client-manager.service.ts`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaClientManager {
  private clients: Map<string, PrismaClient> = new Map();

  async getClient(tenantSlug: string): Promise<PrismaClient> {
    // Return cached client if exists
    if (this.clients.has(tenantSlug)) {
      return this.clients.get(tenantSlug)!;
    }

    // Fetch tenant database config from registry
    const tenantConfig = await this.getTenantConfig(tenantSlug);
    if (!tenantConfig) {
      throw new NotFoundException(`Tenant ${tenantSlug} not found`);
    }

    // Create new Prisma client with tenant-specific DATABASE_URL
    const databaseUrl = `postgresql://${tenantConfig.dbUsername}:${tenantConfig.dbPassword}@${tenantConfig.dbHost}/${tenantConfig.dbName}?schema=public`;
    
    const client = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });

    await client.$connect();

    // Cache client
    this.clients.set(tenantSlug, client);

    return client;
  }

  async disconnect(tenantSlug: string) {
    const client = this.clients.get(tenantSlug);
    if (client) {
      await client.$disconnect();
      this.clients.delete(tenantSlug);
    }
  }

  private async getTenantConfig(tenantSlug: string) {
    // Query registry database
    // Return { dbHost, dbName, dbUsername, dbPassword }
  }
}
```

### 3. Tenant-Aware Middleware

Extract tenant from URL and inject Prisma client:

**File**: `src/tenancy/tenant.middleware.ts`

```typescript
import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaClientManager } from './prisma-client-manager.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private prismaClientManager: PrismaClientManager) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Extract tenant slug from URL: /pt-company-slug/...
    const pathSegments = req.path.split('/').filter(Boolean);
    const tenantSlug = pathSegments[0];

    if (!tenantSlug) {
      throw new NotFoundException('Tenant slug not found in URL');
    }

    // Get tenant-specific Prisma client
    const prismaClient = await this.prismaClientManager.getClient(tenantSlug);

    // Attach to request for use in controllers
    (req as any).tenantSlug = tenantSlug;
    (req as any).prisma = prismaClient;

    next();
  }
}
```

### 4. Tenant-Aware Prisma Service

Replace global Prisma service with request-scoped service:

**File**: `src/tenancy/tenant-prisma.service.ts`

```typescript
import { Injectable, Inject, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { PrismaClient } from '@prisma/client';

@Injectable({ scope: Scope.REQUEST })
export class TenantPrismaService {
  private prisma: PrismaClient;

  constructor(@Inject(REQUEST) private request: Request) {
    this.prisma = (request as any).prisma;
  }

  get client() {
    return this.prisma;
  }

  // Proxy Prisma methods
  get user() {
    return this.prisma.user;
  }

  get company() {
    return this.prisma.company;
  }

  // ... etc for all models
}
```

### 5. Database Provisioning

When a new company is created:

```typescript
async createTenant(companyData: CreateCompanyDto) {
  // 1. Create database
  const dbName = `nusa_journal_${companyData.slug}`;
  await this.createDatabase(dbName);

  // 2. Run migrations
  await this.runMigrations(dbName);

  // 3. Register in tenant registry
  await this.registryPrisma.tenant.create({
    data: {
      slug: companyData.slug,
      name: companyData.name,
      dbHost: process.env.DB_HOST,
      dbName,
      dbUsername: await this.createDbUser(dbName),
      dbPassword: await this.generateSecurePassword(),
      status: 'ACTIVE',
    },
  });

  // 4. Seed initial data (COA templates, etc.)
  await this.seedTenantDatabase(dbName);
}
```

---

## Migration Strategy

### Option 1: Migrate Existing Data

If you've already started with shared database:

1. Export data per company from current database
2. Create separate database for each company
3. Import company-specific data
4. Update tenant registry
5. Switch application to use tenant manager

### Option 2: Start Fresh

If no production data yet:
1. Remove `companyId` foreign keys from current schema
2. Implement tenant management
3. Create databases on-demand when companies register

---

## Configuration Changes

### Environment Variables

</ **Registry Database** (single):
```env
REGISTRY_DATABASE_URL="postgresql://user:pass@localhost:5432/nusa_journal_registry"
```

**Tenant Databases** (dynamic):
```env
TENANT_DB_HOST="localhost"
TENANT_DB_PORT="5432"
TENANT_DB_USERNAME_PREFIX="nusa_tenant_"
```

---

## Advantages of This Approach

✅ **Complete data isolation** - Each company has its own database  
✅ **Easier compliance** - GDPR, data residency requirements  
✅ **Independent scaling** - Large clients can have dedicated DB servers  
✅ **Simplified backups** - Per-company backup/restore  
✅ **Better security** - SQL injection affects only one tenant  
✅ **Customization** - Different companies can have different schemas if needed  

---

## Challenges & Solutions

| Challenge | Solution |
|-----------|----------|
| Connection pool exhaustion | Implement connection pooling per tenant with limits |
| Migration management | Use Prisma Migrate with tenant iteration script |
| Testing complexity | Use in-memory DBs or Docker containers per test |
| Monitoring | Implement per-tenant metrics and logging |

---

## Implementation Timeline

1. **Week 1**: Build tenant registry and Prisma Client Manager
2. **Week 2**: Implement tenant middleware and request-scoped services
3. **Week 3**: Update all modules to use tenant-aware Prisma
4. **Week 4**: Database provisioning and migration automation
5. **Week 5**: Testing and validation

---

## Code Changes Required

### Remove from Current Implementation

- Global `PrismaService` extending `PrismaClient`
- `companyId` filters in all queries
- Company-based data isolation logic

### Add to Implementation

- Tenant registry database and schema
- `PrismaClientManager` service
- `TenantMiddleware` for URL-based tenant detection
- Request-scoped `TenantPrismaService`
- Database provisioning automation
- Tenant registration workflow

---

## Next Steps

> [!IMPORTANT]
> **Decision Point**
> 
> Do you want to:
> 1. **Continue with current shared database approach** - Simpler, faster to build
> 2. **Implement multi-tenancy with separate databases** - Better isolation, more complex
>
> The current implementation uses a shared database with `companyId` column for data isolation. This is a valid approach for many accounting systems and is simpler to implement.
>
> Multi-database tenancy adds significant complexity but provides better security and compliance. I recommend starting with the current approach and migrating to multi-database later if needed.

**Current Status**: Foundation built with shared database approach.  
**Recommendation**: Validate with shared database first, then migrate to multi-database if requirements demand it.
