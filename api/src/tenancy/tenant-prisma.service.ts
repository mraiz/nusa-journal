import { Injectable, Inject, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { PrismaClient } from '@prisma/client';

/**
 * Request-scoped Prisma service that provides access to tenant-specific database
 * This replaces the global PrismaService for tenant-aware operations
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantPrismaService {
  private readonly prisma: PrismaClient;
  public readonly tenantSlug: string;

  constructor(@Inject(REQUEST) private request: Request) {
    const req = request as any;
    this.prisma = req.tenantPrisma;
    this.tenantSlug = req.tenantSlug;

    if (!this.prisma) {
      throw new Error('Tenant Prisma client not found in request. Ensure TenantMiddleware is applied.');
    }
  }

  /**
   * Get the underlying Prisma client
   */
  get client(): PrismaClient {
    return this.prisma;
  }

  // Proxy all Prisma model accessors
  get user() {
    return this.prisma.user;
  }

  get company() {
    return this.prisma.company;
  }

  get companyUser() {
    return this.prisma.companyUser;
  }

  get account() {
    return this.prisma.account;
  }

  get accountingPeriod() {
    return this.prisma.accountingPeriod;
  }

  get journal() {
    return this.prisma.journal;
  }

  get journalLine() {
    return this.prisma.journalLine;
  }

  get exchangeRate() {
    return this.prisma.exchangeRate;
  }

  get customer() {
    return this.prisma.customer;
  }

  get vendor() {
    return this.prisma.vendor;
  }

  get product() {
    return this.prisma.product;
  }

  get tax() {
    return this.prisma.tax;
  }

  get salesInvoice() {
    return this.prisma.salesInvoice;
  }

  get salesInvoiceLine() {
    return this.prisma.salesInvoiceLine;
  }

  get purchaseBill() {
    return this.prisma.purchaseBill;
  }

  get purchaseBillLine() {
    return this.prisma.purchaseBillLine;
  }

  get payment() {
    return this.prisma.payment;
  }

  get auditLog() {
    return this.prisma.auditLog;
  }
}
