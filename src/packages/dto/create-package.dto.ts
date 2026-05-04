import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsInt,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PackageType } from '@prisma/client';

export class InclusionItemDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  value: string;
}

export class CreatePackageDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(PackageType)
  type: PackageType;

  @IsString()
  @IsNotEmpty()
  destination: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  days: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  nights: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  adultPrice: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  childPrice: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxCapacity?: number;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  isSSTApplicable?: boolean = false;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  sstRate?: number = 6;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InclusionItemDto)
  inclusions?: InclusionItemDto[];

  @IsOptional()
  @IsString()
  exclusions?: string;
}
