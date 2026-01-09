import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { TenantPrismaService } from '../tenancy/tenant-prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import { Decimal } from 'decimal.js';

@Injectable()
export class ClosingService {
  private readonly logger = new Logger(ClosingService.name);

  constructor(
    private tenantPrisma: TenantPrismaService,
    private ledgerService: LedgerService,
  ) {}

  /**
   * Close a period by generating closing entries
   * Zeros out all Revenue and Expense accounts to Retained Earnings
   */
  async closePeriod(periodId: string, user: { userId: string; email: string }) {
    // Resolve user ID (handle mismatch between Registry and Tenant IDs)
    let userId = user.userId;
    // Try finding by ID first
    const existingUser = await this.tenantPrisma.user.findUnique({ where: { id: userId } });
    
    if (!existingUser) {
      // Fallback to email
      if (user.email) {
        const byEmail = await this.tenantPrisma.user.findUnique({ where: { email: user.email } });
        if (byEmail) {
          userId = byEmail.id;
        } else {
             this.logger.warn(`User ${user.email} not found in tenant DB, using original ID (might fail constraint)`);
        }
      }
    }

    const period = await this.tenantPrisma.accountingPeriod.findUnique({
      where: { id: periodId },
    });

    if (!period) {
      throw new NotFoundException('Period not found');
    }

    if (period.status === 'CLOSED') {
      throw new BadRequestException('Period is already closed');
    }

    // 1. Get all balances as of period end
    const balancesData = await this.ledgerService.getAllAccountBalances(period.endDate);

    // 2. Identify Nominal Accounts (Revenue & Expense)
    const revenueAccounts = balancesData.accounts.filter(
      (a) => a.account.type === 'REVENUE' && !new Decimal(a.balance).eq(0),
    );
    const expenseAccounts = balancesData.accounts.filter(
      (a) => a.account.type === 'EXPENSE' && !new Decimal(a.balance).eq(0),
    );

    if (revenueAccounts.length === 0 && expenseAccounts.length === 0) {
      // Nothing to close, just mark as closed
      await this.tenantPrisma.accountingPeriod.update({
        where: { id: periodId },
        data: { status: 'CLOSED' },
      });
      return { message: 'Period closed (no transactions to close)' };
    }

    // 3. Find Retained Earnings Account (Equity)
    // Heuristic: Look for an account named 'Retained Earnings' or 'Laba Ditahan'
    // or just pick the first Equity account if not found (fallback, risky but MVP)
    let retainedEarnings = await this.tenantPrisma.account.findFirst({
      where: {
        type: 'EQUITY',
        OR: [
          { name: { contains: 'Retained Earnings', mode: 'insensitive' } },
          { name: { contains: 'Laba Ditahan', mode: 'insensitive' } },
          { code: '3100' } // Common code
        ],
      },
    });

    if (!retainedEarnings) {
        // Fallback: First Equity Account
        retainedEarnings = await this.tenantPrisma.account.findFirst({
            where: { type: 'EQUITY' }
        });
    }

    if (!retainedEarnings) {
      throw new BadRequestException(
        'Cannot close period: No Equity/Retained Earnings account found to book Net Income.',
      );
    }

    // 4. Prepare Closing Journal Lines
    const lines: { accountId: string; debit: Decimal; credit: Decimal; description: string }[] = [];
    let netIncome = new Decimal(0);

    // Close Revenue (Credit Balance -> Debit to Zero)
    for (const acc of revenueAccounts) {
      const balance = new Decimal(acc.balance);
      // Revenue is credit normal. To zero it, we Debit it.
      // But ledger.getAllAccountBalances returns absolute value? No, let's verify ledger service.
      // Assuming Balance is correct based on type.
      // Revenue Account: Credit 1000. Balance = 1000 (Credit). To zero: Debit 1000.
      lines.push({
        accountId: acc.account.id,
        debit: balance,
        credit: new Decimal(0),
        description: `Closing Entry: ${acc.account.name}`,
      });
      netIncome = netIncome.add(balance); // Revenue increases income
    }

    // Close Expenses (Debit Balance -> Credit to Zero)
    for (const acc of expenseAccounts) {
      const balance = new Decimal(acc.balance);
      lines.push({
        accountId: acc.account.id,
        debit: new Decimal(0),
        credit: balance,
        description: `Closing Entry: ${acc.account.name}`,
      });
      netIncome = netIncome.sub(balance); // Expense decreases income
    }

    // Book Net Income to Retained Earnings
    // If Net Income is positive (Profit): Credit Retained Earnings
    // If Net Income is negative (Loss): Debit Retained Earnings
    if (netIncome.greaterThan(0)) {
        lines.push({
            accountId: retainedEarnings.id,
            debit: new Decimal(0),
            credit: netIncome,
            description: 'Closing Entry: Net Income'
        });
    } else if (netIncome.lessThan(0)) {
        lines.push({
            accountId: retainedEarnings.id,
            debit: netIncome.abs(),
            credit: new Decimal(0),
            description: 'Closing Entry: Net Loss'
        });
    }

    // 5. Create Journal
    const company = await this.tenantPrisma.company.findFirst();
    if (!company) throw new NotFoundException("Company not found")

    // Generate Number
    const lastJournal = await this.tenantPrisma.journal.findFirst({
        where: { companyId: company.id },
        orderBy: { createdAt: 'desc' },
    });
    const nextNumber = lastJournal ? parseInt(lastJournal.journalNumber.replace(/\D/g, '')) + 1 : 1;
    const journalNumber = `JV${String(nextNumber).padStart(6, '0')}`;
  
    await this.tenantPrisma.client.$transaction(async (prisma) => {
        // Create Closing Journal
        await prisma.journal.create({
            data: {
                companyId: company.id,
                periodId: period.id,
                journalNumber,
                date: period.endDate, // Closing entries are dated last day of period
                description: `Closing Entries - ${period.name}`,
                reference: 'CLOSING',
                createdById: userId,
                journalLines: {
                    create: lines.map(l => ({
                       accountId: l.accountId,
                       debit: l.debit,
                       credit: l.credit,
                       description: l.description
                    }))
                }
            }
        });

        // Mark Period as Closed
        await prisma.accountingPeriod.update({
            where: { id: periodId },
            data: { status: 'CLOSED' }
        });
    });

    return { message: 'Period closed successfully' };
  }
}
