# Product Tour / Onboarding Tour

## Journal Web Application — Implementation Plan

---

## 1. Objective

Membantu user baru:

- Memahami **alur dasar accounting**
- Mengetahui **fitur inti** aplikasi
- Bisa **langsung mulai bekerja** tanpa membaca dokumentasi panjang

Target:

- Reduce confusion di first login
- Increase feature adoption
- Minimize support tickets dari user baru

---

## 2. Scope & Principles

### Included

- First-time user onboarding
- Step-by-step product tour (tooltip / popover)
- Highlight fitur inti accounting

### Excluded

- Advanced / expert-level tutorial
- Full accounting theory explanation

### Principles

- Non-intrusive (bisa skip)
- Contextual (muncul di halaman terkait)
- One-time by default (bisa replay manual)

---

## 3. Target User

- User baru (first login)
- User existing yang belum menyelesaikan onboarding
- User yang manually trigger “Replay Product Tour”

---

## 4. Onboarding Trigger Logic

### Initial Trigger

- On **first successful login, then visit dashboard**
- Or when `onboarding_completed = false and dashboard visited`

### Manual Trigger

- Button: **Help → Product Tour** under the company switch
- Icon: ❓ / 🎯

---

## 5. Tour Structure (Accounting Context)

### Step 1 — Welcome

- Page: Dashboard
- Message:
  > “Welcome! Let’s take a quick tour to help you set up and manage your accounting.”

Action:

- Start tour
- Skip tour

---

### Step 2 — Chart of Accounts

- Page: Chart of Accounts
- Highlight:
  - Account categories (Asset, Liability, Equity, Income, Expense)
  - Add/Edit account button

Message:

- “Your accounting structure starts here.”

---

### Step 3 — Setting Mapping Account

- Page: Company -> Tab Akun
- Highlight:
  - mapping ASSET & LIABILITY account for journal

Goal:

- Ensure Account data is configured before transactions

---

### Step 4 — Opening Balance

- Page: Opening Balance
- Highlight:
  - Balance input fields
  - Validation info

Goal:

- Teach correct starting balance setup

---

### Step 5 — Transactions

- Page: Transactions / Journal Entry
- Highlight:
  - Add transaction button
  - Debit / Credit fields

Message:

- “Record daily financial activities here.”

---

### Step 6 — Reports

- Page: Reports
- Highlight:
  - Balance Sheet
  - Profit & Loss
  - Cash Flow

Goal:

- Show value output from data input

---

### Step 7 — Completion

- Page: Dashboard
- Message:
  > “You’re all set! Start managing your accounting with confidence.”

Action:

- Finish
- Replay later

---

## 6. UX Behavior

- Tooltip / popover anchored to UI elements
- Step navigation:
  - Next
  - Back
  - Skip
- Auto-scroll to target element
- Responsive (desktop-first, mobile-friendly)

---

## 7. Technical Approach (Frontend)

### Recommended Libraries

- `driver.js`
- `intro.js`
- `shepherd.js`

### State Management

- Store tour state in:
  - LocalStorage (fast)
  - Backend (persistent across devices)

Example flag:

```ts
onboarding_completed: boolean;
onboarding_version: string;
```
