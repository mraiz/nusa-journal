import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { TenantPrismaService } from '../tenancy/tenant-prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AccountType } from '@prisma/client';

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(private tenantPrisma: TenantPrismaService) {}

  /**
   * Create new account with hierarchy validation
   */
  async createAccount(dto: CreateAccountDto) {
    const company = await this.tenantPrisma.company.findFirst();
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Check if account code already exists
    const existing = await this.tenantPrisma.account.findFirst({
      where: {
        companyId: company.id,
        code: dto.code,
      },
    });

    if (existing) {
      throw new ConflictException(`Account with code '${dto.code}' already exists`);
    }

    // Validate parent account if provided
    if (dto.parentId) {
      const parent = await this.tenantPrisma.account.findUnique({
        where: { id: dto.parentId },
      });

      if (!parent) {
        throw new NotFoundException('Parent account not found');
      }

      // Validate parent account type matches child
      if (parent.type !== dto.type) {
        throw new BadRequestException(
          `Parent account type (${parent.type}) must match child account type (${dto.type})`
        );
      }

      // Prevent creating child under locked parent
      if (parent.isLocked) {
        throw new BadRequestException('Cannot create account under locked parent');
      }
    }

    // Create account
    const account = await this.tenantPrisma.account.create({
      data: {
        companyId: company.id,
        code: dto.code,
        name: dto.name,
        description: dto.description,
        type: dto.type,
        classification: dto.classification,
        isPosting: dto.isPosting,
        parentId: dto.parentId,
      },
      include: {
        parent: true,
        _count: {
          select: { children: true },
        },
      },
    });

    this.logger.log(`Account created: ${account.code} - ${account.name}`);

    return {
      id: account.id,
      code: account.code,
      name: account.name,
      type: account.type,
      parentId: account.parentId,
      parent: account.parent ? {
        id: account.parent.id,
        code: account.parent.code,
        name: account.parent.name,
      } : null,
      classification: account.classification,
      isPosting: account.isPosting,
      isLocked: account.isLocked,
      childrenCount: account._count.children,
      createdAt: account.createdAt,
    };
  }

  /**
   * Get all accounts with hierarchy
   */
  /**
   * Get all accounts with hierarchy (Paged)
   */
  async getAccounts(query: import('./dto/get-accounts.dto').GetAccountsDto) {
    const company = await this.tenantPrisma.company.findFirst();
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const { page = 1, limit = 10, search, type } = query;
    const skip = (page - 1) * limit;

    const where: any = { companyId: company.id };
    
    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Count
    const total = await this.tenantPrisma.account.count({ where });

    // Fetch
    const accounts = await this.tenantPrisma.account.findMany({
      where,
      include: {
        parent: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        _count: {
          select: { children: true },
        },
      },
      orderBy: [
        { type: 'asc' },
        { code: 'asc' },
      ],
      skip,
      take: Number(limit),
    });

    const data = accounts.map(account => ({
      id: account.id,
      code: account.code,
      name: account.name,
      type: account.type,
      parentId: account.parentId,
      parent: account.parent,
      classification: account.classification,
      isPosting: account.isPosting,
      isLocked: account.isLocked,
      childrenCount: account._count.children,
      createdAt: account.createdAt,
    }));

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
   * Get account by ID with full hierarchy path
   */
  async getAccount(id: string) {
    const account = await this.tenantPrisma.account.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          orderBy: { code: 'asc' },
        },
        _count: {
          select: {
            children: true,
            journalLines: true,
          },
        },
      },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // Build hierarchy path
    const hierarchyPath = await this.getHierarchyPath(account.id);

    return {
      id: account.id,
      code: account.code,
      name: account.name,
      type: account.type,
      classification: account.classification,
      description: account.description,
      isPosting: account.isPosting,
      parentId: account.parentId,
      parent: account.parent ? {
        id: account.parent.id,
        code: account.parent.code,
        name: account.parent.name,
      } : null,
      children: account.children.map(child => ({
        id: child.id,
        code: child.code,
        name: child.name,
        type: child.type,
        isLocked: child.isLocked,
      })),
      isLocked: account.isLocked,
      childrenCount: account._count.children,
      transactionCount: account._count.journalLines,
      hierarchyPath,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }

  /**
   * Update account (only name and description)
   */
  async updateAccount(id: string, dto: UpdateAccountDto) {
    const account = await this.tenantPrisma.account.findUnique({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    if (account.isLocked) {
      throw new BadRequestException('Cannot update locked account');
    }

    if (dto.code && dto.code !== account.code) {
      const existing = await this.tenantPrisma.account.findFirst({
        where: {
          code: dto.code,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException(`Account with code '${dto.code}' already exists`);
      }
    }

    const updated = await this.tenantPrisma.account.update({
      where: { id },
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        classification: dto.classification,
        isPosting: dto.isPosting,
      },
    });

    this.logger.log(`Account updated: ${updated.code} - ${updated.name}`);

    return {
      id: updated.id,
      code: updated.code,
      name: updated.name,
      type: updated.type,
      classification: updated.classification,
      description: updated.description,
      isPosting: updated.isPosting,
      isLocked: updated.isLocked,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * Lock account (prevent further changes and prevent journal postings)
   */
  async lockAccount(id: string) {
    const account = await this.tenantPrisma.account.findUnique({
      where: { id },
      include: {
        _count: {
          select: { children: true },
        },
      },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    if (account.isLocked) {
      throw new BadRequestException('Account is already locked');
    }

    // Lock account
    const locked = await this.tenantPrisma.account.update({
      where: { id },
      data: { isLocked: true },
    });

    this.logger.log(`Account locked: ${locked.code} - ${locked.name}`);

    return {
      id: locked.id,
      code: locked.code,
      name: locked.name,
      isLocked: locked.isLocked,
      message: 'Account locked successfully',
    };
  }

  /**
   * Unlock account
   */
  async unlockAccount(id: string) {
    const account = await this.tenantPrisma.account.findUnique({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    if (!account.isLocked) {
      throw new BadRequestException('Account is not locked');
    }

    const unlocked = await this.tenantPrisma.account.update({
      where: { id },
      data: { isLocked: false },
    });

    this.logger.log(`Account unlocked: ${unlocked.code} - ${unlocked.name}`);

    return {
      id: unlocked.id,
      code: unlocked.code,
      name: unlocked.name,
      isLocked: unlocked.isLocked,
      message: 'Account unlocked successfully',
    };
  }

  /**
   * Delete account (only if not used in journals)
   */
  async deleteAccount(id: string) {
    const account = await this.tenantPrisma.account.findUnique({
      where: { id },
      include: {
        journalLines: { take: 1 },
        children: { take: 1 },
      },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // Check if account has journal entries
    if (account.journalLines && account.journalLines.length > 0) {
      throw new BadRequestException('Cannot delete account with journal entries. Consider locking it instead.');
    }

    // Check if account has children
    if (account.children && account.children.length > 0) {
      throw new BadRequestException('Cannot delete account with child accounts. Delete children first.');
    }

    await this.tenantPrisma.account.delete({
      where: { id },
    });

    this.logger.log(`Account deleted: ${account.code} - ${account.name}`);

    return {
      id: account.id,
      code: account.code,
      name: account.name,
      message: 'Account deleted successfully',
    };
  }

  /**
   * Get account hierarchy tree (for UI display)
   */
  async getAccountTree(type?: AccountType) {
    const company = await this.tenantPrisma.company.findFirst();
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const where: any = { companyId: company.id };
    if (type) {
      where.type = type;
    }

    const accounts = await this.tenantPrisma.account.findMany({
      where,
      include: {
        children: {
          include: {
            children: {
              include: {
                children: true, // Support up to 4 levels
              },
            },
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    // Filter to get only root accounts (no parent)
    const rootAccounts = accounts.filter(a => !a.parentId);

    return this.buildTree(rootAccounts);
  }

  /**
   * Build hierarchy path for an account
   */
  private async getHierarchyPath(accountId: string): Promise<string[]> {
    const path: string[] = [];
    let currentId: string | null = accountId;

    while (currentId) {
      const account: { code: string; name: string; parentId: string | null } | null = 
        await this.tenantPrisma.account.findUnique({
          where: { id: currentId },
          select: { code: true, name: true, parentId: true },
        });

      if (!account) break;

      path.unshift(`${account.code} - ${account.name}`);
      currentId = account.parentId;
    }

    return path;
  }

  /**
   * Build tree structure recursively
   */
  private buildTree(accounts: any[]): any[] {
    return accounts.map(account => ({
      id: account.id,
      code: account.code,
      name: account.name,
      description: account.description,
      type: account.type,
      classification: account.classification,
      isPosting: account.isPosting,
      isLocked: account.isLocked,
      children: account.children ? this.buildTree(account.children) : [],
    }));
  }
}
