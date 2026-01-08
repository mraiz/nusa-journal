import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { TenancyModule } from '../tenancy/tenancy.module';
import { LedgerModule } from '../ledger/ledger.module';

@Module({
  imports: [TenancyModule, LedgerModule],
  controllers: [ReportController],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}
