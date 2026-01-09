import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum ProductType {
  GOODS = 'GOODS',
  SERVICE = 'SERVICE',
}

export class CreateProductDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(ProductType)
  type: ProductType;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @IsOptional()
  @IsString()
  salesAccountId?: string;

  @IsOptional()
  @IsString()
  purchaseAccountId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
