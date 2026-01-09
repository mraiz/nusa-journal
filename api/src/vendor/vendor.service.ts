import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantPrismaService } from '../tenancy/tenant-prisma.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';

@Injectable()
export class VendorService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  async create(createVendorDto: CreateVendorDto) {
    const company = await this.tenantPrisma.checkCompany();
    return this.tenantPrisma.vendor.create({
      data: {
        ...createVendorDto,
        companyId: company.id,
      },
    });
  }

  async findAll(query: any = {}) {
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
      this.tenantPrisma.vendor.findMany({
        where,
        take: Number(limit),
        skip: Number(offset),
        orderBy: { name: 'asc' },
      }),
      this.tenantPrisma.vendor.count({ where }),
    ]);

    return { data, total, limit, offset };
  }

  async findOne(id: string) {
    const vendor = await this.tenantPrisma.vendor.findUnique({
      where: { id },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async update(id: string, updateVendorDto: UpdateVendorDto) {
    await this.findOne(id);
    return this.tenantPrisma.vendor.update({
      where: { id },
      data: updateVendorDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.tenantPrisma.vendor.delete({
      where: { id },
    });
  }
}

