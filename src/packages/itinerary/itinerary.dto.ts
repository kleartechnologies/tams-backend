import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

export class CreateItineraryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  dayNumber: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}

export class UpdateItineraryDto extends PartialType(CreateItineraryDto) {}
