# Backend Setup & Run Guide

## Prerequisites

- PostgreSQL installed and running
- Node.js 20+ (nvm use 20)
- All dependencies installed (`npm install` in `/api`)

---

## Step 1: Setup Database

Create PostgreSQL databases:

```bash
# Login to PostgreSQL
psql -U postgres

# Create registry database
CREATE DATABASE nusa_journal_registry;

# Create master database (for admin operations)
# Note: The default 'postgres' database can be used as master

# Exit psql
\q
```

---

## Step 2: Configure Environment Variables

Create `.env` file in `/api` directory:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Master Database (for creating tenant databases)
DATABASE_URL="postgresql://postgres:password@localhost:5432/postgres?schema=public"

# Registry Database (for tenant tracking)
REGISTRY_DATABASE_URL="postgresql://postgres:password@localhost:5432/nusa_journal_registry?schema=public"

# Tenant Database Configuration
TENANT_DB_HOST=localhost
TENANT_DB_PORT=5432

# Encryption Key (32 characters for AES-256)
ENCRYPTION_KEY=your-32-character-encryption-key

# JWT Secrets
JWT_ACCESS_SECRET=your-access-secret-key-change-this
JWT_REFRESH_SECRET=your-refresh-secret-key-change-this
JWT_ACCESS_EXPIRATION=7d
JWT_REFRESH_EXPIRATION=30d

# Server
PORT=3001
```

**Important**: Replace `password` with your PostgreSQL password and change the secret keys!

---

## Step 3: Generate Prisma Clients

```bash
cd api

# Generate registry client
npx prisma generate --schema=prisma/registry/schema.prisma

# Move registry client to node_modules (if needed)
# This step might be needed if the client is in prisma/node_modules
# It should create in node_modules/@prisma/registry-client

# Generate tenant client
npx prisma generate
```

---

## Step 4: Run Migrations

```bash
# Migrate registry database
npx prisma migrate dev --schema=prisma/registry/schema.prisma --name init

# Note: Tenant databases will be auto-migrated when companies are created
```

---

## Step 5: Start Backend Server

```bash
# Development mode
npm run start:dev

# Or production build
npm run build
npm run start:prod
```

Server should start on **http://localhost:3001**

---

## Step 6: Test API

```bash
# Health check
curl http://localhost:3001/health

# Should return: OK
```

---

## Quick Start Script

Create `start.sh` in `/api`:

```bash
#!/bin/bash

echo "🔧 Setting up Nusa Journal Backend..."

# Switch to Node 20
source ~/.nvm/nvm.sh
nvm use 20

# Generate Prisma clients
echo "📦 Generating Prisma clients..."
npx prisma generate --schema=prisma/registry/schema.prisma
npx prisma generate

# Run migrations
echo "🗄️  Running migrations..."
npx prisma migrate deploy --schema=prisma/registry/schema.prisma

# Start server
echo "🚀 Starting server..."
npm run start:dev
```

Then run:
```bash
chmod +x start.sh
./start.sh
```

---

## Troubleshooting

### Registry Client Not Found

If you get error about `@prisma/registry-client`:

```bash
# Generate and move client
npx prisma generate --schema=prisma/registry/schema.prisma
mv prisma/node_modules/@prisma/registry-client node_modules/@prisma/
```

### Database Connection Error

- Check PostgreSQL is running: `brew services list` or `systemctl status postgresql`
- Verify credentials in `.env`
- Test connection: `psql -U postgres -d nusa_journal_registry`

### Port Already in Use

Change port in `.env` or kill existing process:
```bash
lsof -ti:3001 | xargs kill -9
```

---

## API Endpoints Available

Once running, you can access:

- `POST /auth/register` - Register user
- `POST /auth/login` - Login
- `POST /companies` - Create company (auto-provisions DB)
- And 30+ other endpoints...

---

## Next Steps After Backend Running

1. Create a user via `/auth/register`
2. Login via `/auth/login`
3. Create a company via `/companies` (will auto-provision database)
4. Access company endpoints via `/:slug/...`

---

## Production Deployment Notes

- Use environment variables for all secrets
- Enable HTTPS in production
- Set `NODE_ENV=production`
- Use process manager (PM2, systemd)
- Enable PostgreSQL SSL connections
- Set up database backups
- Monitor with logging service

---

Backend is ready! 🚀
