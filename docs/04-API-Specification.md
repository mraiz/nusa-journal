# API Specification

Semua API dilindungi oleh authentication & ACL.

---

## Authentication

- POST /auth/register
- POST /auth/login

---

## Company

- POST /companies
- POST /companies/join
- POST /companies/approve-user

---

## Journal

- POST /journals
- POST /journals/reverse
- GET /journals

---

## Notes

- Semua journal posting harus valid secara double entry
- Reverse journal adalah satu-satunya cara koreksi
