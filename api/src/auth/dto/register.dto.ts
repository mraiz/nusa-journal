import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @MinLength(8)
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password!: string;

  @IsString()
  @IsOptional()
  companySlug?: string;
}
