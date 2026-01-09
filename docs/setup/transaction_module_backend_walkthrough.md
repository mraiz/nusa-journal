# Transaction Module (Backend) Walkthrough

I have implemented the backend logic for the Transaction Modules, enabling the full accounting cycle from Master Data to Financial Statements via Auto-Journaling.

## 1. Master Data
Implemented CRUD APIs for:
-   **Contacts**: `Customer` and `Vendor`.
-   **Products**: Added logic to map products to specific `Sales Account` and `Expense Account`. These mappings are critical for the auto-journaling system.

## 2. Sales Module (Invoices)
-   Implemented `SalesInvoice` entity with a nested **Lines** structure.
-   **Auto-Journal Logic** (`POST /:tenant/sales/invoices/:id/approve`):
    -   Automatically validates that the invoice is in `DRAFT`.
    -   **Debits** `Accounts Receivable` (set in Company settings).
    -   **Credits** `Sales Revenue` (set in Product settings) for each line item.
    -   Updates status to `POSTED` and links the created Journal.

## 3. Purchase Module (Bills)
-   Implemented `PurchaseBill` entity.
-   **Auto-Journal Logic** (`POST /:tenant/purchase/bills/:id/approve`):
    -   **Debits** `Expense` or `Inventory Asset` (set in Product settings).
    -   **Credits** `Accounts Payable` (set in Company settings).
    -   Updates status to `POSTED`.

## 4. Payment Module (Treasury)
-   Implemented `Payment` entity supporting `RECEIPT` and `PAYMENT` types.
-   **Receipt Logic** (Money In):
    -   **Debits** the selected Cash/Bank Account (`paymentAccountId`).
    -   **Credits** `Accounts Receivable` if linked to an Invoice.
    -   Updates Invoice status to `PAID`.
-   **Payment Logic** (Money Out):
    -   **Debits** `Accounts Payable` if linked to a Bill.
    -   **Credits** the selected Cash/Bank Account (`paymentAccountId`).
    -   Updates Bill status to `PAID`.

## Next Steps
-   **Frontend Implementation**: Build the UI forms for Customers, Products, Invoices, Bills, and Payments.
