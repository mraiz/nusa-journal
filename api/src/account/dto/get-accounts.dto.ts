import { IsOptional, IsString, IsEnum } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { AccountType } from '@prisma/client';

export class GetAccountsDto extends PaginationQueryDto {
  // Optional filter by Type
  @IsOptional()
  @IsEnum(AccountType)
  type?: AccountType;
}
