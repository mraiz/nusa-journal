import { IsOptional, IsString } from 'class-validator';

export class UpdateCompanySettingsDto {
  @IsOptional()
  @IsString()
  accountsReceivableId?: string;

  @IsOptional()
  @IsString()
  accountsPayableId?: string;
}
