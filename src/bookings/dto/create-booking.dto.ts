import { IsString, IsNotEmpty, IsNumber, IsOptional, IsInt, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsString()
  @IsNotEmpty()
  packageId: string;

  @IsOptional()
  @IsString()
  departureId?: string;

  @IsOptional()
  @IsDateString()
  departureDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  requestedSeats?: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  subtotal: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  sstRate: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  sstAmount: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalAmount: number;

  @IsOptional()
  @IsString()
  specialRequests?: string;
}
