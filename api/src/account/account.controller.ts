import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AccountType } from '@prisma/client';

@Controller(':tenantSlug/accounts')
@UseGuards(JwtAuthGuard)
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  /**
   * Create new account
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ACCOUNTANT')
  @HttpCode(HttpStatus.CREATED)
  async createAccount(@Body() dto: CreateAccountDto) {
    return this.accountService.createAccount(dto);
  }

  /**
   * Get all accounts (optionally filtered by type)
   */
  @Get()
  async getAccounts(@Query() query: import('./dto/get-accounts.dto').GetAccountsDto) {
    return this.accountService.getAccounts(query);
  }

  /**
   * Get account hierarchy tree
   */
  @Get('tree')
  async getAccountTree(@Query('type') type?: AccountType) {
    return this.accountService.getAccountTree(type);
  }

  /**
   * Get account by ID
   */
  @Get(':id')
  async getAccount(@Param('id') id: string) {
    return this.accountService.getAccount(id);
  }

  /**
   * Update account
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ACCOUNTANT')
  @HttpCode(HttpStatus.OK)
  async updateAccount(
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.accountService.updateAccount(id, dto);
  }

  /**
   * Lock account
   */
  @Patch(':id/lock')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async lockAccount(@Param('id') id: string) {
    return this.accountService.lockAccount(id);
  }

  /**
   * Unlock account
   */
  @Patch(':id/unlock')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async unlockAccount(@Param('id') id: string) {
    return this.accountService.unlockAccount(id);
  }
}
