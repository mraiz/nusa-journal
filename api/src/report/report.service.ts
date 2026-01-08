import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { TenantPrismaService } from '../tenancy/tenant-prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import Decimal from 'decimal.js';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    private tenantPrisma: TenantPrismaService,
    private ledgerService: LedgerService,
  ) {}

  /**
   * Generate Trial Balance
   */
  async getTrialBalance(periodId?: string, asOfDate?: Date) {
    const company = await this.tenantPrisma.company.findFirst();
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    let period = null;
    let reportDate = asOfDate || new Date();

    if (periodId) {
      period = await this.tenantPrisma.accountingPeriod.findUnique({
        where: { id: periodId },
      });

      if (!period) {
        throw new NotFoundException('Period not found');
      }

      reportDate = period.endDate;
    }

    // Get all account balances
    const balancesData = await this.ledgerService.getAllAccountBalances(reportDate);

    // Group by account type
    const grouped = {
      ASSET: [] as any[],
      LIABILITY: [] as any[],
      EQUITY: [] as any[],
      REVENUE: [] as any[],
      EXPENSE: [] as any[],
    };

    for (const balance of balancesData.accounts) {
      grouped[balance.account.type].push(balance);
    }

    // Calculate totals per type
    const typeTotals = {
      ASSET: { debit: 0, credit: 0 },
      LIABILITY: { debit: 0, credit: 0 },
      EQUITY: { debit: 0, credit: 0 },
      REVENUE: { debit: 0, credit: 0 },
      EXPENSE: { debit: 0, credit: 0 },
    };

    for (const [type, accounts] of Object.entries(grouped)) {
      for (const acc of accounts) {
        if (acc.balanceType === 'debit') {
          typeTotals[type as keyof typeof typeTotals].debit += acc.balance;
        } else {
          typeTotals[type as keyof typeof typeTotals].credit += acc.balance;
        }
      }
    }

    return {
      reportName: 'Trial Balance',
      company: {
        name: company.name,
      },
      period: period ? {
        id: period.id,
        name: period.name,
        startDate: period.startDate,
        endDate: period.endDate,
      } : null,
      asOfDate: reportDate,
      accounts: grouped,
      typeTotals,
      grandTotal: balancesData.summary,
      generatedAt: new Date(),
    };
  }

  /**
   * Generate Profit & Loss (Income Statement)
   */
  async getProfitLoss(periodId: string) {
    const company = await this.tenantPrisma.company.findFirst();
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const period = await this.tenantPrisma.accountingPeriod.findUnique({
      where: { id: periodId },
    });

    if (!period) {
      throw new NotFoundException('Period not found');
    }

    // Get all account balances as of period end
    const balancesData = await this.ledgerService.getAllAccountBalances(period.endDate);

    // Filter REVENUE and EXPENSE accounts only
    const revenueAccounts = balancesData.accounts.filter(a => a.account.type === 'REVENUE');
    const expenseAccounts = balancesData.accounts.filter(a => a.account.type === 'EXPENSE');

    // Calculate totals
    let totalRevenue = new Decimal(0);
    let totalExpense = new Decimal(0);

    for (const acc of revenueAccounts) {
      // Revenue has credit balance normally
      totalRevenue = totalRevenue.add(acc.balance);
    }

    for (const acc of expenseAccounts) {
      // Expense has debit balance normally
      totalExpense = totalExpense.add(acc.balance);
    }

    const netIncome = totalRevenue.minus(totalExpense);

    return {
      reportName: 'Profit & Loss Statement',
      company: {
        name: company.name,
      },
      period: {
        id: period.id,
        name: period.name,
        startDate: period.startDate,
        endDate: period.endDate,
      },
      revenue: {
        accounts: revenueAccounts.map(a => ({
          code: a.account.code,
          name: a.account.name,
          amount: a.balance,
        })),
        total: totalRevenue.toNumber(),
      },
      expenses: {
        accounts: expenseAccounts.map(a => ({
          code: a.account.code,
          name: a.account.name,
          amount: a.balance,
        })),
        total: totalExpense.toNumber(),
      },
      netIncome: {
        amount: netIncome.abs().toNumber(),
        type: netIncome.isNegative() ? 'LOSS' : 'PROFIT',
      },
      generatedAt: new Date(),
    };
  }

  /**
   * Generate Balance Sheet
   */
  async getBalanceSheet(periodId: string) {
    const company = await this.tenantPrisma.company.findFirst();
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const period = await this.tenantPrisma.accountingPeriod.findUnique({
      where: { id: periodId },
    });

    if (!period) {
      throw new NotFoundException('Period not found');
    }

    // Get all account balances as of period end
    const balancesData = await this.ledgerService.getAllAccountBalances(period.endDate);

    // Filter by account type
    const assetAccounts = balancesData.accounts.filter(a => a.account.type === 'ASSET');
    const liabilityAccounts = balancesData.accounts.filter(a => a.account.type === 'LIABILITY');
    const equityAccounts = balancesData.accounts.filter(a => a.account.type === 'EQUITY');

    // Calculate totals
    let totalAssets = new Decimal(0);
    let totalLiabilities = new Decimal(0);
    let totalEquity = new Decimal(0);

    for (const acc of assetAccounts) {
      totalAssets = totalAssets.add(acc.balance);
    }

    for (const acc of liabilityAccounts) {
      totalLiabilities = totalLiabilities.add(acc.balance);
    }

    for (const acc of equityAccounts) {
      totalEquity = totalEquity.add(acc.balance);
    }

    // Get net income from P&L
    const profitLoss = await this.getProfitLoss(periodId);
    const netIncome = profitLoss.netIncome.type === 'PROFIT' 
      ? profitLoss.netIncome.amount 
      : -profitLoss.netIncome.amount;

    // Add net income to equity
    const totalEquityWithIncome = totalEquity.add(netIncome);

    // Verify accounting equation: Assets = Liabilities + Equity
    const liabilitiesAndEquity = totalLiabilities.add(totalEquityWithIncome);
    const difference = totalAssets.minus(liabilitiesAndEquity);
    const isBalanced = difference.abs().lessThan(0.01); // Allow for rounding

    return {
      reportName: 'Balance Sheet',
      company: {
        name: company.name,
      },
      period: {
        id: period.id,
        name: period.name,
        asOf: period.endDate,
      },
      assets: {
        accounts: assetAccounts.map(a => ({
          code: a.account.code,
          name: a.account.name,
          amount: a.balance,
        })),
        total: totalAssets.toNumber(),
      },
      liabilities: {
        accounts: liabilityAccounts.map(a => ({
          code: a.account.code,
          name: a.account.name,
          amount: a.balance,
        })),
        total: totalLiabilities.toNumber(),
      },
      equity: {
        accounts: equityAccounts.map(a => ({
          code: a.account.code,
          name: a.account.name,
          amount: a.balance,
        })),
        netIncome: {
          amount: netIncome,
          type: profitLoss.netIncome.type,
        },
        total: totalEquityWithIncome.toNumber(),
      },
      totals: {
        assets: totalAssets.toNumber(),
        liabilitiesAndEquity: liabilitiesAndEquity.toNumber(),
        difference: difference.abs().toNumber(),
        isBalanced,
      },
      generatedAt: new Date(),
    };
  }

  /**
   * Get financial summary (dashboard)
   */
  async getFinancialSummary(periodId: string) {
    const profitLoss = await this.getProfitLoss(periodId);
    const balanceSheet = await this.getBalanceSheet(periodId);

    return {
      period: profitLoss.period,
      summary: {
        totalRevenue: profitLoss.revenue.total,
        totalExpenses: profitLoss.expenses.total,
        netIncome: profitLoss.netIncome,
        totalAssets: balanceSheet.assets.total,
        totalLiabilities: balanceSheet.liabilities.total,
        totalEquity: balanceSheet.equity.total,
      },
      metrics: {
        profitMargin: profitLoss.revenue.total > 0 
          ? ((profitLoss.netIncome.amount / profitLoss.revenue.total) * 100).toFixed(2) + '%'
          : '0%',
        debtToEquity: balanceSheet.equity.total > 0
          ? (balanceSheet.liabilities.total / balanceSheet.equity.total).toFixed(2)
          : 'N/A',
        currentRatio: 'N/A', // Would need current assets/liabilities breakdown
        cashBalance: this.calculateCashBalance(balanceSheet.assets.accounts),
      },
      generatedAt: new Date(),
    };
  }

  private calculateCashBalance(assets: any[]): number {
    return assets
      .filter(a => {
        const lowerName = a.name.toLowerCase();
        return lowerName.includes('kas') || lowerName.includes('bank') || lowerName.includes('cash');
      })
      .reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
  }

  /**
   * Get analytics data for chart (Last 6-12 months)
   * Approximated by fetching recent closed/open periods
   */
  async getAnalytics(limit: number = 6) {
    const company = await this.tenantPrisma.company.findFirst();
    if (!company) throw new NotFoundException('Company not found');

    // Get recent periods
    const periods = await this.tenantPrisma.accountingPeriod.findMany({
      where: { companyId: company.id },
      orderBy: { endDate: 'asc' }, // Chronological
      take: -limit, // Last N
    });

    const series = await Promise.all(periods.map(async (period) => {
      // We can optimize this by direct aggregation, but reusing getProfitLoss is safer for consistency
      const pl = await this.getProfitLoss(period.id);
      return {
        period: period.name,
        month: period.endDate.toLocaleString('default', { month: 'short' }),
        revenue: pl.revenue.total,
        expense: pl.expenses.total,
        netIncome: pl.netIncome.amount * (pl.netIncome.type === 'PROFIT' ? 1 : -1),
      };
    }));

    return series;
  }
}

