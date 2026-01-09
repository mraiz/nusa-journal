import { Module } from '@nestjs/common';
import { PurchaseBillController } from './purchase-bill/purchase-bill.controller';
import { PurchaseBillService } from './purchase-bill/purchase-bill.service';
import { JournalModule } from '../journal/journal.module';


@Module({
  imports: [JournalModule],
  controllers: [PurchaseBillController],
  providers: [PurchaseBillService]
})

export class PurchaseModule {}
