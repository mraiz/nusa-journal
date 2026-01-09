import { IsString, IsNotEmpty, IsDate, IsNumber, IsOptional, IsEnum, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentType } from '@prisma/client';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  paymentNumber: string;

  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsEnum(PaymentType)
  type: PaymentType;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount: number;

  @IsUUID()
  paymentAccountId: string; // Cash/Bank Account to Debit/Credit

  @IsOptional()
  @IsString()
  reference?: string; // e.g., Invoice Number or free text

  @IsOptional()
  @IsUUID()
  referenceId?: string; // Link to Invoice ID or Bill ID

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID()
  salesInvoiceId?: string;

  @IsOptional()
  @IsUUID()
  purchaseBillId?: string;

  @IsOptional()
  @IsUUID()
  contraAccountId?: string; // For direct payments (no invoice/bill)
}
