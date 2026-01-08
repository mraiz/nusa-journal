
# Architecture

Dokumen ini menjelaskan arsitektur teknis dan konsep utama sistem.

---

## High Level Architecture

- Frontend: Nuxt 4, Tailwind, TypeScript, Fully Responsive all Device, Eye Caching UI, HTTP Only Cookies for JWT Token
- Backend API: NestJS, TypeScript, Prisma, JWT Token -> use AuthGuard, HTTP Only Cookies, Refresh Token
- Database: PostgreSQL
- multi-tenancy using NestJS

---

## Folder Structure

```
├── api -> for BE
├── web -> for FE
```

## ts.config.json
```json
{
  "extends": "./.nuxt/tsconfig.json",
  "include": ["**/*.ts", "**/*.d.ts", "**/*.tsx", "**/*.vue", "./**/*.ext"],
  "compilerOptions": {
    "target": "esnext",
    "module": "esnext",
    "moduleResolution": "node",
    "jsx": "preserve",
    "sourceMap": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node", "@nuxtjs/composition-api", "vite/client"],
    "allowJs": true,
    "lib": ["esnext", "dom"],
    "paths": {
      "@/*": ["./*"],
      "~/*": ["./*"]
    },
    "isolatedModules": true
  },
  "exclude": ["node_modules", "functions"],
  "plugins": [
    {
      "name": "typescript-vue-plugin"
    }
  ]
}
```

## Core Concepts

### Multi Company
- Company adalah boundary utama data
- Context company ditentukan dari URL slug

### Accounting Flow
- Transaksi → Jurnal
- Jurnal → Buku Besar
- Buku Besar → Laporan

### Snapshot Model
- Reporting berbasis snapshot per accounting period
- Tidak ada recalculation otomatis lintas periode tertutup
