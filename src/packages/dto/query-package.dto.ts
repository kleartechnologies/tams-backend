import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PackageType } from '@prisma/client';

export class QueryPackageDto {
  @IsOptional()
  @IsEnum(PackageType)
  type?: PackageType;

  @IsOptional()
  @IsString()
  destination?: string;

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
