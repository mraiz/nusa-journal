# Transaction Module Implementation Plan (Backend)

This plan covers the implementation of the Transaction Modules (Sales, Purchase, Payment) and their dependencies (Master Data).

## Goals
- Implement Master Data management (Contacts, Products)
- Implement Sales Cycle (Invoices) with Auto-Journaling
- Implement Purchase Cycle (Bills) with Auto-Journaling
- Implement Payment/Receipt handling

## Pre-requisites & Schema Updates
The current `schema.prisma` defines the tables, but we need to ensure `Product` and `Contact` have links to the Chart of Accounts for auto-journaling.

### 1. Schema Modifications
To support automatic journal creation, we need to know WHICH accounts to debit/credit.
- **Update `Product` table**: Add `salesAccountId` and `expenseAccountId`.
- **Update `Company` table** (optional): Add default `accountsReceivableId` and `accountsPayableId`.

## Module Breakdown

### 1. Master Data Module
**Directories**: `src/contact`, `src/product`

#### Contacts (Customer & Vendor)
- `POST /contacts` (Create)
- `GET /contacts` (List with filters)
- `GET /contacts/:id`
- `PATCH /contacts/:id`
- `DELETE /contacts/:id`

#### Products
- `POST /products`
- `GET /products`
- `POST /products` (Update)
- *Field Addition*: Bind product to specific Income/Expense accounts.

### 2. Sales Module (Invoices)
**Directory**: `src/sales`
**Entity**: `SalesInvoice`

#### Endpoints
- `POST /sales/invoices` - Create Draft
- `GET /sales/invoices` - List
- `GET /sales/invoices/:id` - Detail
- `PATCH /sales/invoices/:id` - Edit (Draft only)
- `POST /sales/invoices/:id/approve` - **Auto-Journal Trigger**
    - **Debit**: Accounts Receivable (Piutang)
    - **Credit**: Sales Revenue (Pendapatan - from Product)
    - **Credit**: Tax Payable (Hutang Pajak - if tax applies)

### 3. Purchase Module (Bills)
**Directory**: `src/purchase`
**Entity**: `PurchaseBill`

#### Endpoints
- `POST /purchase/bills`
- `POST /purchase/bills/:id/approve` - **Auto-Journal Trigger**
    - **Debit**: Expense/Asset (Beban/Aset - from Product)
    - **Debit**: Input Tax (Pajak Masukan)
    - **Credit**: Accounts Payable (Hutang Usaha)

### 4. Treasury Module (Payments)
**Directory**: `src/treasury` or `src/payment`
**Entity**: `Payment`

#### Endpoints
- `POST /payments` (Receive/Pay)
- Link payment to Invoice/Bill (update status to PAID).
- **Auto-Journal**:
    - Receipt: Debit Cash, Credit AR.
    - Payment: Debit AP, Credit Cash.

## Execution Steps
1.  **Refine Schema**: Add Account mapping fields to Product/Company.
2.  **Generate Client**: Run `npx prisma generate`.
3.  **Implement Master Data**: Contacts & Products Services.
4.  **Implement Sales**: Invoice Service + Journal Integration.
5.  **Implement Purchase**: Bill Service + Journal Integration.
