import { IsOptional, IsEnum, IsString, IsInt, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { BookingStatus } from '@prisma/client';

export class QueryBookingDto {
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  packageId?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
