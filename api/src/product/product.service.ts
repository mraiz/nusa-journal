import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TenantPrismaService } from '../tenancy/tenant-prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  async create(createProductDto: CreateProductDto) {
    try {
        console.log('Starting create product...');
        const company = await this.tenantPrisma.checkCompany();
        console.log('Company found:', company.id);
        
        return await this.tenantPrisma.product.create({
          data: {
            ...createProductDto,
            companyId: company.id,
          },
        });
    } catch (error: any) {
        console.error('Error creating product:', error);
        if (error.code === 'P2003') {
            throw new NotFoundException('Selected account not found');
        }
        // DEBUG: Return actual error message to client
        throw new BadRequestException(`Failed to create product: ${error.message}`);
    }
  }

  async findAll(query: any = {}) {
    const { search, limit = 50, offset = 0 } = query;
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.tenantPrisma.product.findMany({
        where,
        take: Number(limit),
        skip: Number(offset),
        orderBy: { name: 'asc' },
        include: {
          salesAccount: { select: { id: true, code: true, name: true } },
          purchaseAccount: { select: { id: true, code: true, name: true } },
        }
      }),
      this.tenantPrisma.product.count({ where }),
    ]);

    return { data, total, limit, offset };
  }

  async findOne(id: string) {
    const product = await this.tenantPrisma.product.findUnique({
      where: { id },
      include: {
        salesAccount: { select: { id: true, code: true, name: true } },
        purchaseAccount: { select: { id: true, code: true, name: true } },
      }
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    await this.findOne(id);
    return this.tenantPrisma.product.update({
      where: { id },
      data: updateProductDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.tenantPrisma.product.delete({
      where: { id },
    });
  }
}

