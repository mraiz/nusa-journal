import { IsString, IsOptional, IsEmail, IsBoolean } from 'class-validator';

export class CreateVendorDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
