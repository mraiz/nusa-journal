import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { TenantPrismaService } from '../tenancy/tenant-prisma.service';
import Decimal from 'decimal.js';

@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);

  constructor(private tenantPrisma: TenantPrismaService) {}

  /**
   * Get account balance
   */
  async getAccountBalance(accountId: string, asOfDate?: Date) {
    const account = await this.tenantPrisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // Build date filter
    const dateFilter = asOfDate ? { lte: asOfDate } : {};

    // Get all journal lines for this account
    const lines = await this.tenantPrisma.journalLine.findMany({
      where: {
        accountId,
        journal: {
          date: dateFilter,
        },
      },
      include: {
        journal: {
          select: {
            date: true,
            isReversed: true,
          },
        },
      },
    });

    // Calculate balance
    let totalDebit = new Decimal(0);
    let totalCredit = new Decimal(0);

    for (const line of lines) {
      totalDebit = totalDebit.add(line.debit);
      totalCredit = totalCredit.add(line.credit);
    }

    // Calculate net balance based on account type
    // Assets & Expenses: Debit increases, Credit decreases (normal debit balance)
    // Liabilities, Equity, Revenue: Credit increases, Debit decreases (normal credit balance)
    const debitBalance = totalDebit.minus(totalCredit);
    const creditBalance = totalCredit.minus(totalDebit);

    let balance: Decimal;
    let balanceType: 'debit' | 'credit';

    if (['ASSET', 'EXPENSE'].includes(account.type)) {
      balance = debitBalance;
      balanceType = balance.isNegative() ? 'credit' : 'debit';
    } else {
      balance = creditBalance;
      balanceType = balance.isNegative() ? 'debit' : 'credit';
    }

    return {
      account: {
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
      },
      totalDebit: totalDebit.toNumber(),
      totalCredit: totalCredit.toNumber(),
      balance: balance.abs().toNumber(),
      balanceType,
      transactionCount: lines.length,
      asOfDate: asOfDate || new Date(),
    };
  }

  /**
   * Get account transactions with running balance
   */
  async getAccountTransactions(
    accountId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const account = await this.tenantPrisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // Build date filter
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;

    const where = startDate || endDate ? { date: dateFilter } : {};

    // Get journal lines with journal details
    const lines = await this.tenantPrisma.journalLine.findMany({
      where: {
        accountId,
        journal: where,
      },
      include: {
        journal: {
          select: {
            id: true,
            journalNumber: true,
            date: true,
            description: true,
            reference: true,
            isReversed: true,
          },
        },
      },
      orderBy: {
        journal: {
          date: 'asc',
        },
      },
    });

    // Calculate running balance
    let runningBalance = new Decimal(0);
    const transactions = [];

    for (const line of lines) {
      const debit = new Decimal(line.debit);
      const credit = new Decimal(line.credit);

      // Update running balance based on account type
      if (['ASSET', 'EXPENSE'].includes(account.type)) {
        runningBalance = runningBalance.add(debit).minus(credit);
      } else {
        runningBalance = runningBalance.add(credit).minus(debit);
      }

      transactions.push({
        date: line.journal.date,
        journalId: line.journal.id,
        journalNumber: line.journal.journalNumber,
        description: line.journal.description,
        reference: line.journal.reference,
        lineDescription: line.description,
        debit: debit.toNumber(),
        credit: credit.toNumber(),
        balance: runningBalance.abs().toNumber(),
        balanceType: runningBalance.isNegative() ? 
          (['ASSET', 'EXPENSE'].includes(account.type) ? 'credit' : 'debit') :
          (['ASSET', 'EXPENSE'].includes(account.type) ? 'debit' : 'credit'),
        isReversed: line.journal.isReversed,
      });
    }

    return {
      account: {
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
      },
      dateRange: {
        from: startDate,
        to: endDate,
      },
      transactions,
      summary: {
        totalDebit: lines.reduce((sum, l) => sum.add(l.debit), new Decimal(0)).toNumber(),
        totalCredit: lines.reduce((sum, l) => sum.add(l.credit), new Decimal(0)).toNumber(),
        finalBalance: runningBalance.abs().toNumber(),
        finalBalanceType: runningBalance.isNegative() ? 
          (['ASSET', 'EXPENSE'].includes(account.type) ? 'credit' : 'debit') :
          (['ASSET', 'EXPENSE'].includes(account.type) ? 'debit' : 'credit'),
        transactionCount: lines.length,
      },
    };
  }

  /**
   * Get all account balances (for trial balance preparation)
   */
  async getAllAccountBalances(asOfDate?: Date) {
    const company = await this.tenantPrisma.company.findFirst();
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const accounts = await this.tenantPrisma.account.findMany({
      where: {
        companyId: company.id,
        isActive: true,
      },
      orderBy: [
        { type: 'asc' },
        { code: 'asc' },
      ],
    });

    const balances = [];

    for (const account of accounts) {
      const balance = await this.getAccountBalance(account.id, asOfDate);
      
      // Only include accounts with transactions
      if (balance.transactionCount > 0) {
        balances.push(balance);
      }
    }

    // Calculate totals
    const totalDebit = balances.reduce((sum, b) => 
      sum + (b.balanceType === 'debit' ? b.balance : 0), 0
    );
    const totalCredit = balances.reduce((sum, b) => 
      sum + (b.balanceType === 'credit' ? b.balance : 0), 0
    );

    return {
      accounts: balances,
      summary: {
        totalDebit,
        totalCredit,
        difference: Math.abs(totalDebit - totalCredit),
        isBalanced: Math.abs(totalDebit - totalCredit) < 0.01, // Allow for rounding
      },
      asOfDate: asOfDate || new Date(),
    };
  }

  /**
   * Get account activity summary for a period
   */
  async getAccountActivity(accountId: string, periodId: string) {
    const account = await this.tenantPrisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const period = await this.tenantPrisma.accountingPeriod.findUnique({
      where: { id: periodId },
    });

    if (!period) {
      throw new NotFoundException('Period not found');
    }

    // Get journal lines in this period
    const lines = await this.tenantPrisma.journalLine.findMany({
      where: {
        accountId,
        journal: {
          periodId,
        },
      },
      include: {
        journal: true,
      },
    });

    const totalDebit = lines.reduce((sum, l) => sum.add(l.debit), new Decimal(0));
    const totalCredit = lines.reduce((sum, l) => sum.add(l.credit), new Decimal(0));

    return {
      account: {
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
      },
      period: {
        id: period.id,
        name: period.name,
        startDate: period.startDate,
        endDate: period.endDate,
      },
      activity: {
        totalDebit: totalDebit.toNumber(),
        totalCredit: totalCredit.toNumber(),
        netMovement: totalDebit.minus(totalCredit).toNumber(),
        transactionCount: lines.length,
      },
    };
  }
}
