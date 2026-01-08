import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { TenantPrismaService } from '../tenancy/tenant-prisma.service';
import { CreateJournalDto } from './dto/create-journal.dto';
import Decimal from 'decimal.js';

@Injectable()
export class JournalService {
  private readonly logger = new Logger(JournalService.name);

  constructor(private tenantPrisma: TenantPrismaService) {}

  /**
   * Create journal with double-entry validation
   */
  async createJournal(dto: CreateJournalDto, user: { id: string; email: string }) {
    // Resolve user ID (handle mismatch between Registry and Tenant IDs)
    let userId = user.id;
    const existingUser = await this.tenantPrisma.user.findUnique({ where: { id: userId } });
    
    if (!existingUser) {
      if (user.email) {
        const byEmail = await this.tenantPrisma.user.findUnique({ where: { email: user.email } });
        if (byEmail) {
          userId = byEmail.id;
        } else {
           throw new NotFoundException(`User ${user.email} not found in tenant DB`);
        }
      } else {
        throw new NotFoundException(`User ${userId} not found in tenant DB`);
      }
    }
    const company = await this.tenantPrisma.company.findFirst();
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Convert date to start of day for period matching
    const journalDate = new Date(dto.date);
    journalDate.setHours(0, 0, 0, 0);

    // Find accounting period for this date
    const period = await this.tenantPrisma.accountingPeriod.findFirst({
      where: {
        companyId: company.id,
        startDate: { lte: journalDate },
        endDate: { gte: journalDate },
      },
    });

    if (!period) {
      throw new BadRequestException(
        `No accounting period found for date ${journalDate.toISOString().split('T')[0]}`
      );
    }

    // Check if period is closed
    if (period.status === 'CLOSED') {
      throw new ForbiddenException(
        `Cannot post journal to closed period: ${period.name}`
      );
    }

    // Validate all accounts exist and are not locked
    for (const line of dto.lines) {
      const account = await this.tenantPrisma.account.findUnique({
        where: { id: line.accountId },
      });

      if (!account) {
        throw new NotFoundException(`Account not found: ${line.accountId}`);
      }

      if (account.isLocked) {
        throw new BadRequestException(
          `Cannot post to locked account: ${account.code} - ${account.name}`
        );
      }
    }

    // Calculate totals and validate double-entry
    let totalDebit = new Decimal(0);
    let totalCredit = new Decimal(0);

    for (const line of dto.lines) {
      const debit = new Decimal(line.debit || 0);
      const credit = new Decimal(line.credit || 0);

      // Validate that each line has either debit OR credit, not both
      if (debit.gt(0) && credit.gt(0)) {
        throw new BadRequestException(
          'Journal line cannot have both debit and credit'
        );
      }

      if (debit.eq(0) && credit.eq(0)) {
        throw new BadRequestException(
          'Journal line must have either debit or credit'
        );
      }

      totalDebit = totalDebit.add(debit);
      totalCredit = totalCredit.add(credit);
    }

    // Double-entry validation: Debit MUST equal Credit
    if (!totalDebit.eq(totalCredit)) {
      throw new BadRequestException(
        `Debit (${totalDebit.toString()}) must equal Credit (${totalCredit.toString()})`
      );
    }

    // Generate journal number (sequence per company)
    const lastJournal = await this.tenantPrisma.journal.findFirst({
      where: { companyId: company.id },
      orderBy: { createdAt: 'desc' },
    });

    const nextNumber = lastJournal
      ? parseInt(lastJournal.journalNumber.replace(/\D/g, '')) + 1
      : 1;
    
    const journalNumber = `JV${String(nextNumber).padStart(6, '0')}`;

    // Create journal with lines in a transaction
    const journal = await this.tenantPrisma.client.$transaction(async (prisma) => {
      const newJournal = await prisma.journal.create({
        data: {
          companyId: company.id,
          periodId: period.id,
          journalNumber,
          date: journalDate,
          description: dto.description,
          reference: dto.reference,
          createdById: userId,
          journalLines: {
            create: dto.lines.map(line => ({
              accountId: line.accountId,
              debit: new Decimal(line.debit || 0),
              credit: new Decimal(line.credit || 0),
              description: line.description,
            })),
          },
        },
        include: {
          journalLines: {
            include: {
              account: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  type: true,
                },
              },
            },
          },
          period: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return newJournal;
    });

    this.logger.log(
      `Journal created: ${journal.journalNumber} (Debit: ${totalDebit}, Credit: ${totalCredit})`
    );

    return {
      id: journal.id,
      journalNumber: journal.journalNumber,
      date: journal.date,
      description: journal.description,
      reference: journal.reference,
      period: journal.period,
      totalDebit: totalDebit.toNumber(),
      totalCredit: totalCredit.toNumber(),
      isReversed: journal.isReversed,
      lines: journal.journalLines.map(line => ({
        id: line.id,
        account: line.account,
        debit: line.debit.toNumber(),
        credit: line.credit.toNumber(),
        description: line.description,
      })),
      createdAt: journal.createdAt,
    };
  }

  /**
   * Get journals with filters
   */
  /**
   * Get journals with filters and pagination
   */
  async getJournals(query: import('./dto/get-journals.dto').GetJournalsDto) {
    const company = await this.tenantPrisma.company.findFirst();
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const { page = 1, limit = 10, search, startDate, endDate, accountId, reference } = query;
    const skip = (page - 1) * limit;

    const where: any = { companyId: company.id };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    // Specific filters
    if (reference) {
      where.reference = { contains: reference, mode: 'insensitive' };
    }

    if (accountId) {
      where.journalLines = {
        some: {
          accountId: accountId,
        },
      };
    }

    // Global Search (Journal Number, Description, Reference)
    if (search) {
      where.OR = [
        { journalNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Count total
    const total = await this.tenantPrisma.journal.count({ where });

    // Get Data
    const journals = await this.tenantPrisma.journal.findMany({
      where,
      include: {
        period: {
          select: { name: true },
        },
        journalLines: {
          include: {
            account: {
              select: { code: true, name: true, type: true },
            },
          },
        },
        createdBy: {
          select: { name: true, email: true },
        },
      },
      orderBy: { date: 'desc' },
      skip,
      take: Number(limit),
    });

    const data = journals.map(journal => {
      const totalDebit = journal.journalLines.reduce(
        (sum, line) => sum.add(line.debit),
        new Decimal(0)
      );
      const totalCredit = journal.journalLines.reduce(
        (sum, line) => sum.add(line.credit),
        new Decimal(0)
      );

      return {
        id: journal.id,
        journalNumber: journal.journalNumber,
        date: journal.date,
        description: journal.description,
        reference: journal.reference,
        period: journal.period.name,
        totalDebit: totalDebit.toNumber(),
        totalCredit: totalCredit.toNumber(),
        isReversed: journal.isReversed,
        linesCount: journal.journalLines.length,
        createdBy: journal.createdBy.name,
        createdAt: journal.createdAt,
      };
    });

    return {
      data,
      meta: {
        total,
        page: Number(page),
        lastPage: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    };
  }

  /**
   * Get journal by ID
   */
  async getJournal(id: string) {
    const journal = await this.tenantPrisma.journal.findUnique({
      where: { id },
      include: {
        period: true,
        journalLines: {
          include: {
            account: {
              select: {
                id: true,
                code: true,
                name: true,
                type: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reversedBy: {
          select: {
            id: true,
            journalNumber: true,
            date: true,
          },
        },
      },
    });

    if (!journal) {
      throw new NotFoundException('Journal not found');
    }

    const totalDebit = journal.journalLines.reduce(
      (sum, line) => sum.add(line.debit),
      new Decimal(0)
    );
    const totalCredit = journal.journalLines.reduce(
      (sum, line) => sum.add(line.credit),
      new Decimal(0)
    );

    return {
      id: journal.id,
      journalNumber: journal.journalNumber,
      date: journal.date,
      description: journal.description,
      reference: journal.reference,
      period: journal.period,
      totalDebit: totalDebit.toNumber(),
      totalCredit: totalCredit.toNumber(),
      isReversed: journal.isReversed,
      reversedBy: journal.reversedBy,
      lines: journal.journalLines.map(line => ({
        id: line.id,
        account: line.account,
        debit: line.debit.toNumber(),
        credit: line.credit.toNumber(),
        description: line.description,
      })),
      createdBy: journal.createdBy,
      createdAt: journal.createdAt,
      updatedAt: journal.updatedAt,
    };
  }

  /**
   * Reverse journal (create reversing entry)
   */
  async reverseJournal(id: string, user: { id: string; email: string }) {
    // Resolve user ID
    let userId = user.id;
    const existingUser = await this.tenantPrisma.user.findUnique({ where: { id: userId } });
    if (!existingUser && user.email) {
      const byEmail = await this.tenantPrisma.user.findUnique({ where: { email: user.email } });
      if (byEmail) userId = byEmail.id;
    }
    const originalJournal = await this.tenantPrisma.journal.findUnique({
      where: { id },
      include: {
        journalLines: true,
        period: true,
      },
    });

    if (!originalJournal) {
      throw new NotFoundException('Journal not found');
    }

    if (originalJournal.isReversed) {
      throw new BadRequestException('Journal has already been reversed');
    }

    // Check if period is still open
    if (originalJournal.period.status === 'CLOSED') {
      throw new ForbiddenException('Cannot reverse journal in closed period');
    }

    // Generate reversing journal number
    const lastJournal = await this.tenantPrisma.journal.findFirst({
      where: { companyId: originalJournal.companyId },
      orderBy: { createdAt: 'desc' },
    });

    const nextNumber = lastJournal
      ? parseInt(lastJournal.journalNumber.replace(/\D/g, '')) + 1
      : 1;
    
    const journalNumber = `JV${String(nextNumber).padStart(6, '0')}`;

    // Create reversing journal in transaction
    const reversingJournal = await this.tenantPrisma.client.$transaction(async (prisma) => {
      // Create reversing journal with opposite debit/credit
      const newJournal = await prisma.journal.create({
        data: {
          companyId: originalJournal.companyId,
          periodId: originalJournal.periodId,
          journalNumber,
          date: new Date(), // Use current date for reversal
          description: `REVERSAL: ${originalJournal.description}`,
          reference: originalJournal.reference,
          createdById: userId,
          journalLines: {
            create: originalJournal.journalLines.map(line => ({
              accountId: line.accountId,
              debit: line.credit, // Swap debit and credit
              credit: line.debit,
              description: line.description,
            })),
          },
        },
        include: {
          journalLines: {
            include: {
              account: true,
            },
          },
        },
      });

      // Mark original journal as reversed
      await prisma.journal.update({
        where: { id: originalJournal.id },
        data: {
          isReversed: true,
          reversedById: newJournal.id,
        },
      });

      return newJournal;
    });

    this.logger.log(
      `Journal reversed: ${originalJournal.journalNumber} → ${reversingJournal.journalNumber}`
    );

    return {
      message: 'Journal reversed successfully',
      originalJournal: {
        id: originalJournal.id,
        journalNumber: originalJournal.journalNumber,
      },
      reversingJournal: {
        id: reversingJournal.id,
        journalNumber: reversingJournal.journalNumber,
        date: reversingJournal.date,
      },
    };
  }
}
