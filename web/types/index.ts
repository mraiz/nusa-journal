// User & Auth Types
export interface User {
  id: string
  email: string
  name: string
}

export interface LoginDto {
  email: string
  password: string
}

export interface RegisterDto {
  email: string
  name: string
  password: string
}

export interface LoginResponse {
  message: string
  user: User
  company?: {
    id: string
    name: string
    slug: string
  }
  role?: string
  needsCompany?: boolean
}

// Company Types
export interface Company {
  id: string
  name: string
  slug: string
  role: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
}

export interface CreateCompanyDto {
  name: string
  slug?: string
  plan?: 'STARTER' | 'BUSINESS' | 'ENTERPRISE'
}

// Account Types
export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'

export interface Account {
  id: string
  code: string
  name: string
  type: AccountType
  parentId?: string
  parent?: {
    id: string
    code: string
    name: string
  }
  isLocked: boolean
  childrenCount: number
  createdAt: string
}

export interface CreateAccountDto {
  code: string
  name: string
  type: AccountType
  parentId?: string
  description?: string
}

// Journal Types
export interface JournalLine {
  accountId: string
  debit: number | string
  credit: number | string
  description?: string
}

export interface CreateJournalDto {
  date: Date | string
  description: string
  reference?: string
  lines: JournalLine[]
}

export interface Journal {
  id: string
  journalNumber: string
  date: string
  description: string
  reference?: string
  period: {
    id: string
    name: string
  }
  totalDebit: number
  totalCredit: number
  isReversed: boolean
  lines: {
    id: string
    account: {
      id: string
      code: string
      name: string
      type: AccountType
    }
    debit: number
    credit: number
    description?: string
  }[]
  createdAt: string
}

// Period Types
export interface AccountingPeriod {
  id: string
  name: string
  startDate: string
  endDate: string
  status: 'OPEN' | 'CLOSED'
  journalCount: number
  createdAt: string
}

export interface CreatePeriodDto {
  name: string
  startDate: Date | string
  endDate: Date | string
}

// Report Types
export interface TrialBalance {
  reportName: string
  company: { name: string }
  period?: {
    id: string
    name: string
    startDate: string
    endDate: string
  }
  asOfDate: string
  accounts: {
    ASSET: any[]
    LIABILITY: any[]
    EQUITY: any[]
    REVENUE: any[]
    EXPENSE: any[]
  }
  grandTotal: {
    totalDebit: number
    totalCredit: number
    difference: number
    isBalanced: boolean
  }
}

export interface ProfitLoss {
  reportName: string
  period: {
    name: string
    startDate: string
    endDate: string
  }
  revenue: {
    accounts: Array<{ code: string; name: string; amount: number }>
    total: number
  }
  expenses: {
    accounts: Array<{ code: string; name: string; amount: number }>
    total: number
  }
  netIncome: {
    amount: number
    type: 'PROFIT' | 'LOSS'
  }
}

export interface BalanceSheet {
  reportName: string
  period: {
    name: string
    asOf: string
  }
  assets: {
    accounts: Array<{ code: string; name: string; amount: number }>
    total: number
  }
  liabilities: {
    accounts: Array<{ code: string; name: string; amount: number }>
    total: number
  }
  equity: {
    accounts: Array<{ code: string; name: string; amount: number }>
    netIncome: { amount: number; type: 'PROFIT' | 'LOSS' }
    total: number
  }
  totals: {
    assets: number
    liabilitiesAndEquity: number
    difference: number
    isBalanced: boolean
  }
}

// API Error
export interface ApiError {
  statusCode: number
  message: string | string[]
  error: string
}
