import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { TenantPrismaService } from '../tenancy/tenant-prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { JournalService } from '../journal/journal.service';
import { CreateJournalDto } from '../journal/dto/create-journal.dto';
import { PaymentType, InvoiceStatus, BillStatus } from '@prisma/client';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly tenantPrisma: TenantPrismaService,
    private readonly journalService: JournalService,
  ) {}

  async create(createDto: CreatePaymentDto, user: any) {
    const company = await this.tenantPrisma.checkCompany();

    // 1. Validate Payment Account (Must be Asset/Bank)
    // For now, just check existence
    // const paymentAccount = ...

    // 2. Prepare Journal Lines
    const journalLines: any[] = [];
    let linkedEntityDescription = '';


    // Resolve Linked Entity IDs
    const salesInvoiceId = createDto.salesInvoiceId || (createDto.type === PaymentType.RECEIPT && createDto.referenceId ? createDto.referenceId : undefined);
    const purchaseBillId = createDto.purchaseBillId || (createDto.type === PaymentType.PAYMENT && createDto.referenceId ? createDto.referenceId : undefined);

    let relatedAccountId: string | null = null;


    // Handle Linked Entities
    if (salesInvoiceId) {
        const invoice = await this.tenantPrisma.salesInvoice.findUnique({ where: { id: salesInvoiceId }});
        if (!invoice) throw new BadRequestException('Invoice not found');
        if (!company.accountsReceivableId) throw new BadRequestException('Company AR Account not set');
        
        relatedAccountId = company.accountsReceivableId;
        linkedEntityDescription = `Inv #${invoice.invoiceNumber}`;
        
         await this.tenantPrisma.salesInvoice.update({
            where: { id: invoice.id },
            data: { status: InvoiceStatus.PAID }
        });

    } else if (purchaseBillId) {
        const bill = await this.tenantPrisma.purchaseBill.findUnique({ where: { id: purchaseBillId }});
        if (!bill) throw new BadRequestException('Bill not found');
        if (!company.accountsPayableId) throw new BadRequestException('Company AP Account not set');
        
        relatedAccountId = company.accountsPayableId;
        linkedEntityDescription = `Bill #${bill.billNumber}`;

         await this.tenantPrisma.purchaseBill.update({
            where: { id: bill.id },
            data: { status: BillStatus.PAID }
        });

    } else if (createDto.contraAccountId) {
        // Direct Payment
        const contraAccount = await this.tenantPrisma.account.findUnique({ where: { id: createDto.contraAccountId }});
        if (!contraAccount) throw new BadRequestException('Contra Account not found');
        
        relatedAccountId = createDto.contraAccountId;
        linkedEntityDescription = contraAccount.name;
    } else {
        throw new BadRequestException('Payment requires a linked Invoice, Bill, or Contra Account');
    }

    // Determine Journal Lines based on Flow
    // RECEIPT (Money In)  => Debit Bank, Credit Related
    // PAYMENT (Money Out) => Credit Bank, Debit Related
    
    if (createDto.type === PaymentType.RECEIPT) {
        // Debit Bank
        journalLines.push({
            accountId: createDto.paymentAccountId,
            debit: createDto.amount,
            credit: 0,
            description: `Receipt ${createDto.paymentNumber}`
        });
        // Credit Related (AR, AP[Refund], Revenue)
        journalLines.push({
            accountId: relatedAccountId,
            debit: 0,
            credit: createDto.amount,
            description: `Receipt ${createDto.paymentNumber} - ${linkedEntityDescription}`
        });
    } else {
        // Debit Related (AP, AR[Refund], Expense)
        journalLines.push({
            accountId: relatedAccountId,
            debit: createDto.amount,
            credit: 0,
            description: `Payment ${createDto.paymentNumber} - ${linkedEntityDescription}`
        });
        // Credit Bank
        journalLines.push({
            accountId: createDto.paymentAccountId,
            debit: 0,
            credit: createDto.amount,
            description: `Payment ${createDto.paymentNumber}`
        });
    }

    // Create Journal
    const journal = await this.journalService.createJournal({
        date: createDto.date,
        description: `Payment ${createDto.paymentNumber} - ${linkedEntityDescription}`,
        reference: createDto.paymentNumber,
        lines: journalLines
    }, user);

    // Create Payment Record
    return this.tenantPrisma.payment.create({
        data: {
            companyId: company.id,
            paymentNumber: createDto.paymentNumber,
            date: createDto.date,
            amount: createDto.amount,
            type: createDto.type,
            reference: createDto.reference,
            journalId: journal.id,
            notes: createDto.notes,
            salesInvoiceId: salesInvoiceId,
            purchaseBillId: purchaseBillId
        }
    });
  }

  async delete(id: string, user: any) {
      const payment = await this.tenantPrisma.payment.findUnique({ where: { id } });
      if (!payment) throw new NotFoundException('Payment not found');

      // 1. Reverse Journal
      if (payment.journalId) {
          await this.journalService.reverseJournal(payment.journalId, user);
      }

      // 2. Revert Invoice/Bill Status (if linked)
      if (payment.salesInvoiceId) {
          await this.tenantPrisma.salesInvoice.update({
              where: { id: payment.salesInvoiceId },
              data: { status: InvoiceStatus.POSTED } // Revert to POSTED (Unpaid/Open)
          });
      }
      if (payment.purchaseBillId) {
          await this.tenantPrisma.purchaseBill.update({
              where: { id: payment.purchaseBillId },
              data: { status: BillStatus.POSTED }
          });
      }

      // 3. Delete Payment
      return this.tenantPrisma.payment.delete({ where: { id } });
  }

   async update(id: string, updateDto: UpdatePaymentDto, user: any) {
       // Simplest Approach: Reverse & Re-create
       // This ensures accounting integrity.
       
       // 1. Delete (Reverse old journal)
       await this.delete(id, user);

       // 2. Create New
       // We reuse the old ID? No, 'delete' removes the record.
       // If we want to keep the same ID, we should soft-delete or handle it differently.
       // But creating a new payment is cleaner for audit trail of the *journal*.
       // However, from UX perspective, the ID changes? 
       // User doesn't care about ID (UUID). But if they linked to it...
       // For now, let's create new.
       
       return this.create(updateDto as CreatePaymentDto, user);
   }

   async findAll(query: any = {}) {
       const { search, limit = 50, offset = 0 } = query;
       const where: any = {};
       if (search) {
           where.paymentNumber = { contains: search, mode: 'insensitive' };
       }

       const [payments, total] = await Promise.all([
           this.tenantPrisma.payment.findMany({
               where,
               take: Number(limit),
               skip: Number(offset),
               orderBy: { date: 'desc' },
               include: { 
                   salesInvoice: true,
                   purchaseBill: true
                   // Relation 'journal' is causing issues despite regeneration.
                   // Fetching manually below.
               }
           }),
           this.tenantPrisma.payment.count({ where })
       ]);

       // Manual Join for Journals
       const journalIds = payments.map(p => p.journalId).filter(Boolean) as string[];
       let journals: any[] = [];
       
       if (journalIds.length > 0) {
           journals = await this.tenantPrisma.journal.findMany({
              where: { id: { in: journalIds } },
              include: { journalLines: true }
          });
      }

      const data = payments.map(p => {
          const journal = journals.find(j => j.id === p.journalId);
          return { ...p, journal };
      });

      return { data, total, limit, offset };
  }
}

