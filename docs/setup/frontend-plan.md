# Frontend Implementation Plan - Nusa Journal

## Goal

Implement **Nuxt 4 frontend** for Nusa Journal with premium UI, complete backend integration, and full responsive design.

---

## Technology Stack

- **Framework**: Nuxt 4 + Vue 3 + TypeScript
- **Styling**: Tailwind CSS + SCSS
- **State**: Pinia
- **Icons**: Heroicons (via @heroicons/vue)
- **HTTP**: $fetch (Nuxt built-in)
- **Fonts**: Inter (Google Fonts)

---

## Phase 1: Design System & Base Setup

### Update Dependencies

```bash
npm install @heroicons/vue @vueuse/core
```

### [MODIFY] `tailwind.config.ts`

Add custom theme colors, spacing, and animations.

### [NEW] `assets/css/main.css`

Define CSS custom properties, glassmorphism utilities, and global animations.

### [NEW] `types/index.ts`

TypeScript interfaces for API responses.

---

## Phase 2: Authentication

### [NEW] `stores/auth.ts`

Pinia store for authentication state:
```typescript
- state: { user, isAuthenticated, loading }
- actions: { login(), register(), logout(), checkAuth() }
- getters: { userRole, userEmail }
```

### [NEW] `pages/auth/login.vue`

Premium login page with:
- Email/password fields with validation
- Loading states with smooth transitions
- Error handling with toast notifications
- HTTP-only cookie integration
- Redirect to company selection on success

### [NEW] `pages/auth/register.vue`

Premium register page matching login aesthetics.

### [NEW] `middleware/auth.ts`

Route middleware for protected pages.

---

## Phase 3: Company Management

### [NEW] `stores/company.ts`

Pinia store for company context:
```typescript
- state: { companies, currentCompany, loading }
- actions: { fetchCompanies(), selectCompany(), createCompany() }
- getters: { currentSlug, userRoleInCompany }
```

### [NEW] `pages/companies/index.vue`

Company selection page:
- Grid of user's companies with role badges
- Create new company button
- Company cards with hover effects
- Click to enter company dashboard

### [NEW] `pages/companies/create.vue`

Company creation form:
- Name input
- Auto-generated slug (editable)
- Plan selection (STARTER/BUSINESS/ENTERPRISE)
- Shows provisioning progress
- Redirects on success

### [NEW] `pages/[companySlug]/dashboard.vue`

Main dashboard with:
- Financial summary cards
- Recent journals list
- Period status indicator
- Quick actions (Create Journal, etc.)

---

## Phase 4: Chart of Accounts

### [NEW] `stores/account.ts`

```typescript
- state: { accounts, accountTree, loading }
- actions: { fetchAccounts(), createAccount(), lockAccount() }
```

### [NEW] `pages/[companySlug]/accounts/index.vue`

COA management with:
- Tree view (expandable hierarchy)
- Filter by account type
- Create account button
- Lock/unlock actions

### [NEW] `components/accounts/AccountForm.vue`

Modal form for creating/editing accounts.

### [NEW] `components/accounts/AccountTree.vue`

Recursive tree component for hierarchy display.

---

## Phase 5: Journal Entry

### [NEW] `stores/journal.ts`

```typescript
- state: { journals, currentJournal, validation }
- actions: { fetchJournals(), createJournal(), reverseJournal() }
- getters: { isBalanced, totalDebit, totalCredit }
```

### [NEW] `pages/[companySlug]/journals/create.vue`

**CRITICAL** - Most complex page:
- Date picker with period validation
- Description textarea
- Dynamic journal lines (add/remove)
- Account selector (searchable dropdown)
- Debit/Credit inputs with auto-formatting
- **Real-time balance validation**
- Visual indicator (balanced = green, unbalanced = red)
- Clear error messages

### [NEW] `pages/[companySlug]/journals/index.vue`

Journal list with:
- Date range filter
- Account filter
- Reference search
- Reverse journal action
- View details modal

### [NEW] `components/journals/JournalLineInput.vue`

Reusable component for journal line entry.

---

## Phase 6: Periods & Reports

### [NEW] `pages/[companySlug]/periods/index.vue`

Period management (Admin only):
- Period list with status
- Create period form
- Close/Reopen buttons
- Journal count per period

### [NEW] `pages/[companySlug]/reports/index.vue`

Report selection page with cards:
- Trial Balance
- Profit & Loss
- Balance Sheet
- Financial Summary

### [NEW] `pages/[companySlug]/reports/trial-balance.vue`

Interactive trial balance table.

### [NEW] `pages/[companySlug]/reports/profit-loss.vue`

P&L statement with collapsible sections.

### [NEW] `pages/[companySlug]/reports/balance-sheet.vue`

Balance sheet visualization.

---

## Design Principles

### Premium Aesthetics

**Colors:**
- Primary: Tailwind Blue (600-700)
- Success: Emerald
- Danger: Red
- Warning: Amber
- Neutral: Slate/Gray

**Effects:**
- Glassmorphism on cards
- Smooth transitions (200-300ms)
- Hover states on interactive elements
- Loading skeletons (not spinners)

### Micro-Animations

- Button hover scale (105%)
- Card hover lift
- Input focus ring animation
- Toast slide-in from top

### Typography

- Font: Inter
- Headings: font-semibold to font-bold
- Body: font-normal
- Labels: font-medium, text-sm

---

## Component Structure

```
components/
├── common/
│   ├── Button.vue
│   ├── Input.vue
│   ├── Select.vue
│   ├── Modal.vue
│   └── Toast.vue
├── accounts/
│   ├── AccountForm.vue
│   └── AccountTree.vue
├── journals/
│   ├── JournalLineInput.vue
│   └── JournalDetails.vue
└── layout/
    ├── Navbar.vue
    ├── Sidebar.vue
    └── Footer.vue
```

---

## API Integration Pattern

```typescript
// Example: Create Journal
const createJournal = async (data: CreateJournalDto) => {
  const config = useRuntimeConfig()
  const { currentSlug } = useCompanyStore()
  
  const response = await $fetch(`${config.public.apiBase}/${currentSlug}/journals`, {
    method: 'POST',
    body: data,
    credentials: 'include', // For HTTP-only cookies
  })
  
  return response
}
```

---

## Responsive Breakpoints

- **Mobile** (< 640px): Single column, bottom nav
- **Tablet** (640px - 1024px): Two columns, collapsible sidebar
- **Desktop** (> 1024px): Multi-column, fixed sidebar

---

## Validation Rules

### Journal Form

- Date required
- Description min 10 chars
- Minimum 2 lines
- Each line must have account selected
- **Debit = Credit (real-time check)**
- Show error if unbalanced
- Disable submit if invalid

### Account Form

- Code numeric only
- Name required
- Type required
- Parent type must match child type

---

## State Management Flow

```
User Login
  ↓
Auth Store (set user)
  ↓
Fetch Companies
  ↓
Company Store (set companies)
  ↓
Select Company
  ↓
Navigate to /:slug/dashboard
  ↓
Fetch Period, Accounts, etc.
```

---

## Next Steps (Priority Order)

1. ✅ Setup base design system
2. ✅ Implement auth pages (login/register)
3. ✅ Company selection & creation
4. ✅ Dashboard layout
5. ✅ COA management
6. ✅ Journal entry form
7. ✅ Reports

---

## Summary

**Goal**: Premium, fully responsive accounting UI
**Total Pages**: ~15 pages
**Total Components**: ~20 components
**Design**: Glassmorphism + smooth animations
**State**: Pinia stores for auth, company, accounts, journals
**API**: Full backend integration with HTTP-only cookies

Ready for implementation! 🚀
