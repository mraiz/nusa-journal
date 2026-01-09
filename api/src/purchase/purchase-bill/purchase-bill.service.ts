import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { TenantPrismaService } from '../../tenancy/tenant-prisma.service';
import { CreatePurchaseBillDto } from './dto/create-purchase-bill.dto';
import { JournalService } from '../../journal/journal.service';
import { CreateJournalDto } from '../../journal/dto/create-journal.dto';
import { BillStatus } from '@prisma/client';
import Decimal from 'decimal.js';

@Injectable()
export class PurchaseBillService {
  private readonly logger = new Logger(PurchaseBillService.name);

  constructor(
    private readonly tenantPrisma: TenantPrismaService,
    private readonly journalService: JournalService,
  ) {}

  async create(createDto: CreatePurchaseBillDto) {
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

    const taxAmount = new Decimal(0); 
    const total = subtotal.add(taxAmount);

    return this.tenantPrisma.purchaseBill.create({
      data: {
        companyId: company.id,
        vendorId: createDto.vendorId,
        billNumber: createDto.billNumber,
        date: createDto.date,
        dueDate: createDto.dueDate,
        notes: createDto.notes,
        subtotal: subtotal,
        taxAmount: taxAmount,
        total: total,
        status: BillStatus.DRAFT,
        lines: {
            create: lines
        }
      },
      include: { lines: true, vendor: true }
    });
  }

  async findAll(query: any = {}) {
     const { search, limit = 50, offset = 0 } = query;
     const where: any = {};
     if (search) {
         where.billNumber = { contains: search, mode: 'insensitive' };
     }
     if (query.status) {
         where.status = query.status;
     }

     const [data, total] = await Promise.all([
         this.tenantPrisma.purchaseBill.findMany({
             where,
             take: Number(limit),
             skip: Number(offset),
             orderBy: { date: 'desc' },
             include: { vendor: { select: { name: true } } }
         }),
         this.tenantPrisma.purchaseBill.count({ where })
     ]);
     return { data, total, limit, offset };
  }

  async findOne(id: string) {
      const bill = await this.tenantPrisma.purchaseBill.findUnique({
          where: { id },
          include: { lines: { include: { product: true } }, vendor: true }
      });
      if (!bill) throw new NotFoundException('Bill not found');
      return bill;
  }

  async approve(id: string, user: any) {
      const bill = await this.findOne(id);
      if (bill.status !== BillStatus.DRAFT) {
          throw new BadRequestException('Only DRAFT bills can be approved');
      }

      const company = await this.tenantPrisma.checkCompany();
      if (!company.accountsPayableId) {
          throw new BadRequestException('Company Accounts Payable is not configured');
      }

      // Prepare Journal
      // Debit: Expense / Asset (Group by product)
      // Credit: AP
      
      const journalLines: any[] = [];

      // 1. Debit Expense (Group by product's purchase account)
      for (const line of bill.lines) {
          if (!line.product.purchaseAccountId) {
              throw new BadRequestException(`Product ${line.product.name} does not have a Purchase/Expense Account mapped`);
          }
          
          journalLines.push({
              accountId: line.product.purchaseAccountId,
              debit: Number(line.amount),
              credit: 0,
              description: line.description
          });
      }

      // 2. Credit AP (Total Amount)
      journalLines.push({
          accountId: company.accountsPayableId,
          debit: 0,
          credit: Number(bill.total),
          description: `Bill #${bill.billNumber} - ${bill.vendor.name}`
      });

      // Create Journal
      const journal = await this.journalService.createJournal({
          date: bill.date,
          description: `Purchase Bill #${bill.billNumber}`,
          reference: bill.billNumber,
          lines: journalLines
      }, user);

      // Update Bill
      return this.tenantPrisma.purchaseBill.update({
          where: { id },
          data: {
              status: BillStatus.POSTED,
              journalId: journal.id
          },
          include: { lines: true, vendor: true }
      });
  }

  async update(id: string, updateDto: Partial<CreatePurchaseBillDto>) {
      const bill = await this.findOne(id);
      if (bill.status !== BillStatus.DRAFT) {
          throw new BadRequestException('Only DRAFT bills can be edited');
      }

      const company = await this.tenantPrisma.checkCompany();

      // Delete existing lines
      await this.tenantPrisma.purchaseBillLine.deleteMany({
          where: { billId: id }
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

      return this.tenantPrisma.purchaseBill.update({
          where: { id },
          data: {
              vendorId: updateDto.vendorId ?? bill.vendorId,
              billNumber: updateDto.billNumber ?? bill.billNumber,
              date: updateDto.date ?? bill.date,
              dueDate: updateDto.dueDate ?? bill.dueDate,
              notes: updateDto.notes ?? bill.notes,
              subtotal: subtotal.isZero() ? bill.subtotal : subtotal,
              taxAmount: taxAmount,
              total: total.isZero() ? bill.total : total,
              lines: {
                  create: lines
              }
          },
          include: { lines: true, vendor: true }
      });
  }
}

