import { IsString, IsNotEmpty, IsDate, IsNumber, IsOptional, ValidateNested, IsUUID, IsArray, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePurchaseBillLineDto {
  @IsUUID()
  productId: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  unitPrice: number;
}

export class CreatePurchaseBillDto {
  @IsUUID()
  vendorId: string;

  @IsString()
  @IsNotEmpty()
  billNumber: string;

  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  dueDate?: Date;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseBillLineDto)
  lines: CreatePurchaseBillLineDto[];
}
