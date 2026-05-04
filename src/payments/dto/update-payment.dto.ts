import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod, PaymentStatus, PaymentType } from '@prisma/client';

export class UpdatePaymentDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsEnum(PaymentType)
  paymentType?: PaymentType;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

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
