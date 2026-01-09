import { Controller, Get, Post, Body, UseGuards, Query, Delete, Patch, Param } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller(':tenantSlug/payments')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  create(@Body() createDto: CreatePaymentDto, @CurrentUser() user: any) {
    return this.paymentService.create(createDto, user);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.paymentService.findAll(query);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.paymentService.delete(id, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdatePaymentDto, @CurrentUser() user: any) {
    return this.paymentService.update(id, updateDto, user);
  }
}
