import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { JournalModule } from '../journal/journal.module';


@Module({
  imports: [JournalModule],
  controllers: [PaymentController],
  providers: [PaymentService]
})

export class PaymentModule {}
