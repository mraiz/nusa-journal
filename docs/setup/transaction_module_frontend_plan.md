# Transaction Module Implementation Plan (Frontend)

This plan covers the frontend integration of the Transaction Modules using Nuxt 4, Pinia, and Tailwind CSS.

## Goals
-   Implement Pinia stores for Master Data and Transactions.
-   Build UI for Contacts (Customers/Vendors).
-   Build UI for Products (with Account mapping).
-   Build UI for Sales Invoices (Create, List, Detail, Approve).
-   Build UI for Purchase Bills (Create, List, Detail, Approve).
-   Build UI for Payments (Receipts & Payments).

## 1. Type Definitions (`web/types/index.ts`)
Update global types to match the new Backend DTOs:
-   `Customer`, `Vendor`, `Product`
-   `SalesInvoice`, `SalesInvoiceLine`
-   `PurchaseBill`, `PurchaseBillLine`
-   `Payment`

## 2. Pinia Stores (`web/stores/`)
-   **`contact.ts`**: Manage Customers and Vendors.
-   **`product.ts`**: Manage Products.
-   **`sales.ts`**: Manage Invoices (Create, Approve, Fetch).
-   **`purchase.ts`**: Manage Bills.
-   **`payment.ts`**: Manage Payments.

## 3. UI Implementation
**Directory Structure**: `web/pages/[companySlug]/`

### Master Data
-   `/contacts`: Tabbed view for Customers and Vendors.
    -   `index.vue`: List + Search.
    -   `[id].vue`: Edit Form.
-   `/products`:
    -   `index.vue`: List + Create Modal.
    -   **Important**: Product Form must allow selecting `Sales Account` and `Expense Account` from the Chart of Accounts store.

### Sales Module
-   `/sales`:
    -   `index.vue`: List of Invoices (Status badges: DRAFT, POSTED, PAID).
    -   `create.vue`: Invoice Form.
        -   **Dynamic Lines**: Add/Remove product lines.
        -   **Calculations**: Auto-update Subtotal/Total.
    -   `[id].vue`: Detail View + **Approve Button**.

### Purchase Module
-   `/purchases`: Symmetry with Sales module.

### Payment Module
-   `/payments`:
    -   `index.vue`: History.
    -   `create.vue`: Payment Form.
        -   **Type Selection**: Receipt vs Payment.
        -   **Reference Link**: Select open Invoice or Bill to pay.

## Execution Order
1.  **Types & Stores**: Define the data layer.
2.  **Master Data UI**: Basic setups.
3.  **Sales UI**: The most complex part (dynamic form).
4.  **Purchase UI**: Clone & adapt Sales UI.
5.  **Payment UI**.
