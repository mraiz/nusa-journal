# Journal Module - Walkthrough

## Overview

Implemented **Journal Module** - the core accounting engine with strict double-entry validation, immutability, and PSAK compliance.

---

## Key Features

✅ **Double-Entry Validation** - Debit MUST equal Credit  
✅ **Immutable Storage** - Journals cannot be edited or deleted  
✅ **Reversal Mechanism** - Corrections via reversing entries  
✅ **Auto Numbering** - Sequential JV000001, JV000002...  
✅ **Period Enforcement** - Cannot post to closed periods  
✅ **Account Locking** - Validates accounts are active  
✅ **Database Transactions** - Atomic operations  

---

## Implementation

### 1. DTOs

#### [CreateJournalDto](file:///Users/mraiz_/Documents/journal/api/src/journal/dto/create-journal.dto.ts)

```typescript
{
  date: Date;
  description: string;
  reference?: string;
  lines: JournalLineDto[];  // Min 2 lines required
}

JournalLineDto {
  accountId: string;
  debit: number | string;
  credit: number | string;
  description?: string;
}
```

**Validations:**
- Minimum 2 lines (debit & credit)
- Each line must have debit OR credit (not both)
- Date is required

---

### 2. Journal Service

**File**: [journal.service.ts](file:///Users/mraiz_/Documents/journal/api/src/journal/journal.service.ts)

#### Key Validations in `createJournal()`

**1. Period Check**
```typescript
- Find period for journal date
- Reject if no period exists
- Reject if period is CLOSED
```

**2. Account Validation**
```typescript
- All accounts must exist
- All accounts must be unlocked (isLocked = false)
```

**3. Double-Entry Validation**
```typescript
totalDebit = sum of all debit lines
totalCredit = sum of all credit lines

if (totalDebit !== totalCredit) {
  throw BadRequestException
}
```

**4. Line Validation**
```typescript
Each line must have:
- Either debit > 0 OR credit > 0
- Not both debit AND credit
```

**5. Auto Numbering**
```typescript
- Get last journal number
- Increment by 1
- Format: JV + 6 digits (JV000001)
```

**6. Transaction Safety**
```typescript
await prisma.$transaction(async () => {
  - Create journal
  - Create all journal lines
  - Return complete journal
})
```

#### Methods

| Method | Purpose |
|--------|---------|
| `createJournal()` | Create new journal with validation |
| `getJournals()` | List with filters (date, account, reference) |
| `getJournal()` | Get single journal with full details |
| `reverseJournal()` | Create reversing entry |

---

### 3. Journal Controller

**File**: [journal.controller.ts](file:///Users/mraiz_/Documents/journal/api/src/journal/journal.controller.ts)

| Method | Path | Description | Roles |
|--------|------|-------------|-------|
| POST | `/:tenantSlug/journals` | Create journal | ADMIN, ACCOUNTANT, FINANCE |
| GET | `/:tenantSlug/journals` | List journals | All |
| GET | `/:tenantSlug/journals/:id` | Get journal details | All |
| POST | `/:tenantSlug/journals/:id/reverse` | Reverse journal | ADMIN, ACCOUNTANT, FINANCE |

---

## API Examples

### Create Journal (Cash Sales)

```bash
POST /pt-company/journals
Content-Type: application/json

{
  "date": "2026-01-08",
  "description": "Cash sales - January 2026",
  "reference": "INV-2026-001",
  "lines": [
    {
      "accountId": "{cash-account-id}",
      "debit": "1000000",
      "credit": "0",
      "description": "Cash received"
    },
    {
      "accountId": "{sales-revenue-id}",
      "debit": "0",
      "credit": "1000000",
      "description": "Sales revenue"
    }
  ]
}
```

**Response:**
```json
{
  "id": "uuid",
  "journalNumber": "JV000001",
  "date": "2026-01-08T00:00:00.000Z",
  "description": "Cash sales - January 2026",
  "reference": "INV-2026-001",
  "period": {
    "id": "period-uuid",
    "name": "January 2026"
  },
  "totalDebit": 1000000,
  "totalCredit": 1000000,
  "isReversed": false,
  "lines": [
    {
      "id": "line-uuid-1",
      "account": {
        "id": "...",
        "code": "1110",
        "name": "Cash in Hand",
        "type": "ASSET"
      },
      "debit": 1000000,
      "credit": 0,
      "description": "Cash received"
    },
    {
      "id": "line-uuid-2",
      "account": {
        "id": "...",
        "code": "4100",
        "name": "Sales Revenue",
        "type": "REVENUE"
      },
      "debit": 0,
      "credit": 1000000,
      "description": "Sales revenue"
    }
  ],
  "createdAt": "2026-01-08T04:00:00.000Z"
}
```

---

### List Journals

```bash
GET /pt-company/journals
```

**Response:**
```json
[
  {
    "id": "...",
    "journalNumber": "JV000001",
    "date": "2026-01-08",
    "description": "Cash sales - January 2026",
    "reference": "INV-2026-001",
    "period": "January 2026",
    "totalDebit": 1000000,
    "totalCredit": 1000000,
    "isReversed": false,
    "linesCount": 2,
    "createdBy": "John Doe",
    "createdAt": "2026-01-08T04:00:00.000Z"
  }
]
```

---

### Filter Journals

**By Date Range:**
```bash
GET /pt-company/journals?startDate=2026-01-01&endDate=2026-01-31
```

**By Account:**
```bash
GET /pt-company/journals?accountId={account-uuid}
```

**By Reference:**
```bash
GET /pt-company/journals?reference=INV-2026
```

---

### Get Journal Details

```bash
GET /pt-company/journals/{id}
```

**Response includes:**
- Full journal info
- All lines with account details
- Period information
- Creator information
- Reversal status

---

### Reverse Journal

```bash
POST /pt-company/journals/{id}/reverse
```

**What Happens:**
1. Validate original journal exists
2. Check not already reversed
3. Check period still open
4. Create new journal with:
   - Opposite debit/credit (swap)
   - Description: "REVERSAL: {original description}"
   - Current date
5. Mark original as `isReversed = true`

**Response:**
```json
{
  "message": "Journal reversed successfully",
  "originalJournal": {
    "id": "...",
    "journalNumber": "JV000001"
  },
  "reversingJournal": {
    "id": "...",
    "journalNumber": "JV000002",
    "date": "2026-01-08T04:10:00.000Z"
  }
}
```

**Reversal Example:**

Original Journal (JV000001):
```
Debit  Cash         1,000,000
Credit Sales Revenue 1,000,000
```

Reversing Journal (JV000002):
```
Debit  Sales Revenue 1,000,000
Credit Cash          1,000,000
```

**Net Effect:** Zero impact (original + reversal = 0)

---

## Validation Rules

### 1. Double-Entry Balance

```typescript
✅ Valid:
Debit:  1,000,000
Credit: 1,000,000

❌ Invalid:
Debit:  1,000,000
Credit:   900,000
// Error: "Debit (1000000) must equal Credit (900000)"
```

### 2. Line Validation

```typescript
✅ Valid:
{ debit: 1000000, credit: 0 }
{ debit: 0, credit: 1000000 }

❌ Invalid:
{ debit: 1000000, credit: 500000 }
// Error: "Journal line cannot have both debit and credit"

{ debit: 0, credit: 0 }
// Error: "Journal line must have either debit or credit"
```

### 3. Minimum Lines

```typescript
❌ Invalid: 1 line
// Error: "Journal must have at least 2 lines (debit and credit)"

✅ Valid: 2+ lines
```

### 4. Period Enforcement

```typescript
❌ No period for date
// Error: "No accounting period found for date 2026-01-08"

❌ Period is CLOSED
// Error: "Cannot post journal to closed period: January 2026"
```

### 5. Account Locking

```typescript
❌ Account is locked
// Error: "Cannot post to locked account: 1110 - Cash in Hand"
```

---

## Accounting Principles

### Immutability

**Rule:** Journals CANNOT be edited or deleted

**Why:**
- Audit trail integrity
- PSAK compliance
- Historical accuracy

**How to Fix Errors:**
1. Reverse original journal
2. Create correct journal

### Double-Entry

**Rule:** Every transaction has two sides

**Example - Purchase Equipment:**
```
Debit  Equipment (Asset)      10,000,000
Credit Bank Account (Asset)   10,000,000
```

**Accounting Equation:**
```
Assets = Liabilities + Equity

Debit increases: Assets, Expenses
Credit increases: Liabilities, Equity, Revenue
```

### PSAK Compliance

- All journals must balance
- Audit trail for all changes
- Period locking enforced
- No backdating to closed periods

---

## Error Handling

| Error | HTTP Code | Meaning |
|-------|-----------|---------|
| Period not found | 400 | No accounting period for date |
| Period closed | 403 | Cannot post to closed period |
| Debit ≠ Credit | 400 | Double-entry validation failed |
| Account locked | 400 | Cannot use locked account |
| Already reversed | 400 | Journal already has reversal |

---

## Next Steps

**Module Complete!** Ready for:
- ✅ Accounting Period Module (create/open/close periods)
- ✅ General Ledger (account balances and transactions)
- ✅ Financial Reports (Trial Balance, P&L, Balance Sheet)

---

## Summary

🎉 **Journal Module Complete!**

**Core Features:**
- ✅ Double-entry validation
- ✅ Immutable storage
- ✅ Reversal mechanism
- ✅ Auto numbering
- ✅ Period enforcement
- ✅ Transaction safety

**Build Status:** ✅ Successful

**Next:** Accounting Periods or Reporting! 🚀
