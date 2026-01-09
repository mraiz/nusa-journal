import { 
  Injectable, 
  BadRequestException, 
  NotFoundException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { RegistryPrismaService } from '../tenancy/registry-prisma.service';
import { PrismaClientManager } from '../tenancy/prisma-client-manager.service';
import { TenantProvisioningService } from '../tenancy/tenant-provisioning.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateCompanyUserDto } from './dto/update-company-user.dto';

@Injectable()
export class CompanyService {
  private readonly logger = new Logger(CompanyService.name);

  constructor(
    private registryPrisma: RegistryPrismaService,
    private prismaClientManager: PrismaClientManager,
    private provisioningService: TenantProvisioningService,
  ) {}

  /**
   * Create new company with automatic database provisioning
   */
  async createCompany(userId: string, userEmail: string, userName: string, dto: CreateCompanyDto) {
    // Auto-generate slug from name if not provided
    const slug = dto.slug || this.generateSlug(dto.name);

    // Validate slug uniqueness in registry
    const existingTenant = await this.registryPrisma.tenant.findUnique({
      where: { slug },
    });

    if (existingTenant) {
      throw new ConflictException(`Company with slug '${slug}' already exists`);
    }

    this.logger.log(`Creating company '${dto.name}' with slug '${slug}' for user ${userId}`);

    // Step 1: Provision tenant database
    const tenantId = await this.provisioningService.provisionTenant({
      slug,
      name: dto.name,
      plan: dto.plan || 'STARTER',
    });

    this.logger.log(`Tenant provisioned: ${tenantId}`);

    try {
      // Step 2: Get tenant Prisma client
      const tenantPrisma = await this.prismaClientManager.getClient(slug);

      // Step 3: Create company record in TENANT database
      const company = await tenantPrisma.company.create({
        data: {
          name: dto.name,
          slug,
        },
      });

      this.logger.log(`Company created in tenant DB: ${company.id}`);

      // Step 4: Create user record in TENANT database
      const tenantUser = await tenantPrisma.user.create({
        data: {
          email: userEmail,
          name: userName,
          password: '', // User already authenticated via registry, no password needed
        },
      });

      this.logger.log(`User created in tenant DB: ${tenantUser.id}`);

      // Step 5: Create CompanyUser relation with ADMIN role
      await tenantPrisma.companyUser.create({
        data: {
          userId: tenantUser.id,
          companyId: company.id,
          role: 'ADMIN',
          status: 'APPROVED',
        },
      });

      this.logger.log(`CompanyUser created with ADMIN role`);

      // Step 6: Return company details
      return {
        id: company.id,
        name: company.name,
        slug: company.slug,
        role: 'ADMIN',
        createdAt: company.createdAt,
      };
    } catch (error) {
      this.logger.error(`Failed to create company in tenant DB:`, error);
      
      // Cleanup: Mark tenant as suspended
      await this.registryPrisma.tenant.update({
        where: { id: tenantId },
        data: { status: 'SUSPENDED' },
      });

      throw new BadRequestException('Failed to create company. Please try again.');
    }
  }

  /**
   * Get all companies that user belongs to
   */
  async getUserCompanies(userId: string, userEmail: string) {
    // Find all tenants
    const tenants = await this.registryPrisma.tenant.findMany({
      where: { status: 'ACTIVE' },
    });

    const companies = [];

    // Check each tenant for user membership
    for (const tenant of tenants) {
      try {
        const tenantPrisma = await this.prismaClientManager.getClient(tenant.slug);

        // Find user by email in this tenant
        const user = await tenantPrisma.user.findUnique({
          where: { email: userEmail },
        });

        if (!user) continue;

        // Get user's company memberships
        const companyUsers = await tenantPrisma.companyUser.findMany({
          where: {
            userId: user.id,
            status: 'APPROVED',
          },
          include: {
            company: true,
          },
        });

        for (const cu of companyUsers) {
          companies.push({
            id: cu.company.id,
            name: cu.company.name,
            slug: cu.company.slug,
            role: cu.role,
            status: cu.status,
          });
        }
      } catch (error) {
        this.logger.warn(`Failed to check tenant ${tenant.slug}:`, error);
        continue;
      }
    }

    return companies;
  }

  /**
   * Get company details (tenant-scoped)
   */
  async getCompany(tenantSlug: string) {
    const tenantPrisma = await this.prismaClientManager.getClient(tenantSlug);

    const company = await tenantPrisma.company.findFirst({
      include: {
        accountsReceivable: { select: { id: true, code: true, name: true } },
        accountsPayable: { select: { id: true, code: true, name: true } },
      }
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }

  /**
   * Update company settings (AR/AP accounts)
   */
  async updateCompanySettings(tenantSlug: string, dto: { accountsReceivableId?: string; accountsPayableId?: string }) {
    const tenantPrisma = await this.prismaClientManager.getClient(tenantSlug);

    const company = await tenantPrisma.company.findFirst();
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const updated = await tenantPrisma.company.update({
      where: { id: company.id },
      data: {
        accountsReceivableId: dto.accountsReceivableId || null,
        accountsPayableId: dto.accountsPayableId || null,
      },
      include: {
        accountsReceivable: { select: { id: true, code: true, name: true } },
        accountsPayable: { select: { id: true, code: true, name: true } },
      }
    });

    this.logger.log(`Company settings updated for ${tenantSlug}`);

    return updated;
  }

  /**
   * Invite user to company
   */
  async inviteUser(tenantSlug: string, dto: InviteUserDto, invitedBy: string, targetStatus: 'PENDING' | 'APPROVED' = 'PENDING') {
    const tenantPrisma = await this.prismaClientManager.getClient(tenantSlug);

    // Get company
    const company = await tenantPrisma.company.findFirst();
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Check if user already exists in this tenant
    let user = await tenantPrisma.user.findUnique({
      where: { email: dto.email },
    });

    // If Direct Add (Admin), User MUST exist (or we decide logic).
    // User Requirement: "email yang dimaksud sudah terdaftar"
    if (targetStatus === 'APPROVED' && !user) {
        // Option 1: Error if not found
        // Option 2: Check Registry? But we are in Tenant Context.
        // If "sudah terdaftar" means in the App (Registry), we should check Registry.
        // But for now, let's assume they mean "Registered in the System".
        // Accessing Registry from here is possible via `registryPrisma`.
        const registryUser = await (this.registryPrisma as any).user.findUnique({ where: { email : dto.email }});
        
        if (!registryUser) {
             throw new NotFoundException(`User with email ${dto.email} not found in system.`);
        }

        // If found in registry but not tenant, CREATE in tenant
        user = await tenantPrisma.user.create({
            data: {
                id: registryUser.id, // Keep same ID for consistency if possible? 
                // Wait, Tenant User ID might differ from Registry ID ideally not, but Tenant Isolation usually implies separate IDs or synced IDs.
                // In my `createCompany`, I created Tenant User. I didn't enforce ID sync.
                // Let's look at `createCompany`: `tenantPrisma.user.create`. ID is UUID.
                // So Tenant User ID != Registry User ID usually.
                // But for simplicity in authentication, `JwtStrategy` uses Registry ID?
                // Wait, `JwtStrategy` verifies against `prisma.user` (Registry/Global).
                // So Tenant DB `User` table is mostly for relational integrity (Foreign Keys).
                // It should sync email/name.
                email: registryUser.email,
                name: registryUser.name,
                password: '',
            }
        });
    }

    // If user doesn't exist (and not direct add OR direct add failed check above which throws), create them
    if (!user) {
      user = await tenantPrisma.user.create({
        data: {
          email: dto.email,
          name: dto.email.split('@')[0], 
          password: '', 
        },
      });
    }

    // Check if already member
    const existing = await tenantPrisma.companyUser.findUnique({
      where: {
        userId_companyId: {
          userId: user.id,
          companyId: company.id,
        },
      },
    });

    if (existing) {
      throw new ConflictException('User already invited or is a member');
    }

    // Create invitation / membership
    const companyUser = await tenantPrisma.companyUser.create({
      data: {
        userId: user.id,
        companyId: company.id,
        role: dto.role,
        status: targetStatus,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    this.logger.log(`User ${dto.email} added to ${tenantSlug} as ${dto.role} with status ${targetStatus}`);

    return {
      userId: user.id,
      email: user.email,
      role: companyUser.role,
      status: companyUser.status,
    };
  }

  /**
   * Approve user to join company
   */
  async approveUser(tenantSlug: string, userId: string) {
    const tenantPrisma = await this.prismaClientManager.getClient(tenantSlug);

    const company = await tenantPrisma.company.findFirst();
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const companyUser = await tenantPrisma.companyUser.findUnique({
      where: {
        userId_companyId: {
          userId,
          companyId: company.id,
        },
      },
    });

    if (!companyUser) {
      throw new NotFoundException('User invitation not found');
    }

    if (companyUser.status === 'APPROVED') {
      throw new BadRequestException('User already approved');
    }

    // Approve user
    const updated = await tenantPrisma.companyUser.update({
      where: {
        userId_companyId: {
          userId,
          companyId: company.id,
        },
      },
      data: {
        status: 'APPROVED',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    this.logger.log(`User ${updated.user.email} approved for ${tenantSlug}`);

    return {
      userId: updated.userId,
      email: updated.user.email,
      role: updated.role,
      status: updated.status,
    };
  }

  /**
   * Remove user from company
   */
  async removeUser(tenantSlug: string, userId: string) {
    const tenantPrisma = await this.prismaClientManager.getClient(tenantSlug);

    const company = await tenantPrisma.company.findFirst();
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const companyUser = await tenantPrisma.companyUser.findUnique({
      where: {
        userId_companyId: {
          userId,
          companyId: company.id,
        },
      },
    });

    if (!companyUser) {
      throw new NotFoundException('User not found in company');
    }

    // Soft delete
    await tenantPrisma.companyUser.update({
      where: {
        userId_companyId: {
          userId,
          companyId: company.id,
        },
      },
      data: {
        status: 'REJECTED',
      },
    });

    this.logger.log(`User ${userId} removed from ${tenantSlug}`);

    return { message: 'User removed successfully' };
  }

  /**
   * Update user role
   */
  async updateUserRole(tenantSlug: string, userId: string, dto: UpdateCompanyUserDto) {
    const tenantPrisma = await this.prismaClientManager.getClient(tenantSlug);

    const company = await tenantPrisma.company.findFirst();
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const companyUser = await tenantPrisma.companyUser.findUnique({
      where: {
        userId_companyId: {
          userId,
          companyId: company.id,
        },
      },
    });

    if (!companyUser) {
      throw new NotFoundException('User not found in company');
    }

    const updated = await tenantPrisma.companyUser.update({
      where: {
        userId_companyId: {
          userId,
          companyId: company.id,
        },
      },
      data: {
        role: dto.role as Role,
      },
      include: {
        user: { select: { email: true, name: true } }
      }
    }) as any; // Cast to any to avoid "Property 'user' does not exist" if inference fails

    this.logger.log(`User ${updated.user.email} role updated to ${dto.role} in ${tenantSlug}`);

    return {
      userId: updated.userId,
      role: updated.role,
    };
  }

  /**
   * Get all users in company
   */
  async getCompanyUsers(tenantSlug: string) {
    const tenantPrisma = await this.prismaClientManager.getClient(tenantSlug);

    const company = await tenantPrisma.company.findFirst();
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const users = await tenantPrisma.companyUser.findMany({
      where: {
        companyId: company.id,
        status: {
          in: ['APPROVED', 'PENDING'],
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users.map(cu => ({
      userId: cu.user.id,
      email: cu.user.email,
      name: cu.user.name,
      role: cu.role,
      status: cu.status,
      joinedAt: cu.createdAt,
    }));
  }

  /**
   * Generate URL-friendly slug from company name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  }
}
