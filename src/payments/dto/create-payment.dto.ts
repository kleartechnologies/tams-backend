import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod, PaymentType } from '@prisma/client';

export class CreatePaymentDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsDateString()
  @IsNotEmpty()
  paymentDate: string;

  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @IsOptional()
  @IsString()
  receiptNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
