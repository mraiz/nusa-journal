import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { TenantPrismaService } from '../../tenancy/tenant-prisma.service';
import { CreateSalesInvoiceDto } from './dto/create-sales-invoice.dto';
import { JournalService } from '../../journal/journal.service';
import { CreateJournalDto } from '../../journal/dto/create-journal.dto';
import { InvoiceStatus } from '@prisma/client';
import Decimal from 'decimal.js';

@Injectable()
export class SalesInvoiceService {
  private readonly logger = new Logger(SalesInvoiceService.name);

  constructor(
    private readonly tenantPrisma: TenantPrismaService,
    private readonly journalService: JournalService,
  ) {}

  async create(createDto: CreateSalesInvoiceDto) {
    const company = await this.tenantPrisma.checkCompany();

    // Calculate totals
    let subtotal = new Decimal(0);
    const lines = createDto.lines.map(l => {
        const amount = new Decimal(l.quantity).mul(l.unitPrice);
        subtotal = subtotal.add(amount);
        return {
            productId: l.productId,
            description: l.description,
            quantity: new Decimal(l.quantity),
            unitPrice: new Decimal(l.unitPrice),
            amount: amount,
        };
    });

    const taxAmount = new Decimal(0); // TODO: Implement Tax logic
    const total = subtotal.add(taxAmount);

    return this.tenantPrisma.salesInvoice.create({
      data: {
        companyId: company.id,
        customerId: createDto.customerId,
        invoiceNumber: createDto.invoiceNumber,
        date: createDto.date,
        dueDate: createDto.dueDate,
        notes: createDto.notes,
        subtotal: subtotal,
        taxAmount: taxAmount,
        total: total,
        status: InvoiceStatus.DRAFT,
        lines: {
            create: lines
        }
      },
      include: { lines: true, customer: true }
    });
  }

  async findAll(query: any = {}) {
     const { search, limit = 50, offset = 0 } = query;
     const where: any = {};
     if (search) {
         where.invoiceNumber = { contains: search, mode: 'insensitive' };
     }
     if (query.status) {
         where.status = query.status;
     }

     const [data, total] = await Promise.all([
         this.tenantPrisma.salesInvoice.findMany({
             where,
             take: Number(limit),
             skip: Number(offset),
             orderBy: { date: 'desc' },
             include: { customer: { select: { name: true } } }
         }),
         this.tenantPrisma.salesInvoice.count({ where })
     ]);
     return { data, total, limit, offset };
  }

  async findOne(id: string) {
      const invoice = await this.tenantPrisma.salesInvoice.findUnique({
          where: { id },
          include: { lines: { include: { product: true } }, customer: true }
      });
      if (!invoice) throw new NotFoundException('Invoice not found');
      return invoice;
  }

  async approve(id: string, user: any) {
      const invoice = await this.findOne(id);
      if (invoice.status !== InvoiceStatus.DRAFT) {
          throw new BadRequestException('Only DRAFT invoices can be approved');
      }

      const company = await this.tenantPrisma.checkCompany();
      if (!company.accountsReceivableId) {
          throw new BadRequestException('Company Accounts Receivable is not configured');
      }

      // Prepare Journal
      // Debit: AR
      // Credit: Revenue (per product)
      
      const journalLines: any[] = [];

      // 1. Debit AR (Total Amount)
      journalLines.push({
          accountId: company.accountsReceivableId,
          debit: Number(invoice.total),
          credit: 0,
          description: `Invoice #${invoice.invoiceNumber} - ${invoice.customer.name}`
      });

      // 2. Credit Revenue (Group by product's sales account)
      for (const line of invoice.lines) {
          if (!line.product.salesAccountId) {
              throw new BadRequestException(`Product ${line.product.name} does not have a Sales Account mapped`);
          }
          
          journalLines.push({
              accountId: line.product.salesAccountId,
              debit: 0,
              credit: Number(line.amount),
              description: line.description
          });
      }

      // Check balance (simple check)
      const totalDebit = journalLines.reduce((sum, l) => sum + l.debit, 0);
      const totalCredit = journalLines.reduce((sum, l) => sum + l.credit, 0);

      // TODO: Handle rounding diffs if any

      // Create Journal
      const journal = await this.journalService.createJournal({
          date: invoice.date,
          description: `Sales Invoice #${invoice.invoiceNumber}`,
          reference: invoice.invoiceNumber,
          lines: journalLines
      }, user);

      // Update Invoice
      return this.tenantPrisma.salesInvoice.update({
          where: { id },
          data: {
              status: InvoiceStatus.POSTED,
              journalId: journal.id
          },
          include: { lines: true, customer: true }
      });
  }

  async update(id: string, updateDto: Partial<CreateSalesInvoiceDto>) {
      const invoice = await this.findOne(id);
      if (invoice.status !== InvoiceStatus.DRAFT) {
          throw new BadRequestException('Only DRAFT invoices can be edited');
      }

      const company = await this.tenantPrisma.checkCompany();

      // Delete existing lines
      await this.tenantPrisma.salesInvoiceLine.deleteMany({
          where: { invoiceId: id }
      });

      // Calculate new totals if lines provided
      let subtotal = new Decimal(0);
      let lines: any[] = [];
      
      if (updateDto.lines && updateDto.lines.length > 0) {
          lines = updateDto.lines.map(l => {
              const amount = new Decimal(l.quantity).mul(l.unitPrice);
              subtotal = subtotal.add(amount);
              return {
                  productId: l.productId,
                  description: l.description,
                  quantity: new Decimal(l.quantity),
                  unitPrice: new Decimal(l.unitPrice),
                  amount: amount,
              };
          });
      }

      const taxAmount = new Decimal(0);
      const total = subtotal.add(taxAmount);

      return this.tenantPrisma.salesInvoice.update({
          where: { id },
          data: {
              customerId: updateDto.customerId ?? invoice.customerId,
              invoiceNumber: updateDto.invoiceNumber ?? invoice.invoiceNumber,
              date: updateDto.date ?? invoice.date,
              dueDate: updateDto.dueDate ?? invoice.dueDate,
              notes: updateDto.notes ?? invoice.notes,
              subtotal: subtotal.isZero() ? invoice.subtotal : subtotal,
              taxAmount: taxAmount,
              total: total.isZero() ? invoice.total : total,
              lines: {
                  create: lines
              }
          },
          include: { lines: true, customer: true }
      });
  }
}

