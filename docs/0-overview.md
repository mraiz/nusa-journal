# Nusa Journal

Nusa Journal adalah sistem akuntansi berbasis web yang dirancang untuk mendukung **UMKM, Startup, Corporate, dan kebutuhan internal perusahaan** dalam satu fondasi sistem yang konsisten dan scalable.

Sistem ini dibangun dengan pendekatan **accounting-first**, mengikuti standar **PSAK (Indonesia)**, serta menempatkan auditability dan data integrity sebagai prioritas utama.

---

## Prinsip Utama

- Semua pencatatan **berawal dari jurnal umum**
- **Double entry wajib** (Debit = Kredit)
- **Multi-company by design**
- Period lock bersifat final
- Audit trail tidak dapat dihapus
- Lebih mengutamakan **akurasi daripada convenience**
- Support **multi tenancy**, a single application, multiple database; multi-tenancy using NestJS

---

## Target Pengguna

- UMKM
- Startup
- Corporate
- Internal Finance / Accounting Team

---

## Accounting Core Features

### Chart of Accounts (COA)

COA adalah fondasi seluruh sistem akuntansi.

**Struktur akun PSAK:**
- Asset
- Liability
- Equity
- Revenue
- Expense

**Fitur:**
- Support multi-level hierarchy  
  Contoh: `1000 → 1100 → 1110`
- COA dapat dikunci (lock) untuk audit safety
- COA menjadi referensi utama seluruh transaksi
- Perubahan COA setelah lock dibatasi sesuai ACL

---

### Jurnal Umum (Double Entry)

Jurnal umum adalah **nyawa sistem akuntansi**.

**Aturan utama:**
- Setiap jurnal **wajib seimbang** (Debit = Kredit)
- Validasi otomatis sebelum posting
- Jurnal tidak dapat diedit langsung

**Metadata jurnal:**
- Tanggal
- User pencatat
- Company
- Accounting period

**Koreksi kesalahan:**
- Dilakukan melalui **Reverse Journal**
- Tidak ada edit atau delete jurnal

---

### Buku Besar (General Ledger)

Menampilkan mutasi dan saldo per akun.

**Fitur:**
- Mutasi per akun
- Saldo berjalan
- Filter:
  - Tanggal
  - Periode
  - Company

---

### Periode Akuntansi

Periode adalah batas hukum pencatatan.

**Fitur:**
- Open / Close period
- Periode tertutup **tidak bisa menerima jurnal baru**
- Backdate hanya diperbolehkan selama periode masih open
- Period lock adalah kunci audit dan final

---

### Neraca Saldo

**Trial Balance tersedia dalam 3 tahap:**
- Before Adjustment
- After Adjustment
- After Closing

---

### Jurnal Penyesuaian & Penutup

Digunakan pada akhir periode.

**Mencakup:**
- Accrual & deferral
- Penyusutan
- Closing otomatis ke laba ditahan

---

### Laporan Keuangan

**Laporan minimal:**
- Laba Rugi
- Neraca
- Arus Kas (Indirect)
- Perubahan Ekuitas

**Export:**
- PDF
- Excel

Hak export mengikuti hak akses user.

---

## Supporting Operational Features

### Master Data

**Master data yang tersedia:**
- Customer
- Vendor
- Produk / Jasa
- Pajak (PPN, PPh)

**Input data:**
- Manual
- Import Excel
- Optional HRIS Sync (uang only)

---

### Modul Transaksi

Modul operasional untuk user non-akuntan.

**Modul:**
- Penjualan (Invoice)
- Pembelian (Bill)
- Pembayaran & penerimaan
- Kas & Bank

Semua modul **secara otomatis menghasilkan jurnal**.

---

### Pajak

**Fitur pajak:**
- Auto hitung PPN
- Mapping akun pajak
- Laporan pajak periodik

---

### Rekonsiliasi Bank

**Fitur:**
- Cocokkan mutasi bank vs sistem
- Selisih otomatis dicatat sebagai jurnal

---

## Multi Company & User Model

### Multi Company

- Satu user dapat bergabung di banyak company
- Company ditentukan via URL slug

**Contoh:**
- `/pt-media-antar-nusa/...`
- `/pt-nusawork/...`

---

### Join Company

- User join company menggunakan `company_slug`
- **Approval admin wajib**

---

### Role per Company

Satu user dapat memiliki role berbeda di tiap company.

**Contoh:**
- Company A → Finance
- Company B → Admin

---

## Auth, ACL & Audit

### Role Default

- Admin
- Accountant
- Finance
- Auditor (read-only)

---

### ACL Principles

Permission berbasis:
- Company
- Role
- Feature

ACL **enforced di backend** menggunakan NestJS Guard.

---

### Audit Trail

Semua perubahan tercatat:
- Siapa
- Kapan
- Before / After value

Audit log **tidak bisa dihapus selamanya**.

---

## HRIS Integration

### Tujuan

HRIS Sync bersifat **opsional**, bukan sumber data utama.

### Data yang Disinkronkan

- Payroll summary (total)
- Reimbursement
- COA (opsional)

### Catatan

- Tidak sync employee
- Tidak posting otomatis
- Data hanya sebagai referensi pencatatan jurnal

---

## Currency & Exchange Rate

- Support multi currency
- Base currency per company
- Exchange rate source: **Bank Indonesia API**
- Rate disimpan sebagai snapshot per period
- Timing rate configurable:
  - Daily
  - Period-based

---

## Technical Stack

### Frontend
- Nuxt 4
- TypeScript (strict)
- TailwindCSS
- SCSS
- Pinia
- Vitest (config only)

### Backend
- NestJS
- REST API
- ACL via Guard & Decorator

### Database (Recommended)

**PostgreSQL**

**Alasan:**
- ACID strong (penting untuk akuntansi)
- Support transaction & constraint
- Mature untuk financial system

---

## Data & Performance Consideration

- Data volume bervariasi per company
- Reporting berbasis snapshot per period
- Tidak real-time lintas periode

---

## Prinsip Desain Penting

- Semua transaksi berawal dari jurnal
- Tidak ada edit jurnal langsung
- Period lock adalah hukum tertinggi
- Audit > Convenience

---

## Notes

- Jangan berasumsi di luar dokumen ini
- Jika ada ambiguity → tanyakan
- Akuntansi tidak toleran terhadap shortcut

Dokumen ini adalah **single source of truth** untuk implementasi sistem.

---