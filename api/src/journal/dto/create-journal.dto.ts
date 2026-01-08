import { IsString, IsNotEmpty, IsDate, IsOptional, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class JournalLineDto {
  @IsString()
  @IsNotEmpty()
  accountId!: string;

  @IsNotEmpty()
  debit!: number | string;  // Accept both number and string, convert to Decimal

  @IsNotEmpty()
  credit!: number | string; // Accept both number and string, convert to Decimal

  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateJournalDto {
  @IsDate()
  @Type(() => Date)
  date!: Date;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(2, { message: 'Journal must have at least 2 lines (debit and credit)' })
  @Type(() => JournalLineDto)
  lines!: JournalLineDto[];
}
