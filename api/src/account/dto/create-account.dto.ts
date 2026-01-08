import { IsString, IsNotEmpty, IsEnum, IsOptional, MaxLength, Matches, IsBoolean } from 'class-validator';
import { AccountType } from '@prisma/client';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]+$/, {
    message: 'Account code must contain only numbers'
  })
  @MaxLength(20)
  code!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @IsEnum(AccountType)
  type!: AccountType;

  @IsString()
  classification!: string;

  @IsBoolean()
  isPosting!: boolean;

  @IsString()
  @IsOptional()
  parentId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
