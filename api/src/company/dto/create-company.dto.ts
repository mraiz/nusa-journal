import { IsString, IsNotEmpty, IsOptional, IsEnum, Matches, MaxLength } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsOptional()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens'
  })
  @MaxLength(50)
  slug?: string;

  @IsEnum(['STARTER', 'BUSINESS', 'ENTERPRISE'])
  @IsOptional()
  plan?: 'STARTER' | 'BUSINESS' | 'ENTERPRISE';
}
