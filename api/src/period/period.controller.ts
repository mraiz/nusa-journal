import { GetPeriodsDto } from './dto/get-periods.dto';
import { Controller, UseGuards, Patch, Delete, Get, Param, HttpCode, HttpStatus, ValidationPipe, Query } from '@nestjs/common';
import { PeriodService } from './period.service';
import { CreatePeriodDto } from './dto/create-period.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller(':tenantSlug/periods')
@UseGuards(JwtAuthGuard)
export class PeriodController {
  constructor(private readonly periodService: PeriodService) {}

  // ... createPeriod ...

  /**
   * Get all periods with filters
   */
  @Get()
  async getPeriods(@Query() query: GetPeriodsDto) {
    return this.periodService.getPeriods(query);
  }

  /**
   * Get period by ID
   */
  @Get(':id')
  async getPeriod(@Param('id') id: string) {
    return this.periodService.getPeriod(id);
  }

  /**
   * Close period (Admin only)
   */
  @Patch(':id/close')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async closePeriod(@Param('id') id: string) {
    return this.periodService.closePeriod(id);
  }

  /**
   * Reopen period (Admin only)
   */
  @Patch(':id/reopen')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async reopenPeriod(@Param('id') id: string) {
    return this.periodService.reopenPeriod(id);
  }

  /**
   * Delete period (Admin only, only if no journals)
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async deletePeriod(@Param('id') id: string) {
    return this.periodService.deletePeriod(id);
  }
}
