import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantPrismaService } from '../tenancy/tenant-prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomerService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  async create(createCustomerDto: CreateCustomerDto) {
    const company = await this.tenantPrisma.checkCompany();
    return this.tenantPrisma.customer.create({
      data: {
        ...createCustomerDto,
        companyId: company.id,
      },
    });
  }

  async findAll(query: any = {}) {
    // Basic filtering support
    const { search, limit = 50, offset = 0 } = query;
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.tenantPrisma.customer.findMany({
        where,
        take: Number(limit),
        skip: Number(offset),
        orderBy: { name: 'asc' },
      }),
      this.tenantPrisma.customer.count({ where }),
    ]);

    return { data, total, limit, offset };
  }

  async findOne(id: string) {
    const customer = await this.tenantPrisma.customer.findUnique({
      where: { id },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto) {
    await this.findOne(id); // Ensure existence
    return this.tenantPrisma.customer.update({
      where: { id },
      data: updateCustomerDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    // Soft delete if related transactions exist?
    // For now, allow delete, Prisma will check constraints
    // Or just set isActive = false
    return this.tenantPrisma.customer.delete({
      where: { id },
    });
  }
}
