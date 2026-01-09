import { IsEnum, IsNotEmpty } from 'class-validator';

export enum CompanyRole {
  ADMIN = 'ADMIN',
  FINANCE = 'FINANCE',
  ACCOUNTANT = 'ACCOUNTANT',
  AUDITOR = 'AUDITOR',
}

export class UpdateCompanyUserDto {
  @IsNotEmpty()
  @IsEnum(CompanyRole)
  role: string;
}
