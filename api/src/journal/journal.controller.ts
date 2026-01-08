import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { JournalService } from './journal.service';
import { CreateJournalDto } from './dto/create-journal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller(':tenantSlug/journals')
@UseGuards(JwtAuthGuard)
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

  /**
   * Create journal (Accountant/Finance only)
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ACCOUNTANT', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  async createJournal(
    @Body(ValidationPipe) dto: CreateJournalDto,
    @CurrentUser() user: any,
  ) {
    return this.journalService.createJournal(dto, { id: user.userId, email: user.email });
  }

  /**
   * Get journals with optional filters
   */
  @Get()
  async getJournals(@Query() query: import('./dto/get-journals.dto').GetJournalsDto) {
    return this.journalService.getJournals(query);
  }

  /**
   * Get journal by ID
   */
  @Get(':id')
  async getJournal(@Param('id') id: string) {
    return this.journalService.getJournal(id);
  }

  /**
   * Reverse journal (Accountant/Finance only)
   */
  @Post(':id/reverse')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ACCOUNTANT', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  async reverseJournal(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.journalService.reverseJournal(id, { id: user.userId, email: user.email });
  }
}
