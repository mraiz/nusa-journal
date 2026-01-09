// ... (User, Company, Account types remain unchanged)

// ==========================================
// MASTER DATA
// ==========================================

export interface Customer {
  id: string
  code: string
  name: string
  email?: string
  phone?: string
  address?: string
  taxId?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateCustomerDto {
  code: string
  name: string
  email?: string
  phone?: string
  address?: string
  taxId?: string
  isActive?: boolean
}

export interface Vendor {
  id: string
  code: string
  name: string
  email?: string
  phone?: string
  address?: string
  taxId?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateVendorDto {
  code: string
  name: string
  email?: string
  phone?: string
  address?: string
  taxId?: string
  isActive?: boolean
}

export type ProductType = 'GOODS' | 'SERVICE'

export interface Product {
  id: string
  code: string
  name: string
  type: ProductType
  price: number
  salesAccountId?: string
  purchaseAccountId?: string
  salesAccount?: {
    id: string
    code: string
    name: string
  }
  purchaseAccount?: {
    id: string
    code: string
    name: string
  }
  isActive: boolean
}

export interface CreateProductDto {
  code: string
  name: string
  type: ProductType
  price: number
  salesAccountId?: string
  purchaseAccountId?: string
  isActive?: boolean
}

// ==========================================
// TRANSACTIONS
// ==========================================

export type InvoiceStatus = 'DRAFT' | 'POSTED' | 'PAID' | 'CANCELLED'

export interface SalesInvoiceLine {
  id: string
  productId: string
  product?: Product // Include if populated
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

export interface SalesInvoice {
  id: string
  invoiceNumber: string
  date: string
  dueDate?: string // ISO/Date
  customerId: string
  customer?: Customer
  subtotal: number
  taxAmount: number
  total: number
  status: InvoiceStatus
  notes?: string
  lines?: SalesInvoiceLine[]
  createdAt: string
}

export interface CreateSalesInvoiceDto {
  customerId: string
  invoiceNumber: string
  date: Date | string
  dueDate?: Date | string
  notes?: string
  lines: {
      productId: string
      description: string
      quantity: number
      unitPrice: number
  }[]
}

export type BillStatus = 'DRAFT' | 'POSTED' | 'PAID' | 'CANCELLED'

export interface PurchaseBillLine {
  id: string
  productId: string
  product?: Product
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

export interface PurchaseBill {
  id: string
  billNumber: string
  date: string
  dueDate?: string
  vendorId: string
  vendor?: Vendor
  subtotal: number
  taxAmount: number
  total: number
  status: BillStatus
  notes?: string
  lines?: PurchaseBillLine[]
  createdAt: string
}

export interface CreatePurchaseBillDto {
  vendorId: string
  billNumber: string
  date: Date | string
  dueDate?: Date | string
  notes?: string
  lines: {
      productId: string
      description: string
      quantity: number
      unitPrice: number
  }[]
}

export type PaymentType = 'RECEIPT' | 'PAYMENT' | 'TRANSFER'

export interface Payment {
  id: string
  paymentNumber: string
  date: string
  amount: number
  type: PaymentType
  reference?: string
  referenceId?: string
  paymentAccountId: string // TODO: Add Account Relation if needed in UI
  notes?: string
  createdAt: string
}

export interface CreatePaymentDto {
  paymentNumber: string
  date: Date | string
  type: PaymentType
  amount: number
  paymentAccountId: string
  reference?: string
  referenceId?: string
  notes?: string
}
