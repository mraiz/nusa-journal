import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ReportService } from './report.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller(':tenantSlug/reports')
@UseGuards(JwtAuthGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  /**
   * Get Trial Balance
   */
  @Get('trial-balance')
  async getTrialBalance(
    @Query('periodId') periodId?: string,
    @Query('asOfDate') asOfDate?: string,
  ) {
    return this.reportService.getTrialBalance(
      periodId,
      asOfDate ? new Date(asOfDate) : undefined,
    );
  }

  /**
   * Get Profit & Loss Statement
   */
  @Get('profit-loss/:periodId')
  async getProfitLoss(@Param('periodId') periodId: string) {
    return this.reportService.getProfitLoss(periodId);
  }

  /**
   * Get Balance Sheet
   */
  @Get('balance-sheet/:periodId')
  async getBalanceSheet(@Param('periodId') periodId: string) {
    return this.reportService.getBalanceSheet(periodId);
  }

  /**
   * Get Financial Summary (Dashboard)
   */
  @Get('summary/:periodId')
  async getFinancialSummary(@Param('periodId') periodId: string) {
    return this.reportService.getFinancialSummary(periodId);
  }

  /**
   * Get Analytics for Dashboard Chart
   */
  @Get('analytics')
  async getAnalytics(@Query('limit') limit?: number) {
    return this.reportService.getAnalytics(Number(limit) || 6);
  }
}
