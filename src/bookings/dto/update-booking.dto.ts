import { IsOptional, IsEnum, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { BookingStatus } from '@prisma/client';

export class UpdateBookingDto {
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalAmount?: number;

  @IsOptional()
  @IsString()
  specialRequests?: string;
}
