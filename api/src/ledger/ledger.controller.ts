import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller(':tenantSlug/ledger')
@UseGuards(JwtAuthGuard)
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  /**
   * Get all account balances (Trial Balance data)
   */
  @Get('balances')
  async getAllAccountBalances(@Query('asOfDate') asOfDate?: string) {
    return this.ledgerService.getAllAccountBalances(
      asOfDate ? new Date(asOfDate) : undefined
    );
  }

  /**
   * Get account balance
   */
  @Get('accounts/:accountId/balance')
  async getAccountBalance(
    @Param('accountId') accountId: string,
    @Query('asOfDate') asOfDate?: string,
  ) {
    return this.ledgerService.getAccountBalance(
      accountId,
      asOfDate ? new Date(asOfDate) : undefined
    );
  }

  /**
   * Get account transactions with running balance
   */
  @Get('accounts/:accountId/transactions')
  async getAccountTransactions(
    @Param('accountId') accountId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.ledgerService.getAccountTransactions(
      accountId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  /**
   * Get account activity for a period
   */
  @Get('accounts/:accountId/activity/:periodId')
  async getAccountActivity(
    @Param('accountId') accountId: string,
    @Param('periodId') periodId: string,
  ) {
    return this.ledgerService.getAccountActivity(accountId, periodId);
  }
}
