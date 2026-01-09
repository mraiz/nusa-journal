import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Req } from '@nestjs/common';
import { SalesInvoiceService } from './sales-invoice.service';
import { CreateSalesInvoiceDto } from './dto/create-sales-invoice.dto';
import { UpdateSalesInvoiceDto } from './dto/update-sales-invoice.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller(':tenantSlug/sales/invoices')
@UseGuards(JwtAuthGuard)
export class SalesInvoiceController {
  constructor(private readonly salesInvoiceService: SalesInvoiceService) {}

  @Post()
  create(@Body() createDto: CreateSalesInvoiceDto) {
    return this.salesInvoiceService.create(createDto);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.salesInvoiceService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.salesInvoiceService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateSalesInvoiceDto) {
    return this.salesInvoiceService.update(id, updateDto);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @CurrentUser() user: any) {
    return this.salesInvoiceService.approve(id, user);
  }
}

