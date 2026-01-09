import { Module } from '@nestjs/common';
import { PeriodService } from './period.service';
import { PeriodController } from './period.controller';
import { TenancyModule } from '../tenancy/tenancy.module';
import { LedgerModule } from '../ledger/ledger.module';
import { ClosingService } from './closing.service';

@Module({
  imports: [TenancyModule, LedgerModule],
  controllers: [PeriodController],
  providers: [PeriodService, ClosingService],
  exports: [PeriodService, ClosingService],
})
export class PeriodModule {}
