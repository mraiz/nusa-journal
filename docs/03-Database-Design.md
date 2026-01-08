# Database Design

Database dirancang dengan prinsip **strong consistency** dan **audit safety**.

---

## Core Tables

- companies
- users
- company_users
- accounts (Chart of Accounts)
- journals
- journal_lines
- accounting_periods
- exchange_rates
- audit_logs

---

## Design Principles

- Semua jurnal bersifat immutable
- Foreign key wajib
- Constraint enforced di database
- Semua transaksi menggunakan database transaction
- multi-tenancy using NestJS

---

## Important Rules

- Tidak boleh delete jurnal
- Period tertutup tidak boleh menerima data baru
- Audit log tidak bisa dihapus
