import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { TravelerType } from '@prisma/client';

export class CreateBookingTravelerDto {
  @IsOptional()
  @IsEnum(TravelerType)
  travelerType?: TravelerType;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  icNumber?: string;

  @IsOptional()
  @IsString()
  passportNumber?: string;

  @IsOptional()
  @IsString()
  nationality?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsDateString()
  passportExpiry?: string;

  @IsOptional()
  @IsString()
  mahramRelation?: string;

  @IsOptional()
  @IsString()
  roomType?: string;

  @IsOptional()
  @IsString()
  seatNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  customerId?: string;
}
