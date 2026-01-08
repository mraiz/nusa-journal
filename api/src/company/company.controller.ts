import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  /**
   * Create new company (no tenant context needed)
   */
  @Post('companies')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createCompany(
    @CurrentUser() user: any,
    @Body(ValidationPipe) dto: CreateCompanyDto,
  ) {
    // Get user details from JWT (set by auth guard)
    const userId = user.userId;
    const userEmail = user.email; // We need to add email to JWT payload
    const userName = user.name;   // We need to add name to JWT payload

    return this.companyService.createCompany(userId, userEmail, userName, dto);
  }

  /**
   * Get all companies user belongs to (no tenant context needed)
   */
  @Get('companies')
  @UseGuards(JwtAuthGuard)
  async getUserCompanies(@CurrentUser() user: any) {
    return this.companyService.getUserCompanies(user.userId, user.email);
  }

  /**
   * Get current company details (tenant-scoped)
   */
  @Get(':tenantSlug/company')
  @UseGuards(JwtAuthGuard)
  async getCompany(@Param('tenantSlug') tenantSlug: string) {
    return this.companyService.getCompany(tenantSlug);
  }

  /**
   * Invite user to company (tenant-scoped, Admin only)
   */
  @Post(':tenantSlug/company/invite')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'FINANCE', 'ACCOUNTANT', 'AUDITOR')
  @HttpCode(HttpStatus.OK)
  async inviteUser(
    @Param('tenantSlug') tenantSlug: string,
    @Body(ValidationPipe) dto: InviteUserDto,
    @CurrentUser() user: any,
  ) {
    // Check if current user is ADMIN
    const isAdmin = user.roles && user.roles.includes('ADMIN');
    const targetStatus = isAdmin ? 'APPROVED' : 'PENDING';
    
    return this.companyService.inviteUser(tenantSlug, dto, user.userId, targetStatus);
  }

  /**
   * Approve user to join company (tenant-scoped, Admin only)
   */
  @Post(':tenantSlug/company/approve/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async approveUser(
    @Param('tenantSlug') tenantSlug: string,
    @Param('userId') userId: string,
  ) {
    return this.companyService.approveUser(tenantSlug, userId);
  }

  /**
   * Remove user from company (tenant-scoped, Admin only)
   */
  @Delete(':tenantSlug/company/users/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async removeUser(
    @Param('tenantSlug') tenantSlug: string,
    @Param('userId') userId: string,
  ) {
    return this.companyService.removeUser(tenantSlug, userId);
  }

  /**
   * Get all users in company (tenant-scoped)
   */
  @Get(':tenantSlug/company/users')
  @UseGuards(JwtAuthGuard)
  async getCompanyUsers(@Param('tenantSlug') tenantSlug: string) {
    return this.companyService.getCompanyUsers(tenantSlug);
  }
}
