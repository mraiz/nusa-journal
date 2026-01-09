import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Req } from '@nestjs/common';
import { PurchaseBillService } from './purchase-bill.service';
import { CreatePurchaseBillDto } from './dto/create-purchase-bill.dto';
import { UpdatePurchaseBillDto } from './dto/update-purchase-bill.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller(':tenantSlug/purchase/bills')
@UseGuards(JwtAuthGuard)
export class PurchaseBillController {
  constructor(private readonly purchaseBillService: PurchaseBillService) {}

  @Post()
  create(@Body() createDto: CreatePurchaseBillDto) {
    return this.purchaseBillService.create(createDto);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.purchaseBillService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.purchaseBillService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdatePurchaseBillDto) {
    return this.purchaseBillService.update(id, updateDto);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @CurrentUser() user: any) {
    return this.purchaseBillService.approve(id, user);
  }
}

