import { IsOptional, IsNumberString } from 'class-validator';

export class GetPeriodsDto {
  @IsOptional()
  @IsNumberString()
  year?: string;
}
