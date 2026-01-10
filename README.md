# Nusa Journal - Developer Setup Guide

Panduan lengkap untuk menjalankan aplikasi Nusa Journal di environment development.

## Prerequisites

### Software Requirements

| Software       | Version | Keterangan                         |
| -------------- | ------- | ---------------------------------- |
| **Node.js**    | v20.x+  | Gunakan `nvm` untuk manage version |
| **PostgreSQL** | 15+     | Database utama                     |
| **npm**        | 10+     | Package manager                    |
| **Git**        | Any     | Version control                    |

### Recommended Tools

- **VS Code** dengan extensions: ESLint, Prettier, Vue - Official
- **TablePlus / DBeaver** untuk database management
- **Postman / Insomnia** untuk API testing

---

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/mraiz/nusa-journal.git
cd journal
```

### 2. Setup Node Version

```bash
nvm use v20.19.4
# atau install jika belum ada:
nvm install v20.19.4
```

### 3. Setup PostgreSQL Databases

Buat 2 database:

```sql
-- Registry Database (global auth & tenant metadata)
CREATE DATABASE nusa_journal_registry;

-- Default Tenant Database (untuk development)
CREATE DATABASE nusa_journal;
```

### 4. Install Dependencies

```bash
# Backend
cd api
npm install

# Frontend
cd ../web
npm install
```

### 5. Environment Configuration

#### Backend (`api/.env`)

```env
# Server
PORT=3002

# Main Database (used for auth/users)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nusa_journal?schema=public"

# Registry Database (tenant metadata)
REGISTRY_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nusa_journal_registry?schema=public"

# Tenant Database Host (for new tenants)
TENANT_DB_HOST=localhost
TENANT_DB_PORT=5432

# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production

# Encryption Key (32 chars for AES-256)
ENCRYPTION_KEY=your-32-character-encryption-key
```

#### Frontend (`web/.env`)

```env
NUXT_PUBLIC_API_BASE=http://localhost:3002
```

### 6. Generate Prisma Clients

```bash
cd api

# Generate main tenant client
npx prisma generate

# Generate registry client
npx prisma generate --schema=prisma/registry/schema.prisma
```

### 7. Run Database Migrations

```bash
cd api

# Migrate registry database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nusa_journal_registry?schema=public" npx prisma migrate deploy --schema=prisma/registry/schema.prisma

# Migrate main tenant database
npx prisma migrate deploy
```

---

## Running the Application

### Development Mode

**Terminal 1 - Backend:**

```bash
cd api
npm run start:dev
# Server runs at http://localhost:3002
```

**Terminal 2 - Frontend:**

```bash
cd web
npm run dev
# App runs at http://localhost:3000
```

### Production Build

```bash
# Backend
cd api
npm run build
npm run start:prod

# Frontend
cd web
npm run build
npm run preview
```

---

## Project Structure

```
journal/
├── api/                    # NestJS Backend
│   ├── prisma/
│   │   ├── schema.prisma       # Tenant DB schema
│   │   └── registry/
│   │       └── schema.prisma   # Registry DB schema
│   ├── src/
│   │   ├── auth/               # Authentication
│   │   ├── company/            # Company management
│   │   ├── tenancy/            # Multi-tenant logic
│   │   ├── account/            # Chart of Accounts
│   │   ├── journal/            # Journal entries
│   │   ├── period/             # Accounting periods
│   │   ├── ledger/             # General ledger
│   │   ├── report/             # Financial reports
│   │   ├── sales/              # Sales invoices
│   │   ├── purchase/           # Purchase bills
│   │   └── payment/            # Payments
│   └── package.json
│
├── web/                    # Nuxt 4 Frontend
│   ├── pages/
│   ├── stores/                 # Pinia stores
│   ├── components/
│   ├── layouts/
│   └── package.json
│
└── docs/                   # Documentation
```

---

## Common Commands

| Command                  | Description                 |
| ------------------------ | --------------------------- |
| `npm run start:dev`      | Start backend in watch mode |
| `npm run dev`            | Start frontend dev server   |
| `npx prisma studio`      | Open Prisma database GUI    |
| `npx prisma migrate dev` | Create new migration        |
| `npx prisma generate`    | Regenerate Prisma client    |

---

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3002
lsof -ti :3002 | xargs kill -9
```

### Prisma Client Not Found

```bash
cd api
npx prisma generate
npx prisma generate --schema=prisma/registry/schema.prisma
```

### Node Version Mismatch

```bash
nvm use v20.19.4
```

### Database Connection Failed

- Pastikan PostgreSQL running
- Cek credentials di `.env`
- Cek database sudah dibuat

---

## API Endpoints Overview

| Method | Endpoint                       | Description                    |
| ------ | ------------------------------ | ------------------------------ |
| POST   | `/auth/register`               | Register user                  |
| POST   | `/auth/login`                  | Login                          |
| GET    | `/companies`                   | List user's companies          |
| POST   | `/companies`                   | Create company (provisions DB) |
| GET    | `/:slug/accounts`              | List Chart of Accounts         |
| POST   | `/:slug/journals`              | Create journal entry           |
| GET    | `/:slug/reports/trial-balance` | Trial Balance                  |
| GET    | `/:slug/reports/profit-loss`   | Profit & Loss                  |
| GET    | `/:slug/reports/balance-sheet` | Balance Sheet                  |

---

## Architecture Notes

- **Multi-Tenancy**: Database-per-tenant (setiap company punya DB sendiri)
- **Authentication**: JWT dengan HTTP-only cookies
- **Frontend State**: Pinia stores
- **Styling**: Tailwind CSS dengan custom design system

Untuk detail arsitektur, lihat `/docs/tenant.md`.
