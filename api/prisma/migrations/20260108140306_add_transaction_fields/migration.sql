-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "classification" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "isPosting" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "accountsPayableId" TEXT,
ADD COLUMN     "accountsReceivableId" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "purchaseAccountId" TEXT,
ADD COLUMN     "salesAccountId" TEXT;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_accountsReceivableId_fkey" FOREIGN KEY ("accountsReceivableId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_accountsPayableId_fkey" FOREIGN KEY ("accountsPayableId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_salesAccountId_fkey" FOREIGN KEY ("salesAccountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_purchaseAccountId_fkey" FOREIGN KEY ("purchaseAccountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taxes" ADD CONSTRAINT "taxes_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
