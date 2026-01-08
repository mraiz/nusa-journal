import { IsString, IsEnum, IsOptional, MaxLength, Matches, IsBoolean } from 'class-validator';
import { AccountType } from '@prisma/client';

export class UpdateAccountDto {
  @IsString()
  @IsOptional()
  @Matches(/^[0-9]+$/, { message: 'Account code must contain only numbers' })
  @MaxLength(20)
  code?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  name?: string;

  @IsEnum(AccountType)
  @IsOptional()
  type?: AccountType;

  @IsString()
  @IsOptional()
  classification?: string;

  @IsBoolean()
  @IsOptional()
  isPosting?: boolean;

  @IsString()
  @IsOptional()
  parentId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
