import { Module } from '@nestjs/common';
import { SalesInvoiceController } from './sales-invoice/sales-invoice.controller';
import { SalesInvoiceService } from './sales-invoice/sales-invoice.service';
import { JournalModule } from '../journal/journal.module';


@Module({
  imports: [JournalModule],
  controllers: [SalesInvoiceController],
  providers: [SalesInvoiceService]
})

export class SalesModule {}
