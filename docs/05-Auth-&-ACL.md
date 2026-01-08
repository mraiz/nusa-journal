# Auth & ACL Flow - JWT Implementation

## 1. Overview

Sistem ini menggunakan **JWT (JSON Web Token)** untuk autentikasi stateless dan kontrol akses berbasis role per company.  
JWT akan mengenkode informasi user, company, dan role untuk setiap request ke API. gunakan HTTP Only cookies untuk menyimpan JWT.

## 2. JWT Structure

### 2.1 Access Token (Short-lived)
- Expiration: 7 hari
- Payload example:

```json
{
  "sub": "user_id",
  "company": "company_id",
  "roles": ["Admin","Finance"],
  "iat": 1670000000,
  "exp": 1670003600
}
```

### 2.2 Refresh Token (Long-lived)
- Expiration: 30 hari
- Payload example:

```json
{
  "sub": "user_id",
  "company": "company_id",
  "iat": 1670000000,
  "exp": 1670003600
}
```

# Authentication & ACL

ACL diterapkan **per company**, bukan global.

---

## Default Roles

- Admin
- Accountant
- Finance
- Auditor (read-only)

---

## ACL Rules

- Satu user bisa punya role berbeda di tiap company
- Semua permission dicek di backend
- Export data mengikuti permission view

---

## Audit Policy

- Semua perubahan tercatat
- Before / After value disimpan
- Tidak bisa dihapus
